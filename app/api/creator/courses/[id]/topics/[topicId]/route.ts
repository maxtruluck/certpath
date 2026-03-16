import { NextRequest, NextResponse } from 'next/server'
import { getCreatorCourse } from '@/lib/supabase/get-creator-course'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; topicId: string }> }
) {
  try {
    const { id, topicId } = await params
    const { supabase, error } = await getCreatorCourse(id)
    if (error) return error

    const body = await request.json()
    const { title, description, module_id, display_order } = body

    const updates: Record<string, unknown> = {}
    if (title !== undefined) updates.title = title.trim()
    if (description !== undefined) updates.description = description
    if (display_order !== undefined) updates.display_order = display_order

    // Allow moving topic between modules
    if (module_id !== undefined) {
      // Verify target module belongs to this course
      const { data: targetMod } = await supabase
        .from('modules')
        .select('id')
        .eq('id', module_id)
        .eq('course_id', id)
        .single()

      if (!targetMod) {
        return NextResponse.json({ error: 'Target module not found' }, { status: 404 })
      }
      updates.module_id = module_id
    }

    const { data: topic, error: updateError } = await supabase
      .from('topics')
      .update(updates)
      .eq('id', topicId)
      .eq('course_id', id)
      .select('*')
      .single()

    if (updateError || !topic) {
      return NextResponse.json({ error: 'Failed to update topic' }, { status: 500 })
    }

    return NextResponse.json(topic)
  } catch (err) {
    console.error('PATCH topic error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; topicId: string }> }
) {
  try {
    const { id, topicId } = await params
    const { supabase, error } = await getCreatorCourse(id)
    if (error) return error

    const { error: deleteError } = await supabase
      .from('topics')
      .delete()
      .eq('id', topicId)
      .eq('course_id', id)

    if (deleteError) {
      console.error('Delete topic error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete topic' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE topic error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
