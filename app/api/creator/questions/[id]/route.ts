import { NextRequest, NextResponse } from 'next/server'
import { getApiUser } from '@/lib/supabase/get-user-api'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { supabase, userId, error } = await getApiUser()
    if (error) return error

    // Verify creator
    const { data: creator } = await supabase
      .from('creators')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    // Verify question belongs to this creator
    const { data: question } = await supabase
      .from('questions')
      .select('id, creator_id')
      .eq('id', id)
      .eq('creator_id', creator.id)
      .single()

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    const body = await request.json()
    const { id: _id, creator_id: _cid, created_at: _ca, course_id: _courseId, ...updates } = body

    const { data: updated, error: updateError } = await supabase
      .from('questions')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()

    if (updateError) {
      console.error('Question update error:', updateError)
      return NextResponse.json({ error: 'Failed to update question' }, { status: 500 })
    }

    return NextResponse.json(updated)
  } catch (err) {
    console.error('PATCH /api/creator/questions/[id] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
