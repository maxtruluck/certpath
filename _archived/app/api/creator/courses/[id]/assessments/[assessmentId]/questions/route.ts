import { NextRequest, NextResponse } from 'next/server'
import { getCreatorCourse } from '@/lib/supabase/get-creator-course'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; assessmentId: string }> }
) {
  try {
    const { id, assessmentId } = await params
    const { supabase, error } = await getCreatorCourse(id)
    if (error) return error

    const { data: aqRows, error: fetchError } = await supabase
      .from('assessment_questions')
      .select('id, question_id, display_order')
      .eq('assessment_id', assessmentId)
      .order('display_order')

    if (fetchError) {
      return NextResponse.json({ error: 'Failed to fetch assessment questions' }, { status: 500 })
    }

    if (!aqRows || aqRows.length === 0) {
      return NextResponse.json([])
    }

    const questionIds = aqRows.map((aq: any) => aq.question_id)
    const { data: questions } = await supabase
      .from('questions')
      .select('*')
      .in('id', questionIds)

    const questionMap = new Map((questions || []).map((q: any) => [q.id, q]))
    const result = aqRows.map((aq: any) => ({
      ...questionMap.get(aq.question_id),
      assessment_question_id: aq.id,
      assessment_display_order: aq.display_order,
    }))

    return NextResponse.json(result)
  } catch (err) {
    console.error('GET assessment questions error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assessmentId: string }> }
) {
  try {
    const { id, assessmentId } = await params
    const { supabase, error } = await getCreatorCourse(id)
    if (error) return error

    const { question_ids } = await request.json()

    if (!Array.isArray(question_ids) || question_ids.length === 0) {
      return NextResponse.json({ error: 'question_ids array is required' }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from('assessment_questions')
      .select('display_order')
      .eq('assessment_id', assessmentId)
      .order('display_order', { ascending: false })
      .limit(1)

    let startOrder = existing && existing.length > 0 ? existing[0].display_order + 1 : 0

    const inserts = question_ids.map((qId: string, idx: number) => ({
      assessment_id: assessmentId,
      question_id: qId,
      display_order: startOrder + idx,
    }))

    const { data: inserted, error: insertError } = await supabase
      .from('assessment_questions')
      .upsert(inserts, { onConflict: 'assessment_id,question_id' })
      .select('*')

    if (insertError) {
      console.error('Add assessment questions error:', insertError)
      return NextResponse.json({ error: 'Failed to add questions' }, { status: 500 })
    }

    return NextResponse.json(inserted, { status: 201 })
  } catch (err) {
    console.error('POST assessment questions error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
