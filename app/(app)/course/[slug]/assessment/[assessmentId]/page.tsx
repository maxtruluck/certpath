'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';

// ─── Types ───────────────────────────────────────────────────────
interface AssessmentInfo {
  id: string;
  title: string;
  assessment_type: string;
  question_count: number;
  time_limit_minutes: number | null;
  passing_score_percent: number;
  show_explanations: boolean;
}

interface Question {
  id: string;
  topic_id: string;
  question_text: string;
  question_type: string;
  options: { id: string; text: string }[];
  difficulty: number;
  matching_items?: { lefts: string[]; rights: string[] };
}

interface CollectedAnswer {
  question_id: string;
  selected_option_ids?: string[];
  answer_text?: string;
  user_order?: string[];
  user_pairs?: { left: string; right: string }[];
  time_spent_ms: number;
}

interface SubmitResult {
  score_percent: number;
  passed: boolean;
  correct_count: number;
  total_count: number;
  time_spent_seconds: number;
  results: {
    question_id: string;
    is_correct: boolean;
    explanation?: string;
    correct_option_ids?: string[];
    correct_order?: string[];
    matching_pairs?: { left: string; right: string }[];
    acceptable_answers?: string[];
  }[];
  topic_breakdown: { topic_id: string; topic_title: string; correct: number; total: number }[];
}

type Phase = 'loading' | 'intro' | 'question' | 'submitting' | 'results';

// ─── Timer Bar ───────────────────────────────────────────────────
function TimerBar({ seconds, total }: { seconds: number; total: number }) {
  const pct = (seconds / total) * 100;
  const urgent = seconds < 60;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${urgent ? 'bg-red-500' : 'bg-blue-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs font-mono font-medium min-w-[3rem] text-right ${urgent ? 'text-red-500' : 'text-gray-500'}`}>
        {m}:{s.toString().padStart(2, '0')}
      </span>
    </div>
  );
}

// ─── Main Content ────────────────────────────────────────────────
function AssessmentContent() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const assessmentId = params.assessmentId as string;

  const [phase, setPhase] = useState<Phase>('loading');
  const [error, setError] = useState<string | null>(null);

  // Assessment data
  const [assessment, setAssessment] = useState<AssessmentInfo | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attemptId, setAttemptId] = useState<string | null>(null);

  // Question navigation
  const [currentIdx, setCurrentIdx] = useState(0);

  // Per-question answer state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [fillAnswer, setFillAnswer] = useState('');
  const [orderItems, setOrderItems] = useState<{ id: string; text: string }[]>([]);
  const [matchSelections, setMatchSelections] = useState<Record<string, string>>({});
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  // Collected answers
  const [collectedAnswers, setCollectedAnswers] = useState<CollectedAnswer[]>([]);

  // Timer
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const totalTimeRef = useRef<number>(0);
  const autoSubmitRef = useRef(false);

  // Results
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  const currentQuestion = questions[currentIdx];

  // ─── Start assessment ──────────────────────────────────────
  const startAssessment = useCallback(async () => {
    setPhase('loading');
    try {
      const res = await fetch(`/api/assessments/${assessmentId}/start`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to start');
      const data = await res.json();
      setAssessment(data.assessment);
      setQuestions(data.questions);
      setAttemptId(data.attempt_id);

      if (data.assessment.time_limit_minutes) {
        const totalSec = data.assessment.time_limit_minutes * 60;
        setTimeRemaining(totalSec);
        totalTimeRef.current = totalSec;
      }
      setPhase('intro');
    } catch {
      setError('Failed to start assessment');
      setPhase('loading');
    }
  }, [assessmentId]);

  useEffect(() => { startAssessment(); }, [startAssessment]);

  // ─── Timer countdown ───────────────────────────────────────
  useEffect(() => {
    if (phase !== 'question' || timeRemaining === null) return;
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          autoSubmitRef.current = true;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, timeRemaining === null]);

  // Auto-submit when timer expires
  useEffect(() => {
    if (autoSubmitRef.current && phase === 'question') {
      autoSubmitRef.current = false;
      handleSubmitAll();
    }
  }, [timeRemaining]);

  // ─── Save current answer ───────────────────────────────────
  function saveCurrentAnswer(): CollectedAnswer | null {
    if (!currentQuestion) return null;
    const timeMs = Date.now() - questionStartTime;
    const answer: CollectedAnswer = {
      question_id: currentQuestion.id,
      time_spent_ms: timeMs,
    };

    if (currentQuestion.question_type === 'fill_blank') {
      answer.answer_text = fillAnswer;
    } else if (currentQuestion.question_type === 'ordering') {
      answer.user_order = orderItems.map(i => i.id);
    } else if (currentQuestion.question_type === 'matching') {
      answer.user_pairs = Object.entries(matchSelections).map(([left, right]) => ({ left, right }));
    } else {
      answer.selected_option_ids = selectedIds;
    }
    return answer;
  }

  function initQuestionState(q: Question) {
    setSelectedIds([]);
    setFillAnswer('');
    setQuestionStartTime(Date.now());

    if (q.question_type === 'ordering') {
      const shuffled = [...q.options];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      setOrderItems(shuffled);
    } else {
      setOrderItems([]);
    }

    if (q.question_type === 'matching' && q.matching_items) {
      const sel: Record<string, string> = {};
      for (const left of q.matching_items.lefts) sel[left] = '';
      setMatchSelections(sel);
    } else {
      setMatchSelections({});
    }
  }

  // ─── Navigate questions ────────────────────────────────────
  function handleNext() {
    const answer = saveCurrentAnswer();
    if (answer) {
      setCollectedAnswers(prev => {
        const filtered = prev.filter(a => a.question_id !== answer.question_id);
        return [...filtered, answer];
      });
    }

    if (currentIdx >= questions.length - 1) {
      // Last question — show submit
      return;
    }

    const nextIdx = currentIdx + 1;
    setCurrentIdx(nextIdx);
    initQuestionState(questions[nextIdx]);
  }

  // ─── Submit all ────────────────────────────────────────────
  async function handleSubmitAll() {
    // Collect current answer first
    const current = saveCurrentAnswer();
    let allAnswers = [...collectedAnswers];
    if (current) {
      allAnswers = allAnswers.filter(a => a.question_id !== current.question_id);
      allAnswers.push(current);
    }

    // Fill in any unanswered questions with empty answers
    for (const q of questions) {
      if (!allAnswers.find(a => a.question_id === q.id)) {
        allAnswers.push({ question_id: q.id, selected_option_ids: [], time_spent_ms: 0 });
      }
    }

    setPhase('submitting');

    try {
      const res = await fetch(`/api/assessments/${assessmentId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attempt_id: attemptId, answers: allAnswers }),
      });
      if (!res.ok) throw new Error('Submit failed');
      const result: SubmitResult = await res.json();
      setSubmitResult(result);
      setPhase('results');
    } catch {
      setError('Failed to submit assessment');
      setPhase('question');
    }
  }

  // ─── Can submit current question ───────────────────────────
  const canAdvance = (() => {
    if (!currentQuestion) return false;
    if (currentQuestion.question_type === 'fill_blank') return fillAnswer.trim().length > 0;
    if (currentQuestion.question_type === 'ordering') return orderItems.length > 0;
    if (currentQuestion.question_type === 'matching') return Object.values(matchSelections).every(v => v !== '');
    return selectedIds.length > 0;
  })();

  function toggleOption(optionId: string) {
    if (currentQuestion?.question_type === 'multiple_select') {
      setSelectedIds(prev => prev.includes(optionId) ? prev.filter(id => id !== optionId) : [...prev, optionId]);
    } else {
      setSelectedIds([optionId]);
    }
  }

  function moveOrderItem(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= orderItems.length) return;
    const items = [...orderItems];
    [items[index], items[target]] = [items[target], items[index]];
    setOrderItems(items);
  }

  const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
  const isLastQuestion = currentIdx >= questions.length - 1;

  // ─── Loading ───────────────────────────────────────────────
  if (phase === 'loading' && !error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">{error}</p>
        <button onClick={() => router.back()} className="text-blue-500 font-medium text-sm">Go back</button>
      </div>
    );
  }

  // ─── Intro ─────────────────────────────────────────────────
  if (phase === 'intro' && assessment) {
    const typeLabel = assessment.assessment_type === 'topic_quiz' ? 'Topic Quiz'
      : assessment.assessment_type === 'module_test' ? 'Module Test'
      : 'Practice Exam';
    return (
      <div className="min-h-[100dvh] bg-white">
        <div className="max-w-lg mx-auto px-4 py-12">
          <div className="text-center space-y-6">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto ${
              assessment.assessment_type === 'practice_exam' ? 'bg-purple-50 border border-purple-200' : 'bg-amber-50 border border-amber-200'
            }`}>
              <svg className={`w-8 h-8 ${assessment.assessment_type === 'practice_exam' ? 'text-purple-500' : 'text-amber-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">{typeLabel}</p>
              <h1 className="text-xl font-bold text-gray-900">{assessment.title}</h1>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p>{assessment.question_count} questions</p>
              {assessment.time_limit_minutes && <p>Time limit: {assessment.time_limit_minutes} minutes</p>}
              <p>Pass score: {assessment.passing_score_percent}%</p>
            </div>
            <p className="text-xs text-gray-400">
              Answers are collected and submitted together at the end.
              {assessment.time_limit_minutes && ' The timer starts when you begin.'}
            </p>
            <button
              onClick={() => {
                setPhase('question');
                setCurrentIdx(0);
                setCollectedAnswers([]);
                if (questions[0]) initQuestionState(questions[0]);
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-xl transition-colors"
            >
              Begin
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Submitting ────────────────────────────────────────────
  if (phase === 'submitting') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
        <p className="text-gray-500 text-sm">Grading your assessment...</p>
      </div>
    );
  }

  // ─── Results ───────────────────────────────────────────────
  if (phase === 'results' && submitResult) {
    const r = submitResult;
    return (
      <div className="min-h-[100dvh] bg-white">
        <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
          {/* Score circle */}
          <div className="text-center space-y-4">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto text-3xl font-bold border-4 ${
              r.passed ? 'bg-green-50 text-green-600 border-green-300' : 'bg-red-50 text-red-600 border-red-300'
            }`}>
              {r.score_percent}%
            </div>
            <div className="flex items-center justify-center gap-2">
              {r.passed ? (
                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              <h1 className="text-xl font-bold text-gray-900">{r.passed ? 'Passed!' : 'Not yet'}</h1>
            </div>
            <div className="text-sm text-gray-500 space-y-1">
              <p>{r.correct_count}/{r.total_count} correct</p>
              <p>Time: {Math.floor(r.time_spent_seconds / 60)}m {r.time_spent_seconds % 60}s</p>
            </div>
          </div>

          {/* Topic breakdown */}
          {r.topic_breakdown.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-900">Topic Breakdown</h3>
              {r.topic_breakdown.map(t => {
                const pct = t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0;
                const barColor = pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500';
                return (
                  <div key={t.topic_id} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 flex-1 truncate">{t.topic_title}</span>
                    <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className={`text-xs font-mono font-medium w-12 text-right ${pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                      {t.correct}/{t.total}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Per-question review */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-900">Question Review</h3>
            {r.results.map((result, idx) => {
              const q = questions.find(qq => qq.id === result.question_id);
              const isExpanded = expandedQuestion === result.question_id;
              return (
                <button
                  key={result.question_id}
                  onClick={() => setExpandedQuestion(isExpanded ? null : result.question_id)}
                  className="w-full text-left"
                >
                  <div className={`p-3 rounded-xl border transition-colors ${
                    result.is_correct ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${result.is_correct ? 'text-green-600' : 'text-red-600'}`}>
                        Q{idx + 1}
                      </span>
                      <span className="text-sm text-gray-700 flex-1 truncate">
                        {q?.question_text || 'Question'}
                      </span>
                      <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    {isExpanded && q && (
                      <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                        <p className="text-sm text-gray-800">{q.question_text}</p>
                        {/* Show user's answer vs correct */}
                        {result.correct_option_ids && q.options && (
                          <div className="space-y-1">
                            {q.options.map(opt => {
                              const isCorrect = result.correct_option_ids?.includes(opt.id);
                              const wasSelected = collectedAnswers.find(a => a.question_id === q.id)?.selected_option_ids?.includes(opt.id);
                              return (
                                <div key={opt.id} className={`text-xs px-2 py-1 rounded ${
                                  isCorrect ? 'bg-green-100 text-green-800' : wasSelected ? 'bg-red-100 text-red-800' : 'text-gray-500'
                                }`}>
                                  {opt.text}
                                  {isCorrect && ' (correct)'}
                                  {wasSelected && !isCorrect && ' (your answer)'}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {result.acceptable_answers && (
                          <p className="text-xs text-green-700">
                            Correct answer: {result.acceptable_answers[0]}
                          </p>
                        )}
                        {result.explanation && (
                          <p className="text-xs text-gray-600 italic">{result.explanation}</p>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/course/${slug}/path`)}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back to Course
            </button>
            <button
              onClick={() => {
                setCurrentIdx(0);
                setCollectedAnswers([]);
                setSubmitResult(null);
                setExpandedQuestion(null);
                startAssessment();
              }}
              className="flex-1 px-4 py-3 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600"
            >
              Retake
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Question Phase ────────────────────────────────────────
  if (phase !== 'question' || !currentQuestion) return null;

  const progressPct = ((currentIdx + 1) / questions.length) * 100;

  return (
    <div className="min-h-[100dvh] bg-white">
      <div className="max-w-lg mx-auto px-4 pb-8">
        {/* Top bar */}
        <div className="space-y-2 py-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 min-w-fit">Q {currentIdx + 1} of {questions.length}</span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
          {timeRemaining !== null && (
            <TimerBar seconds={timeRemaining} total={totalTimeRef.current} />
          )}
        </div>

        {/* Question text */}
        <div className="mb-6">
          <p className="text-base font-medium text-gray-900 leading-relaxed">{currentQuestion.question_text}</p>
          {currentQuestion.question_type === 'multiple_select' && <p className="text-xs text-gray-400 mt-2">Select all that apply</p>}
          {currentQuestion.question_type === 'fill_blank' && <p className="text-xs text-gray-400 mt-2">Type your answer</p>}
          {currentQuestion.question_type === 'ordering' && <p className="text-xs text-gray-400 mt-2">Arrange items in the correct order</p>}
          {currentQuestion.question_type === 'matching' && <p className="text-xs text-gray-400 mt-2">Match each item on the left with the correct item on the right</p>}
        </div>

        {/* Fill blank */}
        {currentQuestion.question_type === 'fill_blank' && (
          <div className="mb-6">
            <input
              type="text"
              value={fillAnswer}
              onChange={e => setFillAnswer(e.target.value)}
              placeholder="Type your answer..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              autoFocus
            />
          </div>
        )}

        {/* Ordering */}
        {currentQuestion.question_type === 'ordering' && (
          <div className="mb-6 space-y-2">
            {orderItems.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200">
                  <span className="text-sm font-medium text-gray-500 w-5">{idx + 1}.</span>
                  <span className="text-sm text-gray-900 flex-1">{item.text}</span>
                </div>
                <div className="flex flex-col">
                  <button onClick={() => moveOrderItem(idx, -1)} disabled={idx === 0} className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs px-1">&#9650;</button>
                  <button onClick={() => moveOrderItem(idx, 1)} disabled={idx === orderItems.length - 1} className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs px-1">&#9660;</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Matching */}
        {currentQuestion.question_type === 'matching' && currentQuestion.matching_items && (
          <div className="mb-6 space-y-3">
            {currentQuestion.matching_items.lefts.map(left => (
              <div key={left} className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-900 w-1/3 truncate">{left}</span>
                <select
                  value={matchSelections[left] || ''}
                  onChange={e => setMatchSelections(prev => ({ ...prev, [left]: e.target.value }))}
                  className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">Select...</option>
                  {currentQuestion.matching_items!.rights.map(right => (
                    <option key={right} value={right}>{right}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}

        {/* MC / MS / TF */}
        {['multiple_choice', 'multiple_select', 'true_false'].includes(currentQuestion.question_type) && (
          <div className="space-y-2.5 mb-6">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedIds.includes(option.id);
              return (
                <button
                  key={option.id}
                  onClick={() => toggleOption(option.id)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
                    isSelected ? 'border-blue-400 bg-blue-50 shadow-sm' : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <span className="text-sm font-medium text-gray-500 flex-shrink-0">{optionLabels[idx]}.</span>
                  <span className="text-sm text-left text-gray-900">{option.text}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3">
          {isLastQuestion ? (
            <button
              onClick={handleSubmitAll}
              disabled={!canAdvance}
              className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-colors ${
                canAdvance
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              Submit Assessment
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!canAdvance}
              className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-colors ${
                canAdvance
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AssessmentPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
      </div>
    }>
      <AssessmentContent />
    </Suspense>
  );
}
