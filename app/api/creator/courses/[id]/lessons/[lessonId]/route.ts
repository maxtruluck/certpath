import { NextRequest, NextResponse } from 'next/server'
import { getCreatorCourse } from '@/lib/supabase/get-creator-course'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  try {
    const { id, lessonId } = await params
    const { supabase, error } = await getCreatorCourse(id)
    if (error) return error

    const body = await request.json()
    const updates: Record<string, unknown> = {}

    if (body.title !== undefined) updates.title = body.title.trim()
    if (body.display_order !== undefined) updates.display_order = body.display_order
    if (body.module_id !== undefined) updates.module_id = body.module_id

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { data: lesson, error: updateError } = await supabase
      .from('lessons')
      .update(updates)
      .eq('id', lessonId)
      .eq('course_id', id)
      .select('*')
      .single()

    if (updateError) {
      console.error('Update lesson error:', updateError)
      return NextResponse.json({ error: 'Failed to update lesson' }, { status: 500 })
    }

    return NextResponse.json(lesson)
  } catch (err) {
    console.error('PATCH lesson error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  try {
    const { id, lessonId } = await params
    const { supabase, error } = await getCreatorCourse(id)
    if (error) return error

    const { error: deleteError } = await supabase
      .from('lessons')
      .delete()
      .eq('id', lessonId)
      .eq('course_id', id)

    if (deleteError) {
      console.error('Delete lesson error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete lesson' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE lesson error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
