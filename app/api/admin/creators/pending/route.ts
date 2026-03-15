import { NextRequest, NextResponse } from 'next/server'
import { getApiUser } from '@/lib/supabase/get-user-api'

export async function GET(_request: NextRequest) {
  try {
    const { supabase, error } = await getApiUser()
    if (error) return error

    const { data: creators, error: queryError } = await supabase
      .from('creators')
      .select(`
        *,
        profile:profiles!creators_user_id_fkey(display_name, avatar_url, role)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    if (queryError) {
      console.error('Pending creators query error:', queryError)
      return NextResponse.json({ error: 'Failed to fetch pending creators' }, { status: 500 })
    }

    return NextResponse.json({ creators: creators || [] })
  } catch (err) {
    console.error('GET /api/admin/creators/pending error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
