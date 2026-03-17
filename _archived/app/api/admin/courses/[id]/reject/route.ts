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

    const { data: course, error: updateError } = await supabase
      .from('courses')
      .update({ status: 'draft' })
      .eq('id', id)
      .eq('status', 'in_review')
      .select('id, title, status')
      .single()

    if (updateError || !course) {
      console.error('Reject course error:', updateError)
      return NextResponse.json({ error: 'Failed to reject course' }, { status: 500 })
    }

    // Audit log
    await supabase.from('admin_audit_log').insert({
      admin_user_id: userId,
      action: 'course.reject',
      target_type: 'course',
      target_id: id,
      metadata: { reason, previous_status: 'in_review', new_status: 'draft' },
    })

    return NextResponse.json({ course, reason })
  } catch (err) {
    console.error('PATCH /api/admin/courses/[id]/reject error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
