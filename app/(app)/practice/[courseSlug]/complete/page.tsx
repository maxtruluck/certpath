'use client';

import { useEffect, useState, useRef } from 'react';
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
  topic_breakdown: { topic_id: string; topic_title: string; correct: number; total: number; is_review: boolean }[];
  unlocked_topic: { id: string; title: string } | null;
  xp_earned?: number;
  streak?: { current: number; longest: number };
  achievements?: Array<{
    id: string;
    slug: string;
    title: string;
    description: string;
    icon: string;
    xp_reward: number;
  }>;
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
    const pathUrl = data?.unlocked_topic
      ? `/course/${courseSlug}/path?unlocked=${data.unlocked_topic.id}`
      : `/course/${courseSlug}/path`;
    router.push(pathUrl);
  }

  const correctCount = data?.correct_count ?? 0;
  const totalCount = data?.total_count ?? 0;
  const readinessAfter = Math.round((data?.readiness_after ?? 0) * 100);
  const readinessDeltaPct = Math.round((data?.readiness_delta ?? 0) * 100);
  const mistakeCount = totalCount - correctCount;
  const xpEarned = data?.xp_earned ?? 0;
  const streakDays = data?.streak?.current ?? 0;

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
          <h1 className="text-xl font-bold text-[#2C2825]">Session Complete!</h1>
        </div>

        {/* Accuracy circle */}
        <div className="animate-fade-up">
          <AccuracyCircle correct={correctCount} total={totalCount} />
        </div>

        {/* Topic unlock celebration */}
        {data?.unlocked_topic && (
          <div className="animate-fade-up rounded-xl border-2 border-blue-400 bg-blue-50 p-4 relative overflow-hidden" style={{ animationDelay: '150ms' }}>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-blue-300/20 to-blue-400/10 animate-shimmer" />
            <div className="relative flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">New Topic Unlocked</p>
                <p className="text-sm font-bold text-[#2C2825] truncate">{data.unlocked_topic.title}</p>
              </div>
              <Link
                href={`/course/${courseSlug}/guidebook?topic=${data.unlocked_topic.id}`}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 flex-shrink-0"
              >
                Study
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        )}

        {/* Stats row */}
        <div className="flex gap-3 animate-fade-up" style={{ animationDelay: '200ms' }}>
          <div className="flex-1 rounded-xl bg-[#F5F3EF] border border-[#E8E4DD] p-3 text-center">
            <p className="text-xl font-bold text-[#2C2825]">
              <AnimatedNumber value={`+${xpEarned}`} />
            </p>
            <p className="text-[10px] text-[#6B635A] mt-0.5">XP earned</p>
          </div>
          <div className="flex-1 rounded-xl bg-[#F5F3EF] border border-[#E8E4DD] p-3 text-center">
            <p className="text-xl font-bold text-[#2C2825]">
              <AnimatedNumber value={streakDays} />
            </p>
            <p className="text-[10px] text-[#6B635A] mt-0.5">streak days</p>
          </div>
          <div className="flex-1 rounded-xl bg-[#F5F3EF] border border-[#E8E4DD] p-3 text-center">
            <p className="text-xl font-bold text-[#2C2825]">
              <AnimatedNumber value={`${readinessAfter}%`} />
            </p>
            <p className="text-[10px] text-[#6B635A] mt-0.5">
              {readinessDeltaPct > 0 ? `(+${readinessDeltaPct}%)` : readinessDeltaPct < 0 ? `(${readinessDeltaPct}%)` : 'ready'}
            </p>
          </div>
        </div>

        {/* Achievements */}
        {data?.achievements && data.achievements.length > 0 && (
          <div className="space-y-2 animate-fade-up" style={{ animationDelay: '300ms' }}>
            {data.achievements.map(a => (
              <div key={a.id} className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="text-2xl">{a.icon}</span>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-[#2C2825]">{a.title}</p>
                  <p className="text-xs text-[#6B635A]">{a.description}</p>
                </div>
                {a.xp_reward > 0 && <span className="text-xs font-bold text-[#2C2825]">+{a.xp_reward} XP</span>}
              </div>
            ))}
          </div>
        )}

        {/* Topic breakdown */}
        {data?.topic_breakdown && data.topic_breakdown.length > 0 && (
          <div className="space-y-2 animate-fade-up" style={{ animationDelay: '400ms' }}>
            <h3 className="text-sm font-semibold text-[#2C2825]">Topic Breakdown</h3>
            {data.topic_breakdown.map(topic => {
              const pct = topic.total > 0 ? Math.round((topic.correct / topic.total) * 100) : 0;
              const barColor = pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500';
              return (
                <div key={topic.topic_id} className="flex items-center gap-3">
                  <span className="text-sm text-[#6B635A] flex-1 truncate">{topic.topic_title}</span>
                  <div className="w-20 h-1.5 bg-[#EBE8E2] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className={`text-xs font-mono font-medium w-12 text-right ${pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                    {topic.correct}/{topic.total}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Smart review suggestion */}
        {data?.topic_breakdown?.some(t => t.total > 0 && (t.correct / t.total) < 0.7) && (
          <div className="rounded-xl bg-[#F5F3EF] border border-[#E8E4DD] p-4 animate-fade-up" style={{ animationDelay: '500ms' }}>
            <p className="text-sm font-medium text-[#2C2825] mb-2">Suggested review:</p>
            {data!.topic_breakdown
              .filter(t => t.total > 0 && (t.correct / t.total) < 0.7)
              .map(t => (
                <Link
                  key={t.topic_id}
                  href={`/course/${courseSlug}/guidebook?topic=${t.topic_id}`}
                  className="flex items-center gap-2 text-sm text-[#2C2825] hover:text-[#1A1816] font-medium mt-1"
                >
                  {t.topic_title} — you scored below 70%
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-3 animate-fade-up" style={{ animationDelay: '600ms' }}>
          <Link
            href={`/practice/${courseSlug}`}
            className="block w-full py-3.5 rounded-xl bg-[#2C2825] hover:bg-[#1A1816] text-[#F5F3EF] font-bold text-sm text-center transition-colors"
          >
            Continue Learning
          </Link>
          {mistakeCount > 0 && (
            <Link
              href={`/practice/${courseSlug}/review`}
              className="block w-full py-3 rounded-xl bg-[#F5F3EF] border border-[#E8E4DD] text-[#2C2825] font-medium text-sm text-center hover:bg-[#EBE8E2] transition-colors"
            >
              Review Mistakes ({mistakeCount})
            </Link>
          )}
          <button
            onClick={handleDone}
            className="w-full text-sm text-[#A39B90] hover:text-[#6B635A] py-2 transition-colors"
          >
            Back to Course Path
          </button>
        </div>
      </div>
    </div>
  );
}
