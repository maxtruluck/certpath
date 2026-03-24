'use client'

import type { Module } from './types'
import { hasContent } from './types'

export default function CompletionProgressBar({ modules }: { modules: Module[] }) {
  const allLessons = modules.flatMap(m => m.lessons)
  const total = allLessons.length
  if (total === 0) return null

  const withContent = allLessons.filter(hasContent).length
  const pct = Math.round((withContent / total) * 100)

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 whitespace-nowrap">
        {withContent} of {total} lesson{total !== 1 ? 's' : ''} ready
      </span>
    </div>
  )
}
