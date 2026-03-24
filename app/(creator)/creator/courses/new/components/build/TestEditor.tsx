'use client'

import { useState, useEffect, useCallback } from 'react'

interface TestData {
  id: string
  course_id: string
  module_id: string | null
  title: string
  test_type: string
  question_count: number
  time_limit_minutes: number | null
  passing_score: number
  max_attempts: number | null
  shuffle_questions: boolean
  shuffle_options: boolean
  show_results: string
  sort_order: number
  status: string
  pool?: { total: number; from_lessons: number; from_pool: number }
}

interface PoolQuestion {
  id: string
  content: any
  sort_order: number
}

export default function TestEditor({
  courseId,
  testId,
  onClose,
  onTestUpdated,
}: {
  courseId: string
  testId: string
  onClose: () => void
  onTestUpdated: () => void
}) {
  const [test, setTest] = useState<TestData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [poolQuestions, setPoolQuestions] = useState<PoolQuestion[]>([])
  const [showAddQuestion, setShowAddQuestion] = useState(false)

  // ── Fetch test ──────────────────────────────────────────────────
  const fetchTest = useCallback(async () => {
    try {
      const res = await fetch(`/api/creator/courses/${courseId}/tests/${testId}`)
      const data = await res.json()
      setTest(data)
    } catch { /* ignore */ }
    setLoading(false)
  }, [courseId, testId])

  const fetchPoolQuestions = useCallback(async () => {
    try {
      const res = await fetch(`/api/creator/courses/${courseId}/tests/${testId}/pool-questions`)
      const data = await res.json()
      setPoolQuestions(Array.isArray(data) ? data : [])
    } catch { /* ignore */ }
  }, [courseId, testId])

  useEffect(() => { fetchTest(); fetchPoolQuestions() }, [fetchTest, fetchPoolQuestions])

  // ── Update field ────────────────────────────────────────────────
  async function updateField(field: string, value: any) {
    if (!test) return
    setTest(prev => prev ? { ...prev, [field]: value } : prev)
    setSaving(true)
    try {
      await fetch(`/api/creator/courses/${courseId}/tests/${testId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })
      if (field === 'question_count') fetchTest() // refresh pool info
    } catch { /* ignore */ }
    setSaving(false)
    onTestUpdated()
  }

  // ── Add pool question ───────────────────────────────────────────
  async function addPoolQuestion(content: any) {
    try {
      await fetch(`/api/creator/courses/${courseId}/tests/${testId}/pool-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      fetchPoolQuestions()
      fetchTest()
      setShowAddQuestion(false)
    } catch { /* ignore */ }
  }

  async function deletePoolQuestion(qId: string) {
    setPoolQuestions(prev => prev.filter(q => q.id !== qId))
    try {
      await fetch(`/api/creator/courses/${courseId}/tests/${testId}/pool-questions/${qId}`, {
        method: 'DELETE',
      })
      fetchTest()
    } catch { /* ignore */ }
  }

  async function handleDeleteTest() {
    if (!confirm('Delete this test? This cannot be undone.')) return
    try {
      await fetch(`/api/creator/courses/${courseId}/tests/${testId}`, { method: 'DELETE' })
      onTestUpdated()
      onClose()
    } catch { /* ignore */ }
  }

  if (loading || !test) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  const pool = test.pool || { total: 0, from_lessons: 0, from_pool: 0 }
  const poolStatus = pool.total >= test.question_count ? 'ok' : pool.total === 0 ? 'empty' : 'low'

  const TYPE_LABELS: Record<string, string> = {
    module_quiz: 'Module Quiz',
    practice_exam: 'Practice Exam',
    final_assessment: 'Final Assessment',
  }

  return (
    <div className="max-w-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600">
          <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back
        </button>
        <div className="flex items-center gap-2">
          {saving && <span className="text-[10px] text-gray-400">Saving...</span>}
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
            test.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {test.status}
          </span>
        </div>
      </div>

      {/* Title */}
      <input
        type="text"
        value={test.title}
        onChange={e => setTest(prev => prev ? { ...prev, title: e.target.value } : prev)}
        onBlur={e => updateField('title', e.target.value)}
        className="w-full text-lg font-bold text-gray-900 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-blue-500 focus:outline-none pb-1 mb-1"
      />
      <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mb-4 ${
        test.test_type === 'module_quiz' ? 'bg-blue-100 text-blue-700' :
        test.test_type === 'practice_exam' ? 'bg-purple-100 text-purple-700' :
        'bg-amber-100 text-amber-700'
      }`}>
        {TYPE_LABELS[test.test_type] || test.test_type}
      </span>

      {/* Settings */}
      <div className="space-y-4 mb-6">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Settings</h3>

        {/* Question count + pool indicator */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Questions per attempt</label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              value={test.question_count}
              onChange={e => setTest(prev => prev ? { ...prev, question_count: parseInt(e.target.value) || 1 } : prev)}
              onBlur={e => updateField('question_count', parseInt(e.target.value) || 1)}
              className="w-20 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <span className={`text-xs font-medium px-2 py-1 rounded-lg ${
              poolStatus === 'ok' ? 'bg-green-50 text-green-700' :
              poolStatus === 'low' ? 'bg-amber-50 text-amber-700' :
              'bg-red-50 text-red-700'
            }`}>
              {pool.total} in pool ({pool.from_lessons} from lessons + {pool.from_pool} standalone)
            </span>
          </div>
          {poolStatus === 'low' && (
            <p className="text-xs text-amber-600 mt-1">
              Pool has fewer questions than requested. Add more answer steps to lessons or add standalone pool questions below.
            </p>
          )}
          {poolStatus === 'empty' && (
            <p className="text-xs text-red-600 mt-1">
              No questions in pool. Add Answer steps to lessons or add standalone pool questions below.
            </p>
          )}
        </div>

        {/* Time limit */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Time limit (minutes)</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              value={test.time_limit_minutes || ''}
              placeholder="Untimed"
              onChange={e => setTest(prev => prev ? { ...prev, time_limit_minutes: e.target.value ? parseInt(e.target.value) : null } : prev)}
              onBlur={e => updateField('time_limit_minutes', e.target.value ? parseInt(e.target.value) : null)}
              className="w-24 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <span className="text-xs text-gray-400">Leave empty for untimed</span>
          </div>
        </div>

        {/* Passing score */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Passing score (%)</label>
          <input
            type="number"
            min={0}
            max={100}
            value={test.passing_score}
            onChange={e => setTest(prev => prev ? { ...prev, passing_score: parseInt(e.target.value) || 0 } : prev)}
            onBlur={e => updateField('passing_score', parseInt(e.target.value) || 0)}
            className="w-20 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Max attempts (for final assessment) */}
        {test.test_type === 'final_assessment' && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Max attempts</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={test.max_attempts || ''}
                placeholder="Unlimited"
                onChange={e => setTest(prev => prev ? { ...prev, max_attempts: e.target.value ? parseInt(e.target.value) : null } : prev)}
                onBlur={e => updateField('max_attempts', e.target.value ? parseInt(e.target.value) : null)}
                className="w-24 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <span className="text-xs text-gray-400">Leave empty for unlimited</span>
            </div>
          </div>
        )}

        {/* Toggles row */}
        <div className="grid grid-cols-2 gap-3">
          <ToggleField
            label="Shuffle questions"
            value={test.shuffle_questions}
            onChange={v => updateField('shuffle_questions', v)}
          />
          <ToggleField
            label="Shuffle options"
            value={test.shuffle_options}
            onChange={v => updateField('shuffle_options', v)}
          />
        </div>

        {/* Show results */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Show results</label>
          <select
            value={test.show_results}
            onChange={e => updateField('show_results', e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="after_submit">After each attempt</option>
            <option value="after_all_attempts">After all attempts used</option>
            <option value="never">Never (pass/fail only)</option>
          </select>
        </div>

        {/* Publish toggle */}
        <div className="pt-2 border-t border-gray-100">
          <ToggleField
            label="Published (visible to learners)"
            value={test.status === 'published'}
            onChange={v => updateField('status', v ? 'published' : 'draft')}
          />
        </div>
      </div>

      {/* Standalone pool questions */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Standalone Pool Questions</h3>
          <button
            onClick={() => setShowAddQuestion(true)}
            className="text-xs text-blue-500 hover:text-blue-700 font-medium"
          >
            + Add question
          </button>
        </div>

        {poolQuestions.length === 0 && !showAddQuestion && (
          <p className="text-xs text-gray-400 text-center py-4 bg-gray-50 rounded-lg">
            No standalone questions. These are extra questions that only appear in tests, not in lessons.
          </p>
        )}

        {poolQuestions.map((q, idx) => (
          <div key={q.id} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg mb-2">
            <span className="text-xs font-bold text-gray-400 mt-0.5">{idx + 1}</span>
            <p className="text-sm text-gray-700 flex-1">{q.content?.question_text || 'No question text'}</p>
            <button
              onClick={() => deletePoolQuestion(q.id)}
              className="text-gray-300 hover:text-red-500 flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}

        {showAddQuestion && (
          <AddPoolQuestionForm
            onSubmit={addPoolQuestion}
            onCancel={() => setShowAddQuestion(false)}
          />
        )}
      </div>

      {/* Delete */}
      <button
        onClick={handleDeleteTest}
        className="text-xs text-red-500 hover:text-red-700"
      >
        Delete test
      </button>
    </div>
  )
}

// ── Toggle field ──────────────────────────────────────────────────────────

function ToggleField({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <button
        onClick={() => onChange(!value)}
        className={`w-8 h-5 rounded-full relative transition-colors ${value ? 'bg-blue-500' : 'bg-gray-200'}`}
      >
        <span className={`block w-3.5 h-3.5 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform ${
          value ? 'translate-x-3.5' : 'translate-x-0.5'
        }`} />
      </button>
      <span className="text-xs text-gray-600">{label}</span>
    </label>
  )
}

// ── Add pool question form ────────────────────────────────────────────────

function AddPoolQuestionForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (content: any) => void
  onCancel: () => void
}) {
  const [questionText, setQuestionText] = useState('')
  const [options, setOptions] = useState([
    { id: 'a', text: '' },
    { id: 'b', text: '' },
    { id: 'c', text: '' },
    { id: 'd', text: '' },
  ])
  const [correctId, setCorrectId] = useState<string>('a')
  const [explanation, setExplanation] = useState('')

  function handleSubmit() {
    if (!questionText.trim()) return
    onSubmit({
      question_text: questionText,
      question_type: 'multiple_choice',
      options: options.filter(o => o.text.trim()),
      correct_ids: [correctId],
      explanation: explanation || undefined,
    })
  }

  return (
    <div className="border border-blue-200 bg-blue-50/30 rounded-lg p-3 space-y-3">
      <textarea
        value={questionText}
        onChange={e => setQuestionText(e.target.value)}
        placeholder="Question text..."
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
        rows={2}
        autoFocus
      />
      <div className="space-y-1.5">
        {options.map(opt => (
          <div key={opt.id} className="flex items-center gap-2">
            <button
              onClick={() => setCorrectId(opt.id)}
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                correctId === opt.id ? 'border-green-500 bg-green-500' : 'border-gray-300'
              }`}
            >
              {correctId === opt.id && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
            </button>
            <input
              type="text"
              value={opt.text}
              onChange={e => setOptions(prev => prev.map(o => o.id === opt.id ? { ...o, text: e.target.value } : o))}
              placeholder={`Option ${opt.id.toUpperCase()}`}
              className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500/20"
            />
          </div>
        ))}
      </div>
      <input
        type="text"
        value={explanation}
        onChange={e => setExplanation(e.target.value)}
        placeholder="Explanation (optional)"
        className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500/20"
      />
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700">Cancel</button>
        <button
          onClick={handleSubmit}
          disabled={!questionText.trim()}
          className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Add question
        </button>
      </div>
    </div>
  )
}
