'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

const navItems = [
  { href: '/creator', label: 'Dashboard', icon: DashboardIcon },
  { href: '/creator/courses', label: 'My Courses', icon: CoursesIcon },
  { href: '/creator/courses/new', label: 'Create Course', icon: PlusIcon },
  { href: '/creator/earnings', label: 'Earnings', icon: EarningsIcon },
  { href: '/creator/settings', label: 'Settings', icon: SettingsIcon },
]

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function CoursesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 4h14M3 4v12a1 1 0 001 1h12a1 1 0 001-1V4M3 4l1-2h12l1 2M7 8h6M7 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
      <line x1="10" y1="6" x2="10" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="6" y1="10" x2="14" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function EarningsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <line x1="2" y1="8" x2="18" y2="8" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="14" cy="12" r="1.5" stroke="currentColor" strokeWidth="1" />
    </svg>
  )
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
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
    <aside className="w-[220px] bg-white border-r border-gray-200 flex flex-col fixed h-full z-10">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <Link href="/creator" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">O</span>
          </div>
          <div>
            <span className="font-semibold text-gray-900 text-sm">open</span>
            <span className="font-bold text-blue-500 text-sm">ED</span>
            <span className="text-gray-400 text-xs ml-1">Creator</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(item => {
          const isActive =
            (item.href === '/creator' && pathname === '/creator') ||
            (item.href === '/creator/courses' && pathname === '/creator/courses') ||
            (item.href !== '/creator' && item.href !== '/creator/courses' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600 border-l-2 border-blue-500 -ml-px'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon className={isActive ? 'text-blue-500' : 'text-gray-400'} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 font-semibold text-xs">{creatorName[0]?.toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{creatorName}</p>
            <p className="text-xs text-gray-400">Creator</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
