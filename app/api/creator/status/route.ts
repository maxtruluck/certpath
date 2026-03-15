import { NextRequest, NextResponse } from 'next/server'
import { getApiUser } from '@/lib/supabase/get-user-api'

export async function GET(_request: NextRequest) {
  try {
    const { supabase, userId, error } = await getApiUser()
    if (error) return error

    const { data: creator, error: queryError } = await supabase
      .from('creators')
      .select('status, created_at')
      .eq('user_id', userId)
      .single()

    if (queryError || !creator) {
      return NextResponse.json({ status: 'not_applied', applied_at: null, approved_at: null })
    }

    return NextResponse.json({
      status: creator.status,
      applied_at: creator.created_at,
      approved_at: creator.status === 'approved' ? creator.created_at : null,
    })
  } catch (err) {
    console.error('GET /api/creator/status error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
