'use client'

import { CREATOR_TIPS } from '../lib/creator-tips'

export default function CreatorTip({
  tipKey,
  dismissedTips,
  onDismiss,
}: {
  tipKey: string
  dismissedTips: Set<string>
  onDismiss: (key: string) => void
}) {
  const tip = CREATOR_TIPS[tipKey]
  if (!tip || dismissedTips.has(tipKey)) return null

  return (
    <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700">
      <span className="flex-shrink-0 mt-0.5">{tip.icon}</span>
      <p className="flex-1 leading-relaxed">{tip.text}</p>
      <button
        onClick={() => onDismiss(tipKey)}
        className="flex-shrink-0 text-blue-400 hover:text-blue-600 mt-0.5"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M3 3L9 9M3 9L9 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}
