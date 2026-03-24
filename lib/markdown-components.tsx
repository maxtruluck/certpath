'use client'

import React, { useMemo } from 'react'
import type { Components } from 'react-markdown'
import katex from 'katex'

// ─── Math Rendering Helper ──────────────────────────────────────

/** Render $...$ (inline) and $$...$$ (display) LaTeX in a text string */
function renderMathInText(text: string): string {
  // Pass 1: display math $$...$$
  const parts: string[] = []
  let remaining = text

  while (remaining.length > 0) {
    const ds = remaining.indexOf('$$')
    if (ds === -1) { parts.push(renderInlineMath(remaining)); break }
    if (ds > 0) parts.push(renderInlineMath(remaining.slice(0, ds)))
    const de = remaining.indexOf('$$', ds + 2)
    if (de === -1) { parts.push(renderInlineMath(remaining.slice(ds))); break }
    const latex = remaining.slice(ds + 2, de)
    try { parts.push(katex.renderToString(latex, { displayMode: true, throwOnError: false })) }
    catch { parts.push(`$$${latex}$$`) }
    remaining = remaining.slice(de + 2)
  }
  return parts.join('')
}

function renderInlineMath(text: string): string {
  const parts: string[] = []
  let rem = text
  while (rem.length > 0) {
    const s = rem.indexOf('$')
    if (s === -1) { parts.push(escapeHtml(rem)); break }
    if (s > 0 && rem[s - 1] === '\\') {
      parts.push(escapeHtml(rem.slice(0, s - 1)) + '$')
      rem = rem.slice(s + 1); continue
    }
    if (s > 0) parts.push(escapeHtml(rem.slice(0, s)))
    const e = rem.indexOf('$', s + 1)
    if (e === -1) { parts.push(escapeHtml(rem.slice(s))); break }
    const latex = rem.slice(s + 1, e)
    try { parts.push(katex.renderToString(latex, { displayMode: false, throwOnError: false })) }
    catch { parts.push(`$${latex}$`) }
    rem = rem.slice(e + 1)
  }
  return parts.join('')
}

function escapeHtml(t: string): string {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** React component that renders text with inline/display math */
function MathSpan({ text }: { text: string }) {
  const html = useMemo(() => renderMathInText(text), [text])
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}

/** Process React children: replace string nodes containing $ with rendered math */
function processMathChildren(children: React.ReactNode): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (typeof child === 'string' && child.includes('$')) {
      return <MathSpan text={child} />
    }
    return child
  })
}

// ─── Video Embed Helpers ─────────────────────────────────────────

export function getVideoEmbedUrl(url: string): string | null {
  let match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
  if (match) return `https://www.youtube.com/embed/${match[1]}`
  match = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/)
  if (match) return `https://player.vimeo.com/video/${match[1]}`
  return null
}

export function VideoEmbed({ url }: { url: string }) {
  const embedUrl = getVideoEmbedUrl(url)
  if (!embedUrl) return null
  return (
    <div className="my-4 rounded-lg overflow-hidden border border-[#E8E4DD] aspect-video">
      <iframe
        src={embedUrl}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
        title="Video"
      />
    </div>
  )
}

// ─── Rich Markdown Component Overrides ───────────────────────────

/** Component overrides for ReactMarkdown that handle images and video embeds */
export const richMarkdownComponents: Components = {
  img: ({ src, alt }) => (
    <figure className="my-4">
      <img
        src={src}
        alt={alt || ''}
        loading="lazy"
        className="max-w-full rounded-lg border border-[#E8E4DD] mx-auto"
        onError={(e) => {
          const target = e.currentTarget
          target.style.display = 'none'
          const placeholder = target.nextElementSibling as HTMLElement | null
          if (placeholder) placeholder.style.display = 'flex'
        }}
      />
      {alt && (
        <div
          className="hidden items-center justify-center bg-[#F5F3EF] border border-[#E8E4DD] rounded-lg p-8 text-sm text-[#A39B90] italic text-center"
        >
          {alt}
        </div>
      )}
      {alt && <figcaption className="text-xs text-[#A39B90] text-center mt-2 italic">{alt}</figcaption>}
    </figure>
  ),
  p: ({ children, ...props }) => {
    // Check if paragraph is a single bare video URL
    if (children && typeof children === 'string') {
      const trimmed = children.trim()
      if (getVideoEmbedUrl(trimmed)) {
        return <VideoEmbed url={trimmed} />
      }
    }
    // Check if children is an array with a single string
    if (Array.isArray(children) && children.length === 1 && typeof children[0] === 'string') {
      const trimmed = children[0].trim()
      if (getVideoEmbedUrl(trimmed)) {
        return <VideoEmbed url={trimmed} />
      }
    }
    // Check if single child is an <a> tag pointing to a video
    if (React.Children.count(children) === 1) {
      const child = React.Children.toArray(children)[0]
      if (React.isValidElement(child) && (child.props as any)?.href) {
        const href = (child.props as any).href
        if (getVideoEmbedUrl(href)) {
          return <VideoEmbed url={href} />
        }
      }
    }
    return <p {...props}>{processMathChildren(children)}</p>
  },
  li: ({ children, ...props }) => <li {...props}>{processMathChildren(children)}</li>,
  strong: ({ children, ...props }) => <strong {...props}>{processMathChildren(children)}</strong>,
  em: ({ children, ...props }) => <em {...props}>{processMathChildren(children)}</em>,
  blockquote: ({ children, ...props }) => <blockquote {...props}>{children}</blockquote>,
  h2: ({ children, ...props }) => <h2 {...props}>{processMathChildren(children)}</h2>,
  h3: ({ children, ...props }) => <h3 {...props}>{processMathChildren(children)}</h3>,
}

// ─── Lesson Player Typography ────────────────────────────────────

/** Typography-optimized markdown components for the lesson player.
 *  Accepts accentColor for blockquote borders and link colors. */
export function lessonMarkdownComponents(accentColor: string = '#2C2825'): Components {
  return {
    h1: ({ children }) => (
      <h1 className="text-2xl font-bold text-gray-900 mt-10 mb-4 first:mt-0 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-gray-100 [&:not(:first-child)]:pt-6">
        {processMathChildren(children)}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3 first:mt-0 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-gray-100 [&:not(:first-child)]:pt-5">
        {processMathChildren(children)}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-[17px] font-semibold text-gray-800 mt-6 mb-2">
        {processMathChildren(children)}
      </h3>
    ),
    p: ({ children }) => {
      // Check for video URLs
      if (children && typeof children === 'string') {
        const trimmed = children.trim()
        if (getVideoEmbedUrl(trimmed)) return <VideoEmbed url={trimmed} />
      }
      if (Array.isArray(children) && children.length === 1 && typeof children[0] === 'string') {
        const trimmed = children[0].trim()
        if (getVideoEmbedUrl(trimmed)) return <VideoEmbed url={trimmed} />
      }
      if (React.Children.count(children) === 1) {
        const child = React.Children.toArray(children)[0]
        if (React.isValidElement(child) && (child.props as any)?.href) {
          const href = (child.props as any).href
          if (getVideoEmbedUrl(href)) return <VideoEmbed url={href} />
        }
      }
      return <p className="text-base leading-[1.8] text-gray-800 mb-5">{processMathChildren(children)}</p>
    },
    strong: ({ children }) => (
      <strong className="font-semibold text-gray-900">{processMathChildren(children)}</strong>
    ),
    em: ({ children }) => (
      <em>{processMathChildren(children)}</em>
    ),
    blockquote: ({ children }) => (
      <blockquote
        className="border-l-[3px] pl-4 my-6 italic text-gray-600"
        style={{ borderColor: accentColor }}
      >
        {children}
      </blockquote>
    ),
    ul: ({ children }) => (
      <ul className="list-disc pl-6 space-y-2 mb-5 text-base leading-[1.7] text-gray-800">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal pl-6 space-y-2 mb-5 text-base leading-[1.7] text-gray-800">{children}</ol>
    ),
    li: ({ children }) => (
      <li>{processMathChildren(children)}</li>
    ),
    hr: () => (
      <hr className="my-8 border-gray-200" />
    ),
    img: ({ src, alt }) => (
      <figure className="my-6">
        <img
          src={src}
          alt={alt || ''}
          loading="lazy"
          className="max-w-full rounded-lg mx-auto"
        />
        {alt && <figcaption className="text-xs text-gray-400 text-center mt-2">{alt}</figcaption>}
      </figure>
    ),
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:opacity-80"
        style={{ color: accentColor }}
      >
        {children}
      </a>
    ),
    code: ({ children, className }) => {
      const isBlock = className?.startsWith('language-')
      if (isBlock) {
        return (
          <pre className="text-sm font-mono bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-5">
            <code>{children}</code>
          </pre>
        )
      }
      return <code className="text-sm font-mono bg-gray-100 px-1.5 py-0.5 rounded">{children}</code>
    },
    pre: ({ children }) => <>{children}</>,
    table: ({ children }) => (
      <div className="overflow-x-auto my-5">
        <table className="w-full text-sm text-left border-collapse">
          {children}
        </table>
      </div>
    ),
    th: ({ children }) => (
      <th className="px-3 py-2 font-semibold text-gray-900 border-b-2 border-gray-200 bg-gray-50">{children}</th>
    ),
    td: ({ children }) => (
      <td className="px-3 py-2 text-gray-700 border-b border-gray-100">{children}</td>
    ),
  }
}

/** Calculate reading time in minutes. Returns null if under 200 words. */
export function getReadingTime(markdown: string): number | null {
  const words = markdown.trim().split(/\s+/).length
  if (words < 200) return null
  return Math.ceil(words / 200)
}
