'use client'

import { useState, useEffect } from 'react'

interface CourseData {
  title: string
  slug: string
  description: string
  category: string
  difficulty: string
  is_free: boolean
  price_cents: number
  tags: string[]
  card_color: string
  modules: {
    id: string
    title: string
    lessons: {
      id: string
      title: string
      step_count: number
    }[]
  }[]
  stats: {
    module_count: number
    lesson_count: number
    question_count: number
  }
}

export default function StepReviewPublish({
  courseId,
  cardColor,
  onBack,
  onPublish,
}: {
  courseId: string
  cardColor: string
  onBack: () => void
  onPublish: () => void
}) {
  const [course, setCourse] = useState<CourseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)

  useEffect(() => {
    fetch(`/api/creator/courses/${courseId}`)
      .then(r => r.json())
      .then(data => setCourse(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [courseId])

  const totalSteps = course?.modules?.reduce(
    (sum, m) => sum + m.lessons.reduce((s, l) => s + (l.step_count || 0), 0), 0
  ) || 0

  const lessonsWithSteps = course?.modules?.reduce(
    (sum, m) => sum + m.lessons.filter(l => (l.step_count || 0) > 0).length, 0
  ) || 0

  const totalLessons = course?.modules?.reduce(
    (sum, m) => sum + m.lessons.length, 0
  ) || 0

  const emptyLessons = totalLessons - lessonsWithSteps
  const canPublish = lessonsWithSteps > 0

  const handlePublish = async () => {
    setPublishing(true)
    await onPublish()
    setPublishing(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load course data</p>
        <button onClick={onBack} className="mt-4 text-blue-500 text-sm">Back to editor</button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Course summary card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="h-2" style={{ backgroundColor: cardColor }} />
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-1">{course.title}</h2>
          {course.description && (
            <p className="text-sm text-gray-500 mb-4">{course.description}</p>
          )}

          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
            <span>{course.modules?.length || 0} module{(course.modules?.length || 0) !== 1 ? 's' : ''}</span>
            <span>{totalLessons} lesson{totalLessons !== 1 ? 's' : ''}</span>
            <span>{totalSteps} step{totalSteps !== 1 ? 's' : ''}</span>
          </div>

          <div className="flex flex-wrap gap-2 mb-2">
            {course.category && (
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{course.category}</span>
            )}
            {course.difficulty && (
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full capitalize">{course.difficulty}</span>
            )}
            {(course.tags || []).map(tag => (
              <span key={tag} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">{tag}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Content audit */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Content Audit</h3>

        {emptyLessons > 0 && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <span className="text-sm text-amber-700">{emptyLessons} lesson{emptyLessons !== 1 ? 's' : ''} with no steps</span>
          </div>
        )}

        <div className="space-y-3">
          {(course.modules || []).map(mod => (
            <div key={mod.id}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{mod.title}</p>
              <div className="space-y-1 ml-2">
                {mod.lessons.map(lesson => {
                  const hasSteps = (lesson.step_count || 0) > 0
                  return (
                    <div key={lesson.id} className="flex items-center gap-2 py-1">
                      {hasSteps ? (
                        <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                      )}
                      <span className={`text-sm ${hasSteps ? 'text-gray-700' : 'text-amber-600'}`}>{lesson.title}</span>
                      <span className="text-[10px] text-gray-400 ml-auto">{lesson.step_count || 0} step{(lesson.step_count || 0) !== 1 ? 's' : ''}</span>
                      {hasSteps && course.slug && (
                        <button
                          onClick={() => window.open(`/lesson/${course.slug}/${lesson.id}?preview=true`, '_blank')}
                          className="text-xs text-blue-500 hover:text-blue-700 ml-1"
                        >
                          Preview
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preview as Learner */}
      {courseId && (
        <div className="border border-blue-200 bg-blue-50 rounded-xl p-4 text-center mb-6">
          <button
            onClick={() => window.open(`/course/${course.slug || 'preview'}?preview=true&courseId=${courseId}`, '_blank')}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-3 text-sm font-medium transition-colors inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Preview as Learner
          </button>
          <p className="text-xs text-gray-400 mt-2">Walk through your course exactly as a learner would see it</p>
        </div>
      )}

      {/* Publish section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="mb-4">
          <p className="text-sm text-gray-700">
            {course.is_free
              ? 'This course is Free'
              : `This course is $${((course.price_cents || 0) / 100).toFixed(2)}`
            }
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Once published, this course will be visible to all learners on openED.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to Editor
          </button>
          <button
            onClick={handlePublish}
            disabled={!canPublish || publishing}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {publishing ? 'Publishing...' : 'Publish Course'}
          </button>
        </div>

        {!canPublish && (
          <p className="text-xs text-amber-600 mt-2">Add steps to at least one lesson before publishing.</p>
        )}
      </div>
    </div>
  )
}
