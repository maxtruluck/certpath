'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

interface CertDetailActionsProps {
  certId: string;
  certSlug: string;
  isEnrolled: boolean;
  status: string | null;
  totalQuestions: number;
}

export function CertDetailActions({ certId, certSlug, isEnrolled, status, totalQuestions }: CertDetailActionsProps) {
  const router = useRouter();
  const [enrolling, setEnrolling] = useState(false);
  const [showPaceSelect, setShowPaceSelect] = useState(false);
  const [selectedPace, setSelectedPace] = useState<string>('sprint_60');

  async function handleEnroll() {
    setEnrolling(true);
    const res = await fetch('/api/certifications/enroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        certification_id: certId,
        sprint_type: selectedPace,
      }),
    });

    if (res.ok) {
      router.refresh();
    }
    setEnrolling(false);
  }

  if (totalQuestions === 0) {
    return (
      <div className="rounded-2xl bg-cp-bg-secondary border-2 border-cp-border p-5 text-center animate-fade-up">
        <p className="text-sm text-cp-text-muted font-medium">Questions coming soon for this certification</p>
      </div>
    );
  }

  if (isEnrolled && status === 'active') {
    return (
      <Link href={`/practice/${certSlug}`} className="btn-primary block w-full py-4 text-sm text-center animate-fade-up">
        Start Practice Session
      </Link>
    );
  }

  if (isEnrolled) {
    return (
      <div className="space-y-3 animate-fade-up">
        <div className="rounded-xl bg-cp-bg-secondary border-2 border-cp-border p-4 text-center">
          <p className="text-sm text-cp-text-muted">Status: <span className="font-bold capitalize">{status}</span></p>
        </div>
        <Button onClick={handleEnroll} loading={enrolling} className="w-full" size="lg">
          Resume Studying
        </Button>
      </div>
    );
  }

  if (showPaceSelect) {
    return (
      <div className="space-y-3 animate-fade-up">
        <h3 className="text-sm font-bold text-center">Choose your study pace</h3>
        <div className="space-y-2">
          {[
            { type: 'sprint_30', label: '30-Day Sprint', desc: '~15 min/day', badge: 'Aggressive', color: 'text-cp-danger' },
            { type: 'sprint_60', label: '60-Day Sprint', desc: '~10 min/day', badge: 'Balanced', color: 'text-cp-green' },
            { type: 'sprint_90', label: '90-Day Sprint', desc: '~5 min/day', badge: 'Casual', color: 'text-cp-success' },
          ].map((option) => (
            <button
              key={option.type}
              onClick={() => setSelectedPace(option.type)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                selectedPace === option.type
                  ? 'border-cp-green bg-cp-green/10'
                  : 'border-cp-border bg-white hover:border-cp-green/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">{option.label}</p>
                  <p className="text-xs text-cp-text-muted">{option.desc}</p>
                </div>
                <span className={`text-[10px] px-2.5 py-1 rounded-full bg-cp-bg-secondary font-extrabold ${option.color}`}>
                  {option.badge}
                </span>
              </div>
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowPaceSelect(false)} className="btn-ghost flex-1 py-3.5 text-sm">
            Back
          </button>
          <Button onClick={handleEnroll} loading={enrolling} className="flex-1" size="lg">
            Start Studying
          </Button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowPaceSelect(true)}
      className="btn-primary w-full py-4 text-sm animate-fade-up"
    >
      Start Studying This Cert
    </button>
  );
}
