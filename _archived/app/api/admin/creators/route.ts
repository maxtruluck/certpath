import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/require-admin'

export async function GET(request: NextRequest) {
  try {
    const { supabase, error } = await requireAdmin()
    if (error) return error

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    let query = supabase
      .from('creators')
      .select(`
        *,
        profile:profiles!creators_user_id_fkey(display_name, avatar_url, role)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: creators, count, error: queryError } = await query

    if (queryError) {
      console.error('List creators query error:', queryError)
      return NextResponse.json({ error: 'Failed to fetch creators' }, { status: 500 })
    }

    return NextResponse.json({
      creators: creators || [],
      total: count || 0,
      page,
      limit,
    })
  } catch (err) {
    console.error('GET /api/admin/creators error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
