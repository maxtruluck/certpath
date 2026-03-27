'use client'

import { usePathname } from 'next/navigation'
import CreatorSidebar from './components/CreatorSidebar'

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isWizard = pathname === '/creator/courses/new' || pathname.startsWith('/creator/courses/new?')

  if (isWizard) {
    return (
      <div className="min-h-screen bg-white">
        {children}
      </div>
    )
  }

  return (
    <div className="flex min-h-screen min-w-[960px] bg-[#FAFAF8]">
      <CreatorSidebar />
      <main className="flex-1 ml-[240px]">
        <div className="max-w-6xl mx-auto px-10 py-10">
          {children}
        </div>
      </main>
    </div>
  )
}
