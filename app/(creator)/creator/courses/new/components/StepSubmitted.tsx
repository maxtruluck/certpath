'use client'

import { useRouter } from 'next/navigation'

interface SubmitResult {
  status: string
  warnings: string[]
  stats: { question_count: number; module_count: number; topic_count: number }
}

export default function StepSubmitted({ result }: { result: SubmitResult }) {
  const router = useRouter()

  return (
    <div className="max-w-lg mx-auto text-center py-8">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M8 16L14 22L24 10" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">Course Submitted for Review</h2>
      <p className="text-sm text-gray-500 mb-8">Our team will review your course and get back to you within 48 hours.</p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-2xl font-bold text-gray-900">{result.stats.question_count}</p>
          <p className="text-xs text-gray-500">Questions</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-2xl font-bold text-gray-900">{result.stats.module_count}</p>
          <p className="text-xs text-gray-500">Modules</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-2xl font-bold text-gray-900">{result.stats.topic_count}</p>
          <p className="text-xs text-gray-500">Topics</p>
        </div>
      </div>

      <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
        <div className="w-2 h-2 rounded-full bg-amber-500" />
        In Review
      </div>

      {result.warnings && result.warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 text-left">
          <h3 className="text-sm font-semibold text-amber-800 mb-2">Submitted with warnings</h3>
          <ul className="space-y-1">
            {result.warnings.map((w, i) => (
              <li key={i} className="text-xs text-amber-700">{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => router.push('/creator')}
          className="btn-primary px-6 py-2.5 text-sm"
        >
          Back to Dashboard
        </button>
        <button className="btn-ghost px-6 py-2.5 text-sm">
          Preview as Learner
        </button>
      </div>
    </div>
  )
}
