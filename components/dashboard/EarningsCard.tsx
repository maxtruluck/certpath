'use client';

import Link from 'next/link';
import { formatCurrency } from '@/lib/utils/format';

interface EarningsCardProps {
  currentSalary: number;
  potentialSalary: number;
}

export function EarningsCard({ currentSalary, potentialSalary }: EarningsCardProps) {
  const bump = potentialSalary - currentSalary;

  return (
    <Link href="/career" className="block">
      <div className="relative overflow-hidden rounded-2xl bg-white border-2 border-cp-border border-b-4 p-5 animate-fade-up hover:border-cp-green/30 transition-all group">
        <div className="absolute -bottom-12 -right-8 w-32 h-32 bg-cp-green/5 rounded-full blur-2xl pointer-events-none group-hover:bg-cp-green/10 transition-all" />
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-cp-text-muted">Earning Potential</p>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-3xl font-black font-mono gradient-text-money">
            {formatCurrency(potentialSalary)}
          </span>
        </div>
        {bump > 0 && (
          <p className="text-sm font-mono font-extrabold text-cp-green mt-1">
            +{formatCurrency(bump)} from certifications
          </p>
        )}
        <p className="text-xs text-cp-text-muted mt-3 flex items-center gap-1 font-bold group-hover:text-cp-text-secondary transition-colors">
          View your career path
          <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </p>
      </div>
    </Link>
  );
}
