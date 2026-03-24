'use client'

import { useEffect, useState, useId } from 'react'

export function MermaidDiagram({ chart, className }: { chart: string; className?: string }) {
  const [svg, setSvg] = useState<string>('')
  const [error, setError] = useState<string>('')
  const reactId = useId().replace(/:/g, '')

  useEffect(() => {
    if (!chart?.trim()) return

    let cancelled = false
    const id = `mmd-${reactId}-${Date.now()}`

    ;(async () => {
      try {
        const { default: mermaid } = await import('mermaid')

        mermaid.initialize({
          startOnLoad: false,
          theme: 'neutral',
          securityLevel: 'loose',
          fontFamily: 'system-ui, sans-serif',
        })

        const { svg: rendered } = await mermaid.render(id, chart)
        if (!cancelled) {
          setSvg(rendered)
          setError('')
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || 'Failed to render diagram')
          setSvg('')
        }
      }
    })()

    return () => { cancelled = true }
  }, [chart, reactId])

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-3 ${className || ''}`}>
        <p className="text-xs text-red-600 mb-1">Diagram syntax error</p>
        <pre className="text-xs text-red-500 whitespace-pre-wrap">{error}</pre>
      </div>
    )
  }

  if (!svg) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 flex items-center justify-center min-h-[100px] ${className || ''}`}>
        <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div
      className={`flex justify-center overflow-x-auto ${className || ''}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
