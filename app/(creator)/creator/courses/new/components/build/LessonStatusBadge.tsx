'use client'

import type { Lesson } from './types'

export default function LessonStatusBadge({ lesson }: { lesson: Lesson }) {
  if (lesson.step_count > 0) {
    return (
      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
        {lesson.step_count} step{lesson.step_count !== 1 ? 's' : ''}
      </span>
    )
  }

  return (
    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-500">
      0
    </span>
  )
}
