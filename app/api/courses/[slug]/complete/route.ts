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

    // Fetch course by slug
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title')
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Verify enrollment and get aggregate stats
    const { data: userCourse } = await supabase
      .from('user_courses')
      .select('questions_seen, questions_correct, sessions_completed')
      .eq('user_id', userId)
      .eq('course_id', course.id)
      .maybeSingle()

    if (!userCourse) {
      return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 })
    }

    // Fetch lesson progress and total lessons in parallel
    const [
      { data: lessonProgress },
      { data: allLessons },
    ] = await Promise.all([
      supabase
        .from('user_lesson_progress')
        .select('lesson_id, status')
        .eq('user_id', userId)
        .eq('course_id', course.id),
      supabase
        .from('lessons')
        .select('id')
        .eq('course_id', course.id),
    ])

    // Lesson progress stats
    const totalLessons = allLessons?.length || 0
    const completedLessons = (lessonProgress || []).filter(
      (p: any) => p.status === 'completed'
    ).length

    const accuracy = userCourse.questions_seen > 0
      ? userCourse.questions_correct / userCourse.questions_seen
      : 0

    return NextResponse.json({
      course_title: course.title,
      questions_seen: userCourse.questions_seen || 0,
      accuracy,
      sessions_completed: userCourse.sessions_completed || 0,
      lesson_progress: {
        completed: completedLessons,
        total: totalLessons,
      },
    })
  } catch (err) {
    console.error('GET /api/courses/[slug]/complete error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
