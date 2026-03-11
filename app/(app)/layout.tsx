import { getAuthUser } from '@/lib/supabase/get-user';
import { redirect } from 'next/navigation';
import { AppShellWrapper } from './AppShellWrapper';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase, userId } = await getAuthUser();

  if (!userId) {
    redirect('/login');
  }

  const [streakResult, xpResult] = await Promise.all([
    supabase.from('user_streaks').select('current_streak').eq('user_id', userId).single(),
    supabase.from('user_xp_log').select('xp_amount').eq('user_id', userId),
  ]);

  const streak = streakResult.data?.current_streak ?? 0;
  const totalXp = (xpResult.data ?? []).reduce((sum, r) => sum + r.xp_amount, 0);

  return (
    <AppShellWrapper streak={streak} totalXp={totalXp}>
      {children}
    </AppShellWrapper>
  );
}
