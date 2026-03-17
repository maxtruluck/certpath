import { NextRequest, NextResponse } from 'next/server'
import { getCreatorCourse } from '@/lib/supabase/get-creator-course'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assessmentId: string }> }
) {
  try {
    const { id, assessmentId } = await params
    const { supabase, error } = await getCreatorCourse(id)
    if (error) return error

    const body = await request.json()
    const allowedFields = [
      'title', 'description', 'question_count', 'time_limit_minutes',
      'passing_score_percent', 'shuffle_questions', 'show_explanations',
      'display_order', 'is_active',
    ]

    const updates: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) updates[field] = body[field]
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { data: assessment, error: updateError } = await supabase
      .from('assessments')
      .update(updates)
      .eq('id', assessmentId)
      .eq('course_id', id)
      .select('*')
      .single()

    if (updateError) {
      console.error('Update assessment error:', updateError)
      return NextResponse.json({ error: 'Failed to update assessment' }, { status: 500 })
    }

    return NextResponse.json(assessment)
  } catch (err) {
    console.error('PATCH assessment error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; assessmentId: string }> }
) {
  try {
    const { id, assessmentId } = await params
    const { supabase, error } = await getCreatorCourse(id)
    if (error) return error

    const { error: deleteError } = await supabase
      .from('assessments')
      .delete()
      .eq('id', assessmentId)
      .eq('course_id', id)

    if (deleteError) {
      console.error('Delete assessment error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete assessment' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE assessment error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
