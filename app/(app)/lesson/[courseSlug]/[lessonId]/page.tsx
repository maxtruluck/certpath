'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { ReadStep, WatchStep, AnswerStep, EmbedStep, CalloutStep } from '@/components/steps'
import type { Question, EmbedContent, CalloutContent } from '@/lib/types/lesson-player'

// ─── Types ──────────────────────────────────────────────────────

interface StepData {
  type: 'read' | 'watch' | 'answer' | 'embed' | 'callout'
  title: string
  markdown?: string
  watchUrl?: string
  question?: Question
  embedContent?: EmbedContent
  calloutContent?: CalloutContent
}

// ─── Step type badge config ─────────────────────────────────────

const STEP_BADGES: Record<string, { label: string; bg: string; text: string }> = {
  read: { label: 'Read', bg: '#E1F5EE', text: '#085041' },
  watch: { label: 'Watch', bg: '#EDE9FF', text: '#3B2F8E' },
  answer: { label: 'Answer', bg: '#FDEEE8', text: '#8B3518' },
  embed: { label: 'Embed', bg: '#E6F1FB', text: '#0C447C' },
  tip: { label: 'Tip', bg: '#FEF3CD', text: '#856404' },
  key_concept: { label: 'Key Concept', bg: '#FEF3CD', text: '#856404' },
  warning: { label: 'Warning', bg: '#FEF3CD', text: '#856404' },
  exam_note: { label: 'Exam Note', bg: '#FEF3CD', text: '#856404' },
}

// ─── "Get the App" view for non-preview learners ──────────────

function GetTheAppView({ courseSlug, lessonId }: { courseSlug: string; lessonId: string }) {
  const router = useRouter()
  return (
    <div className="h-[100dvh] flex flex-col items-center justify-center" style={{ backgroundColor: '#fff', textAlign: 'center', padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
        </svg>
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>
        Lessons are in the app
      </h1>
      <p style={{ fontSize: 14, color: '#888', marginBottom: 24, maxWidth: 320, lineHeight: 1.5 }}>
        Download the openED app to access interactive lessons, track progress, and learn on the go.
      </p>
      <div className="flex flex-col gap-3 w-full" style={{ maxWidth: 280 }}>
        <a
          href={`opened://lesson/${courseSlug}/${lessonId}`}
          style={{
            display: 'block', backgroundColor: '#1a1a1a', color: '#fff',
            fontSize: 14, fontWeight: 600, textAlign: 'center',
            padding: '12px 0', borderRadius: 10,
          }}
        >
          Open in App
        </a>
        <a
          href="https://apps.apple.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'block', backgroundColor: '#fff', color: '#1a1a1a',
            fontSize: 14, fontWeight: 600, textAlign: 'center',
            padding: '12px 0', borderRadius: 10,
            border: '1px solid #e5e5e5',
          }}
        >
          Download on the App Store
        </a>
      </div>
      <button
        onClick={() => router.push(`/course/${courseSlug}/path`)}
        style={{ fontSize: 12, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', marginTop: 16, textDecoration: 'underline' }}
      >
        Back to course
      </button>
    </div>
  )
}

// ─── Page ───────────────────────────────────────────────────────

export default function LessonPlayerPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const courseSlug = params.courseSlug as string
  const lessonId = params.lessonId as string
  const isPreview = searchParams.get('preview') === 'true'

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [steps, setSteps] = useState<StepData[]>([])
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [completedStepsData, setCompletedStepsData] = useState<any[]>([])
  const [exitConfirm, setExitConfirm] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Session metadata
  const [courseId, setCourseId] = useState('')
  const [lessonTitle, setLessonTitle] = useState('')
  const [moduleTitle, setModuleTitle] = useState('')

  // Stats
  const [questionsCorrect, setQuestionsCorrect] = useState(0)
  const [questionsTotal, setQuestionsTotal] = useState(0)

  // Answer submitted for current step (gates Next button on answer steps)
  const [answerSubmitted, setAnswerSubmitted] = useState(false)

  const currentStep = steps[currentStepIndex]
  const isLastStep = currentStepIndex === steps.length - 1

  // Content ref for scroll
  const contentRef = useRef<HTMLDivElement>(null)

  // Reset scroll and answer state on step change
  useEffect(() => {
    contentRef.current?.scrollTo(0, 0)
    setAnswerSubmitted(false)
  }, [currentStepIndex])

  // ── Load session ──────────────────────────────────────────────
  const loadSession = useCallback(async () => {
    setLoading(true)
    try {
      // Preview mode: resolve course ID for creator preview
      if (isPreview) {
        const lessonRes = await fetch(`/api/creator/preview/course-for-lesson?lesson_id=${lessonId}`)
        if (!lessonRes.ok) throw new Error('Course not found')
        const lessonData = await lessonRes.json()
        setCourseId(lessonData.course_id)
      }

      // Fetch lesson content + steps from API
      const contentRes = await fetch(`/api/lessons/${lessonId}/content`)
      if (!contentRes.ok) {
        const body = await contentRes.json().catch(() => ({}))
        if (body.error === 'No content available for this lesson') {
          setError('No content available for this lesson')
          setLoading(false)
          return
        }
        throw new Error(body.error || 'Failed to load lesson')
      }

      const { lesson, steps: stepsData } = await contentRes.json()

      if (!isPreview) setCourseId(lesson.course_id)
      setLessonTitle(lesson.title)
      setModuleTitle(lesson.module_title)
      setSteps(stepsData)
      setQuestionsTotal(stepsData.filter((s: StepData) => s.type === 'answer').length)

      // Load progress
      if (!isPreview) {
        const progressRes = await fetch(`/api/lessons/${lessonId}/progress`)
        const { progress } = await progressRes.json()

        if (progress && progress.status !== 'completed') {
          const completedSet = new Set<number>()
          const stepCompletions = progress.step_completions || []
          for (const sc of stepCompletions) {
            completedSet.add((sc as any).step_index)
          }
          setCompletedSteps(completedSet)
          setCompletedStepsData(stepCompletions)
          const savedIdx = progress.current_step_index || 0
          let targetIndex = Math.min(savedIdx + 1, stepsData.length - 1)
          if (completedSet.has(targetIndex)) {
            let foundUncompleted = false
            for (let i = 0; i < stepsData.length; i++) {
              if (!completedSet.has(i)) { targetIndex = i; foundUncompleted = true; break }
            }
            if (!foundUncompleted) {
              // All steps completed — start from beginning for review
              targetIndex = 0
            }
          }
          setCurrentStepIndex(targetIndex)
        } else if (progress?.status === 'completed') {
          const completedSet = new Set<number>()
          for (let i = 0; i < stepsData.length; i++) completedSet.add(i)
          setCompletedSteps(completedSet)
          setCompletedStepsData(progress.step_completions || [])
          setCurrentStepIndex(0)
        }
      }
    } catch (err) {
      setError('Something went wrong loading this lesson')
      console.error('Lesson load error:', err)
    }
    setLoading(false)
  }, [courseSlug, lessonId, isPreview])

  useEffect(() => { loadSession() }, [loadSession])

  // Non-preview learners see "Get the app" instead of the web lesson player
  if (!isPreview) {
    return <GetTheAppView courseSlug={courseSlug} lessonId={lessonId} />
  }

  // ── Step completion ───────────────────────────────────────────
  async function markStepComplete(stepIndex: number, isCorrect?: boolean) {
    const newCompleted = new Set(completedSteps)
    newCompleted.add(stepIndex)
    setCompletedSteps(newCompleted)

    if (isPreview) return

    try {
      const res = await fetch(`/api/lessons/${lessonId}/step-complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step_index: stepIndex, total_steps: steps.length, is_correct: isCorrect }),
      })
      if (!res.ok) showToast('Progress may not have saved')
    } catch {
      showToast('Progress may not have saved')
    }
  }

  function showToast(message: string) {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  async function handleNext() {
    // Mark step complete if not already done (answer steps are marked by handleAnswerComplete).
    // Await the API call to ensure it persists before navigating away.
    if (!completedSteps.has(currentStepIndex)) {
      await markStepComplete(currentStepIndex)
    }
    if (isLastStep) {
      // Calculate completed count including the current step (which was just marked)
      const allCompleted = new Set(completedSteps)
      allCompleted.add(currentStepIndex)
      const stats = {
        questionsCorrect,
        questionsTotal,
        stepsCompleted: Math.min(allCompleted.size, steps.length),
        stepsTotal: steps.length,
        lessonTitle,
        moduleTitle,
        courseSlug,
        courseId,
      }
      sessionStorage.setItem('lessonComplete', JSON.stringify(stats))
      router.push(`/lesson/${courseSlug}/${lessonId}/complete`)
    } else {
      setCurrentStepIndex(prev => prev + 1)
    }
  }

  async function handleAnswerComplete(isCorrect: boolean) {
    if (isCorrect) setQuestionsCorrect(prev => prev + 1)
    await markStepComplete(currentStepIndex, isCorrect)
    setAnswerSubmitted(true)
  }

  function handlePrevious() {
    if (currentStepIndex > 0) setCurrentStepIndex(prev => prev - 1)
  }

  function handleExit() {
    router.push(`/course/${courseSlug}/path`)
  }

  // ── Loading / Error states ────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center" style={{ backgroundColor: '#fff' }}>
        <div className="animate-spin w-8 h-8 border-2 border-[#1a1a1a] border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center px-4" style={{ backgroundColor: '#fff' }}>
        <div className="text-center space-y-4">
          <p style={{ color: '#999' }}>{error}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={handleExit} style={{ fontSize: 14, padding: '8px 16px', border: '1px solid #e5e5e5', borderRadius: 10, color: '#888' }}>Back to Course</button>
            <button onClick={loadSession} style={{ fontSize: 14, padding: '8px 16px', backgroundColor: '#1a1a1a', color: '#fff', borderRadius: 10, border: 'none' }}>Try again</button>
          </div>
        </div>
      </div>
    )
  }

  // ── Step badge ────────────────────────────────────────────────
  const badgeKey = currentStep?.type === 'callout'
    ? (currentStep.calloutContent?.callout_style || 'tip')
    : currentStep?.type || 'read'
  const badge = STEP_BADGES[badgeKey] || STEP_BADGES.read

  // Whether Next is enabled
  const isAnswerStep = currentStep?.type === 'answer'
  const isViewingCompleted = completedSteps.has(currentStepIndex)
  const nextEnabled = !isAnswerStep || answerSubmitted || isViewingCompleted

  return (
    <div className="h-[100dvh] flex flex-col" style={{ backgroundColor: '#fff' }}>
      {/* ─── Header ─── */}
      <div style={{ flexShrink: 0, padding: '0 12px' }}>
        {/* Preview banner */}
        {isPreview && (
          <div style={{ backgroundColor: '#FEF3CD', color: '#856404', fontSize: 12, textAlign: 'center', padding: '4px 0' }}>
            Preview mode
          </div>
        )}

        {/* Top bar */}
        <div className="flex items-center justify-between" style={{ height: 44 }}>
          <button onClick={() => setExitConfirm(true)} style={{ fontSize: 13, color: '#888', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            Back
          </button>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', flex: 1, textAlign: 'center' }} className="truncate px-2">
            {lessonTitle}
          </p>
          <span style={{ fontSize: 12, color: '#999', flexShrink: 0 }}>
            {Math.min(currentStepIndex + 1, steps.length)} / {steps.length}
          </span>
        </div>

        {/* Progress dots */}
        <div className="flex gap-px" style={{ padding: '0 12px 12px' }}>
          {steps.map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 2,
                backgroundColor: completedSteps.has(i) ? '#1D9E75' : i === currentStepIndex ? '#378ADD' : '#eee',
              }}
            />
          ))}
        </div>
      </div>

      {/* ─── Content area ─── */}
      <div ref={contentRef} className="flex-1 overflow-y-auto" style={{ padding: 20 }}>
        {/* Step type badge */}
        <span
          style={{
            display: 'inline-block',
            fontSize: 11,
            fontWeight: 600,
            padding: '2.5px 10px',
            borderRadius: 4,
            backgroundColor: badge.bg,
            color: badge.text,
            marginBottom: 16,
          }}
        >
          {badge.label}
        </span>

        {currentStep?.type === 'read' && (
          <ReadStep
            title={currentStep.title}
            content={currentStep.markdown || ''}
            accentColor="#1a1a1a"
          />
        )}

        {currentStep?.type === 'watch' && (
          <WatchStep
            title={currentStep.title}
            videoUrl={currentStep.watchUrl || ''}
          />
        )}

        {currentStep?.type === 'answer' && currentStep.question && (() => {
          const stepCompletion = completedStepsData.find(
            (c: any) => c.step_index === currentStepIndex
          )
          return (
            <AnswerStep
              key={currentStepIndex}
              question={currentStep.question}
              onComplete={handleAnswerComplete}
              readOnly={isViewingCompleted}
              previousResult={isViewingCompleted && stepCompletion ? {
                is_correct: stepCompletion.is_correct,
                correct_option_ids: currentStep.question.correct_option_ids || [],
                explanation: currentStep.question.explanation || '',
              } : undefined}
            />
          )
        })()}

        {currentStep?.type === 'embed' && currentStep.embedContent && (
          <EmbedStep
            title={currentStep.title}
            content={currentStep.embedContent}
          />
        )}

        {currentStep?.type === 'callout' && currentStep.calloutContent && (
          <CalloutStep
            variant={currentStep.calloutContent.callout_style || 'tip'}
            title={currentStep.calloutContent.title || currentStep.title}
            content={currentStep.calloutContent.markdown || ''}
            accentColor="#1a1a1a"
          />
        )}
      </div>

      {/* ─── Footer ─── */}
      <div
        className="flex justify-between items-center"
        style={{ flexShrink: 0, padding: '12px 20px', borderTop: '1px solid #eee' }}
      >
        {/* Previous */}
        {currentStepIndex > 0 ? (
          <button
            onClick={handlePrevious}
            style={{
              fontSize: 14, padding: '10px 20px',
              backgroundColor: '#fff', border: '1px solid #e5e5e5',
              borderRadius: 10, color: '#888', cursor: 'pointer',
            }}
          >
            &larr; Previous
          </button>
        ) : (
          <div />
        )}

        {/* Next */}
        <button
          onClick={handleNext}
          disabled={!nextEnabled}
          style={{
            fontSize: 14, padding: '10px 20px',
            backgroundColor: nextEnabled ? '#1a1a1a' : '#ccc',
            color: '#fff',
            borderRadius: 10, border: 'none', cursor: nextEnabled ? 'pointer' : 'default',
          }}
        >
          {isLastStep ? 'Complete lesson \u2713' : 'Next \u2192'}
        </button>
      </div>

      {/* Exit confirmation modal */}
      {exitConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.4)', padding: 16 }} onClick={() => setExitConfirm(false)}>
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 700, textAlign: 'center', color: '#1a1a1a' }}>Leave lesson?</h3>
            <p style={{ fontSize: 14, color: '#999', textAlign: 'center' }}>Your progress will be saved. You can resume later.</p>
            <div className="flex gap-3">
              <button onClick={() => setExitConfirm(false)} style={{ flex: 1, padding: 12, fontSize: 14, fontWeight: 500, borderRadius: 10, border: '1px solid #e5e5e5', color: '#1a1a1a', backgroundColor: '#fff', cursor: 'pointer' }}>Keep going</button>
              <button onClick={handleExit} style={{ flex: 1, padding: 12, fontSize: 14, fontWeight: 500, borderRadius: 10, border: 'none', backgroundColor: '#E24B4A', color: '#fff', cursor: 'pointer' }}>Leave</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
          zIndex: 50, padding: '8px 16px', borderRadius: 8,
          backgroundColor: '#1a1a1a', color: '#fff', fontSize: 14, fontWeight: 500,
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}
