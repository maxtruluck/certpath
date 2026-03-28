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

    // Count lesson_steps per lesson to verify content exists
    const lessonIds = (lessons || []).map((l: any) => l.id)
    let lessonsWithSteps = 0
    let totalStepCount = 0

    if (lessonIds.length > 0) {
      const { data: steps } = await supabase
        .from('lesson_steps')
        .select('id, lesson_id')
        .in('lesson_id', lessonIds)

      const stepsByLesson = new Map<string, number>()
      for (const s of steps || []) {
        stepsByLesson.set(s.lesson_id, (stepsByLesson.get(s.lesson_id) || 0) + 1)
      }

      totalStepCount = (steps || []).length
      lessonsWithSteps = stepsByLesson.size
    }

    const missing: string[] = []
    if (!modules || modules.length === 0) missing.push('at least 1 module')
    if (lessonsWithSteps === 0) missing.push('at least 1 lesson with content')

    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Cannot publish: course is missing ${missing.join(', ')}` },
        { status: 400 }
      )
    }

    // Estimate duration: 2 minutes per step
    const estimatedMinutes = Math.max(1, totalStepCount * 2)

    const published_at = new Date().toISOString()
    const updateData: Record<string, unknown> = {
      status: 'published',
      published_at,
      estimated_duration_minutes: estimatedMinutes,
    }

    const { error: updateError } = await supabase
      .from('courses')
      .update(updateData)
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
