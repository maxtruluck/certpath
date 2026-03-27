'use client'

import { useState, useRef, useEffect } from 'react'

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

function isLessonReady(lesson: Lesson): boolean {
  return (lesson.body || '').length >= 50 && lesson.question_count > 0
}

export default function OutlinePanel({
  modules,
  activeLesson,
  onSelectLesson,
  courseId,
  onDataChanged,
  onImport,
}: {
  modules: Module[]
  activeLesson: string | null
  onSelectLesson: (lessonId: string) => void
  courseId: string
  onDataChanged: () => void
  onImport?: () => void
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [addingModule, setAddingModule] = useState(false)
  const [newModuleName, setNewModuleName] = useState('')
  const [addingLessonToModule, setAddingLessonToModule] = useState<string | null>(null)
  const [newLessonName, setNewLessonName] = useState('')
  const moduleInputRef = useRef<HTMLInputElement>(null)
  const lessonInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (addingModule) moduleInputRef.current?.focus()
  }, [addingModule])

  useEffect(() => {
    if (addingLessonToModule) lessonInputRef.current?.focus()
  }, [addingLessonToModule])

  const toggleCollapse = (moduleId: string) => {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(moduleId)) next.delete(moduleId)
      else next.add(moduleId)
      return next
    })
  }

  const handleAddModule = async () => {
    if (!newModuleName.trim()) return
    try {
      await fetch(`/api/creator/courses/${courseId}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newModuleName.trim() }),
      })
      setNewModuleName('')
      setAddingModule(false)
      onDataChanged()
    } catch {}
  }

  const handleAddLesson = async (moduleId: string) => {
    if (!newLessonName.trim()) return
    try {
      await fetch(`/api/creator/courses/${courseId}/modules/${moduleId}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newLessonName.trim() }),
      })
      setNewLessonName('')
      setAddingLessonToModule(null)
      onDataChanged()
    } catch {}
  }

  const totalLessons = modules.reduce((s, m) => s + m.lessons.length, 0)
  const readyLessons = modules.reduce((s, m) =>
    s + m.lessons.filter(isLessonReady).length, 0)

  return (
    <div className="w-[200px] border-r border-gray-200 bg-white flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-3 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-400">Outline</p>
          {onImport && (
            <button
              onClick={onImport}
              className="text-[10px] font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              Import
            </button>
          )}
        </div>
        <p className="text-[10px] text-gray-400 mt-0.5">
          {modules.length} module{modules.length !== 1 ? 's' : ''} &middot; {totalLessons} lesson{totalLessons !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Module tree */}
      <div className="flex-1 overflow-y-auto px-1.5 py-2">
        {modules.map(mod => {
          const isCollapsed = collapsed.has(mod.id)
          return (
            <div key={mod.id} className="mb-1">
              {/* Module header */}
              <button
                onClick={() => toggleCollapse(mod.id)}
                className="w-full flex items-center gap-1.5 px-2 py-1.5 text-left hover:bg-gray-50 rounded-md transition-colors"
              >
                <svg
                  width="10" height="10" viewBox="0 0 10 10" fill="none"
                  className={`text-gray-400 transition-transform flex-shrink-0 ${isCollapsed ? '' : 'rotate-90'}`}
                >
                  <path d="M3 1L7 5L3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-[11px] font-semibold text-gray-700 truncate">{mod.title}</span>
              </button>

              {/* Lessons */}
              {!isCollapsed && (
                <div className="ml-3">
                  {mod.lessons.map(lesson => {
                    const ready = isLessonReady(lesson)
                    const isActive = activeLesson === lesson.id
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => onSelectLesson(lesson.id)}
                        className={`w-full flex items-center gap-1.5 px-2 py-1 text-left rounded-md transition-colors ${
                          isActive ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-600'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          ready ? 'bg-emerald-400' : 'bg-gray-300'
                        }`} />
                        <span className="text-[11px] truncate flex-1">{lesson.title}</span>
                        {lesson.question_count > 0 && (
                          <span className="text-[9px] font-medium text-gray-400 bg-gray-100 px-1 rounded">
                            {lesson.question_count}q
                          </span>
                        )}
                      </button>
                    )
                  })}
                  {/* Add lesson */}
                  {addingLessonToModule === mod.id ? (
                    <div className="px-2 py-1">
                      <input
                        ref={lessonInputRef}
                        type="text"
                        value={newLessonName}
                        onChange={e => setNewLessonName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleAddLesson(mod.id)
                          if (e.key === 'Escape') { setAddingLessonToModule(null); setNewLessonName('') }
                        }}
                        onBlur={() => { if (!newLessonName.trim()) { setAddingLessonToModule(null); setNewLessonName('') } }}
                        placeholder="Lesson name..."
                        className="w-full px-2 py-1 text-[11px] border border-blue-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingLessonToModule(mod.id)}
                      className="w-full px-2 py-1 text-left text-[10px] text-gray-400 hover:text-blue-500 transition-colors"
                    >
                      + lesson
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {/* Add module */}
        {addingModule ? (
          <div className="px-2 py-2">
            <input
              ref={moduleInputRef}
              type="text"
              value={newModuleName}
              onChange={e => setNewModuleName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAddModule()
                if (e.key === 'Escape') { setAddingModule(false); setNewModuleName('') }
              }}
              placeholder="Module name..."
              className="w-full px-2 py-1.5 text-[11px] border border-blue-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 mb-1"
            />
            <div className="flex gap-1">
              <button onClick={handleAddModule} className="text-[10px] text-blue-600 font-medium">Add</button>
              <button onClick={() => { setAddingModule(false); setNewModuleName('') }} className="text-[10px] text-gray-400">Cancel</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddingModule(true)}
            className="w-full mt-1 py-2 text-[11px] font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            + Module
          </button>
        )}

        {/* Assessment section (deferred) */}
        <div className="mt-3 pt-3 border-t border-gray-200 space-y-1">
          <button
            onClick={() => alert('Coming soon')}
            className="w-full px-2 py-1 text-left text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
            title="Coming soon"
          >
            + Quiz checkpoint
          </button>
          <button
            onClick={() => alert('Coming soon')}
            className="w-full px-2 py-1 text-left text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
            title="Coming soon"
          >
            + Practice exam
          </button>
        </div>
      </div>

      {/* Footer progress */}
      <div className="px-3 py-2.5 border-t border-gray-200">
        <p className="text-[10px] text-gray-500 mb-1.5">
          {readyLessons} of {totalLessons} lessons ready
        </p>
        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: totalLessons > 0 ? `${(readyLessons / totalLessons) * 100}%` : '0%' }}
          />
        </div>
      </div>
    </div>
  )
}
