'use client'

import React from 'react'
import type { Components } from 'react-markdown'

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
    return <p {...props}>{children}</p>
  },
}
