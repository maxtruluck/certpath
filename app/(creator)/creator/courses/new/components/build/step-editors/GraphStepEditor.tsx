'use client'

import { useState } from 'react'
import { CoordinateDiagram, type DiagramData } from '@/lib/coordinate-diagram'

interface GraphStepEditorProps {
  content: { graph_data: DiagramData }
  onChange: (content: { graph_data: DiagramData }) => void
}

const DEFAULT_GRAPH: DiagramData = {
  x_range: [-5, 5],
  y_range: [-5, 5],
  step: 1,
}

export default function GraphStepEditor({ content, onChange }: GraphStepEditorProps) {
  const graph = content.graph_data || DEFAULT_GRAPH
  const [jsonMode, setJsonMode] = useState(false)
  const [jsonText, setJsonText] = useState(JSON.stringify(graph, null, 2))
  const [jsonError, setJsonError] = useState('')

  const update = (partial: Partial<DiagramData>) => {
    onChange({ graph_data: { ...graph, ...partial } })
  }

  const handleJsonApply = () => {
    try {
      const parsed = JSON.parse(jsonText)
      if (!parsed.x_range || !parsed.y_range || !parsed.step) {
        setJsonError('Must include x_range, y_range, and step')
        return
      }
      onChange({ graph_data: parsed })
      setJsonError('')
    } catch {
      setJsonError('Invalid JSON')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-500">Graph Configuration</label>
        <button
          onClick={() => {
            setJsonMode(!jsonMode)
            if (!jsonMode) setJsonText(JSON.stringify(graph, null, 2))
          }}
          className="text-xs text-blue-500 hover:text-blue-700"
        >
          {jsonMode ? 'Visual editor' : 'JSON editor'}
        </button>
      </div>

      {jsonMode ? (
        <div>
          <textarea
            value={jsonText}
            onChange={e => { setJsonText(e.target.value); setJsonError('') }}
            rows={12}
            className="w-full text-xs font-mono bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          {jsonError && <p className="text-xs text-red-500 mt-1">{jsonError}</p>}
          <button
            onClick={handleJsonApply}
            className="mt-2 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
          >
            Apply JSON
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] text-gray-400 mb-0.5">X Range</label>
            <div className="flex gap-1">
              <input
                type="number"
                value={graph.x_range?.[0] ?? -5}
                onChange={e => update({ x_range: [Number(e.target.value), graph.x_range?.[1] ?? 5] })}
                className="w-full text-xs border border-gray-200 rounded px-2 py-1"
              />
              <span className="text-xs text-gray-400 self-center">to</span>
              <input
                type="number"
                value={graph.x_range?.[1] ?? 5}
                onChange={e => update({ x_range: [graph.x_range?.[0] ?? -5, Number(e.target.value)] })}
                className="w-full text-xs border border-gray-200 rounded px-2 py-1"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-gray-400 mb-0.5">Y Range</label>
            <div className="flex gap-1">
              <input
                type="number"
                value={graph.y_range?.[0] ?? -5}
                onChange={e => update({ y_range: [Number(e.target.value), graph.y_range?.[1] ?? 5] })}
                className="w-full text-xs border border-gray-200 rounded px-2 py-1"
              />
              <span className="text-xs text-gray-400 self-center">to</span>
              <input
                type="number"
                value={graph.y_range?.[1] ?? 5}
                onChange={e => update({ y_range: [graph.y_range?.[0] ?? -5, Number(e.target.value)] })}
                className="w-full text-xs border border-gray-200 rounded px-2 py-1"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-gray-400 mb-0.5">Step</label>
            <input
              type="number"
              value={graph.step ?? 1}
              onChange={e => update({ step: Number(e.target.value) || 1 })}
              min={0.5}
              step={0.5}
              className="w-full text-xs border border-gray-200 rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-[11px] text-gray-400 mb-0.5">Title</label>
            <input
              type="text"
              value={graph.title || ''}
              onChange={e => update({ title: e.target.value })}
              placeholder="Optional title"
              className="w-full text-xs border border-gray-200 rounded px-2 py-1"
            />
          </div>
        </div>
      )}

      {/* Live preview */}
      <div className="flex justify-center bg-gray-50 rounded-lg p-3">
        <CoordinateDiagram data={graph} />
      </div>
    </div>
  )
}
