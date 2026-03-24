'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Lesson, Module, Step, StepType } from './types'
import { useAutoSave } from './useAutoSave'
import { useStepAutoSave } from './useStepAutoSave'
import SaveStatusIndicator from './SaveStatusIndicator'
import ContextMenu from './ContextMenu'
import ReadStepEditor from './step-editors/ReadStepEditor'
import WatchStepEditor from './step-editors/WatchStepEditor'
import AnswerStepEditor from './step-editors/AnswerStepEditor'
import GraphStepEditor from './step-editors/GraphStepEditor'
import EmbedStepEditor from './step-editors/EmbedStepEditor'
import CalloutStepEditor from './step-editors/CalloutStepEditor'
import type { AnswerStepContent } from './QuestionForm'

// ─── Step Type Config ───────────────────────────────────────────
const STEP_TYPE_CONFIG: Record<string, { label: string; badgeBg: string; badgeText: string; description: string }> = {
  read: { label: 'Read', badgeBg: 'bg-[#E1F5EE]', badgeText: 'text-[#085041]', description: 'Text content in Markdown' },
  watch: { label: 'Watch', badgeBg: 'bg-[#EEEDFE]', badgeText: 'text-[#3C3489]', description: 'Embedded video (YouTube/Vimeo)' },
  answer: { label: 'Answer', badgeBg: 'bg-[#FAECE7]', badgeText: 'text-[#712B13]', description: 'Question with answer options' },
  graph: { label: 'Graph', badgeBg: 'bg-[#E6F1FB]', badgeText: 'text-[#0C447C]', description: 'Interactive math graph' },
  embed: { label: 'Embed', badgeBg: 'bg-[#E6F1FB]', badgeText: 'text-[#0C447C]', description: 'Image, diagram, or math graph' },
  callout: { label: 'Callout', badgeBg: 'bg-[#FFF7ED]', badgeText: 'text-[#9A3412]', description: 'Tip, warning, or key concept' },
}

// ─── Step Preview Text ──────────────────────────────────────────
function getStepPreview(step: Step): string {
  switch (step.step_type) {
    case 'read':
      return (step.content?.markdown || '').slice(0, 60).replace(/\n/g, ' ') || 'Empty'
    case 'watch':
      return step.content?.url || 'No URL'
    case 'answer':
      return step.content?.question_text || 'Empty question'
    case 'graph':
      return step.title || 'Math graph'
    case 'embed': {
      const sub = step.content?.sub_type
      if (sub === 'image') return step.content?.caption || step.content?.url || 'Image'
      if (sub === 'diagram') return (step.content?.mermaid || '').slice(0, 40) || 'Diagram'
      return step.title || 'Math graph'
    }
    case 'callout':
      return step.content?.title || step.content?.callout_style || 'Callout'
    default:
      return ''
  }
}

// ─── Sortable Step Card ─────────────────────────────────────────
function SortableStepCard({
  step,
  index,
  isExpanded,
  isOnly,
  onToggle,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  courseId,
  lessonId,
  onStepUpdated,
}: {
  step: Step
  index: number
  isExpanded: boolean
  isOnly: boolean
  onToggle: () => void
  onDelete: () => void
  onDuplicate: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  courseId: string
  lessonId: string
  onStepUpdated: (step: Step) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const config = STEP_TYPE_CONFIG[step.step_type]
  const { status: stepSaveStatus, save: stepSave } = useStepAutoSave(courseId, lessonId, isExpanded ? step.id : null)

  const handleContentChange = useCallback((content: any) => {
    onStepUpdated({ ...step, content })
    stepSave('content', content)
  }, [step, stepSave, onStepUpdated])

  const handleDone = useCallback(() => {
    stepSave('content', step.content)
    onToggle()
  }, [stepSave, step.content, onToggle])

  return (
    <div ref={setNodeRef} style={style} className="mb-3">
      <div className={`border rounded-lg transition-colors ${
        isExpanded ? 'border-blue-300 bg-blue-50/30' : 'border-gray-200 bg-white hover:border-gray-300'
      }`}>
        {/* Collapsed header */}
        <div
          className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
          onClick={onToggle}
        >
          {/* Drag handle + step number */}
          <div
            className="flex items-center gap-2 flex-shrink-0"
            {...attributes}
            {...listeners}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-gray-300 cursor-grab">
              <circle cx="4" cy="2" r="1" fill="currentColor" />
              <circle cx="8" cy="2" r="1" fill="currentColor" />
              <circle cx="4" cy="6" r="1" fill="currentColor" />
              <circle cx="8" cy="6" r="1" fill="currentColor" />
              <circle cx="4" cy="10" r="1" fill="currentColor" />
              <circle cx="8" cy="10" r="1" fill="currentColor" />
            </svg>
            <div className="w-6 h-6 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
              <span className="text-[10px] font-bold text-gray-500">{index + 1}</span>
            </div>
          </div>

          {/* Type badge */}
          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${config?.badgeBg || 'bg-gray-100'} ${config?.badgeText || 'text-gray-600'}`}>
            {config?.label || step.step_type}
          </span>

          {/* Preview */}
          <span className="text-sm text-gray-500 truncate flex-1">{getStepPreview(step)}</span>

          {/* Save status (when expanded) */}
          {isExpanded && <SaveStatusIndicator status={stepSaveStatus} />}

          {/* Context menu */}
          <ContextMenu items={[
            { label: 'Edit', onClick: onToggle },
            { label: 'Move up', onClick: onMoveUp },
            { label: 'Move down', onClick: onMoveDown },
            { divider: true } as any,
            { label: 'Duplicate', onClick: onDuplicate },
            { divider: true } as any,
            { label: 'Delete', onClick: onDelete, destructive: true },
          ]} />
        </div>

        {/* Expanded editor */}
        {isExpanded && (
          <div className="px-3 pb-3 border-t border-gray-100 pt-3">
            {step.step_type === 'read' && (
              <ReadStepEditor content={step.content as any} onChange={handleContentChange} />
            )}
            {step.step_type === 'watch' && (
              <WatchStepEditor content={step.content as any} onChange={handleContentChange} />
            )}
            {step.step_type === 'answer' && (
              <AnswerStepEditor content={step.content as AnswerStepContent} onChange={handleContentChange} />
            )}
            {step.step_type === 'graph' && (
              <GraphStepEditor content={step.content as any} onChange={handleContentChange} />
            )}
            {step.step_type === 'embed' && (
              <EmbedStepEditor courseId={courseId} content={step.content} onChange={handleContentChange} />
            )}
            {step.step_type === 'callout' && (
              <CalloutStepEditor content={step.content as any} onChange={handleContentChange} />
            )}

            {/* Done button */}
            <div className="flex justify-end mt-3">
              <button
                onClick={(e) => { e.stopPropagation(); handleDone() }}
                className="border border-gray-200 text-gray-600 px-4 py-1.5 text-sm rounded-lg hover:bg-gray-50 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Embed Sub-Type Config ───────────────────────────────────────
const EMBED_SUB_TYPES = [
  { value: 'math_graph', label: 'Math Graph', description: 'Interactive coordinate plane' },
  { value: 'image', label: 'Image', description: 'Upload or link an image' },
  { value: 'diagram', label: 'Diagram', description: 'Mermaid flowchart or diagram' },
]

// ─── Step Type Picker ───────────────────────────────────────────
function StepTypePicker({ onSelect, onSelectEmbed, onCancel }: {
  onSelect: (type: StepType) => void
  onSelectEmbed: (subType: string) => void
  onCancel: () => void
}) {
  const [showEmbedSubs, setShowEmbedSubs] = useState(false)
  const types: StepType[] = ['read', 'watch', 'answer', 'embed', 'callout']

  if (showEmbedSubs) {
    return (
      <div className="border border-dashed border-gray-300 rounded-lg p-3 bg-gray-50/50">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => setShowEmbedSubs(false)} className="text-xs text-blue-500 hover:text-blue-700">Back</button>
          <p className="text-xs text-gray-500">Choose embed type</p>
          <div className="w-8" />
        </div>
        <div className="space-y-1.5">
          {EMBED_SUB_TYPES.map(sub => (
            <button
              key={sub.value}
              onClick={() => onSelectEmbed(sub.value)}
              className="w-full flex items-center gap-3 p-2.5 bg-white border border-gray-200 rounded-lg hover:border-gray-400 hover:shadow-sm transition-all text-left"
            >
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#E6F1FB] text-[#0C447C]">{sub.label}</span>
              <span className="text-[11px] text-gray-400">{sub.description}</span>
            </button>
          ))}
        </div>
        <button onClick={onCancel} className="w-full mt-2 text-xs text-gray-400 hover:text-gray-600">Cancel</button>
      </div>
    )
  }

  return (
    <div className="border border-dashed border-gray-300 rounded-lg p-3 bg-gray-50/50">
      <p className="text-xs text-gray-500 mb-2 text-center">Choose step type</p>
      <div className="grid grid-cols-3 gap-2">
        {types.slice(0, 3).map(type => {
          const config = STEP_TYPE_CONFIG[type]
          return (
            <button
              key={type}
              onClick={() => onSelect(type)}
              className="flex flex-col items-center gap-1 p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-400 hover:shadow-sm transition-all"
            >
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${config.badgeBg} ${config.badgeText}`}>{config.label}</span>
              <span className="text-[11px] text-gray-400 text-center">{config.description}</span>
            </button>
          )
        })}
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        {/* Embed — opens sub-type picker */}
        <button
          onClick={() => setShowEmbedSubs(true)}
          className="flex flex-col items-center gap-1 p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-400 hover:shadow-sm transition-all"
        >
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#E6F1FB] text-[#0C447C]">Embed</span>
          <span className="text-[11px] text-gray-400 text-center">Image, diagram, or math graph</span>
        </button>
        {/* Callout */}
        <button
          onClick={() => onSelect('callout')}
          className="flex flex-col items-center gap-1 p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-400 hover:shadow-sm transition-all"
        >
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FFF7ED] text-[#9A3412]">Callout</span>
          <span className="text-[11px] text-gray-400 text-center">Tip, warning, or key concept</span>
        </button>
      </div>
      <button onClick={onCancel} className="w-full mt-2 text-xs text-gray-400 hover:text-gray-600">Cancel</button>
    </div>
  )
}

// ─── Default Content ────────────────────────────────────────────
function defaultContentForType(type: StepType): Record<string, unknown> {
  switch (type) {
    case 'read': return { markdown: '' }
    case 'watch': return { url: '' }
    case 'answer': return {
      question_text: '',
      question_type: 'multiple_choice',
      options: [{ id: 'a', text: '' }, { id: 'b', text: '' }, { id: 'c', text: '' }, { id: 'd', text: '' }],
      correct_ids: [],
      explanation: '',
      option_explanations: {},
      acceptable_answers: null,
      match_mode: 'exact',
      correct_order: null,
      matching_pairs: null,
    }
    case 'graph': return { sub_type: 'math_graph', graph_data: { x_range: [-5, 5], y_range: [-5, 5], step: 1 } }
    case 'embed': return { sub_type: 'math_graph', graph_data: { x_range: [-5, 5], y_range: [-5, 5], step: 1 } }
    case 'callout': return { callout_style: 'tip', title: 'Tip', markdown: '' }
  }
}

function defaultEmbedContent(subType: string): Record<string, unknown> {
  switch (subType) {
    case 'math_graph': return { sub_type: 'math_graph', graph_data: { x_range: [-5, 5], y_range: [-5, 5], step: 1 } }
    case 'image': return { sub_type: 'image', url: '', caption: '', alt: '' }
    case 'diagram': return { sub_type: 'diagram', mermaid: 'graph TD;\n  A-->B;\n  B-->C;' }
    default: return { sub_type: subType }
  }
}

// ─── Main StepSequencer ─────────────────────────────────────────
export default function StepSequencer({
  courseId,
  lesson,
  modules,
  cardColor,
  onCollapse,
  onLessonUpdated,
}: {
  courseId: string
  lesson: Lesson
  modules: Module[]
  cardColor: string
  onCollapse: () => void
  onLessonUpdated: () => void
}) {
  const [steps, setSteps] = useState<Step[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showPicker, setShowPicker] = useState(false)
  const [insertAtIndex, setInsertAtIndex] = useState<number | null>(null)
  const [lessonTitle, setLessonTitle] = useState(lesson.title)

  const { status: titleSaveStatus, save: titleSave, saveImmediate: titleSaveImmediate } = useAutoSave(courseId, lesson.id)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // Load steps
  useEffect(() => {
    setLoading(true)
    fetch(`/api/creator/courses/${courseId}/lessons/${lesson.id}/steps`)
      .then(r => r.json())
      .then(data => setSteps(Array.isArray(data) ? data : []))
      .catch(() => setSteps([]))
      .finally(() => setLoading(false))
  }, [courseId, lesson.id])

  // Reset title when lesson changes
  useEffect(() => {
    setLessonTitle(lesson.title)
    setExpandedId(null)
  }, [lesson.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const lessonModule = modules.find(m => m.lessons.some(l => l.id === lesson.id))
  const lessonIndex = lessonModule?.lessons.findIndex(l => l.id === lesson.id) ?? 0

  // Add step (optimistic)
  const addStep = async (type: StepType) => {
    const sortOrder = insertAtIndex ?? steps.length
    setShowPicker(false)
    setInsertAtIndex(null)

    const tempId = crypto.randomUUID()
    const content = defaultContentForType(type)
    const tempStep: Step = {
      id: tempId,
      lesson_id: lesson.id,
      sort_order: sortOrder,
      step_type: type,
      title: null,
      content,
    }

    // Optimistic: add to state immediately and expand
    if (insertAtIndex != null) {
      setSteps(prev => {
        const updated = prev.map(s => s.sort_order >= sortOrder ? { ...s, sort_order: s.sort_order + 1 } : s)
        return [...updated, tempStep].sort((a, b) => a.sort_order - b.sort_order)
      })
    } else {
      setSteps(prev => [...prev, tempStep])
    }
    setExpandedId(tempId)

    // Fire API in background
    try {
      const res = await fetch(`/api/creator/courses/${courseId}/lessons/${lesson.id}/steps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step_type: type, content, sort_order: sortOrder }),
      })
      const newStep = await res.json()
      if (newStep.id) {
        // Replace temp ID with real ID
        setSteps(prev => prev.map(s => s.id === tempId ? { ...s, ...newStep } : s))
        setExpandedId(newStep.id)
        onLessonUpdated()
      } else {
        // Remove on failure
        setSteps(prev => prev.filter(s => s.id !== tempId))
      }
    } catch (err) {
      console.error('Failed to add step:', err)
      setSteps(prev => prev.filter(s => s.id !== tempId))
    }
  }

  // Add embed step with specific sub-type
  const addEmbedStep = (subType: string) => {
    // Override the content for embed type based on sub-type
    const sortOrder = insertAtIndex ?? steps.length
    setShowPicker(false)
    setInsertAtIndex(null)

    const tempId = crypto.randomUUID()
    const content = defaultEmbedContent(subType)
    const tempStep: Step = {
      id: tempId,
      lesson_id: lesson.id,
      sort_order: sortOrder,
      step_type: 'embed',
      title: null,
      content,
    }

    if (insertAtIndex != null) {
      setSteps(prev => {
        const updated = prev.map(s => s.sort_order >= sortOrder ? { ...s, sort_order: s.sort_order + 1 } : s)
        return [...updated, tempStep].sort((a, b) => a.sort_order - b.sort_order)
      })
    } else {
      setSteps(prev => [...prev, tempStep])
    }
    setExpandedId(tempId)

    // Fire API in background
    ;(async () => {
      try {
        const res = await fetch(`/api/creator/courses/${courseId}/lessons/${lesson.id}/steps`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step_type: 'embed', content, sort_order: sortOrder }),
        })
        const newStep = await res.json()
        if (newStep.id) {
          setSteps(prev => prev.map(s => s.id === tempId ? { ...s, ...newStep } : s))
          setExpandedId(newStep.id)
          onLessonUpdated()
        } else {
          setSteps(prev => prev.filter(s => s.id !== tempId))
        }
      } catch (err) {
        console.error('Failed to add embed step:', err)
        setSteps(prev => prev.filter(s => s.id !== tempId))
      }
    })()
  }

  // Delete step
  const deleteStep = async (stepId: string) => {
    if (!confirm('Delete this step?')) return
    try {
      await fetch(`/api/creator/courses/${courseId}/lessons/${lesson.id}/steps/${stepId}`, { method: 'DELETE' })
      setSteps(prev => prev.filter(s => s.id !== stepId).map((s, i) => ({ ...s, sort_order: i })))
      if (expandedId === stepId) setExpandedId(null)
      onLessonUpdated()
    } catch (err) {
      console.error('Failed to delete step:', err)
    }
  }

  // Duplicate step
  const duplicateStep = async (step: Step) => {
    try {
      const res = await fetch(`/api/creator/courses/${courseId}/lessons/${lesson.id}/steps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step_type: step.step_type,
          title: step.title,
          content: step.content,
          sort_order: step.sort_order + 1,
        }),
      })
      const newStep = await res.json()
      if (newStep.id) {
        const refetch = await fetch(`/api/creator/courses/${courseId}/lessons/${lesson.id}/steps`)
        const allSteps = await refetch.json()
        setSteps(Array.isArray(allSteps) ? allSteps : [])
        onLessonUpdated()
      }
    } catch (err) {
      console.error('Failed to duplicate step:', err)
    }
  }

  // Reorder via API
  const reorderSteps = async (newSteps: Step[]) => {
    setSteps(newSteps)
    try {
      await fetch(`/api/creator/courses/${courseId}/lessons/${lesson.id}/steps/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step_ids: newSteps.map(s => s.id) }),
      })
    } catch (err) {
      console.error('Failed to reorder steps:', err)
    }
  }

  // Move step up/down
  const moveStep = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= steps.length) return
    const newSteps = [...steps]
    ;[newSteps[index], newSteps[target]] = [newSteps[target], newSteps[index]]
    newSteps.forEach((s, i) => { s.sort_order = i })
    reorderSteps(newSteps)
  }

  // Drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = steps.findIndex(s => s.id === active.id)
    const newIndex = steps.findIndex(s => s.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const newSteps = [...steps]
    const [moved] = newSteps.splice(oldIndex, 1)
    newSteps.splice(newIndex, 0, moved)
    newSteps.forEach((s, i) => { s.sort_order = i })
    reorderSteps(newSteps)
  }

  // Update step content locally
  const handleStepUpdated = useCallback((updatedStep: Step) => {
    setSteps(prev => prev.map(s => s.id === updatedStep.id ? updatedStep : s))
  }, [])

  return (
    <div>
      {/* Breadcrumb + actions */}
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-gray-400">
          {lessonModule?.title} &middot; Lesson {lessonIndex + 1} of {lessonModule?.lessons.length || 0}
        </p>
        <div className="flex items-center gap-3">
          <SaveStatusIndicator status={titleSaveStatus} />
          <span className="text-xs text-gray-400">{steps.length} step{steps.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Title */}
      <input
        type="text"
        value={lessonTitle}
        onChange={e => { setLessonTitle(e.target.value); titleSave('title', e.target.value.trim()) }}
        onBlur={() => { if (lessonTitle.trim() !== lesson.title) titleSaveImmediate('title', lessonTitle.trim()) }}
        className="text-xl font-bold text-gray-900 bg-transparent border-b-2 border-transparent hover:border-gray-200 focus:border-blue-500 focus:outline-none w-full mb-5"
        placeholder="Lesson title..."
      />

      {/* Steps timeline */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={steps.map(s => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-0">
              {steps.map((step, idx) => (
                <div key={step.id}>
                  {/* Insert point between steps */}
                  {idx > 0 && (
                    <div className="flex justify-center group">
                      <button
                        onClick={() => { setInsertAtIndex(idx); setShowPicker(true) }}
                        className="w-5 h-5 rounded-full border border-dashed border-transparent group-hover:border-gray-300 flex items-center justify-center transition-colors"
                        title="Insert step here"
                      >
                        <span className="text-xs text-transparent group-hover:text-gray-400 leading-none">+</span>
                      </button>
                    </div>
                  )}

                  <SortableStepCard
                    step={step}
                    index={idx}
                    isExpanded={expandedId === step.id}
                    isOnly={steps.length === 1}
                    onToggle={() => setExpandedId(expandedId === step.id ? null : step.id)}
                    onDelete={() => deleteStep(step.id)}
                    onDuplicate={() => duplicateStep(step)}
                    onMoveUp={() => moveStep(idx, -1)}
                    onMoveDown={() => moveStep(idx, 1)}
                    courseId={courseId}
                    lessonId={lesson.id}
                    onStepUpdated={handleStepUpdated}
                  />
                </div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add step button / picker */}
      <div className="mt-4">
        {showPicker ? (
          <StepTypePicker
            onSelect={addStep}
            onSelectEmbed={addEmbedStep}
            onCancel={() => { setShowPicker(false); setInsertAtIndex(null) }}
          />
        ) : (
          <button
            onClick={() => { setInsertAtIndex(null); setShowPicker(true) }}
            className="w-full py-3 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors"
          >
            + Add step
          </button>
        )}
      </div>
    </div>
  )
}
