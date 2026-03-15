'use client';

import { usePathname } from 'next/navigation';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';

interface AppShellProps {
  children: React.ReactNode;
  streak?: number;
  totalXp?: number;
  hideBottomNav?: boolean;
  userInitial?: string;
}

export function AppShell({ children, hideBottomNav = false, userInitial = 'O' }: AppShellProps) {
  const pathname = usePathname();

  // Hide bottom nav on practice/session routes
  const isPracticeRoute = pathname?.startsWith('/practice') || pathname?.startsWith('/session');
  const showBottomNav = !hideBottomNav && !isPracticeRoute;

  return (
    <div className="min-h-[100dvh] bg-white">
      <TopBar userInitial={userInitial} />
      <main className="max-w-lg mx-auto px-4 pb-24 pt-4">
        {children}
      </main>
      {showBottomNav && <BottomNav />}
    </div>
  );
}
