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

    const { data: assessments, error: fetchError } = await supabase
      .from('assessments')
      .select('*')
      .eq('course_id', id)
      .eq('is_active', true)
      .order('assessment_type')
      .order('display_order')

    if (fetchError) {
      return NextResponse.json({ error: 'Failed to fetch assessments' }, { status: 500 })
    }

    return NextResponse.json(assessments || [])
  } catch (err) {
    console.error('GET assessments error:', err)
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
      assessment_type,
      module_id = null,
      topic_id = null,
      description = '',
      question_count = 10,
      time_limit_minutes = null,
      passing_score_percent = 70,
      shuffle_questions = true,
      show_explanations = true,
      display_order = 0,
    } = body

    if (!title?.trim() || !assessment_type) {
      return NextResponse.json({ error: 'title and assessment_type are required' }, { status: 400 })
    }

    const validTypes = ['topic_quiz', 'module_test', 'practice_exam']
    if (!validTypes.includes(assessment_type)) {
      return NextResponse.json({ error: 'Invalid assessment_type' }, { status: 400 })
    }

    const { data: assessment, error: insertError } = await supabase
      .from('assessments')
      .insert({
        course_id: id,
        module_id,
        topic_id,
        title: title.trim(),
        assessment_type,
        description,
        question_count,
        time_limit_minutes,
        passing_score_percent,
        shuffle_questions,
        show_explanations,
        display_order,
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('Create assessment error:', insertError)
      return NextResponse.json({ error: 'Failed to create assessment' }, { status: 500 })
    }

    return NextResponse.json(assessment, { status: 201 })
  } catch (err) {
    console.error('POST assessment error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
