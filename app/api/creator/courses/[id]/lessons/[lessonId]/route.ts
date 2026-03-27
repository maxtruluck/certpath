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
    if (body.body !== undefined) updates.body = body.body
    if (body.display_order !== undefined) updates.display_order = body.display_order
    if (body.is_active !== undefined) updates.is_active = body.is_active
    if (body.video_url !== undefined) updates.video_url = body.video_url
    if (body.module_id !== undefined) updates.module_id = body.module_id

    if (Object.keys(updates).length === 0 && !body.question_section_updates) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    let lesson = null
    if (Object.keys(updates).length > 0) {
      const { data, error: updateError } = await supabase
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
      lesson = data
    }

    // Update question section_index values if provided (from useAutoSave recompute)
    if (body.question_section_updates && Array.isArray(body.question_section_updates)) {
      for (const update of body.question_section_updates) {
        if (update.question_id && update.section_index !== undefined) {
          await supabase
            .from('questions')
            .update({ section_index: update.section_index })
            .eq('id', update.question_id)
            .eq('course_id', id)
        }
      }
    }

    return NextResponse.json(lesson || { success: true })
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
