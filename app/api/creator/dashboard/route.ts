import { NextRequest, NextResponse } from 'next/server'
import { getApiUser } from '@/lib/supabase/get-user-api'

export async function GET(_request: NextRequest) {
  try {
    const { supabase, userId, error } = await getApiUser()
    if (error) return error

    // Get creator record
    const { data: creator, error: creatorError } = await supabase
      .from('creators')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (creatorError || !creator) {
      return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 })
    }

    // Get all courses by this creator
    const { data: courses } = await supabase
      .from('courses')
      .select('id, title, slug, status, category, difficulty, is_free, price_cents, created_at, updated_at, published_at')
      .eq('creator_id', creator.id)
      .order('updated_at', { ascending: false })

    const courseList = courses || []
    const courseIds = courseList.map((c: any) => c.id)

    // Get counts for each course
    let coursesWithStats = courseList.map((c: any) => ({
      ...c,
      module_count: 0,
      lesson_count: 0,
      question_count: 0,
      student_count: 0,
      completion_rate: 0,
      revenue_cents: 0,
    }))

    if (courseIds.length > 0) {
      const [modulesRes, lessonsRes, enrollmentsRes] = await Promise.all([
        supabase.from('modules').select('id, course_id').in('course_id', courseIds),
        supabase.from('lessons').select('id, course_id').in('course_id', courseIds),
        supabase.from('user_courses').select('id, course_id, status, enrolled_at').in('course_id', courseIds),
      ])

      // Get all lesson IDs to count answer steps
      const allLessons = lessonsRes.data || []
      const allLessonIds = allLessons.map((l: any) => l.id)

      // Count answer steps (questions) per lesson
      let answerStepsByLesson: Record<string, number> = {}
      if (allLessonIds.length > 0) {
        const { data: answerSteps } = await supabase
          .from('lesson_steps')
          .select('lesson_id')
          .in('lesson_id', allLessonIds)
          .eq('step_type', 'answer')

        if (answerSteps) {
          for (const step of answerSteps) {
            answerStepsByLesson[step.lesson_id] = (answerStepsByLesson[step.lesson_id] || 0) + 1
          }
        }
      }

      // Count lessons that have at least 1 step (for ready_lessons)
      let lessonsWithSteps: Set<string> = new Set()
      if (allLessonIds.length > 0) {
        const { data: stepLessons } = await supabase
          .from('lesson_steps')
          .select('lesson_id')
          .in('lesson_id', allLessonIds)

        if (stepLessons) {
          for (const s of stepLessons) {
            lessonsWithSteps.add(s.lesson_id)
          }
        }
      }

      const allEnrollments = enrollmentsRes.data || []
      const revenueShare = creator.revenue_share_percent || 70

      coursesWithStats = courseList.map((c: any) => {
        const courseEnrollments = allEnrollments.filter((e: any) => e.course_id === c.id)
        const completedCount = courseEnrollments.filter((e: any) => e.status === 'completed').length
        const completionRate = courseEnrollments.length > 0
          ? Math.round((completedCount / courseEnrollments.length) * 100)
          : 0
        const revenueCents = c.is_free ? 0 : courseEnrollments.length * Math.round((c.price_cents || 0) * revenueShare / 100)

        const courseLessons = allLessons.filter((l: any) => l.course_id === c.id)
        const readyLessons = courseLessons.filter((l: any) => lessonsWithSteps.has(l.id)).length

        // Count questions (answer steps) for this course's lessons
        const courseLessonIds = courseLessons.map((l: any) => l.id)
        const questionCount = courseLessonIds.reduce((sum: number, lid: string) => sum + (answerStepsByLesson[lid] || 0), 0)

        return {
          ...c,
          module_count: (modulesRes.data || []).filter((m: any) => m.course_id === c.id).length,
          lesson_count: courseLessons.length,
          question_count: questionCount,
          student_count: courseEnrollments.length,
          completion_rate: completionRate,
          revenue_cents: revenueCents,
          ready_lessons: readyLessons,
        }
      })

      // Compute aggregate stats
      const publishedCourseIds = courseList.filter((c: any) => c.status === 'published').map((c: any) => c.id)
      const publishedCourses = publishedCourseIds.length
      const totalStudents = coursesWithStats
        .filter((c: any) => c.status === 'published')
        .reduce((sum: number, c: any) => sum + (c.student_count || 0), 0)

      // Total earnings (using creator's revenue share)
      const totalEarnings = coursesWithStats.reduce((sum: number, c: any) => sum + (c.revenue_cents || 0), 0)

      // Completion rate across published courses
      const publishedWithStudents = coursesWithStats.filter((c: any) => c.status === 'published' && c.student_count > 0)
      const avgCompletionRate = publishedWithStudents.length > 0
        ? Math.round(publishedWithStudents.reduce((s: number, c: any) => s + c.completion_rate, 0) / publishedWithStudents.length)
        : 0

      const completedEnrollments = allEnrollments.filter((e: any) => e.status === 'completed')

      // Trend: enrollments this week vs last week
      const now = new Date()
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
      const enrollmentsThisWeek = allEnrollments.filter((e: any) =>
        new Date(e.enrolled_at) >= oneWeekAgo
      ).length
      const enrollmentsLastWeek = allEnrollments.filter((e: any) =>
        new Date(e.enrolled_at) >= twoWeeksAgo && new Date(e.enrolled_at) < oneWeekAgo
      ).length

      return NextResponse.json({
        creator,
        stats: {
          published_courses: publishedCourses,
          total_students: totalStudents,
          total_earnings_cents: totalEarnings,
          avg_rating: completedEnrollments.length > 0 ? 4.5 : null,
          review_count: completedEnrollments.length,
          completion_rate: avgCompletionRate,
          students_trend_7d: enrollmentsThisWeek - enrollmentsLastWeek,
          revenue_trend_7d: 0,
        },
        courses: coursesWithStats,
        checklist: {
          account_created: true,
          profile_complete: !!creator.bio,
          stripe_connected: !!creator.stripe_account_id,
          first_course_created: courseList.length > 0,
          dismissed: creator.onboarding_checklist_dismissed || false,
        },
      })
    }

    // No courses at all
    return NextResponse.json({
      creator,
      stats: {
        published_courses: 0,
        total_students: 0,
        total_earnings_cents: 0,
        avg_rating: null,
        review_count: 0,
        completion_rate: 0,
        students_trend_7d: 0,
        revenue_trend_7d: 0,
      },
      courses: [],
      checklist: {
        account_created: true,
        profile_complete: !!(creator.bio && creator.avatar_url),
        stripe_connected: !!creator.stripe_account_id,
        first_course_created: false,
        dismissed: creator.onboarding_checklist_dismissed || false,
      },
    })
  } catch (err) {
    console.error('GET /api/creator/dashboard error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
