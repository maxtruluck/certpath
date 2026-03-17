import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/require-admin'

export async function GET(_request: NextRequest) {
  try {
    const { supabase, error } = await requireAdmin()
    if (error) return error

    const [
      usersRes,
      creatorsRes,
      pendingCreatorsRes,
      coursesRes,
      publishedCoursesRes,
      pendingCoursesRes,
      questionsRes,
      enrollmentsRes,
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('creators').select('id', { count: 'exact', head: true }),
      supabase.from('creators').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('courses').select('id', { count: 'exact', head: true }),
      supabase.from('courses').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('courses').select('id', { count: 'exact', head: true }).eq('status', 'in_review'),
      supabase.from('questions').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('user_courses').select('id', { count: 'exact', head: true }),
    ])

    // Active learners in last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { count: activeLearners } = await supabase
      .from('practice_sessions')
      .select('user_id', { count: 'exact', head: true })
      .gte('started_at', sevenDaysAgo)

    return NextResponse.json({
      total_users: usersRes.count || 0,
      total_creators: creatorsRes.count || 0,
      pending_creators: pendingCreatorsRes.count || 0,
      total_courses: coursesRes.count || 0,
      published_courses: publishedCoursesRes.count || 0,
      pending_courses: pendingCoursesRes.count || 0,
      total_questions: questionsRes.count || 0,
      total_enrollments: enrollmentsRes.count || 0,
      active_learners_7d: activeLearners || 0,
    })
  } catch (err) {
    console.error('GET /api/admin/stats error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
