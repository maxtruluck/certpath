'use client'

import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Step } from './types'

function VideoEmbed({ url }: { url: string }) {
  let embedUrl = url
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/)
  if (ytMatch) embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`

  return (
    <div className="aspect-video rounded-lg overflow-hidden bg-black mb-4">
      <iframe
        src={embedUrl}
        className="w-full h-full"
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      />
    </div>
  )
}

function StepContent({ step }: { step: Step }) {
  switch (step.step_type) {
    case 'read':
      return (
        <div className="prose prose-sm max-w-none [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-gray-700 [&_ul]:text-sm [&_ul]:text-gray-700 [&_ol]:text-sm [&_ol]:text-gray-700 [&_code]:text-xs [&_code]:bg-gray-200 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{step.content?.markdown || '*No content*'}</ReactMarkdown>
        </div>
      )
    case 'watch':
      return step.content?.url ? <VideoEmbed url={step.content.url} /> : <p className="text-sm text-gray-400">No video URL</p>
    case 'answer':
      return (
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <p className="text-sm text-gray-900 mb-2">{step.content?.question_text || 'No question'}</p>
          {step.content?.options?.length > 0 && (
            <div className="space-y-1.5">
              {step.content.options.map((opt: any) => (
                <div key={opt.id} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-100">
                  <span className="w-5 h-5 rounded-full border-2 border-gray-200 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{opt.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    case 'graph':
      return (
        <div className="flex items-center justify-center py-8 bg-gray-50 rounded-lg">
          <span className="text-sm text-gray-400">Graph preview</span>
        </div>
      )
    default:
      return null
  }
}

const STEP_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  read: { bg: 'bg-[#E1F5EE]', text: 'text-[#085041]', label: 'Read' },
  watch: { bg: 'bg-[#EEEDFE]', text: 'text-[#3C3489]', label: 'Watch' },
  answer: { bg: 'bg-[#FAECE7]', text: 'text-[#712B13]', label: 'Answer' },
  graph: { bg: 'bg-[#E6F1FB]', text: 'text-[#0C447C]', label: 'Graph' },
}

export default function LearnerPreviewModal({
  courseId,
  lessonId,
  lessonTitle,
  moduleName,
  lessonIndex,
  totalLessons,
  cardColor,
  onClose,
}: {
  courseId: string
  lessonId: string
  lessonTitle: string
  moduleName: string
  lessonIndex: number
  totalLessons: number
  cardColor: string
  onClose: () => void
}) {
  const [steps, setSteps] = useState<Step[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/creator/courses/${courseId}/lessons/${lessonId}/steps`)
      .then(r => r.json())
      .then(data => setSteps(Array.isArray(data) ? data : []))
      .catch(() => setSteps([]))
      .finally(() => setLoading(false))
  }, [courseId, lessonId])

  const step = steps[currentIdx]
  const badge = step ? STEP_BADGE[step.step_type] : null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-gray-100 rounded-2xl w-full max-w-2xl my-8" onClick={e => e.stopPropagation()}>
        {/* Accent bar */}
        <div className="h-1.5 rounded-t-2xl" style={{ backgroundColor: cardColor }} />

        <div className="p-6">
          {/* Breadcrumb */}
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-gray-400">
              {moduleName} &middot; Lesson {lessonIndex + 1} of {totalLessons}
            </p>
            {steps.length > 0 && (
              <p className="text-xs text-gray-400">Step {currentIdx + 1} of {steps.length}</p>
            )}
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-3">{lessonTitle}</h2>

          {/* Segmented progress bar */}
          {steps.length > 0 && (
            <div className="flex gap-1 mb-4">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1 rounded-full flex-1 transition-colors ${
                    idx <= currentIdx ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          )}

          {loading ? (
            <div className="h-40 bg-gray-200 rounded-lg animate-pulse" />
          ) : steps.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No steps in this lesson</p>
          ) : (
            <>
              {/* Step type badge */}
              {badge && (
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold mb-3 ${badge.bg} ${badge.text}`}>
                  {badge.label}
                </span>
              )}

              {/* Step content */}
              <StepContent step={step} />
            </>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={() => currentIdx > 0 ? setCurrentIdx(currentIdx - 1) : onClose()}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {currentIdx > 0 ? 'Back' : 'Close'}
            </button>
            {steps.length > 0 && currentIdx < steps.length - 1 ? (
              <button
                onClick={() => setCurrentIdx(currentIdx + 1)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back to editor
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
