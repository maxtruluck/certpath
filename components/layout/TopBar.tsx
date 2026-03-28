'use client';

import Link from 'next/link';

interface TopBarProps {
  userInitial?: string;
}

export function TopBar({ userInitial = 'O' }: TopBarProps) {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#eee]">
      <div className="max-w-lg mx-auto flex items-center justify-between px-4 h-12">
        <Link href="/home" className="flex items-baseline gap-0">
          <span style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>openED</span>
        </Link>
        <Link
          href="/profile"
          style={{
            width: 28, height: 28, borderRadius: '50%',
            backgroundColor: '#E6F1FB',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 600, color: '#185FA5',
          }}
        >
          {userInitial}
        </Link>
      </div>
    </header>
  );
}
