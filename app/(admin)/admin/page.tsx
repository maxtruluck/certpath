'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Stats {
  total_users: number
  total_creators: number
  pending_creators: number
  total_courses: number
  published_courses: number
  pending_courses: number
  total_questions: number
  total_enrollments: number
  active_learners_7d: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500">Failed to load stats.</p>
      </div>
    )
  }

  const cards = [
    { label: 'Total Users', value: stats.total_users, href: null },
    { label: 'Total Creators', value: stats.total_creators, href: '/admin/creators' },
    { label: 'Pending Creators', value: stats.pending_creators, href: '/admin/creators?status=pending', highlight: stats.pending_creators > 0 },
    { label: 'Total Courses', value: stats.total_courses, href: '/admin/courses' },
    { label: 'Published Courses', value: stats.published_courses, href: '/admin/courses?status=published' },
    { label: 'Pending Courses', value: stats.pending_courses, href: '/admin/courses?status=in_review', highlight: stats.pending_courses > 0 },
    { label: 'Total Questions', value: stats.total_questions, href: null },
    { label: 'Total Enrollments', value: stats.total_enrollments, href: null },
    { label: 'Active Learners (7d)', value: stats.active_learners_7d, href: null },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>

      <div className="grid grid-cols-3 gap-4">
        {cards.map(card => {
          const content = (
            <div className={`bg-white rounded-xl border p-6 ${
              card.highlight ? 'border-red-300 bg-red-50' : 'border-gray-200'
            } ${card.href ? 'hover:border-gray-300 transition-colors cursor-pointer' : ''}`}>
              <p className={`text-sm font-medium ${card.highlight ? 'text-red-600' : 'text-gray-500'}`}>
                {card.label}
              </p>
              <p className={`text-3xl font-bold mt-1 ${card.highlight ? 'text-red-700' : 'text-gray-900'}`}>
                {card.value}
              </p>
            </div>
          )

          if (card.href) {
            return <Link key={card.label} href={card.href}>{content}</Link>
          }
          return <div key={card.label}>{content}</div>
        })}
      </div>
    </div>
  )
}
