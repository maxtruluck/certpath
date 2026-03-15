import { NextRequest, NextResponse } from 'next/server'
import { getApiUser } from '@/lib/supabase/get-user-api'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80)
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
    if (creator.status !== 'approved') {
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
      provider_name,
      exam_fee_cents,
      passing_score,
      exam_duration_minutes,
      total_questions_on_exam,
      max_score,
      provider_url,
    } = body

    if (!title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }

    // Generate unique slug
    let slug = slugify(title)
    const { data: existingSlugs } = await supabase
      .from('courses')
      .select('slug')
      .ilike('slug', `${slug}%`)

    if (existingSlugs && existingSlugs.length > 0) {
      slug = `${slug}-${existingSlugs.length + 1}`
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
        provider_name: provider_name || null,
        exam_fee_cents: exam_fee_cents || null,
        passing_score: passing_score || null,
        exam_duration_minutes: exam_duration_minutes || null,
        total_questions_on_exam: total_questions_on_exam || null,
        max_score: max_score || null,
        provider_url: provider_url || null,
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
