import { NextRequest, NextResponse } from 'next/server'
import { getApiUser } from '@/lib/supabase/get-user-api'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    const { topicId } = await params
    const { supabase, userId, error } = await getApiUser()
    if (error) return error

    // Upsert — if already seen, ignore
    await supabase
      .from('user_topic_intros')
      .upsert(
        { user_id: userId, topic_id: topicId },
        { onConflict: 'user_id,topic_id' }
      )

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('POST topic-intro/seen error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
