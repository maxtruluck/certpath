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

    // For answer steps, sync content back to the linked questions row
    if (step.step_type === 'answer' && body.content?.question_id) {
      const qUpdates: Record<string, unknown> = {}
      const c = body.content
      if (c.question_text !== undefined) qUpdates.question_text = c.question_text
      if (c.question_type !== undefined) qUpdates.question_type = c.question_type
      if (c.options !== undefined) qUpdates.options = c.options
      if (c.correct_ids !== undefined) qUpdates.correct_option_ids = c.correct_ids
      if (c.explanation !== undefined) qUpdates.explanation = c.explanation
      if (c.difficulty !== undefined) qUpdates.difficulty = c.difficulty
      if (c.tags !== undefined) qUpdates.tags = c.tags
      if (c.option_explanations !== undefined) qUpdates.option_explanations = c.option_explanations
      if (c.acceptable_answers !== undefined) qUpdates.acceptable_answers = c.acceptable_answers
      if (c.match_mode !== undefined) qUpdates.match_mode = c.match_mode
      if (c.correct_order !== undefined) qUpdates.correct_order = c.correct_order
      if (c.matching_pairs !== undefined) qUpdates.matching_pairs = c.matching_pairs

      if (Object.keys(qUpdates).length > 0) {
        await supabase
          .from('questions')
          .update(qUpdates)
          .eq('id', c.question_id)
      }
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

    // Fetch step first to check for linked question
    const { data: step } = await supabase
      .from('lesson_steps')
      .select('id, sort_order, step_type, content')
      .eq('id', stepId)
      .eq('lesson_id', lessonId)
      .single()

    if (!step) {
      return NextResponse.json({ error: 'Step not found' }, { status: 404 })
    }

    // Soft-delete linked question for answer steps
    if (step.step_type === 'answer' && step.content?.question_id) {
      await supabase
        .from('questions')
        .update({ is_active: false })
        .eq('id', step.content.question_id)
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
