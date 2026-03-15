import { NextRequest, NextResponse } from 'next/server'
import { getApiUser } from '@/lib/supabase/get-user-api'

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { supabase, error } = await getApiUser()
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

    return NextResponse.json({ course })
  } catch (err) {
    console.error('PATCH /api/admin/courses/[id]/approve error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
