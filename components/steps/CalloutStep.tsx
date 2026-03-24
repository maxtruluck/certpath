'use client'

import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { lessonMarkdownComponents } from '@/lib/markdown-components'
import type { CalloutVariant } from '@/lib/types/lesson-player'

const CALLOUT_STYLES: Record<string, { border: string; bg: string; iconColor: string; label: string }> = {
  tip:         { border: 'border-teal-400',   bg: 'bg-teal-50',   iconColor: 'text-teal-600',   label: 'Tip' },
  warning:     { border: 'border-amber-400',  bg: 'bg-amber-50',  iconColor: 'text-amber-600',  label: 'Warning' },
  key_concept: { border: 'border-purple-400', bg: 'bg-purple-50', iconColor: 'text-purple-600', label: 'Key Concept' },
  exam_note:   { border: 'border-red-400',    bg: 'bg-red-50',    iconColor: 'text-red-600',    label: 'Exam Note' },
}

interface CalloutStepProps {
  variant: CalloutVariant
  title: string
  content: string
  accentColor?: string
}

export function CalloutStep({ variant, title, content, accentColor = '#2C2825' }: CalloutStepProps) {
  const style = CALLOUT_STYLES[variant] || CALLOUT_STYLES.tip
  const mdComponents = useMemo(() => lessonMarkdownComponents(accentColor), [accentColor])

  return (
    <div>
      <div className={`border-l-4 ${style.border} ${style.bg} rounded-r-lg p-5`}>
        <div className="flex items-center gap-2 mb-3">
          <CalloutIcon variant={variant} className={`w-5 h-5 ${style.iconColor}`} />
          <span className={`text-xs font-bold uppercase tracking-wider ${style.iconColor}`}>{style.label}</span>
        </div>
        {title && title.toLowerCase() !== style.label.toLowerCase() && (
          <p className="text-base font-semibold text-[#2C2825] mb-3">{title}</p>
        )}
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
          {content || ''}
        </ReactMarkdown>
      </div>
    </div>
  )
}

function CalloutIcon({ variant, className }: { variant: string; className: string }) {
  switch (variant) {
    case 'tip':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
        </svg>
      )
    case 'warning':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      )
    case 'key_concept':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
        </svg>
      )
    case 'exam_note':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      )
    default:
      return null
  }
}
