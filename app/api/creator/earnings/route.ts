import { getApiUser } from '@/lib/supabase/get-user-api'
import { NextResponse } from 'next/server'

export async function GET() {
  const { supabase, userId, error } = await getApiUser()
  if (error) return error

  const { data: creator } = await supabase
    .from('creators').select('id').eq('user_id', userId).single()
  if (!creator) return NextResponse.json({ error: 'Creator not found' }, { status: 404 })

  // Get all courses with their prices
  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, is_free, price_cents')
    .eq('creator_id', creator.id)

  if (!courses || courses.length === 0) {
    return NextResponse.json({
      stats: { lifetime_earnings_cents: 0, this_month_cents: 0, pending_payout_cents: 0, total_paid_out_cents: 0 },
      revenue_by_course: [],
      monthly_breakdown: [],
      payout_history: [],
    })
  }

  const courseIds = courses.map(c => c.id)

  // Get all enrollments for these courses
  const { data: enrollments } = await supabase
    .from('user_courses')
    .select('id, course_id, enrolled_at')
    .in('course_id', courseIds)

  const allEnrollments = enrollments || []

  // Build revenue by course
  const courseMap = new Map(courses.map(c => [c.id, c]))
  const CREATOR_SHARE = 0.7

  const revenueByCourse = courses.map(c => {
    const courseEnrollments = allEnrollments.filter(e => e.course_id === c.id)
    const revenue = c.is_free ? 0 : courseEnrollments.length * (c.price_cents || 0)
    const share = Math.round(revenue * CREATOR_SHARE)
    return {
      course_id: c.id,
      course_title: c.title,
      students: courseEnrollments.length,
      revenue_cents: revenue,
      your_share_cents: share,
    }
  })

  const lifetimeEarnings = revenueByCourse.reduce((s, r) => s + r.your_share_cents, 0)

  // This month's earnings
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const thisMonthEnrollments = allEnrollments.filter(e => e.enrolled_at >= monthStart)
  let thisMonthEarnings = 0
  for (const e of thisMonthEnrollments) {
    const course = courseMap.get(e.course_id)
    if (course && !course.is_free) {
      thisMonthEarnings += Math.round((course.price_cents || 0) * CREATOR_SHARE)
    }
  }

  // Monthly breakdown (last 6 months)
  const monthlyBreakdown = []
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString()
    const monthEnrollments = allEnrollments.filter(
      e => e.enrolled_at >= d.toISOString() && e.enrolled_at < nextMonth
    )
    let earnings = 0
    for (const e of monthEnrollments) {
      const course = courseMap.get(e.course_id)
      if (course && !course.is_free) {
        earnings += Math.round((course.price_cents || 0) * CREATOR_SHARE)
      }
    }
    monthlyBreakdown.push({ month: monthStr, earnings_cents: earnings, students: monthEnrollments.length })
  }

  return NextResponse.json({
    stats: {
      lifetime_earnings_cents: lifetimeEarnings,
      this_month_cents: thisMonthEarnings,
      pending_payout_cents: thisMonthEarnings,
      total_paid_out_cents: lifetimeEarnings - thisMonthEarnings,
    },
    revenue_by_course: revenueByCourse,
    monthly_breakdown: monthlyBreakdown,
    payout_history: [],
  })
}
