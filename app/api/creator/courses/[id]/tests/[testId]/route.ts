import { NextRequest, NextResponse } from 'next/server'
import { getCreatorCourse } from '@/lib/supabase/get-creator-course'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; testId: string }> }
) {
  try {
    const { id, testId } = await params
    const { supabase, error } = await getCreatorCourse(id)
    if (error) return error

    const { data: test } = await supabase
      .from('tests')
      .select('*')
      .eq('id', testId)
      .eq('course_id', id)
      .single()

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    // Fetch questions for this test
    const { data: questions } = await supabase
      .from('test_questions')
      .select('*')
      .eq('test_id', testId)

    const questionList = questions || []

    return NextResponse.json({
      ...test,
      questions: questionList,
      question_count: questionList.length,
    })
  } catch (err) {
    console.error('GET creator/tests/[testId] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; testId: string }> }
) {
  try {
    const { id, testId } = await params
    const { supabase, error } = await getCreatorCourse(id)
    if (error) return error

    const body = await request.json()
    const allowedFields = ['title', 'passing_score', 'time_limit_minutes']

    const updateData: Record<string, any> = {}
    for (const key of allowedFields) {
      if (key in body) updateData[key] = body[key]
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data: test, error: updateError } = await supabase
      .from('tests')
      .update(updateData)
      .eq('id', testId)
      .eq('course_id', id)
      .select('*')
      .single()

    if (updateError || !test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    return NextResponse.json(test)
  } catch (err) {
    console.error('PATCH creator/tests/[testId] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; testId: string }> }
) {
  try {
    const { id, testId } = await params
    const { supabase, error } = await getCreatorCourse(id)
    if (error) return error

    const { error: deleteError } = await supabase
      .from('tests')
      .delete()
      .eq('id', testId)
      .eq('course_id', id)

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete test' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE creator/tests/[testId] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
