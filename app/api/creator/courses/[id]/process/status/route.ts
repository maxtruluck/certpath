import { getApiUser } from '@/lib/supabase/get-user-api'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: courseId } = await params
  const { supabase, userId, error } = await getApiUser()
  if (error) return error

  const { data: creator } = await supabase
    .from('creators').select('id').eq('user_id', userId).single()
  if (!creator) return NextResponse.json({ error: 'Creator not found' }, { status: 404 })

  const { data: course } = await supabase
    .from('courses').select('id').eq('id', courseId).eq('creator_id', creator.id).single()
  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

  // Prefer the job with most progress; if tied, most recent
  const { data: jobs } = await supabase
    .from('processing_jobs')
    .select('*')
    .eq('course_id', courseId)
    .order('progress', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)

  const job = jobs?.[0] || null

  if (!job) {
    return NextResponse.json({
      status: 'not_started',
      progress: 0,
      steps: [],
      result: null,
    })
  }

  return NextResponse.json({
    process_id: job.id,
    status: job.status,
    progress: job.progress,
    current_step: job.current_step,
    steps: job.steps || [],
    result: job.result,
    error: job.error,
    started_at: job.started_at,
    completed_at: job.completed_at,
  })
}
