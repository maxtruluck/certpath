import { NextRequest, NextResponse } from 'next/server'
import { getCreatorCourse } from '@/lib/supabase/get-creator-course'

const VALID_QUESTION_TYPES = [
  'multiple_choice', 'multiple_select', 'true_false',
  'fill_blank', 'ordering', 'matching',
]

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; testId: string }> }
) {
  try {
    const { id, testId } = await params
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

    const { data: questions, error: fetchError } = await supabase
      .from('test_questions')
      .select('*')
      .eq('test_id', testId)
      .order('sort_order')

    if (fetchError) {
      console.error('Fetch test questions error:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
    }

    return NextResponse.json(questions || [])
  } catch (err) {
    console.error('GET test questions error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; testId: string }> }
) {
  try {
    const { id, testId } = await params
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

    if (!body.question_text?.trim()) {
      return NextResponse.json({ error: 'question_text is required' }, { status: 400 })
    }

    const questionType = body.question_type || 'multiple_choice'
    if (!VALID_QUESTION_TYPES.includes(questionType)) {
      return NextResponse.json(
        { error: `Invalid question_type. Must be one of: ${VALID_QUESTION_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    // Auto-increment sort_order
    const { data: lastQ } = await supabase
      .from('test_questions')
      .select('sort_order')
      .eq('test_id', testId)
      .order('sort_order', { ascending: false })
      .limit(1)

    const nextOrder = lastQ && lastQ.length > 0 ? lastQ[0].sort_order + 1 : 0

    const { data: question, error: insertError } = await supabase
      .from('test_questions')
      .insert({
        test_id: testId,
        sort_order: nextOrder,
        question_text: body.question_text.trim(),
        question_type: questionType,
        options: body.options || [],
        correct_option_ids: body.correct_option_ids || [],
        explanation: body.explanation || '',
        option_explanations: body.option_explanations || null,
        acceptable_answers: body.acceptable_answers || null,
        correct_order: body.correct_order || null,
        matching_pairs: body.matching_pairs || null,
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('Insert test question error:', insertError)
      return NextResponse.json({ error: 'Failed to create question' }, { status: 500 })
    }

    return NextResponse.json(question, { status: 201 })
  } catch (err) {
    console.error('POST test question error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
