import { NextRequest, NextResponse } from 'next/server'
import { getApiUser } from '@/lib/supabase/get-user-api'

export async function POST(request: NextRequest) {
  try {
    const { supabase, userId, error } = await getApiUser()
    if (error) return error

    const body = await request.json()
    const { creator_name, bio, expertise_areas, credentials, website_url } = body

    if (!creator_name) {
      return NextResponse.json({ error: 'creator_name is required' }, { status: 400 })
    }

    // Check if already applied
    const { data: existing } = await supabase
      .from('creators')
      .select('id, status')
      .eq('user_id', userId)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Already applied as creator', creator_id: existing.id, status: existing.status },
        { status: 409 }
      )
    }

    // Insert creator application
    const { data: creator, error: insertError } = await supabase
      .from('creators')
      .insert({
        user_id: userId,
        creator_name,
        bio: bio || null,
        expertise_areas: expertise_areas || [],
        credentials: credentials || null,
        website_url: website_url || null,
        status: 'pending',
      })
      .select('id, status')
      .single()

    if (insertError) {
      console.error('Creator apply error:', insertError)
      return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 })
    }

    // Auto-approve at MVP — no gatekeeping
    await supabase
      .from('creators')
      .update({ status: 'approved' })
      .eq('id', creator.id)

    // Update profile role to creator
    await supabase
      .from('profiles')
      .update({ role: 'creator' })
      .eq('id', userId)

    return NextResponse.json({
      creator_id: creator.id,
      status: 'approved',
    })
  } catch (err) {
    console.error('POST /api/creator/apply error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
