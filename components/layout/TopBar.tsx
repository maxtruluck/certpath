'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

interface TopBarProps {
  userInitial?: string;
}

export function TopBar({ userInitial = 'O' }: TopBarProps) {
  const [stats, setStats] = useState<{ streak: number; xp: number } | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          setStats({
            streak: data.streak?.current_streak || 0,
            xp: data.xp?.total || 0,
          });
        }
      } catch { /* ignore */ }
    }
    fetchStats();
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-[#FAFAF8]/90 backdrop-blur-md border-b border-[#E8E4DD]">
      <div className="max-w-lg mx-auto flex items-center justify-between px-4 h-14">
        <Link href="/home" className="flex items-baseline gap-0.5">
          <span className="text-lg font-semibold text-[#2C2825] tracking-tight">open</span>
          <span className="text-lg font-extrabold text-[#2C2825] tracking-tight">ED</span>
        </Link>
        <div className="flex items-center gap-3">
          {stats && (
            <>
              <div className="flex items-center gap-1 text-sm" title="Streak">
                <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20"><path d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" /></svg>
                <span className="font-bold text-[#2C2825]">{stats.streak}</span>
              </div>
              <div className="flex items-center gap-1 text-sm" title="XP">
                <span className="text-xs font-extrabold text-amber-500">XP</span>
                <span className="font-bold text-[#2C2825]">{stats.xp.toLocaleString()}</span>
              </div>
            </>
          )}
          <Link
            href="/profile"
            className="w-8 h-8 rounded-full bg-[#F5F3EF] border border-[#E8E4DD] flex items-center justify-center text-sm font-semibold text-[#6B635A] hover:bg-[#EBE8E2] transition-colors"
          >
            {userInitial}
          </Link>
        </div>
      </div>
    </header>
  );
}
