'use client'

import { COURSE_FORMATS, type CourseFormat } from '../lib/course-formats'

const FORMAT_ORDER: CourseFormat[] = [
  'certification',
  'academic',
  'software_tools',
  'skills',
  'compliance',
  'language_vocab',
]

export default function StepFormatSelect({
  onSelect,
  selected,
}: {
  onSelect: (format: CourseFormat) => void
  selected?: CourseFormat
}) {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-2">What type of course are you building?</h2>
        <p className="text-sm text-gray-500">Choose a format to get started with suggested structure and guidance. You can customize everything later.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {FORMAT_ORDER.map(key => {
          const format = COURSE_FORMATS[key]
          const isSelected = selected === key
          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'
              }`}
            >
              <h3 className="text-sm font-semibold text-gray-900 mb-1">{format.label}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{format.description}</p>
            </button>
          )
        })}
      </div>

      <div className="text-center mt-6">
        <button
          onClick={() => onSelect('blank')}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Skip — I&apos;ll start from scratch
        </button>
      </div>
    </div>
  )
}
