'use client'

import { VideoEmbed } from '@/lib/markdown-components'

interface WatchStepProps {
  title: string
  videoUrl: string
}

export function WatchStep({ title, videoUrl }: WatchStepProps) {
  return (
    <div>
      {title && (
        <h2 className="text-lg font-bold text-[#2C2825] mb-4">{title}</h2>
      )}
      <div className="mb-2">
        <VideoEmbed url={videoUrl} />
      </div>
    </div>
  )
}
