'use client'

import { usePathname } from 'next/navigation'

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Dashboard and wizard pages use their own full-width layout (no sidebar)
  const isFullWidth =
    pathname === '/creator' ||
    pathname === '/creator/courses/new' ||
    pathname.startsWith('/creator/courses/new?')

  if (isFullWidth) {
    return (
      <div className="min-h-screen bg-white">
        {children}
      </div>
    )
  }

  // Legacy pages that still use sidebar (earnings, settings as page, courses list)
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-10 py-10">
        {children}
      </div>
    </div>
  )
}
