import { NextRequest, NextResponse } from 'next/server'
import { getApiUser } from '@/lib/supabase/get-user-api'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ assessmentId: string; attemptId: string }> }
) {
  try {
    const { supabase, userId, error } = await getApiUser()
    if (error) return error

    const { assessmentId, attemptId } = await params

    const { data: attempt } = await supabase
      .from('assessment_attempts')
      .select('*')
      .eq('id', attemptId)
      .eq('user_id', userId)
      .eq('assessment_id', assessmentId)
      .single()

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }

    const { data: assessment } = await supabase
      .from('assessments')
      .select('title, assessment_type, passing_score_percent, time_limit_minutes')
      .eq('id', assessmentId)
      .single()

    const att = attempt as any
    const answers = att.answers || []
    const questionIds = answers.map((a: any) => a.question_id).filter(Boolean)

    let questions: any[] = []
    if (questionIds.length > 0) {
      const { data } = await supabase
        .from('questions')
        .select('id, question_text, question_type, options, correct_option_ids, explanation, acceptable_answers, correct_order, matching_pairs, option_explanations')
        .in('id', questionIds)
      questions = data || []
    }

    const questionMap = new Map(questions.map((q: any) => [q.id, q]))

    const detailedAnswers = answers.map((a: any) => {
      const q = questionMap.get(a.question_id)
      return {
        question_id: a.question_id,
        question_text: q?.question_text,
        question_type: q?.question_type,
        options: q?.options,
        correct_option_ids: q?.correct_option_ids,
        explanation: q?.explanation,
        acceptable_answers: q?.acceptable_answers,
        correct_order: q?.correct_order,
        matching_pairs: q?.matching_pairs,
        selected_option_ids: a.selected_option_ids,
        answer_text: a.answer_text,
        user_order: a.user_order,
        user_pairs: a.user_pairs,
        is_correct: a.is_correct,
        time_spent_ms: a.time_spent_ms,
      }
    })

    return NextResponse.json({
      attempt: {
        id: att.id,
        score_percent: att.score_percent,
        correct_count: att.correct_count,
        total_count: att.total_count,
        passed: att.passed,
        started_at: att.started_at,
        completed_at: att.completed_at,
        time_spent_seconds: att.time_spent_seconds,
      },
      assessment,
      answers: detailedAnswers,
    })
  } catch (err) {
    console.error('GET assessment results error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
