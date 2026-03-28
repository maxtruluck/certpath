'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface TopBarProps {
  userInitial?: string;
}

export function TopBar({ userInitial = 'O' }: TopBarProps) {
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(d => {
        if (d.user?.role === 'creator') setIsCreator(true);
      })
      .catch(() => {});
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#eee]">
      <div className="max-w-lg mx-auto flex items-center justify-between px-4 h-12">
        <Link href="/home" className="flex items-baseline gap-0">
          <span style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>openED</span>
        </Link>
        <div className="flex items-center gap-3">
          {isCreator && (
            <Link
              href="/creator"
              style={{ fontSize: 13, color: '#378ADD' }}
              className="hover:underline"
            >
              Creator dashboard &rarr;
            </Link>
          )}
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
      </div>
    </header>
  );
}
