import { NextRequest, NextResponse } from 'next/server'
import { getCreatorCourse } from '@/lib/supabase/get-creator-course'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    const { id, moduleId } = await params
    const { supabase, error } = await getCreatorCourse(id)
    if (error) return error

    const body = await request.json()
    const { title, description } = body

    const updates: Record<string, unknown> = {}
    if (title !== undefined) updates.title = title.trim()
    if (description !== undefined) updates.description = description

    const { data: mod, error: updateError } = await supabase
      .from('modules')
      .update(updates)
      .eq('id', moduleId)
      .eq('course_id', id)
      .select('*')
      .single()

    if (updateError || !mod) {
      return NextResponse.json({ error: 'Failed to update module' }, { status: 500 })
    }

    return NextResponse.json(mod)
  } catch (err) {
    console.error('PATCH module error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    const { id, moduleId } = await params
    const { supabase, error } = await getCreatorCourse(id)
    if (error) return error

    const { error: deleteError } = await supabase
      .from('modules')
      .delete()
      .eq('id', moduleId)
      .eq('course_id', id)

    if (deleteError) {
      console.error('Delete module error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete module' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE module error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
