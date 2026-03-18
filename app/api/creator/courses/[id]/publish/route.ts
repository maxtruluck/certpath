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
