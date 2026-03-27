'use client'

import { useState } from 'react'
import type { MarkdownSection } from './useMarkdownSections'

interface Question {
  id: string
  question_text: string
  question_type: string
  options: { id: string; text: string }[]
  correct_option_ids: string[]
  explanation: string
  section_index: number
}

const TYPE_BADGES: Record<string, { label: string; bg: string; text: string }> = {
  multiple_choice: { label: 'MC', bg: 'bg-blue-100', text: 'text-blue-700' },
  multiple_select: { label: 'MS', bg: 'bg-purple-100', text: 'text-purple-700' },
  true_false: { label: 'T/F', bg: 'bg-amber-100', text: 'text-amber-700' },
  fill_blank: { label: 'Fill', bg: 'bg-green-100', text: 'text-green-700' },
  ordering: { label: 'Order', bg: 'bg-pink-100', text: 'text-pink-700' },
  matching: { label: 'Match', bg: 'bg-teal-100', text: 'text-teal-700' },
}

function QuestionCard({ question }: { question: Question }) {
  const badge = TYPE_BADGES[question.question_type] || { label: question.question_type, bg: 'bg-gray-100', text: 'text-gray-700' }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3">
      <div className="flex items-start gap-2 mb-2">
        <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${badge.bg} ${badge.text} flex-shrink-0`}>
          {badge.label}
        </span>
        <p className="text-sm text-gray-800 leading-snug">{question.question_text}</p>
      </div>
      {question.options && question.options.length > 0 && (
        <div className="grid grid-cols-2 gap-1.5 mt-2">
          {question.options.map(opt => {
            const isCorrect = question.correct_option_ids?.includes(opt.id)
            return (
              <div
                key={opt.id}
                className={`px-2 py-1 rounded text-xs ${
                  isCorrect
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium'
                    : 'bg-gray-50 border border-gray-200 text-gray-600'
                }`}
              >
                {opt.text}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function LessonQuestions({
  questions,
  sections,
  courseId,
  lessonId,
  onQuestionAdded,
}: {
  questions: Question[]
  sections: MarkdownSection[]
  courseId: string
  lessonId: string
  onQuestionAdded: () => void
}) {
  const [adding, setAdding] = useState(false)
  const [newQuestion, setNewQuestion] = useState('')
  const [newOptions, setNewOptions] = useState(['', '', '', ''])
  const [correctIdx, setCorrectIdx] = useState(0)
  const [savingQuestion, setSavingQuestion] = useState(false)

  // Group questions by section
  const grouped = sections.map(section => ({
    section,
    questions: questions.filter(q => q.section_index === section.index),
  }))

  // Questions with no matching section go to the end
  const sectionIndices = new Set(sections.map(s => s.index))
  const orphanQuestions = questions.filter(q => !sectionIndices.has(q.section_index))

  const handleAddQuestion = async (sectionIndex: number) => {
    if (!newQuestion.trim()) return
    setSavingQuestion(true)

    const optionData = newOptions
      .filter(o => o.trim())
      .map((text, i) => ({ id: `opt_${i}`, text }))

    try {
      await fetch(`/api/creator/courses/${courseId}/lessons/${lessonId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_text: newQuestion,
          question_type: 'multiple_choice',
          options: optionData,
          correct_option_ids: optionData[correctIdx] ? [optionData[correctIdx].id] : [],
          explanation: '',
          section_index: sectionIndex,
        }),
      })
      setAdding(false)
      setNewQuestion('')
      setNewOptions(['', '', '', ''])
      setCorrectIdx(0)
      onQuestionAdded()
    } catch {
      // Error handling
    }
    setSavingQuestion(false)
  }

  return (
    <div className="p-4 space-y-4 overflow-y-auto">
      {sections.length === 0 && questions.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-8">
          Add ## headings and questions to see them grouped here
        </p>
      )}

      {grouped.map(({ section, questions: sectionQuestions }) => (
        <div key={section.index}>
          <div className="border-t border-dashed border-gray-200 pt-3 mb-2">
            <p className="text-xs font-medium text-gray-500">After "{section.title}"</p>
          </div>
          <div className="space-y-2">
            {sectionQuestions.map(q => (
              <QuestionCard key={q.id} question={q} />
            ))}
          </div>
          <button
            onClick={() => setAdding(true)}
            className="w-full mt-2 py-2 border-2 border-dashed border-gray-200 rounded-lg text-xs text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors"
          >
            + Add question
          </button>
        </div>
      ))}

      {orphanQuestions.length > 0 && (
        <div>
          <div className="border-t border-dashed border-gray-200 pt-3 mb-2">
            <p className="text-xs font-medium text-gray-500">End of lesson</p>
          </div>
          <div className="space-y-2">
            {orphanQuestions.map(q => (
              <QuestionCard key={q.id} question={q} />
            ))}
          </div>
        </div>
      )}

      {/* Quick add question form */}
      {adding && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-600">New Question</p>
          <textarea
            value={newQuestion}
            onChange={e => setNewQuestion(e.target.value)}
            placeholder="Question text..."
            rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
            autoFocus
          />
          <div className="space-y-1.5">
            {newOptions.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCorrectIdx(i)}
                  className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                    correctIdx === i ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'
                  }`}
                />
                <input
                  type="text"
                  value={opt}
                  onChange={e => {
                    const updated = [...newOptions]
                    updated[i] = e.target.value
                    setNewOptions(updated)
                  }}
                  placeholder={`Option ${i + 1}`}
                  className="flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setAdding(false)} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1">Cancel</button>
            <button
              onClick={() => handleAddQuestion(sections.length > 0 ? sections[sections.length - 1].index : 0)}
              disabled={!newQuestion.trim() || savingQuestion}
              className="text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md disabled:opacity-50"
            >
              {savingQuestion ? 'Saving...' : 'Add'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
