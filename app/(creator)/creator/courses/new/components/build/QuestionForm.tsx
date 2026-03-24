'use client'

import { useState, useEffect } from 'react'
import CreatorTip from '../CreatorTip'

// ─── Types ──────────────────────────────────────────────────────
export interface AnswerStepContent {
  question_text: string
  question_type: string
  options: { id: string; text: string }[]
  correct_ids: string[]
  explanation: string
  option_explanations: Record<string, string>
  acceptable_answers: string[] | null
  match_mode: string
  correct_order: string[] | null
  matching_pairs: { left: string; right: string }[] | null
}

const QUESTION_TYPES = [
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'multiple_select', label: 'Multi Select' },
  { value: 'true_false', label: 'True / False' },
  { value: 'fill_blank', label: 'Fill Blank' },
  { value: 'ordering', label: 'Ordering' },
  { value: 'matching', label: 'Matching' },
]

// ─── Controlled Edit Mode Props ─────────────────────────────────
interface EditModeProps {
  mode: 'edit'
  value: AnswerStepContent
  onChange: (content: AnswerStepContent) => void
}

// ─── Create Mode Props (original behavior) ──────────────────────
interface CreateModeProps {
  mode: 'create'
  courseId: string
  lessonId: string
  onCreated: (q: any) => void
}

type QuestionFormProps = EditModeProps | CreateModeProps

export default function QuestionForm(props: QuestionFormProps) {
  const isEdit = props.mode === 'edit'

  const [questionText, setQuestionText] = useState(isEdit ? props.value.question_text : '')
  const [questionType, setQuestionType] = useState(isEdit ? props.value.question_type : 'multiple_choice')
  const [options, setOptions] = useState<{ id: string; text: string }[]>(
    isEdit ? props.value.options : [
      { id: 'a', text: '' }, { id: 'b', text: '' }, { id: 'c', text: '' }, { id: 'd', text: '' },
    ]
  )
  const [correctIds, setCorrectIds] = useState<string[]>(isEdit ? props.value.correct_ids : [])
  const [explanation, setExplanation] = useState(isEdit ? props.value.explanation : '')
  const [saving, setSaving] = useState(false)
  const [optionExplanations, setOptionExplanations] = useState<Record<string, string>>(
    isEdit ? (props.value.option_explanations || {}) : {}
  )
  const [showOptExpl, setShowOptExpl] = useState<Set<string>>(new Set())
  const [acceptableAnswers, setAcceptableAnswers] = useState<string[]>(
    isEdit ? (props.value.acceptable_answers || ['']) : ['']
  )
  const [matchMode, setMatchMode] = useState(isEdit ? props.value.match_mode : 'exact')
  const [correctOrder, setCorrectOrder] = useState<string[]>(
    isEdit ? (props.value.correct_order || []) : []
  )
  const [matchingPairs, setMatchingPairs] = useState<{ left: string; right: string }[]>(
    isEdit ? (props.value.matching_pairs || [{ left: '', right: '' }, { left: '', right: '' }, { left: '', right: '' }]) : [
      { left: '', right: '' }, { left: '', right: '' }, { left: '', right: '' },
    ]
  )
  const [dismissedTips, setDismissedTips] = useState<Set<string>>(new Set())

  // Emit changes in edit mode
  useEffect(() => {
    if (!isEdit) return
    const content: AnswerStepContent = {
      question_text: questionText,
      question_type: questionType,
      options,
      correct_ids: correctIds,
      explanation,
      option_explanations: optionExplanations,
      acceptable_answers: questionType === 'fill_blank' ? acceptableAnswers.filter(a => a.trim()) : null,
      match_mode: matchMode,
      correct_order: questionType === 'ordering' ? correctOrder : null,
      matching_pairs: questionType === 'matching' ? matchingPairs.filter(p => p.left.trim() && p.right.trim()) : null,
    }
    props.onChange(content)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionText, questionType, options, correctIds, explanation, optionExplanations, acceptableAnswers, matchMode, correctOrder, matchingPairs])

  useEffect(() => {
    if (questionType === 'true_false') {
      setOptions([{ id: 'a', text: 'True' }, { id: 'b', text: 'False' }])
      setCorrectIds([])
    } else if (['multiple_choice', 'multiple_select'].includes(questionType) && options.length < 3) {
      setOptions([{ id: 'a', text: '' }, { id: 'b', text: '' }, { id: 'c', text: '' }, { id: 'd', text: '' }])
    }
    setOptionExplanations({})
    setShowOptExpl(new Set())
  }, [questionType]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (questionType === 'ordering') {
      setCorrectOrder(options.map(o => o.id))
    }
  }, [options.length, questionType])

  const toggleCorrect = (id: string) => {
    if (questionType === 'multiple_choice' || questionType === 'true_false') {
      setCorrectIds([id])
    } else {
      setCorrectIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    }
  }

  const addOption = () => {
    const nextLetter = String.fromCharCode(97 + options.length)
    if (options.length < 6) setOptions(prev => [...prev, { id: nextLetter, text: '' }])
  }

  const removeOption = (id: string) => {
    if (options.length > 2) {
      setOptions(prev => prev.filter(o => o.id !== id))
      setCorrectIds(prev => prev.filter(x => x !== id))
    }
  }

  const moveOrderItem = (index: number, direction: -1 | 1) => {
    const newOrder = [...correctOrder]
    const target = index + direction
    if (target < 0 || target >= newOrder.length) return
    ;[newOrder[index], newOrder[target]] = [newOrder[target], newOrder[index]]
    setCorrectOrder(newOrder)
  }

  const canSave = () => {
    if (!questionText.trim()) return false
    if (questionType === 'fill_blank') return acceptableAnswers.some(a => a.trim())
    if (questionType === 'ordering') return options.length >= 3 && options.every(o => o.text.trim())
    if (questionType === 'matching') return matchingPairs.length >= 3 && matchingPairs.every(p => p.left.trim() && p.right.trim())
    return correctIds.length > 0
  }

  const handleSave = async () => {
    if (isEdit || !canSave()) return
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        question_text: questionText.trim(),
        question_type: questionType,
        explanation: explanation.trim(),
        difficulty: 3,
        tags: [],
        lesson_id: props.lessonId,
      }

      if (['multiple_choice', 'multiple_select', 'true_false'].includes(questionType)) {
        body.options = options.filter(o => o.text.trim())
        body.correct_option_ids = correctIds
        const expls = Object.fromEntries(Object.entries(optionExplanations).filter(([, v]) => v.trim()))
        if (Object.keys(expls).length > 0) body.option_explanations = expls
      } else if (questionType === 'fill_blank') {
        body.acceptable_answers = acceptableAnswers.filter(a => a.trim())
        body.match_mode = matchMode
      } else if (questionType === 'ordering') {
        body.options = options.filter(o => o.text.trim())
        body.correct_order = correctOrder
      } else if (questionType === 'matching') {
        body.matching_pairs = matchingPairs.filter(p => p.left.trim() && p.right.trim())
      }

      const res = await fetch(`/api/creator/courses/${props.courseId}/lessons/${props.lessonId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const q = await res.json()
      if (q.id) {
        props.onCreated(q)
        setQuestionText('')
        setCorrectIds([])
        setExplanation('')
        setOptionExplanations({})
        setAcceptableAnswers([''])
        setMatchingPairs([{ left: '', right: '' }, { left: '', right: '' }, { left: '', right: '' }])
        if (!['true_false', 'ordering'].includes(questionType)) {
          setOptions([{ id: 'a', text: '' }, { id: 'b', text: '' }, { id: 'c', text: '' }, { id: 'd', text: '' }])
        }
      }
    } catch (err) {
      console.error('Failed to save question:', err)
    }
    setSaving(false)
  }

  const showOptions = ['multiple_choice', 'multiple_select', 'true_false', 'ordering'].includes(questionType)

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      {!isEdit && <h4 className="text-sm font-semibold text-gray-900">Add Question</h4>}

      <textarea
        value={questionText}
        onChange={e => setQuestionText(e.target.value)}
        placeholder={questionType === 'fill_blank' ? 'Enter question (use ___ for the blank)...' : 'Enter your question...'}
        rows={3}
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
      />

      <div className="flex flex-wrap gap-1.5">
        {QUESTION_TYPES.map(type => (
          <button
            key={type.value}
            onClick={() => setQuestionType(type.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              questionType === type.value
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      <CreatorTip tipKey={`question_${questionType}`} dismissedTips={dismissedTips} onDismiss={(key) => setDismissedTips(prev => new Set([...prev, key]))} />

      {showOptions && (
        <div className="space-y-2">
          {options.map((opt) => (
            <div key={opt.id}>
              <div className="flex items-center gap-2">
                {questionType !== 'ordering' && (
                  <button
                    onClick={() => toggleCorrect(opt.id)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      correctIds.includes(opt.id) ? 'border-green-500 bg-green-50' : 'border-gray-200'
                    }`}
                  >
                    {correctIds.includes(opt.id) && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6L5 9L10 3" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                )}
                <span className="text-xs font-semibold text-gray-400 w-4">{opt.id.toUpperCase()}</span>
                <input
                  type="text"
                  value={opt.text}
                  onChange={e => setOptions(prev => prev.map(o => o.id === opt.id ? { ...o, text: e.target.value } : o))}
                  placeholder={`Option ${opt.id.toUpperCase()}`}
                  disabled={questionType === 'true_false'}
                  className="flex-1 text-sm border border-gray-200 rounded px-2 py-1.5 disabled:bg-gray-50"
                />
                {questionType !== 'true_false' && options.length > 2 && (
                  <button onClick={() => removeOption(opt.id)} className="text-gray-300 hover:text-red-500 text-xs">x</button>
                )}
              </div>
              {['multiple_choice', 'multiple_select', 'true_false'].includes(questionType) && !correctIds.includes(opt.id) && opt.text.trim() && (
                <div className="ml-10 mt-1">
                  {showOptExpl.has(opt.id) ? (
                    <textarea
                      value={optionExplanations[opt.id] || ''}
                      onChange={e => setOptionExplanations(prev => ({ ...prev, [opt.id]: e.target.value }))}
                      placeholder="Explain why this is wrong (shown when learner picks this)..."
                      rows={2}
                      className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 resize-none"
                    />
                  ) : (
                    <button
                      onClick={() => setShowOptExpl(prev => new Set([...prev, opt.id]))}
                      className="text-[11px] text-blue-500 hover:text-blue-700"
                    >
                      + Add explanation
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
          {!['true_false', 'ordering'].includes(questionType) && options.length < 6 && (
            <button onClick={addOption} className="text-xs text-blue-500 hover:text-blue-700">+ Add Option</button>
          )}
          {questionType === 'ordering' && options.length < 6 && (
            <button onClick={addOption} className="text-xs text-blue-500 hover:text-blue-700">+ Add Item</button>
          )}
        </div>
      )}

      {questionType === 'ordering' && options.some(o => o.text.trim()) && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Correct order (use arrows):</p>
          <div className="space-y-1 bg-gray-50 rounded-lg p-2">
            {correctOrder.map((optId, idx) => {
              const opt = options.find(o => o.id === optId)
              return (
                <div key={optId} className="flex items-center gap-2 bg-white rounded px-2 py-1 border border-gray-200">
                  <span className="text-xs text-gray-400 w-4">{idx + 1}.</span>
                  <span className="text-sm text-gray-700 flex-1">{opt?.text || optId}</span>
                  <button onClick={() => moveOrderItem(idx, -1)} disabled={idx === 0} className="text-gray-300 hover:text-gray-600 disabled:opacity-30 text-xs">&#9650;</button>
                  <button onClick={() => moveOrderItem(idx, 1)} disabled={idx === correctOrder.length - 1} className="text-gray-300 hover:text-gray-600 disabled:opacity-30 text-xs">&#9660;</button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {questionType === 'fill_blank' && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Acceptable answers (case-insensitive):</p>
          <div className="space-y-1">
            {acceptableAnswers.map((ans, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={ans}
                  onChange={e => setAcceptableAnswers(prev => prev.map((a, i) => i === idx ? e.target.value : a))}
                  placeholder={`Answer ${idx + 1}`}
                  className="flex-1 text-sm border border-gray-200 rounded px-2 py-1.5"
                />
                {acceptableAnswers.length > 1 && (
                  <button onClick={() => setAcceptableAnswers(prev => prev.filter((_, i) => i !== idx))} className="text-gray-300 hover:text-red-500 text-xs">x</button>
                )}
              </div>
            ))}
            <button onClick={() => setAcceptableAnswers(prev => [...prev, ''])} className="text-xs text-blue-500 hover:text-blue-700">+ Add answer</button>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <label className="flex items-center gap-1.5 text-xs">
              <input type="radio" checked={matchMode === 'exact'} onChange={() => setMatchMode('exact')} className="text-blue-500" />
              Exact match
            </label>
            <label className="flex items-center gap-1.5 text-xs">
              <input type="radio" checked={matchMode === 'contains'} onChange={() => setMatchMode('contains')} className="text-blue-500" />
              Contains
            </label>
          </div>
        </div>
      )}

      {questionType === 'matching' && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Matching pairs:</p>
          <div className="space-y-1">
            {matchingPairs.map((pair, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input type="text" value={pair.left} onChange={e => setMatchingPairs(prev => prev.map((p, i) => i === idx ? { ...p, left: e.target.value } : p))} placeholder="Left item" className="flex-1 text-sm border border-gray-200 rounded px-2 py-1.5" />
                <span className="text-xs text-gray-400">&#8596;</span>
                <input type="text" value={pair.right} onChange={e => setMatchingPairs(prev => prev.map((p, i) => i === idx ? { ...p, right: e.target.value } : p))} placeholder="Right item" className="flex-1 text-sm border border-gray-200 rounded px-2 py-1.5" />
                {matchingPairs.length > 3 && (
                  <button onClick={() => setMatchingPairs(prev => prev.filter((_, i) => i !== idx))} className="text-gray-300 hover:text-red-500 text-xs">x</button>
                )}
              </div>
            ))}
            {matchingPairs.length < 6 && (
              <button onClick={() => setMatchingPairs(prev => [...prev, { left: '', right: '' }])} className="text-xs text-blue-500 hover:text-blue-700">+ Add pair</button>
            )}
          </div>
        </div>
      )}

      <textarea
        value={explanation}
        onChange={e => setExplanation(e.target.value)}
        placeholder="Explanation (shown after answering)..."
        rows={2}
        className="w-full text-sm border border-gray-200 rounded px-3 py-2 resize-none"
      />


      {!isEdit && (
        <button
          onClick={handleSave}
          disabled={!canSave() || saving}
          className="btn-primary px-4 py-2 text-sm disabled:opacity-50 w-full"
        >
          {saving ? 'Saving...' : 'Add Question'}
        </button>
      )}
    </div>
  )
}
