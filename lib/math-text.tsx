'use client'

import { useMemo } from 'react'
import katex from 'katex'

/**
 * Renders text containing LaTeX math expressions.
 * Inline math: $...$  |  Display math: $$...$$
 */
export function MathText({ text, className }: { text: string; className?: string }) {
  const html = useMemo(() => renderMathInText(text), [text])
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />
}

/**
 * Block-level math text renderer (wraps in a div).
 */
export function MathBlock({ text, className }: { text: string; className?: string }) {
  const html = useMemo(() => renderMathInText(text), [text])
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />
}

// Split on $$...$$ (display) and $...$ (inline), render each LaTeX segment
function renderMathInText(text: string): string {
  // First pass: display math $$...$$
  const parts: string[] = []
  let remaining = text

  while (remaining.length > 0) {
    const displayStart = remaining.indexOf('$$')
    if (displayStart === -1) {
      parts.push(renderInlineMath(remaining))
      break
    }

    // Text before display math
    if (displayStart > 0) {
      parts.push(renderInlineMath(remaining.slice(0, displayStart)))
    }

    const displayEnd = remaining.indexOf('$$', displayStart + 2)
    if (displayEnd === -1) {
      // No closing $$ - treat as plain text
      parts.push(renderInlineMath(remaining.slice(displayStart)))
      break
    }

    const latex = remaining.slice(displayStart + 2, displayEnd)
    try {
      parts.push(katex.renderToString(latex, { displayMode: true, throwOnError: false }))
    } catch {
      parts.push(`$$${latex}$$`)
    }

    remaining = remaining.slice(displayEnd + 2)
  }

  return parts.join('')
}

// Render inline $...$ math within a text segment
function renderInlineMath(text: string): string {
  const parts: string[] = []
  let remaining = text

  while (remaining.length > 0) {
    const start = remaining.indexOf('$')
    if (start === -1) {
      parts.push(escapeHtml(remaining))
      break
    }

    // Check it's not escaped
    if (start > 0 && remaining[start - 1] === '\\') {
      parts.push(escapeHtml(remaining.slice(0, start - 1)) + '$')
      remaining = remaining.slice(start + 1)
      continue
    }

    if (start > 0) {
      parts.push(escapeHtml(remaining.slice(0, start)))
    }

    const end = remaining.indexOf('$', start + 1)
    if (end === -1) {
      parts.push(escapeHtml(remaining.slice(start)))
      break
    }

    const latex = remaining.slice(start + 1, end)
    try {
      parts.push(katex.renderToString(latex, { displayMode: false, throwOnError: false }))
    } catch {
      parts.push(`$${latex}$`)
    }

    remaining = remaining.slice(end + 1)
  }

  return parts.join('')
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
