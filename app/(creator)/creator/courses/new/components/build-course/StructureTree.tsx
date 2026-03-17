'use client'

import { useState, useRef, useEffect } from 'react'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// ─── Types ───────────────────────────────────────────────────────
export interface Lesson {
  id: string
  title: string
  body: string
  display_order: number
  is_active?: boolean
  question_count?: number
}

export interface Assessment {
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

export interface Topic {
  id: string
  title: string
  module_id: string
  display_order: number
  question_count: number
  lesson_count: number
  lessons: Lesson[]
}

export interface Module {
  id: string
  title: string
  display_order: number
  topics: Topic[]
  question_count: number
}

// ─── Drag Handle Icon ────────────────────────────────────────────
function DragHandleIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className={className}>
      <circle cx="6" cy="3.5" r="1.2" /><circle cx="10" cy="3.5" r="1.2" />
      <circle cx="6" cy="8" r="1.2" /><circle cx="10" cy="8" r="1.2" />
      <circle cx="6" cy="12.5" r="1.2" /><circle cx="10" cy="12.5" r="1.2" />
    </svg>
  )
}

// ─── Inline Editable Title ───────────────────────────────────────
function InlineTitle({
  value,
  onSave,
  className,
  placeholder,
  autoEdit,
}: {
  value: string
  onSave: (newTitle: string) => void
  className?: string
  placeholder?: string
  autoEdit?: boolean
}) {
  const [editing, setEditing] = useState(autoEdit || false)
  const [text, setText] = useState(value)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setText(value) }, [value])
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const handleSave = async () => {
    setEditing(false)
    if (text.trim() && text.trim() !== value) {
      setSaving(true)
      await onSave(text.trim())
      setSaving(false)
    } else {
      setText(value)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') { setText(value); setEditing(false) }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={text}
        onChange={e => setText(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`bg-white border border-blue-300 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${className || ''}`}
      />
    )
  }

  return (
    <span
      onClick={(e) => { e.stopPropagation(); setEditing(true) }}
      className={`cursor-pointer hover:text-blue-600 transition-colors ${className || ''} ${saving ? 'opacity-50' : ''}`}
    >
      {value || placeholder}
      {saving && <span className="ml-1.5 inline-block w-3 h-3 border border-gray-300 border-t-blue-500 rounded-full animate-spin" />}
    </span>
  )
}

// ─── Delete Button ───────────────────────────────────────────────
function DeleteButton({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className={`text-gray-300 hover:text-red-500 transition-colors flex-shrink-0 p-1 -m-1 ${className || ''}`}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M3 3L11 11M3 11L11 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </button>
  )
}

// ─── Lesson Row (clickable) ─────────────────────────────────────
function LessonRow({
  lesson,
  selected,
  onSelect,
  onEditTitle,
  onDelete,
  autoEdit,
}: {
  lesson: Lesson
  selected: boolean
  onSelect: () => void
  onEditTitle: (lessonId: string, title: string) => void
  onDelete: (lessonId: string) => void
  autoEdit?: boolean
}) {
  return (
    <div
      onClick={onSelect}
      className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors group ml-6 cursor-pointer ${
        selected
          ? 'bg-blue-50 border-blue-200'
          : 'bg-gray-50 border-gray-100 hover:border-gray-200'
      }`}
    >
      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${selected ? 'bg-blue-500' : 'bg-gray-300'}`} />
      <div className="flex-1 min-w-0">
        <InlineTitle
          value={lesson.title}
          onSave={(title) => onEditTitle(lesson.id, title)}
          className="text-xs text-gray-700 font-medium"
          placeholder="Lesson title..."
          autoEdit={autoEdit}
        />
      </div>
      <DeleteButton
        onClick={() => { if (confirm('Delete this lesson?')) onDelete(lesson.id) }}
        className="opacity-0 group-hover:opacity-100"
      />
    </div>
  )
}

// ─── Sortable Topic Row (with lessons) ───────────────────────────
function SortableTopicRow({
  topic,
  selectedLessonId,
  onSelectLesson,
  onEditTitle,
  onDelete,
  onAddLesson,
  onEditLessonTitle,
  onDeleteLesson,
  autoEdit,
  newLessonId,
  expanded,
  onToggle,
  assessments,
}: {
  topic: Topic
  selectedLessonId: string | null
  onSelectLesson: (lessonId: string) => void
  onEditTitle: (topicId: string, title: string) => void
  onDelete: (topicId: string) => void
  onAddLesson: (topicId: string) => void
  onEditLessonTitle: (lessonId: string, title: string) => void
  onDeleteLesson: (lessonId: string) => void
  autoEdit?: boolean
  newLessonId: string | null
  expanded: boolean
  onToggle: () => void
  assessments: Assessment[]
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: topic.id, data: { type: 'topic', topic } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  }

  const hasLessons = topic.lessons.length > 0
  const topicQuizzes = assessments.filter(a => a.topic_id === topic.id && a.assessment_type === 'topic_quiz')

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={`flex items-center gap-2 px-3 py-2.5 bg-white border border-gray-100 rounded-lg hover:border-gray-200 transition-colors group ${isDragging ? 'shadow-lg ring-2 ring-blue-200' : ''}`}
      >
        <button
          {...attributes}
          {...listeners}
          className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing flex-shrink-0 touch-manipulation p-1 -m-1"
        >
          <DragHandleIcon />
        </button>

        <button
          onClick={onToggle}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 p-1 -m-1"
        >
          <svg
            width="14" height="14" viewBox="0 0 14 14" fill="none"
            className={`transition-transform duration-200 ${expanded ? 'rotate-0' : '-rotate-90'}`}
          >
            <path d="M3.5 5.25L7 8.75L10.5 5.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="flex-1 min-w-0 flex items-center gap-2">
          <InlineTitle
            value={topic.title}
            onSave={(title) => onEditTitle(topic.id, title)}
            className="text-sm text-gray-900 font-medium truncate"
            placeholder="Topic title..."
            autoEdit={autoEdit}
          />
          {hasLessons && (
            <span className="text-[11px] text-gray-400">
              {topic.lessons.length} lesson{topic.lessons.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <DeleteButton
          onClick={() => { if (confirm('Delete this topic and all its lessons?')) onDelete(topic.id) }}
          className="opacity-0 group-hover:opacity-100"
        />
      </div>

      {expanded && (
        <div className="space-y-1 mt-1">
          {topic.lessons.map(lesson => (
            <LessonRow
              key={lesson.id}
              lesson={lesson}
              selected={selectedLessonId === lesson.id}
              onSelect={() => onSelectLesson(lesson.id)}
              onEditTitle={onEditLessonTitle}
              onDelete={onDeleteLesson}
              autoEdit={lesson.id === newLessonId}
            />
          ))}
          <button
            onClick={() => onAddLesson(topic.id)}
            className="ml-6 w-[calc(100%-1.5rem)] py-2 border border-dashed border-gray-200 rounded-lg text-xs font-medium text-gray-400 hover:text-blue-500 hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
          >
            {topic.lessons.length === 0 ? '+ Add first lesson' : '+ Add lesson'}
          </button>

          {/* Topic quizzes */}
          {topicQuizzes.map(a => (
            <div key={a.id} className="ml-6 flex items-center gap-1.5 px-3 py-1.5 text-xs text-amber-600">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-amber-500 flex-shrink-0">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {a.title} <span className="text-[10px] text-gray-400">{a.question_count}q</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Sortable Module Accordion ───────────────────────────────────
export function SortableModuleAccordion({
  mod,
  expanded,
  onToggle,
  onEditTitle,
  onDeleteModule,
  onAddTopic,
  onEditTopicTitle,
  onDeleteTopic,
  onAddLesson,
  onEditLessonTitle,
  onDeleteLesson,
  newTopicId,
  newLessonId,
  expandedTopics,
  onToggleTopic,
  selectedLessonId,
  onSelectLesson,
  assessments,
}: {
  mod: Module
  expanded: boolean
  onToggle: () => void
  onEditTitle: (moduleId: string, title: string) => void
  onDeleteModule: (moduleId: string) => void
  onAddTopic: (moduleId: string) => void
  onEditTopicTitle: (topicId: string, title: string) => void
  onDeleteTopic: (topicId: string) => void
  onAddLesson: (topicId: string) => void
  onEditLessonTitle: (lessonId: string, title: string) => void
  onDeleteLesson: (lessonId: string) => void
  newTopicId: string | null
  newLessonId: string | null
  expandedTopics: Set<string>
  onToggleTopic: (topicId: string) => void
  selectedLessonId: string | null
  onSelectLesson: (lessonId: string) => void
  assessments: Assessment[]
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `module-${mod.id}`, data: { type: 'module', module: mod } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  }

  const topicIds = mod.topics.map(t => t.id)
  const totalLessons = mod.topics.reduce((sum, t) => sum + t.lessons.length, 0)
  const moduleTests = assessments.filter(a => a.module_id === mod.id && a.assessment_type === 'module_test')

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${isDragging ? 'shadow-xl ring-2 ring-blue-200' : ''}`}
    >
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
        <button
          {...attributes}
          {...listeners}
          className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing flex-shrink-0 touch-manipulation p-1 -m-1"
        >
          <DragHandleIcon />
        </button>

        <button
          onClick={onToggle}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-transform p-1 -m-1"
        >
          <svg
            width="16" height="16" viewBox="0 0 16 16" fill="none"
            className={`transition-transform duration-200 ${expanded ? 'rotate-0' : '-rotate-90'}`}
          >
            <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="flex-1 min-w-0">
          <InlineTitle
            value={mod.title}
            onSave={(title) => onEditTitle(mod.id, title)}
            className="text-sm font-semibold text-gray-900"
            placeholder="Module title..."
          />
          <p className="text-xs text-gray-400 mt-0.5">
            {mod.topics.length} topic{mod.topics.length !== 1 ? 's' : ''} &middot; {totalLessons} lesson{totalLessons !== 1 ? 's' : ''}
          </p>
        </div>

        <DeleteButton
          onClick={() => {
            if (confirm('Delete this module and all its topics/lessons?')) onDeleteModule(mod.id)
          }}
        />
      </div>

      {expanded && (
        <div className="p-3 space-y-1.5">
          <SortableContext items={topicIds} strategy={verticalListSortingStrategy}>
            {mod.topics.map(topic => (
              <SortableTopicRow
                key={topic.id}
                topic={topic}
                selectedLessonId={selectedLessonId}
                onSelectLesson={onSelectLesson}
                onEditTitle={onEditTopicTitle}
                onDelete={onDeleteTopic}
                onAddLesson={onAddLesson}
                onEditLessonTitle={onEditLessonTitle}
                onDeleteLesson={onDeleteLesson}
                autoEdit={topic.id === newTopicId}
                newLessonId={newLessonId}
                expanded={expandedTopics.has(topic.id)}
                onToggle={() => onToggleTopic(topic.id)}
                assessments={assessments}
              />
            ))}
          </SortableContext>

          {mod.topics.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <p className="text-sm">No topics yet</p>
              <button
                onClick={() => onAddTopic(mod.id)}
                className="text-sm text-blue-500 hover:text-blue-700 font-medium mt-1"
              >
                + Add first topic
              </button>
            </div>
          ) : (
            <button
              onClick={() => onAddTopic(mod.id)}
              className="w-full py-2.5 border border-dashed border-gray-200 rounded-lg text-xs font-medium text-gray-400 hover:text-blue-500 hover:border-blue-300 hover:bg-blue-50/30 transition-colors mt-1"
            >
              + Add another topic
            </button>
          )}

          {/* Module tests */}
          {moduleTests.map(a => (
            <div key={a.id} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-purple-600 mt-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-purple-500 flex-shrink-0">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {a.title} <span className="text-[10px] text-gray-400">{a.question_count}q</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
