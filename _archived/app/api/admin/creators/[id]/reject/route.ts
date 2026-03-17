import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/require-admin'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { supabase, userId, error } = await requireAdmin()
    if (error) return error

    const body = await request.json().catch(() => ({}))
    const reason = body.reason || ''

    if (!reason.trim()) {
      return NextResponse.json({ error: 'Reason is required' }, { status: 400 })
    }

    const { data: creator, error: updateError } = await supabase
      .from('creators')
      .update({ status: 'rejected' })
      .eq('id', id)
      .eq('status', 'pending')
      .select('id, status, user_id')
      .single()

    if (updateError || !creator) {
      console.error('Reject creator error:', updateError)
      return NextResponse.json({ error: 'Failed to reject creator' }, { status: 500 })
    }

    // Audit log
    await supabase.from('admin_audit_log').insert({
      admin_user_id: userId,
      action: 'creator.reject',
      target_type: 'creator',
      target_id: id,
      metadata: { reason, previous_status: 'pending', new_status: 'rejected' },
    })

    return NextResponse.json({ creator })
  } catch (err) {
    console.error('PATCH /api/admin/creators/[id]/reject error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
