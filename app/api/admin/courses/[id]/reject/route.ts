import { NextRequest, NextResponse } from 'next/server'
import { getApiUser } from '@/lib/supabase/get-user-api'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { supabase, error } = await getApiUser()
    if (error) return error

    const body = await request.json().catch(() => ({}))
    const reason = body.reason || ''

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

    return NextResponse.json({ course, reason })
  } catch (err) {
    console.error('PATCH /api/admin/courses/[id]/reject error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
