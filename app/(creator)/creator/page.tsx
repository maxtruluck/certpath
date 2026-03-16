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

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: 'bg-slate-300',
    in_review: 'bg-amber-400',
    published: 'bg-emerald-400',
    archived: 'bg-red-400',
  }
  const labels: Record<string, string> = {
    draft: 'Draft',
    in_review: 'In Review',
    published: 'Published',
    archived: 'Archived',
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
      <span className={`w-1.5 h-1.5 rounded-full ${colors[status] || 'bg-slate-300'}`} />
      {labels[status] || status}
    </span>
  )
}

function StatCard({ label, value }: {
  label: string
  value: string
}) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-[#E8E4DD] hover:border-[#D4CFC7] transition-colors duration-200">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#A39B90] mb-3">{label}</p>
      <p className="text-3xl font-extrabold text-[#2C2825] tracking-tight tabular-nums">{value}</p>
    </div>
  )
}

function getTimeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHrs = Math.floor(diffMins / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  const diffDays = Math.floor(diffHrs / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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
      <div className="space-y-8 animate-pulse">
        <div className="h-10 w-56 bg-slate-200 rounded-lg" />
        <div className="grid grid-cols-4 gap-5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-36 bg-slate-200 rounded-2xl" />
          ))}
        </div>
        <div className="h-72 bg-slate-200 rounded-2xl" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-400">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
          </svg>
        </div>
        <p className="text-slate-500 mb-6 text-sm">{error}</p>
        <Link href="/creator/courses/new" className="btn-primary px-6 py-2.5 inline-block text-sm">
          Apply as Creator
        </Link>
      </div>
    )
  }

  if (!data) return null

  const { stats, courses } = data

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-[#2C2825] tracking-tight">Dashboard</h1>
          <p className="text-[#A39B90] mt-1 text-[15px]">Your courses at a glance</p>
        </div>
        <Link
          href="/creator/courses/new"
          className="inline-flex items-center gap-2 bg-[#2C2825] text-[#F5F3EF] px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#1A1816] active:scale-[0.98] transition-all shadow-sm"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <line x1="7" y1="1" x2="7" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="1" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          New Course
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-5">
        <StatCard label="Courses" value={stats.published_courses.toString()} />
        <StatCard label="Students" value={stats.total_students.toLocaleString()} />
        <StatCard label="Earnings" value={formatCents(stats.total_earnings_cents)} />
        <StatCard label="Avg. Rating" value={stats.avg_rating != null ? stats.avg_rating.toFixed(1) : '—'} />
      </div>

      {/* Courses */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[#2C2825]">Your Courses</h2>
          <span className="text-xs font-medium text-[#A39B90]">{courses.length} total</span>
        </div>

        {courses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-[#E8E4DD] px-6 py-16 text-center">
            <p className="text-[#A39B90] text-sm mb-4">No courses yet</p>
            <Link href="/creator/courses/new" className="text-sm font-semibold text-[#2C2825] hover:text-[#6B635A]">
              Create your first course &rarr;
            </Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {courses.map(course => (
              <Link
                key={course.id}
                href={`/creator/courses/new?edit=${course.id}`}
                className="group bg-white rounded-2xl border border-[#E8E4DD] px-6 py-5 flex items-center justify-between hover:border-[#D4CFC7] hover:shadow-sm transition-all duration-200"
              >
                <div className="flex-1 min-w-0 mr-6">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-[15px] font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                      {course.title}
                    </h3>
                    <StatusDot status={course.status} />
                  </div>
                  <div className="flex items-center gap-5 text-xs text-slate-400 font-medium">
                    <span className="tabular-nums">{course.question_count} questions</span>
                    <span className="tabular-nums">{course.module_count} modules</span>
                    <span className="tabular-nums">{course.topic_count} topics</span>
                    {course.student_count > 0 && (
                      <span className="tabular-nums">{course.student_count} students</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[11px] text-slate-300 font-medium">{getTimeAgo(course.updated_at)}</span>
                  <span className="text-slate-300 group-hover:text-slate-500 transition-colors">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
