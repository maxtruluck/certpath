'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import StepCourseInfo from './components/StepCourseInfo'
import StepBuildCourse from './components/StepBuildCourse'
import StepSettings from './components/StepSettings'
import StepReview from './components/StepReview'
import { useWizardStore, INITIAL_FORM } from '@/lib/store/creator-wizard'
import type { CourseFormData } from '@/lib/store/creator-wizard'

// ─── Step Config ────────────────────────────────────────────────
const STEPS = [
  { label: 'Define', number: 1 },
  { label: 'Build', number: 2 },
  { label: 'Settings', number: 3 },
  { label: 'Review', number: 4 },
]

// ─── Compact Top Bar ────────────────────────────────────────────
function BuilderTopBar({
  courseTitle,
  currentStep,
  saveStatus,
  onNavigateStep,
  onSettingsClick,
}: {
  courseTitle: string
  currentStep: number
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
  onNavigateStep: (step: 1 | 2 | 3 | 4) => void
  onSettingsClick?: () => void
}) {
  const saveLabels: Record<string, string> = {
    idle: '',
    saving: 'Saving...',
    saved: 'All changes saved',
    error: 'Save failed',
  }
  const saveColors: Record<string, string> = {
    idle: '',
    saving: 'text-[#888]',
    saved: 'text-[#1D9E75]',
    error: 'text-red-500',
  }

  return (
    <div
      className="flex items-center justify-between px-5 border-b border-[#eee] bg-white flex-shrink-0"
      style={{ height: 48 }}
    >
      {/* Left: Dashboard link + title */}
      <div className="flex items-center min-w-0">
        <button
          onClick={() => onNavigateStep(1)}
          className="text-[13px] text-[#888] hover:text-[#555] cursor-pointer whitespace-nowrap"
        >
          <a href="/creator" onClick={e => { e.preventDefault(); window.location.href = '/creator' }}>
            ← Dashboard
          </a>
        </button>
        <span className="text-[#ddd] mx-3 select-none">|</span>
        <span className="text-[15px] font-semibold text-[#1a1a1a] truncate">
          {courseTitle || 'Untitled Course'}
        </span>
      </div>

      {/* Right: Step dots + save status + settings */}
      <div className="flex items-center gap-[14px]">
        {/* Step dots */}
        <div className="flex items-center gap-1">
          {STEPS.map(step => {
            const isCompleted = currentStep > step.number
            const isActive = currentStep === step.number
            let bg = '#f0f0f0'
            let color = '#bbb'
            if (isCompleted) { bg = '#1D9E75'; color = '#fff' }
            if (isActive) { bg = '#378ADD'; color = '#fff' }

            return (
              <button
                key={step.number}
                onClick={() => {
                  if (step.number <= currentStep) onNavigateStep(step.number as 1 | 2 | 3 | 4)
                }}
                className="flex items-center justify-center rounded-full cursor-pointer"
                style={{
                  width: 26,
                  height: 26,
                  background: bg,
                  color,
                  fontSize: 11,
                  fontWeight: 500,
                }}
                title={step.label}
              >
                {isCompleted ? (
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  step.number
                )}
              </button>
            )
          })}
        </div>

        {/* Save status */}
        {saveStatus !== 'idle' && (
          <span className={`text-[11px] whitespace-nowrap ${saveColors[saveStatus]}`}>
            {saveStatus === 'saved' && (
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="inline mr-0.5 -mt-px">
                <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {saveLabels[saveStatus]}
          </span>
        )}

        {/* Settings button */}
        {onSettingsClick && (
          <button
            onClick={onSettingsClick}
            className="text-[12px] font-medium text-white px-4 py-1.5 rounded-md"
            style={{ background: '#222', border: 'none' }}
          >
            Settings →
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────
function CreateCourseContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')

  const {
    courseId, currentStep, form, saveStatus,
    setCourseId, setStep, updateForm, setSaveStatus, reset,
  } = useWizardStore()

  const [saving, setSaving] = useState(false)
  const [creatorProfile, setCreatorProfile] = useState<{
    revenue_share_percent: number
    is_founding_creator: boolean
  }>({ revenue_share_percent: 70, is_founding_creator: false })

  const isInitialized = useRef(false)

  // Load creator profile for revenue calculations
  useEffect(() => {
    fetch('/api/creator/dashboard')
      .then(r => r.json())
      .then(d => {
        if (d.creator) {
          setCreatorProfile({
            revenue_share_percent: d.creator.revenue_share_percent || 70,
            is_founding_creator: d.creator.is_founding_creator || false,
          })
        }
      })
      .catch(() => {})
  }, [])

  // Load existing course data if editing
  useEffect(() => {
    if (editId && editId !== courseId) {
      fetch(`/api/creator/courses/${editId}`)
        .then(r => r.json())
        .then(d => {
          if (!d.error) {
            updateForm({
              title: d.title || '',
              description: d.description || '',
              category: d.category || 'Cybersecurity',
              difficulty: d.difficulty || 'beginner',
              is_free: d.is_free ?? true,
              price_cents: d.price_cents || 0,
              tags: d.tags || [],
              prerequisites: d.prerequisites || '',
              learning_objectives: d.learning_objectives || ['', ''],
              card_color: d.card_color || '#3b82f6',
              cover_image_url: d.cover_image_url || '',
              progression_type: d.progression_type || 'linear',
            })
            setCourseId(editId)
            // Resume at last wizard step
            const resumeStep = d.last_wizard_step || 1
            setStep(Math.min(resumeStep, 4) as 1 | 2 | 3 | 4)
          }
        })
        .catch(() => {})
    }
    isInitialized.current = true
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId])

  // Browser back/swipe support
  useEffect(() => {
    window.history.replaceState({ step: currentStep }, '', '')
    const handlePopState = (e: PopStateEvent) => {
      if (e.state?.step) {
        setStep(e.state.step)
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-save course form on step transitions
  const saveDraft = useCallback(async (): Promise<string | null> => {
    setSaving(true)
    setSaveStatus('saving')
    try {
      const payload: Record<string, unknown> = {
        ...form,
        learning_objectives: form.learning_objectives.filter(o => o.trim()),
        last_wizard_step: currentStep,
      }

      if (courseId) {
        await fetch(`/api/creator/courses/${courseId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        setSaving(false)
        setSaveStatus('saved')
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
          setSaveStatus('saved')
          return data.id
        }
        setSaving(false)
        setSaveStatus('error')
        return null
      }
    } catch {
      setSaving(false)
      setSaveStatus('error')
      return null
    }
  }, [form, courseId, currentStep, setCourseId, setSaveStatus])

  // beforeunload flush
  useEffect(() => {
    const handler = () => {
      if (courseId) {
        navigator.sendBeacon(
          `/api/creator/courses/${courseId}`,
          new Blob([JSON.stringify({ last_wizard_step: currentStep })], { type: 'application/json' })
        )
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [courseId, currentStep])

  const goToStep = async (step: 1 | 2 | 3 | 4) => {
    // Save before transitioning
    if (step > currentStep) {
      const id = await saveDraft()
      if (!id && step > 1) return // Block forward navigation if save failed and no courseId
    }
    window.history.pushState({ step }, '', '')
    setStep(step)
  }

  const handlePublish = async () => {
    if (!courseId) return
    try {
      // Save final state first
      await saveDraft()
      const res = await fetch(`/api/creator/courses/${courseId}/publish`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Failed to publish')
        return
      }
      reset()
      router.push('/creator/courses')
    } catch {
      alert('Failed to publish. Please try again.')
    }
  }

  const handleSaveDraft = async () => {
    await saveDraft()
    reset()
    router.push('/creator')
  }

  // ─── Step 4: Review ──────────────────────────────────────────
  if (currentStep === 4 && courseId) {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        <BuilderTopBar
          courseTitle={form.title}
          currentStep={4}
          saveStatus={saveStatus}
          onNavigateStep={goToStep}
        />
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-10 py-10">
            <StepReview
              courseId={courseId}
              form={form}
              onBack={() => goToStep(3)}
              onPublish={handlePublish}
              onSaveDraft={handleSaveDraft}
              revenueSharePercent={creatorProfile.revenue_share_percent}
              isFoundingCreator={creatorProfile.is_founding_creator}
            />
          </div>
        </div>
      </div>
    )
  }

  // ─── Step 3: Settings ─────────────────────────────────────────
  if (currentStep === 3 && courseId) {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        <BuilderTopBar
          courseTitle={form.title}
          currentStep={3}
          saveStatus={saveStatus}
          onNavigateStep={goToStep}
          onSettingsClick={undefined}
        />
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-10 py-10">
            <StepSettings
              form={form}
              onChange={updateForm}
              onBack={() => goToStep(2)}
              onContinue={() => goToStep(4)}
              courseId={courseId}
              revenueSharePercent={creatorProfile.revenue_share_percent}
              isFoundingCreator={creatorProfile.is_founding_creator}
            />
          </div>
        </div>
      </div>
    )
  }

  // ─── Step 2: Build (full-pane layout) ─────────────────────────
  if (currentStep === 2 && courseId) {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        <BuilderTopBar
          courseTitle={form.title}
          currentStep={2}
          saveStatus={saveStatus}
          onNavigateStep={goToStep}
          onSettingsClick={() => goToStep(3)}
        />
        <StepBuildCourse
          courseId={courseId}
          cardColor={form.card_color}
          courseTitle={form.title}
          category={form.category}
          onBack={() => goToStep(1)}
          onPublish={() => goToStep(3)}
        />
      </div>
    )
  }

  // ─── Step 1: Define ───────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <BuilderTopBar
        courseTitle={form.title}
        currentStep={1}
        saveStatus={saveStatus}
        onNavigateStep={goToStep}
      />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-10 py-10">
          <StepCourseInfo
            form={form}
            onChange={updateForm}
            onContinue={() => goToStep(2)}
            onSaveDraft={() => saveDraft()}
            saving={saving}
          />
        </div>
      </div>
    </div>
  )
}

export default function CreateCoursePage() {
  return (
    <Suspense fallback={<div className="animate-pulse p-10"><div className="h-8 bg-gray-100 rounded w-64 mb-6" /><div className="h-64 bg-gray-100 rounded-xl" /></div>}>
      <CreateCourseContent />
    </Suspense>
  )
}
