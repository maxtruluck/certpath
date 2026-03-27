import { useMemo } from 'react'

export interface MarkdownSection {
  index: number
  title: string
  startLine: number
  endLine: number
  content: string
}

/**
 * Parses markdown body into sections based on ## headings.
 * Each ## heading starts a new section card in the learner view.
 * Content before the first ## heading is treated as section 0 (intro).
 */
export function parseMarkdownSections(markdown: string): MarkdownSection[] {
  if (!markdown) return []

  const lines = markdown.split('\n')
  const sections: MarkdownSection[] = []
  let currentSection: MarkdownSection | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const headingMatch = line.match(/^##\s+(.+)$/)

    if (headingMatch) {
      // Close previous section
      if (currentSection) {
        currentSection.endLine = i - 1
        currentSection.content = lines.slice(currentSection.startLine, i).join('\n')
        sections.push(currentSection)
      }

      currentSection = {
        index: sections.length,
        title: headingMatch[1].trim(),
        startLine: i,
        endLine: i,
        content: '',
      }
    } else if (!currentSection && line.trim()) {
      // Content before first heading -- treat as intro section
      currentSection = {
        index: 0,
        title: 'Introduction',
        startLine: 0,
        endLine: 0,
        content: '',
      }
    }
  }

  // Close last section
  if (currentSection) {
    currentSection.endLine = lines.length - 1
    currentSection.content = lines.slice(currentSection.startLine).join('\n')
    sections.push(currentSection)
  }

  // Reindex sections
  return sections.map((s, i) => ({ ...s, index: i }))
}

export function useMarkdownSections(markdown: string): MarkdownSection[] {
  return useMemo(() => parseMarkdownSections(markdown), [markdown])
}
