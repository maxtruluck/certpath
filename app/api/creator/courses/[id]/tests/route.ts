import { NextRequest, NextResponse } from 'next/server'
import { getCreatorCourse } from '@/lib/supabase/get-creator-course'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { supabase, error } = await getCreatorCourse(id)
    if (error) return error

    const { data: tests } = await supabase
      .from('tests')
      .select('*')
      .eq('course_id', id)
      .order('sort_order')

    return NextResponse.json(tests || [])
  } catch (err) {
    console.error('GET creator/tests error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { supabase, error } = await getCreatorCourse(id)
    if (error) return error

    const body = await request.json()
    const {
      title,
      test_type,
      module_id,
      question_count = 10,
      time_limit_minutes,
      passing_score = 70,
      max_attempts,
      shuffle_questions = true,
      shuffle_options = true,
      show_results = 'after_submit',
    } = body

    if (!title || !test_type) {
      return NextResponse.json({ error: 'title and test_type are required' }, { status: 400 })
    }

    if (!['module_quiz', 'practice_exam', 'final_assessment'].includes(test_type)) {
      return NextResponse.json({ error: 'Invalid test_type' }, { status: 400 })
    }

    // If module_quiz, module_id is required
    if (test_type === 'module_quiz' && !module_id) {
      return NextResponse.json({ error: 'module_id is required for module_quiz' }, { status: 400 })
    }

    // Get next sort_order
    const { data: existing } = await supabase
      .from('tests')
      .select('sort_order')
      .eq('course_id', id)
      .order('sort_order', { ascending: false })
      .limit(1)

    const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0

    const insertData: Record<string, any> = {
      course_id: id,
      title,
      test_type,
      question_count,
      passing_score,
      shuffle_questions,
      shuffle_options,
      show_results,
      sort_order: nextOrder,
    }

    if (module_id) insertData.module_id = module_id
    if (time_limit_minutes != null) insertData.time_limit_minutes = time_limit_minutes
    if (max_attempts != null) insertData.max_attempts = max_attempts

    const { data: test, error: insertError } = await supabase
      .from('tests')
      .insert(insertData)
      .select('*')
      .single()

    if (insertError) {
      console.error('Insert test error:', insertError)
      return NextResponse.json({ error: 'Failed to create test' }, { status: 500 })
    }

    return NextResponse.json(test, { status: 201 })
  } catch (err) {
    console.error('POST creator/tests error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
