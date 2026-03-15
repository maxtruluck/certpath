import { NextRequest, NextResponse } from 'next/server'
import { getApiUser } from '@/lib/supabase/get-user-api'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { supabase, userId, error } = await getApiUser()
    if (error) return error

    const { slug } = await params

    // Fetch course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Get user enrollment for current_topic_id
    const { data: userCourse } = await supabase
      .from('user_courses')
      .select('current_topic_id')
      .eq('user_id', userId)
      .eq('course_id', course.id)
      .maybeSingle()

    // Fetch modules and topics with guidebook_content presence
    const { data: modules } = await supabase
      .from('modules')
      .select('id, title, description, guidebook_content, display_order')
      .eq('course_id', course.id)
      .order('display_order', { ascending: true })

    const { data: topics } = await supabase
      .from('topics')
      .select('id, module_id, title, description, guidebook_content, display_order')
      .eq('course_id', course.id)
      .order('display_order', { ascending: true })

    const modulesWithTopics = (modules || []).map((m: any) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      display_order: m.display_order,
      has_guidebook: !!(m.guidebook_content && m.guidebook_content.trim()),
      topics: (topics || [])
        .filter((t: any) => t.module_id === m.id)
        .map((t: any) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          display_order: t.display_order,
          has_guidebook: !!(t.guidebook_content && t.guidebook_content.trim()),
        })),
    }))

    return NextResponse.json({
      current_topic_id: userCourse?.current_topic_id || null,
      modules: modulesWithTopics,
    })
  } catch (err) {
    console.error('GET /api/courses/[slug]/guidebook error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
