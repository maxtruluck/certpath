import { NextRequest, NextResponse } from 'next/server'
import { getApiUser } from '@/lib/supabase/get-user-api'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { supabase, userId, error } = await getApiUser()
    if (error) return error

    // Get creator
    const { data: creator } = await supabase
      .from('creators')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    // Get course (must belong to this creator)
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .eq('creator_id', creator.id)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Get modules
    const { data: modules } = await supabase
      .from('modules')
      .select('*')
      .eq('course_id', id)
      .order('display_order')

    // Get lessons directly
    const { data: lessons } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', id)
      .eq('is_active', true)
      .order('display_order')

    // Count questions per lesson
    const { data: questions } = await supabase
      .from('questions')
      .select('id, lesson_id, module_id')
      .eq('course_id', id)
      .eq('is_active', true)

    const questionsByLesson = new Map<string, number>()
    for (const q of questions || []) {
      if (q.lesson_id) {
        questionsByLesson.set(q.lesson_id, (questionsByLesson.get(q.lesson_id) || 0) + 1)
      }
    }

    // Count steps per lesson
    const { data: steps } = await supabase
      .from('lesson_steps')
      .select('id, lesson_id')
      .in('lesson_id', (lessons || []).map((l: any) => l.id))

    const stepsByLesson = new Map<string, number>()
    for (const s of steps || []) {
      stepsByLesson.set(s.lesson_id, (stepsByLesson.get(s.lesson_id) || 0) + 1)
    }

    const modulesWithLessons = (modules || []).map((mod: any) => ({
      ...mod,
      lessons: (lessons || [])
        .filter((l: any) => l.module_id === mod.id)
        .map((l: any) => ({
          ...l,
          question_count: questionsByLesson.get(l.id) || 0,
          word_count: (l.body || '').split(/\s+/).filter(Boolean).length,
          step_count: stepsByLesson.get(l.id) || 0,
        })),
      question_count: (questions || []).filter((q: any) => q.module_id === mod.id).length,
    }))

    return NextResponse.json({
      ...course,
      modules: modulesWithLessons,
      stats: {
        module_count: (modules || []).length,
        lesson_count: (lessons || []).length,
        question_count: (questions || []).length,
      },
    })
  } catch (err) {
    console.error('GET /api/creator/courses/[id] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { supabase, userId, error } = await getApiUser()
    if (error) return error

    const { data: creator } = await supabase
      .from('creators')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    const body = await request.json()

    // Only include known, safe-to-update fields
    const SAFE_FIELDS = [
      'title', 'description', 'category', 'difficulty', 'is_free', 'price_cents',
      'thumbnail_url', 'provider_name', 'provider_url', 'exam_fee_cents',
      'passing_score', 'exam_duration_minutes', 'total_questions_on_exam', 'max_score',
      'prerequisites', 'learning_objectives', 'card_color', 'tags', 'status',
      'slug', 'guidebook_content',
    ]
    // Fields from migration 038 -- may not exist yet
    const NEW_FIELDS = ['cover_image_url', 'progression_type', 'estimated_duration_minutes', 'last_wizard_step']

    const updates: Record<string, unknown> = {}
    for (const key of SAFE_FIELDS) {
      if (body[key] !== undefined) updates[key] = body[key]
    }

    // Try including new fields, fall back to safe-only if columns don't exist yet
    const fullUpdates = { ...updates }
    for (const key of NEW_FIELDS) {
      if (body[key] !== undefined) fullUpdates[key] = body[key]
    }

    if (Object.keys(fullUpdates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    let { data: course, error: updateError } = await supabase
      .from('courses')
      .update(fullUpdates)
      .eq('id', id)
      .eq('creator_id', creator.id)
      .select('*')
      .single()

    // If update failed (possibly due to unmigrated columns), retry with safe fields only
    if (updateError && Object.keys(updates).length > 0) {
      const retry = await supabase
        .from('courses')
        .update(updates)
        .eq('id', id)
        .eq('creator_id', creator.id)
        .select('*')
        .single()
      course = retry.data
      updateError = retry.error
    }

    if (updateError || !course) {
      console.error('Course update error:', updateError)
      return NextResponse.json({ error: 'Failed to update course' }, { status: 500 })
    }

    return NextResponse.json(course)
  } catch (err) {
    console.error('PATCH /api/creator/courses/[id] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { supabase, userId, error } = await getApiUser()
    if (error) return error

    const { data: creator } = await supabase
      .from('creators')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    // Check course status
    const { data: course } = await supabase
      .from('courses')
      .select('status')
      .eq('id', id)
      .eq('creator_id', creator.id)
      .single()

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    if (course.status === 'published') {
      return NextResponse.json({ error: 'Cannot delete a published course' }, { status: 409 })
    }

    const { error: deleteError } = await supabase
      .from('courses')
      .delete()
      .eq('id', id)
      .eq('creator_id', creator.id)

    if (deleteError) {
      console.error('Course delete error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/creator/courses/[id] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
