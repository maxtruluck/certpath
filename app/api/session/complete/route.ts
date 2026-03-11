import { getApiUser } from '@/lib/supabase/get-user-api';
import { NextRequest, NextResponse } from 'next/server';
import { calculateReadinessScore } from '@/lib/engine/readiness';
import { checkAchievements } from '@/lib/engine/achievements';
import { XP } from '@/lib/utils/constants';
import { diffInDays } from '@/lib/utils/format';

export async function POST(request: NextRequest) {
  const { supabase, userId, error } = await getApiUser();
  if (error) return error;

  const { certification_id, session_results } = await request.json();

  const totalQuestions = session_results.length;
  const correctCount = session_results.filter((r: { is_correct: boolean }) => r.is_correct).length;
  const accuracy = totalQuestions > 0 ? correctCount / totalQuestions : 0;
  const totalTimeMs = session_results.reduce((sum: number, r: { time_ms: number }) => sum + (r.time_ms || 0), 0);

  // Session complete XP
  let sessionXp = XP.SESSION_COMPLETE;

  // Perfect session bonus
  if (accuracy === 1 && totalQuestions > 0) {
    sessionXp += XP.PERFECT_SESSION;
  }

  // Update streak
  const { data: streak } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .single();

  let currentStreak = 1;
  let longestStreak = 1;

  if (streak) {
    const today = new Date();
    const lastDate = streak.last_activity_date ? new Date(streak.last_activity_date) : null;
    const daysDiff = lastDate ? diffInDays(today, lastDate) : 2;

    if (daysDiff === 0) {
      currentStreak = streak.current_streak;
      longestStreak = streak.longest_streak;
    } else if (daysDiff === 1) {
      currentStreak = streak.current_streak + 1;
      longestStreak = Math.max(streak.longest_streak, currentStreak);
    } else {
      currentStreak = 1;
      longestStreak = Math.max(streak.longest_streak, 1);
    }

    await supabase
      .from('user_streaks')
      .update({
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_activity_date: today.toISOString().split('T')[0],
      })
      .eq('user_id', userId);
  }

  // Streak bonus XP
  if (currentStreak >= 30) {
    sessionXp += XP.STREAK_BONUS_30;
  } else if (currentStreak >= 7) {
    sessionXp += XP.STREAK_BONUS_7;
  }

  // Log session XP
  await supabase.from('user_xp_log').insert({
    user_id: userId,
    xp_amount: sessionXp,
    source: 'session_complete',
  });

  // Recalculate readiness score
  const previousReadiness = await supabase
    .from('user_certifications')
    .select('readiness_score')
    .eq('user_id', userId)
    .eq('certification_id', certification_id)
    .single();

  const newReadiness = await calculateReadinessScore(supabase, userId, certification_id);

  await supabase
    .from('user_certifications')
    .update({ readiness_score: newReadiness })
    .eq('user_id', userId)
    .eq('certification_id', certification_id);

  // Check achievements
  const earnedAchievements = await checkAchievements(supabase, userId, {
    certificationId: certification_id,
    accuracy,
    totalQuestions,
    totalTimeMs,
    completedAt: new Date(),
  });

  // Total XP earned this session (answer XP + session XP + achievement XP)
  const achievementXp = earnedAchievements.reduce((sum, a) => sum + a.xp_reward, 0);
  const answerXp = session_results.reduce(
    (sum: number, r: { is_correct: boolean }) => sum + (r.is_correct ? XP.CORRECT_ANSWER : XP.INCORRECT_ANSWER),
    0
  );

  return NextResponse.json({
    xp_summary: {
      answers: answerXp,
      session_bonus: sessionXp,
      achievements: achievementXp,
      total: answerXp + sessionXp + achievementXp,
    },
    readiness: {
      previous: previousReadiness?.data?.readiness_score ?? 0,
      current: newReadiness,
      delta: newReadiness - (previousReadiness?.data?.readiness_score ?? 0),
    },
    streak: {
      current: currentStreak,
      longest: longestStreak,
    },
    achievements_earned: earnedAchievements,
    accuracy,
    questions_total: totalQuestions,
    questions_correct: correctCount,
  });
}
