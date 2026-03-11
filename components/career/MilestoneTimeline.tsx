'use client';

import { formatCurrency } from '@/lib/utils/format';
import { Badge } from '@/components/ui/Badge';

interface Milestone {
  certName: string;
  projectedSalary: number;
  salaryBump: number;
  status: 'earned' | 'in_progress' | 'locked';
}

export function MilestoneTimeline({ milestones }: { milestones: Milestone[] }) {
  return (
    <div className="rounded-2xl bg-white border-2 border-cp-border p-5 space-y-1 animate-fade-up">
      <h3 className="font-bold text-sm mb-4">Certification Milestones</h3>
      <div className="stagger">
      {milestones.map((m, i) => (
        <div key={i} className="flex gap-3 animate-fade-up">
          <div className="flex flex-col items-center">
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] ${
              m.status === 'earned'
                ? 'bg-cp-success border-cp-success text-white'
                : m.status === 'in_progress'
                ? 'bg-cp-green/20 border-cp-green animate-pulse'
                : 'bg-cp-bg-secondary border-cp-border'
            }`}>
              {m.status === 'earned' && '✓'}
            </div>
            {i < milestones.length - 1 && (
              <div className={`w-0.5 h-16 ${
                m.status === 'earned' ? 'bg-cp-success/50' : 'bg-cp-border'
              }`} />
            )}
          </div>
          <div className="flex-1 pb-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">{m.certName}</span>
              <Badge variant={
                m.status === 'earned' ? 'success' : m.status === 'in_progress' ? 'accent' : 'default'
              }>
                {m.status === 'earned' ? 'Earned' : m.status === 'in_progress' ? 'In Progress' : 'Locked'}
              </Badge>
            </div>
            <p className="text-sm font-mono text-cp-text-muted mt-1">
              {formatCurrency(m.projectedSalary)}
              <span className="text-cp-success ml-2 font-bold">+{formatCurrency(m.salaryBump)}</span>
            </p>
          </div>
        </div>
      ))}
      </div>
    </div>
  );
}
