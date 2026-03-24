'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MathText } from '@/lib/math-text'

// ─── Types ──────────────────────────────────────────────────────────────────

interface TestQuestion {
  question_id: string
  source: 'step' | 'pool'
  question_text: string
  question_type: string
  options?: { id: string; text: string }[]
  selected_answer: any
  flagged: boolean
}

interface TestSession {
  attempt_id: string
  test_title: string
  test_type: string
  time_limit_minutes: number | null
  started_at: string
  questions: TestQuestion[]
  total_questions: number
}

interface TestResult {
  score: number
  score_percent: number
  passed: boolean
  passing_score: number
  time_spent_seconds: number
  total_questions: number
  show_full_results: boolean
  questions?: any[]
}

type Phase = 'loading' | 'test' | 'review' | 'results'

// ─── Component ──────────────────────────────────────────────────────────────

export default function TestPlayerPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const testId = params.testId as string

  const [phase, setPhase] = useState<Phase>('loading')
  const [session, setSession] = useState<TestSession | null>(null)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [flags, setFlags] = useState<Record<string, boolean>>({})
  const [result, setResult] = useState<TestResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null)

  // ── Start test ──────────────────────────────────────────────────────
  useEffect(() => {
    async function startTest() {
      try {
        const res = await fetch(`/api/courses/${slug}/tests/${testId}`, { method: 'POST' })
        if (!res.ok) {
          const data = await res.json()
          setError(data.error || 'Failed to start test')
          setPhase('loading')
          return
        }
        const data: TestSession = await res.json()
        setSession(data)

        // Restore saved answers
        const restored: Record<string, any> = {}
        const restoredFlags: Record<string, boolean> = {}
        for (const q of data.questions) {
          if (q.selected_answer != null) restored[q.question_id] = q.selected_answer
          if (q.flagged) restoredFlags[q.question_id] = true
        }
        setAnswers(restored)
        setFlags(restoredFlags)

        // Timer
        if (data.time_limit_minutes) {
          const elapsed = Math.floor((Date.now() - new Date(data.started_at).getTime()) / 1000)
          const remaining = data.time_limit_minutes * 60 - elapsed
          setTimeRemaining(Math.max(0, remaining))
        }

        setPhase('test')
      } catch {
        setError('Something went wrong')
      }
    }
    startTest()
  }, [slug, testId])

  // ── Timer countdown ─────────────────────────────────────────────────
  useEffect(() => {
    if (timeRemaining === null || phase !== 'test') return
    if (timeRemaining <= 0) {
      handleSubmit()
      return
    }
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [timeRemaining, phase])

  // Auto-submit when timer hits 0
  useEffect(() => {
    if (timeRemaining === 0 && phase === 'test') {
      handleSubmit()
    }
  }, [timeRemaining, phase])

  // ── Auto-save ───────────────────────────────────────────────────────
  const autoSave = useCallback(async () => {
    if (!session) return
    try {
      await fetch(`/api/courses/${slug}/tests/${testId}/attempts/${session.attempt_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, flags }),
      })
    } catch { /* silent */ }
  }, [session, slug, testId, answers, flags])

  useEffect(() => {
    if (phase !== 'test') return
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(autoSave, 3000)
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current) }
  }, [answers, flags, autoSave, phase])

  // ── Handlers ────────────────────────────────────────────────────────
  function selectAnswer(questionId: string, answer: any) {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
  }

  function toggleFlag(questionId: string) {
    setFlags(prev => ({ ...prev, [questionId]: !prev[questionId] }))
  }

  function toggleOption(questionId: string, optionId: string, questionType: string) {
    if (questionType === 'multiple_select') {
      const current = answers[questionId] || []
      const updated = current.includes(optionId)
        ? current.filter((id: string) => id !== optionId)
        : [...current, optionId]
      selectAnswer(questionId, updated)
    } else {
      selectAnswer(questionId, [optionId])
    }
  }

  async function handleSubmit() {
    if (!session || submitting) return
    setSubmitting(true)
    setShowConfirm(false)
    try {
      const res = await fetch(
        `/api/courses/${slug}/tests/${testId}/attempts/${session.attempt_id}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers }),
        }
      )
      const data = await res.json()
      setResult(data)
      setPhase('results')
    } catch {
      setError('Failed to submit test')
    }
    setSubmitting(false)
  }

  // ── Time formatting ─────────────────────────────────────────────────
  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const timerColor = timeRemaining !== null
    ? timeRemaining <= 60 ? 'text-red-500' : timeRemaining <= 300 ? 'text-amber-500' : 'text-[#6B635A]'
    : ''

  // ── Loading / Error ─────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#FAFAF8]">
        <div className="text-center p-6">
          <p className="text-[#6B635A] mb-4">{error}</p>
          <button onClick={() => router.back()} className="text-sm font-medium text-[#2C2825]">Go back</button>
        </div>
      </div>
    )
  }

  if (phase === 'loading' || !session) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#FAFAF8]">
        <div className="w-8 h-8 border-2 border-[#2C2825] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const questions = session.questions
  const answeredCount = Object.keys(answers).length
  const unansweredCount = questions.length - answeredCount

  // ── Results Phase ───────────────────────────────────────────────────
  if (phase === 'results' && result) {
    return (
      <div className="min-h-[100dvh] bg-[#FAFAF8]">
        <div className="max-w-[640px] mx-auto px-4 py-8">
          {/* Score hero */}
          <div className="text-center mb-8 animate-fade-up">
            <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 ${
              result.passed ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <span className={`text-3xl font-bold font-mono ${
                result.passed ? 'text-green-700' : 'text-red-700'
              }`}>
                {result.score_percent}%
              </span>
            </div>
            <div className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold mb-2 ${
              result.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {result.passed ? 'PASSED' : 'FAILED'}
            </div>
            <p className="text-sm text-[#6B635A]">
              {result.score}/{result.total_questions} correct &middot; {result.passing_score}% required
            </p>
            {result.time_spent_seconds != null && (
              <p className="text-xs text-[#A39B90] mt-1">
                Time: {formatTime(result.time_spent_seconds)}
                {session.time_limit_minutes && ` of ${session.time_limit_minutes}:00`}
              </p>
            )}
          </div>

          {/* Question review */}
          {result.show_full_results && result.questions && (
            <div className="space-y-3 mb-8">
              <h3 className="text-sm font-bold text-[#2C2825]">Question Review</h3>
              {result.questions.map((q: any, idx: number) => (
                <div key={q.question_id} className={`rounded-xl border p-4 ${
                  q.is_correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-start gap-2 mb-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      q.is_correct ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                    }`}>
                      {idx + 1}
                    </span>
                    <MathText text={q.question_text} className="text-sm text-[#2C2825] flex-1" />
                  </div>
                  {q.options && (
                    <div className="space-y-1 ml-8">
                      {q.options.map((opt: any) => {
                        const isSelected = Array.isArray(q.selected_answer)
                          ? q.selected_answer.includes(opt.id)
                          : q.selected_answer === opt.id
                        const isCorrect = q.correct_ids?.includes(opt.id)
                        return (
                          <div key={opt.id} className={`text-xs px-2 py-1 rounded ${
                            isCorrect ? 'bg-green-200 text-green-800 font-medium' :
                            isSelected ? 'bg-red-200 text-red-800' : 'text-[#6B635A]'
                          }`}>
                            {isSelected && !isCorrect && 'x '}{isCorrect && '> '}<MathText text={opt.text} />
                          </div>
                        )
                      })}
                    </div>
                  )}
                  {q.explanation && (
                    <MathText text={q.explanation} className="text-xs text-[#6B635A] mt-2 ml-8 italic" />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => {
                setPhase('loading')
                setResult(null)
                setAnswers({})
                setFlags({})
                setCurrentIdx(0)
                setSession(null)
                // Re-trigger start
                window.location.reload()
              }}
              className="w-full bg-[#2C2825] text-white font-semibold py-3 rounded-xl text-center"
            >
              Take Again
            </button>
            <button
              onClick={() => router.push(`/course/${slug}/path`)}
              className="w-full bg-white border border-[#E8E4DD] text-[#2C2825] font-semibold py-3 rounded-xl text-center"
            >
              Back to Course
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Review Phase ────────────────────────────────────────────────────
  if (phase === 'review') {
    return (
      <div className="min-h-[100dvh] bg-[#FAFAF8]">
        <div className="max-w-[640px] mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setPhase('test')} className="text-sm text-[#6B635A]">
              <svg className="w-5 h-5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Back
            </button>
            <h2 className="text-sm font-bold text-[#2C2825]">Review Answers</h2>
            {timeRemaining !== null && (
              <span className={`text-sm font-mono font-medium ${timerColor}`}>
                {formatTime(timeRemaining)}
              </span>
            )}
          </div>

          {/* Question grid */}
          <div className="grid grid-cols-5 gap-2 mb-8">
            {questions.map((q, idx) => {
              const isAnswered = answers[q.question_id] != null
              const isFlagged = flags[q.question_id]
              return (
                <button
                  key={q.question_id}
                  onClick={() => { setCurrentIdx(idx); setPhase('test') }}
                  className={`relative h-12 rounded-lg border text-sm font-bold flex items-center justify-center transition-colors ${
                    isAnswered
                      ? 'bg-[#2C2825] text-white border-[#2C2825]'
                      : 'bg-white text-[#6B635A] border-[#E8E4DD]'
                  }`}
                >
                  {idx + 1}
                  {isFlagged && (
                    <svg className="absolute top-1 right-1 w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 6v12h2V6l5 3 5-3v8l-5 3-5-3" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>

          {/* Summary */}
          <div className="rounded-xl bg-white border border-[#E8E4DD] p-4 mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[#6B635A]">Answered</span>
              <span className="font-medium text-[#2C2825]">{answeredCount}/{questions.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#6B635A]">Flagged</span>
              <span className="font-medium text-[#2C2825]">
                {Object.values(flags).filter(Boolean).length}
              </span>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={() => unansweredCount > 0 ? setShowConfirm(true) : handleSubmit()}
            disabled={submitting}
            className="w-full bg-[#2C2825] disabled:opacity-50 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Submitting...
              </>
            ) : 'Submit Test'}
          </button>

          {/* Confirm dialog */}
          {showConfirm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
                <h3 className="font-bold text-[#2C2825] mb-2">Submit test?</h3>
                <p className="text-sm text-[#6B635A] mb-4">
                  You have {unansweredCount} unanswered question{unansweredCount !== 1 ? 's' : ''}.
                  Unanswered questions will be marked incorrect.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 py-2 rounded-lg border border-[#E8E4DD] text-sm font-medium text-[#6B635A]"
                  >
                    Go Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="flex-1 py-2 rounded-lg bg-[#2C2825] text-white text-sm font-medium"
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Test Phase ──────────────────────────────────────────────────────
  const question = questions[currentIdx]
  const currentAnswer = answers[question.question_id]
  const isFlagged = flags[question.question_id]

  return (
    <div className="min-h-[100dvh] bg-[#FAFAF8] flex flex-col">
      {/* Top bar */}
      <div className="sticky top-0 bg-[#FAFAF8] border-b border-[#E8E4DD] z-10">
        <div className="max-w-[640px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-[#2C2825] truncate flex-1">
              {session.test_title}
            </h2>
            <div className="flex items-center gap-3 ml-3">
              <span className="text-xs text-[#6B635A] font-mono">
                {currentIdx + 1}/{questions.length}
              </span>
              {timeRemaining !== null && (
                <span className={`text-xs font-mono font-medium ${timerColor}`}>
                  {formatTime(timeRemaining)}
                </span>
              )}
              <button
                onClick={() => router.push(`/course/${slug}/path`)}
                className="text-[#A39B90] hover:text-[#6B635A]"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Progress segments */}
          <div className="flex gap-0.5">
            {questions.map((q, idx) => (
              <button
                key={q.question_id}
                onClick={() => setCurrentIdx(idx)}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  answers[q.question_id] != null
                    ? 'bg-[#2C2825]'
                    : idx === currentIdx
                      ? 'bg-[#A39B90]'
                      : 'bg-[#E8E4DD]'
                } ${flags[q.question_id] ? 'ring-1 ring-amber-400' : ''}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Question content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[640px] mx-auto px-4 py-6">
          {/* Flag button */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-[#A39B90] font-medium">
              Question {currentIdx + 1}
            </span>
            <button
              onClick={() => toggleFlag(question.question_id)}
              className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg transition-colors ${
                isFlagged ? 'bg-amber-100 text-amber-700' : 'bg-[#F5F3EF] text-[#A39B90]'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill={isFlagged ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18M3 3l9 5.5L3 14" />
              </svg>
              {isFlagged ? 'Flagged' : 'Flag'}
            </button>
          </div>

          {/* Question text */}
          <MathText text={question.question_text} className="text-base font-medium text-[#2C2825] mb-6 leading-relaxed block" />

          {/* Options */}
          {question.options && (
            <div className="space-y-2">
              {question.options.map(opt => {
                const isSelected = Array.isArray(currentAnswer)
                  ? currentAnswer.includes(opt.id)
                  : currentAnswer === opt.id
                return (
                  <button
                    key={opt.id}
                    onClick={() => toggleOption(question.question_id, opt.id, question.question_type)}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-blue-50 border-blue-300 text-[#2C2825]'
                        : 'bg-white border-[#E8E4DD] text-[#2C2825] hover:border-[#A39B90]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {question.question_type === 'multiple_select' ? (
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-blue-500 border-blue-500' : 'border-[#D4CFC7]'
                        }`}>
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          )}
                        </div>
                      ) : (
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'border-blue-500' : 'border-[#D4CFC7]'
                        }`}>
                          {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                        </div>
                      )}
                      <MathText text={opt.text} className="text-sm" />
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Fill blank */}
          {question.question_type === 'fill_blank' && (
            <input
              type="text"
              value={currentAnswer || ''}
              onChange={e => selectAnswer(question.question_id, e.target.value)}
              placeholder="Type your answer..."
              className="w-full px-4 py-3 rounded-xl border border-[#E8E4DD] bg-white text-[#2C2825] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          )}
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="sticky bottom-0 bg-[#FAFAF8] border-t border-[#E8E4DD]">
        <div className="max-w-[640px] mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => currentIdx > 0 && setCurrentIdx(currentIdx - 1)}
            disabled={currentIdx === 0}
            className="px-4 py-2 text-sm font-medium text-[#6B635A] bg-white border border-[#E8E4DD] rounded-lg disabled:opacity-30"
          >
            Previous
          </button>

          {currentIdx < questions.length - 1 ? (
            <button
              onClick={() => setCurrentIdx(currentIdx + 1)}
              className="px-6 py-2 text-sm font-medium text-white bg-[#2C2825] rounded-lg"
            >
              Next
            </button>
          ) : (
            <button
              onClick={() => setPhase('review')}
              className="px-6 py-2 text-sm font-medium text-white bg-[#2C2825] rounded-lg"
            >
              Review & Submit
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
