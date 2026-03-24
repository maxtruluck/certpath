import { useState, useRef, useCallback, useEffect } from 'react'
import type { SaveStatus } from './types'

export function useStepAutoSave(
  courseId: string,
  lessonId: string | null,
  stepId: string | null,
) {
  const [status, setStatus] = useState<SaveStatus>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRef = useRef<Record<string, unknown> | null>(null)
  const stepIdRef = useRef(stepId)

  // Flush pending save when step changes
  useEffect(() => {
    if (stepIdRef.current && stepIdRef.current !== stepId && pendingRef.current) {
      flush(stepIdRef.current)
    }
    stepIdRef.current = stepId
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepId])

  const flush = useCallback(async (targetStepId?: string) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    const data = pendingRef.current
    const sid = targetStepId || stepIdRef.current
    if (!data || !sid || !lessonId) return
    pendingRef.current = null
    setStatus('saving')
    try {
      const res = await fetch(`/api/creator/courses/${courseId}/lessons/${lessonId}/steps/${sid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Save failed')
      setStatus('saved')
    } catch {
      setStatus('error')
    }
  }, [courseId, lessonId])

  const save = useCallback((field: string, value: unknown) => {
    pendingRef.current = { ...(pendingRef.current || {}), [field]: value }
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => flush(), 2000)
  }, [flush])

  const saveImmediate = useCallback(async (field: string, value: unknown) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = null
    const sid = stepIdRef.current
    if (!sid || !lessonId) return
    const data = { ...(pendingRef.current || {}), [field]: value }
    pendingRef.current = null
    setStatus('saving')
    try {
      const res = await fetch(`/api/creator/courses/${courseId}/lessons/${lessonId}/steps/${sid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Save failed')
      setStatus('saved')
    } catch {
      setStatus('error')
    }
  }, [courseId, lessonId])

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (pendingRef.current && stepIdRef.current && lessonId) {
        const data = pendingRef.current
        const sid = stepIdRef.current
        pendingRef.current = null
        fetch(`/api/creator/courses/${courseId}/lessons/${lessonId}/steps/${sid}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }).catch(() => {})
      }
    }
  }, [courseId, lessonId])

  return { status, save, saveImmediate, flush }
}
