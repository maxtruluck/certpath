'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
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
import CreatorTip from './CreatorTip'

// ─── Types ───────────────────────────────────────────────────────
interface Lesson {
  id: string
  title: string
  body: string | null
  video_url: string | null
  display_order: number
  module_id: string
  question_count: number
  word_count: number
}

interface Module {
  id: string
  title: string
  display_order: number
  lessons: Lesson[]
  question_count: number
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
  lesson_id?: string | null
}

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
              Your content has been organized into {result.modules_created} modules and {result.lessons_created} lessons.
            </p>
            <p className="text-xs text-gray-400 mb-4">Review and edit the structure below. Drag to reorder.</p>
            <button onClick={onClose} className="btn-primary px-6 py-2.5 text-sm">Done</button>
          </div>
        ) : generating ? (
          <div className="text-center py-8">
            <div className="w-10 h-10 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-medium text-gray-700 mb-1">Organizing your content...</p>
            <p className="text-xs text-gray-400">Organizing your content into modules and lessons. This usually takes 15-30 seconds.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">
              Upload your course materials and they will be organized into modules and lessons.
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
            <span>Creates modules and lessons (deduped by title)</span>
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
    const csv = `lesson_title,question_text,question_type,option_a,option_b,option_c,option_d,correct_answers,explanation,difficulty,tags,blooms_level\n"Security Concepts","What does CIA stand for in information security?","multiple_choice","Confidentiality, Integrity, Availability","Central Intelligence Agency","Certified Information Auditor","None of the above","a","CIA stands for Confidentiality, Integrity, and Availability - the three pillars of information security.",2,"cia;fundamentals","remember"`
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

// ─── Status Dot ──────────────────────────────────────────────────
function StatusDot({ lesson }: { lesson: Lesson }) {
  const hasBody = !!lesson.body && lesson.body.trim().length > 0
  const hasQuestions = lesson.question_count > 0
  if (hasBody && hasQuestions) return <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
  if (hasBody || hasQuestions) return <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
  return <span className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0" />
}

// ─── Sortable Module Accordion ───────────────────────────────────
function SortableModuleCard({
  mod,
  expanded,
  onToggle,
  onEditTitle,
  onDeleteModule,
  onAddLesson,
  onEditLessonTitle,
  onDeleteLesson,
  onEditLesson,
  newLessonId,
}: {
  mod: Module
  expanded: boolean
  onToggle: () => void
  onEditTitle: (moduleId: string, title: string) => void
  onDeleteModule: (moduleId: string) => void
  onAddLesson: (moduleId: string) => void
  onEditLessonTitle: (lessonId: string, title: string) => void
  onDeleteLesson: (lessonId: string) => void
  onEditLesson: (lessonId: string) => void
  newLessonId: string | null
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
            {mod.lessons.length} lesson{mod.lessons.length !== 1 ? 's' : ''}
          </p>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); if (confirm('Delete this module and all its lessons?')) onDeleteModule(mod.id) }}
          className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0 p-1 -m-1"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 3L11 11M3 11L11 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Lessons */}
      {expanded && (
        <div className="p-3 space-y-1.5">
          {mod.lessons.map((lesson, idx) => (
            <div
              key={lesson.id}
              className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors group"
            >
              <span className="text-xs font-semibold text-gray-400 w-5 text-center flex-shrink-0">
                {idx + 1}
              </span>
              <StatusDot lesson={lesson} />
              <div className="flex-1 min-w-0">
                <InlineTitle
                  value={lesson.title}
                  onSave={(title) => onEditLessonTitle(lesson.id, title)}
                  className="text-xs text-gray-700 font-medium"
                  placeholder="Lesson title..."
                  autoEdit={lesson.id === newLessonId}
                />
              </div>
              <span className="text-[11px] text-gray-400 flex-shrink-0">
                {lesson.question_count > 0 && `${lesson.question_count}q`}
                {lesson.question_count > 0 && lesson.word_count > 0 && ' · '}
                {lesson.word_count > 0 ? `${lesson.word_count}w` : (lesson.question_count === 0 ? 'no content' : '')}
              </span>
              <button
                onClick={() => onEditLesson(lesson.id)}
                className="text-xs text-blue-500 hover:text-blue-700 font-medium flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Edit
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); if (confirm('Delete this lesson?')) onDeleteLesson(lesson.id) }}
                className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0 p-1 -m-1 opacity-0 group-hover:opacity-100"
              >
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <path d="M3 3L11 11M3 11L11 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ))}

          <button
            onClick={() => onAddLesson(mod.id)}
            className="w-full py-2.5 border border-dashed border-gray-200 rounded-lg text-xs font-medium text-gray-400 hover:text-blue-500 hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
          >
            {mod.lessons.length === 0 ? '+ Add first lesson' : '+ Add lesson'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Question Form ───────────────────────────────────────────────
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
  }, [questionType])

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

      {/* Type selector */}
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

      {/* MC / MS / TF / Ordering: Options */}
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

      {/* Ordering: Correct Order */}
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

      {/* Fill Blank: Acceptable Answers */}
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

      {/* Matching: Pairs Builder */}
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
                <span className="text-xs text-gray-400">&#8596;</span>
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

// ─── Lesson Editor Page ──────────────────────────────────────────
function LessonEditorPage({
  courseId,
  lessonId,
  modules,
  onBack,
  onNavigate,
}: {
  courseId: string
  lessonId: string
  modules: Module[]
  onBack: () => void
  onNavigate: (lessonId: string) => void
}) {
  const [lessonTitle, setLessonTitle] = useState('')
  const [lessonBody, setLessonBody] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [preview, setPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loadingQuestions, setLoadingQuestions] = useState(true)

  // Find current lesson context (module, position, neighbors)
  const lessonContext = (() => {
    for (const mod of modules) {
      const idx = mod.lessons.findIndex(l => l.id === lessonId)
      if (idx !== -1) {
        const lesson = mod.lessons[idx]
        const prev = idx > 0 ? mod.lessons[idx - 1] : null
        const next = idx < mod.lessons.length - 1 ? mod.lessons[idx + 1] : null
        return { lesson, module: mod, index: idx, prev, next, total: mod.lessons.length }
      }
    }
    return null
  })()

  // Load lesson data
  useEffect(() => {
    if (!lessonContext?.lesson) return
    setLessonTitle(lessonContext.lesson.title)
    setLessonBody(lessonContext.lesson.body || '')
    setVideoUrl(lessonContext.lesson.video_url || '')
    setPreview(false)
  }, [lessonId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Load questions
  useEffect(() => {
    setLoadingQuestions(true)
    fetch(`/api/creator/courses/${courseId}/lessons/${lessonId}/questions`)
      .then(r => r.json())
      .then(data => {
        setQuestions(Array.isArray(data) ? data : [])
      })
      .catch(() => setQuestions([]))
      .finally(() => setLoadingQuestions(false))
  }, [courseId, lessonId])

  const saveField = async (field: string, value: string) => {
    setSaving(true)
    try {
      await fetch(`/api/creator/courses/${courseId}/lessons/${lessonId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })
    } catch (err) {
      console.error(`Failed to save ${field}:`, err)
    }
    setSaving(false)
  }

  const handleQuestionCreated = (q: Question) => {
    setQuestions(prev => [...prev, q])
  }

  const deleteQuestion = async (questionId: string) => {
    try {
      await fetch(`/api/creator/courses/${courseId}/lessons/${lessonId}/questions/${questionId}`, { method: 'DELETE' })
      setQuestions(prev => prev.filter(q => q.id !== questionId))
    } catch (err) {
      console.error('Failed to delete question:', err)
    }
  }

  if (!lessonContext) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>Lesson not found.</p>
        <button onClick={onBack} className="text-blue-500 hover:text-blue-700 mt-2 text-sm">Back to outline</button>
      </div>
    )
  }

  return (
    <div>
      {/* Navigation bar */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to outline
        </button>
        <span className="text-xs text-gray-400">
          {lessonContext.module.title} &gt; Lesson {lessonContext.index + 1} of {lessonContext.total}
        </span>
        <button
          onClick={() => lessonContext.next && onNavigate(lessonContext.next.id)}
          disabled={!lessonContext.next}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-30"
        >
          Next lesson
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Lesson Title */}
      <input
        type="text"
        value={lessonTitle}
        onChange={e => setLessonTitle(e.target.value)}
        onBlur={() => { if (lessonTitle.trim() !== lessonContext.lesson.title) saveField('title', lessonTitle.trim()) }}
        className="text-xl font-bold text-gray-900 bg-transparent border-b-2 border-transparent hover:border-gray-200 focus:border-blue-500 focus:outline-none w-full mb-6"
        placeholder="Lesson title..."
      />

      {/* Video URL */}
      <div className="mb-6">
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Video URL (optional)</label>
        <input
          type="text"
          value={videoUrl}
          onChange={e => setVideoUrl(e.target.value)}
          onBlur={() => saveField('video_url', videoUrl.trim())}
          placeholder="https://youtube.com/watch?v=..."
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        />
      </div>

      {/* Lesson Content */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Lesson Content</label>
          <div className="flex gap-1">
            <button
              onClick={() => setPreview(false)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                !preview ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Write
            </button>
            <button
              onClick={() => setPreview(true)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                preview ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Preview
            </button>
          </div>
        </div>
        {preview ? (
          <div className="border border-gray-200 rounded-lg p-4 prose prose-sm max-w-none min-h-[200px] [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-gray-700 [&_ul]:text-sm [&_ul]:text-gray-700 [&_ol]:text-sm [&_ol]:text-gray-700 [&_code]:text-xs [&_code]:bg-gray-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_pre]:bg-gray-800 [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:text-xs [&_pre]:text-gray-100">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{lessonBody || '*No content yet*'}</ReactMarkdown>
          </div>
        ) : (
          <textarea
            value={lessonBody}
            onChange={e => setLessonBody(e.target.value)}
            onBlur={() => saveField('body', lessonBody)}
            rows={14}
            className="w-full text-sm border border-gray-200 rounded-lg px-4 py-3 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            placeholder="Write your lesson content in Markdown...&#10;&#10;## Heading&#10;Regular text with **bold** and *italic*&#10;&#10;> **Exam Tip:** Important tip here&#10;&#10;```&#10;code block&#10;```"
          />
        )}
      </div>

      {saving && <p className="text-xs text-gray-400 mb-2">Saving...</p>}

      {/* Questions */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">
          Questions ({questions.length})
        </h3>

        {!loadingQuestions && questions.length > 0 && (
          <div className="space-y-2 mb-4">
            {questions.map((q, idx) => (
              <div key={q.id} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-gray-900 flex-1">{idx + 1}. {q.question_text}</p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] font-medium text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">
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
          lessonId={lessonId}
          onCreated={handleQuestionCreated}
        />
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────
export default function StepBuildCourse({
  courseId,
  onBack,
  onPublish,
}: {
  courseId: string
  onBack: () => void
  onPublish: () => void
}) {
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'outline' | 'editor'>('outline')
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [showCSVImport, setShowCSVImport] = useState(false)
  const [showAIImport, setShowAIImport] = useState(false)
  const [showQImport, setShowQImport] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [newLessonId, setNewLessonId] = useState<string | null>(null)
  const [sourceMap, setSourceMap] = useState<Record<string, string>>({})
  const [importingAll, setImportingAll] = useState(false)
  const [importAllConfirm, setImportAllConfirm] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const hasSourceMap = Object.keys(sourceMap).length > 0

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Load source_map from sessionStorage
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
    } catch (err) {
      console.error('Failed to fetch course data:', err)
    }
    setLoading(false)
  }, [courseId]) // eslint-disable-line react-hooks/exhaustive-deps

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
        setModules(prev => [...prev, { ...mod, lessons: [], question_count: 0 }])
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
        setModules(prev => prev.map(m =>
          m.id === moduleId
            ? { ...m, lessons: [...m.lessons, { id: lesson.id, title: lesson.title, body: null, video_url: null, display_order: lesson.display_order, module_id: moduleId, question_count: 0, word_count: 0 }] }
            : m
        ))
        setNewLessonId(lesson.id)
        setTimeout(() => setNewLessonId(null), 2000)
      }
    } catch (err) {
      console.error('Failed to create lesson:', err)
    }
  }

  const editLessonTitle = async (lessonId: string, title: string) => {
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
      console.error('Failed to update lesson:', err)
    }
  }

  const deleteLesson = async (lessonId: string) => {
    if (selectedLessonId === lessonId) {
      setSelectedLessonId(null)
      setView('outline')
    }
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

  // ─── Edit lesson (switch to editor) ───────────────────────────
  const editLesson = (lessonId: string) => {
    setSelectedLessonId(lessonId)
    setView('editor')
  }

  // ─── Import All from Source ────────────────────────────────────
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

  // ─── Stats ───────────────────────────────────────────────────
  const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0)

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="h-4 w-64 bg-gray-100 rounded" />
        <div className="h-96 bg-gray-100 rounded-xl" />
      </div>
    )
  }

  // ─── Editor View ──────────────────────────────────────────────
  if (view === 'editor' && selectedLessonId) {
    return (
      <div>
        <LessonEditorPage
          courseId={courseId}
          lessonId={selectedLessonId}
          modules={modules}
          onBack={() => { setView('outline'); fetchData() }}
          onNavigate={(id) => setSelectedLessonId(id)}
        />
      </div>
    )
  }

  // ─── Outline View ─────────────────────────────────────────────
  const moduleIds = modules.map(m => `module-${m.id}`)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Build Course</h2>
          <p className="text-sm text-gray-500">Organize modules, write lessons, and add questions.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCSVImport(true)}
            className="btn-ghost px-3 py-2 text-sm"
          >
            CSV Import
          </button>
          <button
            onClick={addModule}
            className="btn-primary px-3 py-2 text-sm"
          >
            + Module
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
              {modules.length}m &middot; {totalLessons}l
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
          <p className="text-sm text-gray-500 mb-6">Add modules, then lessons within each module.</p>
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
        /* Module List */
        <div className="space-y-3">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={moduleIds} strategy={verticalListSortingStrategy}>
              {modules.map(mod => (
                <SortableModuleCard
                  key={mod.id}
                  mod={mod}
                  expanded={expandedModules.has(mod.id)}
                  onToggle={() => toggleModule(mod.id)}
                  onEditTitle={editModuleTitle}
                  onDeleteModule={deleteModule}
                  onAddLesson={addLesson}
                  onEditLessonTitle={editLessonTitle}
                  onDeleteLesson={deleteLesson}
                  onEditLesson={editLesson}
                  newLessonId={newLessonId}
                />
              ))}
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
      )}

      {/* Actions */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
        <button onClick={onBack} className="btn-ghost px-5 py-2.5 text-sm">Back</button>
        <button
          onClick={() => {
            if (window.confirm('Publish this course? It will be visible to learners.')) {
              onPublish()
            }
          }}
          disabled={modules.length === 0 || totalLessons === 0}
          className="px-6 py-2.5 text-sm font-medium rounded-lg bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 transition-colors"
        >
          Publish Course
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
