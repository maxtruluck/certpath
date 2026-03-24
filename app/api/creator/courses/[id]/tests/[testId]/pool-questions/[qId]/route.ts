import { NextRequest, NextResponse } from 'next/server'
import { getCreatorCourse } from '@/lib/supabase/get-creator-course'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; testId: string; qId: string }> }
) {
  try {
    const { id, qId } = await params
    const { supabase, error } = await getCreatorCourse(id)
    if (error) return error

    const body = await request.json()
    const updateData: Record<string, any> = {}

    if (body.content) updateData.content = body.content
    if (body.sort_order != null) updateData.sort_order = body.sort_order

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data: question, error: updateError } = await supabase
      .from('question_pool')
      .update(updateData)
      .eq('id', qId)
      .eq('course_id', id)
      .select('*')
      .single()

    if (updateError || !question) {
      return NextResponse.json({ error: 'Pool question not found' }, { status: 404 })
    }

    return NextResponse.json(question)
  } catch (err) {
    console.error('PATCH pool-questions/[qId] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; testId: string; qId: string }> }
) {
  try {
    const { id, qId } = await params
    const { supabase, error } = await getCreatorCourse(id)
    if (error) return error

    const { error: deleteError } = await supabase
      .from('question_pool')
      .delete()
      .eq('id', qId)
      .eq('course_id', id)

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE pool-questions/[qId] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
