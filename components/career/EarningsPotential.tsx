'use client';

import { formatCurrency } from '@/lib/utils/format';

interface EarningsPotentialProps {
  totalPotential: number;
  certsRemaining: number;
}

export function EarningsPotential({ totalPotential, certsRemaining }: EarningsPotentialProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cp-green/20 via-white to-cp-accent/10 p-5 border border-cp-green/20 animate-fade-up">
      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-cp-success/5 blur-2xl" />
      <p className="text-[10px] uppercase tracking-widest text-cp-text-muted font-bold">Total Earning Potential</p>
      <p className="text-3xl font-bold font-mono gradient-text mt-2">{formatCurrency(totalPotential)}</p>
      <p className="text-xs text-cp-text-muted mt-3">
        {certsRemaining} certification{certsRemaining !== 1 ? 's' : ''} remaining on your path
      </p>
    </div>
  );
}
