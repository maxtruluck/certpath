'use client';

import { formatNumber } from '@/lib/utils/format';

export function XPBadge({ xp }: { xp: number }) {
  return (
    <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cp-green/15 text-cp-green text-xs font-mono font-extrabold border-2 border-cp-green/20">
      <span>⚡</span>
      <span>{formatNumber(xp)}</span>
    </div>
  );
}
