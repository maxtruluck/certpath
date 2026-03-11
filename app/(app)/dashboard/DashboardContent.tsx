'use client';

import Link from 'next/link';
import { SprintCard } from '@/components/dashboard/SprintCard';
import { DomainBreakdown } from '@/components/dashboard/DomainBreakdown';
import { EarningsCard } from '@/components/dashboard/EarningsCard';
import { CertList } from '@/components/dashboard/CertList';

interface DashboardContentProps {
  activeCert: {
    certification_id: string;
    sprint_current_day: number;
    readiness_score: number;
    certifications: {
      name: string;
      short_name: string;
      slug: string;
    };
  } | null;
  streak: number;
  totalXp: number;
  domainBreakdown: { name: string; score: number; weight: number }[];
  sprintTotal: number;
  allCerts: {
    slug: string;
    name: string;
    shortName: string;
    iconEmoji: string;
    status: 'active' | 'not_started' | 'completed' | 'paused';
    readinessScore: number;
    salaryBump: number;
  }[];
  currentSalary: number;
  targetSalary: number;
  questionsDue: number;
  dailyGoalMet: boolean;
  sprintDay: number;
}

export function DashboardContent({
  activeCert,
  streak,
  domainBreakdown,
  sprintTotal,
  allCerts,
  currentSalary,
  targetSalary,
  questionsDue,
  dailyGoalMet,
  sprintDay,
}: DashboardContentProps) {
  return (
    <div className="space-y-4">
      {/* Daily Status Card */}
      <div className={`rounded-2xl border-2 border-b-4 p-5 animate-fade-up transition-all ${
        dailyGoalMet
          ? 'bg-cp-green/5 border-cp-green/30'
          : 'bg-cp-warning/5 border-cp-warning/30'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${
              dailyGoalMet ? 'bg-cp-green/15' : 'bg-cp-warning/15'
            }`}>
              {dailyGoalMet ? '✅' : '📝'}
            </div>
            <div>
              <p className="font-extrabold text-sm">
                {dailyGoalMet ? 'Goal Complete!' : 'Ready to practice?'}
              </p>
              <p className="text-xs text-cp-text-muted font-bold mt-0.5">
                {questionsDue > 0
                  ? `${questionsDue} question${questionsDue !== 1 ? 's' : ''} due for review`
                  : 'No reviews due — great job staying on top!'
                }
              </p>
            </div>
          </div>
          {dailyGoalMet && (
            <div className="w-8 h-8 rounded-full bg-cp-green flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {activeCert ? (
        <SprintCard
          certName={activeCert.certifications.short_name}
          certSlug={activeCert.certifications.slug}
          sprintDay={sprintDay}
          sprintTotal={sprintTotal}
          streak={streak}
          readinessScore={activeCert.readiness_score}
        />
      ) : (
        <Link href="/certifications" className="block animate-fade-up">
          <div className="rounded-2xl bg-white border-2 border-cp-border border-b-4 p-6 text-center space-y-3 hover:border-cp-green/40 transition-all">
            <div className="text-4xl">📚</div>
            <h2 className="text-lg font-bold">Pick a Certification</h2>
            <p className="text-sm text-cp-text-muted">Browse available certifications and start your study journey</p>
            <span className="inline-block btn-primary px-6 py-3 text-sm">Browse Certs</span>
          </div>
        </Link>
      )}

      {domainBreakdown.length > 0 && (
        <DomainBreakdown domains={domainBreakdown} />
      )}

      {targetSalary > 0 && (
        <EarningsCard currentSalary={currentSalary} potentialSalary={targetSalary} />
      )}

      {allCerts.length > 0 && <CertList certs={allCerts} />}
    </div>
  );
}
