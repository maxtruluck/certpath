'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const CALLOUT_STYLES = [
  { value: 'tip', label: 'Tip', border: 'border-teal-400', bg: 'bg-teal-50', defaultTitle: 'Tip' },
  { value: 'warning', label: 'Warning', border: 'border-amber-400', bg: 'bg-amber-50', defaultTitle: 'Warning' },
  { value: 'key_concept', label: 'Key Concept', border: 'border-purple-400', bg: 'bg-purple-50', defaultTitle: 'Key Concept' },
  { value: 'exam_note', label: 'Exam Note', border: 'border-red-400', bg: 'bg-red-50', defaultTitle: 'Exam Note' },
]

interface CalloutStepEditorProps {
  content: { callout_style: string; title: string; markdown: string }
  onChange: (content: { callout_style: string; title: string; markdown: string }) => void
}

export default function CalloutStepEditor({ content, onChange }: CalloutStepEditorProps) {
  const [preview, setPreview] = useState(false)
  const style = CALLOUT_STYLES.find(s => s.value === content.callout_style) || CALLOUT_STYLES[0]

  const setStyle = (value: string) => {
    const s = CALLOUT_STYLES.find(cs => cs.value === value)
    onChange({ ...content, callout_style: value, title: s?.defaultTitle || content.title })
  }

  return (
    <div className="space-y-3">
      {/* Style picker */}
      <div className="flex flex-wrap gap-1.5">
        {CALLOUT_STYLES.map(cs => (
          <button
            key={cs.value}
            onClick={() => setStyle(cs.value)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              content.callout_style === cs.value
                ? `${cs.bg} ${cs.border} border-2`
                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            <div className={`w-1 h-4 rounded-full ${cs.border.replace('border-', 'bg-')}`} />
            {cs.label}
          </button>
        ))}
      </div>

      {/* Title */}
      <input
        type="text"
        value={content.title || ''}
        onChange={e => onChange({ ...content, title: e.target.value })}
        placeholder="Callout title"
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
      />

      {/* Markdown editor */}
      <div>
        <div className="flex items-center justify-end mb-2">
          <div className="flex gap-1">
            <button
              onClick={() => setPreview(false)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                !preview ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Write
            </button>
            <button
              onClick={() => setPreview(true)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                preview ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Preview
            </button>
          </div>
        </div>
        {preview ? (
          <div className={`border-l-4 ${style.border} ${style.bg} rounded-r-lg p-4`}>
            <p className="text-sm font-semibold text-gray-800 mb-2">{content.title}</p>
            <div className="prose prose-sm max-w-none [&_p]:text-sm [&_p]:text-gray-700">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content.markdown || '*No content yet*'}</ReactMarkdown>
            </div>
          </div>
        ) : (
          <textarea
            value={content.markdown || ''}
            onChange={e => onChange({ ...content, markdown: e.target.value })}
            rows={5}
            className="w-full text-sm bg-white border border-gray-200 rounded-lg px-4 py-3 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            placeholder="Write your callout content in Markdown..."
            autoFocus
          />
        )}
      </div>
    </div>
  )
}
