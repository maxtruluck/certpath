'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import StepCourseInfo, { type CourseFormData, INITIAL_FORM } from './components/StepCourseInfo'
import StepStructureBuilder from './components/StepStructureBuilder'
import StepContentQuestions from './components/StepContentQuestions'
import StepReviewDashboard from './components/StepReviewDashboard'
import StepSubmitted from './components/StepSubmitted'
import StepFormatSelect from './components/StepFormatSelect'
import { COURSE_FORMATS, type CourseFormat } from './lib/course-formats'

// ─── Progress Bar ───────────────────────────────────────────────
function StepHeader({ current, total, label }: { current: number; total: number; label: string }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <span className="text-xs text-gray-400">Step {current} of {total}</span>
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
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<{
    status: string
    warnings: string[]
    stats: { question_count: number; module_count: number; topic_count: number }
  } | null>(null)

  // Course format state (client-side only)
  const [courseFormat, setCourseFormat] = useState<CourseFormat | null>(
    editId ? 'blank' : null
  )

  const stepLabels = ['Course Info', 'Outline', 'Content', 'Questions & Assessments', 'Review & Submit']
  const totalSteps = stepLabels.length

  // ─── Session persistence ─────────────────────────────────────
  const storageKey = `createCourse_${editId || 'new'}`
  const isInitialized = useRef(false)

  // Restore state from sessionStorage on mount
  // Only restores Step 1 form data + format. Step 2+ depend on live DB data
  // so we always start at the last safe step (1 if no courseId, else 2 max).
  useEffect(() => {
    if (editId) {
      setCourseFormat('blank')
      isInitialized.current = true
      return
    }
    try {
      const saved = sessionStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.form) setForm(prev => ({ ...prev, ...parsed.form }))
        if (parsed.courseFormat) setCourseFormat(parsed.courseFormat)
        if (parsed.courseId) {
          setCourseId(parsed.courseId)
          // Resume at saved step, but cap at step 2 since DB state may have changed
          if (parsed.step && parsed.step <= 2) setStep(parsed.step)
          else if (parsed.step > 2) setStep(2)
        }
      }
    } catch { /* ignore */ }
    isInitialized.current = true
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Save state to sessionStorage on changes
  const formJson = JSON.stringify(form)
  useEffect(() => {
    if (!isInitialized.current || editId) return
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({
        form: JSON.parse(formJson),
        step,
        courseId,
        courseFormat,
      }))
    } catch { /* ignore */ }
  }, [formJson, step, courseId, courseFormat, editId, storageKey])

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
              expected_knowledge: d.expected_knowledge || '',
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
            // If course has modules, jump to structure step
            if (d.modules && d.modules.length > 0) {
              setStep(2)
            }
          }
        })
        .catch(() => {})
    }
  }, [editId])

  const handleFormatSelect = (format: CourseFormat) => {
    setCourseFormat(format)
    // Apply format defaults to form
    const config = COURSE_FORMATS[format]
    setForm(prev => ({
      ...prev,
      category: config.defaults.category,
      difficulty: config.defaults.difficulty,
    }))
  }

  const handleChangeFormat = () => {
    setCourseFormat(null)
  }

  const updateForm = (updates: Partial<CourseFormData>) => {
    setForm(prev => ({ ...prev, ...updates }))
  }

  const saveDraft = async (): Promise<string | null> => {
    setSaving(true)
    try {
      if (courseId) {
        await fetch(`/api/creator/courses/${courseId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        setSaving(false)
        return courseId
      } else {
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

  const handleContinueToStructure = async () => {
    const id = await saveDraft()
    if (id) setStep(2)
  }

  const handleSubmitForReview = async () => {
    if (!courseId) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/creator/courses/${courseId}/submit`, { method: 'POST' })
      const data = await res.json()
      if (data.error && !data.stats) {
        // Submission failed with validation errors — stay on review
        setSubmitting(false)
        return
      }
      setSubmitResult(data)
      setStep(5)
    } catch {
      // handle error
    }
    setSubmitting(false)
  }

  // If no format selected yet and not editing, show format selector
  if (!courseFormat) {
    return <StepFormatSelect onSelect={handleFormatSelect} />
  }

  return (
    <div>
      <StepHeader current={step} total={totalSteps} label={stepLabels[step - 1]} />

      {step === 1 && (
        <StepCourseInfo
          form={form}
          onChange={updateForm}
          onContinue={handleContinueToStructure}
          onSaveDraft={() => saveDraft()}
          saving={saving}
          courseFormat={courseFormat}
          onChangeFormat={handleChangeFormat}
        />
      )}
      {step === 2 && courseId && (
        <StepStructureBuilder
          courseId={courseId}
          onBack={() => setStep(1)}
          onContinue={() => setStep(3)}
          courseFormat={courseFormat}
        />
      )}
      {step === 3 && courseId && (
        <StepContentQuestions
          courseId={courseId}
          onBack={() => setStep(2)}
          onContinue={() => setStep(4)}
          courseFormat={courseFormat}
        />
      )}
      {step === 4 && courseId && (
        <StepReviewDashboard
          courseId={courseId}
          onBack={() => setStep(3)}
          onSubmit={handleSubmitForReview}
          submitting={submitting}
          courseFormat={courseFormat}
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
