import { useState, useRef, useCallback, useEffect } from 'react'
import type { SaveStatus } from './types'

export function useAutoSave(
  courseId: string,
  lessonId: string | null,
) {
  const [status, setStatus] = useState<SaveStatus>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRef = useRef<Record<string, unknown> | null>(null)
  const lessonIdRef = useRef(lessonId)

  // Flush pending save when lesson changes
  useEffect(() => {
    if (lessonIdRef.current && lessonIdRef.current !== lessonId && pendingRef.current) {
      flush(lessonIdRef.current)
    }
    lessonIdRef.current = lessonId
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId])

  const flush = useCallback(async (targetLessonId?: string) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    const data = pendingRef.current
    const lid = targetLessonId || lessonIdRef.current
    if (!data || !lid) return
    pendingRef.current = null
    setStatus('saving')
    try {
      const res = await fetch(`/api/creator/courses/${courseId}/lessons/${lid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Save failed')
      setStatus('saved')
    } catch {
      setStatus('error')
    }
  }, [courseId])

  const save = useCallback((field: string, value: unknown) => {
    pendingRef.current = { ...(pendingRef.current || {}), [field]: value }
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => flush(), 2000)
  }, [flush])

  const saveImmediate = useCallback(async (field: string, value: unknown) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = null
    const lid = lessonIdRef.current
    if (!lid) return
    const data = { ...(pendingRef.current || {}), [field]: value }
    pendingRef.current = null
    setStatus('saving')
    try {
      const res = await fetch(`/api/creator/courses/${courseId}/lessons/${lid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Save failed')
      setStatus('saved')
    } catch {
      setStatus('error')
    }
  }, [courseId])

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (pendingRef.current && lessonIdRef.current) {
        const data = pendingRef.current
        const lid = lessonIdRef.current
        pendingRef.current = null
        // Fire-and-forget on unmount
        fetch(`/api/creator/courses/${courseId}/lessons/${lid}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }).catch(() => {})
      }
    }
  }, [courseId])

  return { status, save, saveImmediate, flush }
}
