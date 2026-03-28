import { NextRequest, NextResponse } from 'next/server'
import { getCreatorCourse } from '@/lib/supabase/get-creator-course'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    const { id, moduleId } = await params
    const { supabase, error } = await getCreatorCourse(id)
    if (error) return error

    const { data: lessons, error: fetchError } = await supabase
      .from('lessons')
      .select('id, title, display_order, created_at, updated_at')
      .eq('module_id', moduleId)
      .eq('course_id', id)
      .order('display_order')

    if (fetchError) {
      return NextResponse.json({ error: 'Failed to fetch lessons' }, { status: 500 })
    }

    // Count steps per lesson
    const lessonIds = (lessons || []).map((l: any) => l.id)
    const stepsByLesson = new Map<string, number>()

    if (lessonIds.length > 0) {
      const { data: steps } = await supabase
        .from('lesson_steps')
        .select('id, lesson_id')
        .in('lesson_id', lessonIds)

      for (const s of steps || []) {
        stepsByLesson.set(s.lesson_id, (stepsByLesson.get(s.lesson_id) || 0) + 1)
      }
    }

    const enriched = (lessons || []).map((l: any) => ({
      ...l,
      step_count: stepsByLesson.get(l.id) || 0,
    }))

    return NextResponse.json(enriched)
  } catch (err) {
    console.error('GET module lessons error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    const { id, moduleId } = await params
    const { supabase, error } = await getCreatorCourse(id)
    if (error) return error

    const body = await request.json()

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

    // Get next display_order
    const { data: existing } = await supabase
      .from('lessons')
      .select('display_order')
      .eq('module_id', moduleId)
      .eq('course_id', id)
      .order('display_order', { ascending: false })
      .limit(1)

    const nextOrder = (existing?.[0]?.display_order ?? -1) + 1

    const { data: lesson, error: insertError } = await supabase
      .from('lessons')
      .insert({
        module_id: moduleId,
        course_id: id,
        title: body.title || 'Untitled Lesson',
        display_order: nextOrder,
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('Create lesson error:', insertError)
      return NextResponse.json({ error: 'Failed to create lesson' }, { status: 500 })
    }

    return NextResponse.json(lesson, { status: 201 })
  } catch (err) {
    console.error('POST module lesson error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
