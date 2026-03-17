import { NextRequest, NextResponse } from 'next/server'
import { getApiUser } from '@/lib/supabase/get-user-api'

// ---------------------------------------------------------------------------
// Grading logic — mirrors session/answer validateAnswer for all 6 types
// ---------------------------------------------------------------------------

function gradeAnswer(
  question: any,
  answer: any,
): { isCorrect: boolean } {
  const qt = question.question_type

  // Fill blank
  if (qt === 'fill_blank') {
    const text = (answer.answer_text || '').trim().toLowerCase()
    const acceptable: string[] = question.acceptable_answers || []
    const mode = question.match_mode || 'exact'
    if (mode === 'contains') {
      return { isCorrect: acceptable.some((a: string) => text.includes(a.trim().toLowerCase())) }
    }
    return { isCorrect: acceptable.some((a: string) => a.trim().toLowerCase() === text) }
  }

  // Ordering
  if (qt === 'ordering') {
    const userOrder: string[] = answer.user_order || answer.selected_option_ids || []
    const correctOrder: string[] = question.correct_order || []
    if (correctOrder.length === 0) return { isCorrect: false }
    const isCorrect = userOrder.length === correctOrder.length &&
      userOrder.every((id: string, i: number) => id === correctOrder[i])
    return { isCorrect }
  }

  // Matching
  if (qt === 'matching') {
    const userPairs: { left: string; right: string }[] = answer.user_pairs || []
    const correctPairs: { left: string; right: string }[] = question.matching_pairs || []
    if (correctPairs.length === 0) return { isCorrect: false }
    const correctMap = new Map<string, string>()
    for (const pair of correctPairs) {
      correctMap.set(pair.left.toLowerCase(), pair.right.toLowerCase())
    }
    let correct = 0
    for (const up of userPairs) {
      const expected = correctMap.get(up.left.toLowerCase())
      if (expected && expected === up.right.toLowerCase()) correct++
    }
    return { isCorrect: correct === correctPairs.length }
  }

  // MC, MS, TF
  const correctIds = [...(question.correct_option_ids || [])].sort()
  const selectedIds = [...(answer.selected_option_ids || [])].sort()
  const isCorrect = correctIds.length === selectedIds.length &&
    correctIds.every((id: string, i: number) => id === selectedIds[i])
  return { isCorrect }
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ assessmentId: string }> }
) {
  try {
    const { supabase, userId, error } = await getApiUser()
    if (error) return error

    const { assessmentId } = await params
    const body = await request.json()
    const { attempt_id, answers } = body

    if (!attempt_id || !answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: 'attempt_id and answers array are required' },
        { status: 400 },
      )
    }

    // Verify attempt belongs to user and is not completed
    const { data: attempt } = await supabase
      .from('assessment_attempts')
      .select('id, assessment_id, started_at, completed_at, total_count')
      .eq('id', attempt_id)
      .eq('user_id', userId)
      .eq('assessment_id', assessmentId)
      .single()

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }
    if ((attempt as any).completed_at) {
      return NextResponse.json({ error: 'Attempt already completed' }, { status: 400 })
    }

    // Fetch assessment for passing score
    const { data: assessment } = await supabase
      .from('assessments')
      .select('passing_score_percent, show_explanations')
      .eq('id', assessmentId)
      .single()

    const passingScore = (assessment as any)?.passing_score_percent ?? 70
    const showExplanations = (assessment as any)?.show_explanations ?? true

    // Fetch all questions referenced in answers
    const questionIds = answers.map((a: any) => a.question_id).filter(Boolean)
    const { data: questions } = await supabase
      .from('questions')
      .select('id, topic_id, correct_option_ids, explanation, question_type, acceptable_answers, match_mode, correct_order, matching_pairs, option_explanations')
      .in('id', questionIds)

    if (!questions) {
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
    }

    const questionMap = new Map(questions.map((q: any) => [q.id, q]))

    // Fetch topic titles for breakdown
    const topicIds = [...new Set(questions.map((q: any) => q.topic_id))]
    const { data: topics } = await supabase
      .from('topics')
      .select('id, title')
      .in('id', topicIds)
    const topicTitleMap = new Map((topics || []).map((t: any) => [t.id, t.title]))

    // Grade each answer
    let correctCount = 0
    const totalCount = answers.length
    const results: any[] = []
    const answersJsonb: any[] = []
    const topicStats: Record<string, { correct: number; total: number; title: string }> = {}

    for (const answer of answers) {
      const question = questionMap.get(answer.question_id)
      if (!question) {
        results.push({
          question_id: answer.question_id,
          is_correct: false,
          explanation: null,
          correct_option_ids: null,
        })
        continue
      }

      const q = question as any
      const { isCorrect } = gradeAnswer(q, answer)
      if (isCorrect) correctCount++

      // Track topic stats
      const tid = q.topic_id
      if (!topicStats[tid]) {
        topicStats[tid] = { correct: 0, total: 0, title: topicTitleMap.get(tid) || '' }
      }
      topicStats[tid].total++
      if (isCorrect) topicStats[tid].correct++

      // Build result entry
      const result: any = {
        question_id: answer.question_id,
        is_correct: isCorrect,
      }

      if (showExplanations) {
        result.explanation = q.explanation
        result.correct_option_ids = q.correct_option_ids
        if (q.question_type === 'ordering') result.correct_order = q.correct_order
        if (q.question_type === 'matching') result.matching_pairs = q.matching_pairs
        if (q.question_type === 'fill_blank') result.acceptable_answers = q.acceptable_answers
      }

      results.push(result)

      // Build answers JSONB for storage
      answersJsonb.push({
        question_id: answer.question_id,
        selected_option_ids: answer.selected_option_ids || [],
        answer_text: answer.answer_text,
        user_order: answer.user_order,
        user_pairs: answer.user_pairs,
        is_correct: isCorrect,
        time_spent_ms: answer.time_spent_ms || 0,
      })
    }

    const scorePercent = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0
    const passed = scorePercent >= passingScore
    const startedAt = new Date((attempt as any).started_at)
    const now = new Date()
    const timeSpentSeconds = Math.round((now.getTime() - startedAt.getTime()) / 1000)

    // Update attempt
    await supabase
      .from('assessment_attempts')
      .update({
        completed_at: now.toISOString(),
        correct_count: correctCount,
        score_percent: scorePercent,
        passed,
        time_spent_seconds: timeSpentSeconds,
        answers: answersJsonb,
      })
      .eq('id', attempt_id)

    // Build topic breakdown
    const topicBreakdown = Object.entries(topicStats).map(([topicId, stats]) => ({
      topic_id: topicId,
      topic_title: stats.title,
      correct: stats.correct,
      total: stats.total,
    }))

    return NextResponse.json({
      score_percent: scorePercent,
      passed,
      correct_count: correctCount,
      total_count: totalCount,
      time_spent_seconds: timeSpentSeconds,
      results,
      topic_breakdown: topicBreakdown,
    })
  } catch (err) {
    console.error('POST assessment submit error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
