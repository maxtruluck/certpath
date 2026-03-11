'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store';
import { SessionProgress } from '@/components/practice/SessionProgress';
import { SessionTimer } from '@/components/practice/SessionTimer';
import { QuestionCard } from '@/components/practice/QuestionCard';
import { OptionButton } from '@/components/practice/OptionButton';
import { ExplanationPanel } from '@/components/practice/ExplanationPanel';
import { Button } from '@/components/ui/Button';

interface Question {
  id: string;
  domain_id: string;
  certification_id: string;
  question_text: string;
  question_type: string;
  options: { id: string; text: string }[];
  correct_option_ids: string[];
  explanation: string;
  difficulty: number;
  tags: string[];
}

interface AnswerResult {
  is_correct: boolean;
  correct_option_ids: string[];
  explanation: string;
  xp_earned: number;
  next_review_days: number;
}

export default function PracticePage() {
  const params = useParams();
  const router = useRouter();
  const { session, startSession, answerQuestion, nextQuestion, resetSession, saveSessionForReview, triggerXpToast } = useAppStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [certId, setCertId] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [domainNames, setDomainNames] = useState<Record<string, string>>({});
  const [sessionResults, setSessionResults] = useState<{ is_correct: boolean; time_ms: number }[]>([]);
  const [exitConfirm, setExitConfirm] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  const currentQuestion = session.questions[session.currentIndex] as Question | undefined;
  const isLastQuestion = session.currentIndex >= session.questions.length - 1;

  const loadSession = useCallback(async () => {
    try {
      const supabase = createClient();

      const { data: cert } = await supabase
        .from('certifications')
        .select('id')
        .eq('slug', params.certSlug)
        .single();

      if (!cert) {
        setError('Certification not found');
        setLoading(false);
        return;
      }
      setCertId(cert.id);

      const { data: domains } = await supabase
        .from('domains')
        .select('id, name')
        .eq('certification_id', cert.id);

      const names: Record<string, string> = {};
      (domains ?? []).forEach((d) => { names[d.id] = d.name; });
      setDomainNames(names);

      const res = await fetch(`/api/session/generate?certification_id=${cert.id}&question_count=12`);
      if (!res.ok) throw new Error('Failed to generate session');
      const data = await res.json();

      if (data.questions && data.questions.length > 0) {
        startSession(data.questions);
      } else {
        setError('No questions available for this certification yet');
      }
    } catch (err) {
      setError('Something went wrong loading your session');
      console.error('Session load error:', err);
    }
    setLoading(false);
  }, [params.certSlug, startSession]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  async function handleSubmitAnswer() {
    if (!currentQuestion || selectedIds.length === 0) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/session/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: currentQuestion.id,
          selected_option_ids: selectedIds,
          time_spent_ms: Date.now() - (session.questionStartTime ?? Date.now()),
        }),
      });

      if (!res.ok) throw new Error('Failed to submit answer');

      const result: AnswerResult = await res.json();
      setAnswerResult(result);
      answerQuestion(currentQuestion.id, selectedIds, result.is_correct);
      triggerXpToast(result.xp_earned);
      setSessionResults((prev) => [
        ...prev,
        { is_correct: result.is_correct, time_ms: Date.now() - (session.questionStartTime ?? Date.now()) },
      ]);
    } catch (err) {
      console.error('Answer submission error:', err);
    }
    setSubmitting(false);
  }

  function handleNext() {
    if (isLastQuestion) {
      handleCompleteSession();
    } else {
      nextQuestion();
      setSelectedIds([]);
      setAnswerResult(null);
    }
  }

  async function handleCompleteSession() {
    saveSessionForReview();

    const res = await fetch('/api/session/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        certification_id: certId,
        session_results: sessionResults,
      }),
    });

    const data = await res.json();

    sessionStorage.setItem('sessionComplete', JSON.stringify(data));
    router.push(`/practice/${params.certSlug}/complete`);
  }

  async function handleBookmark(questionId: string) {
    const res = await fetch('/api/bookmark', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question_id: questionId }),
    });
    const data = await res.json();
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (data.bookmarked) next.add(questionId);
      else next.delete(questionId);
      return next;
    });
  }

  function toggleOption(optionId: string) {
    if (answerResult) return;
    if (currentQuestion?.question_type === 'multiple_choice') {
      setSelectedIds([optionId]);
    } else {
      setSelectedIds((prev) =>
        prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]
      );
    }
  }

  function getOptionState(optionId: string): 'default' | 'selected' | 'correct' | 'incorrect' {
    if (!answerResult) {
      return selectedIds.includes(optionId) ? 'selected' : 'default';
    }
    if (answerResult.correct_option_ids.includes(optionId)) return 'correct';
    if (selectedIds.includes(optionId) && !answerResult.correct_option_ids.includes(optionId)) return 'incorrect';
    return 'default';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="animate-spin w-8 h-8 border-2 border-cp-green border-t-transparent rounded-full mx-auto" />
          <p className="text-cp-text-muted">Generating your session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4 px-6">
          <div className="w-16 h-16 rounded-2xl bg-cp-danger/10 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-cp-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <p className="text-cp-text-secondary font-bold">{error}</p>
          <div className="flex gap-3 justify-center">
            <Button variant="ghost" onClick={() => router.push('/dashboard')}>Dashboard</Button>
            <Button onClick={() => { setError(null); setLoading(true); loadSession(); }}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <p className="text-cp-text-muted">No questions available</p>
          <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Session header with timer and exit */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setExitConfirm(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-cp-text-muted hover:text-cp-danger hover:bg-cp-danger/10 transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Exit
        </button>
        <SessionTimer
          startTime={session.sessionStartTime}
          questionStartTime={session.questionStartTime}
        />
      </div>

      {/* Exit confirmation modal */}
      {exitConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4" onClick={() => setExitConfirm(false)}>
          <div className="w-full max-w-lg bg-white rounded-2xl border-2 border-cp-border p-6 space-y-4 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-extrabold text-lg text-center">Leave Session?</h3>
            <p className="text-sm text-cp-text-muted text-center">Your progress in this session won&apos;t be saved.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setExitConfirm(false)}
                className="btn-ghost flex-1 py-3.5 text-sm"
              >
                Keep Going
              </button>
              <button
                onClick={() => { resetSession(); router.push('/dashboard'); }}
                className="flex-1 py-3.5 text-sm rounded-2xl bg-cp-danger text-white font-extrabold uppercase tracking-wide border-b-4 border-cp-danger-dark active:border-b-2 active:translate-y-[2px]"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}

      <SessionProgress current={session.currentIndex} total={session.questions.length} />

      <QuestionCard
        questionText={currentQuestion.question_text}
        domainName={domainNames[currentQuestion.domain_id]}
        difficulty={currentQuestion.difficulty}
      />

      <div className="space-y-3">
        {currentQuestion.options.map((option) => (
          <OptionButton
            key={option.id}
            id={option.id}
            text={option.text}
            state={getOptionState(option.id)}
            onClick={() => toggleOption(option.id)}
            disabled={!!answerResult}
          />
        ))}
      </div>

      {!answerResult && selectedIds.length > 0 && (
        <Button
          onClick={handleSubmitAnswer}
          loading={submitting}
          className="w-full"
        >
          Submit Answer
        </Button>
      )}

      {answerResult && (
        <ExplanationPanel
          isCorrect={answerResult.is_correct}
          explanation={answerResult.explanation}
          xpEarned={answerResult.xp_earned}
          nextReviewDays={answerResult.next_review_days}
          onNext={handleNext}
          isLast={isLastQuestion}
          questionId={currentQuestion.id}
          onBookmark={handleBookmark}
          isBookmarked={bookmarkedIds.has(currentQuestion.id)}
        />
      )}
    </div>
  );
}
