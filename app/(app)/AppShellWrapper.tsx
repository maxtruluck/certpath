'use client';

import { AppShell } from '@/components/layout/AppShell';
import { usePathname } from 'next/navigation';

interface Props {
  children: React.ReactNode;
}

export function AppShellWrapper({ children }: Props) {
  const pathname = usePathname();
  const hideBottomNav = pathname.startsWith('/practice') || pathname.startsWith('/lesson');

  return (
    <AppShell hideBottomNav={hideBottomNav}>
      {children}
    </AppShell>
  );
}
