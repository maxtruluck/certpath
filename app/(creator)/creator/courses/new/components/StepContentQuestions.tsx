'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { COURSE_FORMATS, type CourseFormat } from '../lib/course-formats'
import { BLOOMS_LEVELS, suggestBloomsLevel, type BloomsLevel } from '../lib/blooms'
import CreatorTip from './CreatorTip'

// ─── Types ───────────────────────────────────────────────────────
interface Lesson {
  id: string
  title: string
  body: string
  display_order: number
  is_active?: boolean
  question_count?: number
}

interface Assessment {
  id: string
  title: string
  assessment_type: 'topic_quiz' | 'module_test' | 'practice_exam'
  module_id?: string | null
  topic_id?: string | null
  question_count: number
  time_limit_minutes?: number | null
  passing_score_percent: number
  shuffle_questions: boolean
  show_explanations: boolean
}

interface Topic {
  id: string
  title: string
  module_id: string
  question_count: number
  lesson_count?: number
  lessons?: Lesson[]
}

interface Module {
  id: string
  title: string
  topics: Topic[]
}

interface Question {
  id: string
  question_text: string
  question_type: string
  options: { id: string; text: string }[]
  correct_option_ids: string[]
  explanation: string
  difficulty: number
  tags: string[]
  option_explanations?: Record<string, string> | null
  acceptable_answers?: string[] | null
  match_mode?: string
  correct_order?: string[] | null
  matching_pairs?: { left: string; right: string }[] | null
  blooms_level?: string
  lesson_id?: string | null
}

// Sidebar selection types
type SidebarSelection =
  | { type: 'lesson'; topicId: string; lessonId: string }
  | { type: 'assessment'; assessmentId: string }
  | { type: 'topic'; topicId: string } // legacy fallback for topics without lessons

const QUESTION_TYPES = [
  { value: 'multiple_choice', label: 'MC' },
  { value: 'multiple_select', label: 'MS' },
  { value: 'true_false', label: 'T/F' },
  { value: 'fill_blank', label: 'Fill Blank' },
  { value: 'ordering', label: 'Ordering' },
  { value: 'matching', label: 'Matching' },
]

const TYPE_LABELS: Record<string, string> = {
  multiple_choice: 'MC', multiple_select: 'MS', true_false: 'T/F',
  fill_blank: 'FB', ordering: 'ORD', matching: 'MATCH',
}

// ─── Topic Completeness Helpers ──────────────────────────────────
type TopicStatus = 'empty' | 'needs_content' | 'needs_questions' | 'partial' | 'complete'

function getTopicStatus(topic: Topic, guidance?: { questionsPerTopic: { recommended: number }; contentBlocksPerTopic: { recommended: number } }): TopicStatus {
  const lessonCount = topic.lesson_count || 0
  const qCount = topic.question_count

  if (lessonCount === 0 && qCount === 0) return 'empty'
  if (qCount > 0 && lessonCount === 0) return 'needs_content'
  if (lessonCount > 0 && qCount === 0) return 'needs_questions'

  const qTarget = guidance?.questionsPerTopic.recommended || 10
  if (qCount >= qTarget && lessonCount >= 1) return 'complete'
  return 'partial'
}

function TopicStatusChip({ status, topic }: { status: TopicStatus; topic: Topic }) {
  const lessonCount = topic.lesson_count || 0
  const qCount = topic.question_count
  const parts = []
  if (lessonCount > 0) parts.push(`${lessonCount} lesson${lessonCount !== 1 ? 's' : ''}`)
  if (qCount > 0) parts.push(`${qCount} question${qCount !== 1 ? 's' : ''}`)

  switch (status) {
    case 'complete':
      return <span className="text-[11px] text-green-600">{parts.join(', ')}</span>
    case 'needs_content':
      return <span className="text-[11px] text-amber-600">needs lessons</span>
    case 'needs_questions':
      return <span className="text-[11px] text-blue-600">{parts.join(', ')}</span>
    case 'partial':
      return <span className="text-[11px] text-gray-500">{parts.join(', ')}</span>
    case 'empty':
    default:
      return <span className="text-[11px] text-gray-400">empty</span>
  }
}

// ─── Topic Completeness Bar ──────────────────────────────────────
function TopicCompletenessBar({
  topic,
  questions,
  courseFormat,
}: {
  topic: Topic
  questions: Question[]
  courseFormat?: CourseFormat
}) {
  const guidance = courseFormat ? COURSE_FORMATS[courseFormat]?.guidance : null
  const qTarget = guidance?.questionsPerTopic.recommended || 10
  const lessonCount = topic.lesson_count || 0

  // Bloom's summary
  const bloomsCounts: Record<string, number> = { remember: 0, understand: 0, apply: 0, analyze: 0 }
  for (const q of questions) {
    const level = q.blooms_level || 'remember'
    bloomsCounts[level] = (bloomsCounts[level] || 0) + 1
  }
  const totalQ = questions.length

  return (
    <div className="bg-gray-50 rounded-lg px-3 py-2 mb-4 space-y-1.5">
      <div className="flex items-center gap-4 text-xs text-gray-600">
        <span>Lessons: <span className="font-semibold">{lessonCount}</span> <span className="text-gray-400">(aim for 1+)</span></span>
        <span>Questions: <span className="font-semibold">{topic.question_count}</span> <span className="text-gray-400">(aim for {qTarget}+)</span></span>
      </div>
      {totalQ > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400">Bloom&apos;s:</span>
          {BLOOMS_LEVELS.map(level => {
            const count = bloomsCounts[level.value] || 0
            if (count === 0) return null
            return (
              <span key={level.value} className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${level.bgColor} ${level.color}`}>
                {level.label[0]} {count}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Question Form (All 6 Types + Bloom's) ───────────────────────
function QuestionForm({
  courseId,
  topicId,
  onCreated,
  courseFormat,
  dismissedTips,
  onDismissTip,
  lessonId,
}: {
  courseId: string
  topicId: string
  onCreated: (q: Question) => void
  courseFormat?: CourseFormat
  dismissedTips: Set<string>
  onDismissTip: (key: string) => void
  lessonId?: string | null
}) {
  const [questionText, setQuestionText] = useState('')
  const [questionType, setQuestionType] = useState('multiple_choice')
  const [options, setOptions] = useState<{ id: string; text: string }[]>([
    { id: 'a', text: '' }, { id: 'b', text: '' }, { id: 'c', text: '' }, { id: 'd', text: '' },
  ])
  const [correctIds, setCorrectIds] = useState<string[]>([])
  const [explanation, setExplanation] = useState('')
  const [difficulty, setDifficulty] = useState(3)
  const [tags, setTags] = useState('')
  const [saving, setSaving] = useState(false)

  // Bloom's level
  const [bloomsLevel, setBloomsLevel] = useState<BloomsLevel>('remember')
  const bloomsManual = useRef(false)

  // New type-specific fields
  const [optionExplanations, setOptionExplanations] = useState<Record<string, string>>({})
  const [showOptExpl, setShowOptExpl] = useState<Set<string>>(new Set())
  const [acceptableAnswers, setAcceptableAnswers] = useState<string[]>([''])
  const [matchMode, setMatchMode] = useState('exact')
  const [correctOrder, setCorrectOrder] = useState<string[]>([])
  const [matchingPairs, setMatchingPairs] = useState<{ left: string; right: string }[]>([
    { left: '', right: '' }, { left: '', right: '' }, { left: '', right: '' },
  ])
  // Auto-suggest Bloom's level (debounced)
  useEffect(() => {
    if (bloomsManual.current) return
    const timer = setTimeout(() => {
      if (questionText.trim().length > 10) {
        setBloomsLevel(suggestBloomsLevel(questionText))
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [questionText])

  // Reset type-specific state when type changes
  useEffect(() => {
    if (questionType === 'true_false') {
      setOptions([{ id: 'a', text: 'True' }, { id: 'b', text: 'False' }])
      setCorrectIds([])
    } else if (['multiple_choice', 'multiple_select'].includes(questionType) && options.length < 3) {
      setOptions([{ id: 'a', text: '' }, { id: 'b', text: '' }, { id: 'c', text: '' }, { id: 'd', text: '' }])
    }
    setOptionExplanations({})
    setShowOptExpl(new Set())
  }, [questionType])

  // Sync correct_order when options change for ordering type
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
    if (!canSave()) return
    setSaving(true)
    try {
      const body: any = {
        question_text: questionText.trim(),
        question_type: questionType,
        explanation: explanation.trim(),
        difficulty,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        blooms_level: bloomsLevel,
        lesson_id: lessonId || null,
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

      const res = await fetch(`/api/creator/courses/${courseId}/topics/${topicId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const q = await res.json()
      if (q.id) {
        onCreated(q)
        setQuestionText('')
        setCorrectIds([])
        setExplanation('')
        setDifficulty(3)
        setTags('')
        setOptionExplanations({})
        setAcceptableAnswers([''])
        setMatchingPairs([{ left: '', right: '' }, { left: '', right: '' }, { left: '', right: '' }])
        setBloomsLevel('remember')
        bloomsManual.current = false
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
      <h4 className="text-sm font-semibold text-gray-900">Add Question</h4>

      <textarea
        value={questionText}
        onChange={e => setQuestionText(e.target.value)}
        placeholder={questionType === 'fill_blank' ? 'Enter question (use ___ for the blank)...' : 'Enter your question...'}
        rows={3}
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
      />

      {/* Bloom's level pills */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-gray-400 mr-1">Bloom&apos;s:</span>
        {BLOOMS_LEVELS.map(level => (
          <button
            key={level.value}
            onClick={() => { setBloomsLevel(level.value); bloomsManual.current = true }}
            title={level.hint}
            className={`px-2 py-1 text-[11px] font-medium rounded border transition-colors ${
              bloomsLevel === level.value
                ? `${level.bgColor} ${level.color}`
                : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
            }`}
          >
            {level.label}
          </button>
        ))}
      </div>

      {/* Type selector — 2 rows of 3 pill buttons */}
      <div className="space-y-1.5">
        <div className="flex gap-1.5">
          {QUESTION_TYPES.slice(0, 3).map(type => (
            <button
              key={type.value}
              onClick={() => setQuestionType(type.value)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                questionType === type.value
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {QUESTION_TYPES.slice(3).map(type => (
            <button
              key={type.value}
              onClick={() => setQuestionType(type.value)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                questionType === type.value
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Creator tip for question type */}
      <CreatorTip tipKey={`question_${questionType}`} dismissedTips={dismissedTips} onDismiss={onDismissTip} />

      {/* ── MC / MS / TF / Ordering: Options ── */}
      {showOptions && (
        <div className="space-y-2">
          {options.map((opt, idx) => (
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
              {/* Per-option explanation for wrong options (MC/MS/TF) */}
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

      {/* ── Ordering: Correct Order ── */}
      {questionType === 'ordering' && options.some(o => o.text.trim()) && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Correct order (drag or use arrows):</p>
          <div className="space-y-1 bg-gray-50 rounded-lg p-2">
            {correctOrder.map((optId, idx) => {
              const opt = options.find(o => o.id === optId)
              return (
                <div key={optId} className="flex items-center gap-2 bg-white rounded px-2 py-1 border border-gray-200">
                  <span className="text-xs text-gray-400 w-4">{idx + 1}.</span>
                  <span className="text-sm text-gray-700 flex-1">{opt?.text || optId}</span>
                  <button onClick={() => moveOrderItem(idx, -1)} disabled={idx === 0} className="text-gray-300 hover:text-gray-600 disabled:opacity-30 text-xs">▲</button>
                  <button onClick={() => moveOrderItem(idx, 1)} disabled={idx === correctOrder.length - 1} className="text-gray-300 hover:text-gray-600 disabled:opacity-30 text-xs">▼</button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Fill Blank: Acceptable Answers ── */}
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

      {/* ── Matching: Pairs Builder ── */}
      {questionType === 'matching' && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Matching pairs:</p>
          <div className="space-y-1">
            {matchingPairs.map((pair, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={pair.left}
                  onChange={e => setMatchingPairs(prev => prev.map((p, i) => i === idx ? { ...p, left: e.target.value } : p))}
                  placeholder="Left item"
                  className="flex-1 text-sm border border-gray-200 rounded px-2 py-1.5"
                />
                <span className="text-xs text-gray-400">↔</span>
                <input
                  type="text"
                  value={pair.right}
                  onChange={e => setMatchingPairs(prev => prev.map((p, i) => i === idx ? { ...p, right: e.target.value } : p))}
                  placeholder="Right item"
                  className="flex-1 text-sm border border-gray-200 rounded px-2 py-1.5"
                />
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

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">Difficulty:</label>
          <input type="range" min="1" max="5" value={difficulty} onChange={e => setDifficulty(parseInt(e.target.value))} className="w-24" />
          <span className="text-xs font-semibold text-gray-700">{difficulty}</span>
        </div>
        <div className="flex-1">
          <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="Tags (comma-separated)" className="w-full text-xs border border-gray-200 rounded px-2 py-1.5" />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={!canSave() || saving}
        className="btn-primary px-4 py-2 text-sm disabled:opacity-50 w-full"
      >
        {saving ? 'Saving...' : 'Add Question'}
      </button>
    </div>
  )
}

// ─── CSV Import Modal for Questions ──────────────────────────────
function CSVImportQuestionsModal({
  courseId,
  onClose,
  onImported,
}: {
  courseId: string
  onClose: () => void
  onImported: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [result, setResult] = useState<{ imported: number; errors: { row: number; message: string }[] } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = (f: File) => {
    if (f.name.endsWith('.csv') || f.type === 'text/csv') setFile(f)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0])
  }

  const handleImport = async () => {
    if (!file) return
    setImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`/api/creator/courses/${courseId}/import/questions`, { method: 'POST', body: formData })
      const data = await res.json()
      setResult(data)
      if (data.imported > 0) onImported()
    } catch {
      setResult({ imported: 0, errors: [{ row: 0, message: 'Import failed' }] })
    }
    setImporting(false)
  }

  const downloadTemplate = () => {
    const csv = `topic_title,question_text,question_type,option_a,option_b,option_c,option_d,correct_answers,explanation,difficulty,tags,blooms_level\n"Security Concepts","What does CIA stand for in information security?","multiple_choice","Confidentiality, Integrity, Availability","Central Intelligence Agency","Certified Information Auditor","None of the above","a","CIA stands for Confidentiality, Integrity, and Availability - the three pillars of information security.",2,"cia;fundamentals","remember"`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'openED-questions-template.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1048576).toFixed(1)} MB`
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Import Questions from CSV</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4L12 12M4 12L12 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Drop zone */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }}
        />

        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors mb-4 ${
            dragOver ? 'border-blue-400 bg-blue-50' : file ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'
          }`}
        >
          {file ? (
            <div>
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M5 10L8.5 13.5L15 6.5" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-900">{file.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{formatBytes(file.size)}</p>
              <button
                onClick={e => { e.stopPropagation(); setFile(null) }}
                className="text-xs text-red-500 hover:text-red-700 mt-2"
              >
                Remove
              </button>
            </div>
          ) : (
            <div>
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-gray-400">
                  <path d="M12 16V4M12 4L8 8M12 4L16 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M20 16V18C20 19.1 19.1 20 18 20H6C4.9 20 4 19.1 4 18V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-700">Drop your CSV file here</p>
              <p className="text-xs text-gray-400 mt-0.5">or click to browse</p>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400 mb-3">
          Supports all 6 question types: MC, MS, T/F, Fill Blank, Ordering, Matching. Optional: <code className="bg-gray-100 px-1 rounded">blooms_level</code> column.
        </p>

        <div className="flex items-center gap-3 mb-4">
          <button onClick={downloadTemplate} className="text-xs font-medium text-blue-500 hover:text-blue-700">
            Download Template
          </button>
          <a href="/creator/import-guide" target="_blank" className="text-xs font-medium text-blue-500 hover:text-blue-700">
            View Import Guide &rarr;
          </a>
        </div>

        {result && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${result.errors.length > 0 && result.imported === 0 ? 'bg-red-50 text-red-700' : result.errors.length > 0 ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
            <p className="font-medium">Imported {result.imported} question{result.imported !== 1 ? 's' : ''}</p>
            {result.errors.slice(0, 10).map((e, i) => (
              <p key={i} className="text-xs mt-1">Row {e.row}: {e.message}</p>
            ))}
            {result.errors.length > 10 && <p className="text-xs mt-1">... and {result.errors.length - 10} more errors</p>}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <button onClick={onClose} className="btn-ghost px-4 py-2 text-sm">{result ? 'Done' : 'Cancel'}</button>
          {!result && (
            <button onClick={handleImport} disabled={!file || importing} className="btn-primary px-5 py-2 text-sm disabled:opacity-50">
              {importing ? 'Importing...' : 'Import'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────
export default function StepContentQuestions({
  courseId,
  onBack,
  onContinue,
  courseFormat,
}: {
  courseId: string
  onBack: () => void
  onContinue: () => void
  courseFormat?: CourseFormat
}) {
  const [modules, setModules] = useState<Module[]>([])
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingContent, setLoadingContent] = useState(false)
  const [showQImport, setShowQImport] = useState(false)
  const [dismissedTips, setDismissedTips] = useState<Set<string>>(new Set())
  const [teachWarningDismissed, setTeachWarningDismissed] = useState<Set<string>>(new Set())

  // Lesson & assessment state
  const [sidebarSelection, setSidebarSelection] = useState<SidebarSelection | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [lessonBody, setLessonBody] = useState('')
  const [lessonTitle, setLessonTitle] = useState('')
  const [lessonPreview, setLessonPreview] = useState(false)
  const [savingLesson, setSavingLesson] = useState(false)
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null)
  const [assessmentQuestions, setAssessmentQuestions] = useState<Question[]>([])
  const [allTopicQuestions, setAllTopicQuestions] = useState<Question[]>([])

  // Source import state
  const [sourceMap, setSourceMap] = useState<Record<string, string>>({})
  const [importingLesson, setImportingLesson] = useState(false)
  const [importingAll, setImportingAll] = useState(false)
  const [importAllConfirm, setImportAllConfirm] = useState(false)
  const hasSourceMap = Object.keys(sourceMap).length > 0

  // Load source_map from sessionStorage (set by Step 2 AI Import)
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(`source_map_${courseId}`)
      if (saved) setSourceMap(JSON.parse(saved))
    } catch { /* ignore */ }
  }, [courseId])

  const formatGuidance = courseFormat ? COURSE_FORMATS[courseFormat]?.guidance : null

  const handleDismissTip = (key: string) => {
    setDismissedTips(prev => new Set([...prev, key]))
  }

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/creator/courses/${courseId}`)
        const data = await res.json()
        if (data.modules) {
          setModules(data.modules)
          const firstTopic = data.modules[0]?.topics?.[0]
          if (firstTopic) setSelectedTopicId(firstTopic.id)
        }
      } catch (err) {
        console.error('Failed to load course:', err)
      }
      setLoading(false)
    }
    load()
  }, [courseId])

  const loadTopicContent = useCallback(async (topicId: string) => {
    setLoadingContent(true)
    try {
      const questionsRes = await fetch(`/api/creator/courses/${courseId}/topics/${topicId}/questions`)
      const questionsData = await questionsRes.json()
      setQuestions(Array.isArray(questionsData) ? questionsData : [])
    } catch {
      setQuestions([])
    }
    setLoadingContent(false)
  }, [courseId])

  useEffect(() => {
    if (selectedTopicId) loadTopicContent(selectedTopicId)
  }, [selectedTopicId, loadTopicContent])

  // Load lessons for selected topic
  const loadLessons = useCallback(async (topicId: string) => {
    try {
      const res = await fetch(`/api/creator/courses/${courseId}/topics/${topicId}/lessons`)
      const data = await res.json()
      setLessons(Array.isArray(data) ? data : [])
    } catch {
      setLessons([])
    }
  }, [courseId])

  useEffect(() => {
    if (selectedTopicId) loadLessons(selectedTopicId)
  }, [selectedTopicId, loadLessons])

  // Load assessments for course
  const loadAssessments = useCallback(async () => {
    try {
      const res = await fetch(`/api/creator/courses/${courseId}/assessments`)
      const data = await res.json()
      setAssessments(Array.isArray(data) ? data : [])
    } catch {
      setAssessments([])
    }
  }, [courseId])

  useEffect(() => { loadAssessments() }, [loadAssessments])

  // When sidebar selection changes to a lesson, load its questions
  useEffect(() => {
    if (sidebarSelection?.type === 'lesson') {
      const lesson = lessons.find(l => l.id === sidebarSelection.lessonId)
      if (lesson) {
        setSelectedLesson(lesson)
        setLessonTitle(lesson.title)
        setLessonBody(lesson.body)
        setLessonPreview(false)
        // Filter questions for this lesson
        setQuestions(prev => prev.filter(q => q.lesson_id === lesson.id))
      }
      setSelectedTopicId(sidebarSelection.topicId)
    } else if (sidebarSelection?.type === 'assessment') {
      const assess = assessments.find(a => a.id === sidebarSelection.assessmentId)
      setSelectedAssessment(assess || null)
      // Load assessment questions
      loadAssessmentQuestions(sidebarSelection.assessmentId)
    } else if (sidebarSelection?.type === 'topic') {
      setSelectedLesson(null)
      setSelectedAssessment(null)
    }
  }, [sidebarSelection])

  const loadAssessmentQuestions = async (assessmentId: string) => {
    try {
      const res = await fetch(`/api/creator/courses/${courseId}/assessments/${assessmentId}/questions`)
      const data = await res.json()
      setAssessmentQuestions(Array.isArray(data) ? data : [])
    } catch {
      setAssessmentQuestions([])
    }
  }

  // Lesson CRUD
  const addLesson = async (topicId: string) => {
    try {
      const res = await fetch(`/api/creator/courses/${courseId}/topics/${topicId}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Lesson' }),
      })
      const lesson = await res.json()
      if (lesson.id) {
        setLessons(prev => [...prev, lesson])
        setSidebarSelection({ type: 'lesson', topicId, lessonId: lesson.id })
      }
    } catch (err) {
      console.error('Failed to add lesson:', err)
    }
  }

  const saveLesson = async () => {
    if (!selectedLesson) return
    setSavingLesson(true)
    try {
      await fetch(`/api/creator/courses/${courseId}/lessons/${selectedLesson.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: lessonTitle, body: lessonBody }),
      })
      setLessons(prev => prev.map(l => l.id === selectedLesson.id ? { ...l, title: lessonTitle, body: lessonBody } : l))
      setSelectedLesson(prev => prev ? { ...prev, title: lessonTitle, body: lessonBody } : null)
    } catch (err) {
      console.error('Failed to save lesson:', err)
    }
    setSavingLesson(false)
  }

  const deleteLesson = async (lessonId: string) => {
    try {
      await fetch(`/api/creator/courses/${courseId}/lessons/${lessonId}`, { method: 'DELETE' })
      setLessons(prev => prev.filter(l => l.id !== lessonId))
      if (selectedLesson?.id === lessonId) {
        setSelectedLesson(null)
        setSidebarSelection(null)
      }
    } catch (err) {
      console.error('Failed to delete lesson:', err)
    }
  }

  // Assessment CRUD
  const addAssessment = async (type: string, moduleId?: string, topicId?: string) => {
    const titles: Record<string, string> = {
      topic_quiz: `Topic Quiz`,
      module_test: `Module Test`,
      practice_exam: `Practice Exam`,
    }
    try {
      const res = await fetch(`/api/creator/courses/${courseId}/assessments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: titles[type] || type,
          assessment_type: type,
          module_id: moduleId || null,
          topic_id: topicId || null,
        }),
      })
      const assessment = await res.json()
      if (assessment.id) {
        setAssessments(prev => [...prev, assessment])
        setSidebarSelection({ type: 'assessment', assessmentId: assessment.id })
      }
    } catch (err) {
      console.error('Failed to add assessment:', err)
    }
  }

  const toggleAssessmentQuestion = async (questionId: string, assessmentId: string, isAdding: boolean) => {
    try {
      if (isAdding) {
        await fetch(`/api/creator/courses/${courseId}/assessments/${assessmentId}/questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question_ids: [questionId] }),
        })
        const q = questions.find(q => q.id === questionId) || allTopicQuestions.find(q => q.id === questionId)
        if (q) setAssessmentQuestions(prev => [...prev, q])
      } else {
        await fetch(`/api/creator/courses/${courseId}/assessments/${assessmentId}/questions/${questionId}`, { method: 'DELETE' })
        setAssessmentQuestions(prev => prev.filter(q => q.id !== questionId))
      }
    } catch (err) {
      console.error('Failed to toggle assessment question:', err)
    }
  }

  const handleQuestionCreated = (q: Question) => {
    setQuestions(prev => [...prev, q])
    setModules(prev =>
      prev.map(m => ({
        ...m,
        topics: m.topics.map(t =>
          t.id === selectedTopicId ? { ...t, question_count: t.question_count + 1 } : t
        ),
      }))
    )
  }

  const deleteQuestion = async (questionId: string) => {
    setQuestions(prev => prev.filter(q => q.id !== questionId))
  }

  // Import source content into a single lesson
  const importLessonContent = async (lessonId: string) => {
    setImportingLesson(true)
    try {
      const excerpt = sourceMap[lessonId]
      const res = await fetch(`/api/creator/courses/${courseId}/generate-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson_id: lessonId, source_excerpt: excerpt }),
      })
      const data = await res.json()
      if (!res.ok) {
        console.error('Import failed:', data.error)
        setImportingLesson(false)
        return
      }
      // Reload lesson data
      if (selectedTopicId) {
        await loadLessons(selectedTopicId)
        await loadTopicContent(selectedTopicId)
      }
      // Update the lesson body in local state
      const lessonRes = await fetch(`/api/creator/courses/${courseId}/topics/${selectedTopicId}/lessons`)
      const lessonsData = await lessonRes.json()
      if (Array.isArray(lessonsData)) {
        setLessons(lessonsData)
        const updated = lessonsData.find((l: Lesson) => l.id === lessonId)
        if (updated) {
          setSelectedLesson(updated)
          setLessonBody(updated.body)
          setLessonTitle(updated.title)
        }
      }
    } catch (err) {
      console.error('Import failed:', err)
    }
    setImportingLesson(false)
  }

  // Import source content for all empty lessons that have source material
  const importAllContent = async () => {
    setImportingAll(true)
    setImportAllConfirm(false)
    try {
      const res = await fetch(`/api/creator/courses/${courseId}/generate-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true, source_map: sourceMap }),
      })
      const data = await res.json()
      if (!res.ok) {
        console.error('Bulk import failed:', data.error)
      }
      // Reload all data
      if (selectedTopicId) {
        await loadLessons(selectedTopicId)
        await loadTopicContent(selectedTopicId)
      }
      // Reload modules to refresh lesson counts
      const courseRes = await fetch(`/api/creator/courses/${courseId}`)
      const courseData = await courseRes.json()
      if (courseData.modules) setModules(courseData.modules)
    } catch (err) {
      console.error('Bulk import failed:', err)
    }
    setImportingAll(false)
  }

  const selectedTopic = modules.flatMap(m => m.topics).find(t => t.id === selectedTopicId)

  // Teach-before-test: show warning when adding question to topic with 0 lessons
  const showTeachWarning = selectedTopic && (selectedTopic.lesson_count || 0) === 0 && lessons.length === 0 && !teachWarningDismissed.has(selectedTopicId || '')

  if (loading) {
    return (
      <div className="flex gap-6 animate-pulse">
        <div className="w-56 space-y-2">
          <div className="h-6 bg-gray-200 rounded w-32" />
          <div className="h-4 bg-gray-100 rounded" />
          <div className="h-4 bg-gray-100 rounded" />
        </div>
        <div className="flex-1 h-96 bg-gray-100 rounded-xl" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Lessons &amp; Questions</h2>
          <p className="text-sm text-gray-500">Add lessons and practice questions to each topic.</p>
        </div>
        <div className="flex items-center gap-2">
          {hasSourceMap && (
            importingAll ? (
              <div className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600">
                <div className="w-4 h-4 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
                Importing content... this may take 1-3 minutes
              </div>
            ) : (
              <button
                onClick={() => setImportAllConfirm(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-white">
                    <path d="M12 16V4M12 16L8 12M12 16L16 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M20 16V18C20 19.1 19.1 20 18 20H6C4.9 20 4 19.1 4 18V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Import All from Source
                </span>
              </button>
            )
          )}
          <button onClick={() => setShowQImport(true)} className="btn-ghost px-4 py-2 text-sm">Import Questions CSV</button>
        </div>

        {/* Import All confirmation dialog */}
        {importAllConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setImportAllConfirm(false)}>
            <div className="bg-white rounded-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
              <h3 className="text-base font-bold text-gray-900 mb-2">Import All from Source?</h3>
              <p className="text-sm text-gray-500 mb-4">
                Your uploaded content will be organized into lesson format with concept cards and practice questions for all empty lessons that have source material. This may take a few minutes.
              </p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setImportAllConfirm(false)} className="btn-ghost px-4 py-2 text-sm">Cancel</button>
                <button
                  onClick={importAllContent}
                  className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Import
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-6 min-h-[600px]">
        {/* Sidebar with lessons & assessments */}
        <div className="w-64 flex-shrink-0 overflow-y-auto max-h-[calc(100vh-300px)]">
          {modules.map(mod => {
            const moduleAssessments = assessments.filter(a => a.module_id === mod.id)
            return (
              <div key={mod.id} className="mb-4">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">{mod.title}</h3>
                <div className="space-y-0.5">
                  {mod.topics.map(topic => {
                    const status = getTopicStatus(topic, formatGuidance || undefined)
                    const topicLessons = lessons.filter(l => selectedTopicId === topic.id ? true : false)
                    const topicAssessments = assessments.filter(a => a.topic_id === topic.id)
                    const isTopicExpanded = selectedTopicId === topic.id
                    const statusColor = {
                      complete: 'bg-green-500',
                      partial: 'bg-amber-500',
                      needs_content: 'bg-amber-500',
                      needs_questions: 'bg-blue-400',
                      empty: 'bg-gray-300',
                    }[status]

                    return (
                      <div key={topic.id}>
                        <button
                          onClick={() => {
                            setSelectedTopicId(topic.id)
                            setSidebarSelection({ type: 'topic', topicId: topic.id })
                            setSelectedLesson(null)
                            setSelectedAssessment(null)
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            isTopicExpanded && !selectedLesson && !selectedAssessment ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColor}`} />
                            <span className="truncate flex-1">{topic.title}</span>
                          </div>
                          <div className="ml-4 mt-0.5">
                            <TopicStatusChip status={status} topic={topic} />
                          </div>
                        </button>

                        {/* Lessons within expanded topic */}
                        {isTopicExpanded && (
                          <div className="ml-5 mt-1 space-y-0.5 border-l-2 border-gray-100 pl-2">
                            {lessons.map(lesson => (
                              <button
                                key={lesson.id}
                                onClick={() => {
                                  setSidebarSelection({ type: 'lesson', topicId: topic.id, lessonId: lesson.id })
                                  setSelectedAssessment(null)
                                }}
                                className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors flex items-center justify-between ${
                                  selectedLesson?.id === lesson.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                <span className="truncate">{lesson.title}</span>
                                <span className="text-[10px] text-gray-400 ml-1 flex-shrink-0">{lesson.question_count || 0}q</span>
                              </button>
                            ))}
                            <button
                              onClick={() => addLesson(topic.id)}
                              className="w-full text-left px-2 py-1 text-[11px] text-blue-500 hover:text-blue-700"
                            >
                              + Add Lesson
                            </button>

                            {/* Topic quiz */}
                            {topicAssessments.filter(a => a.assessment_type === 'topic_quiz').map(a => (
                              <button
                                key={a.id}
                                onClick={() => {
                                  setSidebarSelection({ type: 'assessment', assessmentId: a.id })
                                  setSelectedLesson(null)
                                }}
                                className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${
                                  selectedAssessment?.id === a.id ? 'bg-amber-50 text-amber-700 font-medium' : 'text-amber-600 hover:bg-amber-50'
                                }`}
                              >
                                Quiz: {a.title} <span className="text-[10px] text-gray-400 ml-1">{a.question_count}q</span>
                              </button>
                            ))}
                            {topicAssessments.filter(a => a.assessment_type === 'topic_quiz').length === 0 && (
                              <button
                                onClick={() => addAssessment('topic_quiz', mod.id, topic.id)}
                                className="w-full text-left px-2 py-1 text-[11px] text-amber-500 hover:text-amber-700"
                              >
                                + Add Topic Quiz
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* Module test */}
                  {moduleAssessments.filter(a => a.assessment_type === 'module_test').map(a => (
                    <button
                      key={a.id}
                      onClick={() => {
                        setSidebarSelection({ type: 'assessment', assessmentId: a.id })
                        setSelectedLesson(null)
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors ${
                        selectedAssessment?.id === a.id ? 'bg-purple-50 text-purple-700 font-medium' : 'text-purple-600 hover:bg-purple-50'
                      }`}
                    >
                      Test: {a.title} <span className="text-[10px] text-gray-400 ml-1">{a.question_count}q</span>
                    </button>
                  ))}
                  {moduleAssessments.filter(a => a.assessment_type === 'module_test').length === 0 && (
                    <button
                      onClick={() => addAssessment('module_test', mod.id)}
                      className="w-full text-left px-3 py-1 text-[11px] text-purple-500 hover:text-purple-700"
                    >
                      + Add Module Test
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          {/* Practice exam */}
          {assessments.filter(a => a.assessment_type === 'practice_exam').map(a => (
            <button
              key={a.id}
              onClick={() => {
                setSidebarSelection({ type: 'assessment', assessmentId: a.id })
                setSelectedLesson(null)
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors mt-2 ${
                selectedAssessment?.id === a.id ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-indigo-600 hover:bg-indigo-50'
              }`}
            >
              Exam: {a.title} <span className="text-[10px] text-gray-400 ml-1">{a.question_count}q</span>
            </button>
          ))}
          {assessments.filter(a => a.assessment_type === 'practice_exam').length === 0 && (
            <button
              onClick={() => addAssessment('practice_exam')}
              className="w-full text-left px-3 py-1 text-[11px] text-indigo-500 hover:text-indigo-700 mt-2"
            >
              + Add Practice Exam
            </button>
          )}
        </div>

        {/* Main content area */}
        <div className="flex-1 min-w-0">
          {/* Assessment editor */}
          {selectedAssessment ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{selectedAssessment.title}</h3>
                <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-500">
                  {selectedAssessment.assessment_type.replace('_', ' ')}
                </span>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
                <h4 className="text-sm font-semibold text-gray-700">Settings</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Questions</label>
                    <input
                      type="number"
                      value={selectedAssessment.question_count}
                      onChange={async (e) => {
                        const val = parseInt(e.target.value) || 10
                        setSelectedAssessment(prev => prev ? { ...prev, question_count: val } : null)
                        await fetch(`/api/creator/courses/${courseId}/assessments/${selectedAssessment.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ question_count: val }),
                        })
                      }}
                      className="w-full text-sm border border-gray-200 rounded px-2 py-1.5"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Time limit (min)</label>
                    <input
                      type="number"
                      value={selectedAssessment.time_limit_minutes || ''}
                      placeholder="None"
                      onChange={async (e) => {
                        const val = e.target.value ? parseInt(e.target.value) : null
                        setSelectedAssessment(prev => prev ? { ...prev, time_limit_minutes: val } : null)
                        await fetch(`/api/creator/courses/${courseId}/assessments/${selectedAssessment.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ time_limit_minutes: val }),
                        })
                      }}
                      className="w-full text-sm border border-gray-200 rounded px-2 py-1.5"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Pass score %</label>
                    <input
                      type="number"
                      value={selectedAssessment.passing_score_percent}
                      onChange={async (e) => {
                        const val = parseInt(e.target.value) || 70
                        setSelectedAssessment(prev => prev ? { ...prev, passing_score_percent: val } : null)
                        await fetch(`/api/creator/courses/${courseId}/assessments/${selectedAssessment.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ passing_score_percent: val }),
                        })
                      }}
                      className="w-full text-sm border border-gray-200 rounded px-2 py-1.5"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={selectedAssessment.shuffle_questions}
                      onChange={async (e) => {
                        setSelectedAssessment(prev => prev ? { ...prev, shuffle_questions: e.target.checked } : null)
                        await fetch(`/api/creator/courses/${courseId}/assessments/${selectedAssessment.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ shuffle_questions: e.target.checked }),
                        })
                      }}
                    />
                    Shuffle questions
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={selectedAssessment.show_explanations}
                      onChange={async (e) => {
                        setSelectedAssessment(prev => prev ? { ...prev, show_explanations: e.target.checked } : null)
                        await fetch(`/api/creator/courses/${courseId}/assessments/${selectedAssessment.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ show_explanations: e.target.checked }),
                        })
                      }}
                    />
                    Show explanations after answer
                  </label>
                </div>
              </div>

              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                Questions ({assessmentQuestions.length})
              </h4>
              <div className="space-y-2 mb-4">
                {assessmentQuestions.map(q => (
                  <div key={q.id} className="bg-gray-50 rounded-lg p-3 flex items-start justify-between gap-2">
                    <p className="text-sm text-gray-900 flex-1">{q.question_text}</p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-gray-400">{TYPE_LABELS[q.question_type] || q.question_type}</span>
                      <button
                        onClick={() => toggleAssessmentQuestion(q.id, selectedAssessment.id, false)}
                        className="text-xs text-gray-300 hover:text-red-500"
                      >
                        x
                      </button>
                    </div>
                  </div>
                ))}
                {assessmentQuestions.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">No questions added yet. Select a topic from the sidebar to view available questions.</p>
                )}
              </div>

              {/* Bloom's mix summary */}
              {assessmentQuestions.length > 0 && (
                <div className="bg-gray-50 rounded-lg px-3 py-2 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400">Bloom&apos;s mix:</span>
                    {BLOOMS_LEVELS.map(level => {
                      const count = assessmentQuestions.filter(q => q.blooms_level === level.value).length
                      if (count === 0) return null
                      return (
                        <span key={level.value} className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${level.bgColor} ${level.color}`}>
                          {level.label[0]} {count}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : selectedLesson ? (
            /* Lesson editor */
            <div>
              <div className="flex items-center justify-between mb-4">
                <input
                  type="text"
                  value={lessonTitle}
                  onChange={e => setLessonTitle(e.target.value)}
                  onBlur={saveLesson}
                  className="text-lg font-semibold text-gray-900 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none w-full"
                  placeholder="Lesson title..."
                />
                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                  <button
                    onClick={() => setLessonPreview(!lessonPreview)}
                    className="text-xs text-gray-400 hover:text-blue-500 px-2 py-1 rounded border border-gray-200"
                  >
                    {lessonPreview ? 'Edit' : 'Preview'}
                  </button>
                  <button
                    onClick={() => deleteLesson(selectedLesson.id)}
                    className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded border border-gray-200"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Import from source button — only shown when source material exists for this lesson */}
              {sourceMap[selectedLesson.id] && (
                importingLesson ? (
                  <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="w-4 h-4 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
                    <span className="text-sm text-blue-600">Formatting your content into lesson structure...</span>
                  </div>
                ) : (
                  <div className="mb-4">
                    <button
                      onClick={() => importLessonContent(selectedLesson.id)}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-white">
                          <path d="M12 16V4M12 16L8 12M12 16L16 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M20 16V18C20 19.1 19.1 20 18 20H6C4.9 20 4 19.1 4 18V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {lessonBody ? 'Re-import from source' : 'Import from source'}
                      </span>
                    </button>
                    {lessonBody && (
                      <span className="text-[11px] text-gray-400 ml-2">This will replace existing content</span>
                    )}
                  </div>
                )
              )}

              {/* Markdown body editor */}
              {lessonPreview ? (
                <div className="border border-gray-200 rounded-lg p-4 mb-6 prose prose-sm max-w-none min-h-[200px] [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-gray-700 [&_ul]:text-sm [&_ul]:text-gray-700 [&_ol]:text-sm [&_ol]:text-gray-700 [&_code]:text-xs [&_code]:bg-gray-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_pre]:bg-gray-800 [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:text-xs [&_pre]:text-gray-100">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{lessonBody || '*No content yet*'}</ReactMarkdown>
                </div>
              ) : (
                <textarea
                  value={lessonBody}
                  onChange={e => setLessonBody(e.target.value)}
                  onBlur={saveLesson}
                  rows={12}
                  className="w-full text-sm border border-gray-200 rounded-lg px-4 py-3 resize-y mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Write your lesson content in Markdown...&#10;&#10;## Heading&#10;Regular text with **bold** and *italic*&#10;&#10;> **Exam Tip:** Important tip here&#10;&#10;```&#10;code block&#10;```"
                />
              )}

              {savingLesson && <p className="text-xs text-gray-400 mb-2">Saving...</p>}

              {/* Questions for this lesson */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  Questions for this lesson ({questions.filter(q => q.lesson_id === selectedLesson.id).length})
                </h4>
                {questions.filter(q => q.lesson_id === selectedLesson.id).length > 0 && (
                  <div className="space-y-2 mb-4">
                    {questions.filter(q => q.lesson_id === selectedLesson.id).map((q, idx) => (
                      <div key={q.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm text-gray-900 flex-1">{idx + 1}. {q.question_text}</p>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {q.blooms_level && (
                              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                                BLOOMS_LEVELS.find(l => l.value === q.blooms_level)?.bgColor || 'bg-gray-50 border-gray-200'
                              } ${BLOOMS_LEVELS.find(l => l.value === q.blooms_level)?.color || 'text-gray-500'}`}>
                                {BLOOMS_LEVELS.find(l => l.value === q.blooms_level)?.label[0] || 'R'}
                              </span>
                            )}
                            <span className="text-xs text-gray-400">{TYPE_LABELS[q.question_type] || q.question_type}</span>
                            <button onClick={() => deleteQuestion(q.id)} className="text-xs text-gray-300 hover:text-red-500">x</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <QuestionForm
                  courseId={courseId}
                  topicId={selectedTopicId!}
                  onCreated={handleQuestionCreated}
                  courseFormat={courseFormat}
                  dismissedTips={dismissedTips}
                  onDismissTip={handleDismissTip}
                  lessonId={selectedLesson.id}
                />
              </div>
            </div>
          ) : selectedTopic ? (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedTopic.title}</h3>

              {/* Topic completeness bar */}
              <TopicCompletenessBar topic={selectedTopic} questions={questions} courseFormat={courseFormat} />

              {loadingContent ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-24 bg-gray-100 rounded-lg" />
                  <div className="h-24 bg-gray-100 rounded-lg" />
                </div>
              ) : (
                <>
                  {/* Lessons */}
                  <div>
                    <div className="space-y-3 mb-3">
                      {lessons.map(lesson => {
                        const lessonQuestionCount = lesson.question_count || 0
                        return (
                          <button
                            key={lesson.id}
                            onClick={() => setSidebarSelection({ type: 'lesson', topicId: selectedTopicId!, lessonId: lesson.id })}
                            className="w-full text-left bg-white border border-gray-200 rounded-lg px-4 py-3 hover:border-blue-300 hover:bg-blue-50/30 transition-colors group"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-900 group-hover:text-blue-700">{lesson.title}</span>
                              <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                              </svg>
                            </div>
                            {lesson.body && (
                              <p className="text-xs text-gray-400 line-clamp-1 mb-1.5">{lesson.body.slice(0, 120)}</p>
                            )}
                            <div className="flex items-center gap-3 text-[11px]">
                              <span className={lessonQuestionCount > 0 ? 'text-green-600' : 'text-gray-400'}>
                                {lessonQuestionCount} question{lessonQuestionCount !== 1 ? 's' : ''}
                              </span>
                              {lessonQuestionCount === 0 && (
                                <span className="text-amber-500">-- click to add questions</span>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                    <button
                      onClick={() => addLesson(selectedTopicId!)}
                      className="text-sm text-blue-500 hover:text-blue-700 font-medium"
                    >
                      + Add Lesson
                    </button>
                  </div>

                  {/* Teach-before-test warning */}
                  {showTeachWarning && (
                    <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                      <p className="text-sm text-amber-800 mb-2">
                        Learners retain more when they study before being tested. Add a lesson first.
                      </p>
                      <button
                        onClick={() => addLesson(selectedTopicId!)}
                        className="text-xs font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Add a Lesson
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <p>Select a topic from the sidebar to begin editing.</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
        <button onClick={onBack} className="btn-ghost px-5 py-2.5 text-sm">Back</button>
        <button onClick={onContinue} className="btn-primary px-6 py-2.5 text-sm">Continue to Review</button>
      </div>

      {showQImport && (
        <CSVImportQuestionsModal
          courseId={courseId}
          onClose={() => setShowQImport(false)}
          onImported={() => { if (selectedTopicId) loadTopicContent(selectedTopicId) }}
        />
      )}

    </div>
  )
}
