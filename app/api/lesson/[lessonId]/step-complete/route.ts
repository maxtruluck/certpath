// NOTE: No optimistic locking on step_completions JSONB updates.
// Concurrent requests could cause lost updates. Acceptable for MVP
// since handleNext() awaits the API call. Consider SELECT FOR UPDATE
// or JSONB append operator if issues arise at scale.

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
    const { step_index, total_steps: clientTotalSteps, is_correct } = body

    if (step_index == null || clientTotalSteps == null) {
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

    // Server-side authoritative step count (Fix 3)
    const { count: serverStepCount } = await supabase
      .from('lesson_steps')
      .select('*', { count: 'exact', head: true })
      .eq('lesson_id', lessonId)

    const totalSteps = serverStepCount ?? clientTotalSteps
    if (serverStepCount != null && serverStepCount !== clientTotalSteps) {
      console.warn(
        `step-complete: client sent total_steps=${clientTotalSteps} but server has ${serverStepCount} for lesson ${lessonId}`
      )
    }

    // Get or create progress row
    const { data: progress } = await supabase
      .from('user_lesson_progress')
      .select('id, status, session_items_completed, session_items_total, step_completions, current_step_index, completed_at')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .maybeSingle()

    if (!progress) {
      // Create new progress row
      let stepCompletions: any[] = [{ step_index, is_correct: is_correct ?? null, completed_at: new Date().toISOString() }]

      // If this is the last step, backfill any gaps (Fix 1)
      if (step_index >= totalSteps - 1) {
        stepCompletions = backfillGaps(stepCompletions, totalSteps)
      }

      const isComplete = stepCompletions.length >= totalSteps

      await supabase.from('user_lesson_progress').insert({
        user_id: userId,
        lesson_id: lessonId,
        course_id: lesson.course_id,
        module_id: lesson.module_id,
        status: isComplete ? 'completed' : 'in_progress',
        session_items_completed: stepCompletions.length,
        session_items_total: totalSteps,
        current_step_index: step_index,
        step_completions: stepCompletions,
        started_at: new Date().toISOString(),
        completed_at: isComplete ? new Date().toISOString() : null,
      })
    } else {
      // If lesson is already completed, preserve that state (Fix 4)
      if (progress.status === 'completed') {
        // Still update current_step_index and session_items_total in case steps changed,
        // but don't regress status or overwrite completed_at
        const existingCompletions: any[] = progress.step_completions || []
        const alreadyCompleted = existingCompletions.some((c: any) => c.step_index === step_index)

        if (!alreadyCompleted) {
          existingCompletions.push({
            step_index,
            is_correct: is_correct ?? null,
            completed_at: new Date().toISOString(),
          })
        }

        await supabase
          .from('user_lesson_progress')
          .update({
            session_items_completed: existingCompletions.length,
            session_items_total: totalSteps,
            current_step_index: Math.max(progress.current_step_index || 0, step_index),
            step_completions: existingCompletions,
            status: 'completed',
            completed_at: progress.completed_at,
          })
          .eq('id', progress.id)

        return NextResponse.json({ ok: true })
      }

      // Update existing in-progress row
      const existingCompletions: any[] = progress.step_completions || []
      const alreadyCompleted = existingCompletions.some((c: any) => c.step_index === step_index)

      if (!alreadyCompleted) {
        existingCompletions.push({
          step_index,
          is_correct: is_correct ?? null,
          completed_at: new Date().toISOString(),
        })
      }

      // If this is the last step, backfill any gaps (Fix 1)
      let finalCompletions = existingCompletions
      if (step_index >= totalSteps - 1) {
        finalCompletions = backfillGaps(existingCompletions, totalSteps)
      }

      const newCompleted = finalCompletions.length
      const isLessonComplete = newCompleted >= totalSteps

      await supabase
        .from('user_lesson_progress')
        .update({
          session_items_completed: newCompleted,
          session_items_total: totalSteps,
          current_step_index: Math.max(progress.current_step_index || 0, step_index),
          step_completions: finalCompletions,
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

/**
 * Backfill missing step indices in the completions array.
 * Called when processing the final step to ensure no gaps prevent completion.
 */
function backfillGaps(completions: any[], totalSteps: number): any[] {
  const existingIndices = new Set(completions.map((c: any) => c.step_index))
  const now = new Date().toISOString()

  for (let i = 0; i < totalSteps; i++) {
    if (!existingIndices.has(i)) {
      completions.push({
        step_index: i,
        is_correct: null,
        completed_at: now,
      })
    }
  }

  return completions
}
