'use client'

import { useState, useEffect } from 'react'

export interface CourseFormData {
  title: string
  description: string
  category: string
  difficulty: string
  is_free: boolean
  price_cents: number
  tags: string[]
  estimated_duration: string
  prerequisites: string
  learning_objectives: string[]
  card_color: string
}

export const INITIAL_FORM: CourseFormData = {
  title: '',
  description: '',
  category: 'Cybersecurity',
  difficulty: 'beginner',
  is_free: true,
  price_cents: 0,
  tags: [],
  estimated_duration: '',
  prerequisites: '',
  learning_objectives: ['', ''],
  card_color: '#3b82f6',
}

const DIFFICULTIES = [
  { value: 'beginner', label: 'Beginner', desc: 'No prior knowledge required' },
  { value: 'intermediate', label: 'Intermediate', desc: 'Some foundational knowledge expected' },
  { value: 'advanced', label: 'Advanced', desc: 'Deep experience in the subject' },
]

const CATEGORY_GROUPS = [
  {
    label: 'Technology',
    options: [
      { value: 'Cybersecurity', label: 'Cybersecurity' },
      { value: 'Cloud Computing', label: 'Cloud Computing' },
      { value: 'Networking', label: 'Networking' },
      { value: 'Computer Science', label: 'Computer Science' },
      { value: 'Data Science', label: 'Data Science' },
      { value: 'AI & Machine Learning', label: 'AI & Machine Learning' },
      { value: 'DevOps', label: 'DevOps' },
    ],
  },
  {
    label: 'Academic',
    options: [
      { value: 'Mathematics', label: 'Mathematics' },
      { value: 'Physics', label: 'Physics' },
      { value: 'Chemistry', label: 'Chemistry' },
      { value: 'Biology', label: 'Biology' },
      { value: 'History', label: 'History' },
      { value: 'Economics', label: 'Economics' },
      { value: 'Science', label: 'Science' },
    ],
  },
  {
    label: 'Professional',
    options: [
      { value: 'Business', label: 'Business' },
      { value: 'Marketing', label: 'Marketing' },
      { value: 'Finance', label: 'Finance' },
      { value: 'Project Management', label: 'Project Management' },
      { value: 'Leadership', label: 'Leadership' },
    ],
  },
  {
    label: 'Creative',
    options: [
      { value: 'Music', label: 'Music' },
      { value: 'Design', label: 'Design' },
      { value: 'Photography', label: 'Photography' },
      { value: 'Writing', label: 'Writing' },
    ],
  },
  {
    label: 'Lifestyle',
    options: [
      { value: 'Languages', label: 'Languages' },
      { value: 'Health & Fitness', label: 'Health & Fitness' },
      { value: 'Cooking', label: 'Cooking' },
    ],
  },
  {
    label: 'General',
    options: [
      { value: 'General', label: 'General' },
    ],
  },
  {
    label: 'Other',
    options: [
      { value: 'Other', label: 'Other' },
    ],
  },
]

const PREDEFINED_TAGS = [
  'Certification Prep',
  'Practice Exams',
  'Hands-On',
  'Self-Paced',
  'YouTube Companion',
  'Quick Course',
  'Deep Dive',
  'Study Guide',
  'Lab-Based',
  'Project-Based',
]

const CARD_COLORS = [
  { value: '#3b82f6', label: 'Blue' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#10b981', label: 'Green' },
  { value: '#f59e0b', label: 'Amber' },
  { value: '#ef4444', label: 'Red' },
  { value: '#ec4899', label: 'Pink' },
]

const inputClass = 'w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'

const numericOnly = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (
    e.key.length === 1 &&
    !/[0-9.]/.test(e.key) &&
    !e.metaKey && !e.ctrlKey
  ) {
    e.preventDefault()
  }
}

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
    <div>
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
          placeholder="29.99"
          className={`${inputClass} pl-8`}
        />
      </div>
      <p className="text-xs text-gray-400 mt-1">Minimum $0.99</p>
    </div>
  )
}

export default function StepCourseInfo({
  form,
  onChange,
  onContinue,
  onSaveDraft,
  saving,
}: {
  form: CourseFormData
  onChange: (updates: Partial<CourseFormData>) => void
  onContinue: () => void
  onSaveDraft: () => void
  saving: boolean
}) {
  const [customTagInput, setCustomTagInput] = useState('')
  const [showCustomTag, setShowCustomTag] = useState(false)

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

  const updateObjective = (index: number, value: string) => {
    const updated = [...form.learning_objectives]
    updated[index] = value
    onChange({ learning_objectives: updated })
  }

  const addObjective = () => {
    if (form.learning_objectives.length < 6) {
      onChange({ learning_objectives: [...form.learning_objectives, ''] })
    }
  }

  const removeObjective = (index: number) => {
    if (form.learning_objectives.length > 1) {
      onChange({ learning_objectives: form.learning_objectives.filter((_, i) => i !== index) })
    }
  }

  const descriptionLength = form.description.length

  return (
    <div className="max-w-xl mx-auto">
      {/* Title */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
        <input
          type="text"
          value={form.title}
          onChange={e => {
            if (e.target.value.length <= 120) onChange({ title: e.target.value })
          }}
          placeholder="e.g., CompTIA Security+ SY0-701"
          className={inputClass}
          autoFocus
        />
      </div>

      {/* Description with char counter */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
        <textarea
          value={form.description}
          onChange={e => {
            if (e.target.value.length <= 500) onChange({ description: e.target.value })
          }}
          rows={3}
          placeholder="What will learners gain from this course?"
          className={`${inputClass} resize-none`}
        />
        <p className={`text-xs mt-1 text-right ${descriptionLength > 450 ? 'text-amber-500' : 'text-gray-400'}`}>
          {descriptionLength} / 500
        </p>
      </div>

      {/* Category + Difficulty (two-column row) */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
          <select
            value={form.category}
            onChange={e => onChange({ category: e.target.value })}
            className={inputClass}
          >
            {CATEGORY_GROUPS.map(group => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Difficulty</label>
          <select
            value={form.difficulty}
            onChange={e => onChange({ difficulty: e.target.value })}
            className={inputClass}
          >
            {DIFFICULTIES.map(d => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">
            {DIFFICULTIES.find(d => d.value === form.difficulty)?.desc}
          </p>
        </div>
      </div>

      {/* Duration + Pricing (two-column row) */}
      <div className="mb-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Est. Duration</label>
            <input
              type="text"
              value={form.estimated_duration}
              onChange={e => onChange({ estimated_duration: e.target.value })}
              placeholder="e.g., 12 hours"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Pricing</label>
            {/* Segmented toggle */}
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
                onClick={() => onChange({ is_free: false })}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  !form.is_free
                    ? 'bg-blue-50 text-blue-700'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                Paid
              </button>
            </div>
          </div>
        </div>
        {!form.is_free && (
          <div className="mt-2">
            <PriceInput
              value={form.price_cents}
              onChange={cents => onChange({ price_cents: cents })}
            />
          </div>
        )}
      </div>

      {/* Tags */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
        <p className="text-xs text-gray-400 mb-2">Topic labels to help learners find your course (max 5)</p>
        <div className="flex flex-wrap gap-2">
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
          {/* Custom tags already added */}
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
          {/* + Custom button / inline input */}
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
                <button
                  type="button"
                  onClick={addCustomTag}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium px-1"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => { setShowCustomTag(false); setCustomTagInput('') }}
                  className="text-xs text-gray-400 hover:text-gray-600 px-1"
                >
                  Cancel
                </button>
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

      {/* Prerequisites */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Prerequisites</label>
        <input
          type="text"
          value={form.prerequisites}
          onChange={e => {
            if (e.target.value.length <= 200) onChange({ prerequisites: e.target.value })
          }}
          placeholder="e.g., Basic networking knowledge, familiarity with Linux"
          className={inputClass}
        />
        <p className="text-xs text-gray-400 mt-1">Optional. Comma-separated list of recommended prior knowledge.</p>
      </div>

      {/* Learning Objectives */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Learning Objectives</label>
        <div className="space-y-2">
          {form.learning_objectives.map((obj, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-4 flex-shrink-0">{idx + 1}.</span>
              <input
                type="text"
                value={obj}
                onChange={e => {
                  if (e.target.value.length <= 200) updateObjective(idx, e.target.value)
                }}
                placeholder={`Objective ${idx + 1}`}
                className={`${inputClass} flex-1`}
              />
              {form.learning_objectives.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeObjective(idx)}
                  className="text-gray-300 hover:text-red-500 transition-colors p-1"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 3L11 11M3 11L11 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </div>
          ))}
          {form.learning_objectives.length < 6 && (
            <button
              type="button"
              onClick={addObjective}
              className="text-xs text-blue-500 hover:text-blue-700 font-medium"
            >
              + Add objective
            </button>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-1">Optional. What learners will be able to do after completing this course.</p>
      </div>

      {/* Card Color */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Card Accent Color</label>
        <p className="text-xs text-gray-400 mb-2">Shown as the accent bar on your course card in the marketplace.</p>
        <div className="flex gap-3">
          {CARD_COLORS.map(color => (
            <button
              key={color.value}
              type="button"
              onClick={() => onChange({ card_color: color.value })}
              className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center ${
                form.card_color === color.value
                  ? 'border-gray-900 scale-110 shadow-md'
                  : 'border-gray-200 hover:scale-105'
              }`}
              style={{ backgroundColor: color.value }}
              title={color.label}
            >
              {form.card_color === color.value && (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8L6.5 11.5L13 4.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-5 border-t border-gray-100">
        <button
          onClick={onSaveDraft}
          disabled={saving}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Save Draft
        </button>
        <button
          onClick={onContinue}
          disabled={!form.title.trim() || !form.description.trim() || saving}
          className="btn-primary px-6 py-2.5 text-sm disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Continue to Builder'}
        </button>
      </div>
    </div>
  )
}
