'use client';

import Link from 'next/link';

interface TopBarProps {
  userInitial?: string;
}

export function TopBar({ userInitial = 'O' }: TopBarProps) {
  return (
    <header className="sticky top-0 z-50 bg-[#FAFAF8]/90 backdrop-blur-md border-b border-[#E8E4DD]">
      <div className="max-w-lg mx-auto flex items-center justify-between px-4 h-14">
        <Link href="/home" className="flex items-baseline gap-0.5">
          <span className="text-lg font-semibold text-[#2C2825] tracking-tight">open</span>
          <span className="text-lg font-extrabold text-[#2C2825] tracking-tight">ED</span>
        </Link>
        <div className="flex items-center gap-3">
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
