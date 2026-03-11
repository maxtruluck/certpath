import { SupabaseClient } from '@supabase/supabase-js';

interface Achievement {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon_emoji: string;
  xp_reward: number;
  criteria_type: string;
  criteria_value: Record<string, unknown>;
}

interface EarnedAchievement extends Achievement {
  earned_at: string;
}

export async function checkAchievements(
  supabase: SupabaseClient,
  userId: string,
  sessionData: {
    certificationId: string;
    accuracy: number;
    totalQuestions: number;
    totalTimeMs: number;
    completedAt: Date;
  }
): Promise<EarnedAchievement[]> {
  // Get unearned achievements
  const { data: allAchievements } = await supabase
    .from('achievements')
    .select('*');

  const { data: earnedAchievementRows } = await supabase
    .from('user_achievements')
    .select('achievement_id')
    .eq('user_id', userId);

  const earnedIds = new Set((earnedAchievementRows ?? []).map((r) => r.achievement_id));
  const unearned = (allAchievements ?? []).filter((a) => !earnedIds.has(a.id)) as Achievement[];

  const newlyEarned: EarnedAchievement[] = [];

  for (const achievement of unearned) {
    const earned = await evaluateCriteria(supabase, userId, achievement, sessionData);
    if (earned) {
      // Insert user_achievement
      await supabase.from('user_achievements').insert({
        user_id: userId,
        achievement_id: achievement.id,
      });

      // Award XP
      await supabase.from('user_xp_log').insert({
        user_id: userId,
        xp_amount: achievement.xp_reward,
        source: 'achievement',
        reference_id: achievement.id,
      });

      newlyEarned.push({
        ...achievement,
        earned_at: new Date().toISOString(),
      });
    }
  }

  return newlyEarned;
}

async function evaluateCriteria(
  supabase: SupabaseClient,
  userId: string,
  achievement: Achievement,
  sessionData: {
    certificationId: string;
    accuracy: number;
    totalQuestions: number;
    totalTimeMs: number;
    completedAt: Date;
  }
): Promise<boolean> {
  const criteria = achievement.criteria_value;

  switch (achievement.criteria_type) {
    case 'streak': {
      const { data: streak } = await supabase
        .from('user_streaks')
        .select('current_streak')
        .eq('user_id', userId)
        .single();
      return (streak?.current_streak ?? 0) >= (criteria.streak_days as number);
    }

    case 'sessions': {
      if (criteria.total_questions) {
        const { data: cert } = await supabase
          .from('user_certifications')
          .select('questions_attempted')
          .eq('user_id', userId)
          .eq('certification_id', sessionData.certificationId)
          .single();
        return (cert?.questions_attempted ?? 0) >= (criteria.total_questions as number);
      }
      if (criteria.sessions) {
        // Count unique session dates
        const { count } = await supabase
          .from('user_xp_log')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('source', 'session_complete');
        return (count ?? 0) >= (criteria.sessions as number);
      }
      return false;
    }

    case 'accuracy': {
      if (criteria.domain_score) {
        const { data: scores } = await supabase
          .from('user_domain_scores')
          .select('score')
          .eq('user_id', userId)
          .gte('score', criteria.domain_score as number);
        return (scores?.length ?? 0) > 0;
      }
      return false;
    }

    case 'certification': {
      if (criteria.readiness) {
        const { data: cert } = await supabase
          .from('user_certifications')
          .select('readiness_score')
          .eq('user_id', userId)
          .eq('certification_id', sessionData.certificationId)
          .single();
        return (cert?.readiness_score ?? 0) >= (criteria.readiness as number);
      }
      if (criteria.completed) {
        const { data: cert } = await supabase
          .from('user_certifications')
          .select('status')
          .eq('user_id', userId)
          .eq('certification_id', sessionData.certificationId)
          .single();
        return cert?.status === 'completed';
      }
      return false;
    }

    case 'custom': {
      if (criteria.after_hour) {
        return sessionData.completedAt.getHours() >= (criteria.after_hour as number);
      }
      if (criteria.before_hour) {
        return sessionData.completedAt.getHours() < (criteria.before_hour as number);
      }
      if (criteria.questions && criteria.time_ms) {
        return (
          sessionData.totalQuestions >= (criteria.questions as number) &&
          sessionData.totalTimeMs <= (criteria.time_ms as number)
        );
      }
      if (criteria.career_path) {
        const { count } = await supabase
          .from('user_career_paths')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);
        return (count ?? 0) > 0;
      }
      if (criteria.certs_enrolled) {
        const { count } = await supabase
          .from('user_certifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);
        return (count ?? 0) >= (criteria.certs_enrolled as number);
      }
      return false;
    }

    default:
      return false;
  }
}
