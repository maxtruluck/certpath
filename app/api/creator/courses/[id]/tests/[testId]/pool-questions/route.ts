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

    // Get the test to find its module_id and type
    const { data: test } = await supabase
      .from('tests')
      .select('module_id, test_type')
      .eq('id', testId)
      .eq('course_id', id)
      .single()

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    // Standalone pool questions for this scope
    let query = supabase
      .from('question_pool')
      .select('*')
      .eq('course_id', id)
      .order('sort_order')

    if (test.test_type === 'module_quiz' && test.module_id) {
      query = query.eq('module_id', test.module_id)
    }

    const { data: questions } = await query

    return NextResponse.json(questions || [])
  } catch (err) {
    console.error('GET pool-questions error:', err)
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

    // Get the test to find its module_id
    const { data: test } = await supabase
      .from('tests')
      .select('module_id, test_type')
      .eq('id', testId)
      .eq('course_id', id)
      .single()

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    const body = await request.json()
    const { content, module_id } = body

    if (!content || !content.question_text) {
      return NextResponse.json({ error: 'content with question_text is required' }, { status: 400 })
    }

    // Determine module_id: for module_quiz use the test's module, otherwise allow explicit
    const targetModuleId = test.test_type === 'module_quiz' ? test.module_id : (module_id || test.module_id)

    if (!targetModuleId) {
      return NextResponse.json({ error: 'module_id is required for course-level pool questions' }, { status: 400 })
    }

    // Get next sort_order
    const { data: existing } = await supabase
      .from('question_pool')
      .select('sort_order')
      .eq('module_id', targetModuleId)
      .order('sort_order', { ascending: false })
      .limit(1)

    const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0

    const { data: question, error: insertError } = await supabase
      .from('question_pool')
      .insert({
        module_id: targetModuleId,
        course_id: id,
        content,
        sort_order: nextOrder,
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('Insert pool question error:', insertError)
      return NextResponse.json({ error: 'Failed to create pool question' }, { status: 500 })
    }

    return NextResponse.json(question, { status: 201 })
  } catch (err) {
    console.error('POST pool-questions error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
