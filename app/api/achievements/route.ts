import { getApiUser } from '@/lib/supabase/get-user-api';
import { NextResponse } from 'next/server';

export async function GET() {
  const { supabase, userId, error } = await getApiUser();
  if (error) return error;

  const [achievementsResult, earnedResult] = await Promise.all([
    supabase.from('achievements').select('*'),
    supabase.from('user_achievements').select('achievement_id, earned_at').eq('user_id', userId),
  ]);

  const earnedMap = new Map(
    (earnedResult.data ?? []).map((e) => [e.achievement_id, e.earned_at])
  );

  const achievements = (achievementsResult.data ?? []).map((a) => ({
    ...a,
    earned: earnedMap.has(a.id),
    earned_at: earnedMap.get(a.id) ?? null,
  }));

  // Sort: earned first, then unearned
  achievements.sort((a, b) => {
    if (a.earned && !b.earned) return -1;
    if (!a.earned && b.earned) return 1;
    return 0;
  });

  return NextResponse.json({ achievements });
}
