'use client'

import { useState, useRef, useCallback } from 'react'
import CardBoundary from './CardBoundary'
import InlinePill from './InlinePill'
import { useMarkdownSections } from './useMarkdownSections'

// ─── Toolbar ─────────────────────────────────────────────────────
function EditorToolbar({ onInsert }: { onInsert: (text: string) => void }) {
  const tools = [
    { label: 'B', title: 'Bold', insert: '**bold**' },
    { label: 'I', title: 'Italic', insert: '*italic*' },
    { label: 'H1', title: 'Heading 1', insert: '\n# ' },
    { label: 'H2', title: 'Section heading', insert: '\n## ' },
    { label: '--', title: 'Horizontal rule', insert: '\n---\n' },
    { label: '{}', title: 'Code block', insert: '\n```\ncode\n```\n' },
    { label: 'Link', title: 'Link', insert: '[text](url)' },
  ]

  return (
    <div className="flex items-center gap-1 px-3 py-2 bg-gray-50 border-b border-gray-200">
      {tools.map(tool => (
        <button
          key={tool.label}
          type="button"
          onClick={() => onInsert(tool.insert)}
          title={tool.title}
          className="px-2 py-1 text-xs font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
        >
          {tool.label}
        </button>
      ))}
    </div>
  )
}

// ─── Section-Based Editor View ───────────────────────────────────
function SectionView({
  markdown,
  onChange,
  questionCounts,
  conceptCounts,
}: {
  markdown: string
  onChange: (value: string) => void
  questionCounts: Record<number, number>
  conceptCounts: Record<number, { count: number; name: string }>
}) {
  const sections = useMarkdownSections(markdown)
  const totalSections = sections.filter(s => s.title !== 'Introduction' || s.content.trim()).length

  if (sections.length === 0) {
    // No sections yet -- show a single textarea
    return (
      <div className="flex-1 p-4">
        <textarea
          value={markdown}
          onChange={e => onChange(e.target.value)}
          placeholder={'Start writing your lesson content...\n\nUse ## Heading to create card boundaries.\nEach ## heading becomes a separate card in the learner view.'}
          className="w-full h-full min-h-[300px] text-sm text-gray-800 leading-relaxed resize-none focus:outline-none font-mono"
        />
      </div>
    )
  }

  // Render sections with card boundaries between them
  const lines = markdown.split('\n')
  let cardNum = 0

  return (
    <div className="flex-1 p-4 space-y-0">
      {sections.map((section, idx) => {
        cardNum++
        const sectionLines = lines.slice(section.startLine, section.endLine + 1)
        const sectionText = sectionLines.join('\n')
        const qCount = questionCounts[section.index] || 0
        const concept = conceptCounts[section.index]

        return (
          <div key={idx}>
            {idx > 0 && (
              <CardBoundary cardNumber={cardNum} totalCards={totalSections} />
            )}
            <textarea
              value={sectionText}
              onChange={e => {
                const newLines = [...lines]
                const newSectionLines = e.target.value.split('\n')
                newLines.splice(
                  section.startLine,
                  section.endLine - section.startLine + 1,
                  ...newSectionLines
                )
                onChange(newLines.join('\n'))
              }}
              className="w-full text-sm text-gray-800 leading-relaxed resize-none focus:outline-none font-mono min-h-[60px]"
              rows={Math.max(3, sectionLines.length + 1)}
            />
            {/* Inline indicators */}
            <div className="flex items-center gap-2 mt-1 mb-2">
              {concept && concept.count > 0 && (
                <InlinePill
                  variant="concept"
                  label={`${concept.count} concept card extracted -- ${concept.name}`}
                />
              )}
              {qCount > 0 && (
                <InlinePill
                  variant="question"
                  label={`${qCount} question${qCount > 1 ? 's' : ''} after this card`}
                />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main Editor Component ───────────────────────────────────────
export default function MarkdownLessonEditor({
  markdown,
  onChange,
  questionCounts,
  conceptCounts,
}: {
  markdown: string
  onChange: (value: string) => void
  questionCounts: Record<number, number>
  conceptCounts: Record<number, { count: number; name: string }>
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleToolbarInsert = useCallback((text: string) => {
    // Insert at cursor position if raw mode, or append
    onChange(markdown + text)
  }, [markdown, onChange])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <EditorToolbar onInsert={handleToolbarInsert} />
      <div className="flex-1 overflow-y-auto">
        <SectionView
          markdown={markdown}
          onChange={onChange}
          questionCounts={questionCounts}
          conceptCounts={conceptCounts}
        />
      </div>
    </div>
  )
}
