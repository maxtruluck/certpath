import { getApiUser } from '@/lib/supabase/get-user-api'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const { supabase, userId, error } = await getApiUser()
    if (error) return error

    const { data: creator } = await supabase
      .from('creators')
      .select('creator_name, bio, expertise_areas, credentials')
      .eq('user_id', userId)
      .single()

    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('id', userId)
      .single()

    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    return NextResponse.json({
      creator_name: creator.creator_name,
      bio: creator.bio || '',
      expertise_areas: creator.expertise_areas || [],
      credentials: creator.credentials || '',
      display_name: profile?.display_name || '',
      avatar_url: profile?.avatar_url || '',
    })
  } catch (err) {
    console.error('GET /api/creator/settings error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { supabase, userId, error } = await getApiUser()
    if (error) return error

    const body = await request.json()

    const { data: creator } = await supabase
      .from('creators').select('id').eq('user_id', userId).single()
    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    // Update creator fields
    const creatorUpdates: Record<string, unknown> = {}
    if (body.creator_name !== undefined) creatorUpdates.creator_name = body.creator_name
    if (body.bio !== undefined) creatorUpdates.bio = body.bio
    if (body.credentials !== undefined) creatorUpdates.credentials = body.credentials

    if (Object.keys(creatorUpdates).length > 0) {
      await supabase.from('creators').update(creatorUpdates).eq('id', creator.id)
    }

    // Update profile fields
    const profileUpdates: Record<string, unknown> = {}
    if (body.display_name !== undefined) profileUpdates.display_name = body.display_name

    if (Object.keys(profileUpdates).length > 0) {
      await supabase.from('profiles').update(profileUpdates).eq('id', userId)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('PATCH /api/creator/settings error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
