'use client'

import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Lesson, Module, Question } from './types'
import { getContentType } from './types'
import { useAutoSave } from './useAutoSave'
import SaveStatusIndicator from './SaveStatusIndicator'
import LearnerPreviewModal from './LearnerPreviewModal'
import CreatorTip from '../CreatorTip'

// ─── Question Types ──────────────────────────────────────────────
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

// ─── Inline Question Form ────────────────────────────────────────
function QuestionForm({
  courseId,
  lessonId,
  onCreated,
}: {
  courseId: string
  lessonId: string
  onCreated: (q: Question) => void
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
  const [optionExplanations, setOptionExplanations] = useState<Record<string, string>>({})
  const [showOptExpl, setShowOptExpl] = useState<Set<string>>(new Set())
  const [acceptableAnswers, setAcceptableAnswers] = useState<string[]>([''])
  const [matchMode, setMatchMode] = useState('exact')
  const [correctOrder, setCorrectOrder] = useState<string[]>([])
  const [matchingPairs, setMatchingPairs] = useState<{ left: string; right: string }[]>([
    { left: '', right: '' }, { left: '', right: '' }, { left: '', right: '' },
  ])
  const [dismissedTips, setDismissedTips] = useState<Set<string>>(new Set())

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
    if (!canSave()) return
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        question_text: questionText.trim(),
        question_type: questionType,
        explanation: explanation.trim(),
        difficulty,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        lesson_id: lessonId,
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

      const res = await fetch(`/api/creator/courses/${courseId}/lessons/${lessonId}/questions`, {
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

// ─── Main Inline Lesson Editor ───────────────────────────────────
export default function InlineLessonEditor({
  courseId,
  lesson,
  modules,
  cardColor,
  onCollapse,
  onLessonUpdated,
}: {
  courseId: string
  lesson: Lesson
  modules: Module[]
  cardColor: string
  onCollapse: () => void
  onLessonUpdated: () => void
}) {
  const [lessonTitle, setLessonTitle] = useState(lesson.title)
  const [lessonBody, setLessonBody] = useState(lesson.body || '')
  const [videoUrl, setVideoUrl] = useState(lesson.video_url || '')
  const [preview, setPreview] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loadingQuestions, setLoadingQuestions] = useState(true)
  const [showPreviewModal, setShowPreviewModal] = useState(false)

  const contentType = getContentType(lesson)
  const [activeTab, setActiveTab] = useState<'text' | 'video'>(contentType === 'video' ? 'video' : 'text')

  const { status, save, saveImmediate } = useAutoSave(courseId, lesson.id)

  // Load questions
  useEffect(() => {
    setLoadingQuestions(true)
    fetch(`/api/creator/courses/${courseId}/lessons/${lesson.id}/questions`)
      .then(r => r.json())
      .then(data => setQuestions(Array.isArray(data) ? data : []))
      .catch(() => setQuestions([]))
      .finally(() => setLoadingQuestions(false))
  }, [courseId, lesson.id])

  // Reset state when lesson changes
  useEffect(() => {
    setLessonTitle(lesson.title)
    setLessonBody(lesson.body || '')
    setVideoUrl(lesson.video_url || '')
    setPreview(false)
  }, [lesson.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleQuestionCreated = (q: Question) => {
    setQuestions(prev => [...prev, q])
    onLessonUpdated()
  }

  const deleteQuestion = async (questionId: string) => {
    try {
      await fetch(`/api/creator/courses/${courseId}/lessons/${lesson.id}/questions/${questionId}`, { method: 'DELETE' })
      setQuestions(prev => prev.filter(q => q.id !== questionId))
      onLessonUpdated()
    } catch (err) {
      console.error('Failed to delete question:', err)
    }
  }

  // Find context for learner preview
  const lessonModule = modules.find(m => m.lessons.some(l => l.id === lesson.id))
  const lessonIndex = lessonModule?.lessons.findIndex(l => l.id === lesson.id) ?? 0

  return (
    <div>
      {/* Breadcrumb + actions */}
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-gray-400">
          {lessonModule?.title} &middot; Lesson {lessonIndex + 1} of {lessonModule?.lessons.length || 0}
        </p>
        <div className="flex items-center gap-3">
          <SaveStatusIndicator status={status} />
          <button
            onClick={() => setShowPreviewModal(true)}
            className="text-xs text-blue-500 hover:text-blue-700 font-medium"
          >
            Preview
          </button>
        </div>
      </div>

      {/* Title */}
      <input
        type="text"
        value={lessonTitle}
        onChange={e => { setLessonTitle(e.target.value); save('title', e.target.value.trim()) }}
        onBlur={() => { if (lessonTitle.trim() !== lesson.title) saveImmediate('title', lessonTitle.trim()) }}
        className="text-xl font-bold text-gray-900 bg-transparent border-b-2 border-transparent hover:border-gray-200 focus:border-blue-500 focus:outline-none w-full mb-5"
        placeholder="Lesson title..."
      />

      {/* Content type toggle */}
      <div className="flex gap-1 mb-3">
        <button
          onClick={() => setActiveTab('text')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'text' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
        >
          Text
        </button>
        <button
          onClick={() => setActiveTab('video')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'video' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
        >
          Video
        </button>
      </div>

      {/* Content area */}
      {activeTab === 'text' && (
        <div className="mb-4">
          <div className="flex items-center justify-end mb-2">
            <div className="flex gap-1">
              <button
                onClick={() => setPreview(false)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  !preview ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Write
              </button>
              <button
                onClick={() => setPreview(true)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  preview ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Preview
              </button>
            </div>
          </div>
          {preview ? (
            <div className="bg-white border border-gray-200 rounded-lg p-4 prose prose-sm max-w-none min-h-[200px] [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-gray-700 [&_ul]:text-sm [&_ul]:text-gray-700 [&_ol]:text-sm [&_ol]:text-gray-700 [&_code]:text-xs [&_code]:bg-gray-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_pre]:bg-gray-800 [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:text-xs [&_pre]:text-gray-100">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{lessonBody || '*No content yet*'}</ReactMarkdown>
            </div>
          ) : (
            <textarea
              value={lessonBody}
              onChange={e => { setLessonBody(e.target.value); save('body', e.target.value) }}
              onBlur={() => saveImmediate('body', lessonBody)}
              rows={10}
              className="w-full text-sm bg-white border border-gray-200 rounded-lg px-4 py-3 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="Write your lesson content in Markdown..."
            />
          )}
        </div>
      )}

      {activeTab === 'video' && (
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Video URL</label>
          <input
            type="text"
            value={videoUrl}
            onChange={e => { setVideoUrl(e.target.value); save('video_url', e.target.value.trim()) }}
            onBlur={() => saveImmediate('video_url', videoUrl.trim())}
            placeholder="https://youtube.com/watch?v=..."
            className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          {videoUrl && (
            <div className="mt-2 aspect-video rounded-lg overflow-hidden bg-black">
              <iframe
                src={(() => {
                  const yt = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/)
                  if (yt) return `https://www.youtube.com/embed/${yt[1]}`
                  const vim = videoUrl.match(/vimeo\.com\/(\d+)/)
                  if (vim) return `https://player.vimeo.com/video/${vim[1]}`
                  return videoUrl
                })()}
                className="w-full h-full"
                allowFullScreen
              />
            </div>
          )}
        </div>
      )}

      {/* Questions */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">
          Questions ({questions.length})
        </h3>

        {!loadingQuestions && questions.length > 0 && (
          <div className="space-y-2 mb-4">
            {questions.map((q, idx) => (
              <div key={q.id} className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-gray-900 flex-1">{idx + 1}. {q.question_text}</p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                      {TYPE_LABELS[q.question_type] || q.question_type}
                    </span>
                    <button
                      onClick={() => { if (confirm('Delete this question?')) deleteQuestion(q.id) }}
                      className="text-xs text-gray-300 hover:text-red-500"
                    >
                      x
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {loadingQuestions && (
          <div className="space-y-2 mb-4">
            {[1, 2].map(i => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}
          </div>
        )}

        <QuestionForm
          courseId={courseId}
          lessonId={lesson.id}
          onCreated={handleQuestionCreated}
        />
      </div>

      {/* Learner Preview Modal */}
      {showPreviewModal && lessonModule && (
        <LearnerPreviewModal
          courseId={courseId}
          lessonId={lesson.id}
          lessonTitle={lessonTitle}
          moduleName={lessonModule.title}
          lessonIndex={lessonIndex}
          totalLessons={lessonModule.lessons.length}
          cardColor={cardColor}
          onClose={() => setShowPreviewModal(false)}
        />
      )}
    </div>
  )
}
