'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface ReadStepEditorProps {
  content: { markdown: string }
  onChange: (content: { markdown: string }) => void
}

export default function ReadStepEditor({ content, onChange }: ReadStepEditorProps) {
  const [preview, setPreview] = useState(false)

  return (
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
        <div className="bg-white border border-gray-200 rounded-lg p-4 prose prose-sm max-w-none min-h-[200px] [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-gray-700 [&_ul]:text-sm [&_ul]:text-gray-700 [&_ol]:text-sm [&_ol]:text-gray-700 [&_code]:text-xs [&_code]:bg-gray-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_pre]:bg-gray-800 [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:text-xs [&_pre]:text-gray-100">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content.markdown || '*No content yet*'}</ReactMarkdown>
        </div>
      ) : (
        <textarea
          value={content.markdown || ''}
          onChange={e => onChange({ markdown: e.target.value })}
          rows={8}
          className="w-full text-sm bg-white border border-gray-200 rounded-lg px-4 py-3 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          placeholder="Write your content in Markdown..."
          autoFocus
        />
      )}
    </div>
  )
}
