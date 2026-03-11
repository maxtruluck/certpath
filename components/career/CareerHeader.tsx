'use client';

import { formatCurrency } from '@/lib/utils/format';
import { ProgressBar } from '@/components/ui/ProgressBar';

interface CareerHeaderProps {
  currentRole: string;
  currentSalary: number;
  targetRole: string;
  targetSalary: number;
  progress: number; // 0-1
}

export function CareerHeader({ currentRole, currentSalary, targetRole, targetSalary, progress }: CareerHeaderProps) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-white to-cp-bg-secondary border-2 border-cp-border p-5 space-y-4 animate-fade-up">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[10px] text-cp-text-muted uppercase tracking-widest font-bold">Current</p>
          <p className="font-bold mt-1">{currentRole}</p>
          <p className="text-sm font-mono text-cp-text-muted">{formatCurrency(currentSalary)}</p>
        </div>
        <div className="flex flex-col items-center gap-1 px-3">
          <div className="w-8 h-8 rounded-full bg-cp-green/15 flex items-center justify-center">
            <span className="text-cp-green text-sm font-bold">&rarr;</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-cp-text-muted uppercase tracking-widest font-bold">Target</p>
          <p className="font-bold mt-1">{targetRole}</p>
          <p className="text-sm font-mono text-cp-success">{formatCurrency(targetSalary)}</p>
        </div>
      </div>
      <ProgressBar value={progress} color="accent" size="lg" showLabel />
      <p className="text-center text-xs text-cp-text-muted font-mono">
        Potential increase: <span className="text-cp-success font-bold">{formatCurrency(targetSalary - currentSalary)}</span>
      </p>
    </div>
  );
}
