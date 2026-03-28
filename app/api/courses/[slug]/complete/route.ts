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

    // Fetch lesson progress, total lessons, tests, and test attempts in parallel
    const [
      { data: lessonProgress },
      { data: allLessons },
      { data: tests },
      { data: testAttempts },
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
      supabase
        .from('tests')
        .select('id, title, passing_score')
        .eq('course_id', course.id),
      supabase
        .from('test_attempts')
        .select('test_id, score_percent, passed, status')
        .eq('user_id', userId),
    ])

    // Lesson progress stats
    const totalLessons = allLessons?.length || 0
    const completedLessons = (lessonProgress || []).filter(
      (p: any) => p.status === 'completed'
    ).length

    // Best score per test
    const testIds = new Set((tests || []).map((t: any) => t.id))
    const bestByTest: Record<string, { best_score: number | null; passed: boolean }> = {}
    for (const a of testAttempts || []) {
      if (a.status !== 'completed' || !testIds.has(a.test_id)) continue
      if (!bestByTest[a.test_id]) {
        bestByTest[a.test_id] = { best_score: null, passed: false }
      }
      if (a.score_percent != null) {
        if (bestByTest[a.test_id].best_score === null || a.score_percent > bestByTest[a.test_id].best_score!) {
          bestByTest[a.test_id].best_score = a.score_percent
        }
      }
      if (a.passed) bestByTest[a.test_id].passed = true
    }

    const testResults = (tests || []).map((t: any) => ({
      test_title: t.title,
      best_score: bestByTest[t.id]?.best_score ?? null,
      passed: bestByTest[t.id]?.passed ?? false,
    }))

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
      test_results: testResults,
    })
  } catch (err) {
    console.error('GET /api/courses/[slug]/complete error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
