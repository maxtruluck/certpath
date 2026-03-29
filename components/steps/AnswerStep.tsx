'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { richMarkdownComponents } from '@/lib/markdown-components'
import { MathText } from '@/lib/math-text'
import type { Question, AnswerResult } from '@/lib/types/lesson-player'

const MAX_WRONG_ATTEMPTS = 2

interface AnswerStepProps {
  question: Question
  /** Called when step is complete (after correct answer or max attempts) */
  onComplete: (isCorrect: boolean) => void
  /** Read-only mode for back-navigation to already-answered questions */
  readOnly?: boolean
  previousResult?: AnswerResult | null
  previousSelectedIds?: string[]
}

export function AnswerStep({ question, onComplete, readOnly, previousResult, previousSelectedIds }: AnswerStepProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(previousSelectedIds || [])
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(previousResult || null)
  const [submitting, setSubmitting] = useState(false)
  const [wrongAttempts, setWrongAttempts] = useState(0)
  const [fillBlankAnswer, setFillBlankAnswer] = useState('')
  const [orderItems, setOrderItems] = useState<{ id: string; text: string }[]>(() => {
    if (question.question_type === 'ordering') {
      const shuffled = [...question.options]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      return shuffled
    }
    return []
  })
  const [matchSelections, setMatchSelections] = useState<Record<string, string>>(() => {
    if (question.question_type === 'matching' && question.matching_items) {
      const sel: Record<string, string> = {}
      for (const left of question.matching_items.lefts) sel[left] = ''
      return sel
    }
    return {}
  })
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F']

  const supportedTypes = ['multiple_choice', 'multiple_select', 'true_false', 'fill_blank', 'ordering', 'matching']
  const needsOptions = ['multiple_choice', 'multiple_select', 'true_false']
  const isUnsupported = !supportedTypes.includes(question.question_type)
    || (needsOptions.includes(question.question_type) && (!question.options || question.options.length === 0))

  const canSubmit = (() => {
    if (readOnly || answerResult) return false
    if (question.question_type === 'fill_blank') return fillBlankAnswer.trim().length > 0
    if (question.question_type === 'ordering') return orderItems.length > 0
    if (question.question_type === 'matching') return Object.values(matchSelections).every(v => v !== '')
    return selectedIds.length > 0
  })()

  const handleSubmitAnswer = useCallback(async () => {
    if (!canSubmit) return
    setSubmitting(true)

    try {
      let isCorrect = false

      if (question.question_type === 'fill_blank') {
        const acceptable = (question as any).acceptable_answers || question.correct_option_ids || []
        isCorrect = acceptable.some((a: string) => a.toLowerCase().trim() === fillBlankAnswer.toLowerCase().trim())
      } else if (question.question_type === 'ordering') {
        const correctOrder = (question as any).correct_order || question.correct_option_ids || []
        const userOrder = orderItems.map(i => i.id)
        isCorrect = correctOrder.length === userOrder.length && correctOrder.every((id: string, idx: number) => id === userOrder[idx])
      } else if (question.question_type === 'matching') {
        const pairs = (question as any).matching_pairs || []
        isCorrect = pairs.length > 0 && pairs.every((p: any) => (matchSelections[p.left] || '').toLowerCase() === p.right.toLowerCase())
      } else {
        // MC, MS, TF
        const correctIds = question.correct_option_ids || []
        isCorrect = correctIds.length === selectedIds.length && correctIds.every((id: string) => selectedIds.includes(id))
      }

      const result: AnswerResult = {
        is_correct: isCorrect,
        correct_option_ids: question.correct_option_ids || [],
        explanation: (question as any).explanation || '',
        option_explanation: isCorrect ? undefined : (question as any).option_explanations?.[selectedIds[0]] || undefined,
        acceptable_answers: (question as any).acceptable_answers,
        correct_order: (question as any).correct_order,
        matching_pairs: (question as any).matching_pairs,
      }

      setAnswerResult(result)
      if (!isCorrect) setWrongAttempts(prev => prev + 1)
    } catch (err) {
      console.error('Answer grading error:', err)
    }
    setSubmitting(false)
  }, [canSubmit, question, selectedIds, fillBlankAnswer, orderItems, matchSelections])

  function handleContinueOrRetry() {
    if (!answerResult) return

    if (answerResult.is_correct || wrongAttempts >= MAX_WRONG_ATTEMPTS) {
      // Step complete
      onComplete(answerResult.is_correct)
    } else {
      // Reset for retry
      setSelectedIds([])
      setAnswerResult(null)
      setFillBlankAnswer('')
      if (question.question_type === 'ordering') {
        const shuffled = [...question.options]
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }
        setOrderItems(shuffled)
      }
      if (question.question_type === 'matching' && question.matching_items) {
        const sel: Record<string, string> = {}
        for (const left of question.matching_items.lefts) sel[left] = ''
        setMatchSelections(sel)
      }
    }
  }

  function toggleOption(optionId: string) {
    if (answerResult || readOnly) return
    if (question.question_type === 'multiple_select') {
      setSelectedIds(prev => prev.includes(optionId) ? prev.filter(id => id !== optionId) : [...prev, optionId])
    } else {
      setSelectedIds([optionId])
    }
  }

  // Whether we should reveal correct answers (only after retries exhausted or correct)
  const retriesExhausted = wrongAttempts >= MAX_WRONG_ATTEMPTS
  const shouldReveal = readOnly || answerResult?.is_correct || retriesExhausted

  // If read-only, show the previous answer state
  const effectiveResult = readOnly ? (previousResult || answerResult) : answerResult

  // Auto-fire onComplete when answer is finalized (correct or retries exhausted)
  // This enables the parent's Next button immediately without requiring a Continue click
  const completedRef = useRef(false)
  useEffect(() => {
    if (readOnly) return // Don't fire onComplete in review mode
    if (shouldReveal && answerResult && !completedRef.current) {
      completedRef.current = true
      // Only award credit if correct on first attempt (no prior wrong answers)
      const earnedCredit = answerResult.is_correct && wrongAttempts === 0
      onComplete(earnedCredit)
    }
  }, [shouldReveal, answerResult, onComplete, readOnly, wrongAttempts])

  function getOptionState(optionId: string): 'default' | 'selected' | 'correct' | 'incorrect' {
    // In readOnly review mode, highlight correct answers from previousResult
    if (readOnly && effectiveResult) {
      if (effectiveResult.correct_option_ids?.includes(optionId)) return 'correct'
      return 'default'
    }
    if (!answerResult) return selectedIds.includes(optionId) ? 'selected' : 'default'
    if (shouldReveal) {
      if (answerResult.correct_option_ids?.includes(optionId)) return 'correct'
      if (selectedIds.includes(optionId) && !answerResult.correct_option_ids?.includes(optionId)) return 'incorrect'
    } else {
      // First wrong attempt: only mark selected options as incorrect, don't reveal correct
      if (selectedIds.includes(optionId)) return 'incorrect'
    }
    return 'default'
  }

  function handleOrderDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = orderItems.findIndex(i => i.id === active.id)
    const newIdx = orderItems.findIndex(i => i.id === over.id)
    const items = [...orderItems]
    const [moved] = items.splice(oldIdx, 1)
    items.splice(newIdx, 0, moved)
    setOrderItems(items)
  }

  function moveOrderItem(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= orderItems.length) return
    const items = [...orderItems]
    ;[items[index], items[target]] = [items[target], items[index]]
    setOrderItems(items)
  }

  return (
    <div className="pb-8">
      {/* Question text */}
      <div className="mb-6">
        <p className="text-base font-medium text-[#2C2825] leading-relaxed">
          {question.question_text.includes('$')
            ? <MathText text={question.question_text} />
            : question.question_text}
        </p>
        {question.question_type === 'multiple_select' && <p className="text-xs text-[#A39B90] mt-2">Select all that apply</p>}
        {question.question_type === 'fill_blank' && <p className="text-xs text-[#A39B90] mt-2">Type your answer</p>}
        {question.question_type === 'ordering' && <p className="text-xs text-[#A39B90] mt-2">Drag items into the correct order</p>}
        {question.question_type === 'matching' && <p className="text-xs text-[#A39B90] mt-2">Match each item on the left with the correct item on the right</p>}
      </div>

      {/* Unsupported question type fallback */}
      {isUnsupported && (
        <div className="rounded-2xl p-5 space-y-3 bg-[#F5F3EF] border border-[#E8E4DD]">
          <p className="text-sm font-medium text-[#6B635A]">This question type is not yet supported in the lesson player.</p>
          <p className="text-xs text-[#A39B90]">You can skip this step to continue.</p>
          {!readOnly && (
            <button
              onClick={() => onComplete(false)}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-colors bg-[#2C2825] text-[#F5F3EF] hover:bg-[#1A1816]"
            >
              Skip and continue
            </button>
          )}
        </div>
      )}

      {/* Fill Blank */}
      {question.question_type === 'fill_blank' && !effectiveResult && (
        <div className="mb-6">
          <input
            type="text"
            value={fillBlankAnswer}
            onChange={e => setFillBlankAnswer(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && canSubmit && handleSubmitAnswer()}
            placeholder="Type your answer..."
            className="w-full px-4 py-3 border border-[#E8E4DD] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2C2825]/20 focus:border-[#2C2825]"
            disabled={readOnly}
            autoFocus
          />
        </div>
      )}
      {question.question_type === 'fill_blank' && effectiveResult && (
        <div className="mb-6">
          {readOnly ? (
            // Review mode: show the correct answer
            <div className="px-4 py-3 rounded-xl border-2 border-green-400 bg-green-50 text-sm font-medium text-green-700">
              {effectiveResult.acceptable_answers?.[0] || '(answer)'}
            </div>
          ) : (
            <>
              <div className={`px-4 py-3 rounded-xl border-2 text-sm font-medium ${effectiveResult.is_correct ? 'border-green-400 bg-green-50 text-green-700' : 'border-red-400 bg-red-50 text-red-700'}`}>
                {fillBlankAnswer || '(empty)'}
              </div>
              {!effectiveResult.is_correct && shouldReveal && effectiveResult.acceptable_answers && (
                <p className="text-xs text-[#6B635A] mt-2">Correct answer: <span className="font-semibold">{effectiveResult.acceptable_answers[0]}</span></p>
              )}
            </>
          )}
        </div>
      )}

      {/* Ordering */}
      {question.question_type === 'ordering' && !effectiveResult && (
        <div className="mb-6">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleOrderDragEnd}>
            <SortableContext items={orderItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {orderItems.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-1">
                    <div className="flex-1">
                      <SortableOrderItem id={item.id} text={item.text} index={idx} />
                    </div>
                    <div className="flex flex-col">
                      <button onClick={() => moveOrderItem(idx, -1)} disabled={idx === 0} className="text-[#D4CFC7] hover:text-[#6B635A] disabled:opacity-30 text-xs px-1">&#9650;</button>
                      <button onClick={() => moveOrderItem(idx, 1)} disabled={idx === orderItems.length - 1} className="text-[#D4CFC7] hover:text-[#6B635A] disabled:opacity-30 text-xs px-1">&#9660;</button>
                    </div>
                  </div>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
      {question.question_type === 'ordering' && effectiveResult && (
        <div className="mb-6 space-y-2">
          {readOnly ? (
            // Review mode: show correct order from question options mapped by correct_order IDs
            (effectiveResult.correct_order || []).map((id: string, idx: number) => {
              const item = question.options.find(o => o.id === id)
              return (
                <div key={id} className="flex items-center gap-3 p-3 rounded-xl border-2 border-green-400 bg-green-50">
                  <span className="text-sm font-medium text-[#6B635A] w-5">{idx + 1}.</span>
                  <span className="text-sm text-[#2C2825] flex-1">{item ? (item.text.includes('$') ? <MathText text={item.text} /> : item.text) : id}</span>
                </div>
              )
            })
          ) : (
            orderItems.map((item, idx) => {
              const isCorrectPosition = effectiveResult.correct_order && effectiveResult.correct_order[idx] === item.id
              const showPositionFeedback = shouldReveal
              return (
                <div key={item.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 ${
                  showPositionFeedback
                    ? (isCorrectPosition ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50')
                    : 'border-red-200 bg-red-50/50'
                }`}>
                  <span className="text-sm font-medium text-[#6B635A] w-5">{idx + 1}.</span>
                  <span className="text-sm text-[#2C2825] flex-1">{item.text.includes('$') ? <MathText text={item.text} /> : item.text}</span>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Matching */}
      {question.question_type === 'matching' && question.matching_items && !effectiveResult && (
        <div className="mb-6 space-y-3">
          {question.matching_items.lefts.map(left => (
            <div key={left} className="flex items-center gap-3">
              <span className="text-sm font-medium text-[#2C2825] w-1/3 truncate">{left}</span>
              <select
                value={matchSelections[left] || ''}
                onChange={e => setMatchSelections(prev => ({ ...prev, [left]: e.target.value }))}
                disabled={readOnly}
                className="flex-1 text-sm border border-[#E8E4DD] rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#2C2825]/20 focus:border-[#2C2825]"
              >
                <option value="">Select...</option>
                {question.matching_items!.rights.map((right, idx) => (
                  <option key={`${right}-${idx}`} value={right}>{right}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
      {question.question_type === 'matching' && effectiveResult && effectiveResult.matching_pairs && (
        <div className="mb-6 space-y-2">
          {readOnly ? (
            // Review mode: show correct pairs
            effectiveResult.matching_pairs!.map((pair: { left: string; right: string }) => (
              <div key={pair.left} className="p-3 rounded-xl border-2 border-green-400 bg-green-50">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-[#2C2825]">{pair.left}</span>
                  <span className="text-xs text-[#A39B90]">&rarr;</span>
                  <span className="text-sm text-[#2C2825]">{pair.right}</span>
                </div>
              </div>
            ))
          ) : (
            question.matching_items!.lefts.map(left => {
              const userRight = matchSelections[left] || ''
              const correctRight = effectiveResult.matching_pairs!.find(p => p.left === left)?.right
              const isCorrectPair = userRight.toLowerCase() === correctRight?.toLowerCase()
              return (
                <div key={left} className={`p-3 rounded-xl border-2 ${
                  shouldReveal
                    ? (isCorrectPair ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50')
                    : 'border-red-200 bg-red-50/50'
                }`}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-[#2C2825]">{left}</span>
                    <span className="text-xs text-[#A39B90]">&rarr;</span>
                    <span className={`text-sm ${isCorrectPair ? 'text-[#2C2825]' : 'text-red-600 line-through'}`}>{userRight || '(no answer)'}</span>
                  </div>
                  {shouldReveal && !isCorrectPair && (
                    <div className="mt-1 flex items-center gap-1">
                      <span className="text-xs text-[#A39B90]">Correct:</span>
                      <span className="text-xs font-medium text-green-700">{correctRight}</span>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* MC / MS / TF options */}
      {['multiple_choice', 'multiple_select', 'true_false'].includes(question.question_type) && (
        <div className="space-y-2.5 mb-6">
          {question.options.map((option, idx) => {
            const state = getOptionState(option.id)
            let borderClass = 'border-[#E8E4DD] hover:border-[#D4CFC7]'
            let bgClass = 'bg-white'
            let textClass = 'text-[#2C2825]'
            if (state === 'selected') { borderClass = 'border-[#2C2825] shadow-sm'; bgClass = 'bg-[#F5F3EF]' }
            else if (state === 'correct') { borderClass = 'border-green-400'; bgClass = 'bg-green-50' }
            else if (state === 'incorrect') { borderClass = 'border-red-400'; bgClass = 'bg-red-50' }
            if (effectiveResult && state === 'default') textClass = 'text-[#A39B90]'

            return (
              <button
                key={option.id}
                onClick={() => toggleOption(option.id)}
                disabled={!!effectiveResult || readOnly}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all ${borderClass} ${bgClass} disabled:cursor-default`}
              >
                <span className="text-sm font-medium text-[#6B635A] flex-shrink-0">{optionLabels[idx]}.</span>
                <span className={`text-sm text-left ${textClass}`}>
                  {option.text.includes('$') ? <MathText text={option.text} /> : option.text}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Check button */}
      {!effectiveResult && !readOnly && !isUnsupported && (
        <button
          onClick={handleSubmitAnswer}
          disabled={!canSubmit || submitting}
          className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wide uppercase transition-all duration-200 ${
            canSubmit
              ? 'bg-[#2C2825] text-[#F5F3EF] hover:bg-[#1A1816] shadow-sm transform hover:scale-[1.01]'
              : 'bg-[#EBE8E2] text-[#A39B90] cursor-not-allowed'
          }`}
        >
          {submitting ? 'Checking...' : 'Check Answer'}
        </button>
      )}

      {/* Feedback panel */}
      {effectiveResult && (
        <div className={`rounded-2xl p-5 space-y-3 ${readOnly ? '' : 'animate-slide-up'} ${effectiveResult.is_correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <h3 className={`font-bold text-lg ${effectiveResult.is_correct ? 'text-green-700' : 'text-red-700'}`}>
            {readOnly
              ? (effectiveResult.is_correct ? 'You got this right' : 'Review the correct answer above')
              : (effectiveResult.is_correct ? 'Correct!' : shouldReveal ? 'Answer Revealed' : 'Not quite')}
          </h3>

          {/* Only show per-option explanation after retries exhausted */}
          {!readOnly && !effectiveResult.is_correct && shouldReveal && effectiveResult.option_explanation && (
            <div className="bg-red-100/50 rounded-lg p-3 text-sm text-red-800">
              <p className="font-medium mb-1">Why your answer is wrong:</p>
              <p>{effectiveResult.option_explanation}</p>
            </div>
          )}

          {/* Show full explanation on correct or retries exhausted, or in review mode */}
          {shouldReveal && effectiveResult.explanation && (
            <div className="text-sm text-[#6B635A] leading-relaxed">
              <p>{effectiveResult.explanation.includes('$')
                ? <MathText text={effectiveResult.explanation} />
                : effectiveResult.explanation}</p>
            </div>
          )}

          {/* First wrong: just a hint to try again */}
          {!readOnly && !effectiveResult.is_correct && !shouldReveal && (
            <p className="text-sm text-red-600">Give it another try.</p>
          )}

          {/* Show Try Again only on first wrong attempt (before retries exhausted) */}
          {!readOnly && !effectiveResult.is_correct && !shouldReveal && (
            <button
              onClick={handleContinueOrRetry}
              className="w-full py-3 rounded-xl font-semibold transition-colors bg-white border border-[#E8E4DD] text-[#2C2825] hover:bg-[#F5F3EF]"
            >
              Try Again
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Sortable Order Item ──────────────────────────────────────
function SortableOrderItem({ id, text, index }: { id: string; text: string; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[#E8E4DD]">
      <button {...attributes} {...listeners} className="text-[#D4CFC7] hover:text-[#6B635A] cursor-grab active:cursor-grabbing">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <circle cx="5" cy="3" r="1" /><circle cx="9" cy="3" r="1" />
          <circle cx="5" cy="7" r="1" /><circle cx="9" cy="7" r="1" />
          <circle cx="5" cy="11" r="1" /><circle cx="9" cy="11" r="1" />
        </svg>
      </button>
      <span className="text-sm font-medium text-[#6B635A] w-5">{index + 1}.</span>
      <span className="text-sm text-[#2C2825] flex-1">{text.includes('$') ? <MathText text={text} /> : text}</span>
    </div>
  )
}
