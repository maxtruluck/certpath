import { NextRequest, NextResponse } from 'next/server'
import { getApiUser } from '@/lib/supabase/get-user-api'

/**
 * PATCH — Save answers in progress (auto-save).
 * POST  — Submit for grading.
 * GET   — Get attempt detail with results.
 */

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string; testId: string; attemptId: string }> }
) {
  try {
    const { supabase, userId, error } = await getApiUser()
    if (error) return error

    const { attemptId } = await params

    const { data: attempt } = await supabase
      .from('test_attempts')
      .select('*')
      .eq('id', attemptId)
      .eq('user_id', userId)
      .single()

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }

    // Get test settings
    const { data: test } = await supabase
      .from('tests')
      .select('title, passing_score, time_limit_minutes')
      .eq('id', attempt.test_id)
      .single()

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    // Build response — always show full results when completed
    const questions = (attempt.questions || []).map((q: any) => {
      const base: any = {
        question_id: q.question_id,
        question_text: q.question_content?.question_text,
        question_type: q.question_content?.question_type || 'multiple_choice',
        options: q.question_content?.options?.map((o: any) => ({ id: o.id, text: o.text })),
        selected_answer: q.selected_answer,
        flagged: q.flagged || false,
      }

      if (attempt.status === 'completed') {
        base.is_correct = q.is_correct
        base.correct_ids = q.question_content?.correct_ids
        base.explanation = q.question_content?.explanation
        base.option_explanations = q.question_content?.option_explanations
      }

      return base
    })

    return NextResponse.json({
      attempt_id: attempt.id,
      test_title: test.title,
      status: attempt.status,
      started_at: attempt.started_at,
      completed_at: attempt.completed_at,
      time_spent_seconds: attempt.time_spent_seconds,
      score: attempt.score,
      score_percent: attempt.score_percent,
      passed: attempt.passed,
      passing_score: test.passing_score,
      time_limit_minutes: test.time_limit_minutes,
      show_full_results: attempt.status === 'completed',
      questions,
      total_questions: questions.length,
    })
  } catch (err) {
    console.error('GET attempt error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; testId: string; attemptId: string }> }
) {
  try {
    const { supabase, userId, error } = await getApiUser()
    if (error) return error

    const { attemptId } = await params
    const body = await request.json()

    // Get existing attempt
    const { data: attempt } = await supabase
      .from('test_attempts')
      .select('*')
      .eq('id', attemptId)
      .eq('user_id', userId)
      .eq('status', 'in_progress')
      .single()

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found or already completed' }, { status: 404 })
    }

    // Update answers in the snapshot
    const questions = [...(attempt.questions || [])]
    const { answers, flags } = body

    if (answers) {
      for (const [questionId, answer] of Object.entries(answers)) {
        const idx = questions.findIndex((q: any) => q.question_id === questionId)
        if (idx >= 0) {
          questions[idx] = { ...questions[idx], selected_answer: answer }
        }
      }
    }

    if (flags) {
      for (const [questionId, flagged] of Object.entries(flags)) {
        const idx = questions.findIndex((q: any) => q.question_id === questionId)
        if (idx >= 0) {
          questions[idx] = { ...questions[idx], flagged }
        }
      }
    }

    const { error: updateError } = await supabase
      .from('test_attempts')
      .update({ questions })
      .eq('id', attemptId)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('PATCH attempt error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; testId: string; attemptId: string }> }
) {
  try {
    const { supabase, userId, error } = await getApiUser()
    if (error) return error

    const { attemptId } = await params

    // Get attempt
    const { data: attempt } = await supabase
      .from('test_attempts')
      .select('*')
      .eq('id', attemptId)
      .eq('user_id', userId)
      .eq('status', 'in_progress')
      .single()

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found or already submitted' }, { status: 404 })
    }

    // Get test for passing score
    const { data: test } = await supabase
      .from('tests')
      .select('passing_score, time_limit_minutes')
      .eq('id', attempt.test_id)
      .single()

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    // Optionally merge final answers from request body
    const body = await request.json().catch(() => ({}))
    const questions = [...(attempt.questions || [])]

    if (body.answers) {
      for (const [questionId, answer] of Object.entries(body.answers)) {
        const idx = questions.findIndex((q: any) => q.question_id === questionId)
        if (idx >= 0) {
          questions[idx] = { ...questions[idx], selected_answer: answer }
        }
      }
    }

    // ── Grade ─────────────────────────────────────────────────────────
    let correctCount = 0

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      const content = q.question_content
      const answer = q.selected_answer

      const isCorrect = gradeQuestion(content, answer)
      questions[i] = { ...questions[i], is_correct: isCorrect }
      if (isCorrect) correctCount++
    }

    const scorePercent = questions.length > 0
      ? Math.round((correctCount / questions.length) * 100)
      : 0

    const passed = scorePercent >= test.passing_score

    const now = new Date()
    const timeSpent = Math.round((now.getTime() - new Date(attempt.started_at).getTime()) / 1000)

    // Update attempt
    const { error: updateError } = await supabase
      .from('test_attempts')
      .update({
        questions,
        score: correctCount,
        score_percent: scorePercent,
        passed,
        status: 'completed',
        completed_at: now.toISOString(),
        time_spent_seconds: timeSpent,
      })
      .eq('id', attemptId)

    if (updateError) {
      console.error('Submit attempt error:', updateError)
      return NextResponse.json({ error: 'Failed to submit' }, { status: 500 })
    }

    // Always return full results
    const result: any = {
      attempt_id: attemptId,
      status: 'completed',
      score: correctCount,
      score_percent: scorePercent,
      passed,
      passing_score: test.passing_score,
      time_spent_seconds: timeSpent,
      total_questions: questions.length,
      show_full_results: true,
      questions: questions.map((q: any) => ({
        question_id: q.question_id,
        question_text: q.question_content?.question_text,
        question_type: q.question_content?.question_type || 'multiple_choice',
        options: q.question_content?.options,
        selected_answer: q.selected_answer,
        is_correct: q.is_correct,
        correct_ids: q.question_content?.correct_ids,
        explanation: q.question_content?.explanation,
        option_explanations: q.question_content?.option_explanations,
      })),
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('POST submit attempt error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── Grading helper ──────────────────────────────────────────────────────────

function gradeQuestion(content: any, answer: any): boolean {
  if (!answer) return false

  const type = content?.question_type || 'multiple_choice'
  const correctIds = content?.correct_ids || []

  switch (type) {
    case 'multiple_choice':
    case 'true_false': {
      // answer is a single ID or array with one ID
      const selected = Array.isArray(answer) ? answer : [answer]
      return selected.length === 1 && correctIds.includes(selected[0])
    }

    case 'multiple_select': {
      const selected = Array.isArray(answer) ? [...answer].sort() : [answer]
      const correct = [...correctIds].sort()
      return selected.length === correct.length && selected.every((id: string, i: number) => id === correct[i])
    }

    case 'fill_blank': {
      const acceptable = content?.acceptable_answers || []
      const mode = content?.match_mode || 'exact'
      const userAnswer = (typeof answer === 'string' ? answer : '').trim().toLowerCase()
      return acceptable.some((a: string) => {
        const expected = a.trim().toLowerCase()
        return mode === 'contains' ? userAnswer.includes(expected) : userAnswer === expected
      })
    }

    case 'ordering': {
      const correctOrder = content?.correct_order || []
      const userOrder = Array.isArray(answer) ? answer : []
      return userOrder.length === correctOrder.length &&
        userOrder.every((id: string, i: number) => id === correctOrder[i])
    }

    case 'matching': {
      const correctOrder = content?.correct_order || []
      const userOrder = Array.isArray(answer) ? answer : []
      return userOrder.length === correctOrder.length &&
        userOrder.every((id: string, i: number) => id === correctOrder[i])
    }

    default:
      return false
  }
}
