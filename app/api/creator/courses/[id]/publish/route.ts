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
      .select('id, is_founding_creator, founding_creator_expires_at')
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
      .select('id, body')
      .eq('course_id', id)
      .eq('is_active', true)

    // Check for lessons with body content (>= 50 chars)
    const lessonsWithContent = (lessons || []).filter(
      (l: any) => (l.body || '').length >= 50
    )

    const missing: string[] = []
    if (!modules || modules.length === 0) missing.push('at least 1 module')
    if (lessonsWithContent.length === 0) missing.push('at least 1 lesson with content')

    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Cannot publish: course is missing ${missing.join(', ')}` },
        { status: 400 }
      )
    }

    // Compute estimated_duration_minutes from total word count
    const totalWords = (lessons || []).reduce((sum: number, l: any) => {
      return sum + (l.body || '').split(/\s+/).filter(Boolean).length
    }, 0)
    const estimatedMinutes = Math.max(1, Math.round(totalWords / 200))

    const published_at = new Date().toISOString()
    const updateData: Record<string, unknown> = {
      status: 'published',
      published_at,
      estimated_duration_minutes: estimatedMinutes,
    }

    // Set founding creator expiry on first publish
    if (creator.is_founding_creator && !creator.founding_creator_expires_at) {
      const expiresAt = new Date()
      expiresAt.setFullYear(expiresAt.getFullYear() + 1)
      await supabase
        .from('creators')
        .update({ founding_creator_expires_at: expiresAt.toISOString() })
        .eq('id', creator.id)
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
