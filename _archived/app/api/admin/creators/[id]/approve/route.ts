import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/require-admin'

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { supabase, userId, error } = await requireAdmin()
    if (error) return error

    const { data: creator, error: updateError } = await supabase
      .from('creators')
      .update({ status: 'approved' })
      .eq('id', id)
      .select('id, status, user_id')
      .single()

    if (updateError || !creator) {
      console.error('Approve creator error:', updateError)
      return NextResponse.json({ error: 'Failed to approve creator' }, { status: 500 })
    }

    // Update profile role to creator
    await supabase
      .from('profiles')
      .update({ role: 'creator' })
      .eq('id', creator.user_id)

    // Audit log
    await supabase.from('admin_audit_log').insert({
      admin_user_id: userId,
      action: 'creator.approve',
      target_type: 'creator',
      target_id: id,
      metadata: { previous_status: 'pending', new_status: 'approved' },
    })

    return NextResponse.json({ creator })
  } catch (err) {
    console.error('PATCH /api/admin/creators/[id]/approve error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
