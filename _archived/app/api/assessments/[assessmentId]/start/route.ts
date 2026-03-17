import { NextRequest, NextResponse } from 'next/server'
import { getApiUser } from '@/lib/supabase/get-user-api'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ assessmentId: string }> }
) {
  try {
    const { supabase, userId, error } = await getApiUser()
    if (error) return error

    const { assessmentId } = await params

    // Fetch assessment
    const { data: assessment, error: assessError } = await supabase
      .from('assessments')
      .select('*')
      .eq('id', assessmentId)
      .eq('is_active', true)
      .single()

    if (assessError || !assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
    }

    const a = assessment as any

    // Verify enrollment
    const { data: enrollment } = await supabase
      .from('user_courses')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', a.course_id)
      .maybeSingle()

    if (!enrollment) {
      return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 })
    }

    // ── Select questions ──────────────────────────────────────

    // First try: manually assigned questions from assessment_questions
    const { data: aqRows } = await supabase
      .from('assessment_questions')
      .select('question_id, display_order')
      .eq('assessment_id', assessmentId)
      .order('display_order')

    let questionIds: string[] = []

    if (aqRows && aqRows.length > 0) {
      // Manual mode: use assigned questions
      questionIds = aqRows.map((aq: any) => aq.question_id)
    } else {
      // Auto-select mode: pull from scope based on assessment type
      let scopeQuery = supabase
        .from('questions')
        .select('id, blooms_level')
        .eq('course_id', a.course_id)
        .eq('is_active', true)

      if (a.assessment_type === 'topic_quiz' && a.topic_id) {
        scopeQuery = scopeQuery.eq('topic_id', a.topic_id)
      } else if (a.assessment_type === 'module_test' && a.module_id) {
        scopeQuery = scopeQuery.eq('module_id', a.module_id)
      }
      // practice_exam: course-wide, no additional filter

      const { data: scopeQuestions } = await scopeQuery

      if (!scopeQuestions || scopeQuestions.length === 0) {
        return NextResponse.json({ error: 'No questions available for this assessment scope' }, { status: 400 })
      }

      const targetCount = a.question_count || 10

      // Try to distribute across Bloom's levels if data exists
      const byBloom: Record<string, any[]> = {}
      let hasBloom = false
      for (const q of scopeQuestions) {
        const level = (q as any).blooms_level || 'remember'
        if (level !== 'remember') hasBloom = true
        if (!byBloom[level]) byBloom[level] = []
        byBloom[level].push(q)
      }

      if (hasBloom && scopeQuestions.length > targetCount) {
        // Distribute evenly across levels, then fill remainder randomly
        const levels = Object.keys(byBloom)
        const perLevel = Math.floor(targetCount / levels.length)
        const selected: string[] = []

        for (const level of levels) {
          const pool = byBloom[level]
          // Shuffle pool
          for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]]
          }
          selected.push(...pool.slice(0, perLevel).map((q: any) => q.id))
        }

        // Fill remaining from all questions not yet selected
        const selectedSet = new Set(selected)
        const remaining = scopeQuestions.filter((q: any) => !selectedSet.has(q.id))
        for (let i = remaining.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [remaining[i], remaining[j]] = [remaining[j], remaining[i]]
        }
        selected.push(...remaining.slice(0, targetCount - selected.length).map((q: any) => q.id))

        questionIds = selected.slice(0, targetCount)
      } else {
        // Simple random selection
        const shuffled = [...scopeQuestions]
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }
        questionIds = shuffled.slice(0, targetCount).map((q: any) => q.id)
      }
    }

    if (questionIds.length === 0) {
      return NextResponse.json({ error: 'No questions available' }, { status: 400 })
    }

    // Fetch full question data (answers stripped)
    const { data: questions } = await supabase
      .from('questions')
      .select('id, topic_id, question_text, question_type, options, difficulty, tags, blooms_level, matching_pairs, acceptable_answers, correct_order')
      .in('id', questionIds)

    if (!questions || questions.length === 0) {
      return NextResponse.json({ error: 'Questions not found' }, { status: 500 })
    }

    // Maintain order from questionIds, shuffle if requested
    let orderedQuestions = questionIds
      .map(id => questions.find((q: any) => q.id === id))
      .filter(Boolean) as any[]

    if (a.shuffle_questions) {
      for (let i = orderedQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [orderedQuestions[i], orderedQuestions[j]] = [orderedQuestions[j], orderedQuestions[i]]
      }
    }

    // Strip answer data
    const safeQuestions = orderedQuestions.map((q: any) => {
      const safe: any = {
        id: q.id,
        topic_id: q.topic_id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options,
        difficulty: q.difficulty,
      }
      // Matching: shuffle right side
      if (q.question_type === 'matching' && q.matching_pairs) {
        const lefts = q.matching_pairs.map((p: any) => p.left)
        const rights = q.matching_pairs.map((p: any) => p.right)
        for (let i = rights.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [rights[i], rights[j]] = [rights[j], rights[i]]
        }
        safe.matching_items = { lefts, rights }
      }
      // Ordering: include options (they'll be shuffled client-side)
      return safe
    })

    // Create attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('assessment_attempts')
      .insert({
        user_id: userId,
        assessment_id: assessmentId,
        course_id: a.course_id,
        total_count: safeQuestions.length,
      })
      .select('id, started_at')
      .single()

    if (attemptError) {
      console.error('Create attempt error:', attemptError)
      return NextResponse.json({ error: 'Failed to start assessment' }, { status: 500 })
    }

    return NextResponse.json({
      attempt_id: (attempt as any).id,
      started_at: (attempt as any).started_at,
      assessment: {
        id: a.id,
        title: a.title,
        assessment_type: a.assessment_type,
        question_count: safeQuestions.length,
        time_limit_minutes: a.time_limit_minutes,
        passing_score_percent: a.passing_score_percent,
        show_explanations: a.show_explanations ?? true,
      },
      questions: safeQuestions,
      time_limit_minutes: a.time_limit_minutes,
      total_questions: safeQuestions.length,
    })
  } catch (err) {
    console.error('POST assessment start error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
