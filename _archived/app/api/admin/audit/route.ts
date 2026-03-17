import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/require-admin'

export async function GET(request: NextRequest) {
  try {
    const { supabase, error } = await requireAdmin()
    if (error) return error

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    const { data: entries, count, error: queryError } = await supabase
      .from('admin_audit_log')
      .select(`
        *,
        admin:profiles!admin_audit_log_admin_user_id_fkey(display_name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (queryError) {
      console.error('Audit log query error:', queryError)
      return NextResponse.json({ error: 'Failed to fetch audit log' }, { status: 500 })
    }

    return NextResponse.json({
      entries: entries || [],
      total: count || 0,
      page,
      limit,
    })
  } catch (err) {
    console.error('GET /api/admin/audit error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
