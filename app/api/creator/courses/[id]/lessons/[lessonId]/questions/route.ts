import { NextRequest, NextResponse } from 'next/server'
import { getCreatorCourse } from '@/lib/supabase/get-creator-course'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  try {
    const { id, lessonId } = await params
    const { supabase, error } = await getCreatorCourse(id)
    if (error) return error

    const { data: questions, error: fetchError } = await supabase
      .from('questions')
      .select('*')
      .eq('lesson_id', lessonId)
      .eq('course_id', id)
      .eq('is_active', true)
      .order('created_at')

    if (fetchError) {
      console.error('Fetch questions error:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
    }

    return NextResponse.json(questions || [])
  } catch (err) {
    console.error('GET lesson questions error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  try {
    const { id, lessonId } = await params
    const { supabase, creatorId, error } = await getCreatorCourse(id)
    if (error) return error

    const body = await request.json()
    const {
      question_text,
      question_type = 'multiple_choice',
      options = [],
      correct_option_ids = [],
      explanation = '',
      difficulty = 3,
      tags = [],
      blooms_level = 'remember',
      option_explanations = null,
      acceptable_answers = null,
      match_mode = 'exact',
      correct_order = null,
      matching_pairs = null,
    } = body

    if (!question_text?.trim()) {
      return NextResponse.json({ error: 'question_text is required' }, { status: 400 })
    }

    // Type-specific validation
    if (question_type === 'fill_blank') {
      if (!acceptable_answers || !Array.isArray(acceptable_answers) || acceptable_answers.length === 0) {
        return NextResponse.json({ error: 'fill_blank requires at least one acceptable_answer' }, { status: 400 })
      }
    }
    if (question_type === 'ordering') {
      if (!options || options.length < 3) {
        return NextResponse.json({ error: 'ordering requires at least 3 options' }, { status: 400 })
      }
      if (!correct_order || !Array.isArray(correct_order) || correct_order.length !== options.length) {
        return NextResponse.json({ error: 'ordering requires correct_order with all option IDs' }, { status: 400 })
      }
    }
    if (question_type === 'matching') {
      if (!matching_pairs || !Array.isArray(matching_pairs) || matching_pairs.length < 3) {
        return NextResponse.json({ error: 'matching requires at least 3 pairs' }, { status: 400 })
      }
    }

    // Get lesson to find module_id and optional topic_id
    const { data: lesson } = await supabase
      .from('lessons')
      .select('id, module_id, topic_id')
      .eq('id', lessonId)
      .eq('course_id', id)
      .single()

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    const insertData: Record<string, unknown> = {
      lesson_id: lessonId,
      module_id: lesson.module_id,
      topic_id: lesson.topic_id || null,
      course_id: id,
      creator_id: creatorId,
      question_text: question_text.trim(),
      question_type,
      options: question_type === 'fill_blank' || question_type === 'matching' ? [] : options,
      correct_option_ids: question_type === 'fill_blank' || question_type === 'matching' ? [] : correct_option_ids,
      explanation,
      difficulty: Math.min(5, Math.max(1, difficulty)),
      tags,
      source: 'creator_original',
      blooms_level,
    }

    // Section index for grouping questions by ## heading
    if (body.section_index !== undefined) {
      insertData.section_index = body.section_index
    }

    // Add type-specific fields if provided
    if (option_explanations) insertData.option_explanations = option_explanations
    if (acceptable_answers) insertData.acceptable_answers = acceptable_answers
    if (match_mode && question_type === 'fill_blank') insertData.match_mode = match_mode
    if (correct_order) insertData.correct_order = correct_order
    if (matching_pairs) insertData.matching_pairs = matching_pairs

    const { data: question, error: insertError } = await supabase
      .from('questions')
      .insert(insertData)
      .select('*')
      .single()

    if (insertError) {
      console.error('Create question error:', insertError)
      return NextResponse.json({ error: 'Failed to create question' }, { status: 500 })
    }

    return NextResponse.json(question, { status: 201 })
  } catch (err) {
    console.error('POST lesson question error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
