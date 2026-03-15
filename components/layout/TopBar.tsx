'use client';

import Link from 'next/link';

interface TopBarProps {
  streak?: number;
  totalXp?: number;
  userInitial?: string;
}

export function TopBar({ userInitial = 'O' }: TopBarProps) {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-cp-border">
      <div className="max-w-lg mx-auto flex items-center justify-between px-4 h-14">
        <Link href="/home" className="flex items-center">
          <span className="text-xl font-bold text-cp-text tracking-tight">open</span>
          <span className="text-xl font-bold text-cp-primary tracking-tight">ED</span>
        </Link>
        <Link
          href="/profile"
          className="w-8 h-8 rounded-full bg-cp-surface-light border border-cp-border flex items-center justify-center text-sm font-semibold text-cp-text-secondary hover:bg-cp-surface-hover transition-colors"
        >
          {userInitial}
        </Link>
      </div>
    </header>
  );
}
