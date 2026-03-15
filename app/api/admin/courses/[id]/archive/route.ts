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
      .update({ status: 'archived' })
      .eq('id', id)
      .eq('status', 'published')
      .select('id, title, status')
      .single()

    if (updateError || !course) {
      console.error('Archive course error:', updateError)
      return NextResponse.json({ error: 'Failed to archive course' }, { status: 500 })
    }

    // Audit log
    await supabase.from('admin_audit_log').insert({
      admin_user_id: userId,
      action: 'course.archive',
      target_type: 'course',
      target_id: id,
      metadata: { previous_status: 'published', new_status: 'archived' },
    })

    return NextResponse.json({ course })
  } catch (err) {
    console.error('PATCH /api/admin/courses/[id]/archive error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
