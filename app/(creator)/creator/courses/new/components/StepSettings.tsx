'use client'

import { useState, useEffect } from 'react'
import type { CourseFormData } from '@/lib/store/creator-wizard'

const DIFFICULTIES = [
  { value: 'beginner', label: 'Beginner', desc: 'No prior knowledge required' },
  { value: 'intermediate', label: 'Intermediate', desc: 'Some experience expected' },
  { value: 'advanced', label: 'Advanced', desc: 'Deep expertise required' },
]

const PREDEFINED_TAGS = [
  'Certification Prep',
  'Practice Exams',
  'Self-Paced',
  'YouTube Companion',
  'Study Guide',
]

const inputClass = 'w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'

const numericOnly = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key.length === 1 && !/[0-9.]/.test(e.key) && !e.metaKey && !e.ctrlKey) {
    e.preventDefault()
  }
}

// ─── Price Input ─────────────────────────────────────────────────
function PriceInput({ value, onChange }: { value: number; onChange: (cents: number) => void }) {
  const [display, setDisplay] = useState(value ? (value / 100).toString() : '')

  useEffect(() => {
    const current = Math.round(parseFloat(display || '0') * 100)
    if (current !== value) {
      setDisplay(value ? (value / 100).toString() : '')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">$</span>
      <input
        type="text"
        inputMode="decimal"
        value={display}
        onChange={e => {
          const raw = e.target.value
          if (raw === '' || /^\d*\.?\d{0,2}$/.test(raw)) {
            setDisplay(raw)
            const cents = Math.round(parseFloat(raw || '0') * 100)
            onChange(cents)
          }
        }}
        onKeyDown={numericOnly}
        placeholder="14.99"
        className={`${inputClass} pl-8`}
      />
      <p className="text-xs text-gray-400 mt-1">Suggested: $9.99 - $19.99</p>
    </div>
  )
}

// ─── Revenue Calculator ─────────────────────────────────────────
function RevenueCalculator({ priceCents, revenueSharePercent, isFoundingCreator }: {
  priceCents: number
  revenueSharePercent: number
  isFoundingCreator: boolean
}) {
  const earnings = Math.round(priceCents * revenueSharePercent / 100)
  const earningsDisplay = (earnings / 100).toFixed(2)
  const priceDisplay = (priceCents / 100).toFixed(2)
  const rateLabel = isFoundingCreator ? `${revenueSharePercent}/${100 - revenueSharePercent} founding rate` : `${revenueSharePercent}/${100 - revenueSharePercent} standard rate`

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mt-3">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400 mb-2">Your Earnings Per Sale</p>
      <p className="text-3xl font-extrabold text-emerald-600 tabular-nums">${earningsDisplay}</p>
      <p className="text-xs text-gray-400 mt-1">of ${priceDisplay} ({rateLabel})</p>
      <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
        <span>10 sales = ${(earnings * 10 / 100).toFixed(2)}</span>
        <span className="text-gray-200">|</span>
        <span>50 sales = ${(earnings * 50 / 100).toFixed(2)}</span>
        <span className="text-gray-200">|</span>
        <span>100 sales = ${(earnings * 100 / 100).toFixed(2)}</span>
      </div>
      {isFoundingCreator && (
        <p className="text-xs text-blue-500 mt-3 font-medium">
          Founding creator rate: {revenueSharePercent}% share, locked 12 months.
        </p>
      )}
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────
export default function StepSettings({
  form,
  onChange,
  onBack,
  onContinue,
  courseId,
  revenueSharePercent,
  isFoundingCreator,
}: {
  form: CourseFormData
  onChange: (updates: Partial<CourseFormData>) => void
  onBack: () => void
  onContinue: () => void
  courseId: string
  revenueSharePercent: number
  isFoundingCreator: boolean
}) {
  const [customTagInput, setCustomTagInput] = useState('')
  const [showCustomTag, setShowCustomTag] = useState(false)
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | null>(null)

  // Fetch estimated duration from course data
  useEffect(() => {
    fetch(`/api/creator/courses/${courseId}`)
      .then(r => r.json())
      .then(d => {
        if (d.modules) {
          let totalWords = 0
          for (const mod of d.modules) {
            for (const lesson of mod.lessons || []) {
              totalWords += lesson.word_count || 0
            }
          }
          // 200 words per minute reading speed
          const minutes = Math.round(totalWords / 200)
          setEstimatedMinutes(minutes)
        }
      })
      .catch(() => {})
  }, [courseId])

  const toggleTag = (tag: string) => {
    const current = form.tags || []
    if (current.includes(tag)) {
      onChange({ tags: current.filter(t => t !== tag) })
    } else if (current.length < 5) {
      onChange({ tags: [...current, tag] })
    }
  }

  const addCustomTag = () => {
    const trimmed = customTagInput.trim()
    if (!trimmed || trimmed.length > 30) return
    const current = form.tags || []
    if (current.length >= 5 || current.includes(trimmed)) return
    onChange({ tags: [...current, trimmed] })
    setCustomTagInput('')
    setShowCustomTag(false)
  }

  const formatDuration = (minutes: number | null) => {
    if (minutes === null) return 'Calculating...'
    if (minutes < 60) return `~${minutes} minutes`
    const hours = Math.round(minutes / 30) / 2 // round to nearest 0.5
    return `~${hours} hours`
  }

  return (
    <div className="max-w-lg mx-auto py-8">
      {/* Pricing */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-[#2C2825] mb-3">Pricing</h3>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button
            type="button"
            onClick={() => onChange({ is_free: true, price_cents: 0 })}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              form.is_free
                ? 'bg-blue-50 text-blue-700 border-r border-blue-200'
                : 'bg-white text-gray-500 hover:bg-gray-50 border-r border-gray-200'
            }`}
          >
            Free
          </button>
          <button
            type="button"
            onClick={() => onChange({ is_free: false, price_cents: form.price_cents || 1499 })}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              !form.is_free
                ? 'bg-blue-50 text-blue-700'
                : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            Paid
          </button>
        </div>

        {!form.is_free && (
          <div className="mt-3 bg-gray-50 rounded-xl p-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (USD)</label>
            <PriceInput
              value={form.price_cents}
              onChange={cents => onChange({ price_cents: cents })}
            />
            <RevenueCalculator
              priceCents={form.price_cents}
              revenueSharePercent={revenueSharePercent}
              isFoundingCreator={isFoundingCreator}
            />
          </div>
        )}
      </div>

      {/* Difficulty */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-[#2C2825] mb-3">Difficulty</h3>
        <select
          value={form.difficulty}
          onChange={e => onChange({ difficulty: e.target.value })}
          className={inputClass}
        >
          {DIFFICULTIES.map(d => (
            <option key={d.value} value={d.value}>{d.label} -- {d.desc}</option>
          ))}
        </select>
      </div>

      {/* Progression */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-[#2C2825] mb-3">Progression</h3>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button
            type="button"
            onClick={() => onChange({ progression_type: 'linear' })}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              form.progression_type === 'linear'
                ? 'bg-blue-50 text-blue-700 border-r border-blue-200'
                : 'bg-white text-gray-500 hover:bg-gray-50 border-r border-gray-200'
            }`}
          >
            Linear
          </button>
          <button
            type="button"
            onClick={() => onChange({ progression_type: 'open' })}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              form.progression_type === 'open'
                ? 'bg-blue-50 text-blue-700'
                : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            Open
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {form.progression_type === 'linear'
            ? 'Learners complete lessons in order'
            : 'Learners choose any lesson in any order'}
        </p>
      </div>

      {/* Tags */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-[#2C2825] mb-1">Tags <span className="text-gray-400 font-normal">(max 5)</span></h3>
        <div className="flex flex-wrap gap-2 mt-3">
          {PREDEFINED_TAGS.map(tag => {
            const active = (form.tags || []).includes(tag)
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                  active
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300'
                }`}
              >
                {tag}
              </button>
            )
          })}
          {(form.tags || [])
            .filter(t => !PREDEFINED_TAGS.includes(t))
            .map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className="px-3 py-1.5 rounded-lg border border-blue-500 bg-blue-50 text-blue-700 font-medium text-sm"
              >
                {tag}
              </button>
            ))}
          {(form.tags || []).length < 5 && (
            showCustomTag ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={customTagInput}
                  onChange={e => {
                    if (e.target.value.length <= 30) setCustomTagInput(e.target.value)
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { e.preventDefault(); addCustomTag() }
                    if (e.key === 'Escape') { setShowCustomTag(false); setCustomTagInput('') }
                  }}
                  placeholder="Custom tag..."
                  className="px-2 py-1 border border-blue-300 rounded-lg text-sm w-32 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  autoFocus
                />
                <button type="button" onClick={addCustomTag} className="text-xs text-blue-600 hover:text-blue-800 font-medium px-1">Add</button>
                <button type="button" onClick={() => { setShowCustomTag(false); setCustomTagInput('') }} className="text-xs text-gray-400 hover:text-gray-600 px-1">Cancel</button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowCustomTag(true)}
                className="px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors"
              >
                + Custom
              </button>
            )
          )}
        </div>
      </div>

      {/* Estimated Duration (read-only) */}
      <div className="mb-8">
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400 mb-1">Estimated Duration</p>
          <p className="text-xs text-gray-400 mb-2">Auto-calculated from your content</p>
          <p className="text-2xl font-bold text-[#2C2825]">{formatDuration(estimatedMinutes)}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-5 border-t border-gray-100">
        <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          &larr; Back to editor
        </button>
        <button
          onClick={onContinue}
          className="btn-primary px-6 py-2.5 text-sm"
        >
          Review & Publish &rarr;
        </button>
      </div>
    </div>
  )
}
