import { NextRequest, NextResponse } from 'next/server'
import { getApiUser } from '@/lib/supabase/get-user-api'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { supabase, userId, error } = await getApiUser()
    if (error) return error

    const { slug } = await params

    // Fetch course with creator
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select(`
        *,
        creator:creators(id, creator_name, bio, expertise_areas, credentials)
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Fetch stats
    const [modulesRes, topicsRes, questionsRes] = await Promise.all([
      supabase.from('modules').select('id').eq('course_id', course.id),
      supabase.from('topics').select('id').eq('course_id', course.id),
      supabase.from('questions').select('id').eq('course_id', course.id).eq('is_active', true),
    ])

    const stats = {
      module_count: modulesRes.data?.length || 0,
      topic_count: topicsRes.data?.length || 0,
      question_count: questionsRes.data?.length || 0,
    }

    // Cert info
    const certInfo = {
      passing_score: course.passing_score,
      max_score: course.max_score,
      exam_duration_minutes: course.exam_duration_minutes,
      total_questions_on_exam: course.total_questions_on_exam,
      exam_fee_cents: course.exam_fee_cents,
      provider_name: course.provider_name,
      provider_url: course.provider_url,
    }

    // User progress
    const { data: userProgress } = await supabase
      .from('user_courses')
      .select('*')
      .eq('course_id', course.id)
      .eq('user_id', userId)
      .maybeSingle()

    return NextResponse.json({
      ...course,
      stats,
      cert_info: certInfo,
      user_progress: userProgress || null,
    })
  } catch (err) {
    console.error('GET /api/courses/[slug] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
