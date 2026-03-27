'use client'

import LessonEditorLayout from '@/components/creator/wizard/LessonEditorLayout'

export default function StepBuildCourse({
  courseId,
  cardColor: _cardColor,
  courseTitle,
  category,
  onBack,
  onPublish,
}: {
  courseId: string
  cardColor?: string
  courseTitle?: string
  category?: string
  onBack: () => void
  onPublish: () => void
}) {
  return (
    <LessonEditorLayout
      courseId={courseId}
      courseTitle={courseTitle}
      category={category}
      onBack={onBack}
      onContinue={onPublish}
    />
  )
}
