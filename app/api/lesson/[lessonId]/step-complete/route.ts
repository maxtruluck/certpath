import { NextRequest, NextResponse } from 'next/server'
import { getApiUser } from '@/lib/supabase/get-user-api'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { supabase, userId, error } = await getApiUser()
    if (error) return error

    const { lessonId } = await params
    const body = await request.json()
    const { step_index, total_steps, is_correct } = body

    if (step_index == null || total_steps == null) {
      return NextResponse.json({ error: 'step_index and total_steps are required' }, { status: 400 })
    }

    // Look up the lesson to get course_id and module_id
    const { data: lesson } = await supabase
      .from('lessons')
      .select('course_id, module_id')
      .eq('id', lessonId)
      .single()

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    // Get or create progress row
    const { data: progress } = await supabase
      .from('user_lesson_progress')
      .select('id, status, session_items_completed, session_items_total, step_completions, current_step_index')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .maybeSingle()

    if (!progress) {
      // Create new progress row with course_id
      const stepCompletions = [{ step_index, is_correct: is_correct ?? null, completed_at: new Date().toISOString() }]
      await supabase.from('user_lesson_progress').insert({
        user_id: userId,
        lesson_id: lessonId,
        course_id: lesson.course_id,
        module_id: lesson.module_id,
        status: step_index >= total_steps - 1 ? 'completed' : 'in_progress',
        session_items_completed: 1,
        session_items_total: total_steps,
        current_step_index: step_index,
        step_completions: stepCompletions,
        started_at: new Date().toISOString(),
        completed_at: step_index >= total_steps - 1 ? new Date().toISOString() : null,
      })
    } else {
      // Update existing progress
      const existingCompletions: any[] = progress.step_completions || []
      const alreadyCompleted = existingCompletions.some((c: any) => c.step_index === step_index)

      if (!alreadyCompleted) {
        existingCompletions.push({
          step_index,
          is_correct: is_correct ?? null,
          completed_at: new Date().toISOString(),
        })
      }

      const newCompleted = existingCompletions.length
      const isLessonComplete = newCompleted >= total_steps

      await supabase
        .from('user_lesson_progress')
        .update({
          session_items_completed: newCompleted,
          session_items_total: total_steps,
          current_step_index: Math.max(progress.current_step_index || 0, step_index),
          step_completions: existingCompletions,
          status: isLessonComplete ? 'completed' : 'in_progress',
          completed_at: isLessonComplete ? new Date().toISOString() : null,
        })
        .eq('id', progress.id)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('POST /api/lesson/[lessonId]/step-complete error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
