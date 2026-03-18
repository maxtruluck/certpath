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
      .select('id, title, body, display_order, is_active, video_url, concept_cards')
      .eq('module_id', moduleId)
      .eq('course_id', id)
      .eq('is_active', true)
      .order('display_order')

    if (fetchError) {
      return NextResponse.json({ error: 'Failed to fetch lessons' }, { status: 500 })
    }

    // Count questions per lesson
    const { data: questions } = await supabase
      .from('questions')
      .select('id, lesson_id')
      .eq('course_id', id)
      .eq('is_active', true)

    const questionsByLesson = new Map<string, number>()
    for (const q of questions || []) {
      if (q.lesson_id) {
        questionsByLesson.set(q.lesson_id, (questionsByLesson.get(q.lesson_id) || 0) + 1)
      }
    }

    const enriched = (lessons || []).map((l: any) => ({
      ...l,
      question_count: questionsByLesson.get(l.id) || 0,
      word_count: (l.body || '').split(/\s+/).filter(Boolean).length,
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
        body: '',
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
