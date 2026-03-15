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
  const readinessDeltaPct = Math.round((data?.readiness_delta ?? 0) * 100);
  const mistakeCount = totalCount - correctCount;

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Success icon */}
        <div className="text-center animate-bounce-in">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Session complete</h1>
        </div>

        {/* Stats in bordered boxes */}
        <div className="flex gap-3 animate-fade-up">
          <div className="flex-1 rounded-xl bg-gray-50 border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900 font-mono">
              {correctCount}<span className="text-gray-400">/{totalCount}</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">Correct</p>
          </div>
          {readinessDeltaPct !== 0 && (
            <div className="flex-1 rounded-xl bg-gray-50 border border-gray-200 p-4 text-center">
              <p className={`text-2xl font-bold font-mono ${readinessDeltaPct > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {readinessDeltaPct > 0 ? '+' : ''}{readinessDeltaPct}%
              </p>
              <p className="text-xs text-gray-500 mt-1">Readiness</p>
            </div>
          )}
        </div>

        {/* XP & Streak */}
        {data && data.xp_earned && data.xp_earned > 0 && (
          <div className="flex items-center gap-3 justify-center mb-6 animate-fade-up">
            <span className="px-3 py-1 bg-blue-50 text-blue-600 font-semibold rounded-full text-sm border border-blue-200">
              +{data.xp_earned} XP
            </span>
            {data.streak && data.streak.current > 1 && (
              <span className="px-3 py-1 bg-amber-50 text-amber-600 font-semibold rounded-full text-sm border border-amber-200">
                🔥 {data.streak.current} day streak
              </span>
            )}
          </div>
        )}

        {/* Achievements */}
        {data?.achievements && data.achievements.length > 0 && (
          <div className="mb-6 space-y-2 animate-fade-up">
            <p className="text-sm font-medium text-gray-500 text-center">Achievements Unlocked</p>
            {data.achievements.map(a => (
              <div key={a.id} className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="text-2xl">{a.icon}</span>
                <div>
                  <p className="font-semibold text-sm text-gray-900">{a.title}</p>
                  <p className="text-xs text-gray-500">{a.description}</p>
                </div>
                {a.xp_reward > 0 && (
                  <span className="ml-auto text-xs font-semibold text-blue-600">+{a.xp_reward} XP</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Topic breakdown */}
        {data?.topic_breakdown && data.topic_breakdown.length > 0 && (
          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4 space-y-3 animate-fade-up" style={{ animationDelay: '100ms' }}>
            <h3 className="text-sm font-semibold text-gray-900">Topic breakdown</h3>
            {data.topic_breakdown.map((topic) => (
              <div key={topic.topic_id} className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm text-gray-700 truncate">{topic.topic_title}</span>
                  {topic.is_review && (
                    <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded flex-shrink-0">
                      review
                    </span>
                  )}
                </div>
                <span className={`text-sm font-mono font-medium flex-shrink-0 ml-2 ${
                  topic.correct === topic.total ? 'text-green-500' : 'text-gray-600'
                }`}>
                  {topic.correct}/{topic.total} correct
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Unlocked topic */}
        {data?.unlocked_topic && (
          <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4 text-center animate-fade-up">
            <p className="text-sm text-blue-700 font-medium">
              New topic unlocked: <span className="font-bold">{data.unlocked_topic.title}</span>
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-3 animate-fade-up" style={{ animationDelay: '200ms' }}>
          <button
            onClick={handleDone}
            className="w-full py-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold transition-colors border border-blue-200"
          >
            Continue to path
          </button>
          {mistakeCount > 0 && (
            <Link
              href={`/practice/${courseSlug}/review`}
              className="block w-full py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 font-medium text-center hover:bg-gray-100 transition-colors"
            >
              Review {mistakeCount} mistake{mistakeCount !== 1 ? 's' : ''}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
