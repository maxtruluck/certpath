'use client'

import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { lessonMarkdownComponents, VideoEmbed } from '@/lib/markdown-components'

interface ReadStepProps {
  title: string
  content: string
  videoUrl?: string | null
  accentColor?: string
}

export function ReadStep({ title, content, videoUrl, accentColor = '#2C2825' }: ReadStepProps) {
  const components = useMemo(() => lessonMarkdownComponents(accentColor), [accentColor])

  return (
    <div>
      {title && (
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{title}</h2>
      )}
      {videoUrl && <VideoEmbed url={videoUrl} />}
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content || '*No content*'}
      </ReactMarkdown>
    </div>
  )
}
