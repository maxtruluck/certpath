import { NextRequest, NextResponse } from 'next/server'
import { getApiUser } from '@/lib/supabase/get-user-api'
import { DEMO_MODE } from '@/lib/demo'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { supabase, userId, error } = await getApiUser()
    if (error) return error

    // Verify creator
    const { data: creator } = await supabase
      .from('creators')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    // Verify course belongs to creator and is draft
    const { data: course } = await supabase
      .from('courses')
      .select('id, status')
      .eq('id', id)
      .eq('creator_id', creator.id)
      .single()

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    if (course.status !== 'draft') {
      return NextResponse.json(
        { error: `Course is already ${course.status}` },
        { status: 409 }
      )
    }

    // Validate minimums
    const [topicsRes, questionsRes, modulesRes, lessonsRes] = await Promise.all([
      supabase.from('topics').select('id, module_id').eq('course_id', id),
      supabase.from('questions').select('id, topic_id').eq('course_id', id).eq('is_active', true),
      supabase.from('modules').select('id').eq('course_id', id),
      supabase.from('lessons').select('id, topic_id').eq('course_id', id).eq('is_active', true),
    ])

    const topics = topicsRes.data || []
    const questions = questionsRes.data || []
    const modules = modulesRes.data || []
    const lessons = lessonsRes.data || []

    // Count lessons per topic
    const lessonCountByTopic = new Map<string, number>()
    for (const l of lessons) {
      lessonCountByTopic.set(l.topic_id, (lessonCountByTopic.get(l.topic_id) || 0) + 1)
    }

    const validationWarnings: string[] = []

    if (questions.length < 50) {
      validationWarnings.push(`Course has ${questions.length} questions (minimum: 50)`)
    }

    for (const mod of modules) {
      const modTopics = topics.filter((t: any) => t.module_id === mod.id)
      if (modTopics.length < 3) {
        validationWarnings.push(`A module has only ${modTopics.length} topics (minimum: 3)`)
      }
    }

    for (const topic of topics) {
      const topicQs = questions.filter((q: any) => q.topic_id === topic.id)
      if (topicQs.length < 10) {
        validationWarnings.push(`A topic has only ${topicQs.length} questions (minimum: 10)`)
      }
    }

    // Content coverage validation
    const topicsWithoutContent = topics.filter((t: any) => !lessonCountByTopic.has(t.id))
    if (topicsWithoutContent.length > 0) {
      validationWarnings.push(`${topicsWithoutContent.length} topic(s) have no lessons`)
    }

    // In demo mode, allow submission despite warnings
    if (validationWarnings.length > 0 && !DEMO_MODE) {
      return NextResponse.json({
        error: 'Course does not meet minimum requirements',
        warnings: validationWarnings,
      }, { status: 422 })
    }

    // Update status to in_review
    const { error: updateError } = await supabase
      .from('courses')
      .update({ status: 'in_review' })
      .eq('id', id)

    if (updateError) {
      console.error('Submit course error:', updateError)
      return NextResponse.json({ error: 'Failed to submit course' }, { status: 500 })
    }

    return NextResponse.json({
      status: 'in_review',
      warnings: validationWarnings,
      stats: {
        question_count: questions.length,
        module_count: modules.length,
        topic_count: topics.length,
      },
    })
  } catch (err) {
    console.error('POST /api/creator/courses/[id]/submit error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
