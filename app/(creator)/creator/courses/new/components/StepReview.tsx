'use client'

import { useState, useEffect } from 'react'
import type { CourseFormData } from '@/lib/store/creator-wizard'

interface CourseData {
  title: string
  slug: string
  description: string
  category: string
  difficulty: string
  is_free: boolean
  price_cents: number
  tags: string[]
  card_color: string
  modules: Array<{
    id: string
    title: string
    lessons: Array<{
      id: string
      title: string
      body: string
      question_count: number
      word_count: number
      step_count: number
    }>
  }>
  stats: {
    module_count: number
    lesson_count: number
    question_count: number
  }
}

interface AuditCheck {
  label: string
  status: 'pass' | 'warn' | 'info'
  statusLabel: string
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

function computeAudit(data: CourseData): AuditCheck[] {
  const checks: AuditCheck[] = []
  const allLessons = data.modules.flatMap(m => m.lessons)

  // All lessons have steps
  const emptyLessons = allLessons.filter(l => (l.step_count || 0) === 0)
  if (emptyLessons.length === 0) {
    checks.push({ label: 'All lessons have steps', status: 'pass', statusLabel: 'Pass' })
  } else {
    checks.push({ label: `${emptyLessons.length} lesson${emptyLessons.length !== 1 ? 's' : ''} have no steps`, status: 'warn', statusLabel: 'Warning' })
  }

  // Description length
  if ((data.description || '').length >= 50) {
    checks.push({ label: 'Description is 50+ characters', status: 'pass', statusLabel: 'Pass' })
  } else {
    checks.push({ label: 'Description is under 50 characters', status: 'warn', statusLabel: 'Warning' })
  }

  // Total answer steps
  const totalAnswers = allLessons.reduce((s, l) => s + (l.question_count || 0), 0)
  checks.push({ label: `${totalAnswers} answer step${totalAnswers !== 1 ? 's' : ''} across all lessons`, status: 'info', statusLabel: 'Info' })

  return checks
}

export default function StepReview({
  courseId,
  form,
  onBack,
  onPublish,
  onSaveDraft,
  revenueSharePercent,
  stripeConnected,
}: {
  courseId: string
  form: CourseFormData
  onBack: () => void
  onPublish: () => void
  onSaveDraft: () => void
  revenueSharePercent: number
  stripeConnected?: boolean
}) {
  const [courseData, setCourseData] = useState<CourseData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/creator/courses/${courseId}`)
      .then(r => r.json())
      .then(d => {
        if (!d.error) setCourseData(d)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [courseId])

  if (loading) {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 24px 60px' }}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-100 rounded w-48 mb-6" />
          <div className="h-48 bg-gray-100 rounded-xl mb-6" />
          <div className="h-32 bg-gray-100 rounded-xl" />
        </div>
      </div>
    )
  }

  const data = courseData
  const audit = data ? computeAudit(data) : []

  // Compute estimated duration
  const totalWords = data?.modules.reduce((sum, mod) =>
    sum + mod.lessons.reduce((ls, l) => ls + (l.word_count || 0), 0), 0) || 0
  const durationMinutes = Math.round(totalWords / 200)
  const durationDisplay = durationMinutes < 60
    ? `~${durationMinutes || 1} min`
    : `~${(Math.round(durationMinutes / 30) / 2)} hours`

  const earningsCents = form.is_free ? 0 : Math.round(form.price_cents * revenueSharePercent / 100)

  // Publish disabled conditions
  const moduleCount = data?.stats.module_count || 0
  const totalSteps = data?.modules.reduce((s, m) =>
    s + m.lessons.reduce((ls, l) => ls + (l.step_count || 0), 0), 0) || 0
  const canPublish = moduleCount > 0 && totalSteps > 0 && (form.is_free || stripeConnected)

  const badgeStyles: Record<string, { bg: string; color: string }> = {
    pass: { bg: '#E1F5EE', color: '#0F6E56' },
    warn: { bg: '#FEF3CD', color: '#856404' },
    info: { bg: '#E6F1FB', color: '#185FA5' },
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 24px 60px' }}>
      {/* 1. Page title */}
      <h1 style={{ fontSize: 22, fontWeight: 600, color: '#1a1a1a', marginBottom: 4 }}>
        Review & Publish
      </h1>
      <p style={{ fontSize: 14, color: '#999', marginBottom: 32 }}>
        Make sure everything looks good before going live
      </p>

      {/* 2. Marketplace Preview */}
      <div
        style={{
          border: '1px solid #e5e5e5',
          borderRadius: 12,
          overflow: 'hidden',
          marginBottom: 8,
        }}
      >
        {/* Color bar */}
        <div style={{ height: 6, background: form.card_color || '#3b82f6' }} />

        <div style={{ padding: 20 }}>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0" style={{ marginRight: 16 }}>
              <p style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a' }}>
                {form.title || 'Untitled Course'}
              </p>
              <p style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                by You
              </p>
            </div>
            <span style={{
              fontSize: 14,
              fontWeight: 600,
              color: form.is_free ? '#1D9E75' : '#1a1a1a',
              flexShrink: 0,
            }}>
              {form.is_free ? 'Free' : formatCents(form.price_cents)}
            </span>
          </div>

          <p style={{ fontSize: 13, color: '#666', marginTop: 10, lineHeight: '1.5' }}>
            {form.description || 'No description'}
          </p>

          <p style={{ fontSize: 12, color: '#888', marginTop: 10 }}>
            {data?.stats.module_count || 0} module{(data?.stats.module_count || 0) !== 1 ? 's' : ''} &middot;{' '}
            {data?.stats.lesson_count || 0} lesson{(data?.stats.lesson_count || 0) !== 1 ? 's' : ''} &middot;{' '}
            {totalSteps} step{totalSteps !== 1 ? 's' : ''} &middot;{' '}
            {durationDisplay}
          </p>

          {(form.tags || []).length > 0 && (
            <div className="flex flex-wrap gap-1.5" style={{ marginTop: 10 }}>
              {form.tags.map(tag => (
                <span
                  key={tag}
                  style={{
                    fontSize: 11,
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: '#f0f0f0',
                    color: '#666',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <p style={{ fontSize: 11, color: '#aaa', fontStyle: 'italic', textAlign: 'center', marginBottom: 28 }}>
        How your course appears in the marketplace
      </p>

      {/* 3. Content Audit */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 12, textTransform: 'uppercase', color: '#888', fontWeight: 600, letterSpacing: '0.5px', marginBottom: 10 }}>
          Content Audit
        </p>
        <div className="space-y-2">
          {audit.map((check, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between"
              style={{
                background: '#fafafa',
                padding: '10px 14px',
                borderRadius: 8,
              }}
            >
              <span style={{ fontSize: 13, color: '#555' }}>{check.label}</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: badgeStyles[check.status].bg,
                  color: badgeStyles[check.status].color,
                }}
              >
                {check.statusLabel}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Preview as Learner */}
      <div
        className="flex items-center justify-between"
        style={{
          background: '#f8fbff',
          border: '1px solid #E6F1FB',
          borderRadius: 10,
          padding: '14px 18px',
          marginBottom: 24,
        }}
      >
        <div>
          <p style={{ fontSize: 14, color: '#185FA5', fontWeight: 500 }}>Preview as learner</p>
          <p style={{ fontSize: 12, color: '#999' }}>Walk through the course exactly as a learner would</p>
        </div>
        <a
          href={data?.slug ? `/course/${data.slug}/path?preview=true` : '#'}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: '#378ADD',
            color: 'white',
            fontSize: 13,
            padding: '8px 20px',
            borderRadius: 6,
            fontWeight: 500,
            textDecoration: 'none',
          }}
        >
          Open preview &rarr;
        </a>
      </div>

      {/* 5. Pricing Confirmation */}
      <div
        className="flex items-center justify-between"
        style={{
          background: '#fafafa',
          border: '1px solid #e5e5e5',
          borderRadius: 10,
          padding: '14px 18px',
          marginBottom: 24,
        }}
      >
        <div>
          <p style={{ fontSize: 12, color: '#999' }}>Course price</p>
          <p style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a' }}>
            {form.is_free ? 'Free' : formatCents(form.price_cents)}
          </p>
          {!form.is_free && (
            <p style={{ fontSize: 12, color: '#1D9E75' }}>
              You earn {formatCents(earningsCents)} per sale ({revenueSharePercent}%)
            </p>
          )}
        </div>
        <button
          onClick={onBack}
          style={{ fontSize: 12, color: '#378ADD', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Edit in Define &rarr;
        </button>
      </div>

      {/* Stripe warning for paid courses */}
      {!form.is_free && !stripeConnected && (
        <div
          style={{
            background: '#FEF3CD',
            border: '1px solid #F59E0B',
            borderRadius: 8,
            padding: '10px 14px',
            marginBottom: 24,
            fontSize: 13,
            color: '#856404',
          }}
        >
          Connect Stripe in Creator Settings to publish a paid course.
        </div>
      )}

      {/* 6. Publish Section */}
      <div style={{ borderTop: '1px solid #eee', paddingTop: 24 }}>
        <p style={{ fontSize: 12, color: '#999', textAlign: 'center', marginBottom: 16 }}>
          By publishing, you confirm this course meets the openED content guidelines.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onSaveDraft}
            style={{
              fontSize: 14,
              color: '#888',
              background: 'white',
              border: '1px solid #e5e5e5',
              padding: '12px 28px',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            Save as Draft
          </button>
          <button
            onClick={onPublish}
            disabled={!canPublish}
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: 'white',
              background: canPublish ? '#1a1a1a' : '#ccc',
              border: 'none',
              padding: '12px 28px',
              borderRadius: 8,
              cursor: canPublish ? 'pointer' : 'default',
            }}
          >
            Publish Course
          </button>
        </div>
      </div>
    </div>
  )
}
