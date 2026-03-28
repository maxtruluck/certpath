import { NextRequest, NextResponse } from 'next/server'
import { getApiUser } from '@/lib/supabase/get-user-api'

export async function GET(request: NextRequest) {
  try {
    const { supabase, userId, error } = await getApiUser()
    if (error) return error

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, role, timezone, onboarding_complete')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Fetch all user courses for stats
    const { data: allUserCourses } = await supabase
      .from('user_courses')
      .select('id, course_id, status, questions_seen, questions_correct, sessions_completed, completed_at')
      .eq('user_id', userId)

    const courses = allUserCourses || []
    const completedCourses = courses.filter((c: any) => c.status === 'completed')

    // Count completed lessons
    const { count: lessonsCompleted } = await supabase
      .from('user_lesson_progress')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed')

    // Aggregate stats
    const totalQuestionsSeen = courses.reduce((sum: number, c: any) => sum + (c.questions_seen || 0), 0)
    const totalQuestionsCorrect = courses.reduce((sum: number, c: any) => sum + (c.questions_correct || 0), 0)
    const totalSessions = courses.reduce((sum: number, c: any) => sum + (c.sessions_completed || 0), 0)

    // Fetch completed course details
    const completedCourseIds = completedCourses.map((c: any) => c.course_id)
    let completedCourseDetails: any[] = []

    if (completedCourseIds.length > 0) {
      const { data: courseData } = await supabase
        .from('courses')
        .select('id, title, slug, description, category, difficulty')
        .in('id', completedCourseIds)

      completedCourseDetails = completedCourses.map((uc: any) => {
        const course = (courseData || []).find((c: any) => c.id === uc.course_id)
        return {
          ...uc,
          course: course || null,
        }
      })
    }

    return NextResponse.json({
      user: profile,
      stats: {
        courses_enrolled: courses.length,
        courses_completed: completedCourses.length,
        lessons_completed: lessonsCompleted || 0,
        total_questions_seen: totalQuestionsSeen,
        total_questions_correct: totalQuestionsCorrect,
        accuracy_percent: totalQuestionsSeen > 0
          ? Math.round((totalQuestionsCorrect / totalQuestionsSeen) * 100)
          : 0,
        total_sessions: totalSessions,
      },
      completed_courses: completedCourseDetails,
    })
  } catch (err) {
    console.error('GET /api/profile error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
