import { NextRequest, NextResponse } from 'next/server'
import { getApiUser } from '@/lib/supabase/get-user-api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TopicState = 'locked' | 'new' | 'learning' | 'review' | 'mastered'

interface TopicData {
  id: string
  module_id: string
  title: string
  display_order: number
  state: TopicState
  total_questions: number
  cards_seen: number
  cards_due: number
  lesson_count: number
  best_quiz_score: number | null
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { supabase, userId, error } = await getApiUser()
    if (error) return error

    const { slug } = await params

    // Fetch course by slug
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title')
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Verify enrollment
    const { data: userCourse } = await supabase
      .from('user_courses')
      .select('readiness_score, current_topic_id')
      .eq('user_id', userId)
      .eq('course_id', course.id)
      .maybeSingle()

    if (!userCourse) {
      return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 })
    }

    // Parallel fetch: modules, topics, questions, card states, lessons, assessments, attempts
    const [
      { data: modules },
      { data: topics },
      { data: allQuestions },
      { data: cardStates },
      { data: allLessons },
      { data: allAssessments },
      { data: userAttempts },
    ] = await Promise.all([
      supabase
        .from('modules')
        .select('id, title, description, weight_percent, display_order')
        .eq('course_id', course.id)
        .order('display_order', { ascending: true }),
      supabase
        .from('topics')
        .select('id, module_id, title, display_order')
        .eq('course_id', course.id)
        .order('display_order', { ascending: true }),
      supabase
        .from('questions')
        .select('id, topic_id')
        .eq('course_id', course.id)
        .eq('is_active', true),
      supabase
        .from('user_card_states')
        .select('question_id, topic_id, state, due_date')
        .eq('user_id', userId)
        .eq('course_id', course.id),
      supabase
        .from('lessons')
        .select('id, topic_id')
        .eq('course_id', course.id)
        .eq('is_active', true),
      supabase
        .from('assessments')
        .select('id, title, assessment_type, module_id, topic_id')
        .eq('course_id', course.id)
        .eq('is_active', true),
      supabase
        .from('assessment_attempts')
        .select('assessment_id, score_percent')
        .eq('user_id', userId)
        .not('completed_at', 'is', null),
    ])

    const now = new Date().toISOString()

    // ── Index data ───────────────────────────────────────────────

    // Questions per topic
    const questionCountByTopic: Record<string, number> = {}
    for (const q of allQuestions || []) {
      questionCountByTopic[q.topic_id] = (questionCountByTopic[q.topic_id] || 0) + 1
    }

    // Card states per topic
    const cardsByTopic: Record<string, any[]> = {}
    for (const cs of cardStates || []) {
      if (!cardsByTopic[cs.topic_id]) cardsByTopic[cs.topic_id] = []
      cardsByTopic[cs.topic_id].push(cs)
    }

    // Lessons per topic
    const lessonCountByTopic: Record<string, number> = {}
    for (const l of allLessons || []) {
      lessonCountByTopic[l.topic_id] = (lessonCountByTopic[l.topic_id] || 0) + 1
    }

    // Best scores per assessment
    const bestScores: Record<string, number> = {}
    const attemptCounts: Record<string, number> = {}
    for (const att of userAttempts || []) {
      const score = att.score_percent ?? 0
      attemptCounts[att.assessment_id] = (attemptCounts[att.assessment_id] || 0) + 1
      if (bestScores[att.assessment_id] === undefined || score > bestScores[att.assessment_id]) {
        bestScores[att.assessment_id] = score
      }
    }

    // ── Compute topic states ─────────────────────────────────────

    // Group topics by module for ordering
    const topicsByModule: Record<string, any[]> = {}
    for (const t of topics || []) {
      if (!topicsByModule[t.module_id]) topicsByModule[t.module_id] = []
      topicsByModule[t.module_id].push(t)
    }

    // Sort modules and get ordered module IDs
    const sortedModules = (modules || []).sort((a: any, b: any) => a.display_order - b.display_order)

    // First pass: compute raw state per topic (without lock logic)
    const topicRawState: Record<string, TopicState> = {}
    const topicDataMap: Record<string, TopicData> = {}

    for (const mod of sortedModules) {
      const modTopics = (topicsByModule[mod.id] || [])
        .sort((a: any, b: any) => a.display_order - b.display_order)

      for (const t of modTopics) {
        const totalQ = questionCountByTopic[t.id] || 0
        const cards = cardsByTopic[t.id] || []
        const cardsSeen = cards.length
        const cardsDue = cards.filter((c: any) =>
          c.state !== 'new' && c.due_date && c.due_date <= now
        ).length

        // Find best quiz score for topic_quiz assessments scoped to this topic
        let bestQuizScore: number | null = null
        for (const a of allAssessments || []) {
          if (a.assessment_type === 'topic_quiz' && a.topic_id === t.id) {
            if (bestScores[a.id] !== undefined) {
              bestQuizScore = bestQuizScore === null
                ? bestScores[a.id]
                : Math.max(bestQuizScore, bestScores[a.id])
            }
          }
        }

        // Raw state (before lock logic)
        let rawState: TopicState
        if (totalQ === 0) {
          // No questions yet — treat as new if unlocked
          rawState = cardsSeen > 0 ? 'learning' : 'new'
        } else if (cardsSeen === 0) {
          rawState = 'new'
        } else if (cardsSeen < totalQ * 0.9) {
          rawState = 'learning'
        } else if (cardsDue > 0) {
          rawState = 'review'
        } else {
          rawState = 'mastered'
        }

        topicRawState[t.id] = rawState
        topicDataMap[t.id] = {
          id: t.id,
          module_id: t.module_id,
          title: t.title,
          display_order: t.display_order,
          state: rawState, // will be overwritten with lock logic
          total_questions: totalQ,
          cards_seen: cardsSeen,
          cards_due: cardsDue,
          lesson_count: lessonCountByTopic[t.id] || 0,
          best_quiz_score: bestQuizScore,
        }
      }
    }

    // Second pass: apply lock logic
    // Track the "best state" of the previous module for cross-module unlock
    let prevModuleBestState: TopicState | null = null

    for (let mi = 0; mi < sortedModules.length; mi++) {
      const mod = sortedModules[mi]
      const modTopics = (topicsByModule[mod.id] || [])
        .sort((a: any, b: any) => a.display_order - b.display_order)

      for (let ti = 0; ti < modTopics.length; ti++) {
        const t = modTopics[ti]
        const data = topicDataMap[t.id]
        const raw = topicRawState[t.id]

        if (ti === 0) {
          // First topic in module
          if (mi === 0) {
            // First topic of first module — always unlocked
            data.state = raw
          } else {
            // First topic in module N: unlocked if any topic in module N-1
            // has state 'learning' or better
            const isUnlocked = prevModuleBestState !== null &&
              prevModuleBestState !== 'locked' && prevModuleBestState !== 'new'
            data.state = isUnlocked ? raw : 'locked'
          }
        } else {
          // Not first topic — check previous topic in same module
          const prevTopic = modTopics[ti - 1]
          const prevState = topicDataMap[prevTopic.id].state
          if (prevState === 'locked' || prevState === 'new') {
            data.state = 'locked'
          } else {
            data.state = raw
          }
        }
      }

      // Compute best state for this module (for next module's unlock check)
      const stateRank: Record<TopicState, number> = {
        locked: 0, new: 1, learning: 2, review: 3, mastered: 4
      }
      let best: TopicState = 'locked'
      for (const t of modTopics) {
        const s = topicDataMap[t.id].state
        if (stateRank[s] > stateRank[best]) best = s
      }
      prevModuleBestState = best
    }

    // ── Build module response ────────────────────────────────────

    const modulesResponse = sortedModules.map((mod: any) => {
      const modTopics = (topicsByModule[mod.id] || [])
        .sort((a: any, b: any) => a.display_order - b.display_order)
        .map((t: any) => topicDataMap[t.id])

      // Module-level assessment (module_test)
      let bestTestScore: number | null = null
      let assessmentId: string | null = null
      for (const a of allAssessments || []) {
        if (a.assessment_type === 'module_test' && a.module_id === mod.id) {
          assessmentId = a.id
          if (bestScores[a.id] !== undefined) {
            bestTestScore = bestTestScore === null
              ? bestScores[a.id]
              : Math.max(bestTestScore, bestScores[a.id])
          }
        }
      }

      return {
        id: mod.id,
        title: mod.title,
        description: mod.description,
        display_order: mod.display_order,
        weight_percent: mod.weight_percent,
        topics: modTopics,
        best_test_score: bestTestScore,
        assessment_id: assessmentId,
      }
    })

    // ── Compute primary CTA ──────────────────────────────────────

    const allTopicData = sortedModules.flatMap((mod: any) =>
      (topicsByModule[mod.id] || [])
        .sort((a: any, b: any) => a.display_order - b.display_order)
        .map((t: any) => topicDataMap[t.id])
    )

    let primaryCta: {
      type: 'review' | 'continue' | 'start_new' | 'caught_up'
      topic_id: string | null
      label: string
      due_count: number | null
    }

    // Priority a: any topic with cards_due > 0
    const reviewTopics = allTopicData
      .filter((t: TopicData) => t.cards_due > 0 && t.state !== 'locked')
      .sort((a: TopicData, b: TopicData) => b.cards_due - a.cards_due)

    if (reviewTopics.length > 0) {
      const top = reviewTopics[0]
      const totalDue = reviewTopics.reduce((s: number, t: TopicData) => s + t.cards_due, 0)
      primaryCta = {
        type: 'review',
        topic_id: top.id,
        label: `Review ${top.title} (${totalDue} due)`,
        due_count: totalDue,
      }
    }
    // Priority b: any topic in learning state
    else if (allTopicData.some((t: TopicData) => t.state === 'learning')) {
      const t = allTopicData.find((t: TopicData) => t.state === 'learning')!
      primaryCta = {
        type: 'continue',
        topic_id: t.id,
        label: `Continue ${t.title}`,
        due_count: null,
      }
    }
    // Priority c: first unlocked new topic
    else if (allTopicData.some((t: TopicData) => t.state === 'new')) {
      const t = allTopicData.find((t: TopicData) => t.state === 'new')!
      primaryCta = {
        type: 'start_new',
        topic_id: t.id,
        label: `Start ${t.title}`,
        due_count: null,
      }
    }
    // Priority d: all caught up
    else {
      primaryCta = {
        type: 'caught_up',
        topic_id: null,
        label: 'All caught up!',
        due_count: null,
      }
    }

    // ── Practice exam info ───────────────────────────────────────

    let practiceExam: { id: string; title: string; best_score: number | null; attempts_count: number } | null = null
    for (const a of allAssessments || []) {
      if (a.assessment_type === 'practice_exam') {
        practiceExam = {
          id: a.id,
          title: a.title,
          best_score: bestScores[a.id] ?? null,
          attempts_count: attemptCounts[a.id] || 0,
        }
        break
      }
    }

    // ── Response ─────────────────────────────────────────────────

    return NextResponse.json({
      course: {
        id: course.id,
        title: course.title,
        readiness_score: userCourse.readiness_score ?? 0,
      },
      modules: modulesResponse,
      primary_cta: primaryCta,
      practice_exam: practiceExam,
    })

  } catch (err) {
    console.error('GET /api/courses/[slug]/path error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
