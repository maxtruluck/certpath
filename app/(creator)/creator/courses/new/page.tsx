'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

// ─── Types ───────────────────────────────────────────────────────
interface CourseFormData {
  title: string
  description: string
  category: string
  difficulty: string
  is_free: boolean
  price_cents: number
  provider_name: string
  exam_fee_cents: number
  passing_score: number
  exam_duration_minutes: number
  total_questions_on_exam: number
  max_score: number
}

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

interface SubmitResult {
  status: string
  warnings: string[]
  stats: { question_count: number; module_count: number; topic_count: number }
}

const CATEGORIES = [
  { value: 'certification', label: 'Certification' },
  { value: 'academic', label: 'Academic' },
  { value: 'professional', label: 'Professional' },
  { value: 'general_knowledge', label: 'General Knowledge' },
  { value: 'institutional', label: 'Institutional' },
]

const DIFFICULTIES = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

const INITIAL_FORM: CourseFormData = {
  title: '',
  description: '',
  category: 'certification',
  difficulty: 'beginner',
  is_free: true,
  price_cents: 0,
  provider_name: '',
  exam_fee_cents: 0,
  passing_score: 0,
  exam_duration_minutes: 0,
  total_questions_on_exam: 0,
  max_score: 0,
}

// ─── Step Indicator ──────────────────────────────────────────────
function StepIndicator({ current, steps }: { current: number; steps: string[] }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((label, i) => {
        const stepNum = i + 1
        const isActive = stepNum === current
        const isDone = stepNum < current
        return (
          <div key={label} className="flex items-center gap-2">
            {i > 0 && (
              <div className={`w-8 h-px ${isDone ? 'bg-blue-500' : 'bg-gray-200'}`} />
            )}
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                  isDone
                    ? 'bg-blue-500 text-white'
                    : isActive
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {isDone ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7L6 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  stepNum
                )}
              </div>
              <span className={`text-xs font-medium ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Step 1: Course Info ─────────────────────────────────────────
function StepCourseInfo({
  form,
  onChange,
  onContinue,
  onSaveDraft,
  saving,
}: {
  form: CourseFormData
  onChange: (updates: Partial<CourseFormData>) => void
  onContinue: () => void
  onSaveDraft: () => void
  saving: boolean
}) {
  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Course Information</h2>
      <p className="text-sm text-gray-500 mb-6">Fill in the basic details about your course.</p>

      <div className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Course Title</label>
          <input
            type="text"
            value={form.title}
            onChange={e => onChange({ title: e.target.value })}
            placeholder="e.g., CompTIA Security+ SY0-701"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Category + Difficulty */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
            <select
              value={form.category}
              onChange={e => onChange({ category: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Difficulty</label>
            <select
              value={form.difficulty}
              onChange={e => onChange({ difficulty: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              {DIFFICULTIES.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Price */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Pricing</label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={form.is_free}
                  onChange={() => onChange({ is_free: true, price_cents: 0 })}
                  className="text-blue-500"
                />
                Free
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={!form.is_free}
                  onChange={() => onChange({ is_free: false })}
                  className="text-blue-500"
                />
                Paid
              </label>
            </div>
          </div>
          {!form.is_free && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Price ($)</label>
              <input
                type="number"
                value={form.price_cents / 100 || ''}
                onChange={e => onChange({ price_cents: Math.round(parseFloat(e.target.value || '0') * 100) })}
                placeholder="29.99"
                min="0"
                step="0.01"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          )}
        </div>

        {/* Provider / Exam details */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Provider Name</label>
            <input
              type="text"
              value={form.provider_name}
              onChange={e => onChange({ provider_name: e.target.value })}
              placeholder="e.g., CompTIA"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Exam Fee ($)</label>
            <input
              type="number"
              value={form.exam_fee_cents / 100 || ''}
              onChange={e => onChange({ exam_fee_cents: Math.round(parseFloat(e.target.value || '0') * 100) })}
              placeholder="392"
              min="0"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Passing Score</label>
            <input
              type="number"
              value={form.passing_score || ''}
              onChange={e => onChange({ passing_score: parseInt(e.target.value || '0') })}
              placeholder="750"
              min="0"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Exam Duration (min)</label>
            <input
              type="number"
              value={form.exam_duration_minutes || ''}
              onChange={e => onChange({ exam_duration_minutes: parseInt(e.target.value || '0') })}
              placeholder="90"
              min="0"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Score</label>
            <input
              type="number"
              value={form.max_score || ''}
              onChange={e => onChange({ max_score: parseInt(e.target.value || '0') })}
              placeholder="900"
              min="0"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
          <textarea
            value={form.description}
            onChange={e => onChange({ description: e.target.value })}
            rows={4}
            placeholder="Describe what learners will gain from this course..."
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
        <button
          onClick={onSaveDraft}
          disabled={saving}
          className="btn-ghost px-5 py-2.5 text-sm"
        >
          Save Draft
        </button>
        <button
          onClick={onContinue}
          disabled={!form.title || saving}
          className="btn-primary px-6 py-2.5 text-sm disabled:opacity-50"
        >
          Continue to Upload
        </button>
      </div>
    </div>
  )
}

// ─── Step 2: Upload Content ──────────────────────────────────────
function StepUpload({
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

      {/* Drag/drop zone */}
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

      {/* Uploaded files */}
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

      {/* Supported formats */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-800 mb-2">Supported Formats</h4>
        <div className="flex flex-wrap gap-2">
          {['PDF', 'DOCX', 'TXT', 'CSV', 'PPTX', 'XLSX'].map(fmt => (
            <span key={fmt} className="text-xs bg-white px-2 py-1 rounded text-blue-600 font-medium">
              .{fmt.toLowerCase()}
            </span>
          ))}
        </div>
        <p className="text-xs text-blue-600 mt-2">
          Need a template?{' '}
          <button
            className="underline font-medium"
            onClick={() => {
              const csv = 'question,option_a,option_b,option_c,option_d,correct,explanation,difficulty,tags\n"What is the capital of France?","London","Paris","Berlin","Madrid","b","Paris is the capital of France.",2,"geography;capitals"'
              const blob = new Blob([csv], { type: 'text/csv' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url; a.download = 'openED-question-template.csv'; a.click()
              URL.revokeObjectURL(url)
            }}
          >Download CSV template</button>
          {' '}or{' '}
          <button
            className="underline font-medium"
            onClick={() => {
              const txt = `OpenED Course Content Template\n\n=== STUDY NOTES ===\n\n[Topic Title]\n\n[Write your teaching content here. Include definitions, explanations, examples, and key concepts.]\n\n\n=== PRACTICE QUESTIONS ===\n\n1. [Question text]\na) [Option A]\nb) [Option B]\nc) [Option C]\nd) [Option D]\nAnswer: b\nExplanation: [Why this is correct]\n\n2. True or False: [Statement]\nAnswer: True/False\nExplanation: [Why]\n`
              const blob = new Blob([txt], { type: 'text/plain' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url; a.download = 'openED-content-template.txt'; a.click()
              URL.revokeObjectURL(url)
            }}
          >Download TXT template</button>
        </p>
      </div>

      {/* Actions */}
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

// ─── Step 3: Processing ──────────────────────────────────────────
function StepProcessing({
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

    // Start processing, then poll for real status
    async function run() {
      // Always attempt to start — the API handles deduplication via pending/processing check
      console.log('[Processing] Starting job for course:', courseId)
      try {
        const startRes = await fetch(`/api/creator/courses/${courseId}/process`, { method: 'POST' })
        const startData = await startRes.json()
        console.log('[Processing] Start response:', startData)
      } catch (e) {
        console.warn('[Processing] Start request failed (may already be running):', e)
      }

      // Poll for status every 3 seconds
      const poll = async () => {
        if (cancelled) return
        try {
          const res = await fetch(`/api/creator/courses/${courseId}/process/status`)
          const data = await res.json()

          console.log(`[Processing] Poll → status: ${data.status} | progress: ${data.progress}% | step: ${data.current_step || 'n/a'}`)

          if (data.steps) {
            setSteps(data.steps.map((s: { name: string; status: string }) => ({
              name: s.name,
              status: s.status,
            })))
          }
          setProgress(data.progress || 0)

          if (data.status === 'complete') {
            console.log('[Processing] Complete!', data.result)
            setProgress(100)
            setSteps(prev => prev.map(s => ({ ...s, status: 'complete' })))
            setTimeout(onComplete, 800)
            return
          }

          if (data.status === 'failed') {
            console.error('[Processing] Failed:', data.error)
            setSteps(prev => prev.map(s =>
              s.status === 'in_progress' ? { ...s, status: 'failed' } : s
            ))
            return
          }

          // Keep polling
          setTimeout(poll, 3000)
        } catch (e) {
          console.warn('[Processing] Poll error:', e)
          if (!cancelled) setTimeout(poll, 5000)
        }
      }

      // Start polling after a short delay to let the job begin
      setTimeout(poll, 2000)
    }

    run()
    return () => { cancelled = true }
  }, [courseId, onComplete])

  return (
    <div className="max-w-lg mx-auto text-center">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Processing Your Content</h2>
      <p className="text-sm text-gray-500 mb-8">Our AI is analyzing your materials and generating questions.</p>

      {/* Progress bar */}
      <div className="w-full bg-gray-100 rounded-full h-3 mb-2">
        <div
          className="bg-blue-500 h-3 rounded-full transition-all duration-300 progress-shine"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-sm font-semibold text-gray-900 mb-8">{progress}%</p>

      {/* Steps checklist */}
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

// ─── Step 4: Review ──────────────────────────────────────────────
function StepReview({
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

      {/* Stats */}
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

      {/* Warnings */}
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

      {/* Course structure */}
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
          {structure.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-gray-400">
              No modules found. Processing may still be in progress.
            </div>
          )}
        </div>
      </div>

      {/* Sample questions */}
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
                <div className="flex gap-2">
                  <button className="text-xs text-blue-500 hover:underline">Edit</button>
                  <button className="text-xs text-red-500 hover:underline">Remove</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-100">
        <div className="flex gap-3">
          <button onClick={onBack} className="btn-ghost px-5 py-2.5 text-sm">Save Draft</button>
          <button className="btn-secondary px-5 py-2.5 text-sm">Download as CSV</button>
        </div>
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

// ─── Step 5: Submitted ───────────────────────────────────────────
function StepSubmitted({
  result,
}: {
  result: SubmitResult
}) {
  const router = useRouter()

  return (
    <div className="max-w-lg mx-auto text-center py-8">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M8 16L14 22L24 10" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">Course Submitted for Review</h2>
      <p className="text-sm text-gray-500 mb-8">Our team will review your course and get back to you within 48 hours.</p>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-2xl font-bold text-gray-900">{result.stats.question_count}</p>
          <p className="text-xs text-gray-500">Questions</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-2xl font-bold text-gray-900">{result.stats.module_count}</p>
          <p className="text-xs text-gray-500">Modules</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-2xl font-bold text-gray-900">{result.stats.topic_count}</p>
          <p className="text-xs text-gray-500">Topics</p>
        </div>
      </div>

      {/* Status badge */}
      <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
        <div className="w-2 h-2 rounded-full bg-amber-500" />
        In Review
      </div>

      {/* Warnings */}
      {result.warnings && result.warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 text-left">
          <h3 className="text-sm font-semibold text-amber-800 mb-2">Submitted with warnings</h3>
          <ul className="space-y-1">
            {result.warnings.map((w, i) => (
              <li key={i} className="text-xs text-amber-700">{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => router.push('/creator')}
          className="btn-primary px-6 py-2.5 text-sm"
        >
          Back to Dashboard
        </button>
        <button className="btn-ghost px-6 py-2.5 text-sm">
          Preview as Learner
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────
function CreateCourseContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')

  const [step, setStep] = useState(1)
  const [form, setForm] = useState<CourseFormData>(INITIAL_FORM)
  const [courseId, setCourseId] = useState<string | null>(editId)
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null)

  const steps = ['Course Info', 'Upload', 'Processing', 'Review', 'Submitted']

  // Load existing course if editing
  useEffect(() => {
    if (editId) {
      fetch(`/api/creator/courses/${editId}`)
        .then(r => r.json())
        .then(d => {
          if (!d.error) {
            setForm({
              title: d.title || '',
              description: d.description || '',
              category: d.category || 'certification',
              difficulty: d.difficulty || 'beginner',
              is_free: d.is_free ?? true,
              price_cents: d.price_cents || 0,
              provider_name: d.provider_name || '',
              exam_fee_cents: d.exam_fee_cents || 0,
              passing_score: d.passing_score || 0,
              exam_duration_minutes: d.exam_duration_minutes || 0,
              total_questions_on_exam: d.total_questions_on_exam || 0,
              max_score: d.max_score || 0,
            })
            setCourseId(editId)
          }
        })
        .catch(() => {})
    }
  }, [editId])

  const updateForm = (updates: Partial<CourseFormData>) => {
    setForm(prev => ({ ...prev, ...updates }))
  }

  const saveDraft = async (): Promise<string | null> => {
    setSaving(true)
    try {
      if (courseId) {
        // Update existing
        await fetch(`/api/creator/courses/${courseId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        setSaving(false)
        return courseId
      } else {
        // Create new
        const res = await fetch('/api/creator/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        const data = await res.json()
        if (data.id) {
          setCourseId(data.id)
          setSaving(false)
          return data.id
        }
        setSaving(false)
        return null
      }
    } catch {
      setSaving(false)
      return null
    }
  }

  const handleContinueToUpload = async () => {
    const id = await saveDraft()
    if (id) setStep(2)
  }

  const handleContinueToProcessing = () => {
    setStep(3)
  }

  const handleProcessingComplete = useCallback(() => {
    setStep(4)
  }, [])

  const handleSubmitForReview = async () => {
    if (!courseId) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/creator/courses/${courseId}/submit`, { method: 'POST' })
      const data = await res.json()
      setSubmitResult(data)
      setStep(5)
    } catch {
      // handle error
    }
    setSubmitting(false)
  }

  return (
    <div>
      <StepIndicator current={step} steps={steps} />

      {step === 1 && (
        <StepCourseInfo
          form={form}
          onChange={updateForm}
          onContinue={handleContinueToUpload}
          onSaveDraft={() => saveDraft()}
          saving={saving}
        />
      )}
      {step === 2 && courseId && (
        <StepUpload
          courseId={courseId}
          files={files}
          onFilesChange={setFiles}
          onBack={() => setStep(1)}
          onContinue={handleContinueToProcessing}
        />
      )}
      {step === 3 && courseId && (
        <StepProcessing
          courseId={courseId}
          onComplete={handleProcessingComplete}
        />
      )}
      {step === 4 && courseId && (
        <StepReview
          courseId={courseId}
          onSubmit={handleSubmitForReview}
          onBack={() => setStep(1)}
          submitting={submitting}
        />
      )}
      {step === 5 && submitResult && (
        <StepSubmitted result={submitResult} />
      )}
    </div>
  )
}

export default function CreateCoursePage() {
  return (
    <Suspense fallback={<div className="animate-pulse"><div className="h-8 bg-gray-100 rounded w-64 mb-6" /><div className="h-64 bg-gray-100 rounded-xl" /></div>}>
      <CreateCourseContent />
    </Suspense>
  )
}
