'use client';

interface AchievementCardProps {
  name: string;
  description: string;
  iconEmoji: string;
  xpReward: number;
  earned: boolean;
  earnedAt?: string;
}

export function AchievementCard({ name, description, iconEmoji, xpReward, earned, earnedAt }: AchievementCardProps) {
  return (
    <div className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
      earned
        ? 'bg-white border-cp-border hover:border-cp-green/40'
        : 'bg-cp-bg-secondary border-cp-border opacity-40 grayscale'
    }`}>
      <div className={`text-2xl w-11 h-11 flex items-center justify-center rounded-xl shrink-0 ${
        earned ? 'bg-gradient-to-br from-cp-green/20 to-cp-accent/10' : 'bg-cp-bg-secondary'
      }`}>
        {iconEmoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-bold text-sm truncate">{name}</p>
          {earned && (
            <span className="w-4 h-4 rounded-full bg-cp-success flex items-center justify-center text-[10px] text-white shrink-0">✓</span>
          )}
        </div>
        <p className="text-xs text-cp-text-muted truncate mt-0.5">{description}</p>
      </div>
      <div className="text-xs font-mono font-bold text-cp-green shrink-0">
        +{xpReward}
      </div>
    </div>
  );
}
