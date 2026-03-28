import { NextRequest, NextResponse } from 'next/server'
import { getCreatorCourse } from '@/lib/supabase/get-creator-course'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; testId: string; questionId: string }> }
) {
  try {
    const { id, testId, questionId } = await params
    const { supabase, error } = await getCreatorCourse(id)
    if (error) return error

    // Verify test belongs to course
    const { data: test } = await supabase
      .from('tests')
      .select('id')
      .eq('id', testId)
      .eq('course_id', id)
      .single()

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    const body = await request.json()

    const allowedFields = [
      'question_text', 'question_type', 'options', 'correct_option_ids',
      'explanation', 'option_explanations', 'acceptable_answers',
      'correct_order', 'matching_pairs', 'sort_order',
    ]

    const updates: Record<string, unknown> = {}
    for (const key of allowedFields) {
      if (body[key] !== undefined) updates[key] = body[key]
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // Validate question_type if provided
    if (updates.question_type) {
      const validTypes = [
        'multiple_choice', 'multiple_select', 'true_false',
        'fill_blank', 'ordering', 'matching',
      ]
      if (!validTypes.includes(updates.question_type as string)) {
        return NextResponse.json({ error: 'Invalid question_type' }, { status: 400 })
      }
    }

    const { data: question, error: updateError } = await supabase
      .from('test_questions')
      .update(updates)
      .eq('id', questionId)
      .eq('test_id', testId)
      .select('*')
      .single()

    if (updateError || !question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    return NextResponse.json(question)
  } catch (err) {
    console.error('PATCH test question error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; testId: string; questionId: string }> }
) {
  try {
    const { id, testId, questionId } = await params
    const { supabase, error } = await getCreatorCourse(id)
    if (error) return error

    // Verify test belongs to course
    const { data: test } = await supabase
      .from('tests')
      .select('id')
      .eq('id', testId)
      .eq('course_id', id)
      .single()

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    const { error: deleteError } = await supabase
      .from('test_questions')
      .delete()
      .eq('id', questionId)
      .eq('test_id', testId)

    if (deleteError) {
      console.error('Delete test question error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE test question error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
