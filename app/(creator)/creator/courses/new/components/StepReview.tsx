'use client'

import { useState, useEffect } from 'react'
import type { CourseFormData } from '@/lib/store/creator-wizard'

interface CourseData {
  title: string
  description: string
  category: string
  difficulty: string
  is_free: boolean
  price_cents: number
  tags: string[]
  modules: Array<{
    id: string
    title: string
    lessons: Array<{
      id: string
      title: string
      body: string
      question_count: number
      word_count: number
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
  message: string
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

function computeAudit(data: CourseData): AuditCheck[] {
  const checks: AuditCheck[] = []
  const allLessons = data.modules.flatMap(m => m.lessons)

  // All lessons have content
  const emptyLessons = allLessons.filter(l => (l.body || '').length < 50)
  if (emptyLessons.length === 0) {
    checks.push({ label: 'All lessons have content', status: 'pass', message: `${allLessons.length} lessons with content` })
  } else {
    checks.push({ label: 'Lessons missing content', status: 'warn', message: `${emptyLessons.length} lessons have no content` })
  }

  // Questions added
  const totalQuestions = data.stats.question_count
  checks.push({ label: 'Questions added', status: 'pass', message: `${totalQuestions} questions` })

  // Lessons missing questions
  const lessonsWithoutQuestions = allLessons.filter(l => l.question_count === 0)
  if (lessonsWithoutQuestions.length > 0) {
    checks.push({
      label: 'Lessons missing questions',
      status: 'warn',
      message: `${lessonsWithoutQuestions.length} lessons missing questions -- Lessons without questions won't have review cards`,
    })
  }

  // Description
  if ((data.description || '').length >= 50) {
    checks.push({ label: 'Description complete', status: 'pass', message: `${data.description.length} characters` })
  } else {
    checks.push({ label: 'Description incomplete', status: 'warn', message: `${(data.description || '').length} characters (50+ recommended)` })
  }

  // Video embeds (informational)
  const hasVideo = allLessons.some(l => (l.body || '').includes('youtube.com') || (l.body || '').includes('vimeo.com'))
  if (hasVideo) {
    checks.push({ label: 'Video embeds detected', status: 'pass', message: 'Courses with video have 2x completion' })
  } else {
    checks.push({ label: 'No video embeds', status: 'info', message: 'Not required -- courses with video have 2x completion' })
  }

  return checks
}

function AuditCheckRow({ check }: { check: AuditCheck }) {
  const icons = {
    pass: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-emerald-500">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5.5 8L7 9.5L10.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    warn: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-amber-500">
        <path d="M8 2L14 13H2L8 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M8 7v2M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    info: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-400">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 7v4M8 5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  }

  return (
    <div className="flex items-start gap-3 py-2">
      <div className="mt-0.5 flex-shrink-0">{icons[check.status]}</div>
      <div>
        <p className="text-sm font-medium text-[#2C2825]">{check.label}</p>
        <p className="text-xs text-gray-400">{check.message}</p>
      </div>
    </div>
  )
}

export default function StepReview({
  courseId,
  form,
  onBack,
  onPublish,
  onSaveDraft,
  revenueSharePercent,
}: {
  courseId: string
  form: CourseFormData
  onBack: () => void
  onPublish: () => void
  onSaveDraft: () => void
  revenueSharePercent: number
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
      <div className="max-w-2xl mx-auto py-8 animate-pulse">
        <div className="h-48 bg-gray-100 rounded-2xl mb-6" />
        <div className="h-64 bg-gray-100 rounded-2xl" />
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
    ? `~${durationMinutes} min`
    : `~${(Math.round(durationMinutes / 30) / 2)} hours`

  const earningsCents = form.is_free ? 0 : Math.round(form.price_cents * revenueSharePercent / 100)

  return (
    <div className="max-w-2xl mx-auto py-8">
      {/* Marketplace Preview Card */}
      <div className="rounded-2xl border border-[#E8E4DD] overflow-hidden bg-white mb-4">
        {/* Gradient header */}
        <div className="h-32 bg-gradient-to-br from-blue-500 to-blue-700" />

        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 mr-4">
              <h2 className="text-xl font-bold text-[#2C2825]">{form.title || 'Untitled Course'}</h2>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{form.description || 'No description'}</p>
            </div>
            <span className="text-lg font-bold text-[#2C2825] whitespace-nowrap">
              {form.is_free ? 'Free' : formatCents(form.price_cents)}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-gray-400">
            <span>{data?.stats.module_count || 0} modules</span>
            <span>{data?.stats.lesson_count || 0} lessons</span>
            <span>{data?.stats.question_count || 0} questions</span>
            <span>{durationDisplay}</span>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <span className="px-2 py-0.5 rounded-md bg-gray-100 text-xs text-gray-600">{form.category}</span>
            <span className="px-2 py-0.5 rounded-md bg-gray-100 text-xs text-gray-600 capitalize">{form.difficulty}</span>
          </div>
        </div>
      </div>
      <p className="text-center text-xs text-gray-400 mb-8">How your course appears in the marketplace</p>

      {/* Content Audit */}
      <div className="rounded-2xl border border-[#E8E4DD] bg-white p-6 mb-6">
        <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400 mb-4">Content Audit</h3>
        <div className="divide-y divide-gray-100">
          {audit.map((check, idx) => (
            <AuditCheckRow key={idx} check={check} />
          ))}
        </div>
      </div>

      {/* Preview as Learner */}
      <div className="rounded-2xl bg-blue-50 border border-blue-200 p-6 text-center mb-6">
        <button className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
          Preview as Learner
        </button>
        <p className="text-xs text-blue-400 mt-1">Walk through the card stack exactly as a learner would</p>
      </div>

      {/* Pricing confirmation */}
      {!form.is_free && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-center justify-between mb-6">
          <div>
            <p className="text-sm font-medium text-[#2C2825]">Pricing: {formatCents(form.price_cents)}</p>
            <p className="text-xs text-gray-400">
              You earn {formatCents(earningsCents)} per sale ({revenueSharePercent}% standard rate)
            </p>
          </div>
          <button onClick={onBack} className="text-xs font-medium text-blue-600 hover:text-blue-800">
            Change &rarr;
          </button>
        </div>
      )}

      {/* Publish section */}
      <div className="rounded-2xl bg-gray-50 border border-gray-200 p-6">
        <p className="text-xs text-gray-500 mb-4">
          Once published, this course will be visible to all learners on openED.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={onSaveDraft}
            className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-xl hover:bg-white transition-colors"
          >
            Save as Draft
          </button>
          <button
            onClick={onPublish}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors"
          >
            Publish Course
          </button>
        </div>
      </div>

      {/* Back link */}
      <div className="mt-6 pt-5 border-t border-gray-100">
        <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          &larr; Back to settings
        </button>
      </div>
    </div>
  )
}
