'use client'

import { useState, useEffect } from 'react'

interface EarningsData {
  stats: {
    lifetime_earnings_cents: number
    this_month_cents: number
    pending_payout_cents: number
    total_paid_out_cents: number
  }
  revenue_by_course: {
    course_id: string
    course_title: string
    students: number
    revenue_cents: number
    your_share_cents: number
  }[]
  monthly_breakdown: {
    month: string
    earnings_cents: number
    students: number
  }[]
  payout_history: {
    id: string
    date: string
    amount_cents: number
    method: string
    status: string
  }[]
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatMonth(m: string): string {
  const [year, month] = m.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1)
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export default function EarningsPage() {
  const [data, setData] = useState<EarningsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/creator/earnings')
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setData(d)
      })
      .catch(() => setError('Failed to load earnings'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-32 bg-gray-200 rounded" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-gray-200 rounded-xl" />)}
        </div>
        <div className="h-64 bg-gray-200 rounded-xl" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">{error}</p>
      </div>
    )
  }

  if (!data) return null

  const { stats, revenue_by_course, monthly_breakdown, payout_history } = data

  const statCards = [
    { label: 'Lifetime Earnings', value: formatCents(stats.lifetime_earnings_cents), color: 'text-gray-900' },
    { label: 'This Month', value: formatCents(stats.this_month_cents), color: 'text-blue-600' },
    { label: 'Pending Payout', value: formatCents(stats.pending_payout_cents), color: 'text-amber-600' },
    { label: 'Total Paid Out', value: formatCents(stats.total_paid_out_cents), color: 'text-green-600' },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>
        <p className="text-gray-500 mt-1">Track your revenue and payouts</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {statCards.map(card => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-sm text-gray-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Revenue by Course */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Revenue by Course</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Students</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Your Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {revenue_by_course.map(row => (
                <tr key={row.course_id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm font-medium text-gray-900">{row.course_title}</td>
                  <td className="px-6 py-3 text-sm text-gray-600 text-right">{row.students}</td>
                  <td className="px-6 py-3 text-sm text-gray-600 text-right">{formatCents(row.revenue_cents)}</td>
                  <td className="px-6 py-3 text-sm font-medium text-gray-900 text-right">{formatCents(row.your_share_cents)}</td>
                </tr>
              ))}
              {revenue_by_course.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-400">No revenue data yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Monthly Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Earnings</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">New Students</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {monthly_breakdown.map(row => (
                <tr key={row.month} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm font-medium text-gray-900">{formatMonth(row.month)}</td>
                  <td className="px-6 py-3 text-sm text-gray-600 text-right">{formatCents(row.earnings_cents)}</td>
                  <td className="px-6 py-3 text-sm text-gray-600 text-right">{row.students}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout History */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Payout History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {payout_history.map(row => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm text-gray-900">{new Date(row.date).toLocaleDateString()}</td>
                  <td className="px-6 py-3 text-sm font-medium text-gray-900 text-right">{formatCents(row.amount_cents)}</td>
                  <td className="px-6 py-3 text-sm text-gray-600">{row.method}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      row.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout Settings */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Payout Settings</h2>
        </div>
        <div className="px-6 py-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Payout Method</label>
              <select className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                <option>Bank Transfer (ACH)</option>
                <option>PayPal</option>
                <option>Stripe</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Payout Threshold</label>
              <select className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                <option>$50.00</option>
                <option>$100.00</option>
                <option>$250.00</option>
                <option>$500.00</option>
              </select>
            </div>
          </div>
          <button className="btn-primary px-5 py-2.5 text-sm mt-6">Save Settings</button>
        </div>
      </div>
    </div>
  )
}
