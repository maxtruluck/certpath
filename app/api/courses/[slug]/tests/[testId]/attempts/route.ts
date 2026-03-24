import { NextRequest, NextResponse } from 'next/server'
import { getApiUser } from '@/lib/supabase/get-user-api'

/**
 * GET — List user's attempts for a test.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string; testId: string }> }
) {
  try {
    const { supabase, userId, error } = await getApiUser()
    if (error) return error

    const { testId } = await params

    const { data: attempts } = await supabase
      .from('test_attempts')
      .select('id, started_at, completed_at, score, score_percent, passed, status, time_spent_seconds')
      .eq('test_id', testId)
      .eq('user_id', userId)
      .order('started_at', { ascending: false })

    return NextResponse.json(attempts || [])
  } catch (err) {
    console.error('GET attempts error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
