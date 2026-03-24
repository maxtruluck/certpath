'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface LessonStats {
  questionsCorrect: number
  questionsTotal: number
  stepsCompleted: number
  stepsTotal: number
  lessonTitle: string
  moduleTitle: string
  courseSlug: string
  courseId: string
}

export default function LessonCompletePage() {
  const params = useParams()
  const router = useRouter()
  const courseSlug = params.courseSlug as string
  const lessonId = params.lessonId as string

  const [stats, setStats] = useState<LessonStats | null>(null)
  const [nextLesson, setNextLesson] = useState<{ id: string; title: string } | null>(null)
  const [isCourseComplete, setIsCourseComplete] = useState(false)

  useEffect(() => {
    // Load stats from sessionStorage
    const stored = sessionStorage.getItem('lessonComplete')
    if (stored) {
      const parsed = JSON.parse(stored)
      setStats(parsed)
      sessionStorage.removeItem('lessonComplete')

      // Fetch next lesson info
      fetchNextLesson(parsed.courseSlug)
    }
  }, [])

  async function fetchNextLesson(slug: string) {
    try {
      const res = await fetch(`/api/courses/${slug}/path`)
      if (!res.ok) return
      const data = await res.json()

      // Find current lesson in modules, then get the next one
      let foundCurrent = false
      for (const mod of data.modules || []) {
        for (const lesson of mod.lessons || []) {
          if (foundCurrent) {
            setNextLesson({ id: lesson.id, title: lesson.title })
            return
          }
          if (lesson.id === lessonId) {
            foundCurrent = true
          }
        }
      }

      // If we found current but no next, course is complete
      if (foundCurrent) {
        setIsCourseComplete(true)
      }
    } catch {
      // Non-blocking
    }
  }

  return (
    <div className="min-h-[100dvh] bg-[#FAFAF8] flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center space-y-6 animate-fade-up">
        {/* Celebration icon */}
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-[#2C2825]">
            {isCourseComplete ? 'Course Complete!' : 'Lesson Complete!'}
          </h1>
          {stats?.lessonTitle && (
            <p className="text-sm text-[#6B635A] mt-1">{stats.lessonTitle}</p>
          )}
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 gap-3">
            <div className={`bg-white rounded-xl border border-[#E8E4DD] p-4 ${stats.questionsTotal === 0 ? 'col-span-2' : ''}`}>
              <p className="text-2xl font-bold text-[#2C2825]">{stats.stepsCompleted}/{stats.stepsTotal}</p>
              <p className="text-xs text-[#A39B90]">Steps completed</p>
            </div>
            {stats.questionsTotal > 0 && (
              <div className="bg-white rounded-xl border border-[#E8E4DD] p-4">
                <p className="text-2xl font-bold text-[#2C2825]">
                  {stats.questionsCorrect}/{stats.questionsTotal}
                </p>
                <p className="text-xs text-[#A39B90]">Questions correct</p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {nextLesson && !isCourseComplete && (
            <button
              onClick={() => router.push(`/lesson/${courseSlug}/${nextLesson.id}`)}
              className="w-full py-3.5 rounded-xl bg-[#2C2825] hover:bg-[#1A1816] text-[#F5F3EF] font-semibold transition-colors flex items-center justify-center gap-2"
            >
              Next Lesson
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          )}
          <button
            onClick={() => router.push(`/course/${courseSlug}/path`)}
            className={`w-full py-3.5 rounded-xl font-semibold transition-colors ${
              nextLesson && !isCourseComplete
                ? 'border border-[#E8E4DD] text-[#2C2825] hover:bg-[#F5F3EF]'
                : 'bg-[#2C2825] hover:bg-[#1A1816] text-[#F5F3EF]'
            }`}
          >
            Back to Course
          </button>
        </div>
      </div>
    </div>
  )
}
