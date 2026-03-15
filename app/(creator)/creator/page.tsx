'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface CreatorStats {
  published_courses: number
  total_students: number
  total_earnings_cents: number
  avg_rating: number
}

interface CourseItem {
  id: string
  title: string
  slug: string
  status: string
  category: string
  difficulty: string
  module_count: number
  topic_count: number
  question_count: number
  student_count: number
  created_at: string
  updated_at: string
}

interface DashboardData {
  creator: any
  stats: CreatorStats
  courses: CourseItem[]
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    in_review: 'bg-amber-50 text-amber-700',
    published: 'bg-green-50 text-green-700',
    archived: 'bg-red-50 text-red-600',
  }
  const labels: Record<string, string> = {
    draft: 'Draft',
    in_review: 'In Review',
    published: 'Published',
    archived: 'Archived',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {labels[status] || status}
    </span>
  )
}

export default function CreatorDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/creator/dashboard')
      .then(r => r.json())
      .then(d => {
        if (d.error) {
          setError(d.error)
        } else {
          setData(d)
        }
      })
      .catch(() => setError('Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-gray-200 rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded-xl" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">{error}</p>
        <Link href="/creator/courses/new" className="btn-primary px-6 py-2.5 inline-block">
          Apply as Creator
        </Link>
      </div>
    )
  }

  if (!data) return null

  const { stats, courses } = data

  const statCards = [
    { label: 'Published Courses', value: stats.published_courses.toString(), icon: '📚' },
    { label: 'Total Students', value: stats.total_students.toLocaleString(), icon: '👥' },
    { label: 'Total Earnings', value: formatCents(stats.total_earnings_cents), icon: '💰' },
    { label: 'Avg. Rating', value: stats.avg_rating != null ? stats.avg_rating.toFixed(1) : '—', icon: '⭐' },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Creator Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage your courses and track performance</p>
        </div>
        <Link
          href="/creator/courses/new"
          className="btn-primary px-5 py-2.5 text-sm inline-flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <line x1="8" y1="2" x2="8" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Create New Course
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {statCards.map(card => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{card.icon}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-sm text-gray-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Courses */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Your Courses</h2>
        </div>

        {courses.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-400 mb-4">No courses yet. Create your first course to get started.</p>
            <Link href="/creator/courses/new" className="btn-ghost px-5 py-2 text-sm inline-block">
              Create Course
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {courses.map(course => (
              <div key={course.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0 mr-4">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">{course.title}</h3>
                    <StatusBadge status={course.status} />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>{course.question_count} questions</span>
                    <span>{course.module_count} modules</span>
                    <span>{course.topic_count} topics</span>
                    {course.student_count > 0 && <span>{course.student_count} students</span>}
                  </div>
                </div>
                <Link
                  href={`/creator/courses/new?edit=${course.id}`}
                  className="text-sm text-blue-500 hover:text-blue-700 font-medium"
                >
                  Edit
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
