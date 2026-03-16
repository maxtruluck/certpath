'use client';

import { usePathname } from 'next/navigation';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';

interface AppShellProps {
  children: React.ReactNode;
  hideBottomNav?: boolean;
  userInitial?: string;
}

export function AppShell({ children, hideBottomNav = false, userInitial = 'O' }: AppShellProps) {
  const pathname = usePathname();

  // Hide all navigation on practice/session routes (immersive mode)
  const isPracticeRoute = pathname?.startsWith('/practice') || pathname?.startsWith('/session');
  const showNav = !hideBottomNav && !isPracticeRoute;

  return (
    <div className="min-h-[100dvh] bg-[#FAFAF8]">
      {showNav && <TopBar userInitial={userInitial} />}
      <main className={`max-w-lg mx-auto px-4 ${showNav ? 'pb-24 pt-4' : 'pb-8'}`}>
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  );
}
