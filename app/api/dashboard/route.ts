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
        current_topic_id,
        questions_seen,
        questions_correct,
        sessions_completed,
        last_session_at,
        enrolled_at,
        course:courses(id, title, slug, description, category, difficulty, thumbnail_url, provider_name)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('last_session_at', { ascending: false, nullsFirst: false })

    if (ucError) {
      console.error('Dashboard query error:', ucError)
      return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
    }

    // Get question counts and topic info for each course
    const courseIds = (userCourses || []).map((uc: any) => uc.course_id)
    let questionCounts: Record<string, number> = {}
    let topicCounts: Record<string, number> = {}

    if (courseIds.length > 0) {
      const [questionsRes, topicsRes] = await Promise.all([
        supabase
          .from('questions')
          .select('course_id')
          .in('course_id', courseIds)
          .eq('is_active', true),
        supabase
          .from('topics')
          .select('course_id')
          .in('course_id', courseIds),
      ])

      for (const id of courseIds) {
        questionCounts[id] = (questionsRes.data || []).filter((q: any) => q.course_id === id).length
        topicCounts[id] = (topicsRes.data || []).filter((t: any) => t.course_id === id).length
      }
    }

    // Get current topic title for each course
    const currentTopicIds = (userCourses || [])
      .map((uc: any) => uc.current_topic_id)
      .filter(Boolean)

    let topicNames: Record<string, string> = {}
    if (currentTopicIds.length > 0) {
      const { data: topicData } = await supabase
        .from('topics')
        .select('id, title')
        .in('id', currentTopicIds)

      for (const t of topicData || []) {
        topicNames[t.id] = t.title
      }
    }

    // Get due card counts per course
    const now = new Date().toISOString()
    let dueCountsByCourse: Record<string, number> = {}

    if (courseIds.length > 0) {
      const { data: dueCards } = await supabase
        .from('user_card_states')
        .select('course_id')
        .eq('user_id', userId)
        .in('course_id', courseIds)
        .lte('due_date', now)
        .neq('state', 'new')

      for (const id of courseIds) {
        dueCountsByCourse[id] = (dueCards || []).filter((c: any) => c.course_id === id).length
      }
    }

    const activeCourses = (userCourses || []).map((uc: any) => ({
      id: uc.id,
      course_id: uc.course_id,
      course: uc.course,
      status: uc.status,
      readiness_score: uc.readiness_score,
      current_topic_id: uc.current_topic_id,
      current_topic_title: uc.current_topic_id ? (topicNames[uc.current_topic_id] || null) : null,
      questions_seen: uc.questions_seen,
      questions_correct: uc.questions_correct,
      questions_total: questionCounts[uc.course_id] || 0,
      topics_total: topicCounts[uc.course_id] || 0,
      sessions_completed: uc.sessions_completed,
      last_session_at: uc.last_session_at,
      enrolled_at: uc.enrolled_at,
      due_cards: dueCountsByCourse[uc.course_id] || 0,
    }))

    return NextResponse.json({ active_courses: activeCourses })
  } catch (err) {
    console.error('GET /api/dashboard error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
