import { getAuthUser } from '@/lib/supabase/get-user';
import { redirect } from 'next/navigation';
import { ProfileContent } from './ProfileContent';

export default async function ProfilePage() {
  const { supabase, userId } = await getAuthUser();
  if (!userId) redirect('/login');

  const [profileResult, streakResult, xpResult, achievementsResult, earnedResult, xpLogResult] = await Promise.all([
    supabase.from('users').select('*').eq('id', userId).single(),
    supabase.from('user_streaks').select('*').eq('user_id', userId).single(),
    supabase.from('user_xp_log').select('xp_amount').eq('user_id', userId),
    supabase.from('achievements').select('*'),
    supabase.from('user_achievements').select('achievement_id, earned_at').eq('user_id', userId),
    supabase.from('user_xp_log').select('earned_at').eq('user_id', userId).eq('source', 'session_complete').order('earned_at', { ascending: false }).limit(7),
  ]);

  const totalXp = (xpResult.data ?? []).reduce((sum, r) => sum + r.xp_amount, 0);
  const earnedMap = new Map((earnedResult.data ?? []).map((e) => [e.achievement_id, e.earned_at]));

  const achievements = (achievementsResult.data ?? []).map((a) => ({
    ...a,
    earned: earnedMap.has(a.id),
    earnedAt: earnedMap.get(a.id) ?? null,
  }));

  const today = new Date();
  const activityDates = new Set(
    (xpLogResult.data ?? []).map((r) => new Date(r.earned_at).toISOString().split('T')[0])
  );

  const weeklyActivity = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    return { date: dateStr, completed: activityDates.has(dateStr) };
  });

  return (
    <ProfileContent
      profile={profileResult.data}
      streak={streakResult.data}
      totalXp={totalXp}
      achievements={achievements}
      weeklyActivity={weeklyActivity}
    />
  );
}
