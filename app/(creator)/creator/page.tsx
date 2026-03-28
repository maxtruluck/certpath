'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

// ─── Types ──────────────────────────────────────────────────────
interface CreatorProfile {
  id: string
  creator_name: string
  bio: string | null
  avatar_url: string | null
  revenue_share_percent: number
  stripe_account_id: string | null
  onboarding_checklist_dismissed: boolean
}

interface CreatorStats {
  published_courses: number
  total_students: number
  total_earnings_cents: number
  avg_rating: number | null
  review_count: number
  completion_rate: number
  students_trend_7d: number
  revenue_trend_7d: number
}

interface Checklist {
  account_created: boolean
  profile_complete: boolean
  stripe_connected: boolean
  first_course_created: boolean
  dismissed: boolean
}

interface CourseItem {
  id: string
  title: string
  slug: string
  status: string
  category: string
  difficulty: string
  is_free: boolean
  price_cents: number
  module_count: number
  lesson_count: number
  question_count: number
  student_count: number
  completion_rate: number
  revenue_cents: number
  ready_lessons: number
  updated_at: string
}

interface DashboardData {
  creator: CreatorProfile
  stats: CreatorStats
  checklist: Checklist
  courses: CourseItem[]
}

// ─── Helpers ────────────────────────────────────────────────────
function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
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

function TrendText({ value, suffix }: { value: number; suffix: string }) {
  if (value === 0) return <span className="text-xs text-gray-400">{suffix}</span>
  const isPositive = value > 0
  return (
    <span className={`text-xs font-medium ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
      {isPositive ? '+' : ''}{value} {suffix}
    </span>
  )
}

// ─── Setup Checklist ────────────────────────────────────────────
function SetupChecklist({ checklist }: { checklist: Checklist }) {
  const items = [
    {
      label: 'Create your account',
      subtitle: "You're in!",
      complete: checklist.account_created,
      cta: null,
      href: null,
    },
    {
      label: 'Complete your creator profile',
      subtitle: 'Bio, avatar -- learners see this on your courses',
      complete: checklist.profile_complete,
      cta: 'Set up profile',
      href: '/creator/settings',
    },
    {
      label: 'Connect Stripe for payouts',
      subtitle: 'Required before publishing paid courses',
      complete: checklist.stripe_connected,
      cta: 'Connect Stripe',
      href: '/creator/settings',
    },
    {
      label: 'Create your first course',
      subtitle: 'Start small -- you can always expand later',
      complete: checklist.first_course_created,
      cta: 'Create course',
      href: '/creator/courses/new',
      highlighted: true,
    },
  ]

  const completedCount = items.filter(i => i.complete).length
  const progressPercent = (completedCount / items.length) * 100

  return (
    <div className="bg-white rounded-2xl border border-[#E8E4DD] p-6">
      <div className="space-y-4">
        {items.map((item, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${
              item.highlighted && !item.complete
                ? 'bg-blue-50 border border-blue-200'
                : ''
            }`}
          >
            {/* Checkbox */}
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
              item.complete
                ? 'bg-emerald-500 border-emerald-500'
                : 'border-gray-300'
            }`}>
              {item.complete && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${item.complete ? 'text-gray-400 line-through' : 'text-[#2C2825]'}`}>
                {item.label}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{item.subtitle}</p>
            </div>

            {/* CTA */}
            {!item.complete && item.cta && item.href && (
              <Link
                href={item.href}
                className={`text-xs font-semibold whitespace-nowrap ${
                  item.highlighted
                    ? 'text-blue-600 hover:text-blue-800'
                    : 'text-[#2C2825] hover:text-[#6B635A]'
                }`}
              >
                {item.cta} &rarr;
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mt-5 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500">{completedCount} of {items.length}</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Stat Card ──────────────────────────────────────────────────
function StatCard({ label, value, trend }: {
  label: string
  value: string
  trend: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-[#E8E4DD] hover:border-[#D4CFC7] transition-colors duration-200">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#A39B90] mb-3">{label}</p>
      <p className="text-3xl font-extrabold text-[#2C2825] tracking-tight tabular-nums">{value}</p>
      <div className="mt-2">{trend}</div>
    </div>
  )
}

// ─── Status Dot ─────────────────────────────────────────────────
function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: 'bg-slate-300',
    published: 'bg-emerald-400',
    archived: 'bg-red-400',
  }
  const labels: Record<string, string> = {
    draft: 'Draft',
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

// ─── Course Card ────────────────────────────────────────────────
function CourseCard({ course }: { course: CourseItem }) {
  const isDraft = course.status === 'draft'

  return (
    <Link
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
          <span className="tabular-nums">{course.lesson_count} lessons</span>
          <span className="tabular-nums">{course.question_count} questions</span>
          {!isDraft && course.student_count > 0 && (
            <>
              <span className="tabular-nums font-semibold text-slate-600">{course.student_count} students</span>
              <span className="tabular-nums font-semibold text-slate-600">{formatCents(course.revenue_cents)}</span>
              <span className="tabular-nums">{course.completion_rate}% completion</span>
            </>
          )}
          {isDraft && course.lesson_count > 0 && (
            <span className="text-amber-600">
              {course.ready_lessons} of {course.lesson_count} lessons ready
            </span>
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
  )
}

// ─── Main Dashboard ─────────────────────────────────────────────
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

  const { creator, stats, checklist, courses } = data
  const hasPublishedCourses = stats.published_courses > 0
  const hasEnrollments = stats.total_students > 0
  const showEmptyState = courses.length === 0 && !checklist.dismissed

  // ─── Empty State ──────────────────────────────────────────────
  if (showEmptyState) {
    return (
      <div className="space-y-8 max-w-2xl mx-auto">
        {/* Welcome header */}
        <div className="text-center pt-4">
          <h1 className="text-3xl font-extrabold text-[#2C2825] tracking-tight">Welcome to openED</h1>
          <p className="text-[#A39B90] mt-2 text-[15px]">
            Let's get your first course published. Here's what to do:
          </p>
        </div>

        <SetupChecklist checklist={checklist} />
      </div>
    )
  }

  // ─── Active State ─────────────────────────────────────────────
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-[#2C2825] tracking-tight">Dashboard</h1>
          <p className="text-[#A39B90] mt-1 text-[15px]">This month</p>
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

      {/* Checklist (if not dismissed and not all complete) */}
      {!checklist.dismissed && !(checklist.profile_complete && checklist.stripe_connected && checklist.first_course_created) && (
        <SetupChecklist checklist={checklist} />
      )}

      {/* Stats row -- only when published courses with enrollments exist */}
      {hasPublishedCourses && hasEnrollments && (
        <div className="grid grid-cols-4 gap-5">
          <StatCard
            label="Students"
            value={stats.total_students.toLocaleString()}
            trend={<TrendText value={stats.students_trend_7d} suffix="this week" />}
          />
          <StatCard
            label="Revenue"
            value={formatCents(stats.total_earnings_cents)}
            trend={<TrendText value={stats.revenue_trend_7d} suffix="this week" />}
          />
          <StatCard
            label="Completion Rate"
            value={`${stats.completion_rate}%`}
            trend={<span className="text-xs text-gray-400">across published courses</span>}
          />
          <StatCard
            label="Avg. Rating"
            value={stats.avg_rating != null ? stats.avg_rating.toFixed(1) : '--'}
            trend={<span className="text-xs text-gray-400">{stats.review_count} reviews</span>}
          />
        </div>
      )}

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
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
