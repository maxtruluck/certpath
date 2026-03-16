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

    const { data: enrollment } = await supabase
      .from('user_courses')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', a.course_id)
      .maybeSingle()

    if (!enrollment) {
      return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 })
    }

    const { data: aqRows } = await supabase
      .from('assessment_questions')
      .select('question_id, display_order')
      .eq('assessment_id', assessmentId)
      .order('display_order')

    if (!aqRows || aqRows.length === 0) {
      return NextResponse.json({ error: 'No questions in this assessment' }, { status: 400 })
    }

    const questionIds = aqRows.map((aq: any) => aq.question_id)

    const { data: questions } = await supabase
      .from('questions')
      .select('id, question_text, question_type, options, difficulty, tags, blooms_level, matching_pairs')
      .in('id', questionIds)

    if (!questions || questions.length === 0) {
      return NextResponse.json({ error: 'Questions not found' }, { status: 500 })
    }

    const orderMap = new Map(aqRows.map((aq: any) => [aq.question_id, aq.display_order]))
    let orderedQuestions = questions.sort((x: any, y: any) =>
      (orderMap.get(x.id) || 0) - (orderMap.get(y.id) || 0)
    )

    if (a.shuffle_questions) {
      for (let i = orderedQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [orderedQuestions[i], orderedQuestions[j]] = [orderedQuestions[j], orderedQuestions[i]]
      }
    }

    const safeQuestions = orderedQuestions.map((q: any) => ({
      id: q.id,
      question_text: q.question_text,
      question_type: q.question_type,
      options: q.options,
      difficulty: q.difficulty,
      matching_items: q.matching_pairs ? {
        lefts: q.matching_pairs.map((p: any) => p.left),
        rights: q.matching_pairs.map((p: any) => p.right).sort(() => Math.random() - 0.5),
      } : undefined,
    }))

    const { data: attempt, error: attemptError } = await supabase
      .from('assessment_attempts')
      .insert({
        user_id: userId,
        assessment_id: assessmentId,
        total_count: safeQuestions.length,
      })
      .select('id, started_at')
      .single()

    if (attemptError) {
      console.error('Create attempt error:', attemptError)
      return NextResponse.json({ error: 'Failed to start assessment' }, { status: 500 })
    }

    const att = attempt as any
    return NextResponse.json({
      attempt_id: att.id,
      started_at: att.started_at,
      assessment: {
        id: a.id,
        title: a.title,
        assessment_type: a.assessment_type,
        question_count: safeQuestions.length,
        time_limit_minutes: a.time_limit_minutes,
        passing_score_percent: a.passing_score_percent,
        show_explanations: a.show_explanations,
      },
      questions: safeQuestions,
    })
  } catch (err) {
    console.error('POST assessment start error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
