'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';

interface CompleteData {
  correct_count: number;
  total_count: number;
  accuracy_percent: number;
  readiness_before: number;
  readiness_after: number;
  readiness_delta: number;
  module_breakdown: { module_id: string; module_title: string; correct: number; total: number }[];
  sections_read?: number;
  concepts_learned?: number;
  questions_answered?: number;
  lesson_title?: string;
  is_lesson?: boolean;
}

function AccuracyCircle({ correct, total }: { correct: number; total: number }) {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (pct / 100) * circumference;
  const color = pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#E8E4DD" strokeWidth="8" />
        <circle
          cx="60" cy="60" r={radius}
          fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{
            '--circumference': `${circumference}`,
            '--dash-offset': `${dashOffset}`,
          } as React.CSSProperties}
          className="animate-circle-progress"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-[#2C2825]">{correct}/{total}</span>
        <span className="text-sm text-[#6B635A]">{pct}%</span>
      </div>
    </div>
  );
}

function AnimatedNumber({ value, suffix = '' }: { value: number | string; suffix?: string }) {
  return (
    <span className="inline-block animate-count-up">
      {value}{suffix}
    </span>
  );
}

export default function SessionCompletePage() {
  const router = useRouter();
  const params = useParams();
  const courseSlug = params.courseSlug as string;
  const { resetSession, clearSessionReview } = useAppStore();
  const [data, setData] = useState<CompleteData | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('sessionComplete');
    if (stored) {
      try {
        setData(JSON.parse(stored));
      } catch { /* ignore */ }
      sessionStorage.removeItem('sessionComplete');
    }
  }, []);

  function handleDone() {
    resetSession();
    clearSessionReview();
    router.push(`/course/${courseSlug}/path`);
  }

  const correctCount = data?.correct_count ?? 0;
  const totalCount = data?.total_count ?? 0;
  const sectionsRead = data?.sections_read ?? 0;
  const conceptsLearned = data?.concepts_learned ?? 0;
  const isLesson = data?.is_lesson ?? false;
  const mistakeCount = totalCount - correctCount;

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-4 bg-[#FAFAF8]">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center animate-bounce-in">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
            <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[#2C2825]">
            {isLesson ? 'Lesson Complete!' : 'Session Complete!'}
          </h1>
          {data?.lesson_title && (
            <p className="text-sm text-[#6B635A] mt-1">{data.lesson_title}</p>
          )}
        </div>

        {/* Accuracy circle */}
        {totalCount > 0 && (
          <div className="animate-fade-up">
            <AccuracyCircle correct={correctCount} total={totalCount} />
          </div>
        )}

        {/* Stats row */}
        {totalCount > 0 && (
          <div className="flex gap-3 animate-fade-up" style={{ animationDelay: '200ms' }}>
            <div className="flex-1 rounded-xl bg-[#F5F3EF] border border-[#E8E4DD] p-3 text-center">
              <p className="text-xl font-bold text-[#2C2825]">
                <AnimatedNumber value={`${Math.round((correctCount / totalCount) * 100)}%`} />
              </p>
              <p className="text-[10px] text-[#6B635A] mt-0.5">accuracy</p>
            </div>
          </div>
        )}

        {/* Lesson stats (sections read, concepts learned) */}
        {(sectionsRead > 0 || conceptsLearned > 0) && (
          <div className="flex gap-3 animate-fade-up" style={{ animationDelay: '250ms' }}>
            {sectionsRead > 0 && (
              <div className="flex-1 rounded-xl bg-[#F5F3EF] border border-[#E8E4DD] p-3 text-center">
                <p className="text-xl font-bold text-[#2C2825]">
                  <AnimatedNumber value={sectionsRead} />
                </p>
                <p className="text-[10px] text-[#6B635A] mt-0.5">sections read</p>
              </div>
            )}
            {conceptsLearned > 0 && (
              <div className="flex-1 rounded-xl bg-green-50 border border-green-200 p-3 text-center">
                <p className="text-xl font-bold text-green-700">
                  <AnimatedNumber value={conceptsLearned} />
                </p>
                <p className="text-[10px] text-green-600 mt-0.5">concepts learned</p>
              </div>
            )}
          </div>
        )}

        {/* Module breakdown */}
        {data?.module_breakdown && data.module_breakdown.length > 0 && (
          <div className="space-y-2 animate-fade-up" style={{ animationDelay: '400ms' }}>
            <h3 className="text-sm font-semibold text-[#2C2825]">Module Breakdown</h3>
            {data.module_breakdown.map(mod => {
              const pct = mod.total > 0 ? Math.round((mod.correct / mod.total) * 100) : 0;
              const barColor = pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500';
              return (
                <div key={mod.module_id} className="flex items-center gap-3">
                  <span className="text-sm text-[#6B635A] flex-1 truncate">{mod.module_title}</span>
                  <div className="w-20 h-1.5 bg-[#EBE8E2] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className={`text-xs font-mono font-medium w-12 text-right ${pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                    {mod.correct}/{mod.total}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-3 animate-fade-up" style={{ animationDelay: '500ms' }}>
          <button
            onClick={handleDone}
            className="block w-full py-3.5 rounded-xl bg-[#2C2825] hover:bg-[#1A1816] text-[#F5F3EF] font-bold text-sm text-center transition-colors"
          >
            {isLesson ? 'Next Lesson' : 'Back to Course'}
          </button>
          {mistakeCount > 0 && (
            <Link
              href={`/practice/${courseSlug}/review`}
              className="block w-full py-3 rounded-xl bg-[#F5F3EF] border border-[#E8E4DD] text-[#2C2825] font-medium text-sm text-center hover:bg-[#EBE8E2] transition-colors"
            >
              Review Mistakes ({mistakeCount})
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
