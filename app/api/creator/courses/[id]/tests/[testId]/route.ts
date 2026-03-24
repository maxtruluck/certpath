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

    // Get pool size info
    const poolInfo = await getPoolInfo(supabase, id, test.module_id, test.test_type)

    return NextResponse.json({ ...test, pool: poolInfo })
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
    const allowedFields = [
      'title', 'question_count', 'time_limit_minutes', 'passing_score',
      'max_attempts', 'shuffle_questions', 'shuffle_options', 'show_results',
      'sort_order', 'status',
    ]

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

// ── Pool info helper ──────────────────────────────────────────────────────

async function getPoolInfo(
  supabase: any,
  courseId: string,
  moduleId: string | null,
  testType: string,
) {
  // Determine scope
  const isModuleScope = testType === 'module_quiz' && moduleId

  // Count answer steps (questions from lessons)
  let lessonQuestionCount = 0
  if (isModuleScope) {
    // Get lessons for this module
    const { data: lessons } = await supabase
      .from('lessons')
      .select('id')
      .eq('module_id', moduleId)
      .eq('is_active', true)

    if (lessons && lessons.length > 0) {
      const lessonIds = lessons.map((l: any) => l.id)
      const { count } = await supabase
        .from('lesson_steps')
        .select('id', { count: 'exact', head: true })
        .in('lesson_id', lessonIds)
        .eq('step_type', 'answer')

      lessonQuestionCount = count || 0
    }
  } else {
    // Course-wide: all answer steps
    const { data: lessons } = await supabase
      .from('lessons')
      .select('id')
      .eq('course_id', courseId)
      .eq('is_active', true)

    if (lessons && lessons.length > 0) {
      const lessonIds = lessons.map((l: any) => l.id)
      const { count } = await supabase
        .from('lesson_steps')
        .select('id', { count: 'exact', head: true })
        .in('lesson_id', lessonIds)
        .eq('step_type', 'answer')

      lessonQuestionCount = count || 0
    }
  }

  // Count standalone pool questions
  let poolQuestionCount = 0
  if (isModuleScope) {
    const { count } = await supabase
      .from('question_pool')
      .select('id', { count: 'exact', head: true })
      .eq('module_id', moduleId)

    poolQuestionCount = count || 0
  } else {
    const { count } = await supabase
      .from('question_pool')
      .select('id', { count: 'exact', head: true })
      .eq('course_id', courseId)

    poolQuestionCount = count || 0
  }

  return {
    total: lessonQuestionCount + poolQuestionCount,
    from_lessons: lessonQuestionCount,
    from_pool: poolQuestionCount,
  }
}
