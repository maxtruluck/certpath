import { getApiUser } from '@/lib/supabase/get-user-api'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { supabase, userId, error } = await getApiUser()
    if (error) return error

    const { data: creator } = await supabase
      .from('creators').select('id').eq('user_id', userId).single()
    if (!creator) return NextResponse.json({ error: 'Creator not found' }, { status: 404 })

    // Get all completed transactions for this creator
    const { data: transactions } = await supabase
      .from('transactions')
      .select('id, course_id, amount_cents, creator_earnings_cents, created_at')
      .eq('creator_id', creator.id)
      .eq('status', 'completed')

    const allTx = transactions || []

    if (allTx.length === 0) {
      return NextResponse.json({
        stats: { lifetime_earnings_cents: 0, this_month_cents: 0, total_sales: 0 },
        revenue_by_course: [],
        monthly_breakdown: [],
        payout_info: 'Payouts are processed monthly. Contact support for payout setup.',
      })
    }

    // Lifetime earnings
    const lifetimeEarnings = allTx.reduce((s, t) => s + (t.creator_earnings_cents || 0), 0)
    const totalSales = allTx.length

    // This month's earnings
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const thisMonthTx = allTx.filter(t => t.created_at >= monthStart)
    const thisMonthEarnings = thisMonthTx.reduce((s, t) => s + (t.creator_earnings_cents || 0), 0)

    // Get course titles for revenue breakdown
    const courseIds = [...new Set(allTx.map(t => t.course_id))]
    const { data: courses } = await supabase
      .from('courses')
      .select('id, title')
      .in('id', courseIds)
    const courseMap = new Map((courses || []).map(c => [c.id, c.title]))

    // Revenue by course
    const courseEarnings: Record<string, { earnings: number; sales: number }> = {}
    for (const t of allTx) {
      if (!courseEarnings[t.course_id]) {
        courseEarnings[t.course_id] = { earnings: 0, sales: 0 }
      }
      courseEarnings[t.course_id].earnings += t.creator_earnings_cents || 0
      courseEarnings[t.course_id].sales += 1
    }

    const revenueByCourse = Object.entries(courseEarnings).map(([courseId, data]) => ({
      course_id: courseId,
      course_title: courseMap.get(courseId) || 'Unknown',
      sales: data.sales,
      your_earnings_cents: data.earnings,
    }))

    // Monthly breakdown (last 6 months)
    const monthlyBreakdown = []
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString()
      const monthTx = allTx.filter(
        t => t.created_at >= d.toISOString() && t.created_at < nextMonth
      )
      const earnings = monthTx.reduce((s, t) => s + (t.creator_earnings_cents || 0), 0)
      monthlyBreakdown.push({ month: monthStr, earnings_cents: earnings, sales: monthTx.length })
    }

    return NextResponse.json({
      stats: {
        lifetime_earnings_cents: lifetimeEarnings,
        this_month_cents: thisMonthEarnings,
        total_sales: totalSales,
      },
      revenue_by_course: revenueByCourse,
      monthly_breakdown: monthlyBreakdown,
      payout_info: 'Payouts are processed monthly. Contact support for payout setup.',
    })
  } catch (err) {
    console.error('GET /api/creator/earnings error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
