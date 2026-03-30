import { NextRequest, NextResponse } from 'next/server'
import { getApiUser } from '@/lib/supabase/get-user-api'
import { getCategoryColor } from '@/lib/category-colors'

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

    // Get lessons directly (no is_active filter)
    const { data: lessons } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', id)
      .order('display_order')

    // Count steps per lesson, and answer-type steps per lesson
    const { data: steps } = await supabase
      .from('lesson_steps')
      .select('id, lesson_id, step_type')
      .in('lesson_id', (lessons || []).map((l: any) => l.id))

    const stepsByLesson = new Map<string, number>()
    const answerStepsByLesson = new Map<string, number>()
    for (const s of steps || []) {
      stepsByLesson.set(s.lesson_id, (stepsByLesson.get(s.lesson_id) || 0) + 1)
      if (s.step_type === 'answer') {
        answerStepsByLesson.set(s.lesson_id, (answerStepsByLesson.get(s.lesson_id) || 0) + 1)
      }
    }

    const modulesWithLessons = (modules || []).map((mod: any) => {
      const moduleLessons = (lessons || [])
        .filter((l: any) => l.module_id === mod.id)
        .map((l: any) => ({
          ...l,
          question_count: answerStepsByLesson.get(l.id) || 0,
          step_count: stepsByLesson.get(l.id) || 0,
        }))

      return {
        ...mod,
        lessons: moduleLessons,
      }
    })

    const totalStepCount = (steps || []).length

    return NextResponse.json({
      ...course,
      modules: modulesWithLessons,
      stats: {
        module_count: (modules || []).length,
        lesson_count: (lessons || []).length,
        question_count: totalStepCount,
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
      'currency', 'tags', 'learning_objectives', 'card_color', 'status', 'slug',
      'estimated_duration',
    ]

    const updates: Record<string, unknown> = {}
    for (const key of SAFE_FIELDS) {
      if (body[key] !== undefined) updates[key] = body[key]
    }

    // Auto-set card_color from category if category changed and no explicit card_color
    if (updates.category && !updates.card_color) {
      updates.card_color = getCategoryColor(updates.category as string)
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { data: course, error: updateError } = await supabase
      .from('courses')
      .update(updates)
      .eq('id', id)
      .eq('creator_id', creator.id)
      .select('*')
      .single()

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
