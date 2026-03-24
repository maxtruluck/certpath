'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
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
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import type { Lesson, Module } from './build/types'
import { hasContent } from './build/types'
import ContextMenu from './build/ContextMenu'
import LessonStatusBadge from './build/LessonStatusBadge'
import CompletionProgressBar from './build/CompletionProgressBar'
import SaveStatusIndicator from './build/SaveStatusIndicator'
import StepSequencer from './build/StepSequencer'
import LearnerPreviewModal from './build/LearnerPreviewModal'
import TestEditor from './build/TestEditor'
import type { SaveStatus, Question } from './build/types'

interface TestItem {
  id: string
  title: string
  test_type: string
  module_id: string | null
  question_count: number
  status: string
}

// ─── CSV Import Modal ────────────────────────────────────────────
// (kept from v1, unchanged)
interface UnifiedImportResult {
  imported: number
  stats?: { modules: number; topics: number; lessons: number; content: number; questions: number }
  errors: { row: number; message: string }[]
}

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
  const [result, setResult] = useState<UnifiedImportResult | null>(null)
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
      const res = await fetch(`/api/creator/courses/${courseId}/import/unified`, {
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

  const downloadOutlineTemplate = () => {
    const a = document.createElement('a')
    a.href = '/templates/openED-outline-template.csv'
    a.download = 'openED-outline-template.csv'
    a.click()
  }

  const downloadFullTemplate = () => {
    const a = document.createElement('a')
    a.href = '/templates/openED-full-course-template.csv'
    a.download = 'openED-full-course-template.csv'
    a.click()
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
          <h3 className="text-lg font-bold text-gray-900">Import from CSV</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4L12 12M4 12L12 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Import your full course in one CSV: structure, lesson content, and questions.
        </p>
        <div className="bg-gray-50 rounded-lg px-3 py-2.5 mb-4 space-y-1.5">
          <p className="text-xs font-semibold text-gray-600">Row types:</p>
          <div className="flex items-start gap-2 text-xs text-gray-500">
            <code className="bg-white border border-gray-200 px-1.5 py-0.5 rounded font-semibold text-gray-700 flex-shrink-0">structure</code>
            <span>Creates modules and lessons</span>
          </div>
          <div className="flex items-start gap-2 text-xs text-gray-500">
            <code className="bg-white border border-gray-200 px-1.5 py-0.5 rounded font-semibold text-gray-700 flex-shrink-0">content</code>
            <span>Sets the markdown body for a lesson</span>
          </div>
          <div className="flex items-start gap-2 text-xs text-gray-500">
            <code className="bg-white border border-gray-200 px-1.5 py-0.5 rounded font-semibold text-gray-700 flex-shrink-0">question</code>
            <span>Adds a question linked to a lesson</span>
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }} />
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
              <p className="text-sm font-medium text-gray-900">{file.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{formatBytes(file.size)}</p>
              <button onClick={e => { e.stopPropagation(); setFile(null) }} className="text-xs text-red-500 hover:text-red-700 mt-2">Remove</button>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium text-gray-700">Drop your CSV file here</p>
              <p className="text-xs text-gray-400 mt-0.5">or click to browse</p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={downloadFullTemplate} className="text-xs font-medium text-blue-500 hover:text-blue-700">Full Course Template</button>
          <button onClick={downloadOutlineTemplate} className="text-xs font-medium text-blue-500 hover:text-blue-700">Outline Only Template</button>
        </div>
        {result && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${result.errors.length > 0 && result.imported === 0 ? 'bg-red-50 text-red-700' : result.errors.length > 0 ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
            {result.stats ? (
              <div>
                <p className="font-medium mb-1">Imported {result.imported} item{result.imported !== 1 ? 's' : ''}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
                  {result.stats.modules > 0 && <span>{result.stats.modules} module{result.stats.modules !== 1 ? 's' : ''}</span>}
                  {result.stats.lessons > 0 && <span>{result.stats.lessons} lesson{result.stats.lessons !== 1 ? 's' : ''}</span>}
                  {result.stats.content > 0 && <span>{result.stats.content} lesson bod{result.stats.content !== 1 ? 'ies' : 'y'}</span>}
                  {result.stats.questions > 0 && <span>{result.stats.questions} question{result.stats.questions !== 1 ? 's' : ''}</span>}
                </div>
              </div>
            ) : (
              <p className="font-medium">Imported {result.imported} item{result.imported !== 1 ? 's' : ''}</p>
            )}
            {result.errors.slice(0, 5).map((e, i) => <p key={i} className="text-xs mt-1">Row {e.row}: {e.message}</p>)}
            {result.errors.length > 5 && <p className="text-xs mt-1">... and {result.errors.length - 5} more errors</p>}
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

// ─── Drag Handle ─────────────────────────────────────────────────
function DragHandleIcon({ className }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className={className}>
      <circle cx="6" cy="3.5" r="1.2" /><circle cx="10" cy="3.5" r="1.2" />
      <circle cx="6" cy="8" r="1.2" /><circle cx="10" cy="8" r="1.2" />
      <circle cx="6" cy="12.5" r="1.2" /><circle cx="10" cy="12.5" r="1.2" />
    </svg>
  )
}

// ─── Module Name Popup ───────────────────────────────────────────
function ModuleNamePopup({
  onSubmit,
  onCancel,
}: {
  onSubmit: (name: string) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = () => {
    if (name.trim()) onSubmit(name.trim())
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 space-y-2">
      <p className="text-xs font-semibold text-gray-500">New module</p>
      <input
        ref={inputRef}
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') handleSubmit()
          if (e.key === 'Escape') onCancel()
        }}
        placeholder="e.g., Network Security Fundamentals"
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
      />
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700">Cancel</button>
        <button
          onClick={handleSubmit}
          disabled={!name.trim()}
          className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          Add module
        </button>
      </div>
    </div>
  )
}

// ─── Sortable Lesson Row (sidebar) ───────────────────────────────
function SortableSidebarLesson({
  lesson,
  idx,
  isActive,
  onClick,
  modules,
  onDelete,
  onDuplicate,
  onMoveTo,
  onPreview,
  onRename,
}: {
  lesson: Lesson
  idx: number
  isActive: boolean
  onClick: () => void
  modules: Module[]
  onDelete: () => void
  onDuplicate: () => void
  onMoveTo: (targetModuleId: string) => void
  onPreview: () => void
  onRename: (title: string) => void
}) {
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleText, setTitleText] = useState(lesson.title)
  const titleInputRef = useRef<HTMLInputElement>(null)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `lesson-${lesson.id}`, data: { type: 'lesson', lesson, moduleId: lesson.module_id } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  }

  useEffect(() => {
    if (editingTitle) {
      titleInputRef.current?.focus()
      titleInputRef.current?.select()
    }
  }, [editingTitle])

  useEffect(() => { setTitleText(lesson.title) }, [lesson.title])

  const handleTitleSave = () => {
    setEditingTitle(false)
    const trimmed = titleText.trim()
    if (trimmed && trimmed !== lesson.title) {
      onRename(trimmed)
    } else {
      setTitleText(lesson.title)
    }
  }

  const otherModules = modules.filter(m => m.id !== lesson.module_id)

  const menuItems = [
    { label: 'Rename', onClick: () => setEditingTitle(true) },
    { label: 'Preview', onClick: onPreview },
    ...(otherModules.length > 0
      ? [{ divider: true as const }, ...otherModules.map(m => ({ label: `Move to ${m.title}`, onClick: () => onMoveTo(m.id) }))]
      : []),
    { label: 'Duplicate', onClick: onDuplicate },
    { divider: true as const },
    { label: 'Delete', onClick: () => { if (confirm('Delete this lesson?')) onDelete() }, destructive: true },
  ]

  return (
    <div ref={setNodeRef} style={style}>
      <div
        onClick={editingTitle ? undefined : onClick}
        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer group transition-colors ${
          isActive
            ? 'bg-blue-50 border border-blue-200'
            : 'hover:bg-gray-50 border border-transparent'
        }`}
      >
        <button
          {...attributes}
          {...listeners}
          onClick={e => e.stopPropagation()}
          className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing flex-shrink-0 touch-manipulation opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <DragHandleIcon />
        </button>
        <span className="text-[11px] text-gray-400 w-4 flex-shrink-0">{idx + 1}</span>
        {editingTitle ? (
          <input
            ref={titleInputRef}
            value={titleText}
            onChange={e => setTitleText(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={e => {
              if (e.key === 'Enter') handleTitleSave()
              if (e.key === 'Escape') { setTitleText(lesson.title); setEditingTitle(false) }
            }}
            onClick={e => e.stopPropagation()}
            className="text-xs text-gray-900 bg-white border border-blue-300 rounded px-1.5 py-0.5 flex-1 min-w-0 focus:outline-none"
          />
        ) : (
          <span
            className={`text-xs truncate flex-1 ${isActive ? 'text-blue-700 font-medium' : 'text-gray-700'}`}
            onDoubleClick={(e) => { e.stopPropagation(); setEditingTitle(true) }}
          >
            {lesson.title}
          </span>
        )}
        <LessonStatusBadge lesson={lesson} />
        <div className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
          <ContextMenu items={menuItems} />
        </div>
      </div>
    </div>
  )
}

// ─── Sortable Module Row (sidebar) ───────────────────────────────
function SortableSidebarModule({
  mod,
  expanded,
  onToggle,
  onEditTitle,
  onDeleteModule,
  onDuplicateModule,
  onAddLesson,
  activeLessonId,
  onSelectLesson,
  onDeleteLesson,
  onDuplicateLesson,
  onMoveLesson,
  onPreviewLesson,
  onRenameLesson,
  modules,
  moduleTests,
  activeTestId,
  onSelectTest,
  onAddQuiz,
}: {
  mod: Module
  expanded: boolean
  onToggle: () => void
  onEditTitle: (title: string) => void
  onDeleteModule: () => void
  onDuplicateModule: () => void
  onAddLesson: () => void
  activeLessonId: string | null
  onSelectLesson: (lessonId: string) => void
  onDeleteLesson: (lessonId: string) => void
  onDuplicateLesson: (lessonId: string) => void
  onMoveLesson: (lessonId: string, targetModuleId: string) => void
  onPreviewLesson: (lessonId: string) => void
  onRenameLesson: (lessonId: string, title: string) => void
  modules: Module[]
  moduleTests?: TestItem[]
  activeTestId?: string | null
  onSelectTest?: (testId: string) => void
  onAddQuiz?: () => void
}) {
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleText, setTitleText] = useState(mod.title)
  const titleInputRef = useRef<HTMLInputElement>(null)

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

  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [editingTitle])

  const handleTitleSave = () => {
    setEditingTitle(false)
    if (titleText.trim() && titleText.trim() !== mod.title) {
      onEditTitle(titleText.trim())
    } else {
      setTitleText(mod.title)
    }
  }

  const moduleMenuItems = [
    { label: 'Rename', onClick: () => setEditingTitle(true) },
    { label: 'Add lesson', onClick: onAddLesson },
    { label: 'Duplicate module', onClick: onDuplicateModule },
    { divider: true as const },
    { label: 'Delete module', onClick: () => { if (confirm('Delete this module and all its lessons?')) onDeleteModule() }, destructive: true },
  ]

  const lessonIds = mod.lessons.map(l => `lesson-${l.id}`)

  return (
    <div ref={setNodeRef} style={style}>
      {/* Module header */}
      <div className="flex items-center gap-1 px-2 py-1.5 group">
        <button
          {...attributes}
          {...listeners}
          className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <DragHandleIcon />
        </button>
        <button onClick={onToggle} className="flex-shrink-0 text-gray-400 hover:text-gray-600 p-0.5">
          <svg
            width="14" height="14" viewBox="0 0 16 16" fill="none"
            className={`transition-transform duration-200 ${expanded ? 'rotate-0' : '-rotate-90'}`}
          >
            <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          {editingTitle ? (
            <input
              ref={titleInputRef}
              value={titleText}
              onChange={e => setTitleText(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={e => { if (e.key === 'Enter') handleTitleSave(); if (e.key === 'Escape') { setTitleText(mod.title); setEditingTitle(false) } }}
              className="text-xs font-semibold text-gray-900 bg-white border border-blue-300 rounded px-1.5 py-0.5 w-full focus:outline-none"
            />
          ) : (
            <span
              className="text-xs font-semibold text-gray-900 truncate block cursor-pointer hover:text-blue-600"
              onDoubleClick={() => setEditingTitle(true)}
            >
              {mod.title}
            </span>
          )}
          <span className="text-[10px] text-gray-400">{mod.lessons.length} lesson{mod.lessons.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <ContextMenu items={moduleMenuItems} />
        </div>
      </div>

      {/* Lessons */}
      {expanded && (
        <div className="ml-5 space-y-0.5 pb-1">
          <SortableContext items={lessonIds} strategy={verticalListSortingStrategy}>
            {mod.lessons.map((lesson, idx) => (
              <SortableSidebarLesson
                key={lesson.id}
                lesson={lesson}
                idx={idx}
                isActive={activeLessonId === lesson.id}
                onClick={() => onSelectLesson(lesson.id)}
                modules={modules}
                onDelete={() => onDeleteLesson(lesson.id)}
                onDuplicate={() => onDuplicateLesson(lesson.id)}
                onMoveTo={(targetId) => onMoveLesson(lesson.id, targetId)}
                onPreview={() => onPreviewLesson(lesson.id)}
                onRename={(title) => onRenameLesson(lesson.id, title)}
              />
            ))}
          </SortableContext>
          <button
            onClick={onAddLesson}
            className="w-full text-left px-2 py-1 text-[11px] text-gray-400 hover:text-blue-500 transition-colors"
          >
            + lesson
          </button>

          {/* Module quizzes */}
          {moduleTests && moduleTests.length > 0 && moduleTests.map(t => (
            <button
              key={t.id}
              onClick={() => onSelectTest?.(t.id)}
              className={`w-full flex items-center gap-1.5 px-2 py-1 rounded text-left transition-colors ${
                activeTestId === t.id ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
              </svg>
              <span className="text-[11px] font-medium truncate">{t.title}</span>
            </button>
          ))}

          {/* Add quiz button */}
          {onAddQuiz && !(moduleTests && moduleTests.some(t => t.test_type === 'module_quiz')) && (
            <button
              onClick={onAddQuiz}
              className="w-full text-left px-2 py-1 text-[11px] text-gray-400 hover:text-purple-500 transition-colors"
            >
              + quiz
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── No Lesson Selected ──────────────────────────────────────────
function NoLessonSelected() {
  return (
    <div className="flex items-center justify-center h-full text-center">
      <div>
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-gray-400">
            <path d="M15 3H19C20.1 3 21 3.9 21 5V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V5C3 3.9 3.9 3 5 3H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 3V15M12 15L8 11M12 15L16 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="text-sm text-gray-500">Select a lesson from the outline to start editing.</p>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────
export default function StepBuildCourse({
  courseId,
  cardColor,
  onBack,
  onPublish,
}: {
  courseId: string
  cardColor?: string
  onBack: () => void
  onPublish: () => void
}) {
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null)
  const [showCSVImport, setShowCSVImport] = useState(false)
  const [showModulePopup, setShowModulePopup] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [previewLesson, setPreviewLesson] = useState<{ lesson: Lesson; module: Module } | null>(null)
  const [previewQuestions, setPreviewQuestions] = useState<Question[]>([])
  const [tests, setTests] = useState<TestItem[]>([])
  const [activeTestId, setActiveTestId] = useState<string | null>(null)

  const accentColor = cardColor || '#3b82f6'

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // ─── Fetch Data ──────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/creator/courses/${courseId}`)
      const data = await res.json()
      if (data.modules) {
        const enriched: Module[] = (data.modules as any[]).map((mod: any) => {
          const lessons: Lesson[] = (mod.lessons || []).map((l: any) => ({
            id: l.id,
            title: l.title,
            body: l.body || null,
            video_url: l.video_url || null,
            display_order: l.display_order,
            module_id: mod.id,
            question_count: l.question_count || 0,
            word_count: l.word_count || (l.body ? l.body.split(/\s+/).filter(Boolean).length : 0),
            step_count: l.step_count || 0,
          }))
          return {
            id: mod.id,
            title: mod.title,
            display_order: mod.display_order,
            lessons,
            question_count: mod.question_count || lessons.reduce((sum: number, l: Lesson) => sum + l.question_count, 0),
          }
        })
        setModules(enriched)
        if (enriched.length > 0 && expandedModules.size === 0) {
          setExpandedModules(new Set(enriched.map(m => m.id)))
        }
      }
      // Fetch tests
      const testsRes = await fetch(`/api/creator/courses/${courseId}/tests`)
      const testsData = await testsRes.json()
      setTests(Array.isArray(testsData) ? testsData : [])
    } catch (err) {
      console.error('Failed to fetch course data:', err)
    }
    setLoading(false)
  }, [courseId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchData() }, [fetchData])

  // ─── Get active lesson object ─────────────────────────────────
  const activeLesson = activeLessonId
    ? modules.flatMap(m => m.lessons).find(l => l.id === activeLessonId) || null
    : null

  // ─── Module CRUD ──────────────────────────────────────────────
  const createModuleWithName = async (name: string) => {
    try {
      const res = await fetch(`/api/creator/courses/${courseId}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: name }),
      })
      const mod = await res.json()
      if (mod.id) {
        // Create first lesson
        const lRes = await fetch(`/api/creator/courses/${courseId}/modules/${mod.id}/lessons`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'Lesson 1' }),
        })
        const lesson = await lRes.json()
        const newModule: Module = {
          ...mod,
          lessons: lesson.id ? [{
            id: lesson.id,
            title: lesson.title,
            body: null,
            video_url: null,
            display_order: 0,
            module_id: mod.id,
            question_count: 0,
            word_count: 0,
            step_count: 0,
          }] : [],
          question_count: 0,
        }
        setModules(prev => [...prev, newModule])
        setExpandedModules(prev => new Set([...prev, mod.id]))
        setShowModulePopup(false)
        // Select the first lesson for editing
        if (lesson.id) setActiveLessonId(lesson.id)
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
    const mod = modules.find(m => m.id === moduleId)
    if (mod?.lessons.some(l => l.id === activeLessonId)) {
      setActiveLessonId(null)
    }
    setModules(prev => prev.filter(m => m.id !== moduleId))
    try {
      await fetch(`/api/creator/courses/${courseId}/modules/${moduleId}`, { method: 'DELETE' })
    } catch (err) {
      console.error('Failed to delete module:', err)
    }
  }

  const duplicateModule = async (moduleId: string) => {
    const mod = modules.find(m => m.id === moduleId)
    if (!mod) return
    try {
      const res = await fetch(`/api/creator/courses/${courseId}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: `${mod.title} (copy)` }),
      })
      const newMod = await res.json()
      if (!newMod.id) return
      for (const lesson of mod.lessons) {
        const lRes = await fetch(`/api/creator/courses/${courseId}/modules/${newMod.id}/lessons`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: lesson.title }),
        })
        const newLesson = await lRes.json()
        if (newLesson.id && (lesson.body || lesson.video_url)) {
          await fetch(`/api/creator/courses/${courseId}/lessons/${newLesson.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ body: lesson.body, video_url: lesson.video_url }),
          })
        }
      }
      await fetchData()
    } catch (err) {
      console.error('Failed to duplicate module:', err)
    }
  }

  // ─── Lesson CRUD ──────────────────────────────────────────────
  const addLesson = async (moduleId: string) => {
    const mod = modules.find(m => m.id === moduleId)
    if (!mod) return
    try {
      const res = await fetch(`/api/creator/courses/${courseId}/modules/${moduleId}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: `Lesson ${mod.lessons.length + 1}` }),
      })
      const lesson = await res.json()
      if (lesson.id) {
        const newLesson: Lesson = {
          id: lesson.id,
          title: lesson.title,
          body: null,
          video_url: null,
          display_order: lesson.display_order,
          module_id: moduleId,
          question_count: 0,
          word_count: 0,
          step_count: 0,
        }
        setModules(prev => prev.map(m =>
          m.id === moduleId ? { ...m, lessons: [...m.lessons, newLesson] } : m
        ))
        setActiveLessonId(lesson.id)
      }
    } catch (err) {
      console.error('Failed to create lesson:', err)
    }
  }

  const deleteLesson = async (lessonId: string) => {
    if (activeLessonId === lessonId) setActiveLessonId(null)
    setModules(prev => prev.map(m => ({
      ...m,
      lessons: m.lessons.filter(l => l.id !== lessonId),
    })))
    try {
      await fetch(`/api/creator/courses/${courseId}/lessons/${lessonId}`, { method: 'DELETE' })
    } catch (err) {
      console.error('Failed to delete lesson:', err)
    }
  }

  const renameLesson = async (lessonId: string, title: string) => {
    setModules(prev => prev.map(m => ({
      ...m,
      lessons: m.lessons.map(l => l.id === lessonId ? { ...l, title } : l),
    })))
    try {
      await fetch(`/api/creator/courses/${courseId}/lessons/${lessonId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
    } catch (err) {
      console.error('Failed to rename lesson:', err)
    }
  }

  const duplicateLesson = async (lessonId: string) => {
    let sourceLesson: Lesson | null = null
    let moduleId: string | null = null
    for (const mod of modules) {
      const found = mod.lessons.find(l => l.id === lessonId)
      if (found) { sourceLesson = found; moduleId = mod.id; break }
    }
    if (!sourceLesson || !moduleId) return
    try {
      const res = await fetch(`/api/creator/courses/${courseId}/modules/${moduleId}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: `${sourceLesson.title} (copy)` }),
      })
      const newLesson = await res.json()
      if (newLesson.id && (sourceLesson.body || sourceLesson.video_url)) {
        await fetch(`/api/creator/courses/${courseId}/lessons/${newLesson.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body: sourceLesson.body, video_url: sourceLesson.video_url }),
        })
      }
      await fetchData()
    } catch (err) {
      console.error('Failed to duplicate lesson:', err)
    }
  }

  const moveLesson = async (lessonId: string, targetModuleId: string) => {
    let movedLesson: Lesson | null = null
    setModules(prev => {
      const updated = prev.map(m => {
        const found = m.lessons.find(l => l.id === lessonId)
        if (found) movedLesson = { ...found, module_id: targetModuleId }
        return { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) }
      })
      if (movedLesson) {
        return updated.map(m =>
          m.id === targetModuleId ? { ...m, lessons: [...m.lessons, movedLesson!] } : m
        )
      }
      return updated
    })
    try {
      await fetch(`/api/creator/courses/${courseId}/lessons/${lessonId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module_id: targetModuleId }),
      })
    } catch (err) {
      console.error('Failed to move lesson:', err)
      await fetchData()
    }
  }

  // ─── Test CRUD ──────────────────────────────────────────────
  const addTest = async (testType: string, moduleId?: string) => {
    const titles: Record<string, string> = {
      module_quiz: `${modules.find(m => m.id === moduleId)?.title || 'Module'} Quiz`,
      practice_exam: `Practice Exam ${tests.filter(t => t.test_type === 'practice_exam').length + 1}`,
      final_assessment: 'Final Assessment',
    }
    try {
      const res = await fetch(`/api/creator/courses/${courseId}/tests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: titles[testType] || 'Test',
          test_type: testType,
          module_id: moduleId || undefined,
        }),
      })
      const test = await res.json()
      if (test.id) {
        setTests(prev => [...prev, test])
        setActiveLessonId(null)
        setActiveTestId(test.id)
      }
    } catch (err) {
      console.error('Failed to create test:', err)
    }
  }

  // ─── Learner Preview ──────────────────────────────────────────
  const openLessonPreview = async (lessonId: string) => {
    const lesson = modules.flatMap(m => m.lessons).find(l => l.id === lessonId)
    const mod = modules.find(m => m.lessons.some(l => l.id === lessonId))
    if (!lesson || !mod) return
    try {
      const res = await fetch(`/api/creator/courses/${courseId}/lessons/${lessonId}/questions`)
      const data = await res.json()
      setPreviewQuestions(Array.isArray(data) ? data : [])
    } catch {
      setPreviewQuestions([])
    }
    setPreviewLesson({ lesson, module: mod })
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
    }

    if (activeData?.type === 'lesson' && overData?.type === 'lesson') {
      const activeLesson = activeData.lesson as Lesson
      const overLesson = overData.lesson as Lesson
      const sourceModuleId = activeData.moduleId as string
      const targetModuleId = overData.moduleId as string

      if (sourceModuleId === targetModuleId) {
        setModules(prev => prev.map(m => {
          if (m.id !== sourceModuleId) return m
          const lessons = [...m.lessons]
          const oldIdx = lessons.findIndex(l => l.id === activeLesson.id)
          const newIdx = lessons.findIndex(l => l.id === overLesson.id)
          const [moved] = lessons.splice(oldIdx, 1)
          lessons.splice(newIdx, 0, moved)
          fetch(`/api/creator/courses/${courseId}/modules/${sourceModuleId}/lessons/reorder`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lesson_ids: lessons.map(l => l.id) }),
          }).catch(console.error)
          return { ...m, lessons }
        }))
      } else {
        moveLesson(activeLesson.id, targetModuleId)
      }
    }
  }

  // ─── Toggles ──────────────────────────────────────────────────
  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev)
      if (next.has(moduleId)) {
        next.delete(moduleId)
        // Deselect lesson if it's in this module
        const mod = modules.find(m => m.id === moduleId)
        if (mod?.lessons.some(l => l.id === activeLessonId)) {
          setActiveLessonId(null)
        }
      } else {
        next.add(moduleId)
      }
      return next
    })
  }

  // ─── Stats ───────────────────────────────────────────────────
  const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0)
  const lessonsWithContent = modules.flatMap(m => m.lessons).filter(hasContent).length
  const canPublish = lessonsWithContent > 0

  // Auto-create first module + lesson when empty
  const [autoCreating, setAutoCreating] = useState(false)
  useEffect(() => {
    if (!loading && modules.length === 0 && !autoCreating) {
      setAutoCreating(true)
      createModuleWithName('Module 1')
    }
  }, [loading, modules.length]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading || (modules.length === 0)) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center space-y-3">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-400">Setting up your course...</p>
        </div>
      </div>
    )
  }

  // ─── Split-Pane Workspace ──────────────────────────────────────
  const moduleIds = modules.map(m => `module-${m.id}`)

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Split pane — fills all space between progress bar and footer */}
        <div className="flex-1 flex min-h-0">
          {/* ─── Left: Outline Sidebar ─── */}
          <div className="w-60 flex-shrink-0 border-r border-gray-200 flex flex-col bg-gray-50">
            {/* Sidebar header */}
            <div className="px-3 pt-2.5 pb-2 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Outline</span>
                <span className="text-xs text-gray-400">
                  {modules.length} module{modules.length !== 1 ? 's' : ''} &middot; {totalLessons} lesson{totalLessons !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setShowModulePopup(true)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
                >
                  + Module
                </button>
                <button
                  onClick={() => setShowCSVImport(true)}
                  className="flex-1 border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 rounded-md px-3 py-1.5 text-xs transition-colors"
                >
                  Import CSV
                </button>
              </div>
            </div>

            {/* Module list */}
            <div className="flex-1 overflow-y-auto px-1 py-1">
              {showModulePopup && (
                <div className="mb-2 px-1">
                  <ModuleNamePopup
                    onSubmit={createModuleWithName}
                    onCancel={() => setShowModulePopup(false)}
                  />
                </div>
              )}

              <SortableContext items={moduleIds} strategy={verticalListSortingStrategy}>
                {modules.map(mod => (
                  <SortableSidebarModule
                    key={mod.id}
                    mod={mod}
                    expanded={expandedModules.has(mod.id)}
                    onToggle={() => toggleModule(mod.id)}
                    onEditTitle={(title) => editModuleTitle(mod.id, title)}
                    onDeleteModule={() => deleteModule(mod.id)}
                    onDuplicateModule={() => duplicateModule(mod.id)}
                    onAddLesson={() => addLesson(mod.id)}
                    activeLessonId={activeLessonId}
                    onSelectLesson={(id) => { setActiveLessonId(id); setActiveTestId(null) }}
                    onDeleteLesson={deleteLesson}
                    onDuplicateLesson={duplicateLesson}
                    onMoveLesson={moveLesson}
                    onPreviewLesson={openLessonPreview}
                    onRenameLesson={renameLesson}
                    modules={modules}
                    moduleTests={tests.filter(t => t.module_id === mod.id)}
                    activeTestId={activeTestId}
                    onSelectTest={(id) => { setActiveTestId(id); setActiveLessonId(null) }}
                    onAddQuiz={() => addTest('module_quiz', mod.id)}
                  />
                ))}
              </SortableContext>

              {/* Module quiz items rendered after each module's lessons */}
              {tests.filter(t => t.test_type !== 'module_quiz').length > 0 && (
                <div className="mt-3 mb-1 px-2">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Tests</span>
                </div>
              )}
              {tests.filter(t => t.test_type !== 'module_quiz').map(t => (
                <button
                  key={t.id}
                  onClick={() => { setActiveTestId(t.id); setActiveLessonId(null) }}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors mb-0.5 ${
                    activeTestId === t.id ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                  </svg>
                  <span className="text-[11px] font-medium truncate flex-1">{t.title}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                    t.status === 'published' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {t.question_count}q
                  </span>
                </button>
              ))}

              {/* Add test buttons */}
              <div className="mt-2 px-1 space-y-1">
                <button
                  onClick={() => addTest('practice_exam')}
                  className="w-full py-1.5 border border-dashed border-gray-200 rounded-lg text-[11px] text-gray-400 hover:text-purple-500 hover:border-purple-300 transition-colors"
                >
                  + Practice exam
                </button>
                {!tests.some(t => t.test_type === 'final_assessment') && (
                  <button
                    onClick={() => addTest('final_assessment')}
                    className="w-full py-1.5 border border-dashed border-gray-200 rounded-lg text-[11px] text-gray-400 hover:text-amber-500 hover:border-amber-300 transition-colors"
                  >
                    + Final assessment
                  </button>
                )}
              </div>

              {/* + Add module (bottom) */}
              {!showModulePopup && (
                <button
                  onClick={() => setShowModulePopup(true)}
                  className="w-full mt-1 py-2 border border-dashed border-gray-200 rounded-lg text-[11px] text-gray-400 hover:text-blue-500 hover:border-blue-300 transition-colors"
                >
                  + Add module
                </button>
              )}
            </div>

            {/* Sidebar footer */}
            <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200">
              <SaveStatusIndicator status={saveStatus} />
              <button
                onClick={() => {
                  const firstLesson = modules.flatMap(m => m.lessons)[0]
                  if (firstLesson) openLessonPreview(firstLesson.id)
                }}
                className="text-[11px] text-blue-500 hover:text-blue-700 font-medium"
              >
                Preview
              </button>
            </div>
          </div>

          {/* ─── Right: Lesson/Test Editor ─── */}
          <div className="flex-1 overflow-y-auto p-5">
            {activeTestId ? (
              <TestEditor
                courseId={courseId}
                testId={activeTestId}
                onClose={() => setActiveTestId(null)}
                onTestUpdated={fetchData}
              />
            ) : activeLesson ? (
              <StepSequencer
                courseId={courseId}
                lesson={activeLesson}
                modules={modules}
                cardColor={accentColor}
                onCollapse={() => setActiveLessonId(null)}
                onLessonUpdated={fetchData}
              />
            ) : (
              <NoLessonSelected />
            )}
          </div>
        </div>

        <DragOverlay>
          {activeId ? (
            <div className="bg-white border-2 border-blue-300 rounded-lg px-3 py-2 shadow-xl">
              <span className="text-xs font-medium text-gray-900">Moving...</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Footer bar */}
      <div className="border-t border-gray-200 px-6 py-2.5 flex items-center justify-between">
        <button onClick={onBack} className="btn-ghost px-5 py-2 text-sm">Back</button>
        <div className="flex items-center gap-4">
          {totalLessons > 0 && (
            <CompletionProgressBar modules={modules} />
          )}
          <div className="relative group">
            <button
              onClick={onPublish}
              disabled={!canPublish}
              className="px-5 py-2 text-sm font-medium rounded-lg bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Review & Publish
            </button>
            {!canPublish && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Add content to at least one lesson before publishing
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCSVImport && (
        <CSVImportModal courseId={courseId} onClose={() => setShowCSVImport(false)} onImported={fetchData} />
      )}

      {previewLesson && (
        <LearnerPreviewModal
          courseId={courseId}
          lessonId={previewLesson.lesson.id}
          lessonTitle={previewLesson.lesson.title}
          moduleName={previewLesson.module.title}
          lessonIndex={previewLesson.module.lessons.findIndex(l => l.id === previewLesson.lesson.id)}
          totalLessons={previewLesson.module.lessons.length}
          cardColor={accentColor}
          onClose={() => { setPreviewLesson(null); setPreviewQuestions([]) }}
        />
      )}
    </>
  )
}
