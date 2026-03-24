import { NextRequest, NextResponse } from 'next/server'
import { getApiUser } from '@/lib/supabase/get-user-api'

/**
 * Look up a course's ID and card_color from a lesson ID.
 * Used by the lesson player in preview mode (draft courses not yet published).
 * Only works for creators who own the course.
 */
export async function GET(request: NextRequest) {
  try {
    const { supabase, userId, error } = await getApiUser()
    if (error) return error

    const lessonId = request.nextUrl.searchParams.get('lesson_id')
    if (!lessonId) {
      return NextResponse.json({ error: 'lesson_id is required' }, { status: 400 })
    }

    // Get lesson -> course
    const { data: lesson } = await supabase
      .from('lessons')
      .select('course_id')
      .eq('id', lessonId)
      .single()

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    // Verify the user is the creator of this course
    const { data: creator } = await supabase
      .from('creators')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (!creator) {
      return NextResponse.json({ error: 'Not a creator' }, { status: 403 })
    }

    const { data: course } = await supabase
      .from('courses')
      .select('id, card_color, slug')
      .eq('id', lesson.course_id)
      .eq('creator_id', creator.id)
      .single()

    if (!course) {
      return NextResponse.json({ error: 'Course not found or not owned by you' }, { status: 404 })
    }

    return NextResponse.json({
      course_id: course.id,
      card_color: course.card_color,
      slug: course.slug,
    })
  } catch (err) {
    console.error('GET creator/preview/course-for-lesson error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
