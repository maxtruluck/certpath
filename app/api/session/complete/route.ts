import { NextRequest, NextResponse } from 'next/server'
import { getApiUser } from '@/lib/supabase/get-user-api'

export async function POST(request: NextRequest) {
  try {
    const { supabase, userId, error } = await getApiUser()
    if (error) return error

    const body = await request.json()
    const { session_id, lesson_id } = body

    if (!session_id) {
      return NextResponse.json({ error: 'session_id is required' }, { status: 400 })
    }

    // Query review_log for this session
    const { data: reviews, error: reviewError } = await supabase
      .from('review_log')
      .select('id, question_id, course_id, module_id, is_correct, rating, time_spent_ms')
      .eq('user_id', userId)
      .eq('session_id', session_id)

    if (reviewError) {
      console.error('Review log query error:', reviewError)
      return NextResponse.json({ error: 'Failed to fetch session data' }, { status: 500 })
    }

    if (!reviews || reviews.length === 0) {
      return NextResponse.json({ error: 'No reviews found for this session' }, { status: 404 })
    }

    const courseId = reviews[0].course_id
    const totalCount = reviews.length
    const correctCount = reviews.filter((r: any) => r.is_correct).length
    const accuracyPercent = Math.round((correctCount / totalCount) * 100)

    // Get user_courses for session count
    const { data: userCourse } = await supabase
      .from('user_courses')
      .select('id, sessions_completed')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle()

    // Module breakdown: group reviews by module_id
    const moduleMap: Record<string, { correct: number; total: number; module_id: string }> = {}
    for (const r of reviews) {
      if (!moduleMap[r.module_id]) {
        moduleMap[r.module_id] = { correct: 0, total: 0, module_id: r.module_id }
      }
      moduleMap[r.module_id].total++
      if (r.is_correct) moduleMap[r.module_id].correct++
    }

    // Get module names
    const moduleIds = Object.keys(moduleMap)
    let moduleNames: Record<string, string> = {}
    if (moduleIds.length > 0) {
      const { data: modulesData } = await supabase
        .from('modules')
        .select('id, title')
        .in('id', moduleIds)
      for (const m of modulesData || []) {
        moduleNames[m.id] = m.title
      }
    }

    const moduleBreakdown = Object.values(moduleMap).map((m: any) => ({
      module_id: m.module_id,
      module_title: moduleNames[m.module_id] || 'Unknown',
      correct: m.correct,
      total: m.total,
      accuracy_percent: Math.round((m.correct / m.total) * 100),
    }))

    // Update user_courses
    if (userCourse) {
      await supabase
        .from('user_courses')
        .update({
          sessions_completed: (userCourse.sessions_completed || 0) + 1,
          last_session_at: new Date().toISOString(),
        })
        .eq('id', userCourse.id)
    }

    // Mark lesson as completed
    if (lesson_id) {
      // Fetch the lesson to get module_id
      const { data: lesson } = await supabase
        .from('lessons')
        .select('id, module_id')
        .eq('id', lesson_id)
        .single()

      const moduleId = lesson?.module_id || reviews[0].module_id

      const { data: progressRow } = await supabase
        .from('user_lesson_progress')
        .select('id, session_items_total')
        .eq('user_id', userId)
        .eq('lesson_id', lesson_id)
        .maybeSingle()

      if (progressRow) {
        await supabase
          .from('user_lesson_progress')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            session_items_completed: progressRow.session_items_total,
          })
          .eq('id', progressRow.id)
      } else {
        await supabase
          .from('user_lesson_progress')
          .insert({
            user_id: userId,
            lesson_id: lesson_id,
            course_id: courseId,
            module_id: moduleId,
            status: 'completed',
            completed_at: new Date().toISOString(),
            session_items_completed: totalCount,
            session_items_total: totalCount,
          })
      }
    }

    return NextResponse.json({
      correct_count: correctCount,
      total_count: totalCount,
      accuracy_percent: accuracyPercent,
      module_breakdown: moduleBreakdown,
    })
  } catch (err) {
    console.error('POST /api/session/complete error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
