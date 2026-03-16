import { NextRequest, NextResponse } from 'next/server'
import { getApiUser } from '@/lib/supabase/get-user-api'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ assessmentId: string }> }
) {
  try {
    const { supabase, userId, error } = await getApiUser()
    if (error) return error

    const { assessmentId } = await params
    const body = await request.json()
    const { attempt_id, question_id, selected_option_ids, answer_text, user_order, user_pairs, time_spent_ms } = body

    if (!attempt_id || !question_id) {
      return NextResponse.json({ error: 'attempt_id and question_id are required' }, { status: 400 })
    }

    const { data: attempt } = await supabase
      .from('assessment_attempts')
      .select('id, completed_at')
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

    const { data: question } = await supabase
      .from('questions')
      .select('id, correct_option_ids, explanation, acceptable_answers, match_mode, correct_order, matching_pairs, option_explanations')
      .eq('id', question_id)
      .single()

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    let isCorrect = false
    const q = question as any

    if (answer_text !== undefined && q.acceptable_answers) {
      const normalized = answer_text.trim().toLowerCase()
      if (q.match_mode === 'contains') {
        isCorrect = q.acceptable_answers.some((a: string) => normalized.includes(a.toLowerCase()))
      } else {
        isCorrect = q.acceptable_answers.some((a: string) => a.toLowerCase() === normalized)
      }
    } else if (user_order && q.correct_order) {
      isCorrect = JSON.stringify(user_order) === JSON.stringify(q.correct_order)
    } else if (user_pairs && q.matching_pairs) {
      isCorrect = user_pairs.every((up: any) => {
        const correct = q.matching_pairs.find((mp: any) => mp.left === up.left)
        return correct && correct.right.toLowerCase() === up.right.toLowerCase()
      })
    } else if (selected_option_ids) {
      const correct = [...q.correct_option_ids].sort()
      const selected = [...(selected_option_ids || [])].sort()
      isCorrect = JSON.stringify(correct) === JSON.stringify(selected)
    }

    const { data: assessment } = await supabase
      .from('assessments')
      .select('show_explanations')
      .eq('id', assessmentId)
      .single()

    const answerRecord = {
      question_id,
      selected_option_ids: selected_option_ids || [],
      answer_text,
      user_order,
      user_pairs,
      is_correct: isCorrect,
      time_spent_ms: time_spent_ms || 0,
    }

    const { data: currentAttempt } = await supabase
      .from('assessment_attempts')
      .select('answers, correct_count')
      .eq('id', attempt_id)
      .single()

    const currentAnswers = (currentAttempt as any)?.answers || []
    const currentCorrect = (currentAttempt as any)?.correct_count || 0

    await supabase
      .from('assessment_attempts')
      .update({
        answers: [...currentAnswers, answerRecord],
        correct_count: isCorrect ? currentCorrect + 1 : currentCorrect,
      })
      .eq('id', attempt_id)

    const response: any = { is_correct: isCorrect }

    if ((assessment as any)?.show_explanations) {
      response.explanation = q.explanation
      response.correct_option_ids = q.correct_option_ids
      response.correct_order = q.correct_order
      response.matching_pairs = q.matching_pairs
      response.acceptable_answers = q.acceptable_answers

      if (!isCorrect && q.option_explanations && selected_option_ids?.length > 0) {
        const wrongId = selected_option_ids.find((sid: string) => !q.correct_option_ids.includes(sid))
        if (wrongId && q.option_explanations[wrongId]) {
          response.option_explanation = q.option_explanations[wrongId]
        }
      }
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error('POST assessment answer error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
