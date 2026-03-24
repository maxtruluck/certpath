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
    let lessonsCompletedCounts: Record<string, number> = {}

    // Step-based progress data and resume points
    let stepProgressByCoourse: Record<string, { completed: number; total: number }> = {}
    let resumePoints: Record<string, { module_title: string; lesson_title: string; lesson_id: string; step_index: number; step_total: number } | null> = {}

    if (courseIds.length > 0) {
      const [questionsRes, lessonsRes, lessonProgressRes, allProgressRes] = await Promise.all([
        supabase
          .from('questions')
          .select('course_id')
          .in('course_id', courseIds)
          .eq('is_active', true),
        supabase
          .from('lessons')
          .select('id, course_id, title, module_id, display_order')
          .in('course_id', courseIds)
          .eq('is_active', true),
        supabase
          .from('user_lesson_progress')
          .select('course_id')
          .eq('user_id', userId)
          .in('course_id', courseIds)
          .eq('status', 'completed'),
        // Fetch ALL lesson progress (not just completed) for step-based progress
        supabase
          .from('user_lesson_progress')
          .select('lesson_id, course_id, status, session_items_completed, session_items_total, current_step_index')
          .eq('user_id', userId)
          .in('course_id', courseIds),
      ])

      // Build module title lookup
      const lessonModuleIds = [...new Set((lessonsRes.data || []).map((l: any) => l.module_id).filter(Boolean))]
      let moduleMap: Record<string, string> = {}
      if (lessonModuleIds.length > 0) {
        const { data: modules } = await supabase
          .from('modules')
          .select('id, title')
          .in('id', lessonModuleIds)
        for (const m of modules || []) {
          moduleMap[m.id] = m.title
        }
      }

      // Build lesson lookup
      const lessonMap: Record<string, any> = {}
      for (const l of lessonsRes.data || []) {
        lessonMap[l.id] = l
      }

      for (const id of courseIds) {
        questionCounts[id] = (questionsRes.data || []).filter((q: any) => q.course_id === id).length
        lessonCounts[id] = (lessonsRes.data || []).filter((l: any) => l.course_id === id).length
        lessonsCompletedCounts[id] = (lessonProgressRes.data || []).filter((lp: any) => lp.course_id === id).length

        // Compute step-based progress
        const courseProgress = (allProgressRes.data || []).filter((p: any) => p.course_id === id)
        let stepsCompleted = 0
        let stepsTotal = 0
        let inProgressLesson: any = null

        for (const p of courseProgress) {
          stepsCompleted += p.session_items_completed || 0
          stepsTotal += p.session_items_total || 0
          if (p.status === 'in_progress' && !inProgressLesson) {
            inProgressLesson = p
          }
        }

        stepProgressByCoourse[id] = { completed: stepsCompleted, total: stepsTotal }

        // Build resume point from in-progress lesson
        if (inProgressLesson) {
          const lesson = lessonMap[inProgressLesson.lesson_id]
          if (lesson) {
            resumePoints[id] = {
              module_title: moduleMap[lesson.module_id] || '',
              lesson_title: lesson.title,
              lesson_id: lesson.id,
              step_index: (inProgressLesson.current_step_index || 0) + 1,
              step_total: inProgressLesson.session_items_total || 0,
            }
          }
        }

        // If no in-progress lesson, find next available lesson
        if (!resumePoints[id]) {
          const completedLessonIds = new Set(
            courseProgress.filter((p: any) => p.status === 'completed').map((p: any) => p.lesson_id)
          )
          const courseLessons = (lessonsRes.data || [])
            .filter((l: any) => l.course_id === id)
            .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))

          for (const lesson of courseLessons) {
            if (!completedLessonIds.has(lesson.id)) {
              resumePoints[id] = {
                module_title: moduleMap[lesson.module_id] || '',
                lesson_title: lesson.title,
                lesson_id: lesson.id,
                step_index: 0,
                step_total: 0,
              }
              break
            }
          }
        }
      }
    }

    const activeCourses = (userCourses || []).map((uc: any) => {
      const stepProgress = stepProgressByCoourse[uc.course_id]
      const progressPercent = stepProgress && stepProgress.total > 0
        ? Math.min(100, Math.round((stepProgress.completed / stepProgress.total) * 100))
        : 0

      return {
        id: uc.id,
        course_id: uc.course_id,
        course: uc.course,
        status: uc.status,
        readiness_score: uc.readiness_score,
        questions_seen: uc.questions_seen,
        questions_correct: uc.questions_correct,
        questions_total: questionCounts[uc.course_id] || 0,
        lessons_total: lessonCounts[uc.course_id] || 0,
        lessons_completed: lessonsCompletedCounts[uc.course_id] || 0,
        sessions_completed: uc.sessions_completed,
        last_session_at: uc.last_session_at,
        enrolled_at: uc.enrolled_at,
        progress_percent: progressPercent,
        resume_point: resumePoints[uc.course_id] || null,
      }
    })

    return NextResponse.json({ active_courses: activeCourses })
  } catch (err) {
    console.error('GET /api/dashboard error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
