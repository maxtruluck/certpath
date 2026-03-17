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

    const { data: course, error: updateError } = await supabase
      .from('courses')
      .update({ status: 'published', published_at: new Date().toISOString() })
      .eq('id', id)
      .eq('status', 'in_review')
      .select('id, title, status, published_at')
      .single()

    if (updateError || !course) {
      console.error('Approve course error:', updateError)
      return NextResponse.json({ error: 'Failed to approve course' }, { status: 500 })
    }

    // Audit log
    await supabase.from('admin_audit_log').insert({
      admin_user_id: userId,
      action: 'course.approve',
      target_type: 'course',
      target_id: id,
      metadata: { previous_status: 'in_review', new_status: 'published' },
    })

    return NextResponse.json({ course })
  } catch (err) {
    console.error('PATCH /api/admin/courses/[id]/approve error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
