'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import StepCourseInfo from './components/StepCourseInfo'
import StepBuildCourse from './components/StepBuildCourse'
import StepReview from './components/StepReview'
import { useWizardStore, INITIAL_FORM } from '@/lib/store/creator-wizard'
import type { CourseFormData } from '@/lib/store/creator-wizard'

// ─── Step Config (3 steps) ─────────────────────────────────────
const STEPS = [
  { label: 'Define', number: 1 },
  { label: 'Build', number: 2 },
  { label: 'Review', number: 3 },
]

// ─── Compact Top Bar ────────────────────────────────────────────
function BuilderTopBar({
  courseTitle,
  currentStep,
  saveStatus,
  onNavigateStep,
}: {
  courseTitle: string
  currentStep: number
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
  onNavigateStep: (step: 1 | 2 | 3) => void
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
      className="flex items-center justify-between px-5 bg-white flex-shrink-0"
      style={{ height: 48, borderBottom: '1px solid #eee' }}
    >
      {/* Left: Dashboard link + title */}
      <div className="flex items-center min-w-0">
        <a
          href="/creator"
          className="text-[13px] text-[#888] hover:text-[#555] whitespace-nowrap"
        >
          &larr; Dashboard
        </a>
        <span className="text-[#ddd] mx-3 select-none">|</span>
        <span className="text-[13px] font-medium text-[#1a1a1a] truncate">
          {courseTitle || 'New Course'}
        </span>
      </div>

      {/* Center: Step dots */}
      <div className="flex items-center gap-0">
        {STEPS.map((step, idx) => {
          const isCompleted = currentStep > step.number
          const isActive = currentStep === step.number
          const isFuture = currentStep < step.number

          let dotBg = '#ddd'
          let dotColor = '#bbb'
          if (isCompleted) { dotBg = '#1D9E75'; dotColor = '#fff' }
          if (isActive) { dotBg = '#378ADD'; dotColor = '#fff' }

          return (
            <div key={step.number} className="flex items-center">
              {/* Connector line */}
              {idx > 0 && (
                <div
                  style={{
                    width: 24,
                    height: 1,
                    background: isCompleted || isActive ? '#1D9E75' : '#ddd',
                  }}
                />
              )}
              {/* Dot */}
              <button
                onClick={() => {
                  if (step.number <= currentStep) onNavigateStep(step.number as 1 | 2 | 3)
                }}
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 22,
                  height: 22,
                  background: dotBg,
                  color: dotColor,
                  fontSize: 10,
                  fontWeight: 500,
                  cursor: isFuture ? 'default' : 'pointer',
                }}
                title={step.label}
              >
                {isCompleted ? (
                  <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  step.number
                )}
              </button>
            </div>
          )
        })}
      </div>

      {/* Right: Save status + nav buttons */}
      <div className="flex items-center gap-3">
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

        {/* Step-specific nav buttons */}
        {currentStep === 1 && (
          <button
            onClick={() => onNavigateStep(2)}
            style={{
              background: '#1a1a1a',
              color: 'white',
              fontSize: 13,
              padding: '4px 16px',
              borderRadius: 6,
              fontWeight: 500,
            }}
          >
            Continue &rarr;
          </button>
        )}
        {currentStep === 2 && (
          <>
            <button
              onClick={() => onNavigateStep(1)}
              style={{
                background: 'white',
                color: '#555',
                fontSize: 13,
                padding: '4px 16px',
                borderRadius: 6,
                border: '1px solid #e5e5e5',
              }}
            >
              &larr; Define
            </button>
            <button
              onClick={() => onNavigateStep(3)}
              style={{
                background: '#1a1a1a',
                color: 'white',
                fontSize: 13,
                padding: '4px 16px',
                borderRadius: 6,
                fontWeight: 500,
              }}
            >
              Review &rarr;
            </button>
          </>
        )}
        {currentStep === 3 && (
          <button
            onClick={() => onNavigateStep(2)}
            style={{
              background: 'white',
              color: '#555',
              fontSize: 13,
              padding: '4px 16px',
              borderRadius: 6,
              border: '1px solid #e5e5e5',
            }}
          >
            &larr; Build
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
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null)
  const [creatorProfile, setCreatorProfile] = useState<{
    revenue_share_percent: number
    stripe_account_id: string | null
  }>({ revenue_share_percent: 70, stripe_account_id: null })

  const isInitialized = useRef(false)

  // Load creator profile for revenue calculations
  useEffect(() => {
    fetch('/api/creator/dashboard')
      .then(r => r.json())
      .then(d => {
        if (d.creator) {
          setCreatorProfile({
            revenue_share_percent: d.creator.revenue_share_percent || 70,
            stripe_account_id: d.creator.stripe_account_id || null,
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
            })
            setCourseId(editId)
            // Resume at last wizard step (capped at 3)
            const resumeStep = d.last_wizard_step || 1
            setStep(Math.min(resumeStep, 3) as 1 | 2 | 3)
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

  const goToStep = async (step: 1 | 2 | 3) => {
    // Validate before moving forward from step 1
    if (step > 1 && currentStep === 1) {
      if (!form.title.trim() || !form.description.trim() || !form.category) {
        return
      }
    }
    // Save before transitioning forward
    if (step > currentStep) {
      const id = await saveDraft()
      if (!id && step > 1) return // Block forward navigation if save failed
    }
    window.history.pushState({ step }, '', '')
    setStep(step)
  }

  const handlePublish = async () => {
    if (!courseId) return
    try {
      await saveDraft()
      const res = await fetch(`/api/creator/courses/${courseId}/publish`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Failed to publish')
        return
      }
      // Show post-publish success state
      setPublishedSlug(form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))
    } catch {
      alert('Failed to publish. Please try again.')
    }
  }

  const handleSaveDraft = async () => {
    await saveDraft()
    reset()
    router.push('/creator')
  }

  // ─── Post-Publish Success State ──────────────────────────────
  if (publishedSlug) {
    return (
      <PostPublishSuccess
        courseTitle={form.title}
        slug={publishedSlug}
        onReset={() => { reset(); router.push('/creator') }}
      />
    )
  }

  // ─── Step 3: Review & Publish ────────────────────────────────
  if (currentStep === 3 && courseId) {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        <BuilderTopBar
          courseTitle={form.title}
          currentStep={3}
          saveStatus={saveStatus}
          onNavigateStep={goToStep}
        />
        <div className="flex-1 overflow-y-auto">
          <StepReview
            courseId={courseId}
            form={form}
            onBack={() => goToStep(2)}
            onPublish={handlePublish}
            onSaveDraft={handleSaveDraft}
            revenueSharePercent={creatorProfile.revenue_share_percent}
            stripeConnected={!!creatorProfile.stripe_account_id}
          />
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
        <StepCourseInfo
          form={form}
          onChange={updateForm}
          onContinue={() => goToStep(2)}
          onSaveDraft={() => saveDraft()}
          saving={saving}
        />
      </div>
    </div>
  )
}

// ─── Post-Publish Success (Task 6) ─────────────────────────────
function PostPublishSuccess({
  courseTitle,
  slug,
  onReset,
}: {
  courseTitle: string
  slug: string
  onReset: () => void
}) {
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          onReset()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [onReset])

  return (
    <div className="min-h-screen bg-white flex items-start justify-center" style={{ paddingTop: 80 }}>
      <div className="text-center" style={{ maxWidth: 480 }}>
        {/* Green check */}
        <div
          className="mx-auto flex items-center justify-center rounded-full"
          style={{ width: 64, height: 64, background: '#E1F5EE', marginBottom: 20 }}
        >
          <div
            className="flex items-center justify-center rounded-full"
            style={{ width: 40, height: 40, background: '#1D9E75' }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 10L8.5 13.5L15 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 600, color: '#1a1a1a', marginBottom: 8 }}>
          Course published!
        </h1>
        <p style={{ fontSize: 16, color: '#555', marginBottom: 8 }}>
          {courseTitle}
        </p>
        <p style={{ fontSize: 14, color: '#999', maxWidth: 400, margin: '0 auto 28px' }}>
          Your course is now live on the marketplace. Learners can find and enroll in it right away.
        </p>

        <a
          href={`/course/${slug}`}
          style={{
            display: 'inline-block',
            background: '#1a1a1a',
            color: 'white',
            fontSize: 14,
            padding: '10px 24px',
            borderRadius: 8,
            fontWeight: 500,
            marginBottom: 16,
          }}
        >
          View your course &rarr;
        </a>

        <div>
          <a
            href="/creator"
            style={{ fontSize: 13, color: '#378ADD' }}
            className="hover:underline"
          >
            Back to dashboard
          </a>
        </div>

        <p style={{ fontSize: 12, color: '#ccc', marginTop: 24 }}>
          Redirecting to dashboard in {countdown} second{countdown !== 1 ? 's' : ''}...
        </p>
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
