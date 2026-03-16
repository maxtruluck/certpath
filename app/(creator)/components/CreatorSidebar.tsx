'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

const navItems = [
  { href: '/creator', label: 'Dashboard', icon: DashboardIcon },
  { href: '/creator/courses', label: 'My Courses', icon: CoursesIcon },
  { href: '/creator/courses/new', label: 'Create Course', icon: PlusIcon },
  { href: '/creator/import-guide', label: 'Import Guide', icon: ImportGuideIcon },
  { href: '/creator/earnings', label: 'Earnings', icon: EarningsIcon },
  { href: '/creator/settings', label: 'Settings', icon: SettingsIcon },
]

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function CoursesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 20 20" fill="none">
      <path d="M3 4h14M3 4v12a1 1 0 001 1h12a1 1 0 001-1V4M3 4l1-2h12l1 2M7 8h6M7 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
      <line x1="10" y1="6" x2="10" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="6" y1="10" x2="14" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function ImportGuideIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 20 20" fill="none">
      <path d="M4 3h8l4 4v10a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 3v4h4M7 13h6M7 10h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function EarningsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <line x1="2" y1="8" x2="18" y2="8" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="14" cy="12" r="1.5" stroke="currentColor" strokeWidth="1" />
    </svg>
  )
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.93 4.93l1.41 1.41M13.66 13.66l1.41 1.41M4.93 15.07l1.41-1.41M13.66 6.34l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export default function CreatorSidebar() {
  const pathname = usePathname()
  const [creatorName, setCreatorName] = useState('Creator')

  useEffect(() => {
    fetch('/api/creator/dashboard')
      .then(r => r.json())
      .then(d => {
        if (d.creator?.creator_name) setCreatorName(d.creator.creator_name)
      })
      .catch(() => {})
  }, [])

  return (
    <aside className="w-[240px] bg-[#F5F3EF] border-r border-[#E8E4DD] flex flex-col fixed h-full z-10">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-[#E8E4DD]">
        <Link href="/creator" className="flex items-baseline gap-0.5">
          <span className="font-semibold text-[#2C2825] text-[17px] tracking-tight">open</span>
          <span className="font-extrabold text-[#2C2825] text-[17px] tracking-tight">ED</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-0.5">
        {navItems.map(item => {
          const isActive =
            (item.href === '/creator' && pathname === '/creator') ||
            (item.href === '/creator/courses' && pathname === '/creator/courses') ||
            (item.href !== '/creator' && item.href !== '/creator/courses' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-[#2C2825] text-[#F5F3EF] shadow-sm'
                  : 'text-[#6B635A] hover:bg-[#EBE8E2] hover:text-[#2C2825]'
              }`}
            >
              <item.icon className={isActive ? 'text-[#D4CFC7]' : 'text-[#A39B90]'} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="px-4 py-4 border-t border-[#E8E4DD]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#2C2825] flex items-center justify-center">
            <span className="text-[#F5F3EF] font-bold text-xs">{creatorName[0]?.toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#2C2825] truncate">{creatorName}</p>
            <p className="text-[11px] text-[#A39B90]">Creator</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
