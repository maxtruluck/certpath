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

    // Fetch modules and lessons
    const [modulesRes, lessonsRes] = await Promise.all([
      supabase.from('modules').select('id').eq('course_id', course.id),
      supabase.from('lessons').select('id').eq('course_id', course.id),
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
      user_progress: userProgress || null,
    })
  } catch (err) {
    console.error('GET /api/courses/[slug] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
