import { NextRequest, NextResponse } from 'next/server'
import { getApiUser } from '@/lib/supabase/get-user-api'

/**
 * Creator preview: fetch course overview data for an unpublished course.
 * Returns the same shape as /api/courses/[slug] so the course overview page
 * can render it identically.
 */
export async function GET(request: NextRequest) {
  try {
    const { supabase, userId, error } = await getApiUser()
    if (error) return error

    const courseId = request.nextUrl.searchParams.get('courseId')
    if (!courseId) {
      return NextResponse.json({ error: 'courseId is required' }, { status: 400 })
    }

    // Verify creator ownership
    const { data: creator } = await supabase
      .from('creators')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (!creator) {
      return NextResponse.json({ error: 'Not a creator' }, { status: 403 })
    }

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .eq('creator_id', creator.id)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Fetch stats
    const [modulesRes, lessonsRes, questionsRes] = await Promise.all([
      supabase.from('modules').select('id').eq('course_id', course.id),
      supabase.from('lessons').select('id').eq('course_id', course.id).eq('is_active', true),
      supabase.from('questions').select('id').eq('course_id', course.id).eq('is_active', true),
    ])

    const stats = {
      module_count: modulesRes.data?.length || 0,
      lesson_count: lessonsRes.data?.length || 0,
      question_count: questionsRes.data?.length || 0,
    }

    const certInfo = {
      passing_score: course.passing_score,
      max_score: course.max_score,
      exam_duration_minutes: course.exam_duration_minutes,
      total_questions_on_exam: course.total_questions_on_exam,
      exam_fee_cents: course.exam_fee_cents,
      provider_name: course.provider_name,
      provider_url: course.provider_url,
    }

    return NextResponse.json({
      ...course,
      stats,
      cert_info: certInfo,
      user_progress: null,
    })
  } catch (err) {
    console.error('GET creator/preview/course error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
