import { NextRequest, NextResponse } from 'next/server'
import { getCreatorCourse } from '@/lib/supabase/get-creator-course'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { supabase, creatorId, error } = await getCreatorCourse(id)
    if (error) return error

    const body = await request.json()
    const { title, description } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Get next display_order
    const { data: existing } = await supabase
      .from('modules')
      .select('display_order')
      .eq('course_id', id)
      .order('display_order', { ascending: false })
      .limit(1)

    const nextOrder = existing && existing.length > 0 ? existing[0].display_order + 1 : 0

    const { data: mod, error: insertError } = await supabase
      .from('modules')
      .insert({
        course_id: id,
        title: title.trim(),
        description: description || null,
        display_order: nextOrder,
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('Create module error:', insertError)
      return NextResponse.json({ error: 'Failed to create module' }, { status: 500 })
    }

    return NextResponse.json(mod, { status: 201 })
  } catch (err) {
    console.error('POST /api/creator/courses/[id]/modules error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { supabase, error } = await getCreatorCourse(id)
    if (error) return error

    const body = await request.json()
    const { order } = body // array of { id, display_order }

    if (!Array.isArray(order)) {
      return NextResponse.json({ error: 'order array is required' }, { status: 400 })
    }

    // Batch update display_order
    for (const item of order) {
      await supabase
        .from('modules')
        .update({ display_order: item.display_order })
        .eq('id', item.id)
        .eq('course_id', id)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('PATCH /api/creator/courses/[id]/modules error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
