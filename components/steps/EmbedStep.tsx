'use client'

import { CoordinateDiagram } from '@/lib/coordinate-diagram'
import { MermaidDiagram } from '@/lib/mermaid-diagram'
import type { EmbedContent } from '@/lib/types/lesson-player'

interface EmbedStepProps {
  title: string
  content: EmbedContent
}

export function EmbedStep({ title, content }: EmbedStepProps) {
  const sub = content.sub_type

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#0C447C] bg-[#E6F1FB] px-2 py-0.5 rounded-full">
          {sub === 'math_graph' ? 'Graph' : sub === 'image' ? 'Image' : 'Diagram'}
        </span>
        {title && <span className="text-xs font-medium text-[#6B635A]">{title}</span>}
      </div>

      <div>
        {sub === 'math_graph' && content.graph_data && (
          <div className="flex justify-center">
            <CoordinateDiagram data={content.graph_data} />
          </div>
        )}
        {sub === 'image' && content.url && (
          <div>
            <img src={content.url} alt={content.alt || ''} className="max-w-full rounded-lg mx-auto" />
            {content.caption && (
              <p className="text-sm text-[#6B635A] text-center mt-2">{content.caption}</p>
            )}
          </div>
        )}
        {sub === 'diagram' && content.mermaid && (
          <MermaidDiagram chart={content.mermaid} className="bg-white rounded-lg p-4 border border-gray-100" />
        )}
      </div>
    </div>
  )
}
