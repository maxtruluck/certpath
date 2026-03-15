import { getAuthUser } from '@/lib/supabase/get-user';
import { redirect } from 'next/navigation';
import { DEMO_MODE } from '@/lib/demo';
import { AppShellWrapper } from './AppShellWrapper';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!DEMO_MODE) {
    const { userId } = await getAuthUser();
    if (!userId) {
      redirect('/login');
    }
  }

  return (
    <AppShellWrapper>
      {children}
    </AppShellWrapper>
  );
}
