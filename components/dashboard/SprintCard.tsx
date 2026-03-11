'use client';

import Link from 'next/link';
import { ReadinessGauge } from '@/components/gamification/ReadinessGauge';

interface SprintCardProps {
  certName: string;
  certSlug: string;
  sprintDay: number;
  sprintTotal: number;
  streak: number;
  readinessScore: number;
}

export function SprintCard({ certName, certSlug, sprintDay, sprintTotal, streak, readinessScore }: SprintCardProps) {
  const sprintPct = Math.round((sprintDay / sprintTotal) * 100);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white border-2 border-cp-border border-b-4 p-5 space-y-5 animate-fade-up">
      {/* Decorative glow */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-cp-green/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-cp-text-muted">Active Sprint</p>
          <h2 className="text-xl font-black">{certName}</h2>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1.5 text-xs text-cp-text-muted font-bold">
              <span className="inline-block w-2 h-2 rounded-full bg-cp-green" />
              Day {sprintDay}/{sprintTotal}
            </div>
            <div className="flex items-center gap-1 text-xs text-cp-warning font-extrabold font-mono">
              <span className="animate-flame inline-block">🔥</span> {streak}
            </div>
          </div>
        </div>
        <ReadinessGauge score={readinessScore} size="sm" />
      </div>

      {/* Sprint progress bar */}
      <div>
        <div className="h-3 rounded-full bg-cp-bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cp-green to-cp-accent transition-all duration-500 progress-shine"
            style={{ width: `${sprintPct}%` }}
          />
        </div>
      </div>

      <Link
        href={`/practice/${certSlug}`}
        className="btn-primary block w-full py-4 text-center text-sm"
      >
        Start Session
      </Link>
    </div>
  );
}
