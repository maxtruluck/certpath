'use client';

import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { XPToast } from '@/components/gamification/XPToast';

interface AppShellProps {
  children: React.ReactNode;
  streak?: number;
  totalXp?: number;
  hideBottomNav?: boolean;
}

export function AppShell({ children, streak = 0, totalXp = 0, hideBottomNav = false }: AppShellProps) {
  return (
    <div className="min-h-[100dvh] bg-cp-bg-secondary">
      <TopBar streak={streak} totalXp={totalXp} />
      <main className="max-w-lg mx-auto px-4 pb-24 pt-4">
        {children}
      </main>
      {!hideBottomNav && <BottomNav />}
      <XPToast />
    </div>
  );
}
