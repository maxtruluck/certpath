import { NextRequest, NextResponse } from 'next/server'
import { getCreatorCourse } from '@/lib/supabase/get-creator-course'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lessonId: string; stepId: string }> }
) {
  try {
    const { id, lessonId, stepId } = await params
    const { supabase, error } = await getCreatorCourse(id)
    if (error) return error

    const body = await request.json()
    const updates: Record<string, unknown> = {}

    if (body.title !== undefined) updates.title = body.title
    if (body.content !== undefined) updates.content = body.content

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { data: step, error: updateError } = await supabase
      .from('lesson_steps')
      .update(updates)
      .eq('id', stepId)
      .eq('lesson_id', lessonId)
      .select('*')
      .single()

    if (updateError) {
      console.error('Update step error:', updateError)
      return NextResponse.json({ error: 'Failed to update step' }, { status: 500 })
    }

    return NextResponse.json(step)
  } catch (err) {
    console.error('PATCH step error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; lessonId: string; stepId: string }> }
) {
  try {
    const { id, lessonId, stepId } = await params
    const { supabase, error } = await getCreatorCourse(id)
    if (error) return error

    // Fetch step to verify it exists
    const { data: step } = await supabase
      .from('lesson_steps')
      .select('id, sort_order')
      .eq('id', stepId)
      .eq('lesson_id', lessonId)
      .single()

    if (!step) {
      return NextResponse.json({ error: 'Step not found' }, { status: 404 })
    }

    // Delete the step
    const { error: deleteError } = await supabase
      .from('lesson_steps')
      .delete()
      .eq('id', stepId)

    if (deleteError) {
      console.error('Delete step error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete step' }, { status: 500 })
    }

    // Re-index remaining steps
    const { data: remaining } = await supabase
      .from('lesson_steps')
      .select('id, sort_order')
      .eq('lesson_id', lessonId)
      .order('sort_order')

    if (remaining) {
      for (let i = 0; i < remaining.length; i++) {
        if (remaining[i].sort_order !== i) {
          await supabase
            .from('lesson_steps')
            .update({ sort_order: i })
            .eq('id', remaining[i].id)
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE step error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
