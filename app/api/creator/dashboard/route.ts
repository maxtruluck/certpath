import { NextRequest, NextResponse } from 'next/server'
import { getApiUser } from '@/lib/supabase/get-user-api'

export async function GET(_request: NextRequest) {
  try {
    const { supabase, userId, error } = await getApiUser()
    if (error) return error

    // Get creator record
    const { data: creator, error: creatorError } = await supabase
      .from('creators')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (creatorError || !creator) {
      return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 })
    }

    // Get all courses by this creator
    const { data: courses } = await supabase
      .from('courses')
      .select('id, title, slug, status, category, difficulty, is_free, price_cents, created_at, updated_at, published_at')
      .eq('creator_id', creator.id)
      .order('created_at', { ascending: false })

    const courseList = courses || []
    const courseIds = courseList.map((c: any) => c.id)

    // Get counts for each course
    let coursesWithStats = courseList

    if (courseIds.length > 0) {
      const [modulesRes, topicsRes, questionsRes, enrollmentsRes] = await Promise.all([
        supabase.from('modules').select('id, course_id').in('course_id', courseIds),
        supabase.from('topics').select('id, course_id').in('course_id', courseIds),
        supabase.from('questions').select('id, course_id').in('course_id', courseIds).eq('is_active', true),
        supabase.from('user_courses').select('id, course_id, status, readiness_score').in('course_id', courseIds),
      ])

      coursesWithStats = courseList.map((c: any) => ({
        ...c,
        module_count: (modulesRes.data || []).filter((m: any) => m.course_id === c.id).length,
        topic_count: (topicsRes.data || []).filter((t: any) => t.course_id === c.id).length,
        question_count: (questionsRes.data || []).filter((q: any) => q.course_id === c.id).length,
        student_count: (enrollmentsRes.data || []).filter((e: any) => e.course_id === c.id).length,
      }))
    }

    // Compute aggregate stats
    const publishedCourses = courseList.filter((c: any) => c.status === 'published').length
    const totalStudents = coursesWithStats.reduce((sum: number, c: any) => sum + (c.student_count || 0), 0)

    // Calculate real earnings
    const allEnrollments = courseIds.length > 0
      ? (await supabase.from('user_courses').select('course_id, status, readiness_score').in('course_id', courseIds)).data || []
      : []

    let totalEarnings = 0
    for (const enrollment of allEnrollments) {
      const course = courseList.find((c: any) => c.id === enrollment.course_id)
      if (course && !course.is_free) {
        totalEarnings += Math.round((course.price_cents || 0) * 0.7)
      }
    }

    // Calculate average rating (using readiness_score of completed students as proxy)
    const completedEnrollments = allEnrollments.filter((e: any) => e.status === 'completed')
    const avgRating = completedEnrollments.length > 0
      ? Math.round(completedEnrollments.reduce((s: number, e: any) => s + (e.readiness_score || 0), 0) / completedEnrollments.length * 10) / 10
      : null

    return NextResponse.json({
      creator,
      stats: {
        published_courses: publishedCourses,
        total_students: totalStudents,
        total_earnings_cents: totalEarnings,
        avg_rating: avgRating,
      },
      courses: coursesWithStats,
    })
  } catch (err) {
    console.error('GET /api/creator/dashboard error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
