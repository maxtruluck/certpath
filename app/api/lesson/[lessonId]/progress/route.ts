import { NextRequest, NextResponse } from 'next/server'
import { getApiUser } from '@/lib/supabase/get-user-api'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const { supabase, userId, error } = await getApiUser()
  if (error) return error

  const { lessonId } = await params

  const { data: progress } = await supabase
    .from('user_lesson_progress')
    .select('status, current_step_index, step_completions')
    .eq('lesson_id', lessonId)
    .eq('user_id', userId)
    .maybeSingle()

  return NextResponse.json({ progress })
}
