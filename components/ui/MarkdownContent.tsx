'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'

function getVideoEmbedUrl(url: string): string | null {
  let match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/)
  if (match) return `https://www.youtube.com/embed/${match[1]}`
  match = url.match(/vimeo\.com\/(\d+)/)
  if (match) return `https://player.vimeo.com/video/${match[1]}`
  return null
}

const PROSE_CLASSES =
  'prose prose-sm max-w-none [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-[#6B635A] [&_ul]:text-sm [&_ul]:text-[#6B635A] [&_ol]:text-sm [&_ol]:text-[#6B635A] [&_code]:text-xs [&_code]:bg-[#EBE8E2] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_pre]:bg-gray-800 [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:text-xs [&_pre]:text-gray-100'

// Custom component overrides to handle bare video URLs as embeds
const components: Components = {
  p({ children, ...props }) {
    // Check if this paragraph contains only a bare video URL
    if (
      children &&
      typeof children === 'string'
    ) {
      const trimmed = children.trim()
      const embedUrl = getVideoEmbedUrl(trimmed)
      if (embedUrl) {
        return (
          <div className="aspect-video my-4">
            <iframe
              src={embedUrl}
              className="w-full h-full rounded-lg"
              allowFullScreen
              loading="lazy"
              title="Video"
            />
          </div>
        )
      }
    }
    // Check if children is an array with a single string child
    if (Array.isArray(children) && children.length === 1 && typeof children[0] === 'string') {
      const trimmed = children[0].trim()
      const embedUrl = getVideoEmbedUrl(trimmed)
      if (embedUrl) {
        return (
          <div className="aspect-video my-4">
            <iframe
              src={embedUrl}
              className="w-full h-full rounded-lg"
              allowFullScreen
              loading="lazy"
              title="Video"
            />
          </div>
        )
      }
    }
    return <p {...props}>{children}</p>
  },
}

export default function MarkdownContent({
  content,
  className,
}: {
  content: string
  className?: string
}) {
  return (
    <div className={`${PROSE_CLASSES} ${className || ''}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
