'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ProgressBar } from '@/components/ui/ProgressBar';

interface DomainData {
  id: string;
  name: string;
  slug: string;
  weightPercent: number;
  displayOrder: number;
  score: number;
  questionsAttempted: number;
  questionsCorrect: number;
}

interface DomainModalProps {
  domain: DomainData;
  certSlug: string;
  isEnrolled: boolean;
  onClose: () => void;
}

const domainThemes: Record<string, { emoji: string; color: string; bgColor: string }> = {
  'general-security-concepts': { emoji: '🛡️', color: '#6366f1', bgColor: '#eef2ff' },
  'threats-vulnerabilities-mitigations': { emoji: '⚔️', color: '#ef4444', bgColor: '#fef2f2' },
  'security-architecture': { emoji: '🏗️', color: '#f59e0b', bgColor: '#fffbeb' },
  'security-operations': { emoji: '🔍', color: '#10b981', bgColor: '#ecfdf5' },
  'security-program-management': { emoji: '📋', color: '#8b5cf6', bgColor: '#f5f3ff' },
};

const fallbackThemes = [
  { emoji: '📖', color: '#6366f1', bgColor: '#eef2ff' },
  { emoji: '⚡', color: '#ef4444', bgColor: '#fef2f2' },
  { emoji: '🔧', color: '#f59e0b', bgColor: '#fffbeb' },
  { emoji: '🎯', color: '#10b981', bgColor: '#ecfdf5' },
  { emoji: '🏆', color: '#8b5cf6', bgColor: '#f5f3ff' },
  { emoji: '🌟', color: '#ec4899', bgColor: '#fdf2f8' },
];

export function DomainModal({ domain, certSlug, isEnrolled, onClose }: DomainModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const theme = domainThemes[domain.slug] || fallbackThemes[domain.displayOrder % fallbackThemes.length];
  const pct = Math.round(domain.score * 100);
  const accuracy = domain.questionsAttempted > 0
    ? Math.round((domain.questionsCorrect / domain.questionsAttempted) * 100)
    : 0;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="w-full max-w-lg bg-white rounded-t-3xl shadow-2xl animate-slide-up overflow-hidden">
        {/* Header bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1.5 rounded-full bg-cp-border" />
        </div>

        <div className="px-6 pb-8 space-y-5">
          {/* Domain info */}
          <div className="flex items-center gap-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm"
              style={{ backgroundColor: theme.bgColor, border: `2px solid ${theme.color}` }}
            >
              <span className="text-2xl">{theme.emoji}</span>
            </div>
            <div className="flex-1">
              <h3 className="font-extrabold text-base">{domain.name}</h3>
              <p className="text-xs text-cp-text-muted">
                <span className="font-mono font-bold" style={{ color: theme.color }}>{domain.weightPercent}%</span> of exam
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-cp-text-secondary">Mastery</span>
              <span className="text-sm font-mono font-black" style={{ color: theme.color }}>{pct}%</span>
            </div>
            <ProgressBar value={domain.score} color="accent" size="lg" />
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-xl bg-cp-bg-secondary p-3 text-center">
              <p className="text-lg font-mono font-black">{domain.questionsAttempted}</p>
              <p className="text-[9px] text-cp-text-muted uppercase tracking-wider font-bold">Attempted</p>
            </div>
            <div className="rounded-xl bg-cp-bg-secondary p-3 text-center">
              <p className="text-lg font-mono font-black text-cp-success">{domain.questionsCorrect}</p>
              <p className="text-[9px] text-cp-text-muted uppercase tracking-wider font-bold">Correct</p>
            </div>
            <div className="rounded-xl bg-cp-bg-secondary p-3 text-center">
              <p className="text-lg font-mono font-black" style={{ color: accuracy >= 70 ? '#10b981' : accuracy >= 50 ? '#f59e0b' : '#ef4444' }}>
                {accuracy}%
              </p>
              <p className="text-[9px] text-cp-text-muted uppercase tracking-wider font-bold">Accuracy</p>
            </div>
          </div>

          {/* Milestone badges */}
          <div className="flex justify-center gap-4">
            {[25, 50, 75, 100].map((milestone) => (
              <div
                key={milestone}
                className={`flex flex-col items-center gap-1 transition-all ${
                  pct >= milestone ? 'opacity-100' : 'opacity-30'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-mono font-black ${
                    pct >= milestone
                      ? 'bg-cp-green text-white shadow-md'
                      : 'bg-cp-bg-secondary text-cp-text-muted border-2 border-cp-border'
                  }`}
                >
                  {pct >= milestone ? '✓' : milestone}
                </div>
                <span className="text-[8px] text-cp-text-muted font-bold uppercase">
                  {milestone === 25 ? 'Start' : milestone === 50 ? 'Half' : milestone === 75 ? 'Strong' : 'Master'}
                </span>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-ghost flex-1 py-3.5 text-sm">
              Close
            </button>
            {isEnrolled && (
              <Link
                href={`/practice/${certSlug}?domain=${domain.id}`}
                className="btn-primary flex-1 py-3.5 text-sm text-center"
              >
                Practice Domain
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
