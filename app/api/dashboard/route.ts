import { NextRequest, NextResponse } from 'next/server'
import { getApiUser } from '@/lib/supabase/get-user-api'

export async function GET(request: NextRequest) {
  try {
    const { supabase, userId, error } = await getApiUser()
    if (error) return error

    // Fetch active courses for this user
    const { data: userCourses, error: ucError } = await supabase
      .from('user_courses')
      .select(`
        id,
        course_id,
        status,
        readiness_score,
        questions_seen,
        questions_correct,
        sessions_completed,
        last_session_at,
        enrolled_at,
        course:courses(id, title, slug, description, category, difficulty, thumbnail_url, provider_name, tags)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('last_session_at', { ascending: false, nullsFirst: false })

    if (ucError) {
      console.error('Dashboard query error:', ucError)
      return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
    }

    // Get question counts and lesson counts for each course
    const courseIds = (userCourses || []).map((uc: any) => uc.course_id)
    let questionCounts: Record<string, number> = {}
    let lessonCounts: Record<string, number> = {}

    if (courseIds.length > 0) {
      const [questionsRes, lessonsRes] = await Promise.all([
        supabase
          .from('questions')
          .select('course_id')
          .in('course_id', courseIds)
          .eq('is_active', true),
        supabase
          .from('lessons')
          .select('course_id')
          .in('course_id', courseIds)
          .eq('is_active', true),
      ])

      for (const id of courseIds) {
        questionCounts[id] = (questionsRes.data || []).filter((q: any) => q.course_id === id).length
        lessonCounts[id] = (lessonsRes.data || []).filter((l: any) => l.course_id === id).length
      }
    }

    const activeCourses = (userCourses || []).map((uc: any) => ({
      id: uc.id,
      course_id: uc.course_id,
      course: uc.course,
      status: uc.status,
      readiness_score: uc.readiness_score,
      questions_seen: uc.questions_seen,
      questions_correct: uc.questions_correct,
      questions_total: questionCounts[uc.course_id] || 0,
      lessons_total: lessonCounts[uc.course_id] || 0,
      sessions_completed: uc.sessions_completed,
      last_session_at: uc.last_session_at,
      enrolled_at: uc.enrolled_at,
    }))

    return NextResponse.json({ active_courses: activeCourses })
  } catch (err) {
    console.error('GET /api/dashboard error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
