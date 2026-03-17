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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { SortableModuleAccordion, type Module, type Topic, type Lesson, type Assessment } from './build-course/StructureTree'
import LessonEditor from './build-course/LessonEditor'

// ─── AI Import Modal ────────────────────────────────────────
interface UploadedFile {
  id: string
  name: string
  type: string
  size_bytes: number
  status: string
}

function AIImportModal({
  courseId,
  hasModules,
  onClose,
  onImported,
  onSourceMap,
}: {
  courseId: string
  hasModules: boolean
  onClose: () => void
  onImported: () => void
  onSourceMap: (map: Record<string, string>) => void
}) {
  const [existingFiles, setExistingFiles] = useState<UploadedFile[]>([])
  const [loadingFiles, setLoadingFiles] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ modules_created: number; topics_created: number; lessons_created: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(`/api/creator/courses/${courseId}`)
      .then(r => r.json())
      .then(d => {
        if (d.files && Array.isArray(d.files)) setExistingFiles(d.files)
      })
      .catch(() => {})
      .finally(() => setLoadingFiles(false))
  }, [courseId])

  const handleUpload = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return
    setUploading(true)
    setError('')
    try {
      const formData = new FormData()
      for (let i = 0; i < selectedFiles.length; i++) {
        formData.append('files', selectedFiles[i])
      }
      const res = await fetch(`/api/creator/courses/${courseId}/upload`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Upload failed')
      } else if (data.uploaded_files) {
        setExistingFiles(prev => [...prev, ...data.uploaded_files])
      }
    } catch {
      setError('Upload failed. Please try again.')
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleGenerate = async () => {
    setGenerating(true)
    setError('')
    try {
      const res = await fetch(`/api/creator/courses/${courseId}/generate-structure`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to organize content')
        setGenerating(false)
        return
      }
      setResult(data)
      if (data.source_map) {
        onSourceMap(data.source_map)
      }
      onImported()
    } catch {
      setError('Import failed. Please try again.')
    }
    setGenerating(false)
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
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white">
                <path d="M12 16V4M12 4L8 8M12 4L16 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M20 16V18C20 19.1 19.1 20 18 20H6C4.9 20 4 19.1 4 18V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">Import Course Content</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4L12 12M4 12L12 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {result ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M5 12L10 17L20 7" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h4 className="text-base font-semibold text-gray-900 mb-1">Content Imported</h4>
            <p className="text-sm text-gray-500 mb-4">
              Your content has been organized into {result.modules_created} modules, {result.topics_created} topics, and {result.lessons_created} lessons.
            </p>
            <p className="text-xs text-gray-400 mb-4">Review and edit the structure below. Drag to reorder.</p>
            <button onClick={onClose} className="btn-primary px-6 py-2.5 text-sm">Done</button>
          </div>
        ) : generating ? (
          <div className="text-center py-8">
            <div className="w-10 h-10 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-medium text-gray-700 mb-1">Organizing your content...</p>
            <p className="text-xs text-gray-400">Organizing your content into modules, topics, and lessons. This usually takes 15-30 seconds.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">
              Upload your course materials and they will be organized into modules, topics, and lessons.
            </p>

            {hasModules && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
                <p className="text-xs text-amber-700">This will add to your existing structure. Existing modules won&apos;t be deleted.</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {loadingFiles ? (
              <div className="h-16 bg-gray-100 rounded-lg animate-pulse mb-4" />
            ) : existingFiles.length > 0 ? (
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Uploaded Files</h4>
                <div className="space-y-1.5">
                  {existingFiles.map(file => (
                    <div key={file.id} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                      <div className="w-7 h-7 rounded bg-blue-100 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-blue-600">
                          {file.name.split('.').pop()?.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">{file.name}</p>
                        <p className="text-[10px] text-gray-400">{formatBytes(file.size_bytes)}</p>
                      </div>
                      <span className="text-[10px] font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">Ready</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".docx,.csv,.txt"
              className="hidden"
              onChange={e => handleUpload(e.target.files)}
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={e => { e.preventDefault(); handleUpload(e.dataTransfer.files) }}
              onDragOver={e => e.preventDefault()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors mb-4"
            >
              {uploading ? (
                <p className="text-sm text-gray-500">Uploading...</p>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-700">
                    {existingFiles.length > 0 ? 'Add more files' : 'Upload your course materials'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">DOCX, CSV, TXT</p>
                </>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <button onClick={onClose} className="btn-ghost px-4 py-2 text-sm">Cancel</button>
              <button
                onClick={handleGenerate}
                disabled={existingFiles.length === 0}
                className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Organize into Course Structure
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── CSV Import Modal (Unified) ──────────────────────────────────
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
          Import your full course in one CSV: structure, lesson content, and questions. Use the <code className="bg-gray-100 px-1 rounded text-xs">row_type</code> column to indicate what each row is.
        </p>

        <div className="bg-gray-50 rounded-lg px-3 py-2.5 mb-4 space-y-1.5">
          <p className="text-xs font-semibold text-gray-600">Row types:</p>
          <div className="flex items-start gap-2 text-xs text-gray-500">
            <code className="bg-white border border-gray-200 px-1.5 py-0.5 rounded font-semibold text-gray-700 flex-shrink-0">structure</code>
            <span>Creates modules, topics, and lessons (deduped by title)</span>
          </div>
          <div className="flex items-start gap-2 text-xs text-gray-500">
            <code className="bg-white border border-gray-200 px-1.5 py-0.5 rounded font-semibold text-gray-700 flex-shrink-0">content</code>
            <span>Sets the markdown body for a lesson via <code className="bg-gray-100 px-1 rounded">lesson_body</code></span>
          </div>
          <div className="flex items-start gap-2 text-xs text-gray-500">
            <code className="bg-white border border-gray-200 px-1.5 py-0.5 rounded font-semibold text-gray-700 flex-shrink-0">question</code>
            <span>Adds a question linked to a lesson (MC, MS, T/F, Fill Blank, Ordering, Matching)</span>
          </div>
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

        <div className="flex items-center gap-3 mb-4">
          <button onClick={downloadFullTemplate} className="text-xs font-medium text-blue-500 hover:text-blue-700">
            Full Course Template
          </button>
          <button onClick={downloadOutlineTemplate} className="text-xs font-medium text-blue-500 hover:text-blue-700">
            Outline Only Template
          </button>
        </div>

        {result && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${result.errors.length > 0 && result.imported === 0 ? 'bg-red-50 text-red-700' : result.errors.length > 0 ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
            {result.stats ? (
              <div>
                <p className="font-medium mb-1">Imported {result.imported} item{result.imported !== 1 ? 's' : ''}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
                  {result.stats.modules > 0 && <span>{result.stats.modules} module{result.stats.modules !== 1 ? 's' : ''}</span>}
                  {result.stats.topics > 0 && <span>{result.stats.topics} topic{result.stats.topics !== 1 ? 's' : ''}</span>}
                  {result.stats.lessons > 0 && <span>{result.stats.lessons} lesson{result.stats.lessons !== 1 ? 's' : ''}</span>}
                  {result.stats.content > 0 && <span>{result.stats.content} lesson bod{result.stats.content !== 1 ? 'ies' : 'y'}</span>}
                  {result.stats.questions > 0 && <span>{result.stats.questions} question{result.stats.questions !== 1 ? 's' : ''}</span>}
                </div>
              </div>
            ) : (
              <p className="font-medium">Imported {result.imported} item{result.imported !== 1 ? 's' : ''}</p>
            )}
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

// ─── CSV Import Questions Modal ──────────────────────────────────
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
export default function StepBuildCourse({
  courseId,
  onBack,
  onNext,
  courseFormat,
}: {
  courseId: string
  onBack: () => void
  onNext: () => void
  courseFormat?: CourseFormat
}) {
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set())
  const [showCSVImport, setShowCSVImport] = useState(false)
  const [showAIImport, setShowAIImport] = useState(false)
  const [showQImport, setShowQImport] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [newTopicId, setNewTopicId] = useState<string | null>(null)
  const [newLessonId, setNewLessonId] = useState<string | null>(null)
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null)
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [sourceMap, setSourceMap] = useState<Record<string, string>>({})
  const [importingAll, setImportingAll] = useState(false)
  const [importAllConfirm, setImportAllConfirm] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const hasSourceMap = Object.keys(sourceMap).length > 0

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Load source_map from sessionStorage (backward compat)
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(`source_map_${courseId}`)
      if (saved) {
        setSourceMap(JSON.parse(saved))
        sessionStorage.removeItem(`source_map_${courseId}`)
      }
    } catch { /* ignore */ }
  }, [courseId])

  // ─── Fetch Data ──────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/creator/courses/${courseId}`)
      const data = await res.json()
      if (data.modules) {
        const enriched: Module[] = await Promise.all(
          (data.modules as Module[]).map(async (mod) => {
            const topicsWithDetails: Topic[] = await Promise.all(
              (mod.topics || []).map(async (t) => {
                let lessons: Lesson[] = []
                try {
                  const lessonsRes = await fetch(`/api/creator/courses/${courseId}/topics/${t.id}/lessons`)
                  const lessonsData = await lessonsRes.json()
                  if (Array.isArray(lessonsData)) {
                    lessons = lessonsData.map((l: Lesson) => ({
                      id: l.id,
                      title: l.title,
                      body: l.body || '',
                      display_order: l.display_order,
                      question_count: l.question_count,
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
        if (enriched.length > 0 && expandedModules.size === 0) {
          setExpandedModules(new Set([enriched[0].id]))
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

  // Load assessments
  useEffect(() => {
    fetch(`/api/creator/courses/${courseId}/assessments`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setAssessments(data) })
      .catch(() => {})
  }, [courseId])

  // ─── Find selected lesson info ──────────────────────────────
  const findLessonInfo = () => {
    if (!selectedLessonId) return null
    for (const mod of modules) {
      for (const topic of mod.topics) {
        const lesson = topic.lessons.find(l => l.id === selectedLessonId)
        if (lesson) return { lesson, topicId: topic.id, moduleId: mod.id }
      }
    }
    return null
  }

  const selectedInfo = findLessonInfo()

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
              ? { ...t, lessons: [...t.lessons, { id: lesson.id, title: lesson.title, body: '', display_order: lesson.display_order }] }
              : t
          ),
        })))
        setNewLessonId(lesson.id)
        setExpandedTopics(prev => new Set([...prev, topicId]))
        setSelectedLessonId(lesson.id)
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
    if (selectedLessonId === lessonId) setSelectedLessonId(null)
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

  // ─── Lesson updated from editor ────────────────────────────
  const handleLessonUpdated = (updatedLesson: Lesson) => {
    setModules(prev => prev.map(m => ({
      ...m,
      topics: m.topics.map(t => ({
        ...t,
        lessons: t.lessons.map(l => l.id === updatedLesson.id ? { ...l, ...updatedLesson } : l),
      })),
    })))
  }

  const handleLessonDeleted = (lessonId: string) => {
    deleteLesson(lessonId)
  }

  // ─── Import All from Source ────────────────────────────────
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
      await fetchData()
    } catch (err) {
      console.error('Bulk import failed:', err)
    }
    setImportingAll(false)
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
      return
    }

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
      <div className="space-y-3 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="h-4 w-64 bg-gray-100 rounded" />
        <div className="flex gap-4">
          <div className="w-[380px] h-96 bg-gray-100 rounded-xl" />
          <div className="flex-1 h-96 bg-gray-100 rounded-xl" />
        </div>
      </div>
    )
  }

  const moduleIds = modules.map(m => `module-${m.id}`)
  const allTopicIds = modules.flatMap(m => m.topics.map(t => t.id))

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Build Course</h2>
          <p className="text-sm text-gray-500">Organize structure, write lessons, and add questions.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAIImport(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-white">
                <path d="M12 16V4M12 4L8 8M12 4L16 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M20 16V18C20 19.1 19.1 20 18 20H6C4.9 20 4 19.1 4 18V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Upload &amp; Organize
            </span>
          </button>
          <button onClick={() => setShowCSVImport(true)} className="btn-ghost px-3 py-2 text-sm">
            CSV Import
          </button>
          {hasSourceMap && (
            importingAll ? (
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600">
                <div className="w-4 h-4 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
                Importing...
              </div>
            ) : (
              <button
                onClick={() => setImportAllConfirm(true)}
                className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Import All from Source
              </button>
            )
          )}
          {modules.length > 0 && (
            <span className="text-sm text-gray-400 ml-1">
              {modules.length}m &middot; {totalTopics}t &middot; {totalLessons}l
            </span>
          )}
        </div>
      </div>

      {/* Import All confirmation */}
      {importAllConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setImportAllConfirm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-900 mb-2">Import All from Source?</h3>
            <p className="text-sm text-gray-500 mb-4">
              Your uploaded content will be organized into lesson format for all empty lessons that have source material. This may take a few minutes.
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

      {/* Empty State */}
      {modules.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-gray-400">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">Start building your course</h3>
          <p className="text-sm text-gray-500 mb-6">Add modules, then topics within each module, then lessons within each topic.</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setShowAIImport(true)}
              className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-white">
                  <path d="M12 16V4M12 4L8 8M12 4L16 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M20 16V18C20 19.1 19.1 20 18 20H6C4.9 20 4 19.1 4 18V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Upload &amp; Organize
              </span>
            </button>
            <button onClick={addModule} className="btn-primary px-5 py-2.5 text-sm">
              + Add First Module
            </button>
            <button onClick={() => setShowCSVImport(true)} className="btn-ghost px-5 py-2.5 text-sm">
              CSV Import
            </button>
          </div>
        </div>
      ) : (
        /* Split Panel Layout */
        <div className="flex gap-0 min-h-[600px] border border-gray-200 rounded-xl overflow-hidden">
          {/* Left Panel — Structure Tree */}
          <div className="w-[380px] flex-shrink-0 bg-gray-50 border-r border-gray-200 flex flex-col">
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={moduleIds} strategy={verticalListSortingStrategy}>
                  {modules.map(mod => (
                    <SortableModuleAccordion
                      key={mod.id}
                      mod={mod}
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
                      selectedLessonId={selectedLessonId}
                      onSelectLesson={setSelectedLessonId}
                      assessments={assessments}
                    />
                  ))}
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

              <div ref={bottomRef}>
                <button
                  onClick={addModule}
                  className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-400 hover:text-blue-500 hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
                >
                  + Add Module
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel — Lesson Editor */}
          <div className="flex-1 bg-white overflow-y-auto p-6">
            {selectedInfo ? (
              <LessonEditor
                key={selectedInfo.lesson.id}
                courseId={courseId}
                lesson={selectedInfo.lesson}
                topicId={selectedInfo.topicId}
                sourceMap={sourceMap}
                courseFormat={courseFormat}
                onLessonUpdated={handleLessonUpdated}
                onLessonDeleted={handleLessonDeleted}
                onQuestionCreated={fetchData}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-gray-300 mb-4">
                  <path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="text-sm">Select a lesson from the sidebar to start editing</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
        <button onClick={onBack} className="btn-ghost px-5 py-2.5 text-sm">Back</button>
        <button
          onClick={onNext}
          disabled={modules.length === 0 || totalTopics === 0}
          className="btn-primary px-6 py-2.5 text-sm disabled:opacity-50"
        >
          Continue to Review
        </button>
      </div>

      {/* Modals */}
      {showCSVImport && (
        <CSVImportModal
          courseId={courseId}
          onClose={() => setShowCSVImport(false)}
          onImported={fetchData}
        />
      )}

      {showAIImport && (
        <AIImportModal
          courseId={courseId}
          hasModules={modules.length > 0}
          onClose={() => setShowAIImport(false)}
          onImported={fetchData}
          onSourceMap={(map) => setSourceMap(prev => ({ ...prev, ...map }))}
        />
      )}

      {showQImport && (
        <CSVImportQuestionsModal
          courseId={courseId}
          onClose={() => setShowQImport(false)}
          onImported={fetchData}
        />
      )}
    </div>
  )
}
