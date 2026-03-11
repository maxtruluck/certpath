'use client';

export function StreakBadge({ streak }: { streak: number }) {
  const isHot = streak >= 7;
  return (
    <div className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-mono font-extrabold transition-all ${
      streak > 0
        ? isHot
          ? 'bg-cp-warning/20 text-cp-warning border-2 border-cp-warning/25'
          : 'bg-cp-warning/15 text-cp-warning border-2 border-cp-warning/15'
        : 'bg-cp-bg-secondary text-cp-text-muted border-2 border-cp-border'
    }`}>
      <span className={isHot ? 'animate-flame' : ''}>{streak > 0 ? '🔥' : '💤'}</span>
      <span>{streak}</span>
    </div>
  );
}
