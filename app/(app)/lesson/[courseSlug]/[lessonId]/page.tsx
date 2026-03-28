'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { ReadStep, WatchStep, AnswerStep, EmbedStep, CalloutStep } from '@/components/steps'
import { getReadingTime } from '@/lib/markdown-components'
import { createClient } from '@/lib/supabase/client'
import type { Question, AnswerResult, EmbedContent, CalloutContent } from '@/lib/types/lesson-player'

// ─── Types ──────────────────────────────────────────────────────

interface StepData {
  type: 'read' | 'watch' | 'answer' | 'embed' | 'callout'
  title: string
  // read
  markdown?: string
  // watch
  watchUrl?: string
  // answer
  question?: Question
  // embed
  embedContent?: EmbedContent
  // callout
  calloutContent?: CalloutContent
}

interface StepAnswer {
  isCorrect: boolean
  result: AnswerResult
  selectedIds: string[]
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
  const [stepAnswers, setStepAnswers] = useState<Record<number, StepAnswer>>({})
  const [exitConfirm, setExitConfirm] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Session metadata
  const [courseId, setCourseId] = useState('')
  const [lessonTitle, setLessonTitle] = useState('')
  const [moduleTitle, setModuleTitle] = useState('')
  const [accentColor, setAccentColor] = useState('#2C2825')

  // Stats
  const [questionsCorrect, setQuestionsCorrect] = useState(0)
  const [questionsTotal, setQuestionsTotal] = useState(0)

  const currentStep = steps[currentStepIndex]
  const isLastStep = currentStepIndex === steps.length - 1
  const maxCompleted = Math.max(-1, ...Array.from(completedSteps))

  // Scroll detection for reading indicators
  const contentRef = useRef<HTMLDivElement>(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [isScrollable, setIsScrollable] = useState(false)
  const [isAtBottom, setIsAtBottom] = useState(false)

  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    const check = () => {
      const scrollable = el.scrollHeight > el.clientHeight
      setIsScrollable(scrollable)
      if (scrollable) {
        const pct = el.scrollTop / (el.scrollHeight - el.clientHeight)
        setScrollProgress(Math.min(1, pct))
        setIsAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 20)
      } else {
        setScrollProgress(0)
        setIsAtBottom(true)
      }
    }
    check()
    el.addEventListener('scroll', check, { passive: true })
    const observer = new ResizeObserver(check)
    observer.observe(el)
    return () => { el.removeEventListener('scroll', check); observer.disconnect() }
  }, [currentStepIndex])

  // Reset scroll position when step changes
  useEffect(() => {
    contentRef.current?.scrollTo(0, 0)
  }, [currentStepIndex])

  // Reading time for current step
  const readingTime = currentStep?.type === 'read' && currentStep.markdown
    ? getReadingTime(currentStep.markdown)
    : null

  // ── Load session ──────────────────────────────────────────────
  const loadSession = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()

      // Get course info
      let resolvedCourseId: string

      if (isPreview) {
        // In preview mode, look up course via the lesson directly (skips published check)
        const lessonRes = await fetch(`/api/creator/preview/course-for-lesson?lesson_id=${lessonId}`)
        if (!lessonRes.ok) throw new Error('Course not found')
        const lessonData = await lessonRes.json()
        resolvedCourseId = lessonData.course_id
        setAccentColor(lessonData.card_color || '#2C2825')
      } else {
        const courseRes = await fetch(`/api/courses/${courseSlug}`)
        if (!courseRes.ok) throw new Error('Course not found')
        const courseData = await courseRes.json()
        resolvedCourseId = courseData.id
        setAccentColor(courseData.card_color || '#2C2825')
      }

      setCourseId(resolvedCourseId)

      // Fetch lesson info
      const { data: lesson } = await supabase
        .from('lessons')
        .select('id, title, module_id, modules(title)')
        .eq('id', lessonId)
        .single()

      if (!lesson) throw new Error('Lesson not found')
      setLessonTitle(lesson.title)
      setModuleTitle((lesson as any).modules?.title || '')

      // Fetch lesson steps
      const { data: rawSteps } = await supabase
        .from('lesson_steps')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('sort_order')

      if (!rawSteps || rawSteps.length === 0) {
        setError('No content available for this lesson')
        setLoading(false)
        return
      }

      // Convert to StepData
      const stepsData: StepData[] = rawSteps.map(step => {
        const c = step.content || {}
        switch (step.step_type) {
          case 'watch':
            return { type: 'watch' as const, title: step.title || '', watchUrl: c.video_url || c.url || '' }
          case 'answer':
            return {
              type: 'answer' as const,
              title: step.title || '',
              question: {
                id: step.id,
                question_text: c.question_text || '',
                question_type: c.question_type || 'multiple_choice',
                options: c.options || [],
                correct_option_ids: c.correct_ids || c.correct_option_ids || [],
                explanation: c.explanation || '',
                option_explanations: c.option_explanations || {},
                acceptable_answers: c.acceptable_answers,
                correct_order: c.correct_order,
                matching_items: c.matching_pairs ? {
                  lefts: c.matching_pairs.map((p: any) => p.left),
                  rights: c.matching_pairs.map((p: any) => p.right),
                } : undefined,
              },
            }
          case 'embed':
            return { type: 'embed' as const, title: step.title || '', embedContent: c }
          case 'callout':
            return { type: 'callout' as const, title: step.title || '', calloutContent: c }
          case 'read':
          default:
            return { type: 'read' as const, title: step.title || '', markdown: c.markdown || c.body || '' }
        }
      })

      setSteps(stepsData)
      const qTotal = stepsData.filter(s => s.type === 'answer').length
      setQuestionsTotal(qTotal)

      // Load progress
      if (!isPreview) {
        const { data: progress } = await supabase
          .from('user_lesson_progress')
          .select('status, current_step_index, step_completions')
          .eq('lesson_id', lessonId)
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id || '')
          .single()

        if (progress && progress.status !== 'completed') {
          const completedSet = new Set<number>()
          for (const sc of (progress.step_completions || [])) {
            completedSet.add((sc as any).step_index)
          }
          setCompletedSteps(completedSet)
          const savedIdx = progress.current_step_index || 0
          let targetIndex = Math.min(savedIdx + 1, stepsData.length - 1)
          if (completedSet.has(targetIndex)) {
            let found = false
            for (let i = 0; i < stepsData.length; i++) {
              if (!completedSet.has(i)) { targetIndex = i; found = true; break }
            }
            if (!found) targetIndex = stepsData.length - 1
          }
          setCurrentStepIndex(targetIndex)
        } else if (progress?.status === 'completed') {
          const completedSet = new Set<number>()
          for (let i = 0; i < stepsData.length; i++) completedSet.add(i)
          setCompletedSteps(completedSet)
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

  // ── Step completion ───────────────────────────────────────────
  async function markStepComplete(stepIndex: number, isCorrect?: boolean) {
    const newCompleted = new Set(completedSteps)
    newCompleted.add(stepIndex)
    setCompletedSteps(newCompleted)

    // Skip persistence in preview mode
    if (isPreview) return

    // POST to API -- non-blocking but show toast on failure
    try {
      const res = await fetch(`/api/lesson/${lessonId}/step-complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step_index: stepIndex,
          total_steps: steps.length,
          is_correct: isCorrect,
        }),
      })
      if (!res.ok) {
        console.error('step-complete failed:', res.status)
        showToast('Progress may not have saved')
      }
    } catch (err) {
      console.error('step-complete error:', err)
      showToast('Progress may not have saved')
    }
  }

  function showToast(message: string) {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  function handleStepContinue() {
    markStepComplete(currentStepIndex)
    advanceToNext(false)
  }

  function handleAnswerComplete(isCorrect: boolean) {
    if (isCorrect) setQuestionsCorrect(prev => prev + 1)
    markStepComplete(currentStepIndex, isCorrect)
    advanceToNext(isCorrect)
  }

  function advanceToNext(lastAnswerCorrect: boolean) {
    if (isLastStep) {
      // Account for the answer that just completed (state hasn't flushed yet)
      const finalCorrect = lastAnswerCorrect ? questionsCorrect + 1 : questionsCorrect
      const stats = {
        questionsCorrect: finalCorrect,
        questionsTotal,
        stepsCompleted: completedSteps.size + 1,
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

  function goToStep(index: number) {
    // Can only go back to completed steps
    if (index <= maxCompleted + 1 && index >= 0 && index < steps.length) {
      setCurrentStepIndex(index)
    }
  }

  function handleBack() {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1)
    }
  }

  function handleExit() {
    router.push(`/course/${courseSlug}/path`)
  }

  // ── Loading / Error states ────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[#FAFAF8] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin w-8 h-8 border-2 border-[#2C2825] border-t-transparent rounded-full mx-auto" />
          <p className="text-[#6B635A] text-sm">Loading lesson...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[100dvh] bg-[#FAFAF8] flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <p className="text-[#6B635A] font-medium">{error}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={handleExit} className="text-sm font-medium text-[#6B635A] px-4 py-2 rounded-xl border border-[#E8E4DD] hover:bg-[#F5F3EF]">Back to Course</button>
            <button onClick={loadSession} className="text-sm font-medium text-[#F5F3EF] bg-[#2C2825] px-4 py-2 rounded-xl hover:bg-[#1A1816]">Try again</button>
          </div>
        </div>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────
  const isViewingCompleted = completedSteps.has(currentStepIndex) && currentStepIndex <= maxCompleted
  const isAnswerStep = currentStep?.type === 'answer'
  const showFooterButton = !isAnswerStep

  return (
    <div className="h-[100dvh] flex flex-col bg-[#FAFAF8]">
      {/* ─── Fixed Header ─── */}
      <div className="flex-shrink-0">
        {/* Preview mode banner */}
        {isPreview && (
          <div className="bg-amber-50 text-amber-700 text-xs text-center py-1">
            Preview Mode — progress not saved
          </div>
        )}

        {/* Top bar */}
        <div className="max-w-[640px] mx-auto px-5">
          <div className="flex items-center gap-3 py-2.5">
            <button
              onClick={handleBack}
              disabled={currentStepIndex === 0}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-30"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </button>

            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-500 truncate">
                {moduleTitle ? `${moduleTitle} · ` : ''}{lessonTitle}
              </p>
            </div>

            <span className="text-sm font-mono text-gray-400 whitespace-nowrap">
              {currentStepIndex + 1}/{steps.length}
            </span>

            <button
              onClick={() => setExitConfirm(true)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Segmented progress bar */}
          <div className="flex gap-1 pb-3 items-center">
            {steps.map((_, i) => {
              const isCompleted = completedSteps.has(i)
              const isCurrent = i === currentStepIndex
              const isClickable = i <= maxCompleted + 1
              const isFuture = !isCompleted && !isCurrent

              return (
                <button
                  key={i}
                  onClick={() => isClickable && goToStep(i)}
                  disabled={!isClickable}
                  className={`flex-1 rounded-full transition-all duration-300 ${
                    isCurrent ? 'h-2.5' : 'h-1.5'
                  } ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
                  style={{
                    backgroundColor: isFuture ? '#EBE8E2' : accentColor,
                    opacity: isCompleted && !isCurrent ? 0.5 : 1,
                    minWidth: '4px',
                  }}
                />
              )
            })}
          </div>
        </div>
      </div>

      {/* ─── Scroll Progress Bar ─── */}
      {isScrollable && (
        <div className="flex-shrink-0 h-[2px] bg-gray-100">
          <div
            className="h-full transition-[width] duration-150 ease-out"
            style={{ width: `${scrollProgress * 100}%`, backgroundColor: accentColor }}
          />
        </div>
      )}

      {/* ─── Scrollable Content Area ─── */}
      <div ref={contentRef} className="flex-1 overflow-y-auto relative">
        <div className="max-w-[640px] mx-auto px-5 pt-4 pb-8">
          {/* Reading time indicator */}
          {readingTime && (
            <p className="text-xs text-gray-400 text-right mb-3">~{readingTime} min read</p>
          )}

          {currentStep?.type === 'read' && (
            <ReadStep
              title={currentStep.title}
              content={currentStep.markdown || ''}
              accentColor={accentColor}
            />
          )}

          {currentStep?.type === 'watch' && (
            <WatchStep
              title={currentStep.title}
              videoUrl={currentStep.watchUrl || ''}
            />
          )}

          {currentStep?.type === 'answer' && currentStep.question && (
            <AnswerStep
              key={`${currentStepIndex}-${isViewingCompleted ? 'ro' : 'rw'}`}
              question={currentStep.question}
              onComplete={handleAnswerComplete}
              readOnly={isViewingCompleted}
              previousResult={stepAnswers[currentStepIndex]?.result}
              previousSelectedIds={stepAnswers[currentStepIndex]?.selectedIds}
            />
          )}

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
              accentColor={accentColor}
            />
          )}
        </div>

        {/* Scroll fade gradient -- visible when content scrolls and not at bottom */}
        {isScrollable && !isAtBottom && (
          <div className="sticky bottom-0 h-[60px] bg-gradient-to-t from-[#FAFAF8] to-transparent pointer-events-none" />
        )}
      </div>

      {/* ─── Pinned Footer Button ─── */}
      {showFooterButton && (() => {
        const scrollGated = isScrollable && !isAtBottom
        return (
          <div className="flex-shrink-0 border-t border-gray-100 bg-white px-4 py-3">
            <div className="max-w-[640px] mx-auto">
              <button
                onClick={handleStepContinue}
                disabled={scrollGated}
                className={`w-full py-3.5 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                  scrollGated
                    ? 'bg-[#2C2825] text-[#F5F3EF] opacity-50 cursor-default'
                    : 'bg-[#2C2825] hover:bg-[#1A1816] text-[#F5F3EF] opacity-100'
                }`}
              >
                {isLastStep ? 'Complete Lesson' : 'Continue'}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </div>
          </div>
        )
      })()}

      {/* Exit confirmation modal */}
      {exitConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4" onClick={() => setExitConfirm(false)}>
          <div className="w-full max-w-lg bg-white rounded-2xl border border-[#E8E4DD] p-6 space-y-4 animate-slide-up" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg text-center text-[#2C2825]">Leave lesson?</h3>
            <p className="text-sm text-[#6B635A] text-center">Your progress will be saved. You can resume later.</p>
            <div className="flex gap-3">
              <button onClick={() => setExitConfirm(false)} className="flex-1 py-3 text-sm font-medium rounded-xl border border-[#E8E4DD] text-[#2C2825] hover:bg-[#F5F3EF]">Keep going</button>
              <button onClick={handleExit} className="flex-1 py-3 text-sm font-medium rounded-xl bg-red-500 text-white hover:bg-red-600">Leave</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-[#2C2825] text-white text-sm font-medium shadow-lg animate-fade-up">
          {toast}
        </div>
      )}
    </div>
  )
}
