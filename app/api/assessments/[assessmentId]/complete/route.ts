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
    const { attempt_id } = await request.json()

    if (!attempt_id) {
      return NextResponse.json({ error: 'attempt_id is required' }, { status: 400 })
    }

    const { data: attempt } = await supabase
      .from('assessment_attempts')
      .select('*')
      .eq('id', attempt_id)
      .eq('user_id', userId)
      .eq('assessment_id', assessmentId)
      .single()

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }

    const att = attempt as any
    if (att.completed_at) {
      return NextResponse.json({ error: 'Attempt already completed' }, { status: 400 })
    }

    const { data: assessment } = await supabase
      .from('assessments')
      .select('passing_score_percent')
      .eq('id', assessmentId)
      .single()

    const totalCount = att.total_count || 1
    const correctCount = att.correct_count || 0
    const scorePercent = Math.round((correctCount / totalCount) * 100)
    const passed = scorePercent >= ((assessment as any)?.passing_score_percent || 70)
    const startedAt = new Date(att.started_at)
    const now = new Date()
    const timeSpentSeconds = Math.round((now.getTime() - startedAt.getTime()) / 1000)

    const { data: completed, error: updateError } = await supabase
      .from('assessment_attempts')
      .update({
        score_percent: scorePercent,
        passed,
        completed_at: now.toISOString(),
        time_spent_seconds: timeSpentSeconds,
      })
      .eq('id', attempt_id)
      .select('*')
      .single()

    if (updateError) {
      console.error('Complete attempt error:', updateError)
      return NextResponse.json({ error: 'Failed to complete assessment' }, { status: 500 })
    }

    return NextResponse.json(completed)
  } catch (err) {
    console.error('POST assessment complete error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
