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

    // Fetch course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Fetch user enrollment
    const { data: userCourse } = await supabase
      .from('user_courses')
      .select('readiness_score, current_topic_id')
      .eq('user_id', userId)
      .eq('course_id', course.id)
      .maybeSingle()

    if (!userCourse) {
      return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 })
    }

    // Fetch modules and topics
    const { data: modules } = await supabase
      .from('modules')
      .select('id, title, description, weight_percent, display_order')
      .eq('course_id', course.id)
      .order('display_order', { ascending: true })

    const { data: topics } = await supabase
      .from('topics')
      .select('id, module_id, title, description, display_order')
      .eq('course_id', course.id)
      .order('display_order', { ascending: true })

    // Fetch question counts per topic
    const { data: allQuestions } = await supabase
      .from('questions')
      .select('id, topic_id')
      .eq('course_id', course.id)
      .eq('is_active', true)

    // Fetch user card states per topic to determine progress
    const { data: cardStates } = await supabase
      .from('user_card_states')
      .select('question_id, topic_id, state, stability')
      .eq('user_id', userId)
      .eq('course_id', course.id)

    const cardStatesByTopic: Record<string, any[]> = {}
    for (const cs of cardStates || []) {
      if (!cardStatesByTopic[cs.topic_id]) cardStatesByTopic[cs.topic_id] = []
      cardStatesByTopic[cs.topic_id].push(cs)
    }

    const questionsByTopic: Record<string, number> = {}
    for (const q of allQuestions || []) {
      questionsByTopic[q.topic_id] = (questionsByTopic[q.topic_id] || 0) + 1
    }

    // Determine topic statuses
    // All topics before current_topic_id are completed or current,
    // all after are locked
    const currentTopicId = userCourse.current_topic_id
    let foundCurrent = false

    const topicList = (topics || []).map((t: any) => {
      const totalQuestions = questionsByTopic[t.id] || 0
      const seenCards = cardStatesByTopic[t.id] || []
      const questionsSeen = seenCards.length

      // Calculate topic readiness
      let topicReadiness = 0
      if (totalQuestions > 0 && seenCards.length > 0) {
        const reviewOrBetter = seenCards.filter((c: any) => c.state === 'review').length
        topicReadiness = reviewOrBetter / totalQuestions
      }

      let status: string
      if (t.id === currentTopicId) {
        status = 'current'
        foundCurrent = true
      } else if (!foundCurrent) {
        // Before current => completed if readiness >= 0.7, else current-like
        status = topicReadiness >= 0.7 ? 'completed' : 'completed'
      } else {
        status = 'locked'
      }

      return {
        id: t.id,
        module_id: t.module_id,
        title: t.title,
        description: t.description,
        display_order: t.display_order,
        status,
        readiness: Math.round(topicReadiness * 100) / 100,
        questions_seen: questionsSeen,
        questions_total: totalQuestions,
      }
    })

    // Group topics into modules
    const modulesWithTopics = (modules || []).map((m: any) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      weight_percent: m.weight_percent,
      display_order: m.display_order,
      topics: topicList.filter((t: any) => t.module_id === m.id),
    }))

    return NextResponse.json({
      course_id: course.id,
      readiness_score: userCourse.readiness_score,
      current_topic_id: currentTopicId,
      modules: modulesWithTopics,
    })
  } catch (err) {
    console.error('GET /api/courses/[slug]/path error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
