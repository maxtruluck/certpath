'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAppStore } from '@/lib/store';

interface Question {
  id: string;
  domain_id: string;
  topic_id: string;
  certification_id: string;
  course_id: string;
  question_text: string;
  question_type: string;
  options: { id: string; text: string }[];
  correct_option_ids: string[];
  explanation: string;
  difficulty: number;
  tags: string[];
  topic_title?: string;
}

interface AnswerResult {
  is_correct: boolean;
  correct_option_ids: string[];
  explanation: string;
  xp_earned: number;
  next_review_days: number;
}

function PracticeContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseSlug = params.courseSlug as string;
  const topicId = searchParams.get('topic');

  const { sessionId, questions: storeQuestions, currentIndex, questionStartTime, startSession, answerQuestion, nextQuestion, resetSession, saveSessionForReview } = useAppStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courseId, setCourseId] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [exitConfirm, setExitConfirm] = useState(false);
  const [wrongQueue, setWrongQueue] = useState<Question[]>([]);
  const [inRequeue, setInRequeue] = useState(false);
  const [requeueIndex, setRequeueIndex] = useState(0);

  const isInRequeue = inRequeue && wrongQueue.length > 0;
  const currentQuestion = isInRequeue
    ? wrongQueue[requeueIndex]
    : storeQuestions[currentIndex] as Question | undefined;
  const totalQuestions = storeQuestions.length;
  const displayIndex = isInRequeue
    ? totalQuestions + requeueIndex
    : currentIndex;
  const displayTotal = totalQuestions + (inRequeue ? wrongQueue.length : 0);

  const loadSession = useCallback(async () => {
    try {
      const courseRes = await fetch(`/api/courses/${courseSlug}`);
      if (!courseRes.ok) throw new Error('Course not found');
      const courseData = await courseRes.json();
      setCourseId(courseData.id);

      let url = `/api/session/generate?course_id=${courseData.id}&question_count=10`;
      if (topicId) url += `&topic_id=${topicId}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to generate session');
      const data = await res.json();

      if (data.questions && data.questions.length > 0) {
        startSession(data.session_id || crypto.randomUUID(), courseData.id, data.questions);
      } else {
        setError('No questions available for this course yet');
      }
    } catch (err) {
      setError('Something went wrong loading your session');
      console.error('Session load error:', err);
    }
    setLoading(false);
  }, [courseSlug, topicId, startSession]);

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
          session_id: sessionId,
          question_id: currentQuestion.id,
          selected_option_ids: selectedIds,
          time_spent_ms: Date.now() - (questionStartTime ?? Date.now()),
        }),
      });

      if (!res.ok) throw new Error('Failed to submit answer');

      const result: AnswerResult = await res.json();
      setAnswerResult(result);

      if (!isInRequeue) {
        answerQuestion(currentQuestion.id, selectedIds, result.is_correct);
        if (!result.is_correct) {
          setWrongQueue((prev) => [...prev, currentQuestion]);
        }
      }
    } catch (err) {
      console.error('Answer submission error:', err);
    }
    setSubmitting(false);
  }

  function handleNext() {
    setSelectedIds([]);
    setAnswerResult(null);

    if (isInRequeue) {
      if (requeueIndex >= wrongQueue.length - 1) {
        handleCompleteSession();
      } else {
        setRequeueIndex((i) => i + 1);
      }
      return;
    }

    const isLast = currentIndex >= storeQuestions.length - 1;
    if (isLast) {
      if (wrongQueue.length > 0) {
        setInRequeue(true);
        setRequeueIndex(0);
      } else {
        handleCompleteSession();
      }
    } else {
      nextQuestion();
    }
  }

  async function handleCompleteSession() {
    try {
      const res = await fetch('/api/session/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const data = await res.json();
      sessionStorage.setItem('sessionComplete', JSON.stringify(data));
      saveSessionForReview({
        ...data,
        xpEarned: data.xp_earned,
        streak: data.streak,
        achievements: data.achievements,
      });
    } catch (err) {
      console.error('Session complete error:', err);
    }

    router.push(`/practice/${courseSlug}/complete`);
  }

  function toggleOption(optionId: string) {
    if (answerResult) return;
    if (currentQuestion?.question_type === 'multiple_select') {
      setSelectedIds((prev) =>
        prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]
      );
    } else if (currentQuestion?.question_type === 'ordering') {
      setSelectedIds((prev) =>
        prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]
      );
    } else {
      // multiple_choice, true_false, fill_blank — single select
      setSelectedIds([optionId]);
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

  const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-gray-500 text-sm">Generating your session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4 px-6">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">{error}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => router.push('/home')} className="text-sm font-medium text-gray-500 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50">
              Home
            </button>
            <button
              onClick={() => { setError(null); setLoading(true); loadSession(); }}
              className="text-sm font-medium text-white bg-blue-500 px-4 py-2 rounded-xl hover:bg-blue-600"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <p className="text-gray-500">No questions available</p>
          <button onClick={() => router.push('/home')} className="text-blue-500 font-medium text-sm">
            Back to home
          </button>
        </div>
      </div>
    );
  }

  const progressPct = ((displayIndex + 1) / displayTotal) * 100;

  return (
    <div className="min-h-[100dvh] bg-white">
      <div className="max-w-lg mx-auto px-4 pb-8">
        {/* Top bar: X button, progress, count */}
        <div className="flex items-center gap-3 py-4">
          <button
            onClick={() => setExitConfirm(true)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-sm font-medium text-gray-500 font-mono min-w-[3rem] text-right">
            {displayIndex + 1}/{displayTotal}
          </span>
        </div>

        {/* Exit confirmation */}
        {exitConfirm && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4" onClick={() => setExitConfirm(false)}>
            <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-200 p-6 space-y-4 animate-slide-up" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-bold text-lg text-center text-gray-900">Leave session?</h3>
              <p className="text-sm text-gray-500 text-center">Your progress in this session won&apos;t be saved.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setExitConfirm(false)}
                  className="flex-1 py-3 text-sm font-medium rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  Keep going
                </button>
                <button
                  onClick={() => { resetSession(); router.push(`/course/${courseSlug}/path`); }}
                  className="flex-1 py-3 text-sm font-medium rounded-xl bg-red-500 text-white hover:bg-red-600"
                >
                  Leave
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Topic badge */}
        {currentQuestion.topic_title && (
          <div className="mb-4">
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              {currentQuestion.topic_title}
            </span>
          </div>
        )}

        {/* Requeue indicator */}
        {isInRequeue && (
          <div className="mb-4">
            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              Review: previously missed
            </span>
          </div>
        )}

        {/* Question text */}
        <div className="mb-6">
          <p className="text-base font-medium text-gray-900 leading-relaxed">
            {currentQuestion.question_text}
          </p>
          {currentQuestion.question_type === 'multiple_select' && (
            <p className="text-xs text-gray-400 mt-2">Select all that apply</p>
          )}
          {currentQuestion.question_type === 'fill_blank' && (
            <p className="text-xs text-gray-400 mt-2">Fill in the blank</p>
          )}
          {currentQuestion.question_type === 'ordering' && (
            <p className="text-xs text-gray-400 mt-2">Tap items in the correct order</p>
          )}
        </div>

        {/* Options */}
        <div className="space-y-2.5 mb-6">
          {currentQuestion.options.map((option, idx) => {
            const state = getOptionState(option.id);
            let borderClass = 'border-gray-200 hover:border-gray-300';
            let bgClass = 'bg-white';
            let textClass = 'text-gray-900';

            if (state === 'selected') {
              borderClass = 'border-blue-400 shadow-sm';
              bgClass = 'bg-blue-50';
            } else if (state === 'correct') {
              borderClass = 'border-green-400';
              bgClass = 'bg-green-50';
            } else if (state === 'incorrect') {
              borderClass = 'border-red-400';
              bgClass = 'bg-red-50';
            }

            if (answerResult && state === 'default') {
              textClass = 'text-gray-400';
            }

            return (
              <button
                key={option.id}
                onClick={() => toggleOption(option.id)}
                disabled={!!answerResult}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all ${borderClass} ${bgClass} disabled:cursor-default`}
              >
                <span className="text-sm font-medium text-gray-500 flex-shrink-0">
                  {currentQuestion.question_type === 'ordering' && selectedIds.includes(option.id) && !answerResult
                    ? `${selectedIds.indexOf(option.id) + 1}.`
                    : `${optionLabels[idx]}.`}
                </span>
                <span className={`text-sm text-left ${textClass}`}>{option.text}</span>
              </button>
            );
          })}
        </div>

        {/* Check button - light blue style per wireframe */}
        {!answerResult && (
          <button
            onClick={handleSubmitAnswer}
            disabled={
              selectedIds.length === 0 ||
              submitting ||
              (currentQuestion.question_type === 'ordering' && selectedIds.length !== currentQuestion.options.length)
            }
            className="w-full py-3 rounded-xl font-semibold transition-colors disabled:bg-gray-100 disabled:text-gray-400 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
          >
            {submitting ? 'Checking...' : currentQuestion.question_type === 'ordering' && selectedIds.length !== currentQuestion.options.length ? `Order all items (${selectedIds.length}/${currentQuestion.options.length})` : 'Check'}
          </button>
        )}

        {/* Feedback panel */}
        {answerResult && (
          <div className={`rounded-2xl p-5 space-y-3 animate-slide-up ${
            answerResult.is_correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <h3 className={`font-bold text-lg ${answerResult.is_correct ? 'text-green-700' : 'text-red-700'}`}>
              {answerResult.is_correct ? 'Correct!' : 'Not quite'}
            </h3>
            <div className="text-sm text-gray-700 leading-relaxed">
              {answerResult.is_correct ? (
                <p>{answerResult.explanation}</p>
              ) : currentQuestion.question_type === 'ordering' ? (
                <>
                  <p className="mb-2">{answerResult.explanation}</p>
                  <p className="font-semibold mb-1">Correct order:</p>
                  <ol className="list-decimal list-inside space-y-0.5">
                    {answerResult.correct_option_ids.map((id) => {
                      const opt = currentQuestion.options.find(o => o.id === id);
                      return opt ? <li key={id}>{opt.text}</li> : null;
                    })}
                  </ol>
                </>
              ) : (
                <p>
                  <span className="font-semibold">Your answer ({optionLabels[currentQuestion.options.findIndex(o => selectedIds.includes(o.id))]}. {currentQuestion.options.find(o => selectedIds.includes(o.id))?.text})</span>
                  {' '}{answerResult.explanation.includes('refers to') || answerResult.explanation.includes('is') ? answerResult.explanation : answerResult.explanation}
                  {' '}<span className="font-semibold">{currentQuestion.options.find(o => answerResult.correct_option_ids.includes(o.id))?.text}</span>
                  {' '}{answerResult.explanation.split('.').slice(1).join('.').trim()}
                </p>
              )}
            </div>
            <button
              onClick={handleNext}
              className={`w-full py-3 rounded-xl font-semibold transition-colors ${
                answerResult.is_correct
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-white border border-gray-200 text-blue-600 hover:bg-gray-50'
              }`}
            >
              {answerResult.is_correct ? 'Continue' : 'Got it'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    }>
      <PracticeContent />
    </Suspense>
  );
}
