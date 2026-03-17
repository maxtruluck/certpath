import { NextRequest, NextResponse } from 'next/server'
import { getApiUser } from '@/lib/supabase/get-user-api'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    const { supabase, userId, error } = await getApiUser()
    if (error) return error

    const { topicId } = await params
    const body = await request.json()
    const { course_id } = body

    if (!course_id) {
      return NextResponse.json({ error: 'course_id is required' }, { status: 400 })
    }

    const { data, error: upsertError } = await supabase
      .from('user_topic_reads')
      .upsert(
        { user_id: userId, topic_id: topicId, course_id, read_at: new Date().toISOString() },
        { onConflict: 'user_id,topic_id' }
      )
      .select('read_at')
      .single()

    if (upsertError) {
      console.error('Upsert topic read error:', upsertError)
      return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 })
    }

    return NextResponse.json({ success: true, read_at: data.read_at })
  } catch (err) {
    console.error('POST topic-read error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    const { supabase, userId, error } = await getApiUser()
    if (error) return error

    const { topicId } = await params

    const { data } = await supabase
      .from('user_topic_reads')
      .select('read_at')
      .eq('user_id', userId)
      .eq('topic_id', topicId)
      .maybeSingle()

    return NextResponse.json({
      read: !!data,
      read_at: data?.read_at ?? null,
    })
  } catch (err) {
    console.error('GET topic-read error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
