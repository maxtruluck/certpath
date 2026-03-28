import { NextRequest, NextResponse } from 'next/server'
import { getCreatorCourse } from '@/lib/supabase/get-creator-course'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  try {
    const { id, lessonId } = await params
    const { supabase, error } = await getCreatorCourse(id)
    if (error) return error

    const { data: steps, error: fetchError } = await supabase
      .from('lesson_steps')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('sort_order')

    if (fetchError) {
      console.error('Fetch steps error:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch steps' }, { status: 500 })
    }

    return NextResponse.json(steps || [])
  } catch (err) {
    console.error('GET lesson steps error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  try {
    const { id, lessonId } = await params
    const { supabase, error } = await getCreatorCourse(id)
    if (error) return error

    const body = await request.json()
    const { step_type, title, content, sort_order } = body

    if (!step_type || !['read', 'watch', 'answer', 'embed', 'callout'].includes(step_type)) {
      return NextResponse.json({ error: 'Valid step_type is required' }, { status: 400 })
    }

    // Determine sort_order: use provided value or append at end
    let finalOrder = sort_order
    if (finalOrder == null) {
      const { data: existing } = await supabase
        .from('lesson_steps')
        .select('sort_order')
        .eq('lesson_id', lessonId)
        .order('sort_order', { ascending: false })
        .limit(1)

      finalOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0
    } else {
      // Shift existing steps down to make room at this position
      const { data: toShift } = await supabase
        .from('lesson_steps')
        .select('id, sort_order')
        .eq('lesson_id', lessonId)
        .gte('sort_order', finalOrder)
        .order('sort_order', { ascending: false })

      if (toShift && toShift.length > 0) {
        for (const s of toShift) {
          await supabase
            .from('lesson_steps')
            .update({ sort_order: s.sort_order + 1 })
            .eq('id', s.id)
        }
      }
    }

    const { data: step, error: insertError } = await supabase
      .from('lesson_steps')
      .insert({
        lesson_id: lessonId,
        sort_order: finalOrder,
        step_type,
        title: title || null,
        content: content || {},
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('Create step error:', insertError)
      return NextResponse.json({ error: 'Failed to create step' }, { status: 500 })
    }

    return NextResponse.json(step, { status: 201 })
  } catch (err) {
    console.error('POST lesson step error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
