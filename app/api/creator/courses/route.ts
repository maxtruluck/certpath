import { NextRequest, NextResponse } from 'next/server'
import { getApiUser } from '@/lib/supabase/get-user-api'
import { getCategoryColor } from '@/lib/category-colors'

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
  const suffix = Math.random().toString(36).substring(2, 6)
  return `${base}-${suffix}`
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, userId, error } = await getApiUser()
    if (error) return error

    // Verify creator is approved
    const { data: creator } = await supabase
      .from('creators')
      .select('id, status')
      .eq('user_id', userId)
      .single()

    if (!creator) {
      return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 })
    }
    if (creator.status !== 'approved' && creator.status !== 'pending') {
      return NextResponse.json({ error: 'Creator must be approved to create courses' }, { status: 403 })
    }

    const body = await request.json()
    const {
      title,
      description,
      category,
      difficulty,
      is_free,
      price_cents,
      currency,
      tags,
      learning_objectives,
      card_color,
      estimated_duration,
    } = body

    if (!title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }

    // Generate unique slug with random suffix, retry on collision
    let slug = generateSlug(title)
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data: existing } = await supabase
        .from('courses')
        .select('id')
        .eq('slug', slug)
        .single()
      if (!existing) break
      slug = generateSlug(title)
    }

    const { data: course, error: insertError } = await supabase
      .from('courses')
      .insert({
        creator_id: creator.id,
        title,
        slug,
        description: description || '',
        category: category || 'general_knowledge',
        difficulty: difficulty || 'beginner',
        is_free: is_free ?? true,
        price_cents: price_cents || 0,
        currency: currency || 'usd',
        tags: tags || [],
        learning_objectives: learning_objectives || [],
        card_color: card_color || getCategoryColor(category || 'General'),
        estimated_duration: estimated_duration || null,
        status: 'draft',
      })
      .select('id, slug, status')
      .single()

    if (insertError) {
      console.error('Course create error:', insertError)
      return NextResponse.json({ error: 'Failed to create course' }, { status: 500 })
    }

    return NextResponse.json(course, { status: 201 })
  } catch (err) {
    console.error('POST /api/creator/courses error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
