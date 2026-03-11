'use client';

import { ProgressBar } from '@/components/ui/ProgressBar';

interface DomainScore {
  name: string;
  score: number;
  weight: number;
}

export function DomainBreakdown({ domains }: { domains: DomainScore[] }) {
  return (
    <div className="rounded-2xl bg-white border-2 border-cp-border border-b-4 p-5 space-y-4 animate-fade-up">
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-sm">Domain Breakdown</h3>
        <span className="text-[10px] text-cp-text-muted uppercase tracking-widest font-extrabold">Weight</span>
      </div>
      <div className="space-y-3.5 stagger">
        {domains.map((domain) => (
          <div key={domain.name} className="animate-fade-up">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-cp-text-secondary truncate mr-3 font-bold">{domain.name}</span>
              <span className="font-mono text-cp-text-muted shrink-0 font-extrabold">{domain.weight}%</span>
            </div>
            <ProgressBar value={domain.score} size="sm" showLabel />
          </div>
        ))}
      </div>
    </div>
  );
}
