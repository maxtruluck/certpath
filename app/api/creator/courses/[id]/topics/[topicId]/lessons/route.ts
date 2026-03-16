import { NextRequest, NextResponse } from 'next/server'
import { getCreatorCourse } from '@/lib/supabase/get-creator-course'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; topicId: string }> }
) {
  try {
    const { id, topicId } = await params
    const { supabase, error } = await getCreatorCourse(id)
    if (error) return error

    const { data: lessons, error: fetchError } = await supabase
      .from('lessons')
      .select('id, title, body, display_order, is_active, created_at, updated_at')
      .eq('topic_id', topicId)
      .eq('course_id', id)
      .order('display_order')

    if (fetchError) {
      return NextResponse.json({ error: 'Failed to fetch lessons' }, { status: 500 })
    }

    return NextResponse.json(lessons || [])
  } catch (err) {
    console.error('GET lessons error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; topicId: string }> }
) {
  try {
    const { id, topicId } = await params
    const { supabase, error } = await getCreatorCourse(id)
    if (error) return error

    const body = await request.json()
    const { title = 'New Lesson', body: lessonBody = '', display_order } = body

    // Verify topic belongs to course and get module_id
    const { data: topic } = await supabase
      .from('topics')
      .select('id, module_id')
      .eq('id', topicId)
      .eq('course_id', id)
      .single()

    if (!topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 })
    }

    // Auto-calculate display_order if not provided
    let order = display_order
    if (order === undefined || order === null) {
      const { data: existing } = await supabase
        .from('lessons')
        .select('display_order')
        .eq('topic_id', topicId)
        .order('display_order', { ascending: false })
        .limit(1)

      order = existing && existing.length > 0 ? existing[0].display_order + 1 : 0
    }

    const { data: lesson, error: insertError } = await supabase
      .from('lessons')
      .insert({
        topic_id: topicId,
        course_id: id,
        module_id: topic.module_id,
        title: title.trim(),
        body: lessonBody,
        display_order: order,
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('Create lesson error:', insertError)
      return NextResponse.json({ error: 'Failed to create lesson' }, { status: 500 })
    }

    return NextResponse.json(lesson, { status: 201 })
  } catch (err) {
    console.error('POST lesson error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
