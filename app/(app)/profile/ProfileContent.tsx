'use client';

import Link from 'next/link';
import { formatNumber } from '@/lib/utils/format';
import { WeeklyGrid } from '@/components/gamification/WeeklyGrid';
import { AchievementCard } from '@/components/gamification/AchievementCard';
import { LevelBadge } from '@/components/gamification/LevelBadge';

interface ProfileContentProps {
  profile: {
    display_name: string;
    current_role: string | null;
    target_role: string | null;
    avatar_url: string | null;
  } | null;
  streak: {
    current_streak: number;
    longest_streak: number;
  } | null;
  totalXp: number;
  achievements: {
    id: string;
    name: string;
    description: string;
    icon_emoji: string;
    xp_reward: number;
    earned: boolean;
    earnedAt: string | null;
  }[];
  weeklyActivity: { date: string; completed: boolean }[];
}

export function ProfileContent({ profile, streak, totalXp, achievements, weeklyActivity }: ProfileContentProps) {
  const earnedCount = achievements.filter((a) => a.earned).length;

  return (
    <div className="space-y-4">
      {/* Profile header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-cp-bg-secondary border-2 border-cp-border p-6 text-center animate-fade-up">
        <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-cp-green/5 blur-3xl" />
        <div className="w-18 h-18 rounded-full bg-gradient-to-br from-cp-green to-cp-green-dark flex items-center justify-center text-2xl font-bold text-white mx-auto w-[72px] h-[72px]">
          {profile?.display_name?.[0]?.toUpperCase() ?? '?'}
        </div>
        <h2 className="text-xl font-bold mt-3">{profile?.display_name}</h2>
        {profile?.current_role && (
          <p className="text-sm text-cp-text-muted mt-0.5">{profile.current_role}</p>
        )}
        {profile?.target_role && (
          <p className="text-xs text-cp-green mt-1 font-medium">&rarr; {profile.target_role}</p>
        )}
        <div className="mt-3 flex justify-center">
          <LevelBadge totalXp={totalXp} showProgress size="md" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2.5 animate-fade-up">
        <div className="rounded-xl bg-white border-2 border-cp-border p-3.5 text-center">
          <p className="text-xl font-bold font-mono text-cp-warning">{streak?.current_streak ?? 0}</p>
          <p className="text-[10px] text-cp-text-muted uppercase tracking-wider font-bold mt-0.5">Streak</p>
        </div>
        <div className="rounded-xl bg-white border-2 border-cp-border p-3.5 text-center">
          <p className="text-xl font-bold font-mono text-cp-green">{formatNumber(totalXp)}</p>
          <p className="text-[10px] text-cp-text-muted uppercase tracking-wider font-bold mt-0.5">Total XP</p>
        </div>
        <div className="rounded-xl bg-white border-2 border-cp-border p-3.5 text-center">
          <p className="text-xl font-bold font-mono text-cp-success">{earnedCount}</p>
          <p className="text-[10px] text-cp-text-muted uppercase tracking-wider font-bold mt-0.5">Earned</p>
        </div>
      </div>

      {/* Weekly Activity */}
      <div className="rounded-2xl bg-white border-2 border-cp-border p-5 animate-fade-up">
        <h3 className="font-bold text-sm mb-3">This Week</h3>
        <WeeklyGrid activities={weeklyActivity} />
      </div>

      {/* Achievements */}
      <div className="rounded-2xl bg-white border-2 border-cp-border p-5 space-y-3 animate-fade-up">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm">Achievements</h3>
          <span className="text-xs font-mono font-bold text-cp-text-muted">{earnedCount}/{achievements.length}</span>
        </div>
        <div className="stagger space-y-2">
          {achievements.map((a) => (
            <div key={a.id} className="animate-fade-up">
              <AchievementCard
                name={a.name}
                description={a.description}
                iconEmoji={a.icon_emoji}
                xpReward={a.xp_reward}
                earned={a.earned}
                earnedAt={a.earnedAt ?? undefined}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Settings */}
      <Link
        href="/settings"
        className="block w-full py-3.5 rounded-xl bg-white border-2 border-cp-border border-b-4 hover:border-cp-green/40 text-center text-sm font-extrabold uppercase tracking-wide text-cp-text-secondary hover:text-cp-text transition-all"
      >
        Settings
      </Link>
    </div>
  );
}
