'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { richMarkdownComponents } from '@/lib/markdown-components'

const PROSE_CLASSES =
  'prose prose-sm max-w-none [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-[#6B635A] [&_ul]:text-sm [&_ul]:text-[#6B635A] [&_ol]:text-sm [&_ol]:text-[#6B635A] [&_code]:text-xs [&_code]:bg-[#EBE8E2] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_pre]:bg-gray-800 [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:text-xs [&_pre]:text-gray-100'

export default function MarkdownContent({
  content,
  className,
}: {
  content: string
  className?: string
}) {
  return (
    <div className={`${PROSE_CLASSES} ${className || ''}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={richMarkdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
