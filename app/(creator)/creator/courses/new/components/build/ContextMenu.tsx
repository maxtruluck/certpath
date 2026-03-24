'use client'

import { useState, useRef, useEffect } from 'react'

interface MenuItem {
  label: string
  onClick: () => void
  destructive?: boolean
}

interface Divider {
  divider: true
}

type MenuEntry = MenuItem | Divider

function isDivider(entry: MenuEntry): entry is Divider {
  return 'divider' in entry
}

export default function ContextMenu({ items }: { items: MenuEntry[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
        className="p-1 -m-1 text-gray-300 hover:text-gray-500 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="8" cy="3" r="1.5" />
          <circle cx="8" cy="8" r="1.5" />
          <circle cx="8" cy="13" r="1.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[160px]">
          {items.map((item, idx) => {
            if (isDivider(item)) {
              return <div key={idx} className="border-t border-gray-100 my-1" />
            }
            return (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation()
                  setOpen(false)
                  item.onClick()
                }}
                className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors ${
                  item.destructive ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'
                }`}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
