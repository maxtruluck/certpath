'use client'

import { useState, useEffect, useCallback } from 'react'
import OutlinePanel from './OutlinePanel'
import StepSequencer from '@/app/(creator)/creator/courses/new/components/build/StepSequencer'
import type { Module, Lesson } from '@/app/(creator)/creator/courses/new/components/build/types'
import ImportEmptyState from './ImportEmptyState'
import ImportModal from './ImportModal'
import ImportProcessingOverlay, { type ImportStep } from './ImportProcessingOverlay'

export default function LessonEditorLayout({
  courseId,
  courseTitle,
  category,
}: {
  courseId: string
  courseTitle?: string
  category?: string
  onBack?: () => void
  onContinue?: () => void
}) {
  const [modules, setModules] = useState<Module[]>([])
  const [activeLesson, setActiveLesson] = useState<string | null>(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importStep, setImportStep] = useState<ImportStep | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // ─── Data Loading ──────────────────────────────────────────────
  const loadCourseData = useCallback(async () => {
    try {
      const res = await fetch(`/api/creator/courses/${courseId}`)
      const data = await res.json()
      if (!data.error && data.modules) {
        setModules(data.modules)
        // Auto-select first lesson if none active
        if (!activeLesson) {
          const firstLesson = data.modules[0]?.lessons?.[0]
          if (firstLesson) {
            setActiveLesson(firstLesson.id)
          }
        }
      }
    } catch {}
    setLoading(false)
  }, [courseId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadCourseData()
  }, [loadCourseData])

  // ─── Lesson Selection ──────────────────────────────────────────
  const selectLesson = useCallback((lessonId: string) => {
    setActiveLesson(lessonId)
  }, [])

  // ─── Find active lesson object ────────────────────────────────
  let activeLessonObj: Lesson | null = null
  for (const mod of modules) {
    const lesson = mod.lessons.find(l => l.id === activeLesson)
    if (lesson) {
      activeLessonObj = lesson
      break
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse text-sm text-gray-400">Loading editor...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left: Outline */}
      <OutlinePanel
        modules={modules}
        activeLesson={activeLesson}
        onSelectLesson={selectLesson}
        courseId={courseId}
        onDataChanged={loadCourseData}
        onImport={() => setShowImportModal(true)}
      />

      {/* Center: Step Sequencer */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeLesson && activeLessonObj ? (
          <div className="flex-1 overflow-y-auto" style={{ padding: '24px 32px' }}>
            <StepSequencer
              courseId={courseId}
              lesson={activeLessonObj}
              modules={modules}
              cardColor="#2C2825"
              onCollapse={() => {}}
              onLessonUpdated={loadCourseData}
            />
          </div>
        ) : modules.length === 0 ? (
          <ImportEmptyState
            onImport={() => setShowImportModal(true)}
            onStartFromScratch={async () => {
              try {
                const modRes = await fetch(`/api/creator/courses/${courseId}/modules`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ title: 'Module 1' }),
                })
                const mod = await modRes.json()
                if (mod.id) {
                  const lessonRes = await fetch(`/api/creator/courses/${courseId}/modules/${mod.id}/lessons`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: 'Lesson 1' }),
                  })
                  const lesson = await lessonRes.json()
                  await loadCourseData()
                  if (lesson.id) selectLesson(lesson.id)
                }
              } catch {}
            }}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
            Select a lesson from the outline
          </div>
        )}

      </div>

      {/* Import Modal */}
      {showImportModal && (
        <ImportModal
          courseId={courseId}
          courseTitle={courseTitle || ''}
          category={category || ''}
          onClose={() => setShowImportModal(false)}
          onImportStart={() => {
            setImportStep('extracting')
            setImportError(null)
            setTimeout(() => setImportStep('structuring'), 2000)
          }}
          onImportComplete={async () => {
            setImportStep('inserting')
            setTimeout(async () => {
              setImportStep('done')
              await loadCourseData()
              setTimeout(() => {
                setImportStep(null)
                const firstLesson = modules[0]?.lessons?.[0]
                if (firstLesson) selectLesson(firstLesson.id)
              }, 1000)
            }, 1000)
          }}
          onImportError={(error) => {
            setImportStep('error')
            setImportError(error)
          }}
        />
      )}

      {/* Processing Overlay */}
      {importStep && (
        <ImportProcessingOverlay
          currentStep={importStep}
          errorMessage={importError || undefined}
          onCancel={() => {
            setImportStep(null)
            setImportError(null)
          }}
        />
      )}
    </div>
  )
}
