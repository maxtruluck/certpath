'use client';

import { getLevelInfo } from '@/lib/engine/levels';

interface LevelBadgeProps {
  totalXp: number;
  showProgress?: boolean;
  size?: 'sm' | 'md';
}

export function LevelBadge({ totalXp, showProgress = false, size = 'sm' }: LevelBadgeProps) {
  const { level, title, progressToNext } = getLevelInfo(totalXp);

  if (size === 'sm') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cp-purple/15 border-2 border-cp-purple/20">
        <div className="w-5 h-5 rounded-md bg-gradient-to-br from-cp-purple to-cp-accent flex items-center justify-center">
          <span className="text-[10px] font-black text-white">{level}</span>
        </div>
        {showProgress && (
          <div className="w-12 h-1.5 rounded-full bg-cp-bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cp-purple to-cp-accent transition-all duration-500"
              style={{ width: `${Math.round(progressToNext * 100)}%` }}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cp-purple to-cp-accent flex items-center justify-center shadow-lg shadow-cp-purple/20">
        <span className="text-lg font-black text-white">{level}</span>
      </div>
      <div>
        <p className="font-extrabold text-sm">Level {level}</p>
        <p className="text-xs text-cp-text-muted font-bold">{title}</p>
        {showProgress && (
          <div className="w-24 h-1.5 rounded-full bg-cp-bg-secondary overflow-hidden mt-1">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cp-purple to-cp-accent transition-all duration-500"
              style={{ width: `${Math.round(progressToNext * 100)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
