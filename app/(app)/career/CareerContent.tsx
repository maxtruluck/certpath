'use client';

import { CareerHeader } from '@/components/career/CareerHeader';
import { MilestoneTimeline } from '@/components/career/MilestoneTimeline';
import { EarningsPotential } from '@/components/career/EarningsPotential';

interface Milestone {
  certName: string;
  projectedSalary: number;
  salaryBump: number;
  status: 'earned' | 'in_progress' | 'locked';
}

interface CareerContentProps {
  currentRole: string;
  currentSalary: number;
  targetRole: string;
  targetSalary: number;
  progress: number;
  milestones: Milestone[];
  certsRemaining: number;
}

export function CareerContent({
  currentRole,
  currentSalary,
  targetRole,
  targetSalary,
  progress,
  milestones,
  certsRemaining,
}: CareerContentProps) {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Career GPS</h1>
      <CareerHeader
        currentRole={currentRole}
        currentSalary={currentSalary}
        targetRole={targetRole}
        targetSalary={targetSalary}
        progress={progress}
      />
      <EarningsPotential totalPotential={targetSalary} certsRemaining={certsRemaining} />
      <MilestoneTimeline milestones={milestones} />
    </div>
  );
}
