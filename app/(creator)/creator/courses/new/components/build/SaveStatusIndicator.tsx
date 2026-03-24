'use client'

import type { SaveStatus } from './types'

export default function SaveStatusIndicator({ status }: { status: SaveStatus }) {
  if (status === 'idle') return null

  const config = {
    saving: { dotClass: 'bg-blue-400 animate-pulse', text: 'Saving...' },
    saved: { dotClass: 'bg-green-500', text: 'All changes saved' },
    error: { dotClass: 'bg-red-500', text: 'Failed to save' },
  }[status]

  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
      <span className="text-xs text-gray-400">{config.text}</span>
    </div>
  )
}
