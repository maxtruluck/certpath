'use client'

import { useState } from 'react'
import type { CourseFormData } from '@/lib/store/creator-wizard'

// Re-export for backwards compatibility
export type { CourseFormData }
export { INITIAL_FORM } from '@/lib/store/creator-wizard'

// ─── Category list with color mapping ──────────────────────────
const CATEGORIES = [
  { value: 'Cybersecurity', color: '#EF4444' },
  { value: 'Cloud Computing', color: '#3B82F6' },
  { value: 'Networking', color: '#8B5CF6' },
  { value: 'Programming', color: '#10B981' },
  { value: 'Data & Analytics', color: '#F59E0B' },
  { value: 'Business & Management', color: '#EC4899' },
  { value: 'Web Development', color: '#14B8A6' },
  { value: 'Mobile Development', color: '#6366F1' },
  { value: 'DevOps', color: '#F97316' },
  { value: 'Database', color: '#06B6D4' },
  { value: 'AI & Machine Learning', color: '#8B5CF6' },
  { value: 'Game Development', color: '#EF4444' },
  { value: 'Design', color: '#EC4899' },
  { value: 'Mathematics', color: '#3B82F6' },
  { value: 'Science', color: '#10B981' },
  { value: 'Music Theory', color: '#A855F7' },
  { value: 'Language Arts', color: '#F59E0B' },
  { value: 'History', color: '#78716C' },
  { value: 'Philosophy', color: '#6B7280' },
  { value: 'Psychology', color: '#F472B6' },
  { value: 'Health & Fitness', color: '#22C55E' },
  { value: 'Photography', color: '#0EA5E9' },
  { value: 'Film & Video', color: '#DC2626' },
  { value: 'Marketing', color: '#F97316' },
  { value: 'Finance', color: '#059669' },
  { value: 'Accounting', color: '#4F46E5' },
  { value: 'Project Management', color: '#2563EB' },
  { value: 'IT & Software', color: '#7C3AED' },
  { value: 'Hardware', color: '#64748B' },
  { value: 'Operating Systems', color: '#0891B2' },
  { value: 'Blockchain', color: '#8B5CF6' },
  { value: 'Robotics', color: '#EF4444' },
  { value: 'Test Prep', color: '#F59E0B' },
  { value: 'Teaching & Academics', color: '#3B82F6' },
  { value: 'Personal Development', color: '#EC4899' },
  { value: 'Lifestyle', color: '#14B8A6' },
  { value: 'Other', color: '#6B7280' },
]

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const

export default function StepCourseInfo({
  form,
  onChange,
  onContinue,
}: {
  form: CourseFormData
  onChange: (updates: Partial<CourseFormData>) => void
  onContinue: () => void
  onSaveDraft?: () => void
  saving?: boolean
}) {
  const [tagInput, setTagInput] = useState('')

  const descriptionLength = form.description.length

  const handleCategoryChange = (category: string) => {
    const cat = CATEGORIES.find(c => c.value === category)
    onChange({ category, card_color: cat?.color || '#3b82f6' })
  }

  const addTag = () => {
    const trimmed = tagInput.trim()
    if (!trimmed || (form.tags || []).includes(trimmed)) return
    onChange({ tags: [...(form.tags || []), trimmed] })
    setTagInput('')
  }

  const removeTag = (tag: string) => {
    onChange({ tags: (form.tags || []).filter(t => t !== tag) })
  }

  const addObjective = () => {
    onChange({ learning_objectives: [...form.learning_objectives, ''] })
  }

  const updateObjective = (idx: number, value: string) => {
    const updated = [...form.learning_objectives]
    updated[idx] = value
    onChange({ learning_objectives: updated })
  }

  const removeObjective = (idx: number) => {
    const updated = form.learning_objectives.filter((_, i) => i !== idx)
    onChange({ learning_objectives: updated })
  }

  const canContinue = form.title.trim().length >= 3 && form.description.trim().length > 0 && form.category

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    color: '#555',
    marginBottom: 6,
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e5e5e5',
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 24px 60px' }}>
      {/* Page title */}
      <h1 style={{ fontSize: 22, fontWeight: 600, color: '#1a1a1a', marginBottom: 4 }}>
        Define your course
      </h1>
      <p style={{ fontSize: 14, color: '#999', marginBottom: 32 }}>
        Tell learners what your course is about
      </p>

      {/* 1. Title */}
      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle}>
          Title <span style={{ color: '#EF4444' }}>*</span>
        </label>
        <input
          type="text"
          value={form.title}
          onChange={e => { if (e.target.value.length <= 120) onChange({ title: e.target.value }) }}
          placeholder='e.g., "CompTIA Security+ SY0-701 Complete Course"'
          style={inputStyle}
          className="focus:border-[#378ADD]"
          autoFocus
        />
      </div>

      {/* 2. Description */}
      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle}>
          Description <span style={{ color: '#EF4444' }}>*</span>
        </label>
        <textarea
          value={form.description}
          onChange={e => { if (e.target.value.length <= 500) onChange({ description: e.target.value }) }}
          placeholder="What will learners be able to do after completing this course?"
          style={{ ...inputStyle, minHeight: 80, resize: 'vertical' as const }}
          className="focus:border-[#378ADD]"
        />
        <p style={{ fontSize: 11, color: '#999', textAlign: 'right', marginTop: 4 }}>
          {descriptionLength} / 500
        </p>
      </div>

      {/* 3. Category + Difficulty (side by side) */}
      <div className="flex gap-4" style={{ marginBottom: 24 }}>
        {/* Category */}
        <div className="flex-1">
          <label style={labelStyle}>Category</label>
          <select
            value={form.category}
            onChange={e => handleCategoryChange(e.target.value)}
            style={inputStyle}
            className="focus:border-[#378ADD]"
          >
            {CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.value}</option>
            ))}
          </select>
        </div>

        {/* Difficulty */}
        <div className="flex-1">
          <label style={labelStyle}>Difficulty</label>
          <div className="flex gap-2">
            {DIFFICULTIES.map(d => {
              const isActive = form.difficulty === d
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => onChange({ difficulty: d })}
                  style={{
                    flex: 1,
                    padding: '4px 16px',
                    borderRadius: 20,
                    border: isActive ? '1px solid #1a1a1a' : '1px solid #e5e5e5',
                    background: isActive ? '#1a1a1a' : 'white',
                    color: isActive ? 'white' : '#888',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* 4. Pricing */}
      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle}>Pricing</label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onChange({ is_free: !form.is_free, price_cents: form.is_free ? 1499 : 0 })}
            style={{
              width: 40,
              height: 22,
              borderRadius: 11,
              background: form.is_free ? '#1D9E75' : '#ccc',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background 0.2s',
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: 'white',
                position: 'absolute',
                top: 3,
                left: form.is_free ? 21 : 3,
                transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
              }}
            />
          </button>
          <span style={{
            fontSize: 13,
            fontWeight: 500,
            color: form.is_free ? '#1D9E75' : '#888',
          }}>
            {form.is_free ? 'Free' : 'Paid'}
          </span>
          {!form.is_free && (
            <div className="flex items-center">
              <span style={{ fontSize: 14, color: '#888', marginRight: 4 }}>$</span>
              <input
                type="text"
                inputMode="decimal"
                value={form.price_cents ? (form.price_cents / 100).toString() : ''}
                onChange={e => {
                  const raw = e.target.value
                  if (raw === '' || /^\d*\.?\d{0,2}$/.test(raw)) {
                    onChange({ price_cents: Math.round(parseFloat(raw || '0') * 100) })
                  }
                }}
                placeholder="14.99"
                style={{ ...inputStyle, width: 80, padding: '6px 10px' }}
                className="focus:border-[#378ADD]"
              />
            </div>
          )}
        </div>
        <p style={{ fontSize: 11, color: '#999', marginTop: 6 }}>
          {form.is_free ? 'Anyone can enroll for free' : 'You earn 80% of each sale'}
        </p>
      </div>

      {/* 5. Tags */}
      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle}>Tags</label>
        <div
          className="flex flex-wrap items-center"
          style={{
            gap: 6,
            padding: '8px 10px',
            border: '1px solid #e5e5e5',
            borderRadius: 8,
            minHeight: 42,
          }}
        >
          {(form.tags || []).map(tag => (
            <span
              key={tag}
              className="inline-flex items-center"
              style={{
                fontSize: 12,
                padding: '3px 10px',
                borderRadius: 4,
                background: '#f0f0f0',
                color: '#555',
              }}
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                style={{ marginLeft: 6, color: '#999', fontSize: 14 }}
              >
                &times;
              </button>
            </span>
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); addTag() }
            }}
            placeholder="Add a tag..."
            style={{ border: 'none', outline: 'none', fontSize: 13, minWidth: 100, flex: 1 }}
          />
        </div>
      </div>

      {/* 6. Learning objectives */}
      <div style={{ marginBottom: 32 }}>
        <label style={labelStyle}>Learning objectives</label>
        <div className="space-y-2">
          {form.learning_objectives.map((obj, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
                <path d="M4 8L7 11L12 5" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <input
                type="text"
                value={obj}
                onChange={e => updateObjective(idx, e.target.value)}
                placeholder={`Objective ${idx + 1}`}
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  border: '1px solid #e5e5e5',
                  borderRadius: 6,
                  fontSize: 13,
                  outline: 'none',
                }}
                className="focus:border-[#378ADD]"
              />
              {form.learning_objectives.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeObjective(idx)}
                  style={{ color: '#ccc', fontSize: 16 }}
                >
                  &times;
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addObjective}
          style={{ fontSize: 13, color: '#378ADD', marginTop: 10, fontWeight: 500 }}
        >
          + Add another objective
        </button>
        <p style={{ fontSize: 11, color: '#999', marginTop: 6 }}>
          These show as &ldquo;What you&apos;ll learn&rdquo; on your course page
        </p>
      </div>

      {/* Continue button (also in top bar, but here as well for scrolled users) */}
      <div style={{ borderTop: '1px solid #eee', paddingTop: 20 }}>
        <button
          onClick={onContinue}
          disabled={!canContinue}
          style={{
            background: canContinue ? '#1a1a1a' : '#ccc',
            color: 'white',
            fontSize: 14,
            padding: '10px 28px',
            borderRadius: 8,
            fontWeight: 500,
            cursor: canContinue ? 'pointer' : 'default',
            border: 'none',
          }}
        >
          Continue to Build &rarr;
        </button>
      </div>
    </div>
  )
}
