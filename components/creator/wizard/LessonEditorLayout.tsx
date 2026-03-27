'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import OutlinePanel from './OutlinePanel'
import MarkdownLessonEditor from './MarkdownLessonEditor'
import LessonQuestions from './LessonQuestions'
import LearnerPreviewSidebar from './LearnerPreviewSidebar'
import ImportEmptyState from './ImportEmptyState'
import ImportModal from './ImportModal'
import ImportProcessingOverlay, { type ImportStep } from './ImportProcessingOverlay'
import { useMarkdownSections, parseMarkdownSections } from './useMarkdownSections'

interface Lesson {
  id: string
  title: string
  body: string | null
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
  section_index: number
}

type EditorTab = 'content' | 'questions'

export default function LessonEditorLayout({
  courseId,
  courseTitle,
  category,
  onBack,
  onContinue,
}: {
  courseId: string
  courseTitle?: string
  category?: string
  onBack: () => void
  onContinue: () => void
}) {
  const [modules, setModules] = useState<Module[]>([])
  const [activeLesson, setActiveLesson] = useState<string | null>(null)
  const [editorTab, setEditorTab] = useState<EditorTab>('content')
  const [markdown, setMarkdown] = useState('')
  const [showImportModal, setShowImportModal] = useState(false)
  const [importStep, setImportStep] = useState<ImportStep | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [lessonTitle, setLessonTitle] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  // Auto-save refs
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRef = useRef<Record<string, unknown> | null>(null)
  const activeLessonRef = useRef(activeLesson)
  activeLessonRef.current = activeLesson

  // ─── Data Loading ──────────────────────────────────────────────
  const loadCourseData = useCallback(async () => {
    try {
      const res = await fetch(`/api/creator/courses/${courseId}`)
      const data = await res.json()
      if (!data.error && data.modules) {
        setModules(data.modules)
        // Auto-select first lesson if none active
        if (!activeLessonRef.current) {
          const firstLesson = data.modules[0]?.lessons?.[0]
          if (firstLesson) {
            setActiveLesson(firstLesson.id)
            setMarkdown(firstLesson.body || '')
            setLessonTitle(firstLesson.title || '')
          }
        }
      }
    } catch {}
    setLoading(false)
  }, [courseId])

  useEffect(() => {
    loadCourseData()
  }, [loadCourseData])

  // Load questions for active lesson
  const loadQuestions = useCallback(async () => {
    if (!activeLesson) return
    try {
      const res = await fetch(`/api/creator/courses/${courseId}/lessons/${activeLesson}/questions`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setQuestions(data)
      } else if (data.questions) {
        setQuestions(data.questions)
      }
    } catch {
      setQuestions([])
    }
  }, [courseId, activeLesson])

  useEffect(() => {
    loadQuestions()
  }, [loadQuestions])

  // ─── Auto-Save (2s debounce, inside flush recomputes section_index) ─
  const flush = useCallback(async (targetLessonId?: string) => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    const data = pendingRef.current
    const lid = targetLessonId || activeLessonRef.current
    if (!data || !lid) return
    pendingRef.current = null
    setSaveStatus('saving')

    try {
      // If body is being saved, recompute section_index for questions
      const bodyUpdate = data.body as string | undefined
      let questionSectionUpdates: { question_id: string; section_index: number }[] | undefined
      if (bodyUpdate !== undefined && questions.length > 0) {
        const newSections = parseMarkdownSections(bodyUpdate)
        // Remap: keep questions at their current section_index if that section still exists,
        // otherwise map to the closest section or section 0
        questionSectionUpdates = questions.map(q => {
          const sectionExists = newSections.some(s => s.index === q.section_index)
          return {
            question_id: q.id,
            section_index: sectionExists
              ? q.section_index
              : Math.min(q.section_index, Math.max(0, newSections.length - 1)),
          }
        })
      }

      const res = await fetch(`/api/creator/courses/${courseId}/lessons/${lid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          question_section_updates: questionSectionUpdates,
        }),
      })
      if (!res.ok) throw new Error('Save failed')
      setSaveStatus('saved')
      // Refresh data to pick up updated counts
      loadCourseData()
    } catch {
      setSaveStatus('error')
    }
  }, [courseId, questions, loadCourseData])

  const save = useCallback((field: string, value: unknown) => {
    pendingRef.current = { ...(pendingRef.current || {}), [field]: value }
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => flush(), 2000)
  }, [flush])

  // Flush on lesson change
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      if (pendingRef.current && activeLessonRef.current) {
        const data = pendingRef.current
        const lid = activeLessonRef.current
        pendingRef.current = null
        fetch(`/api/creator/courses/${courseId}/lessons/${lid}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }).catch(() => {})
      }
    }
  }, [courseId])

  // ─── Lesson Selection ──────────────────────────────────────────
  const selectLesson = useCallback((lessonId: string) => {
    // Flush pending save for current lesson
    if (pendingRef.current && activeLessonRef.current) {
      flush(activeLessonRef.current)
    }

    setActiveLesson(lessonId)
    setEditorTab('content')
    // Find and load the lesson
    for (const mod of modules) {
      const lesson = mod.lessons.find(l => l.id === lessonId)
      if (lesson) {
        setMarkdown(lesson.body || '')
        setLessonTitle(lesson.title || '')
        break
      }
    }
  }, [modules, flush])

  // ─── Markdown Change Handler ───────────────────────────────────
  const handleMarkdownChange = useCallback((value: string) => {
    setMarkdown(value)
    save('body', value)
  }, [save])

  // ─── Computed Data ─────────────────────────────────────────────
  const sections = useMarkdownSections(markdown)

  // Question counts per section
  const questionCounts: Record<number, number> = {}
  for (const q of questions) {
    questionCounts[q.section_index] = (questionCounts[q.section_index] || 0) + 1
  }

  // Concept cards (placeholder -- populated by AI pipeline)
  const conceptCounts: Record<number, { count: number; name: string }> = {}

  // Find active lesson context
  let activeLessonObj: Lesson | null = null
  let activeModuleIdx = 0
  let activeLessonIdx = 0
  for (const [mIdx, mod] of modules.entries()) {
    for (const [lIdx, lesson] of mod.lessons.entries()) {
      if (lesson.id === activeLesson) {
        activeLessonObj = lesson
        activeModuleIdx = mIdx
        activeLessonIdx = lIdx
      }
    }
  }

  const totalLessonsInModule = modules[activeModuleIdx]?.lessons.length || 0

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

      {/* Center: Editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeLesson ? (
          <>
            {/* Header bar */}
            <div className="px-4 py-2.5 border-b border-gray-200 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[11px] text-gray-400 flex-shrink-0">
                  Module {activeModuleIdx + 1} &middot; Lesson {activeLessonIdx + 1} of {totalLessonsInModule}
                </span>
                <span className="text-gray-300">|</span>
                <span className="text-sm font-medium text-gray-800 truncate">{lessonTitle}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditorTab('content')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    editorTab === 'content'
                      ? 'bg-gray-100 text-gray-800'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Content
                </button>
                <button
                  onClick={() => setEditorTab('questions')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    editorTab === 'questions'
                      ? 'bg-gray-100 text-gray-800'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Questions ({questions.length})
                </button>
              </div>
            </div>

            {/* Content or Questions tab */}
            {editorTab === 'content' ? (
              <MarkdownLessonEditor
                markdown={markdown}
                onChange={handleMarkdownChange}
                questionCounts={questionCounts}
                conceptCounts={conceptCounts}
              />
            ) : (
              <LessonQuestions
                questions={questions}
                sections={sections}
                courseId={courseId}
                lessonId={activeLesson}
                onQuestionAdded={() => { loadQuestions(); loadCourseData() }}
              />
            )}
          </>
        ) : modules.length === 0 ? (
          <ImportEmptyState
            onImport={() => setShowImportModal(true)}
            onStartFromScratch={async () => {
              // Auto-create Module 1 + Lesson 1
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

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-gray-200 bg-white flex items-center justify-between">
          <button onClick={onBack} className="text-xs text-gray-400 hover:text-gray-600">
            &larr; Back
          </button>
          <div className="flex items-center gap-3">
            <span className={`text-xs ${
              saveStatus === 'error' ? 'text-red-500' :
              saveStatus === 'saving' ? 'text-gray-400' :
              saveStatus === 'saved' ? 'text-gray-400' : ''
            }`}>
              {saveStatus === 'saving' && 'Saving...'}
              {saveStatus === 'saved' && 'Auto-saved'}
              {saveStatus === 'error' && 'Save failed'}
            </span>
            <button
              onClick={onContinue}
              className="btn-primary px-5 py-2 text-xs"
            >
              Settings &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Right: Learner Preview */}
      <LearnerPreviewSidebar
        sections={sections}
        questions={questions.map(q => ({ id: q.id, section_index: q.section_index }))}
        conceptCards={[]}
      />

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
            // Simulate step progression (actual steps happen server-side)
            setTimeout(() => setImportStep('structuring'), 2000)
          }}
          onImportComplete={async () => {
            setImportStep('inserting')
            setTimeout(async () => {
              setImportStep('done')
              await loadCourseData()
              setTimeout(() => {
                setImportStep(null)
                // Auto-select first lesson
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
