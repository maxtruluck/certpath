'use client'

import { useState, useEffect, useRef } from 'react'
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

interface CourseItem {
  id: string
  title: string
  slug: string
  status: string
  category: string
  difficulty: string
  is_free: boolean
  price_cents: number
  card_color?: string
  module_count: number
  lesson_count: number
  question_count: number
  step_count?: number
  student_count: number
  completion_rate: number
  revenue_cents: number
  ready_lessons: number
  updated_at: string
}

interface DashboardData {
  creator: CreatorProfile
  stats: CreatorStats
  courses: CourseItem[]
}

interface EarningsData {
  stats: {
    lifetime_earnings_cents: number
    this_month_cents: number
    pending_payout_cents: number
  }
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

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

// ─── Top Bar ────────────────────────────────────────────────────
function DashboardTopBar({
  creatorName,
  avatarUrl,
  onSettingsClick,
}: {
  creatorName: string
  avatarUrl: string | null
  onSettingsClick: () => void
}) {
  return (
    <div
      className="flex items-center justify-between px-6 bg-white border-b"
      style={{ height: 52, borderColor: '#eee' }}
    >
      <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.5px', color: '#1a1a1a' }}>
        openED
      </span>
      <div className="flex items-center gap-3">
        <Link
          href="/home"
          style={{ fontSize: 13, color: '#378ADD' }}
          className="hover:underline"
        >
          Switch to learner &rarr;
        </Link>
        <button
          onClick={onSettingsClick}
          className="flex items-center justify-center rounded-full hover:bg-[#f5f5f5] transition-colors"
          style={{ width: 32, height: 32, border: '1px solid #e5e5e5' }}
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="#888" strokeWidth="1.5">
            <circle cx="10" cy="10" r="3" />
            <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.93 4.93l1.41 1.41M13.66 13.66l1.41 1.41M4.93 15.07l1.41-1.41M13.66 6.34l1.41-1.41" strokeLinecap="round" />
          </svg>
        </button>
        <div
          className="flex items-center justify-center rounded-full"
          style={{ width: 32, height: 32, background: '#E6F1FB', color: '#185FA5', fontSize: 12, fontWeight: 600 }}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            getInitials(creatorName)
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Context Menu ───────────────────────────────────────────────
function CourseContextMenu({
  course,
  position,
  onClose,
  onArchive,
  onUnarchive,
  onDelete,
}: {
  course: CourseItem
  position: { x: number; y: number }
  onClose: () => void
  onArchive: () => void
  onUnarchive: () => void
  onDelete: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    top: position.y,
    left: position.x,
    background: 'white',
    border: '1px solid #e5e5e5',
    borderRadius: 8,
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    padding: '4px 0',
    minWidth: 160,
    zIndex: 50,
  }

  const itemStyle: React.CSSProperties = {
    fontSize: 13,
    color: '#555',
    padding: '8px 14px',
    cursor: 'pointer',
    display: 'block',
    width: '100%',
    textAlign: 'left',
    background: 'none',
    border: 'none',
  }

  return (
    <div ref={ref} style={menuStyle}>
      <Link
        href={`/creator/courses/new?edit=${course.id}`}
        style={itemStyle}
        className="hover:bg-[#f5f5f5] block"
        onClick={onClose}
      >
        Edit course
      </Link>

      {course.status === 'published' && (
        <>
          <a
            href={`/course/${course.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            style={itemStyle}
            className="hover:bg-[#f5f5f5] block"
            onClick={onClose}
          >
            View in marketplace
          </a>
          <div style={{ height: 1, background: '#eee', margin: '4px 0' }} />
          <button
            onClick={() => { onArchive(); onClose() }}
            style={{ ...itemStyle, color: '#E24B4A' }}
            className="hover:bg-[#FEF2F2]"
          >
            Archive course
          </button>
        </>
      )}

      {course.status === 'draft' && (
        <>
          <div style={{ height: 1, background: '#eee', margin: '4px 0' }} />
          <button
            onClick={() => { onDelete(); onClose() }}
            style={{ ...itemStyle, color: '#E24B4A' }}
            className="hover:bg-[#FEF2F2]"
          >
            Delete course
          </button>
        </>
      )}

      {course.status === 'archived' && (
        <>
          <div style={{ height: 1, background: '#eee', margin: '4px 0' }} />
          <button
            onClick={() => { onUnarchive(); onClose() }}
            style={{ ...itemStyle, color: '#1D9E75' }}
            className="hover:bg-[#f0faf5]"
          >
            Unarchive course
          </button>
        </>
      )}
    </div>
  )
}

// ─── Confirmation Modal ─────────────────────────────────────────
function ConfirmModal({
  title,
  courseName,
  description,
  detail,
  confirmLabel,
  confirmColor,
  onConfirm,
  onCancel,
}: {
  title: string
  courseName: string
  description: string
  detail: string
  confirmLabel: string
  confirmColor: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.35)' }}
      onClick={onCancel}
    >
      <div
        className="bg-white"
        style={{ borderRadius: 12, padding: 28, maxWidth: 440, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a', marginBottom: 12 }}>{title}</h3>
        <p style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
          <strong>{courseName}</strong> {description}
        </p>
        <p style={{ fontSize: 13, color: '#999', marginBottom: 24 }}>{detail}</p>
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            style={{
              fontSize: 14,
              padding: '8px 20px',
              borderRadius: 8,
              border: '1px solid #e5e5e5',
              background: 'white',
              color: '#555',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              fontSize: 14,
              padding: '8px 20px',
              borderRadius: 8,
              border: 'none',
              background: confirmColor,
              color: 'white',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Dashboard ─────────────────────────────────────────────
export default function CreatorDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [earnings, setEarnings] = useState<EarningsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all')
  const [contextMenu, setContextMenu] = useState<{ course: CourseItem; x: number; y: number } | null>(null)
  const [confirmAction, setConfirmAction] = useState<{ type: 'archive' | 'delete'; course: CourseItem } | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/creator/dashboard').then(r => r.json()),
      fetch('/api/creator/earnings').then(r => r.json()),
    ])
      .then(([dashData, earningsData]) => {
        if (dashData.error) {
          setError(dashData.error)
        } else {
          setData(dashData)
        }
        if (!earningsData.error) setEarnings(earningsData)
      })
      .catch(() => setError('Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  const handleArchive = async (courseId: string) => {
    try {
      await fetch(`/api/creator/courses/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived' }),
      })
      // Refresh
      const res = await fetch('/api/creator/dashboard')
      const d = await res.json()
      if (!d.error) setData(d)
    } catch {}
    setConfirmAction(null)
  }

  const handleUnarchive = async (courseId: string) => {
    try {
      await fetch(`/api/creator/courses/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'draft' }),
      })
      const res = await fetch('/api/creator/dashboard')
      const d = await res.json()
      if (!d.error) setData(d)
    } catch {}
  }

  const handleDelete = async (courseId: string) => {
    try {
      await fetch(`/api/creator/courses/${courseId}`, { method: 'DELETE' })
      const res = await fetch('/api/creator/dashboard')
      const d = await res.json()
      if (!d.error) setData(d)
    } catch {}
    setConfirmAction(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div style={{ height: 52, borderBottom: '1px solid #eee' }} />
        <div className="max-w-3xl mx-auto px-6 py-10 animate-pulse">
          <div className="h-8 w-48 bg-gray-100 rounded mb-6" />
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-gray-100 rounded-lg" />)}
          </div>
          <div className="h-48 bg-gray-100 rounded-lg" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <div style={{ height: 52, borderBottom: '1px solid #eee' }} className="flex items-center px-6">
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.5px' }}>openED</span>
        </div>
        <div className="text-center py-20">
          <p className="text-gray-500 mb-6 text-sm">{error}</p>
          <Link href="/creator/courses/new" className="text-sm font-medium text-blue-600">
            Apply as Creator
          </Link>
        </div>
      </div>
    )
  }

  if (!data) return null

  const { creator, stats, courses } = data
  const hasCourses = courses.length > 0
  const hasArchivedCourses = courses.some(c => c.status === 'archived')
  const draftCount = courses.filter(c => c.status === 'draft').length

  const filteredCourses = courses.filter(c => {
    if (filter === 'all') return true
    return c.status === filter
  })

  const earningsStats = earnings?.stats

  // ─── Render ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white">
      <DashboardTopBar
        creatorName={creator.creator_name}
        avatarUrl={creator.avatar_url}
        onSettingsClick={() => setSettingsOpen(true)}
      />

      <div className="max-w-3xl mx-auto px-6" style={{ paddingTop: 40, paddingBottom: 60 }}>
        {/* ─── Empty State ──────────────────────────────────────── */}
        {!hasCourses && (
          <>
            {/* Header */}
            <h1 style={{ fontSize: 22, fontWeight: 600, color: '#1a1a1a' }}>
              Welcome, {creator.creator_name}
            </h1>
            <p style={{ fontSize: 14, color: '#888', marginTop: 4, marginBottom: 28 }}>
              Create your first course to get started
            </p>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-4" style={{ marginBottom: 28 }}>
              {[
                { label: 'Students', value: '0' },
                { label: 'Revenue', value: '$0' },
                { label: 'Published', value: '0' },
                { label: 'Completion rate', value: '\u2014' },
              ].map(s => (
                <div
                  key={s.label}
                  style={{
                    background: '#fafafa',
                    padding: 16,
                    borderRadius: 8,
                  }}
                >
                  <p style={{ fontSize: 11, textTransform: 'uppercase', color: '#999', letterSpacing: '0.4px', marginBottom: 6, fontWeight: 500 }}>
                    {s.label}
                  </p>
                  <p style={{ fontSize: 24, fontWeight: 600, color: '#ccc' }}>
                    {s.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Empty course card */}
            <div
              style={{
                border: '2px dashed #e0e0e0',
                borderRadius: 12,
                padding: '48px 24px',
                textAlign: 'center',
                marginBottom: 28,
              }}
            >
              <p style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a', marginBottom: 8 }}>
                No courses yet
              </p>
              <p style={{ fontSize: 13, color: '#999', maxWidth: 340, margin: '0 auto 20px' }}>
                Build your first course and share your expertise with learners around the world.
              </p>
              <Link
                href="/creator/courses/new"
                className="inline-flex items-center gap-2"
                style={{
                  background: '#1a1a1a',
                  color: 'white',
                  fontSize: 14,
                  padding: '8px 20px',
                  borderRadius: 8,
                  fontWeight: 500,
                }}
              >
                + Create your first course
              </Link>
            </div>

            {/* Earnings section */}
            <div style={{ background: '#fafafa', borderRadius: 8, padding: 20 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 14 }}>Earnings</p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Lifetime', value: '$0' },
                  { label: 'This month', value: '$0' },
                  { label: 'Pending payout', value: '$0' },
                ].map(e => (
                  <div key={e.label}>
                    <p style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>{e.label}</p>
                    <p style={{ fontSize: 18, fontWeight: 600, color: '#ccc' }}>{e.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ─── Populated State ──────────────────────────────────── */}
        {hasCourses && (
          <>
            {/* Header */}
            <div className="flex items-start justify-between" style={{ marginBottom: 24 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 600, color: '#1a1a1a' }}>
                  Your courses
                </h1>
                <p style={{ fontSize: 14, color: '#888', marginTop: 4 }}>
                  {courses.length} course{courses.length !== 1 ? 's' : ''} &middot;{' '}
                  {stats.total_students} student{stats.total_students !== 1 ? 's' : ''} &middot;{' '}
                  {formatCents(stats.total_earnings_cents)} earned
                </p>
              </div>
              <Link
                href="/creator/courses/new"
                className="inline-flex items-center gap-2"
                style={{
                  background: '#1a1a1a',
                  color: 'white',
                  fontSize: 14,
                  padding: '8px 20px',
                  borderRadius: 8,
                  fontWeight: 500,
                }}
              >
                + New course
              </Link>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-4" style={{ marginBottom: 28 }}>
              <div style={{ background: '#fafafa', padding: 16, borderRadius: 8 }}>
                <p style={{ fontSize: 11, textTransform: 'uppercase', color: '#999', letterSpacing: '0.4px', marginBottom: 6, fontWeight: 500 }}>Students</p>
                <p style={{ fontSize: 24, fontWeight: 600, color: '#1a1a1a' }}>{stats.total_students}</p>
                {stats.students_trend_7d > 0 && (
                  <p style={{ fontSize: 12, color: '#1D9E75', marginTop: 4 }}>+{stats.students_trend_7d} this week</p>
                )}
              </div>
              <div style={{ background: '#fafafa', padding: 16, borderRadius: 8 }}>
                <p style={{ fontSize: 11, textTransform: 'uppercase', color: '#999', letterSpacing: '0.4px', marginBottom: 6, fontWeight: 500 }}>Revenue</p>
                <p style={{ fontSize: 24, fontWeight: 600, color: '#1a1a1a' }}>{formatCents(stats.total_earnings_cents)}</p>
                {earningsStats && earningsStats.this_month_cents > 0 && (
                  <p style={{ fontSize: 12, color: '#1D9E75', marginTop: 4 }}>{formatCents(earningsStats.this_month_cents)} this month</p>
                )}
              </div>
              <div style={{ background: '#fafafa', padding: 16, borderRadius: 8 }}>
                <p style={{ fontSize: 11, textTransform: 'uppercase', color: '#999', letterSpacing: '0.4px', marginBottom: 6, fontWeight: 500 }}>Published</p>
                <p style={{ fontSize: 24, fontWeight: 600, color: '#1a1a1a' }}>{stats.published_courses}</p>
                {draftCount > 0 && (
                  <p style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{draftCount} draft{draftCount !== 1 ? 's' : ''}</p>
                )}
              </div>
              <div style={{ background: '#fafafa', padding: 16, borderRadius: 8 }}>
                <p style={{ fontSize: 11, textTransform: 'uppercase', color: '#999', letterSpacing: '0.4px', marginBottom: 6, fontWeight: 500 }}>Completion rate</p>
                <p style={{ fontSize: 24, fontWeight: 600, color: '#1a1a1a' }}>{stats.completion_rate > 0 ? `${stats.completion_rate}%` : '\u2014'}</p>
                <p style={{ fontSize: 12, color: '#999', marginTop: 4 }}>across all courses</p>
              </div>
            </div>

            {/* Section header + filter pills */}
            <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>All courses</p>
              <div className="flex items-center gap-2">
                {(['all', 'published', 'draft'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    style={{
                      fontSize: 12,
                      padding: '4px 12px',
                      borderRadius: 20,
                      border: filter === f ? 'none' : '1px solid #e5e5e5',
                      background: filter === f ? '#1a1a1a' : 'white',
                      color: filter === f ? 'white' : '#888',
                      cursor: 'pointer',
                      fontWeight: 500,
                    }}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
                {hasArchivedCourses && (
                  <button
                    onClick={() => setFilter('archived')}
                    style={{
                      fontSize: 12,
                      padding: '4px 12px',
                      borderRadius: 20,
                      border: filter === 'archived' ? 'none' : '1px solid #e5e5e5',
                      background: filter === 'archived' ? '#1a1a1a' : 'white',
                      color: filter === 'archived' ? 'white' : '#888',
                      cursor: 'pointer',
                      fontWeight: 500,
                    }}
                  >
                    Archived
                  </button>
                )}
              </div>
            </div>

            {/* Course list */}
            <div
              style={{
                border: '1px solid #e5e5e5',
                borderRadius: 8,
                overflow: 'hidden',
                marginBottom: 28,
              }}
            >
              {filteredCourses.map((course, idx) => {
                const isArchived = course.status === 'archived'
                const isDraft = course.status === 'draft'
                const colorBar = isArchived ? '#bbb' : isDraft ? '#ccc' : (course.card_color || '#3b82f6')

                return (
                  <div
                    key={course.id}
                    className="flex items-center"
                    style={{
                      borderTop: idx > 0 ? '1px solid #f0f0f0' : undefined,
                      opacity: isArchived ? 0.6 : 1,
                    }}
                  >
                    {/* Color bar */}
                    <div style={{ width: 4, alignSelf: 'stretch', background: colorBar, flexShrink: 0 }} />

                    {/* Content */}
                    <Link
                      href={`/creator/courses/new?edit=${course.id}`}
                      className="flex-1 flex items-center py-3 px-4 hover:bg-[#fafafa] transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p style={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: isArchived ? '#888' : '#1a1a1a',
                          marginBottom: 2,
                        }}>
                          {course.title}
                        </p>
                        <p style={{ fontSize: 12, color: '#999' }}>
                          {course.lesson_count} lesson{course.lesson_count !== 1 ? 's' : ''} &middot;{' '}
                          {course.question_count} question{course.question_count !== 1 ? 's' : ''} &middot;{' '}
                          Last edited {getTimeAgo(course.updated_at)}
                        </p>
                      </div>

                      {/* Status badge */}
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          padding: '2px 8px',
                          borderRadius: 4,
                          marginLeft: 12,
                          fontStyle: isArchived ? 'italic' : 'normal',
                          background: course.status === 'published' ? '#E1F5EE' : '#f0f0f0',
                          color: course.status === 'published' ? '#0F6E56' : isArchived ? '#bbb' : '#888',
                        }}
                      >
                        {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                      </span>

                      {/* Stats columns */}
                      {course.status === 'published' && (
                        <>
                          <div style={{ marginLeft: 20, textAlign: 'right', minWidth: 60 }}>
                            <p style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>{course.student_count}</p>
                            <p style={{ fontSize: 10, color: '#999' }}>students</p>
                          </div>
                          <div style={{ marginLeft: 16, textAlign: 'right', minWidth: 60 }}>
                            <p style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>{formatCents(course.revenue_cents)}</p>
                            <p style={{ fontSize: 10, color: '#999' }}>revenue</p>
                          </div>
                        </>
                      )}
                    </Link>

                    {/* Context menu button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        const rect = e.currentTarget.getBoundingClientRect()
                        setContextMenu({
                          course,
                          x: rect.left - 120,
                          y: rect.bottom + 4,
                        })
                      }}
                      className="flex items-center justify-center hover:text-[#888] transition-colors"
                      style={{ width: 36, height: 36, color: '#ccc', fontSize: 18, flexShrink: 0, marginRight: 4 }}
                    >
                      &middot;&middot;&middot;
                    </button>
                  </div>
                )
              })}
              {filteredCourses.length === 0 && (
                <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                  <p style={{ fontSize: 13, color: '#999' }}>No {filter} courses</p>
                </div>
              )}
            </div>

            {/* Earnings section */}
            <div style={{ background: '#fafafa', borderRadius: 8, padding: 20 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 14 }}>Earnings</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>Lifetime</p>
                  <p style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a' }}>
                    {earningsStats ? formatCents(earningsStats.lifetime_earnings_cents) : '$0.00'}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>This month</p>
                  <p style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a' }}>
                    {earningsStats ? formatCents(earningsStats.this_month_cents) : '$0.00'}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>Pending payout</p>
                  <p style={{ fontSize: 18, fontWeight: 600, color: '#888' }}>
                    {earningsStats ? formatCents(earningsStats.pending_payout_cents) : '$0.00'}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <CourseContextMenu
          course={contextMenu.course}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          onClose={() => setContextMenu(null)}
          onArchive={() => setConfirmAction({ type: 'archive', course: contextMenu.course })}
          onUnarchive={() => handleUnarchive(contextMenu.course.id)}
          onDelete={() => setConfirmAction({ type: 'delete', course: contextMenu.course })}
        />
      )}

      {/* Archive Confirmation Modal */}
      {confirmAction?.type === 'archive' && (
        <ConfirmModal
          title="Archive this course?"
          courseName={confirmAction.course.title}
          description="will be hidden from the marketplace and new learners won't be able to enroll."
          detail="Enrolled learners will retain access to the course content."
          confirmLabel="Archive course"
          confirmColor="#D85A30"
          onConfirm={() => handleArchive(confirmAction.course.id)}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {confirmAction?.type === 'delete' && (
        <ConfirmModal
          title="Delete this course?"
          courseName={confirmAction.course.title}
          description="and all modules, lessons, and steps will be permanently deleted."
          detail="This action cannot be undone."
          confirmLabel="Delete course"
          confirmColor="#E24B4A"
          onConfirm={() => handleDelete(confirmAction.course.id)}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {/* Settings Panel */}
      {settingsOpen && (
        <CreatorSettingsPanel
          creatorId={creator.id}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  )
}

// ─── Creator Settings Panel (Task 5) ───────────────────────────
function CreatorSettingsPanel({
  onClose,
}: {
  creatorId?: string
  onClose: () => void
}) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [creatorName, setCreatorName] = useState('')
  const [bio, setBio] = useState('')
  const [expertiseAreas, setExpertiseAreas] = useState<string[]>([])
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [stripeConnected, setStripeConnected] = useState(false)
  const [credentialInput, setCredentialInput] = useState('')

  useEffect(() => {
    fetch('/api/creator/settings')
      .then(r => r.json())
      .then(d => {
        if (!d.error) {
          setCreatorName(d.creator_name || '')
          setBio(d.bio || '')
          setExpertiseAreas(d.expertise_areas || [])
          setWebsiteUrl(d.website_url || '')
          setAvatarUrl(d.avatar_url || null)
          setStripeConnected(!!d.stripe_account_id)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch('/api/creator/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creator_name: creatorName,
          bio,
          expertise_areas: expertiseAreas,
          website_url: websiteUrl,
        }),
      })
      onClose()
    } catch {}
    setSaving(false)
  }

  const addCredential = () => {
    const trimmed = credentialInput.trim()
    if (!trimmed || expertiseAreas.includes(trimmed)) return
    setExpertiseAreas([...expertiseAreas, trimmed])
    setCredentialInput('')
  }

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: 14,
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #e5e5e5',
    borderRadius: 8,
    fontSize: 13,
    outline: 'none',
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.35)' }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed top-0 right-0 bottom-0 z-50 bg-white flex flex-col"
        style={{ width: 420, borderRadius: '12px 0 0 12px', boxShadow: '-4px 0 24px rgba(0,0,0,0.08)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between" style={{ padding: '20px 24px', borderBottom: '1px solid #eee' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a' }}>Creator settings</h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-full hover:bg-[#f5f5f5] transition-colors"
            style={{ width: 32, height: 32, border: '1px solid #e5e5e5', fontSize: 14, color: '#888' }}
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto" style={{ padding: 24 }}>
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-16 bg-gray-100 rounded" />
              <div className="h-32 bg-gray-100 rounded" />
            </div>
          ) : (
            <>
              {/* Profile section */}
              <div style={{ marginBottom: 32 }}>
                <p style={sectionTitleStyle}>Profile</p>

                {/* Avatar */}
                <div className="flex items-center gap-4" style={{ marginBottom: 16 }}>
                  <div
                    className="flex items-center justify-center rounded-full flex-shrink-0"
                    style={{ width: 64, height: 64, background: '#E6F1FB', color: '#185FA5', fontSize: 20, fontWeight: 600 }}
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      getInitials(creatorName || 'C')
                    )}
                  </div>
                  <div>
                    <button style={{ fontSize: 13, color: '#378ADD', fontWeight: 500 }}>Upload photo</button>
                    {avatarUrl && (
                      <button
                        onClick={() => setAvatarUrl(null)}
                        style={{ fontSize: 12, color: '#999', marginLeft: 12 }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                {/* Display name */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 4 }}>Display name</label>
                  <input
                    type="text"
                    value={creatorName}
                    onChange={e => setCreatorName(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                {/* Bio */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 4 }}>Bio</label>
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical' as const }}
                  />
                  <p style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                    Shown on your course pages. Keep it concise.
                  </p>
                </div>

                {/* Credentials */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 4 }}>Credentials</label>
                  <div
                    className="flex flex-wrap items-center"
                    style={{
                      gap: 6,
                      padding: '8px 10px',
                      border: '1px solid #e5e5e5',
                      borderRadius: 8,
                      minHeight: 40,
                    }}
                  >
                    {expertiseAreas.map(area => (
                      <span
                        key={area}
                        className="inline-flex items-center"
                        style={{
                          fontSize: 12,
                          padding: '3px 10px',
                          borderRadius: 4,
                          background: '#f0f0f0',
                          color: '#555',
                        }}
                      >
                        {area}
                        <button
                          onClick={() => setExpertiseAreas(expertiseAreas.filter(a => a !== area))}
                          style={{ marginLeft: 6, color: '#999', fontSize: 14 }}
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={credentialInput}
                      onChange={e => setCredentialInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') { e.preventDefault(); addCredential() }
                      }}
                      placeholder="Add credential..."
                      style={{ border: 'none', outline: 'none', fontSize: 13, minWidth: 100, flex: 1 }}
                    />
                  </div>
                </div>

                {/* Website */}
                <div>
                  <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 4 }}>Website</label>
                  <input
                    type="text"
                    value={websiteUrl}
                    onChange={e => setWebsiteUrl(e.target.value)}
                    placeholder="https://"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Payouts section */}
              <div style={{ marginBottom: 32 }}>
                <p style={sectionTitleStyle}>Payouts</p>
                {!stripeConnected ? (
                  <div
                    style={{
                      background: '#fafafa',
                      border: '1px solid #e5e5e5',
                      borderRadius: 8,
                      padding: 16,
                    }}
                    className="flex items-center gap-3"
                  >
                    <div
                      className="flex items-center justify-center rounded-lg flex-shrink-0"
                      style={{ width: 40, height: 40, background: '#635BFF' }}
                    >
                      <span style={{ color: 'white', fontWeight: 700, fontSize: 18 }}>S</span>
                    </div>
                    <div className="flex-1">
                      <p style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a' }}>Connect Stripe</p>
                      <p style={{ fontSize: 12, color: '#999' }}>Required to receive payouts for paid courses</p>
                    </div>
                    <button
                      style={{
                        fontSize: 12,
                        color: '#378ADD',
                        border: '1px solid #E6F1FB',
                        padding: '4px 12px',
                        borderRadius: 6,
                        background: 'white',
                      }}
                    >
                      Connect &rarr;
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      background: '#f0faf5',
                      border: '1px solid #1D9E75',
                      borderRadius: 8,
                      padding: 16,
                    }}
                    className="flex items-center gap-3"
                  >
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1D9E75', flexShrink: 0 }} />
                    <div className="flex-1">
                      <p style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a' }}>Stripe connected</p>
                      <p style={{ fontSize: 12, color: '#999' }}>Payouts go to ****4242</p>
                    </div>
                    <button
                      style={{
                        fontSize: 12,
                        color: '#378ADD',
                        border: '1px solid #E6F1FB',
                        padding: '4px 12px',
                        borderRadius: 6,
                        background: 'white',
                      }}
                    >
                      Manage &rarr;
                    </button>
                  </div>
                )}
              </div>

              {/* Danger zone */}
              <div style={{ borderTop: '1px solid #eee', paddingTop: 20 }}>
                <p style={{ ...sectionTitleStyle, color: '#E24B4A' }}>Danger zone</p>
                <button
                  style={{
                    width: '100%',
                    color: '#E24B4A',
                    border: '1px solid #F09595',
                    fontSize: 13,
                    padding: '8px 16px',
                    borderRadius: 6,
                    background: 'white',
                    cursor: 'pointer',
                  }}
                >
                  Deactivate creator account
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3"
          style={{ padding: '16px 24px', borderTop: '1px solid #eee' }}
        >
          <button
            onClick={onClose}
            style={{
              fontSize: 14,
              padding: '8px 20px',
              borderRadius: 8,
              border: '1px solid #e5e5e5',
              background: 'white',
              color: '#555',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              fontSize: 14,
              padding: '8px 20px',
              borderRadius: 8,
              border: 'none',
              background: '#1a1a1a',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 500,
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>
    </>
  )
}
