'use client'

import { useState, useEffect } from 'react'

export interface CourseFormData {
  title: string
  description: string
  category: string
  difficulty: string
  is_free: boolean
  price_cents: number
  thumbnail_url: string
  tags: string[]
}

export const INITIAL_FORM: CourseFormData = {
  title: '',
  description: '',
  category: 'Cybersecurity',
  difficulty: 'beginner',
  is_free: true,
  price_cents: 0,
  thumbnail_url: '',
  tags: [],
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
]

const AVAILABLE_TAGS = [
  'Certification Prep',
  'Beginner Friendly',
  'Advanced',
  'Hands-On',
  'YouTube Companion',
  'Quick Course',
]

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
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
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
        className={`${inputClass} pl-7`}
      />
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
  const toggleTag = (tag: string) => {
    const current = form.tags || []
    if (current.includes(tag)) {
      onChange({ tags: current.filter(t => t !== tag) })
    } else {
      onChange({ tags: [...current, tag] })
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      {/* Title */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
        <input
          type="text"
          value={form.title}
          onChange={e => onChange({ title: e.target.value })}
          placeholder="e.g., CompTIA Security+ SY0-701"
          className={inputClass}
          autoFocus
        />
      </div>

      {/* Description */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
        <textarea
          value={form.description}
          onChange={e => onChange({ description: e.target.value })}
          rows={3}
          placeholder="What will learners gain from this course?"
          className={`${inputClass} resize-none`}
        />
      </div>

      {/* Thumbnail URL */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-1">Course Thumbnail</label>
        <p className="text-xs text-gray-400 mb-1.5">Recommended: 800x600px. Shows on course cards in the marketplace.</p>
        <input
          type="url"
          value={form.thumbnail_url}
          onChange={e => onChange({ thumbnail_url: e.target.value })}
          placeholder="https://example.com/image.jpg"
          className={inputClass}
        />
        {form.thumbnail_url && (
          <div className="mt-2 rounded-lg overflow-hidden border border-gray-200">
            <img
              src={form.thumbnail_url}
              alt="Thumbnail preview"
              className="w-full h-32 object-cover"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          </div>
        )}
      </div>

      {/* Category (grouped dropdown) */}
      <div className="mb-5">
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

      {/* Tags */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
        <p className="text-xs text-gray-400 mb-2">Optional labels to help learners find your course.</p>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_TAGS.map(tag => {
            const active = (form.tags || []).includes(tag)
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                  active
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                    : 'border-gray-200 text-gray-500 hover:border-blue-300'
                }`}
              >
                {tag}
              </button>
            )
          })}
        </div>
      </div>

      {/* Difficulty */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Difficulty</label>
        <div className="flex gap-2">
          {DIFFICULTIES.map(d => (
            <button
              key={d.value}
              onClick={() => onChange({ difficulty: d.value })}
              className={`flex-1 px-3 py-2.5 rounded-lg border-2 text-center transition-all ${
                form.difficulty === d.value
                  ? 'border-blue-500 bg-blue-50/50 text-blue-700'
                  : 'border-gray-200 hover:border-blue-300 text-gray-600'
              }`}
            >
              <span className="text-sm font-medium block">{d.label}</span>
              <span className="text-[11px] text-gray-400 block mt-0.5">{d.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Pricing</label>
        <div className="flex gap-3 mb-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={form.is_free}
              onChange={() => onChange({ is_free: true, price_cents: 0 })}
              className="text-blue-500"
            />
            <span className="text-sm text-gray-700">Free</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={!form.is_free}
              onChange={() => onChange({ is_free: false })}
              className="text-blue-500"
            />
            <span className="text-sm text-gray-700">Paid</span>
          </label>
        </div>
        {!form.is_free && (
          <PriceInput
            value={form.price_cents}
            onChange={cents => onChange({ price_cents: cents })}
          />
        )}
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
          disabled={!form.title.trim() || saving}
          className="btn-primary px-6 py-2.5 text-sm disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Continue to Builder'}
        </button>
      </div>
    </div>
  )
}
