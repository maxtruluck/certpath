/**
 * ARCHIVED: AI Pipeline Wizard Components
 *
 * These components were part of the original AI-powered course creation flow:
 *   Upload files → AI processes with Claude (~10min) → Review → Submit
 *
 * Preserved for potential future use as an admin review tool.
 * The API routes (upload, process, process/status) remain functional.
 *
 * Components archived:
 * - StepUpload: File upload with drag/drop
 * - StepProcessing: AI processing progress tracker
 * - StepReview: AI-generated content review
 */

'use client'

import { useState, useEffect, useRef } from 'react'

// ─── Types ───────────────────────────────────────────────────────
interface UploadedFile {
  id: string
  name: string
  type: string
  size_bytes: number
  status: string
}

interface ProcessStep {
  name: string
  status: string
}

interface ReviewData {
  course: any
  stats: { question_count: number; module_count: number; topic_count: number; flagged: number; warnings: number }
  warnings: string[]
  structure: any[]
  sample_questions: any[]
}

// ─── StepUpload ──────────────────────────────────────────────────
export function StepUpload({
  courseId,
  files,
  onFilesChange,
  onBack,
  onContinue,
}: {
  courseId: string
  files: UploadedFile[]
  onFilesChange: (files: UploadedFile[]) => void
  onBack: () => void
  onContinue: () => void
}) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return
    setUploading(true)
    setUploadError('')
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
        setUploadError(data.error || 'Upload failed')
      } else if (data.uploaded_files) {
        onFilesChange([...files, ...data.uploaded_files])
      }
    } catch {
      setUploadError('Upload failed — please try again')
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    handleFileSelect(e.dataTransfer.files)
  }

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1048576).toFixed(1)} MB`
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Upload Content</h2>
      <p className="text-sm text-gray-500 mb-6">Upload your course materials for AI processing.</p>

      {uploadError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{uploadError}</div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.docx,.txt,.csv,.pptx,.xlsx"
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
      />

      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
      >
        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-blue-500">
            <path d="M12 16V4M12 4L8 8M12 4L16 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M20 16V18C20 19.1 19.1 20 18 20H6C4.9 20 4 19.1 4 18V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-700">
          {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
        </p>
        <p className="text-xs text-gray-400 mt-1">PDF, DOCX, TXT, CSV, PPTX</p>
      </div>

      {files.length > 0 && (
        <div className="mt-6 space-y-2">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Uploaded Files</h3>
          {files.map(file => (
            <div key={file.id} className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center">
                <span className="text-xs font-bold text-blue-600">
                  {file.name.split('.').pop()?.toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                <p className="text-xs text-gray-400">{formatBytes(file.size_bytes)}</p>
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                Uploaded
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
        <button onClick={onBack} className="btn-ghost px-5 py-2.5 text-sm">Back</button>
        <button
          onClick={onContinue}
          disabled={files.length === 0}
          className="btn-primary px-6 py-2.5 text-sm disabled:opacity-50"
        >
          Submit Content
        </button>
      </div>
    </div>
  )
}

// ─── StepProcessing ──────────────────────────────────────────────
export function StepProcessing({
  courseId,
  onComplete,
}: {
  courseId: string
  onComplete: () => void
}) {
  const [progress, setProgress] = useState(0)
  const [steps, setSteps] = useState<ProcessStep[]>([
    { name: 'Parsing uploaded files', status: 'pending' },
    { name: 'Organizing into modules', status: 'pending' },
    { name: 'Identifying topics', status: 'pending' },
    { name: 'Generating questions', status: 'pending' },
    { name: 'Quality check', status: 'pending' },
  ])

  useEffect(() => {
    let cancelled = false

    async function run() {
      try {
        await fetch(`/api/creator/courses/${courseId}/process`, { method: 'POST' })
      } catch (e) {
        console.warn('[Processing] Start request failed:', e)
      }

      const poll = async () => {
        if (cancelled) return
        try {
          const res = await fetch(`/api/creator/courses/${courseId}/process/status`)
          const data = await res.json()

          if (data.steps) {
            setSteps(data.steps.map((s: { name: string; status: string }) => ({
              name: s.name,
              status: s.status,
            })))
          }
          setProgress(data.progress || 0)

          if (data.status === 'complete') {
            setProgress(100)
            setSteps(prev => prev.map(s => ({ ...s, status: 'complete' })))
            setTimeout(onComplete, 800)
            return
          }

          if (data.status === 'failed') {
            setSteps(prev => prev.map(s =>
              s.status === 'in_progress' ? { ...s, status: 'failed' } : s
            ))
            return
          }

          setTimeout(poll, 3000)
        } catch (e) {
          console.warn('[Processing] Poll error:', e)
          if (!cancelled) setTimeout(poll, 5000)
        }
      }

      setTimeout(poll, 2000)
    }

    run()
    return () => { cancelled = true }
  }, [courseId, onComplete])

  return (
    <div className="max-w-lg mx-auto text-center">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Processing Your Content</h2>
      <p className="text-sm text-gray-500 mb-8">Our AI is analyzing your materials and generating questions.</p>

      <div className="w-full bg-gray-100 rounded-full h-3 mb-2">
        <div
          className="bg-blue-500 h-3 rounded-full transition-all duration-300 progress-shine"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-sm font-semibold text-gray-900 mb-8">{progress}%</p>

      <div className="text-left space-y-3 mb-8">
        {steps.map(step => (
          <div key={step.name} className="flex items-center gap-3">
            {step.status === 'complete' ? (
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7L6 10L11 4" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            ) : step.status === 'in_progress' ? (
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-100" />
            )}
            <span className={`text-sm ${step.status === 'complete' ? 'text-gray-900' : step.status === 'in_progress' ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
              {step.name}
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400">This usually takes 2-5 minutes</p>
    </div>
  )
}

// ─── StepReview (AI-generated) ───────────────────────────────────
export function StepReview({
  courseId,
  onSubmit,
  onBack,
  submitting,
}: {
  courseId: string
  onSubmit: () => void
  onBack: () => void
  submitting: boolean
}) {
  const [review, setReview] = useState<ReviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch(`/api/creator/courses/${courseId}/review`)
      .then(r => r.json())
      .then(d => setReview(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [courseId])

  const toggleModule = (id: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="grid grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-20 bg-gray-200 rounded-xl" />)}
        </div>
        <div className="h-48 bg-gray-200 rounded-xl" />
      </div>
    )
  }

  if (!review) return <p className="text-gray-500">Failed to load review data.</p>

  const { stats, warnings, structure, sample_questions } = review

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Review Course Structure</h2>
      <p className="text-sm text-gray-500 mb-6">Review the generated content before submitting for review.</p>

      <div className="grid grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Questions', value: stats.question_count, color: 'blue' },
          { label: 'Modules', value: stats.module_count, color: 'blue' },
          { label: 'Topics', value: stats.topic_count, color: 'blue' },
          { label: 'Flagged', value: stats.flagged, color: 'red' },
          { label: 'Warnings', value: stats.warnings, color: 'amber' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className={`text-2xl font-bold ${s.color === 'red' ? 'text-red-600' : s.color === 'amber' ? 'text-amber-600' : 'text-gray-900'}`}>
              {s.value}
            </p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-semibold text-amber-800 mb-2">Warnings ({warnings.length})</h3>
          <ul className="space-y-1">
            {warnings.map((w, i) => (
              <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                <span className="mt-0.5">&#9888;</span>
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 mb-6">
        <div className="px-5 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Course Structure</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {structure.map((mod: any) => (
            <div key={mod.id}>
              <button
                onClick={() => toggleModule(mod.id)}
                className="w-full px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${expandedModules.has(mod.id) ? 'rotate-90' : ''}`}
                    fill="none" viewBox="0 0 24 24"
                  >
                    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-sm font-medium text-gray-900">{mod.title}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>{mod.topics?.length || 0} topics</span>
                  <span>{mod.question_count} questions</span>
                </div>
              </button>
              {expandedModules.has(mod.id) && mod.topics && (
                <div className="px-5 pb-3 pl-12 space-y-1">
                  {mod.topics.map((topic: any) => (
                    <div key={topic.id} className="flex items-center justify-between py-1.5">
                      <span className="text-sm text-gray-600">{topic.title}</span>
                      <span className="text-xs text-gray-400">{topic.question_count} questions</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {sample_questions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 mb-6">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Sample Questions</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {sample_questions.map((q: any, i: number) => (
              <div key={q.id || i} className="px-5 py-4">
                <p className="text-sm text-gray-900 mb-2">{q.question_text}</p>
                {q.options && (
                  <div className="space-y-1 mb-2">
                    {(Array.isArray(q.options) ? q.options : []).map((opt: any, j: number) => (
                      <p key={j} className={`text-xs px-3 py-1.5 rounded ${
                        q.correct_option_ids?.includes(opt.id) ? 'bg-green-50 text-green-700' : 'text-gray-500'
                      }`}>
                        {opt.id}. {opt.text}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-6 border-t border-gray-100">
        <button onClick={onBack} className="btn-ghost px-5 py-2.5 text-sm">Save Draft</button>
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="btn-primary px-6 py-2.5 text-sm disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit for Review'}
        </button>
      </div>
    </div>
  )
}
