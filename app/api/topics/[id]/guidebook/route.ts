import { NextRequest, NextResponse } from 'next/server'
import { getApiUser } from '@/lib/supabase/get-user-api'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, error } = await getApiUser()
    if (error) return error

    const { id: topicId } = await params

    // Fetch the topic with guidebook content
    const { data: topic, error: topicError } = await supabase
      .from('topics')
      .select('id, module_id, course_id, title, description, guidebook_content, display_order')
      .eq('id', topicId)
      .single()

    if (topicError || !topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 })
    }

    // Fetch lessons for this topic
    const { data: lessons } = await supabase
      .from('lessons')
      .select('id, title, body, display_order')
      .eq('topic_id', topicId)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    // Fetch assessments for this topic (topic quizzes)
    const { data: assessments } = await supabase
      .from('assessments')
      .select('id, title, assessment_type, question_count, passing_score_percent')
      .eq('topic_id', topicId)
      .eq('is_active', true)

    // Fetch all topics in the same course for prev/next navigation
    const { data: allTopics } = await supabase
      .from('topics')
      .select('id, module_id, title, display_order')
      .eq('course_id', topic.course_id)
      .order('display_order', { ascending: true })

    const topics = allTopics || []
    const currentIndex = topics.findIndex((t: any) => t.id === topicId)

    const prevTopic = currentIndex > 0 ? topics[currentIndex - 1] : null
    const nextTopic = currentIndex < topics.length - 1 ? topics[currentIndex + 1] : null

    return NextResponse.json({
      id: topic.id,
      module_id: topic.module_id,
      course_id: topic.course_id,
      title: topic.title,
      description: topic.description,
      guidebook_content: topic.guidebook_content,
      lessons: lessons || [],
      assessments: assessments || [],
      display_order: topic.display_order,
      prev: prevTopic ? { id: prevTopic.id, title: prevTopic.title } : null,
      next: nextTopic ? { id: nextTopic.id, title: nextTopic.title } : null,
    })
  } catch (err) {
    console.error('GET /api/topics/[id]/guidebook error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
