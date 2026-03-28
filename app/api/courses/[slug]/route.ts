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

    // Fetch course with creator
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select(`
        *,
        creator:creators(id, creator_name, bio, expertise_areas, credentials)
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Fetch modules with their lessons for the collapsible preview
    const [modulesRes, lessonsRes] = await Promise.all([
      supabase
        .from('modules')
        .select('id, title, display_order')
        .eq('course_id', course.id)
        .order('display_order', { ascending: true }),
      supabase
        .from('lessons')
        .select('id, module_id, title, display_order')
        .eq('course_id', course.id)
        .order('display_order', { ascending: true }),
    ])

    // Count answer-type lesson_steps (lesson_steps has no course_id, join via lesson_ids)
    const lessonIds = (lessonsRes.data || []).map((l: any) => l.id)
    let questionCount = 0
    if (lessonIds.length > 0) {
      const { data: answerSteps } = await supabase
        .from('lesson_steps')
        .select('id')
        .in('lesson_id', lessonIds)
        .eq('step_type', 'answer')
      questionCount = answerSteps?.length || 0
    }

    const stats = {
      module_count: modulesRes.data?.length || 0,
      lesson_count: lessonsRes.data?.length || 0,
      question_count: questionCount,
    }

    // Group lessons by module for collapsible preview
    const lessonsByModule: Record<string, any[]> = {}
    for (const l of lessonsRes.data || []) {
      if (!lessonsByModule[l.module_id]) lessonsByModule[l.module_id] = []
      lessonsByModule[l.module_id].push({ id: l.id, title: l.title, display_order: l.display_order })
    }
    const modules = (modulesRes.data || []).map((m: any) => ({
      id: m.id,
      title: m.title,
      display_order: m.display_order,
      lessons: (lessonsByModule[m.id] || []).sort((a: any, b: any) => a.display_order - b.display_order),
    }))

    // User progress
    const { data: userProgress } = await supabase
      .from('user_courses')
      .select('*')
      .eq('course_id', course.id)
      .eq('user_id', userId)
      .maybeSingle()

    return NextResponse.json({
      ...course,
      stats,
      modules,
      user_progress: userProgress || null,
    })
  } catch (err) {
    console.error('GET /api/courses/[slug] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
