'use client'

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
