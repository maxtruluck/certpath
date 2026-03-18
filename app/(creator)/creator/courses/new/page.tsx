'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import StepCourseInfo, { type CourseFormData, INITIAL_FORM } from './components/StepCourseInfo'
import StepBuildCourse from './components/StepBuildCourse'

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

  const stepLabels = ['Course Info', 'Build Course']
  const totalSteps = stepLabels.length

  // ─── Session persistence ─────────────────────────────────────
  const storageKey = `createCourse_${editId || 'new'}`
  const isInitialized = useRef(false)

  // Restore state from sessionStorage on mount
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
      }))
    } catch { /* ignore */ }
  }, [formJson, step, courseId, editId, storageKey])

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
              category: d.category || 'Cybersecurity',
              difficulty: d.difficulty || 'beginner',
              is_free: d.is_free ?? true,
              price_cents: d.price_cents || 0,
              thumbnail_url: d.thumbnail_url || '',
              tags: d.tags || [],
            })
            setCourseId(editId)
            // If course has modules, jump to build step
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

  const handlePublish = async () => {
    if (!courseId) return
    try {
      const res = await fetch(`/api/creator/courses/${courseId}/publish`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Failed to publish')
        return
      }
      // Clear wizard session data
      sessionStorage.removeItem(storageKey)
      // Redirect to My Courses
      router.push('/creator/courses')
    } catch {
      alert('Failed to publish. Please try again.')
    }
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
        />
      )}
      {step === 2 && courseId && (
        <StepBuildCourse
          courseId={courseId}
          onBack={() => setStep(1)}
          onPublish={handlePublish}
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
