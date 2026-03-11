'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ReadinessGauge } from '@/components/gamification/ReadinessGauge';
import { AchievementCard } from '@/components/gamification/AchievementCard';
import { ReviewPanel } from '@/components/practice/ReviewPanel';
import { useAppStore } from '@/lib/store';

interface SessionCompleteData {
  xp_summary: {
    answers: number;
    session_bonus: number;
    achievements: number;
    total: number;
  };
  readiness: {
    previous: number;
    current: number;
    delta: number;
  };
  streak: {
    current: number;
    longest: number;
  };
  achievements_earned: {
    name: string;
    description: string;
    icon_emoji: string;
    xp_reward: number;
  }[];
  accuracy: number;
  questions_total: number;
  questions_correct: number;
}

export default function SessionCompletePage() {
  const router = useRouter();
  const params = useParams();
  const { resetSession, sessionReview, clearSessionReview } = useAppStore();
  const [data, setData] = useState<SessionCompleteData | null>(null);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('sessionComplete');
    if (stored) {
      setData(JSON.parse(stored));
      sessionStorage.removeItem('sessionComplete');
    }
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);

  function handleDone() {
    resetSession();
    clearSessionReview();
    router.push('/dashboard');
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <p className="text-cp-text-muted">Loading results...</p>
          <Button onClick={handleDone}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  const accuracyPct = Math.round(data.accuracy * 100);

  return (
    <div className={`space-y-5 pb-8 transition-opacity duration-500 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
      {/* Celebration header */}
      <div className="text-center space-y-3 py-6 animate-bounce-in">
        <div className="text-6xl animate-celebrate">🎉</div>
        <h1 className="text-2xl font-bold">Session Complete!</h1>
        <p className="text-cp-text-muted text-sm">Great job staying consistent</p>
      </div>

      {/* Score & readiness */}
      <div className="flex items-center justify-around rounded-2xl bg-white border-2 border-cp-border p-6 animate-fade-up">
        <div className="text-center">
          <p className="text-4xl font-bold font-mono">
            {data.questions_correct}<span className="text-cp-text-muted text-2xl">/{data.questions_total}</span>
          </p>
          <p className={`text-sm font-bold mt-1 ${
            accuracyPct >= 80 ? 'text-cp-success' : accuracyPct >= 60 ? 'text-cp-warning' : 'text-cp-danger'
          }`}>
            {accuracyPct}% accuracy
          </p>
        </div>
        <div className="w-px h-16 bg-cp-border" />
        <ReadinessGauge score={data.readiness.current} size="md" />
      </div>

      {/* Readiness delta */}
      {data.readiness.delta !== 0 && (
        <div className={`text-center py-2 rounded-xl text-sm font-mono font-bold animate-fade-up ${
          data.readiness.delta > 0
            ? 'text-cp-success bg-cp-success/10'
            : 'text-cp-danger bg-cp-danger/10'
        }`}>
          Readiness {data.readiness.delta > 0 ? '+' : ''}{Math.round(data.readiness.delta * 100)}%
        </div>
      )}

      {/* XP Summary */}
      <div className="rounded-2xl bg-white border-2 border-cp-border p-5 space-y-3 animate-fade-up">
        <h3 className="font-bold text-sm uppercase tracking-wider text-cp-text-muted">XP Earned</h3>
        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-cp-text-secondary">Answer XP</span>
            <span className="font-mono font-bold">+{data.xp_summary.answers}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-cp-text-secondary">Session Bonus</span>
            <span className="font-mono font-bold">+{data.xp_summary.session_bonus}</span>
          </div>
          {data.xp_summary.achievements > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-cp-text-secondary">Achievements</span>
              <span className="font-mono font-bold">+{data.xp_summary.achievements}</span>
            </div>
          )}
          <div className="flex justify-between items-center border-t border-cp-border pt-3">
            <span className="font-bold">Total</span>
            <span className="font-mono font-bold text-lg gradient-text">+{data.xp_summary.total} XP</span>
          </div>
        </div>
      </div>

      {/* Streak */}
      <div className="rounded-2xl bg-white border-2 border-cp-border p-5 flex items-center justify-between animate-fade-up">
        <div>
          <p className="text-[10px] text-cp-text-muted uppercase tracking-widest font-bold">Current Streak</p>
          <p className="text-2xl font-bold font-mono mt-1">
            <span className={data.streak.current >= 7 ? 'animate-bounce-in inline-block' : ''}>🔥</span>{' '}
            {data.streak.current} days
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-cp-text-muted uppercase tracking-widest font-bold">Best</p>
          <p className="font-mono font-bold mt-1">{data.streak.longest} days</p>
        </div>
      </div>

      {/* Achievements */}
      {data.achievements_earned.length > 0 && (
        <div className="space-y-3 animate-fade-up">
          <h3 className="font-bold text-sm uppercase tracking-wider text-cp-text-muted">Achievements Unlocked!</h3>
          <div className="stagger">
            {data.achievements_earned.map((a, i) => (
              <div key={i} className="animate-bounce-in">
                <AchievementCard
                  name={a.name}
                  description={a.description}
                  iconEmoji={a.icon_emoji}
                  xpReward={a.xp_reward}
                  earned={true}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Question Review */}
      {sessionReview && sessionReview.questions.length > 0 && (
        <div className="animate-fade-up">
          <ReviewPanel
            questions={sessionReview.questions}
            answers={sessionReview.answers}
          />
        </div>
      )}

      {/* Action buttons */}
      <div className="space-y-3 animate-fade-up">
        <Link
          href={`/practice/${params.certSlug}`}
          onClick={() => resetSession()}
          className="btn-primary block w-full py-4 text-sm text-center"
        >
          Practice Again
        </Link>
        <button onClick={handleDone} className="btn-ghost w-full py-4 text-sm">
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
