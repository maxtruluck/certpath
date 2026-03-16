import { NextRequest, NextResponse } from 'next/server'
import { getCreatorCourse } from '@/lib/supabase/get-creator-course'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    const { id, moduleId } = await params
    const { supabase, error } = await getCreatorCourse(id)
    if (error) return error

    const body = await request.json()
    const { title, description } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Verify module belongs to course
    const { data: mod } = await supabase
      .from('modules')
      .select('id')
      .eq('id', moduleId)
      .eq('course_id', id)
      .single()

    if (!mod) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    // Get next display_order within this module
    const { data: existing } = await supabase
      .from('topics')
      .select('display_order')
      .eq('module_id', moduleId)
      .order('display_order', { ascending: false })
      .limit(1)

    const nextOrder = existing && existing.length > 0 ? existing[0].display_order + 1 : 0

    const { data: topic, error: insertError } = await supabase
      .from('topics')
      .insert({
        module_id: moduleId,
        course_id: id,
        title: title.trim(),
        description: description || null,
        display_order: nextOrder,
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('Create topic error:', insertError)
      return NextResponse.json({ error: 'Failed to create topic' }, { status: 500 })
    }

    return NextResponse.json(topic, { status: 201 })
  } catch (err) {
    console.error('POST topic error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
