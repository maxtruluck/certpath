'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { type CourseFormat } from '../lib/course-formats'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// ─── Types ───────────────────────────────────────────────────────
interface Lesson {
  id: string
  title: string
  display_order: number
}

interface Topic {
  id: string
  title: string
  module_id: string
  display_order: number
  question_count: number
  lesson_count: number
  lessons: Lesson[]
}

interface Module {
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
      onClick={() => setEditing(true)}
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
      onClick={onClick}
      className={`text-gray-300 hover:text-red-500 transition-colors flex-shrink-0 p-1 -m-1 ${className || ''}`}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M3 3L11 11M3 11L11 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </button>
  )
}

// ─── Lesson Row ──────────────────────────────────────────────────
function LessonRow({
  lesson,
  courseId,
  onEditTitle,
  onDelete,
  autoEdit,
}: {
  lesson: Lesson
  courseId: string
  onEditTitle: (lessonId: string, title: string) => void
  onDelete: (lessonId: string) => void
  autoEdit?: boolean
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors group ml-6">
      <div className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
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
  courseId,
  onEditTitle,
  onDelete,
  onAddLesson,
  onEditLessonTitle,
  onDeleteLesson,
  autoEdit,
  newLessonId,
  expanded,
  onToggle,
}: {
  topic: Topic
  courseId: string
  onEditTitle: (topicId: string, title: string) => void
  onDelete: (topicId: string) => void
  onAddLesson: (topicId: string) => void
  onEditLessonTitle: (lessonId: string, title: string) => void
  onDeleteLesson: (lessonId: string) => void
  autoEdit?: boolean
  newLessonId: string | null
  expanded: boolean
  onToggle: () => void
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

        {/* Expand/collapse for lessons */}
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

      {/* Lessons */}
      {expanded && (
        <div className="space-y-1 mt-1">
          {topic.lessons.map(lesson => (
            <LessonRow
              key={lesson.id}
              lesson={lesson}
              courseId={courseId}
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
        </div>
      )}
    </div>
  )
}

// ─── Sortable Module Accordion ───────────────────────────────────
function SortableModuleAccordion({
  mod,
  courseId,
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
}: {
  mod: Module
  courseId: string
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${isDragging ? 'shadow-xl ring-2 ring-blue-200' : ''}`}
    >
      {/* Module Header */}
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

      {/* Topic List (expanded) */}
      {expanded && (
        <div className="p-3 space-y-1.5">
          <SortableContext items={topicIds} strategy={verticalListSortingStrategy}>
            {mod.topics.map(topic => (
              <SortableTopicRow
                key={topic.id}
                topic={topic}
                courseId={courseId}
                onEditTitle={onEditTopicTitle}
                onDelete={onDeleteTopic}
                onAddLesson={onAddLesson}
                onEditLessonTitle={onEditLessonTitle}
                onDeleteLesson={onDeleteLesson}
                autoEdit={topic.id === newTopicId}
                newLessonId={newLessonId}
                expanded={expandedTopics.has(topic.id)}
                onToggle={() => onToggleTopic(topic.id)}
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
        </div>
      )}
    </div>
  )
}

// ─── CSV Import Modal ────────────────────────────────────────────
function CSVImportModal({
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
    if (f.name.endsWith('.csv') || f.type === 'text/csv') {
      setFile(f)
    }
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
      const res = await fetch(`/api/creator/courses/${courseId}/import/structure`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      setResult(data)
      if (data.imported > 0) onImported()
    } catch {
      setResult({ imported: 0, errors: [{ row: 0, message: 'Import failed' }] })
    }
    setImporting(false)
  }

  const downloadTemplate = () => {
    const csv = `module_title,topic_title,lesson_title,module_description,topic_description\n"Module 1","Topic 1","Lesson 1","Description of module 1","Description of topic 1"\n"Module 1","Topic 1","Lesson 2","",""\n"Module 1","Topic 2","Lesson 1","",""\n"Module 2","Topic 3","Lesson 1","Description of module 2",""`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'openED-outline-template.csv'; a.click()
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
          <h3 className="text-lg font-bold text-gray-900">Import Outline from CSV</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4L12 12M4 12L12 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

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

        <div className="flex items-center justify-between mb-4">
          <div className="text-xs text-gray-400">
            Required: <code className="bg-gray-100 px-1 rounded">module_title</code>, <code className="bg-gray-100 px-1 rounded">topic_title</code>. Optional: <code className="bg-gray-100 px-1 rounded">lesson_title</code>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <button onClick={downloadTemplate} className="text-xs font-medium text-blue-500 hover:text-blue-700">
            Download Template
          </button>
          <Link href="/creator/import-guide" className="text-xs font-medium text-blue-500 hover:text-blue-700" target="_blank">
            View Import Guide &rarr;
          </Link>
        </div>

        {result && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${result.errors.length > 0 && result.imported === 0 ? 'bg-red-50 text-red-700' : result.errors.length > 0 ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
            <p className="font-medium">Imported {result.imported} item{result.imported !== 1 ? 's' : ''}</p>
            {result.errors.slice(0, 5).map((e, i) => (
              <p key={i} className="text-xs mt-1">Row {e.row}: {e.message}</p>
            ))}
            {result.errors.length > 5 && <p className="text-xs mt-1">... and {result.errors.length - 5} more errors</p>}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <button onClick={onClose} className="btn-ghost px-4 py-2 text-sm">
            {result ? 'Done' : 'Cancel'}
          </button>
          {!result && (
            <button
              onClick={handleImport}
              disabled={!file || importing}
              className="btn-primary px-5 py-2 text-sm disabled:opacity-50"
            >
              {importing ? 'Importing...' : 'Import'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────
export default function StepStructureBuilder({
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
  const [loading, setLoading] = useState(true)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set())
  const [showCSVImport, setShowCSVImport] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [newTopicId, setNewTopicId] = useState<string | null>(null)
  const [newLessonId, setNewLessonId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // ─── Fetch Data ──────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/creator/courses/${courseId}`)
      const data = await res.json()
      if (data.modules) {
        const enriched: Module[] = await Promise.all(
          (data.modules as any[]).map(async (mod: any) => {
            const topicsWithDetails: Topic[] = await Promise.all(
              (mod.topics || []).map(async (t: any) => {
                // Fetch lessons for each topic
                let lessons: Lesson[] = []
                try {
                  const lessonsRes = await fetch(`/api/creator/courses/${courseId}/topics/${t.id}/lessons`)
                  const lessonsData = await lessonsRes.json()
                  if (Array.isArray(lessonsData)) {
                    lessons = lessonsData.map((l: any) => ({
                      id: l.id,
                      title: l.title,
                      display_order: l.display_order,
                    }))
                  }
                } catch { /* ignore */ }

                return {
                  ...t,
                  lesson_count: lessons.length,
                  lessons,
                }
              })
            )
            return { ...mod, topics: topicsWithDetails }
          })
        )
        setModules(enriched)
        // Expand first module on initial load
        if (enriched.length > 0 && expandedModules.size === 0) {
          setExpandedModules(new Set([enriched[0].id]))
          // Expand all topics in first module
          const firstModTopicIds = enriched[0].topics.map(t => t.id)
          setExpandedTopics(new Set(firstModTopicIds))
        }
      }
    } catch (err) {
      console.error('Failed to fetch course data:', err)
    }
    setLoading(false)
  }, [courseId])

  useEffect(() => { fetchData() }, [fetchData])


  // ─── Module CRUD ──────────────────────────────────────────────
  const addModule = async () => {
    try {
      const res = await fetch(`/api/creator/courses/${courseId}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: `Module ${modules.length + 1}` }),
      })
      const mod = await res.json()
      if (mod.id) {
        setModules(prev => [...prev, { ...mod, topics: [], question_count: 0 }])
        setExpandedModules(prev => new Set([...prev, mod.id]))
        setTimeout(() => {
          bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 100)
      }
    } catch (err) {
      console.error('Failed to create module:', err)
    }
  }

  const editModuleTitle = async (moduleId: string, title: string) => {
    setModules(prev => prev.map(m => m.id === moduleId ? { ...m, title } : m))
    try {
      await fetch(`/api/creator/courses/${courseId}/modules/${moduleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
    } catch (err) {
      console.error('Failed to update module:', err)
    }
  }

  const deleteModule = async (moduleId: string) => {
    setModules(prev => prev.filter(m => m.id !== moduleId))
    try {
      await fetch(`/api/creator/courses/${courseId}/modules/${moduleId}`, { method: 'DELETE' })
    } catch (err) {
      console.error('Failed to delete module:', err)
    }
  }

  // ─── Topic CRUD ──────────────────────────────────────────────
  const addTopic = async (moduleId: string) => {
    const mod = modules.find(m => m.id === moduleId)
    if (!mod) return
    try {
      const res = await fetch(`/api/creator/courses/${courseId}/modules/${moduleId}/topics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: `Topic ${mod.topics.length + 1}` }),
      })
      const topic = await res.json()
      if (topic.id) {
        setModules(prev => prev.map(m =>
          m.id === moduleId
            ? { ...m, topics: [...m.topics, { ...topic, question_count: 0, lesson_count: 0, lessons: [] }] }
            : m
        ))
        setNewTopicId(topic.id)
        setExpandedTopics(prev => new Set([...prev, topic.id]))
        setTimeout(() => setNewTopicId(null), 2000)
      }
    } catch (err) {
      console.error('Failed to create topic:', err)
    }
  }

  const editTopicTitle = async (topicId: string, title: string) => {
    setModules(prev => prev.map(m => ({
      ...m,
      topics: m.topics.map(t => t.id === topicId ? { ...t, title } : t),
    })))
    try {
      await fetch(`/api/creator/courses/${courseId}/topics/${topicId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
    } catch (err) {
      console.error('Failed to update topic:', err)
    }
  }

  const deleteTopic = async (topicId: string) => {
    setModules(prev => prev.map(m => ({
      ...m,
      topics: m.topics.filter(t => t.id !== topicId),
    })))
    try {
      await fetch(`/api/creator/courses/${courseId}/topics/${topicId}`, { method: 'DELETE' })
    } catch (err) {
      console.error('Failed to delete topic:', err)
    }
  }

  // ─── Lesson CRUD ──────────────────────────────────────────────
  const addLesson = async (topicId: string) => {
    // Find the topic to get current lesson count
    const topic = modules.flatMap(m => m.topics).find(t => t.id === topicId)
    if (!topic) return
    try {
      const res = await fetch(`/api/creator/courses/${courseId}/topics/${topicId}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: `Lesson ${topic.lessons.length + 1}` }),
      })
      const lesson = await res.json()
      if (lesson.id) {
        setModules(prev => prev.map(m => ({
          ...m,
          topics: m.topics.map(t =>
            t.id === topicId
              ? { ...t, lessons: [...t.lessons, { id: lesson.id, title: lesson.title, display_order: lesson.display_order }] }
              : t
          ),
        })))
        setNewLessonId(lesson.id)
        setExpandedTopics(prev => new Set([...prev, topicId]))
        setTimeout(() => setNewLessonId(null), 2000)
      }
    } catch (err) {
      console.error('Failed to create lesson:', err)
    }
  }

  const editLessonTitle = async (lessonId: string, title: string) => {
    setModules(prev => prev.map(m => ({
      ...m,
      topics: m.topics.map(t => ({
        ...t,
        lessons: t.lessons.map(l => l.id === lessonId ? { ...l, title } : l),
      })),
    })))
    try {
      await fetch(`/api/creator/courses/${courseId}/lessons/${lessonId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
    } catch (err) {
      console.error('Failed to update lesson:', err)
    }
  }

  const deleteLesson = async (lessonId: string) => {
    setModules(prev => prev.map(m => ({
      ...m,
      topics: m.topics.map(t => ({
        ...t,
        lessons: t.lessons.filter(l => l.id !== lessonId),
      })),
    })))
    try {
      await fetch(`/api/creator/courses/${courseId}/lessons/${lessonId}`, { method: 'DELETE' })
    } catch (err) {
      console.error('Failed to delete lesson:', err)
    }
  }

  // ─── Drag and Drop ────────────────────────────────────────────
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (!over || active.id === over.id) return

    const activeData = active.data.current
    const overData = over.data.current

    // Module reorder
    if (activeData?.type === 'module' && overData?.type === 'module') {
      const activeModId = (activeData.module as Module).id
      const overModId = (overData.module as Module).id

      setModules(prev => {
        const oldIndex = prev.findIndex(m => m.id === activeModId)
        const newIndex = prev.findIndex(m => m.id === overModId)
        const newMods = [...prev]
        const [moved] = newMods.splice(oldIndex, 1)
        newMods.splice(newIndex, 0, moved)

        const order = newMods.map((m, i) => ({ id: m.id, display_order: i }))
        fetch(`/api/creator/courses/${courseId}/modules`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order }),
        }).catch(console.error)

        return newMods
      })
      return
    }

    // Topic reorder (within or between modules)
    if (activeData?.type === 'topic') {
      const activeTopic = activeData.topic as Topic
      const overTopic = overData?.type === 'topic' ? overData.topic as Topic : null

      if (overTopic) {
        const sourceModId = activeTopic.module_id
        const targetModId = overTopic.module_id

        setModules(prev => {
          const newMods = prev.map(m => ({ ...m, topics: [...m.topics.map(t => ({ ...t, lessons: [...t.lessons] }))] }))

          if (sourceModId === targetModId) {
            const mod = newMods.find(m => m.topics.some(t => t.id === activeTopic.id))
            if (mod) {
              const oldIndex = mod.topics.findIndex(t => t.id === activeTopic.id)
              const newIndex = mod.topics.findIndex(t => t.id === overTopic.id)
              const [moved] = mod.topics.splice(oldIndex, 1)
              mod.topics.splice(newIndex, 0, moved)
            }
          } else {
            const sourceMod = newMods.find(m => m.topics.some(t => t.id === activeTopic.id))
            const targetMod = newMods.find(m => m.topics.some(t => t.id === overTopic.id))
            if (sourceMod && targetMod) {
              const sourceIdx = sourceMod.topics.findIndex(t => t.id === activeTopic.id)
              const [moved] = sourceMod.topics.splice(sourceIdx, 1)
              moved.module_id = targetMod.id
              const targetIdx = targetMod.topics.findIndex(t => t.id === overTopic.id)
              targetMod.topics.splice(targetIdx, 0, moved)

              fetch(`/api/creator/courses/${courseId}/topics/${activeTopic.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ module_id: targetMod.id }),
              }).catch(console.error)
            }
          }

          return newMods
        })
      }
    }
  }

  // ─── Toggles ──────────────────────────────────────────────────
  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev)
      if (next.has(moduleId)) next.delete(moduleId)
      else next.add(moduleId)
      return next
    })
  }

  const toggleTopic = (topicId: string) => {
    setExpandedTopics(prev => {
      const next = new Set(prev)
      if (next.has(topicId)) next.delete(topicId)
      else next.add(topicId)
      return next
    })
  }

  // ─── Stats ───────────────────────────────────────────────────
  const totalTopics = modules.reduce((sum, m) => sum + m.topics.length, 0)
  const totalLessons = modules.reduce((sum, m) => sum + m.topics.reduce((s, t) => s + t.lessons.length, 0), 0)

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse max-w-3xl mx-auto">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="h-4 w-64 bg-gray-100 rounded" />
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-gray-100 rounded-xl" />
        ))}
      </div>
    )
  }

  const moduleIds = modules.map(m => `module-${m.id}`)
  const allTopicIds = modules.flatMap(m => m.topics.map(t => t.id))

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Course Outline</h2>
          <p className="text-sm text-gray-500">Build your course structure: modules, topics, and lessons. Drag to reorder.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCSVImport(true)}
            className="btn-ghost px-4 py-2 text-sm"
          >
            CSV Import
          </button>
          {modules.length > 0 && (
            <span className="text-sm text-gray-400">
              {modules.length}m &middot; {totalTopics}t &middot; {totalLessons}l
            </span>
          )}
        </div>
      </div>

      {/* Empty State */}
      {modules.length === 0 && (
        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-gray-400">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">Start building your course outline</h3>
          <p className="text-sm text-gray-500 mb-6">Add modules, then topics within each module, then lessons within each topic.</p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={addModule} className="btn-primary px-5 py-2.5 text-sm">
              + Add First Module
            </button>
            <button onClick={() => setShowCSVImport(true)} className="btn-ghost px-5 py-2.5 text-sm">
              CSV Import
            </button>
          </div>
        </div>
      )}

      {/* Module List */}
      {modules.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={moduleIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {modules.map(mod => (
                <SortableModuleAccordion
                  key={mod.id}
                  mod={mod}
                  courseId={courseId}
                  expanded={expandedModules.has(mod.id)}
                  onToggle={() => toggleModule(mod.id)}
                  onEditTitle={editModuleTitle}
                  onDeleteModule={deleteModule}
                  onAddTopic={addTopic}
                  onEditTopicTitle={editTopicTitle}
                  onDeleteTopic={deleteTopic}
                  onAddLesson={addLesson}
                  onEditLessonTitle={editLessonTitle}
                  onDeleteLesson={deleteLesson}
                  newTopicId={newTopicId}
                  newLessonId={newLessonId}
                  expandedTopics={expandedTopics}
                  onToggleTopic={toggleTopic}
                />
              ))}
            </div>
          </SortableContext>

          <SortableContext items={allTopicIds} strategy={verticalListSortingStrategy}>
            <span />
          </SortableContext>

          <DragOverlay>
            {activeId ? (
              <div className="bg-white border-2 border-blue-300 rounded-lg px-4 py-3 shadow-xl">
                <span className="text-sm font-medium text-gray-900">Moving...</span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Add Module Button */}
      {modules.length > 0 && (
        <div ref={bottomRef}>
          <button
            onClick={addModule}
            className="w-full mt-3 py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-400 hover:text-blue-500 hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
          >
            + Add Module
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
        <button onClick={onBack} className="btn-ghost px-5 py-2.5 text-sm">Back</button>
        <button
          onClick={onContinue}
          disabled={modules.length === 0 || totalTopics === 0}
          className="btn-primary px-6 py-2.5 text-sm disabled:opacity-50"
        >
          Continue to Content
        </button>
      </div>

      {showCSVImport && (
        <CSVImportModal
          courseId={courseId}
          onClose={() => setShowCSVImport(false)}
          onImported={fetchData}
        />
      )}
    </div>
  )
}
