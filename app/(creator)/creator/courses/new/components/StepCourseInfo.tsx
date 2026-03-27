'use client'

import { useState, useRef } from 'react'
import type { CourseFormData } from '@/lib/store/creator-wizard'

// Re-export for backwards compatibility
export type { CourseFormData }
export { INITIAL_FORM } from '@/lib/store/creator-wizard'

const CATEGORIES = [
  { value: 'Cybersecurity', label: 'Cybersecurity' },
  { value: 'Cloud Computing', label: 'Cloud Computing' },
  { value: 'Networking', label: 'Networking' },
  { value: 'Programming', label: 'Programming' },
  { value: 'Data & Analytics', label: 'Data & Analytics' },
  { value: 'Business & Management', label: 'Business & Management' },
  { value: 'Other', label: 'Other' },
]

const inputClass = 'w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'

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
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const descriptionLength = form.description.length

  const handleImageSelect = (file: File) => {
    if (!file.type.startsWith('image/')) return
    // Create a local preview URL for now
    // Actual upload happens after course is created (on Continue)
    const url = URL.createObjectURL(file)
    onChange({ cover_image_url: url })
  }

  return (
    <div className="max-w-xl mx-auto">
      {/* Cover Image */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Cover Image</label>
        {form.cover_image_url ? (
          <div className="relative rounded-xl overflow-hidden border border-gray-200">
            <img
              src={form.cover_image_url}
              alt="Cover"
              className="w-full h-40 object-cover"
            />
            <button
              type="button"
              onClick={() => onChange({ cover_image_url: '' })}
              className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 2L10 10M2 10L10 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ) : (
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => {
              e.preventDefault()
              setDragOver(false)
              if (e.dataTransfer.files[0]) handleImageSelect(e.dataTransfer.files[0])
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors ${
              dragOver
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-gray-300 mb-2">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <p className="text-xs text-gray-400">Drag & drop or click to upload</p>
            <p className="text-xs text-gray-300 mt-0.5">1200 x 630 recommended</p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => {
            if (e.target.files?.[0]) handleImageSelect(e.target.files[0])
          }}
        />
      </div>

      {/* Title */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
        <input
          type="text"
          value={form.title}
          onChange={e => {
            if (e.target.value.length <= 120) onChange({ title: e.target.value })
          }}
          placeholder='e.g., "CompTIA Security+ SY0-701 Complete Course"'
          className={inputClass}
          autoFocus
        />
        {form.title.length > 0 && form.title.length < 5 && (
          <p className="text-xs text-amber-500 mt-1">Minimum 5 characters</p>
        )}
      </div>

      {/* Description with char counter */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
        <textarea
          value={form.description}
          onChange={e => {
            if (e.target.value.length <= 500) onChange({ description: e.target.value })
          }}
          rows={4}
          placeholder="What will learners be able to do after completing this course?"
          className={`${inputClass} resize-none`}
        />
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-gray-400">This appears on your course listing page.</p>
          <p className={`text-xs ${descriptionLength > 450 ? 'text-amber-500' : 'text-gray-400'}`}>
            {descriptionLength} / 500
          </p>
        </div>
      </div>

      {/* Category */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
        <select
          value={form.category}
          onChange={e => onChange({ category: e.target.value })}
          className={inputClass}
        >
          {CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-8 pt-5 border-t border-gray-100">
        <button
          onClick={onSaveDraft}
          disabled={saving}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onContinue}
          disabled={!form.title.trim() || form.title.trim().length < 5 || saving}
          className="btn-primary px-6 py-2.5 text-sm disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </div>
  )
}
