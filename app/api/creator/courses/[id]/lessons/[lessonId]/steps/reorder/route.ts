import { NextRequest, NextResponse } from 'next/server'
import { getCreatorCourse } from '@/lib/supabase/get-creator-course'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  try {
    const { id, lessonId } = await params
    const { supabase, error } = await getCreatorCourse(id)
    if (error) return error

    const body = await request.json()
    const { step_ids } = body

    if (!Array.isArray(step_ids) || step_ids.length === 0) {
      return NextResponse.json({ error: 'step_ids array is required' }, { status: 400 })
    }

    // Update sort_order for each step to match array index
    // Use deferred constraint to allow temporary duplicates during reorder
    for (let i = 0; i < step_ids.length; i++) {
      const { error: updateError } = await supabase
        .from('lesson_steps')
        .update({ sort_order: i })
        .eq('id', step_ids[i])
        .eq('lesson_id', lessonId)

      if (updateError) {
        console.error(`Reorder step ${step_ids[i]} error:`, updateError)
        return NextResponse.json({ error: 'Failed to reorder steps' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('PATCH reorder steps error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
