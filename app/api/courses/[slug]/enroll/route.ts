import { NextRequest, NextResponse } from 'next/server'
import { getApiUser } from '@/lib/supabase/get-user-api'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { supabase, userId, error } = await getApiUser()
    if (error) return error

    const { slug } = await params

    // Look up course by slug
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Check if already enrolled
    const { data: existing } = await supabase
      .from('user_courses')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', course.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Already enrolled in this course' }, { status: 409 })
    }

    // Find first topic (lowest display_order)
    const { data: firstTopic } = await supabase
      .from('topics')
      .select('id')
      .eq('course_id', course.id)
      .order('display_order', { ascending: true })
      .limit(1)
      .maybeSingle()

    // Create enrollment
    const { data: userCourse, error: enrollError } = await supabase
      .from('user_courses')
      .insert({
        user_id: userId,
        course_id: course.id,
        status: 'active',
        current_topic_id: firstTopic?.id || null,
        readiness_score: 0,
        questions_seen: 0,
        questions_correct: 0,
        sessions_completed: 0,
      })
      .select()
      .single()

    if (enrollError) {
      console.error('Enroll error:', enrollError)
      return NextResponse.json({ error: 'Failed to enroll' }, { status: 500 })
    }

    return NextResponse.json({ user_course: userCourse })
  } catch (err) {
    console.error('POST /api/courses/[slug]/enroll error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
