'use client'

import { useState, useEffect } from 'react'
import { COURSE_FORMATS, type CourseFormat } from '../lib/course-formats'

export interface CourseFormData {
  title: string
  description: string
  category: string
  difficulty: string
  expected_knowledge: string
  is_free: boolean
  price_cents: number
  provider_name: string
  exam_fee_cents: number
  passing_score: number
  exam_duration_minutes: number
  total_questions_on_exam: number
  max_score: number
}

export const INITIAL_FORM: CourseFormData = {
  title: '',
  description: '',
  category: 'certification',
  difficulty: 'beginner',
  expected_knowledge: '',
  is_free: true,
  price_cents: 0,
  provider_name: '',
  exam_fee_cents: 0,
  passing_score: 0,
  exam_duration_minutes: 0,
  total_questions_on_exam: 0,
  max_score: 0,
}

const DIFFICULTIES = [
  { value: 'beginner', label: 'Beginner', desc: 'No prior knowledge required' },
  { value: 'intermediate', label: 'Intermediate', desc: 'Some foundational knowledge expected' },
  { value: 'advanced', label: 'Advanced', desc: 'Deep experience in the subject' },
]

// ─── Q&A Steps ──────────────────────────────────────────────────
type QAStep = 'title' | 'description' | 'audience' | 'has_exam' | 'exam_details' | 'pricing' | 'review'

function getSteps(hasExam: boolean): QAStep[] {
  const base: QAStep[] = ['title', 'description', 'audience', 'has_exam']
  if (hasExam) base.push('exam_details')
  base.push('pricing', 'review')
  return base
}

// Shared input classes
const inputClass = 'w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'

// Block non-numeric keys on number inputs (allow digits, backspace, delete, arrows, tab)
const numericOnly = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (
    e.key.length === 1 &&
    !/[0-9.]/.test(e.key) &&
    !e.metaKey && !e.ctrlKey
  ) {
    e.preventDefault()
  }
}

// Price input that preserves decimal typing (e.g. "29." won't snap to "29")
function PriceInput({ value, onChange }: { value: number; onChange: (cents: number) => void }) {
  const [display, setDisplay] = useState(value ? (value / 100).toString() : '')

  // Sync display when external value changes (e.g. loading saved draft)
  useEffect(() => {
    const current = Math.round(parseFloat(display || '0') * 100)
    if (current !== value) {
      setDisplay(value ? (value / 100).toString() : '')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <input
      type="text"
      inputMode="decimal"
      value={display}
      onChange={e => {
        const raw = e.target.value
        // Allow empty, digits, and one decimal point
        if (raw === '' || /^\d*\.?\d{0,2}$/.test(raw)) {
          setDisplay(raw)
          const cents = Math.round(parseFloat(raw || '0') * 100)
          onChange(cents)
        }
      }}
      onKeyDown={numericOnly}
      placeholder="29.99"
      className={inputClass}
      autoFocus
    />
  )
}

export default function StepCourseInfo({
  form,
  onChange,
  onContinue,
  onSaveDraft,
  saving,
  courseFormat,
  onChangeFormat,
}: {
  form: CourseFormData
  onChange: (updates: Partial<CourseFormData>) => void
  onContinue: () => void
  onSaveDraft: () => void
  saving: boolean
  courseFormat?: CourseFormat
  onChangeFormat?: () => void
}) {
  const [qaStep, setQaStep] = useState<QAStep>('title')
  const [hasExam, setHasExam] = useState<boolean | null>(null)

  const formatConfig = courseFormat && courseFormat !== 'blank' ? COURSE_FORMATS[courseFormat] : null
  const steps = getSteps(hasExam === true)
  const currentIndex = steps.indexOf(qaStep)
  const isFirst = currentIndex === 0
  const isLast = qaStep === 'review'

  const goNext = () => {
    const next = steps[currentIndex + 1]
    if (next) setQaStep(next)
  }

  const goBack = () => {
    const prev = steps[currentIndex - 1]
    if (prev) setQaStep(prev)
  }

  const handleExamAnswer = (answer: boolean) => {
    setHasExam(answer)
    if (answer) {
      setQaStep('exam_details')
    } else {
      // Clear exam fields
      onChange({
        provider_name: '',
        exam_fee_cents: 0,
        passing_score: 0,
        exam_duration_minutes: 0,
        total_questions_on_exam: 0,
        max_score: 0,
      })
      setQaStep('pricing')
    }
  }

  // Mini progress for the Q&A flow
  const qaProgress = Math.round(((currentIndex + 1) / steps.length) * 100)

  return (
    <div className="max-w-xl mx-auto">
      {/* Format pill + progress */}
      <div className="flex items-center gap-3 mb-8">
        {formatConfig && (
          <button
            onClick={onChangeFormat}
            className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 border border-gray-200 rounded-full text-xs font-medium text-gray-600 hover:bg-gray-150 transition-colors"
          >
            {formatConfig.label}
            <span className="text-gray-400">Change</span>
          </button>
        )}
        <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gray-900 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${qaProgress}%` }}
          />
        </div>
      </div>

      {/* ─── Title ──────────────────────────────────────────── */}
      {qaStep === 'title' && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">What&apos;s your course called?</h2>
          <p className="text-sm text-gray-500 mb-4">Pick something clear and specific. You can always change it later.</p>
          <input
            type="text"
            value={form.title}
            onChange={e => onChange({ title: e.target.value })}
            placeholder="e.g., CompTIA Security+ SY0-701"
            className={inputClass}
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter' && form.title.trim()) goNext() }}
          />
        </div>
      )}

      {/* ─── Description ────────────────────────────────────── */}
      {qaStep === 'description' && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Describe your course</h2>
          <p className="text-sm text-gray-500 mb-4">What will learners gain? A sentence or two is fine for now.</p>
          <textarea
            value={form.description}
            onChange={e => onChange({ description: e.target.value })}
            rows={3}
            placeholder="Describe what learners will gain from this course..."
            className={`${inputClass} resize-none`}
            autoFocus
          />
        </div>
      )}

      {/* ─── Audience ──────────────────────────────────────── */}
      {qaStep === 'audience' && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Who is this course for?</h2>
          <p className="text-sm text-gray-500 mb-6">This helps learners find the right starting point.</p>

          <div className="space-y-2 mb-6">
            {DIFFICULTIES.map(d => (
              <button
                key={d.value}
                onClick={() => onChange({ difficulty: d.value })}
                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                  form.difficulty === d.value
                    ? 'border-blue-500 bg-blue-50/50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <span className="text-sm font-medium text-gray-900">{d.label}</span>
                <span className="block text-xs text-gray-500 mt-0.5">{d.desc}</span>
              </button>
            ))}
          </div>

          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            What should your audience already know?
          </label>
          <p className="text-xs text-gray-400 mb-2">Optional. Helps learners decide if this course is right for them.</p>
          <textarea
            value={form.expected_knowledge}
            onChange={e => onChange({ expected_knowledge: e.target.value })}
            rows={2}
            placeholder="e.g., Basic networking concepts, familiarity with operating systems"
            className={`${inputClass} resize-none`}
          />
        </div>
      )}

      {/* ─── Has Exam? ──────────────────────────────────────── */}
      {qaStep === 'has_exam' && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Does this course prepare for an official exam?</h2>
          <p className="text-sm text-gray-500 mb-4">If yes, we&apos;ll collect exam details so learners know what to expect.</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleExamAnswer(true)}
              className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                hasExam === true
                  ? 'border-blue-500 bg-blue-50/50 text-blue-700'
                  : 'border-gray-200 hover:border-blue-300 text-gray-700'
              }`}
            >
              Yes, there&apos;s an exam
            </button>
            <button
              onClick={() => handleExamAnswer(false)}
              className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                hasExam === false
                  ? 'border-blue-500 bg-blue-50/50 text-blue-700'
                  : 'border-gray-200 hover:border-blue-300 text-gray-700'
              }`}
            >
              No official exam
            </button>
          </div>
        </div>
      )}

      {/* ─── Exam Details ───────────────────────────────────── */}
      {qaStep === 'exam_details' && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Exam details</h2>
          <p className="text-sm text-gray-500 mb-4">Help learners understand what the exam looks like.</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Provider / Issuing Organization</label>
              <input
                type="text"
                value={form.provider_name}
                onChange={e => onChange({ provider_name: e.target.value })}
                placeholder="e.g., CompTIA, AWS, Cisco"
                className={inputClass}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Exam Fee ($)</label>
                <input
                  type="text" inputMode="numeric"
                  value={form.exam_fee_cents / 100 || ''}
                  onChange={e => onChange({ exam_fee_cents: Math.round(parseFloat(e.target.value || '0') * 100) })}
                  onKeyDown={numericOnly}
                  placeholder="392"
                  min="0"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Exam Duration (min)</label>
                <input
                  type="text" inputMode="numeric"
                  value={form.exam_duration_minutes || ''}
                  onChange={e => onChange({ exam_duration_minutes: parseInt(e.target.value || '0') })}
                  onKeyDown={numericOnly}
                  placeholder="90"
                  min="0"
                  className={inputClass}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Passing Score</label>
                <input
                  type="text" inputMode="numeric"
                  value={form.passing_score || ''}
                  onChange={e => onChange({ passing_score: parseInt(e.target.value || '0') })}
                  onKeyDown={numericOnly}
                  placeholder="750"
                  min="0"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Score</label>
                <input
                  type="text" inputMode="numeric"
                  value={form.max_score || ''}
                  onChange={e => onChange({ max_score: parseInt(e.target.value || '0') })}
                  onKeyDown={numericOnly}
                  placeholder="900"
                  min="0"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Total Questions</label>
                <input
                  type="text" inputMode="numeric"
                  value={form.total_questions_on_exam || ''}
                  onChange={e => onChange({ total_questions_on_exam: parseInt(e.target.value || '0') })}
                  onKeyDown={numericOnly}
                  placeholder="90"
                  min="0"
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Pricing ────────────────────────────────────────── */}
      {qaStep === 'pricing' && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">How should this course be priced?</h2>
          <p className="text-sm text-gray-500 mb-4">Free courses get more visibility. You can change this anytime.</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => onChange({ is_free: true, price_cents: 0 })}
              className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                form.is_free
                  ? 'border-blue-500 bg-blue-50/50 text-blue-700'
                  : 'border-gray-200 hover:border-blue-300 text-gray-700'
              }`}
            >
              Free
            </button>
            <button
              onClick={() => onChange({ is_free: false })}
              className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                !form.is_free
                  ? 'border-blue-500 bg-blue-50/50 text-blue-700'
                  : 'border-gray-200 hover:border-blue-300 text-gray-700'
              }`}
            >
              Paid
            </button>
          </div>
          {!form.is_free && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Price ($)</label>
              <PriceInput
                value={form.price_cents}
                onChange={cents => onChange({ price_cents: cents })}
              />
            </div>
          )}
        </div>
      )}

      {/* ─── Review ─────────────────────────────────────────── */}
      {qaStep === 'review' && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Looking good. Here&apos;s what you&apos;ve got so far.</h2>
          <p className="text-sm text-gray-500 mb-5">Review and edit anything, then continue to build your structure.</p>

          <div className="space-y-3">
            <ReviewRow label="Title" value={form.title} onEdit={() => setQaStep('title')} />
            <ReviewRow label="Description" value={form.description || 'Not set'} onEdit={() => setQaStep('description')} />
            <ReviewRow label="Difficulty" value={form.difficulty.charAt(0).toUpperCase() + form.difficulty.slice(1)} onEdit={() => setQaStep('audience')} />
            {form.expected_knowledge && (
              <ReviewRow
                label="Expected Knowledge"
                value={form.expected_knowledge}
                onEdit={() => setQaStep('audience')}
              />
            )}
            {hasExam && (
              <>
                <ReviewRow label="Provider" value={form.provider_name || 'Not set'} onEdit={() => setQaStep('exam_details')} />
                <ReviewRow
                  label="Exam"
                  value={[
                    form.exam_fee_cents ? `$${form.exam_fee_cents / 100} fee` : null,
                    form.exam_duration_minutes ? `${form.exam_duration_minutes} min` : null,
                    form.passing_score ? `${form.passing_score}/${form.max_score || '?'} to pass` : null,
                  ].filter(Boolean).join(' · ') || 'Not set'}
                  onEdit={() => setQaStep('exam_details')}
                />
              </>
            )}
            {!hasExam && (
              <ReviewRow label="Exam" value="No official exam" onEdit={() => setQaStep('has_exam')} />
            )}
            <ReviewRow
              label="Pricing"
              value={form.is_free ? 'Free' : `$${(form.price_cents / 100).toFixed(2)}`}
              onEdit={() => setQaStep('pricing')}
            />
          </div>
        </div>
      )}

      {/* ─── Navigation ─────────────────────────────────────── */}
      {qaStep !== 'has_exam' && (
        <div className="flex items-center justify-between mt-8 pt-5 border-t border-gray-100">
          <div>
            {!isFirst && (
              <button onClick={goBack} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
                Back
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onSaveDraft}
              disabled={saving}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Save Draft
            </button>
            {isLast ? (
              <button
                onClick={onContinue}
                disabled={!form.title.trim() || saving}
                className="btn-primary px-6 py-2.5 text-sm disabled:opacity-50"
              >
                Continue to Structure
              </button>
            ) : (
              <button
                onClick={goNext}
                disabled={qaStep === 'title' && !form.title.trim()}
                className="btn-primary px-6 py-2.5 text-sm disabled:opacity-50"
              >
                Next
              </button>
            )}
          </div>
        </div>
      )}

      {/* Back button for choice steps (has_exam) */}
      {qaStep === 'has_exam' && (
        <div className="mt-8 pt-5 border-t border-gray-100">
          <button onClick={goBack} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            Back
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Review Row ─────────────────────────────────────────────────
function ReviewRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <div className="flex items-start justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50 transition-colors">
      <div>
        <span className="text-xs text-gray-400 block">{label}</span>
        <span className="text-sm text-gray-900">{value}</span>
      </div>
      <button onClick={onEdit} className="text-xs text-blue-500 hover:text-blue-700 mt-1">
        Edit
      </button>
    </div>
  )
}
