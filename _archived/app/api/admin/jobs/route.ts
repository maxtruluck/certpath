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
      .from('processing_jobs')
      .select(`
        *,
        course:courses(id, title, slug),
        creator:creators(id, creator_name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: jobs, count, error: queryError } = await query

    if (queryError) {
      console.error('List jobs query error:', queryError)
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
    }

    return NextResponse.json({
      jobs: jobs || [],
      total: count || 0,
      page,
      limit,
    })
  } catch (err) {
    console.error('GET /api/admin/jobs error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
