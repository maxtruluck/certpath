import { NextRequest, NextResponse } from 'next/server'
import { getApiUser } from '@/lib/supabase/get-user-api'

export async function POST(request: NextRequest) {
  try {
    const { supabase, userId, error } = await getApiUser()
    if (error) return error

    const body = await request.json()
    const { session_id, topic_id } = body

    if (!session_id) {
      return NextResponse.json({ error: 'session_id is required' }, { status: 400 })
    }

    // Query review_log for this session
    const { data: reviews, error: reviewError } = await supabase
      .from('review_log')
      .select('id, question_id, course_id, topic_id, is_correct, rating, time_spent_ms')
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

    // Topic breakdown
    const topicMap: Record<string, { correct: number; total: number; topic_id: string }> = {}
    for (const r of reviews) {
      if (!topicMap[r.topic_id]) {
        topicMap[r.topic_id] = { correct: 0, total: 0, topic_id: r.topic_id }
      }
      topicMap[r.topic_id].total++
      if (r.is_correct) topicMap[r.topic_id].correct++
    }

    // Get topic names
    const topicIds = Object.keys(topicMap)
    let topicNames: Record<string, string> = {}
    if (topicIds.length > 0) {
      const { data: topics } = await supabase
        .from('topics')
        .select('id, title')
        .in('id', topicIds)
      for (const t of topics || []) {
        topicNames[t.id] = t.title
      }
    }

    const topicBreakdown = Object.values(topicMap).map((t: any) => ({
      topic_id: t.topic_id,
      topic_title: topicNames[t.topic_id] || 'Unknown',
      correct: t.correct,
      total: t.total,
      accuracy_percent: Math.round((t.correct / t.total) * 100),
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

    // Mark topic as completed
    if (topic_id) {
      const { data: progressRow } = await supabase
        .from('user_topic_progress')
        .select('id, session_items_total')
        .eq('user_id', userId)
        .eq('topic_id', topic_id)
        .maybeSingle()

      if (progressRow) {
        await supabase
          .from('user_topic_progress')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            session_items_completed: progressRow.session_items_total,
          })
          .eq('id', progressRow.id)
      } else {
        await supabase
          .from('user_topic_progress')
          .insert({
            user_id: userId,
            topic_id: topic_id,
            course_id: courseId,
            status: 'completed',
            completed_at: new Date().toISOString(),
            session_items_completed: 0,
            session_items_total: 0,
          })
      }
    }

    return NextResponse.json({
      correct_count: correctCount,
      total_count: totalCount,
      accuracy_percent: accuracyPercent,
      topic_breakdown: topicBreakdown,
    })
  } catch (err) {
    console.error('POST /api/session/complete error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
