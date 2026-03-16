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

    // Get modules with topics and question counts
    const { data: modules } = await supabase
      .from('modules')
      .select('*')
      .eq('course_id', id)
      .order('display_order')

    const { data: topics } = await supabase
      .from('topics')
      .select('*')
      .eq('course_id', id)
      .order('display_order')

    const [questionsRes, lessonsRes] = await Promise.all([
      supabase
        .from('questions')
        .select('id, topic_id, module_id')
        .eq('course_id', id)
        .eq('is_active', true),
      supabase
        .from('lessons')
        .select('id, topic_id')
        .eq('course_id', id)
        .eq('is_active', true),
    ])

    const questions = questionsRes.data || []
    const lessons = lessonsRes.data || []

    // Count lessons per topic
    const lessonCountByTopic = new Map<string, number>()
    for (const l of lessons) {
      lessonCountByTopic.set(l.topic_id, (lessonCountByTopic.get(l.topic_id) || 0) + 1)
    }

    const modulesWithTopics = (modules || []).map((mod: any) => ({
      ...mod,
      topics: (topics || [])
        .filter((t: any) => t.module_id === mod.id)
        .map((t: any) => ({
          ...t,
          question_count: questions.filter((q: any) => q.topic_id === t.id).length,
          lesson_count: lessonCountByTopic.get(t.id) || 0,
        })),
      question_count: questions.filter((q: any) => q.module_id === mod.id).length,
    }))

    return NextResponse.json({
      ...course,
      modules: modulesWithTopics,
      stats: {
        module_count: (modules || []).length,
        topic_count: (topics || []).length,
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

    // Remove fields that shouldn't be updated directly
    const { id: _id, creator_id: _cid, created_at: _ca, ...updates } = body

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
