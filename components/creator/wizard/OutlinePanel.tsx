'use client'

import { useState, useRef, useEffect } from 'react'

interface Lesson {
  id: string
  title: string
  display_order: number
  module_id: string
  question_count: number
  word_count: number
  step_count: number
}

interface Module {
  id: string
  title: string
  display_order: number
  lessons: Lesson[]
}

function isLessonReady(lesson: Lesson): boolean {
  return (lesson.step_count || 0) > 0
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
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null)
  const [editingModuleName, setEditingModuleName] = useState('')
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null)
  const [editingLessonName, setEditingLessonName] = useState('')
  const moduleInputRef = useRef<HTMLInputElement>(null)
  const lessonInputRef = useRef<HTMLInputElement>(null)
  const editModuleInputRef = useRef<HTMLInputElement>(null)
  const editLessonInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (addingModule) moduleInputRef.current?.focus()
  }, [addingModule])

  useEffect(() => {
    if (addingLessonToModule) lessonInputRef.current?.focus()
  }, [addingLessonToModule])

  useEffect(() => {
    if (editingModuleId) editModuleInputRef.current?.focus()
  }, [editingModuleId])

  useEffect(() => {
    if (editingLessonId) editLessonInputRef.current?.focus()
  }, [editingLessonId])

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

  const handleRenameModule = async (moduleId: string) => {
    if (!editingModuleName.trim()) { setEditingModuleId(null); return }
    try {
      await fetch(`/api/creator/courses/${courseId}/modules/${moduleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editingModuleName.trim() }),
      })
      setEditingModuleId(null)
      setEditingModuleName('')
      onDataChanged()
    } catch {}
  }

  const handleRenameLesson = async (moduleId: string, lessonId: string) => {
    if (!editingLessonName.trim()) { setEditingLessonId(null); return }
    try {
      await fetch(`/api/creator/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editingLessonName.trim() }),
      })
      setEditingLessonId(null)
      setEditingLessonName('')
      onDataChanged()
    } catch {}
  }

  const totalLessons = modules.reduce((s, m) => s + m.lessons.length, 0)
  const totalSteps = modules.reduce((s, m) => s + m.lessons.reduce((ls, l) => ls + (l.step_count || 0), 0), 0)
  const readyLessons = modules.reduce((s, m) =>
    s + m.lessons.filter(isLessonReady).length, 0)

  return (
    <div
      className="border-r flex flex-col h-full overflow-hidden"
      style={{ width: 280, minWidth: 280, background: '#fafafa', borderColor: '#eee' }}
    >
      {/* Header */}
      <div style={{ padding: '14px 16px 10px' }}>
        <div className="flex items-center justify-between">
          <span style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Course Outline
          </span>
          {onImport && (
            <button
              onClick={onImport}
              style={{ fontSize: 12, color: '#378ADD', fontWeight: 500 }}
              className="hover:opacity-80 transition-opacity"
            >
              Import
            </button>
          )}
        </div>
        {/* Stats line */}
        <p style={{ fontSize: 11, color: '#aaa', padding: '0', marginTop: 4 }}>
          {modules.length} module{modules.length !== 1 ? 's' : ''} &middot; {totalLessons} lesson{totalLessons !== 1 ? 's' : ''} &middot; {totalSteps} step{totalSteps !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Module tree */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '4px 0' }}>
        {modules.map(mod => {
          const isCollapsed = collapsed.has(mod.id)
          return (
            <div key={mod.id} className="mb-0.5">
              {/* Module header */}
              <div
                className="flex items-center gap-1.5 cursor-pointer hover:bg-[#f0f0f0] transition-colors"
                style={{ padding: '8px 8px' }}
              >
                <button
                  onClick={() => toggleCollapse(mod.id)}
                  className="flex-shrink-0"
                >
                  <span style={{ fontSize: 8, color: '#aaa' }}>
                    {isCollapsed ? '\u25B6' : '\u25BC'}
                  </span>
                </button>

                {editingModuleId === mod.id ? (
                  <input
                    ref={editModuleInputRef}
                    type="text"
                    value={editingModuleName}
                    onChange={e => setEditingModuleName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleRenameModule(mod.id)
                      if (e.key === 'Escape') { setEditingModuleId(null); setEditingModuleName('') }
                    }}
                    onBlur={() => handleRenameModule(mod.id)}
                    className="flex-1 bg-white border border-blue-300 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}
                  />
                ) : (
                  <span
                    className="flex-1 truncate cursor-text"
                    style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}
                    onClick={() => { setEditingModuleId(mod.id); setEditingModuleName(mod.title) }}
                  >
                    {mod.title}
                  </span>
                )}

                <span style={{ fontSize: 11, color: '#aaa' }} className="flex-shrink-0">
                  {mod.lessons.length} lesson{mod.lessons.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Lessons */}
              {!isCollapsed && (
                <div style={{ marginLeft: 20 }}>
                  {mod.lessons.map(lesson => {
                    const isActive = activeLesson === lesson.id
                    const stepCount = lesson.step_count || 0
                    const isEmpty = stepCount === 0
                    return (
                      <div
                        key={lesson.id}
                        className="flex items-center cursor-pointer transition-colors"
                        style={{
                          padding: '5px 10px',
                          borderRadius: 6,
                          fontSize: 12,
                          color: isActive ? '#185FA5' : '#666',
                          background: isActive ? '#E6F1FB' : 'transparent',
                          fontWeight: isActive ? 600 : 400,
                        }}
                        onClick={() => {
                          if (editingLessonId !== lesson.id) onSelectLesson(lesson.id)
                        }}
                        onMouseEnter={e => {
                          if (!isActive) (e.currentTarget as HTMLElement).style.background = '#f0f0f0'
                        }}
                        onMouseLeave={e => {
                          if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'
                        }}
                      >
                        {editingLessonId === lesson.id ? (
                          <input
                            ref={editLessonInputRef}
                            type="text"
                            value={editingLessonName}
                            onChange={e => setEditingLessonName(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleRenameLesson(mod.id, lesson.id)
                              if (e.key === 'Escape') { setEditingLessonId(null); setEditingLessonName('') }
                            }}
                            onBlur={() => handleRenameLesson(mod.id, lesson.id)}
                            onClick={e => e.stopPropagation()}
                            className="flex-1 bg-white border border-blue-300 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            style={{ fontSize: 12 }}
                          />
                        ) : (
                          <span
                            className="flex-1 truncate cursor-text"
                            onDoubleClick={() => { setEditingLessonId(lesson.id); setEditingLessonName(lesson.title) }}
                          >
                            {lesson.title}
                          </span>
                        )}
                        <span
                          className="flex-shrink-0 text-center"
                          style={{
                            fontSize: 10,
                            padding: '1px 6px',
                            borderRadius: 4,
                            background: isActive ? 'white' : isEmpty ? '#FEF3CD' : '#f0f0f0',
                            color: isActive ? '#185FA5' : isEmpty ? '#856404' : '#999',
                            fontWeight: 500,
                            marginLeft: 6,
                          }}
                        >
                          {stepCount}
                        </span>
                      </div>
                    )
                  })}

                  {/* Add lesson */}
                  {addingLessonToModule === mod.id ? (
                    <div style={{ padding: '3px 10px' }}>
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
                        className="w-full px-2 py-1 border border-blue-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        style={{ fontSize: 12 }}
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingLessonToModule(mod.id)}
                      style={{ fontSize: 11, color: '#aaa', padding: '3px 10px' }}
                      className="hover:text-blue-500 transition-colors"
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
          <div style={{ padding: '8px' }}>
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
              className="w-full px-2 py-1.5 border border-blue-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 mb-1"
              style={{ fontSize: 12 }}
            />
            <div className="flex gap-1">
              <button onClick={handleAddModule} style={{ fontSize: 11 }} className="text-blue-600 font-medium">Add</button>
              <button onClick={() => { setAddingModule(false); setNewModuleName('') }} style={{ fontSize: 11 }} className="text-gray-400">Cancel</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddingModule(true)}
            className="w-[calc(100%-16px)] text-center hover:bg-[#f0f0f0] transition-colors"
            style={{
              border: '1px dashed #ccc',
              borderRadius: 6,
              padding: 7,
              fontSize: 12,
              color: '#aaa',
              margin: 8,
              background: 'transparent',
            }}
          >
            + Module
          </button>
        )}

      </div>

      {/* Footer progress */}
      <div style={{ padding: '10px 16px', borderTop: '1px solid #eee', fontSize: 11, color: '#999' }}>
        <p className="mb-1.5">
          {readyLessons} of {totalLessons} lessons ready
        </p>
        <div style={{ height: 3, background: '#eee', borderRadius: 2, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              background: '#1D9E75',
              borderRadius: 2,
              width: totalLessons > 0 ? `${(readyLessons / totalLessons) * 100}%` : '0%',
              transition: 'width 0.5s ease',
            }}
          />
        </div>
      </div>
    </div>
  )
}
