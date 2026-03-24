import { NextRequest, NextResponse } from 'next/server'
import { getApiUser } from '@/lib/supabase/get-user-api'

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

    // Verify course belongs to creator
    const { data: course } = await supabase
      .from('courses')
      .select('id, status')
      .eq('id', id)
      .eq('creator_id', creator.id)
      .single()

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Allow publishing from draft or re-publishing
    if (course.status !== 'draft' && course.status !== 'published') {
      return NextResponse.json(
        { error: `Cannot publish a course with status "${course.status}"` },
        { status: 409 }
      )
    }

    // Minimum content validation
    const { data: modules } = await supabase
      .from('modules')
      .select('id')
      .eq('course_id', id)

    const { data: lessons } = await supabase
      .from('lessons')
      .select('id')
      .eq('course_id', id)

    // Check for lessons with steps
    const lessonIds = (lessons || []).map(l => l.id)
    let hasLessonWithSteps = false
    if (lessonIds.length > 0) {
      const { data: stepsCheck } = await supabase
        .from('lesson_steps')
        .select('lesson_id')
        .in('lesson_id', lessonIds)
        .limit(1)
      hasLessonWithSteps = !!(stepsCheck && stepsCheck.length > 0)
    }

    const missing: string[] = []
    if (!modules || modules.length === 0) missing.push('at least 1 module')
    if (!hasLessonWithSteps) missing.push('at least 1 lesson with steps')

    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Cannot publish: course is missing ${missing.join(', ')}` },
        { status: 400 }
      )
    }

    const published_at = new Date().toISOString()

    const { error: updateError } = await supabase
      .from('courses')
      .update({ status: 'published', published_at })
      .eq('id', id)

    if (updateError) {
      console.error('Publish course error:', updateError)
      return NextResponse.json({ error: 'Failed to publish course' }, { status: 500 })
    }

    return NextResponse.json({ status: 'published', published_at })
  } catch (err) {
    console.error('POST /api/creator/courses/[id]/publish error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
