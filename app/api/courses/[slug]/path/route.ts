import { NextRequest, NextResponse } from 'next/server'
import { getApiUser } from '@/lib/supabase/get-user-api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TopicState = 'locked' | 'available' | 'in_progress' | 'completed'

interface TopicData {
  id: string
  module_id: string
  title: string
  display_order: number
  state: TopicState
  lesson_count: number
  question_count: number
  items_completed: number
  items_total: number
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
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', course.id)
      .maybeSingle()

    if (!userCourse) {
      return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 })
    }

    // Parallel fetch: modules, topics, lesson counts, question counts, progress, assessments, attempts
    const [
      { data: modules },
      { data: topics },
      { data: allLessons },
      { data: allQuestions },
      { data: progressRows },
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
        .from('lessons')
        .select('id, topic_id')
        .eq('course_id', course.id)
        .eq('is_active', true),
      supabase
        .from('questions')
        .select('id, topic_id')
        .eq('course_id', course.id)
        .eq('is_active', true),
      supabase
        .from('user_topic_progress')
        .select('topic_id, status, session_items_completed, session_items_total')
        .eq('user_id', userId)
        .eq('course_id', course.id),
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

    // ── Index data ───────────────────────────────────────────────

    // Lessons per topic
    const lessonCountByTopic: Record<string, number> = {}
    for (const l of allLessons || []) {
      lessonCountByTopic[l.topic_id] = (lessonCountByTopic[l.topic_id] || 0) + 1
    }

    // Questions per topic
    const questionCountByTopic: Record<string, number> = {}
    for (const q of allQuestions || []) {
      questionCountByTopic[q.topic_id] = (questionCountByTopic[q.topic_id] || 0) + 1
    }

    // Progress by topic
    const progressByTopic: Record<string, { status: string; items_completed: number; items_total: number }> = {}
    for (const p of progressRows || []) {
      progressByTopic[p.topic_id] = {
        status: p.status,
        items_completed: p.session_items_completed || 0,
        items_total: p.session_items_total || 0,
      }
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

    // ── Group topics by module ────────────────────────────────────

    const topicsByModule: Record<string, any[]> = {}
    for (const t of topics || []) {
      if (!topicsByModule[t.module_id]) topicsByModule[t.module_id] = []
      topicsByModule[t.module_id].push(t)
    }

    const sortedModules = (modules || []).sort((a: any, b: any) => a.display_order - b.display_order)

    // ── Compute topic states (linear locking) ─────────────────────

    const topicDataMap: Record<string, TopicData> = {}

    for (let mi = 0; mi < sortedModules.length; mi++) {
      const mod = sortedModules[mi]
      const modTopics = (topicsByModule[mod.id] || [])
        .sort((a: any, b: any) => a.display_order - b.display_order)

      for (let ti = 0; ti < modTopics.length; ti++) {
        const t = modTopics[ti]
        const progress = progressByTopic[t.id]

        // Best quiz score for topic
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

        // Raw state from progress table
        let rawState: TopicState = 'available'
        if (progress) {
          if (progress.status === 'completed') rawState = 'completed'
          else if (progress.status === 'in_progress') rawState = 'in_progress'
        }

        // Lock logic
        let state: TopicState = rawState
        if (ti === 0 && mi === 0) {
          // First topic of first module: always available (or its progress state)
          state = rawState
        } else if (ti === 0) {
          // First topic of a non-first module: available if ALL topics in previous module are completed
          const prevMod = sortedModules[mi - 1]
          const prevModTopics = (topicsByModule[prevMod.id] || [])
          const allPrevCompleted = prevModTopics.every((pt: any) => {
            const pp = progressByTopic[pt.id]
            return pp && pp.status === 'completed'
          })
          state = allPrevCompleted ? rawState : 'locked'
        } else {
          // Not first topic: available if previous topic in same module is completed
          const prevTopic = modTopics[ti - 1]
          const prevProgress = progressByTopic[prevTopic.id]
          const prevCompleted = prevProgress && prevProgress.status === 'completed'
          state = prevCompleted ? rawState : 'locked'
        }

        topicDataMap[t.id] = {
          id: t.id,
          module_id: t.module_id,
          title: t.title,
          display_order: t.display_order,
          state,
          lesson_count: lessonCountByTopic[t.id] || 0,
          question_count: questionCountByTopic[t.id] || 0,
          items_completed: progress?.items_completed || 0,
          items_total: progress?.items_total || 0,
          best_quiz_score: bestQuizScore,
        }
      }
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
      type: 'continue' | 'start' | 'caught_up'
      topic_id: string | null
      label: string
    }

    // Priority 1: first in_progress topic
    const inProgressTopic = allTopicData.find((t: TopicData) => t.state === 'in_progress')
    if (inProgressTopic) {
      primaryCta = {
        type: 'continue',
        topic_id: inProgressTopic.id,
        label: `Continue ${inProgressTopic.title}`,
      }
    }
    // Priority 2: first available topic
    else {
      const availableTopic = allTopicData.find((t: TopicData) => t.state === 'available')
      if (availableTopic) {
        primaryCta = {
          type: 'start',
          topic_id: availableTopic.id,
          label: `Start ${availableTopic.title}`,
        }
      }
      // Priority 3: all completed
      else {
        primaryCta = {
          type: 'caught_up',
          topic_id: null,
          label: 'All caught up!',
        }
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

    // ── Overall progress ─────────────────────────────────────────

    const totalTopics = allTopicData.length
    const completedTopics = allTopicData.filter((t: TopicData) => t.state === 'completed').length

    // ── Response ─────────────────────────────────────────────────

    return NextResponse.json({
      course: {
        id: course.id,
        title: course.title,
      },
      modules: modulesResponse,
      primary_cta: primaryCta,
      practice_exam: practiceExam,
      progress: {
        completed: completedTopics,
        total: totalTopics,
      },
    })

  } catch (err) {
    console.error('GET /api/courses/[slug]/path error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
