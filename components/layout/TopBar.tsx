'use client';

import Link from 'next/link';
import { StreakBadge } from '@/components/gamification/StreakBadge';
import { LevelBadge } from '@/components/gamification/LevelBadge';

interface TopBarProps {
  streak?: number;
  totalXp?: number;
}

export function TopBar({ streak = 0, totalXp = 0 }: TopBarProps) {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b-2 border-cp-border">
      <div className="max-w-lg mx-auto flex items-center justify-between px-4 h-14">
        <Link href="/dashboard" className="flex items-center group">
          <span className="text-xl font-black gradient-text">CertPath</span>
        </Link>
        <div className="flex items-center gap-2">
          <StreakBadge streak={streak} />
          <LevelBadge totalXp={totalXp} showProgress />
        </div>
      </div>
    </header>
  );
}
