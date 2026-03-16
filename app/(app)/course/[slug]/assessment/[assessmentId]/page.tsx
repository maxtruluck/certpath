'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  question_text: string;
  question_type: string;
  options: { id: string; text: string }[];
  difficulty: number;
  matching_items?: { lefts: string[]; rights: string[] };
}

interface AnswerResult {
  is_correct: boolean;
  explanation?: string;
  correct_option_ids?: string[];
  correct_order?: string[];
  matching_pairs?: { left: string; right: string }[];
  acceptable_answers?: string[];
  option_explanation?: string;
}

interface AttemptResult {
  id: string;
  score_percent: number;
  correct_count: number;
  total_count: number;
  passed: boolean;
  time_spent_seconds: number;
}

type Phase = 'intro' | 'question' | 'results';

function AssessmentContent() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const assessmentId = params.assessmentId as string;

  const [phase, setPhase] = useState<Phase>('intro');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Assessment data
  const [assessment, setAssessment] = useState<AssessmentInfo | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attemptId, setAttemptId] = useState<string | null>(null);

  // Question state
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [fillAnswer, setFillAnswer] = useState('');
  const [matchSelections, setMatchSelections] = useState<Record<string, string>>({});
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  // Timer
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);

  // Results
  const [results, setResults] = useState<AttemptResult | null>(null);

  const currentQuestion = questions[currentIdx];

  // Start assessment
  async function startAssessment() {
    setLoading(true);
    try {
      const res = await fetch(`/api/assessments/${assessmentId}/start`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to start');
      const data = await res.json();
      setAssessment(data.assessment);
      setQuestions(data.questions);
      setAttemptId(data.attempt_id);

      if (data.assessment.time_limit_minutes) {
        setTimeRemaining(data.assessment.time_limit_minutes * 60);
      }
      setStartTime(Date.now());
      setPhase('question');
      setQuestionStartTime(Date.now());
    } catch (err) {
      setError('Failed to start assessment');
    }
    setLoading(false);
  }

  // Load assessment info on mount
  useEffect(() => {
    async function load() {
      try {
        // Just start to get info — we show intro first
        const res = await fetch(`/api/assessments/${assessmentId}/start`, { method: 'POST' });
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        setAssessment(data.assessment);
        setQuestions(data.questions);
        setAttemptId(data.attempt_id);
      } catch (err) {
        setError('Assessment not found');
      }
      setLoading(false);
    }
    load();
  }, [assessmentId]);

  // Timer countdown
  useEffect(() => {
    if (phase !== 'question' || timeRemaining === null) return;
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 0) {
          clearInterval(interval);
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, timeRemaining !== null]);

  async function handleSubmitAnswer() {
    if (!currentQuestion || !attemptId) return;
    setSubmitting(true);
    try {
      const body: any = {
        attempt_id: attemptId,
        question_id: currentQuestion.id,
        time_spent_ms: Date.now() - questionStartTime,
      };

      if (currentQuestion.question_type === 'fill_blank') {
        body.answer_text = fillAnswer;
      } else if (currentQuestion.question_type === 'matching') {
        body.user_pairs = Object.entries(matchSelections).map(([left, right]) => ({ left, right }));
      } else {
        body.selected_option_ids = selectedIds;
      }

      const res = await fetch(`/api/assessments/${assessmentId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      setAnswerResult(result);
    } catch (err) {
      console.error('Answer error:', err);
    }
    setSubmitting(false);
  }

  function handleNext() {
    setSelectedIds([]);
    setFillAnswer('');
    setMatchSelections({});
    setAnswerResult(null);
    setQuestionStartTime(Date.now());

    if (currentIdx >= questions.length - 1) {
      handleComplete();
    } else {
      setCurrentIdx(prev => prev + 1);
      // Init matching selections
      const next = questions[currentIdx + 1];
      if (next?.question_type === 'matching' && next.matching_items) {
        const sel: Record<string, string> = {};
        for (const left of next.matching_items.lefts) sel[left] = '';
        setMatchSelections(sel);
      }
    }
  }

  async function handleComplete() {
    try {
      const res = await fetch(`/api/assessments/${assessmentId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attempt_id: attemptId }),
      });
      const data = await res.json();
      setResults(data);
      setPhase('results');
    } catch (err) {
      console.error('Complete error:', err);
    }
  }

  function toggleOption(optionId: string) {
    if (answerResult) return;
    if (currentQuestion?.question_type === 'multiple_select') {
      setSelectedIds(prev => prev.includes(optionId) ? prev.filter(id => id !== optionId) : [...prev, optionId]);
    } else {
      setSelectedIds([optionId]);
    }
  }

  const canSubmit = (() => {
    if (!currentQuestion || answerResult) return false;
    if (currentQuestion.question_type === 'fill_blank') return fillAnswer.trim().length > 0;
    if (currentQuestion.question_type === 'matching') return Object.values(matchSelections).every(v => v !== '');
    return selectedIds.length > 0;
  })();

  const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];

  // Format timer
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">{error || 'Not found'}</p>
        <button onClick={() => router.back()} className="text-blue-500 font-medium text-sm">Go back</button>
      </div>
    );
  }

  // ─── Intro Phase ──────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="min-h-[100dvh] bg-white">
        <div className="max-w-lg mx-auto px-4 py-12">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-2xl">
              {assessment.assessment_type === 'topic_quiz' ? '\u26A1' : assessment.assessment_type === 'module_test' ? '\u2B50' : '\uD83D\uDCCB'}
            </div>
            <h1 className="text-xl font-bold text-gray-900">{assessment.title}</h1>
            <div className="space-y-2 text-sm text-gray-600">
              <p>{assessment.question_count} questions</p>
              {assessment.time_limit_minutes && <p>Time limit: {assessment.time_limit_minutes} minutes</p>}
              <p>Pass score: {assessment.passing_score_percent}%</p>
            </div>
            <button
              onClick={() => {
                setPhase('question');
                setStartTime(Date.now());
                setQuestionStartTime(Date.now());
                if (assessment.time_limit_minutes) {
                  setTimeRemaining(assessment.time_limit_minutes * 60);
                }
                // Init first question matching
                const first = questions[0];
                if (first?.question_type === 'matching' && first.matching_items) {
                  const sel: Record<string, string> = {};
                  for (const left of first.matching_items.lefts) sel[left] = '';
                  setMatchSelections(sel);
                }
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-xl transition-colors"
            >
              Start
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Results Phase ────────────────────────────────────────
  if (phase === 'results' && results) {
    return (
      <div className="min-h-[100dvh] bg-white">
        <div className="max-w-lg mx-auto px-4 py-12">
          <div className="text-center space-y-6">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto text-3xl font-bold ${
              results.passed ? 'bg-green-50 text-green-600 border-2 border-green-200' : 'bg-red-50 text-red-600 border-2 border-red-200'
            }`}>
              {results.score_percent}%
            </div>
            <h1 className="text-xl font-bold text-gray-900">{results.passed ? 'Passed!' : 'Not yet'}</h1>
            <div className="space-y-1 text-sm text-gray-600">
              <p>{results.correct_count}/{results.total_count} correct</p>
              <p>Time: {Math.floor(results.time_spent_seconds / 60)}m {results.time_spent_seconds % 60}s</p>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => router.push(`/course/${slug}/path`)}
                className="px-6 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Back to Path
              </button>
              <button
                onClick={() => {
                  setPhase('intro');
                  setCurrentIdx(0);
                  setResults(null);
                  setAttemptId(null);
                  startAssessment();
                }}
                className="px-6 py-3 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600"
              >
                Retake
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Question Phase ───────────────────────────────────────
  if (!currentQuestion) return null;

  const progressPct = ((currentIdx + 1) / questions.length) * 100;

  return (
    <div className="min-h-[100dvh] bg-white">
      <div className="max-w-lg mx-auto px-4 pb-8">
        {/* Top bar */}
        <div className="flex items-center gap-3 py-4">
          <span className="text-xs text-gray-400 min-w-fit">Q {currentIdx + 1} of {questions.length}</span>
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
          </div>
          {timeRemaining !== null && (
            <span className={`text-sm font-mono font-medium ${timeRemaining < 60 ? 'text-red-500' : 'text-gray-500'}`}>
              {formatTime(timeRemaining)}
            </span>
          )}
        </div>

        {/* Question text */}
        <div className="mb-6">
          <p className="text-base font-medium text-gray-900 leading-relaxed">{currentQuestion.question_text}</p>
        </div>

        {/* Fill blank */}
        {currentQuestion.question_type === 'fill_blank' && !answerResult && (
          <input
            type="text"
            value={fillAnswer}
            onChange={e => setFillAnswer(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && canSubmit && handleSubmitAnswer()}
            placeholder="Type your answer..."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            autoFocus
          />
        )}

        {/* Matching */}
        {currentQuestion.question_type === 'matching' && currentQuestion.matching_items && !answerResult && (
          <div className="mb-6 space-y-3">
            {currentQuestion.matching_items.lefts.map(left => (
              <div key={left} className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-900 w-1/3 truncate">{left}</span>
                <select
                  value={matchSelections[left] || ''}
                  onChange={e => setMatchSelections(prev => ({ ...prev, [left]: e.target.value }))}
                  className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white"
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

        {/* MC / MS / TF options */}
        {['multiple_choice', 'multiple_select', 'true_false'].includes(currentQuestion.question_type) && (
          <div className="space-y-2.5 mb-6">
            {currentQuestion.options.map((option, idx) => {
              let borderClass = 'border-gray-200 hover:border-gray-300';
              let bgClass = 'bg-white';
              if (selectedIds.includes(option.id) && !answerResult) {
                borderClass = 'border-blue-400 shadow-sm';
                bgClass = 'bg-blue-50';
              }
              if (answerResult) {
                if (answerResult.correct_option_ids?.includes(option.id)) {
                  borderClass = 'border-green-400'; bgClass = 'bg-green-50';
                } else if (selectedIds.includes(option.id)) {
                  borderClass = 'border-red-400'; bgClass = 'bg-red-50';
                }
              }
              return (
                <button
                  key={option.id}
                  onClick={() => toggleOption(option.id)}
                  disabled={!!answerResult}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all ${borderClass} ${bgClass} disabled:cursor-default`}
                >
                  <span className="text-sm font-medium text-gray-500 flex-shrink-0">{optionLabels[idx]}.</span>
                  <span className="text-sm text-left text-gray-900">{option.text}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Check button */}
        {!answerResult && (
          <button
            onClick={handleSubmitAnswer}
            disabled={!canSubmit || submitting}
            className="w-full py-3 rounded-xl font-semibold transition-colors disabled:bg-gray-100 disabled:text-gray-400 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
          >
            {submitting ? 'Checking...' : 'Check'}
          </button>
        )}

        {/* Feedback */}
        {answerResult && (
          <div className={`rounded-2xl p-5 space-y-3 ${answerResult.is_correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <h3 className={`font-bold text-lg ${answerResult.is_correct ? 'text-green-700' : 'text-red-700'}`}>
              {answerResult.is_correct ? 'Correct!' : 'Incorrect'}
            </h3>
            {answerResult.explanation && (
              <p className="text-sm text-gray-700">{answerResult.explanation}</p>
            )}
            <button
              onClick={handleNext}
              className={`w-full py-3 rounded-xl font-semibold transition-colors ${
                answerResult.is_correct ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-white border border-gray-200 text-blue-600'
              }`}
            >
              {currentIdx >= questions.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        )}
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
