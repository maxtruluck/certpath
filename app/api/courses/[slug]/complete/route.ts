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

    // Verify enrollment
    const { data: userCourse } = await supabase
      .from('user_courses')
      .select('readiness_score, questions_seen, questions_correct, sessions_completed')
      .eq('user_id', userId)
      .eq('course_id', course.id)
      .maybeSingle()

    if (!userCourse) {
      return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 })
    }

    // Fetch modules with question stats for per-module readiness
    const { data: modules } = await supabase
      .from('modules')
      .select('id, title, display_order')
      .eq('course_id', course.id)
      .order('display_order', { ascending: true })

    // Get per-module question accuracy from review_log
    const { data: reviewLogs } = await supabase
      .from('review_log')
      .select('module_id, is_correct')
      .eq('user_id', userId)
      .eq('course_id', course.id)

    const moduleStats: Record<string, { correct: number; total: number }> = {}
    for (const log of reviewLogs || []) {
      if (!log.module_id) continue
      if (!moduleStats[log.module_id]) moduleStats[log.module_id] = { correct: 0, total: 0 }
      moduleStats[log.module_id].total++
      if (log.is_correct) moduleStats[log.module_id].correct++
    }

    const moduleReadiness = (modules || []).map((mod: { id: string; title: string }) => {
      const stats = moduleStats[mod.id]
      const readiness = stats && stats.total > 0 ? stats.correct / stats.total : 0
      return {
        module_title: mod.title,
        readiness,
      }
    })

    const accuracy = userCourse.questions_seen > 0
      ? userCourse.questions_correct / userCourse.questions_seen
      : 0

    return NextResponse.json({
      course_title: course.title,
      final_readiness: userCourse.readiness_score || 0,
      questions_seen: userCourse.questions_seen || 0,
      accuracy,
      sessions_completed: userCourse.sessions_completed || 0,
      module_readiness: moduleReadiness,
    })
  } catch (err) {
    console.error('GET /api/courses/[slug]/complete error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
