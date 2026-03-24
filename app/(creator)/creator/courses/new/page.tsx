'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import StepCourseInfo, { type CourseFormData, INITIAL_FORM } from './components/StepCourseInfo'
import StepBuildCourse from './components/StepBuildCourse'
import StepReviewPublish from './components/StepReviewPublish'

// ─── 3-Step Progress Bar ─────────────────────────────────────────
const STEPS = [
  { label: 'Course Info', number: 1 },
  { label: 'Modules & Lessons', number: 2 },
  { label: 'Review & Publish', number: 3 },
]

function StepProgressBar({ current, compact }: { current: number; compact?: boolean }) {
  return (
    <div className={compact ? 'max-w-lg mx-auto' : 'max-w-lg mx-auto'}>
      <div className="flex items-center justify-between">
        {STEPS.map((step, idx) => (
          <div key={step.number} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  current >= step.number
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {current > step.number ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  step.number
                )}
              </div>
              <span className={`text-xs mt-1.5 whitespace-nowrap ${
                current >= step.number ? 'text-blue-600 font-medium' : 'text-gray-400'
              }`}>
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-3 mt-[-18px] ${
                current > step.number ? 'bg-blue-600' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
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
  const [saving, setSaving] = useState(false)

  // ─── Session persistence ─────────────────────────────────────
  const storageKey = `createCourse_${editId || 'new'}`
  const isInitialized = useRef(false)

  useEffect(() => {
    if (editId) {
      isInitialized.current = true
      return
    }
    try {
      const saved = sessionStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.form) setForm(prev => ({ ...prev, ...parsed.form }))
        if (parsed.courseId) {
          setCourseId(parsed.courseId)
          const restoredStep = parsed.step && parsed.step <= 3 ? parsed.step : parsed.step > 3 ? 3 : 1
          setStep(restoredStep)
          if (restoredStep > 1) {
            window.history.pushState({ step: restoredStep }, '', '')
          }
        }
      }
    } catch { /* ignore */ }
    // Seed browser history so popstate has a step-1 entry to land on
    window.history.replaceState({ step: 1 }, '', '')
    isInitialized.current = true
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const formJson = JSON.stringify(form)
  useEffect(() => {
    if (!isInitialized.current || editId) return
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({
        form: JSON.parse(formJson),
        step,
        courseId,
      }))
    } catch { /* ignore */ }
  }, [formJson, step, courseId, editId, storageKey])

  useEffect(() => {
    if (editId) {
      fetch(`/api/creator/courses/${editId}`)
        .then(r => r.json())
        .then(d => {
          if (!d.error) {
            setForm({
              title: d.title || '',
              description: d.description || '',
              category: d.category || 'Cybersecurity',
              difficulty: d.difficulty || 'beginner',
              is_free: d.is_free ?? true,
              price_cents: d.price_cents || 0,
              tags: d.tags || [],
              estimated_duration: d.estimated_duration || '',
              prerequisites: d.prerequisites || '',
              learning_objectives: d.learning_objectives || ['', ''],
              card_color: d.card_color || '#3b82f6',
            })
            setCourseId(editId)
            if (d.modules && d.modules.length > 0) {
              setStep(2)
            }
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
      const payload = {
        ...form,
        learning_objectives: form.learning_objectives.filter(o => o.trim()),
      }

      if (courseId) {
        await fetch(`/api/creator/courses/${courseId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        setSaving(false)
        return courseId
      } else {
        const res = await fetch('/api/creator/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
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

  // ─── Browser back/swipe support ─────────────────────────────
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state?.step === 1) {
        setStep(1)
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const handleContinueToStructure = async () => {
    const id = await saveDraft()
    if (id) {
      window.history.pushState({ step: 2 }, '', '')
      setStep(2)
    }
  }

  const handlePublish = async () => {
    if (!courseId) return
    try {
      const res = await fetch(`/api/creator/courses/${courseId}/publish`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Failed to publish')
        return
      }
      sessionStorage.removeItem(storageKey)
      router.push('/creator/courses')
    } catch {
      alert('Failed to publish. Please try again.')
    }
  }

  const handleReview = () => {
    window.history.pushState({ step: 3 }, '', '')
    setStep(3)
  }

  // ─── Step 3: Review & Publish ──────────────────────────────────
  if (step === 3 && courseId) {
    return (
      <div className="-mx-10 -my-10 flex flex-col h-screen overflow-hidden">
        <div className="border-b border-gray-200 py-3 px-6">
          <StepProgressBar current={3} compact />
        </div>
        <div className="flex-1 overflow-y-auto">
          <StepReviewPublish
            courseId={courseId}
            cardColor={form.card_color}
            onBack={() => setStep(2)}
            onPublish={handlePublish}
          />
        </div>
      </div>
    )
  }

  // ─── Step 2: full-pane layout ──────────────────────────────────
  if (step === 2 && courseId) {
    return (
      <div className="-mx-10 -my-10 flex flex-col h-screen overflow-hidden">
        {/* Progress bar strip */}
        <div className="border-b border-gray-200 py-3 px-6">
          <StepProgressBar current={2} compact />
        </div>

        {/* Content — fills remaining space */}
        <StepBuildCourse
          courseId={courseId}
          cardColor={form.card_color}
          onBack={() => setStep(1)}
          onPublish={handleReview}
        />
      </div>
    )
  }

  // ─── Step 1: normal padded layout ──────────────────────────────
  return (
    <div>
      <div className="mb-8">
        <StepProgressBar current={step} />
      </div>

      {step === 1 && (
        <StepCourseInfo
          form={form}
          onChange={updateForm}
          onContinue={handleContinueToStructure}
          onSaveDraft={() => saveDraft()}
          saving={saving}
        />
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
