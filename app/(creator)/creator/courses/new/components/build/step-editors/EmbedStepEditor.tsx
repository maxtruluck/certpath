'use client'

import GraphStepEditor from './GraphStepEditor'
import { MermaidDiagram } from '@/lib/mermaid-diagram'

interface EmbedStepEditorProps {
  courseId: string
  content: Record<string, any>
  onChange: (content: Record<string, any>) => void
}

// ─── Image Sub-Editor ───────────────────────────────────────────
function ImageEditor({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Image URL</label>
        <input
          type="text"
          value={content.url || ''}
          onChange={e => onChange({ ...content, url: e.target.value.trim() })}
          placeholder="https://..."
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        />
      </div>

      {content.url && (
        <div className="rounded-lg overflow-hidden border border-gray-200">
          <img src={content.url} alt={content.alt || ''} className="max-h-64 w-full object-contain bg-gray-50" />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] text-gray-400 mb-0.5">Caption</label>
          <input
            type="text"
            value={content.caption || ''}
            onChange={e => onChange({ ...content, caption: e.target.value })}
            placeholder="Optional caption"
            className="w-full text-xs border border-gray-200 rounded px-2 py-1.5"
          />
        </div>
        <div>
          <label className="block text-[11px] text-gray-400 mb-0.5">Alt text</label>
          <input
            type="text"
            value={content.alt || ''}
            onChange={e => onChange({ ...content, alt: e.target.value })}
            placeholder="Describe the image"
            className="w-full text-xs border border-gray-200 rounded px-2 py-1.5"
          />
        </div>
      </div>
    </div>
  )
}

// ─── Diagram Sub-Editor ─────────────────────────────────────────
function DiagramEditor({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Mermaid Syntax</label>
        <textarea
          value={content.mermaid || ''}
          onChange={e => onChange({ ...content, mermaid: e.target.value })}
          rows={8}
          className="w-full text-xs font-mono bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          placeholder={'graph TD;\n  A[Start] --> B[Process];\n  B --> C[End];'}
        />
      </div>
      {content.mermaid?.trim() && (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Preview</label>
          <MermaidDiagram chart={content.mermaid} className="bg-white rounded-lg p-4 border border-gray-200" />
        </div>
      )}
      <p className="text-[11px] text-gray-400">
        Uses Mermaid syntax. Supports flowcharts, sequence diagrams, mind maps, and more.
      </p>
    </div>
  )
}

// ─── Main Embed Editor ──────────────────────────────────────────
export default function EmbedStepEditor({ courseId, content, onChange }: EmbedStepEditorProps) {
  const subType = content.sub_type || 'math_graph'

  return (
    <div>
      {/* Sub-type badge */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-semibold text-[#0C447C] bg-[#E6F1FB] px-2 py-0.5 rounded">
          {subType === 'math_graph' ? 'Math Graph' : subType === 'image' ? 'Image' : 'Diagram'}
        </span>
      </div>

      {subType === 'math_graph' && (
        <GraphStepEditor
          content={{ graph_data: content.graph_data }}
          onChange={(updated) => onChange({ ...content, ...updated })}
        />
      )}
      {subType === 'image' && (
        <ImageEditor content={content} onChange={onChange} />
      )}
      {subType === 'diagram' && (
        <DiagramEditor content={content} onChange={onChange} />
      )}
    </div>
  )
}
