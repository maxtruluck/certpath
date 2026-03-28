import { NextRequest, NextResponse } from 'next/server'
import { getApiUser } from '@/lib/supabase/get-user-api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LessonState = 'locked' | 'available' | 'in_progress' | 'completed'

interface LessonData {
  id: string
  module_id: string
  title: string
  display_order: number
  state: LessonState
  question_count: number
  items_completed: number
  items_total: number
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

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

    // Verify enrollment
    const { data: userCourse } = await supabase
      .from('user_courses')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', course.id)
      .maybeSingle()

    if (!userCourse) {
      return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 })
    }

    // Parallel fetch: modules, lessons, progress, tests, test attempts
    const [
      { data: modules },
      { data: lessons },
      { data: progressRows },
      { data: tests },
      { data: testAttempts },
    ] = await Promise.all([
      supabase
        .from('modules')
        .select('id, title, description, display_order')
        .eq('course_id', course.id)
        .order('display_order', { ascending: true }),
      supabase
        .from('lessons')
        .select('id, module_id, title, display_order')
        .eq('course_id', course.id)
        .order('display_order', { ascending: true }),
      supabase
        .from('user_lesson_progress')
        .select('lesson_id, status, session_items_completed, session_items_total')
        .eq('user_id', userId)
        .eq('course_id', course.id),
      supabase
        .from('tests')
        .select('id, title, course_id, passing_score, time_limit_minutes')
        .eq('course_id', course.id),
      supabase
        .from('test_attempts')
        .select('id, test_id, score_percent, passed, status')
        .eq('user_id', userId),
    ])

    // Fetch answer-type lesson_steps per lesson (lesson_steps has no course_id)
    const lessonIds = (lessons || []).map((l: any) => l.id)
    let answerStepRows: any[] = []
    if (lessonIds.length > 0) {
      const { data } = await supabase
        .from('lesson_steps')
        .select('id, lesson_id')
        .in('lesson_id', lessonIds)
        .eq('step_type', 'answer')
      answerStepRows = data || []
    }

    // Fetch test question counts from test_questions table
    const testIds = (tests || []).map((t: any) => t.id)
    let testQuestionRows: any[] = []
    if (testIds.length > 0) {
      const { data } = await supabase
        .from('test_questions')
        .select('id, test_id')
        .in('test_id', testIds)
      testQuestionRows = data || []
    }

    // ── Index data ───────────────────────────────────────────────

    // Answer-step count per lesson
    const questionCountByLesson: Record<string, number> = {}
    for (const s of answerStepRows) {
      questionCountByLesson[s.lesson_id] = (questionCountByLesson[s.lesson_id] || 0) + 1
    }

    // Progress by lesson
    const progressByLesson: Record<string, { status: string; items_completed: number; items_total: number }> = {}
    for (const p of progressRows || []) {
      progressByLesson[p.lesson_id] = {
        status: p.status,
        items_completed: p.session_items_completed || 0,
        items_total: p.session_items_total || 0,
      }
    }

    // ── Group lessons by module ────────────────────────────────────

    const lessonsByModule: Record<string, any[]> = {}
    for (const l of lessons || []) {
      if (!lessonsByModule[l.module_id]) lessonsByModule[l.module_id] = []
      lessonsByModule[l.module_id].push(l)
    }

    const sortedModules = (modules || []).sort((a: any, b: any) => a.display_order - b.display_order)

    // ── Compute lesson states (linear locking) ─────────────────────

    const lessonDataMap: Record<string, LessonData> = {}

    for (let mi = 0; mi < sortedModules.length; mi++) {
      const mod = sortedModules[mi]
      const modLessons = (lessonsByModule[mod.id] || [])
        .sort((a: any, b: any) => a.display_order - b.display_order)

      for (let li = 0; li < modLessons.length; li++) {
        const l = modLessons[li]
        const progress = progressByLesson[l.id]

        // Raw state from progress table
        let rawState: LessonState = 'available'
        if (progress) {
          if (progress.status === 'completed') rawState = 'completed'
          else if (progress.status === 'in_progress') rawState = 'in_progress'
        }

        // Lock logic
        let state: LessonState = rawState
        if (li === 0 && mi === 0) {
          // First lesson of first module: always available (or its progress state)
          state = rawState
        } else if (li === 0) {
          // First lesson of a non-first module: available if ALL lessons in previous module are completed
          const prevMod = sortedModules[mi - 1]
          const prevModLessons = lessonsByModule[prevMod.id] || []
          const allPrevCompleted = prevModLessons.every((pl: any) => {
            const pp = progressByLesson[pl.id]
            return pp && pp.status === 'completed'
          })
          state = allPrevCompleted ? rawState : 'locked'
        } else {
          // Not first lesson: available if previous lesson in same module is completed
          const prevLesson = modLessons[li - 1]
          const prevProgress = progressByLesson[prevLesson.id]
          const prevCompleted = prevProgress && prevProgress.status === 'completed'
          state = prevCompleted ? rawState : 'locked'
        }

        lessonDataMap[l.id] = {
          id: l.id,
          module_id: l.module_id,
          title: l.title,
          display_order: l.display_order,
          state,
          question_count: questionCountByLesson[l.id] || 0,
          items_completed: progress?.items_completed || 0,
          items_total: progress?.items_total || 0,
        }
      }
    }

    // ── Build module response ────────────────────────────────────

    // ── Index test attempts by test_id ──────────────────────────────
    const attemptsByTest: Record<string, { best_score: number | null; passed: boolean; count: number }> = {}
    for (const a of testAttempts || []) {
      if (a.status !== 'completed') continue
      if (!attemptsByTest[a.test_id]) {
        attemptsByTest[a.test_id] = { best_score: null, passed: false, count: 0 }
      }
      attemptsByTest[a.test_id].count++
      if (a.score_percent != null) {
        if (attemptsByTest[a.test_id].best_score === null || a.score_percent > attemptsByTest[a.test_id].best_score!) {
          attemptsByTest[a.test_id].best_score = a.score_percent
        }
      }
      if (a.passed) attemptsByTest[a.test_id].passed = true
    }

    // Test question count by test_id
    const questionCountByTest: Record<string, number> = {}
    for (const tq of testQuestionRows) {
      questionCountByTest[tq.test_id] = (questionCountByTest[tq.test_id] || 0) + 1
    }

    // All tests are course-level (tests table has no module_id)
    const courseLevelTests = (tests || []).map((t: any) => ({
      id: t.id,
      title: t.title,
      passing_score: t.passing_score,
      time_limit_minutes: t.time_limit_minutes,
      question_count: questionCountByTest[t.id] || 0,
      best_score: attemptsByTest[t.id]?.best_score ?? null,
      passed: attemptsByTest[t.id]?.passed ?? false,
      attempts_count: attemptsByTest[t.id]?.count ?? 0,
    }))

    const modulesResponse = sortedModules.map((mod: any) => {
      const modLessons = (lessonsByModule[mod.id] || [])
        .sort((a: any, b: any) => a.display_order - b.display_order)
        .map((l: any) => lessonDataMap[l.id])

      return {
        id: mod.id,
        title: mod.title,
        description: mod.description,
        display_order: mod.display_order,
        lessons: modLessons,
      }
    })

    // ── Compute primary CTA ──────────────────────────────────────

    const allLessonData = sortedModules.flatMap((mod: any) =>
      (lessonsByModule[mod.id] || [])
        .sort((a: any, b: any) => a.display_order - b.display_order)
        .map((l: any) => lessonDataMap[l.id])
    )

    let primaryCta: {
      type: 'continue' | 'start' | 'caught_up'
      lesson_id: string | null
      label: string
    }

    // Priority 1: first in_progress lesson
    const inProgressLesson = allLessonData.find((l: LessonData) => l.state === 'in_progress')
    if (inProgressLesson) {
      primaryCta = {
        type: 'continue',
        lesson_id: inProgressLesson.id,
        label: `Continue ${inProgressLesson.title}`,
      }
    }
    // Priority 2: first available lesson
    else {
      const availableLesson = allLessonData.find((l: LessonData) => l.state === 'available')
      if (availableLesson) {
        primaryCta = {
          type: 'start',
          lesson_id: availableLesson.id,
          label: `Start ${availableLesson.title}`,
        }
      }
      // Priority 3: all completed
      else {
        primaryCta = {
          type: 'caught_up',
          lesson_id: null,
          label: 'All caught up!',
        }
      }
    }

    // ── Overall progress ─────────────────────────────────────────

    const totalLessons = allLessonData.length
    const completedLessons = allLessonData.filter((l: LessonData) => l.state === 'completed').length

    // ── Response ─────────────────────────────────────────────────

    return NextResponse.json({
      course: {
        id: course.id,
        title: course.title,
      },
      modules: modulesResponse,
      course_tests: courseLevelTests,
      primary_cta: primaryCta,
      progress: {
        completed: completedLessons,
        total: totalLessons,
      },
    })

  } catch (err) {
    console.error('GET /api/courses/[slug]/path error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
