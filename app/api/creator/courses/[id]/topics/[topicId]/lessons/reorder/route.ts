import { NextRequest, NextResponse } from 'next/server'
import { getCreatorCourse } from '@/lib/supabase/get-creator-course'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; topicId: string }> }
) {
  try {
    const { id, topicId } = await params
    const { supabase, error } = await getCreatorCourse(id)
    if (error) return error

    const { lesson_ids } = await request.json()

    if (!Array.isArray(lesson_ids) || lesson_ids.length === 0) {
      return NextResponse.json({ error: 'lesson_ids array is required' }, { status: 400 })
    }

    // Update each lesson's display_order
    const updates = lesson_ids.map((lessonId: string, index: number) =>
      supabase
        .from('lessons')
        .update({ display_order: index })
        .eq('id', lessonId)
        .eq('topic_id', topicId)
        .eq('course_id', id)
    )

    await Promise.all(updates)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('PATCH reorder lessons error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
