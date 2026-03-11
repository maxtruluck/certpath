'use client';

import { AppShell } from '@/components/layout/AppShell';
import { usePathname } from 'next/navigation';

interface Props {
  children: React.ReactNode;
  streak: number;
  totalXp: number;
}

export function AppShellWrapper({ children, streak, totalXp }: Props) {
  const pathname = usePathname();
  const hiddenPaths = ['/practice'];
  const hideBottomNav = hiddenPaths.some((p) => pathname.startsWith(p));

  return (
    <AppShell streak={streak} totalXp={totalXp} hideBottomNav={hideBottomNav}>
      {children}
    </AppShell>
  );
}
