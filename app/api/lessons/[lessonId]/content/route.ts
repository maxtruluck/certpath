import { NextRequest, NextResponse } from 'next/server'
import { getApiUser } from '@/lib/supabase/get-user-api'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { supabase, userId, error } = await getApiUser()
    if (error) return error
    const { lessonId } = await params

    // Fetch lesson metadata with module title via join
    const { data: lesson } = await supabase
      .from('lessons')
      .select('id, title, module_id, course_id, modules(title)')
      .eq('id', lessonId)
      .single()

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    // Fetch course slug for navigation
    const { data: course } = await supabase
      .from('courses')
      .select('slug')
      .eq('id', lesson.course_id)
      .single()

    // Fetch all steps ordered
    const { data: rawSteps } = await supabase
      .from('lesson_steps')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('sort_order', { ascending: true })

    if (!rawSteps || rawSteps.length === 0) {
      return NextResponse.json({ error: 'No content available for this lesson' }, { status: 404 })
    }

    // Transform steps to match the StepData format the lesson player expects
    const steps = rawSteps.map((step: any) => {
      const c = step.content || {}
      switch (step.step_type) {
        case 'watch':
          return { type: 'watch', title: step.title || '', watchUrl: c.video_url || c.url || '' }
        case 'answer':
          return {
            type: 'answer',
            title: step.title || '',
            question: {
              id: step.id,
              question_text: c.question_text || '',
              question_type: c.question_type || 'multiple_choice',
              options: c.options || [],
              correct_option_ids: c.correct_ids || c.correct_option_ids || [],
              explanation: c.explanation || '',
              option_explanations: c.option_explanations || {},
              acceptable_answers: c.acceptable_answers,
              correct_order: c.correct_order,
              matching_items: c.matching_pairs ? {
                lefts: c.matching_pairs.map((p: any) => p.left),
                rights: c.matching_pairs.map((p: any) => p.right),
              } : undefined,
            },
          }
        case 'embed':
          return { type: 'embed', title: step.title || '', embedContent: c }
        case 'callout':
          return { type: 'callout', title: step.title || '', calloutContent: c }
        case 'read':
        default:
          return { type: 'read', title: step.title || '', markdown: c.markdown || c.body || '' }
      }
    })

    return NextResponse.json({
      lesson: {
        id: lesson.id,
        title: lesson.title,
        module_title: (lesson as any).modules?.title || '',
        course_id: lesson.course_id,
        course_slug: course?.slug || '',
      },
      steps,
    })
  } catch (err) {
    console.error('GET /api/lessons/[lessonId]/content error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
