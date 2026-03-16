'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// ─── Types ───────────────────────────────────────────────────────
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
  matching_items?: { lefts: string[]; rights: string[] };
}

interface AnswerResult {
  is_correct: boolean;
  correct_option_ids: string[];
  explanation: string;
  xp_earned: number;
  next_review_days: number;
  option_explanation?: string | null;
  linked_lesson?: { title: string; body: string } | null;
  correct_order?: string[];
  matching_pairs?: { left: string; right: string }[];
  acceptable_answers?: string[];
}

interface IntroTopic {
  topic_id: string;
  title: string;
  lesson_title: string;
  body_preview: string;
}

type QueueItem =
  | { type: 'intro'; data: IntroTopic }
  | { type: 'question'; data: Question };

// ─── Sortable Item for Ordering ──────────────────────────────────
function SortableOrderItem({ id, text, index }: { id: string; text: string; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[#E8E4DD]">
      <button {...attributes} {...listeners} className="text-[#D4CFC7] hover:text-[#6B635A] cursor-grab active:cursor-grabbing">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <circle cx="5" cy="3" r="1" /><circle cx="9" cy="3" r="1" />
          <circle cx="5" cy="7" r="1" /><circle cx="9" cy="7" r="1" />
          <circle cx="5" cy="11" r="1" /><circle cx="9" cy="11" r="1" />
        </svg>
      </button>
      <span className="text-sm font-medium text-[#6B635A] w-5">{index + 1}.</span>
      <span className="text-sm text-[#2C2825] flex-1">{text}</span>
    </div>
  );
}

// ─── Practice Content ────────────────────────────────────────────
function PracticeContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseSlug = params.courseSlug as string;
  const topicId = searchParams.get('topic');

  const { sessionId, questions: storeQuestions, currentIndex, questionStartTime, startSession, answerQuestion, nextQuestion, resetSession, saveSessionForReview } = useAppStore();

  const [sessionStarted, setSessionStarted] = useState(false);
  const [questionCount, setQuestionCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [courseId, setCourseId] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [exitConfirm, setExitConfirm] = useState(false);
  const [wrongQueue, setWrongQueue] = useState<Question[]>([]);
  const [wrongAnswerResults, setWrongAnswerResults] = useState<Record<string, AnswerResult>>({});
  const [inRequeue, setInRequeue] = useState(false);
  const [requeueIndex, setRequeueIndex] = useState(0);
  const [showRequeueRecap, setShowRequeueRecap] = useState(false);

  // New type state
  const [fillBlankAnswer, setFillBlankAnswer] = useState('');
  const [orderItems, setOrderItems] = useState<{ id: string; text: string }[]>([]);
  const [matchSelections, setMatchSelections] = useState<Record<string, string>>({});
  const [showLinkedBlock, setShowLinkedBlock] = useState(false);

  // Session queue with intros
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const currentItem = queue[queueIndex];
  const isIntro = currentItem?.type === 'intro';
  const currentQuestion = !isIntro ? (currentItem?.data as Question) : null;

  // Count only question items for progress
  const totalQuestionCount = queue.filter(i => i.type === 'question').length + (inRequeue ? wrongQueue.length : 0);
  const questionIndex = queue.slice(0, queueIndex + 1).filter(i => i.type === 'question').length - (isIntro ? 0 : 0);
  const displayIndex = isIntro ? questionIndex : (inRequeue ? queue.filter(i => i.type === 'question').length + requeueIndex : questionIndex);
  const displayTotal = queue.filter(i => i.type === 'question').length + (inRequeue ? wrongQueue.length : 0);

  const loadSession = useCallback(async () => {
    setLoading(true);
    try {
      const courseRes = await fetch(`/api/courses/${courseSlug}`);
      if (!courseRes.ok) throw new Error('Course not found');
      const courseData = await courseRes.json();
      setCourseId(courseData.id);

      let url = `/api/session/generate?course_id=${courseData.id}&question_count=${questionCount}`;
      if (topicId) url += `&topic_id=${topicId}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to generate session');
      const data = await res.json();

      if (data.questions && data.questions.length > 0) {
        startSession(data.session_id || crypto.randomUUID(), courseData.id, data.questions);

        // Build queue with intros interleaved
        const introTopics: IntroTopic[] = data.intro_topics || [];
        const builtQueue: QueueItem[] = [];
        const shownIntros = new Set<string>();

        for (const question of data.questions) {
          const intro = introTopics.find(t => t.topic_id === question.topic_id);
          if (intro && !shownIntros.has(intro.topic_id)) {
            builtQueue.push({ type: 'intro', data: intro });
            shownIntros.add(intro.topic_id);
          }
          builtQueue.push({ type: 'question', data: question });
        }

        setQueue(builtQueue);
        setQueueIndex(0);

        // If first item is an ordering question, init order items
        const firstQ = builtQueue.find(i => i.type === 'question')?.data as Question | undefined;
        if (firstQ?.question_type === 'ordering') {
          initOrderItems(firstQ);
        }
        if (firstQ?.question_type === 'matching' && firstQ.matching_items) {
          initMatchSelections(firstQ);
        }
      } else {
        setError('No questions available for this course yet');
      }
    } catch (err) {
      setError('Something went wrong loading your session');
      console.error('Session load error:', err);
    }
    setLoading(false);
  }, [courseSlug, topicId, questionCount, startSession]);

  useEffect(() => {
    if (sessionStarted) loadSession();
  }, [sessionStarted, loadSession]);

  function initOrderItems(q: Question) {
    // Shuffle options for display
    const shuffled = [...q.options];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setOrderItems(shuffled);
  }

  function initMatchSelections(q: Question) {
    const sel: Record<string, string> = {};
    if (q.matching_items) {
      for (const left of q.matching_items.lefts) {
        sel[left] = '';
      }
    }
    setMatchSelections(sel);
  }

  function resetQuestionState() {
    setSelectedIds([]);
    setAnswerResult(null);
    setFillBlankAnswer('');
    setOrderItems([]);
    setMatchSelections({});
    setShowLinkedBlock(false);
  }

  async function handleSubmitAnswer() {
    if (!currentQuestion) return;
    setSubmitting(true);

    try {
      const body: any = {
        session_id: sessionId,
        question_id: currentQuestion.id,
        time_spent_ms: Date.now() - (questionStartTime ?? Date.now()),
      };

      if (currentQuestion.question_type === 'fill_blank') {
        body.answer_text = fillBlankAnswer;
      } else if (currentQuestion.question_type === 'ordering') {
        body.user_order = orderItems.map(i => i.id);
        body.selected_option_ids = orderItems.map(i => i.id);
      } else if (currentQuestion.question_type === 'matching') {
        body.user_pairs = Object.entries(matchSelections).map(([left, right]) => ({ left, right }));
        body.selected_option_ids = [];
      } else {
        body.selected_option_ids = selectedIds;
      }

      const res = await fetch('/api/session/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Failed to submit answer');
      const result: AnswerResult = await res.json();
      setAnswerResult(result);

      if (!inRequeue) {
        answerQuestion(currentQuestion.id, selectedIds, result.is_correct);
        if (!result.is_correct) {
          setWrongQueue(prev => [...prev, currentQuestion]);
          setWrongAnswerResults(prev => ({ ...prev, [currentQuestion.id]: result }));
        }
      }
    } catch (err) {
      console.error('Answer submission error:', err);
    }
    setSubmitting(false);
  }

  function handleNext() {
    resetQuestionState();

    if (inRequeue) {
      if (requeueIndex >= wrongQueue.length - 1) {
        handleCompleteSession();
      } else {
        setRequeueIndex(i => i + 1);
        setShowRequeueRecap(true);
      }
      return;
    }

    const nextIdx = queueIndex + 1;
    if (nextIdx >= queue.length) {
      if (wrongQueue.length > 0) {
        setInRequeue(true);
        setRequeueIndex(0);
        setShowRequeueRecap(true);
      } else {
        handleCompleteSession();
      }
    } else {
      setQueueIndex(nextIdx);
      const nextItem = queue[nextIdx];
      if (nextItem?.type === 'question') {
        const q = nextItem.data as Question;
        if (q.question_type === 'ordering') initOrderItems(q);
        if (q.question_type === 'matching') initMatchSelections(q);
        nextQuestion();
      }
    }
  }

  async function handleIntroSeen() {
    if (!isIntro || !currentItem) return;
    const intro = currentItem.data as IntroTopic;
    // Fire-and-forget
    fetch(`/api/user/topic-intro/${intro.topic_id}/seen`, { method: 'POST' }).catch(() => {});
    handleNext();
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
      sessionStorage.setItem('sessionId', sessionId || '');
      saveSessionForReview({
        ...data,
        sessionId: sessionId || '',
        courseSlug,
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
      setSelectedIds(prev => prev.includes(optionId) ? prev.filter(id => id !== optionId) : [...prev, optionId]);
    } else if (currentQuestion?.question_type === 'ordering') {
      setSelectedIds(prev => prev.includes(optionId) ? prev.filter(id => id !== optionId) : [...prev, optionId]);
    } else {
      setSelectedIds([optionId]);
    }
  }

  function handleOrderDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = orderItems.findIndex(i => i.id === active.id);
    const newIdx = orderItems.findIndex(i => i.id === over.id);
    const items = [...orderItems];
    const [moved] = items.splice(oldIdx, 1);
    items.splice(newIdx, 0, moved);
    setOrderItems(items);
  }

  function moveOrderItem(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= orderItems.length) return;
    const items = [...orderItems];
    [items[index], items[target]] = [items[target], items[index]];
    setOrderItems(items);
  }

  function getOptionState(optionId: string): 'default' | 'selected' | 'correct' | 'incorrect' {
    if (!answerResult) return selectedIds.includes(optionId) ? 'selected' : 'default';
    if (answerResult.correct_option_ids?.includes(optionId)) return 'correct';
    if (selectedIds.includes(optionId) && !answerResult.correct_option_ids?.includes(optionId)) return 'incorrect';
    return 'default';
  }

  const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];

  // Can submit?
  const canSubmit = (() => {
    if (!currentQuestion || answerResult) return false;
    if (currentQuestion.question_type === 'fill_blank') return fillBlankAnswer.trim().length > 0;
    if (currentQuestion.question_type === 'ordering') return orderItems.length > 0;
    if (currentQuestion.question_type === 'matching') return Object.values(matchSelections).every(v => v !== '');
    if (currentQuestion.question_type === 'ordering' && selectedIds.length !== currentQuestion.options.length) return false;
    return selectedIds.length > 0;
  })();

  // ─── Render States ─────────────────────────────────────────
  if (!sessionStarted) {
    const SESSION_OPTIONS = [5, 10, 15, 20];
    return (
      <div className="min-h-[100dvh] bg-[#FAFAF8] flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-6 animate-fade-up">
          <div className="text-center">
            <h1 className="text-lg font-bold text-[#2C2825]">
              {topicId ? 'Focused Practice' : 'Practice Session'}
            </h1>
            <p className="text-sm text-[#6B635A] mt-1">How many questions?</p>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {SESSION_OPTIONS.map(n => (
              <button
                key={n}
                onClick={() => setQuestionCount(n)}
                className={`py-3 rounded-xl text-sm font-bold transition-all ${
                  questionCount === n
                    ? 'bg-[#2C2825] text-[#F5F3EF] shadow-sm scale-105'
                    : 'bg-[#F5F3EF] text-[#6B635A] border border-[#E8E4DD] hover:border-[#D4CFC7]'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <button
            onClick={() => setSessionStarted(true)}
            className="w-full py-3.5 rounded-xl bg-[#2C2825] hover:bg-[#1A1816] text-[#F5F3EF] font-bold text-sm transition-colors"
          >
            Start Session
          </button>
          <button
            onClick={() => router.push(`/course/${courseSlug}/path`)}
            className="w-full text-sm text-[#A39B90] hover:text-[#6B635A] py-2 transition-colors"
          >
            Back to Course
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="animate-spin w-8 h-8 border-2 border-[#2C2825] border-t-transparent rounded-full mx-auto" />
          <p className="text-[#6B635A] text-sm">Generating your session...</p>
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
          <p className="text-[#6B635A] font-medium">{error}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => router.push('/home')} className="text-sm font-medium text-[#6B635A] px-4 py-2 rounded-xl border border-[#E8E4DD] hover:bg-[#F5F3EF]">Home</button>
            <button onClick={() => { setError(null); setLoading(true); loadSession(); }} className="text-sm font-medium text-[#F5F3EF] bg-[#2C2825] px-4 py-2 rounded-xl hover:bg-[#1A1816]">Try again</button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Topic Intro Screen ────────────────────────────────────
  if (isIntro && currentItem) {
    const intro = currentItem.data as IntroTopic;
    return (
      <div className="min-h-[100dvh] bg-[#FAFAF8]">
        <div className="max-w-lg mx-auto px-4 pb-8">
          <div className="py-4">
            <span className="text-xs font-medium text-[#2C2825] bg-[#F5F3EF] px-3 py-1 rounded-full border border-[#E8E4DD]">New Topic</span>
          </div>
          <h2 className="text-xl font-bold text-[#2C2825] mb-2">{intro.title}</h2>
          {intro.lesson_title && (
            <p className="text-sm text-[#6B635A] mb-4">{intro.lesson_title}</p>
          )}
          <div className="bg-[#F5F3EF] rounded-lg p-4 mb-8">
            <div className="prose prose-sm max-w-none [&_p]:text-sm [&_p]:text-[#6B635A]">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{intro.body_preview}</ReactMarkdown>
            </div>
          </div>
          <button onClick={handleIntroSeen} className="w-full py-3 rounded-xl bg-[#2C2825] text-[#F5F3EF] font-semibold hover:bg-[#1A1816] transition-colors">
            Got it, let&apos;s practice
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion && !inRequeue) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <p className="text-[#6B635A]">No questions available</p>
          <button onClick={() => router.push('/home')} className="text-[#2C2825] font-medium text-sm">Back to home</button>
        </div>
      </div>
    );
  }

  // In requeue mode, use wrongQueue
  const activeQuestion = inRequeue ? wrongQueue[requeueIndex] : currentQuestion;
  if (!activeQuestion) {
    handleCompleteSession();
    return null;
  }

  // ─── Requeue Recap Screen ────────────────────────────────
  if (inRequeue && showRequeueRecap) {
    const prevResult = wrongAnswerResults[activeQuestion.id];
    return (
      <div className="min-h-[100dvh] bg-[#FAFAF8]">
        <div className="max-w-lg mx-auto px-4 pb-8">
          <div className="py-4">
            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              Review before retry
            </span>
          </div>
          <h2 className="text-base font-bold text-[#2C2825] mb-3">{activeQuestion.question_text}</h2>
          {prevResult && (
            <div className="space-y-3 mb-6 animate-fade-up">
              <div className="rounded-xl bg-green-50 border border-green-200 p-4">
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Correct Answer</p>
                {activeQuestion.question_type === 'fill_blank' && prevResult.acceptable_answers ? (
                  <p className="text-sm text-green-800 font-medium">{prevResult.acceptable_answers[0]}</p>
                ) : (
                  <div className="space-y-1">
                    {(prevResult.correct_option_ids || []).map(id => {
                      const opt = activeQuestion.options.find(o => o.id === id);
                      return opt ? (
                        <p key={id} className="text-sm text-green-800 font-medium">{opt.text}</p>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
              <div className="rounded-xl bg-[#F5F3EF] border border-[#E8E4DD] p-4">
                <p className="text-xs font-semibold text-[#6B635A] uppercase tracking-wide mb-1">Explanation</p>
                <p className="text-sm text-[#6B635A] leading-relaxed">{prevResult.explanation}</p>
              </div>
            </div>
          )}
          <button
            onClick={() => {
              setShowRequeueRecap(false);
              const q = wrongQueue[requeueIndex];
              if (q?.question_type === 'ordering') initOrderItems(q);
              if (q?.question_type === 'matching') initMatchSelections(q);
            }}
            className="w-full py-3 rounded-xl bg-[#2C2825] text-[#F5F3EF] font-semibold hover:bg-[#1A1816] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const progressQuestionIdx = inRequeue
    ? queue.filter(i => i.type === 'question').length + requeueIndex
    : queue.slice(0, queueIndex + 1).filter(i => i.type === 'question').length - 1;
  const progressTotal = queue.filter(i => i.type === 'question').length + (inRequeue ? wrongQueue.length : 0);
  const progressPct = ((progressQuestionIdx + 1) / Math.max(progressTotal, 1)) * 100;

  return (
    <div className="min-h-[100dvh] bg-[#FAFAF8]">
      <div className="max-w-lg mx-auto px-4 pb-8">
        {/* Top bar */}
        <div className="flex items-center gap-3 py-4">
          <button onClick={() => setExitConfirm(true)} className="p-1 text-[#A39B90] hover:text-[#6B635A] transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex-1 h-2 bg-[#EBE8E2] rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
          </div>
          <span className="text-sm font-medium text-[#6B635A] font-mono min-w-[3rem] text-right">
            {progressQuestionIdx + 1}/{progressTotal}
          </span>
        </div>

        {/* Exit confirmation */}
        {exitConfirm && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4" onClick={() => setExitConfirm(false)}>
            <div className="w-full max-w-lg bg-white rounded-2xl border border-[#E8E4DD] p-6 space-y-4 animate-slide-up" onClick={e => e.stopPropagation()}>
              <h3 className="font-bold text-lg text-center text-[#2C2825]">Leave session?</h3>
              <p className="text-sm text-[#6B635A] text-center">Your progress in this session won&apos;t be saved.</p>
              <div className="flex gap-3">
                <button onClick={() => setExitConfirm(false)} className="flex-1 py-3 text-sm font-medium rounded-xl border border-[#E8E4DD] text-[#2C2825] hover:bg-[#F5F3EF]">Keep going</button>
                <button onClick={() => { resetSession(); router.push(`/course/${courseSlug}/path`); }} className="flex-1 py-3 text-sm font-medium rounded-xl bg-red-500 text-white hover:bg-red-600">Leave</button>
              </div>
            </div>
          </div>
        )}

        {/* Topic badge */}
        {activeQuestion.topic_title && (
          <div className="mb-4">
            <span className="text-xs font-medium text-[#2C2825] bg-[#F5F3EF] px-3 py-1 rounded-full border border-[#E8E4DD]">{activeQuestion.topic_title}</span>
          </div>
        )}

        {inRequeue && (
          <div className="mb-4">
            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">Review: missed</span>
          </div>
        )}

        {/* Question text */}
        <div className="mb-6">
          <p className="text-base font-medium text-[#2C2825] leading-relaxed">{activeQuestion.question_text}</p>
          {activeQuestion.question_type === 'multiple_select' && <p className="text-xs text-[#A39B90] mt-2">Select all that apply</p>}
          {activeQuestion.question_type === 'fill_blank' && <p className="text-xs text-[#A39B90] mt-2">Type your answer</p>}
          {activeQuestion.question_type === 'ordering' && <p className="text-xs text-[#A39B90] mt-2">Drag items into the correct order</p>}
          {activeQuestion.question_type === 'matching' && <p className="text-xs text-[#A39B90] mt-2">Match each item on the left with the correct item on the right</p>}
        </div>

        {/* ── Fill Blank Input ── */}
        {activeQuestion.question_type === 'fill_blank' && !answerResult && (
          <div className="mb-6">
            <input
              type="text"
              value={fillBlankAnswer}
              onChange={e => setFillBlankAnswer(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && canSubmit && handleSubmitAnswer()}
              placeholder="Type your answer..."
              className="w-full px-4 py-3 border border-[#E8E4DD] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2C2825]/20 focus:border-[#2C2825]"
              autoFocus
            />
          </div>
        )}
        {activeQuestion.question_type === 'fill_blank' && answerResult && (
          <div className="mb-6">
            <div className={`px-4 py-3 rounded-xl border-2 text-sm font-medium ${answerResult.is_correct ? 'border-green-400 bg-green-50 text-green-700' : 'border-red-400 bg-red-50 text-red-700'}`}>
              {fillBlankAnswer || '(empty)'}
            </div>
            {!answerResult.is_correct && answerResult.acceptable_answers && (
              <p className="text-xs text-[#6B635A] mt-2">Correct answer: <span className="font-semibold">{answerResult.acceptable_answers[0]}</span></p>
            )}
          </div>
        )}

        {/* ── Ordering (drag + arrows) ── */}
        {activeQuestion.question_type === 'ordering' && !answerResult && (
          <div className="mb-6">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleOrderDragEnd}>
              <SortableContext items={orderItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {orderItems.map((item, idx) => (
                    <div key={item.id} className="flex items-center gap-1">
                      <div className="flex-1">
                        <SortableOrderItem id={item.id} text={item.text} index={idx} />
                      </div>
                      <div className="flex flex-col">
                        <button onClick={() => moveOrderItem(idx, -1)} disabled={idx === 0} className="text-[#D4CFC7] hover:text-[#6B635A] disabled:opacity-30 text-xs px-1">▲</button>
                        <button onClick={() => moveOrderItem(idx, 1)} disabled={idx === orderItems.length - 1} className="text-[#D4CFC7] hover:text-[#6B635A] disabled:opacity-30 text-xs px-1">▼</button>
                      </div>
                    </div>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}
        {activeQuestion.question_type === 'ordering' && answerResult && (
          <div className="mb-6 space-y-2">
            {orderItems.map((item, idx) => {
              const isCorrectPosition = answerResult.correct_order && answerResult.correct_order[idx] === item.id;
              return (
                <div key={item.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 ${isCorrectPosition ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'}`}>
                  <span className="text-sm font-medium text-[#6B635A] w-5">{idx + 1}.</span>
                  <span className="text-sm text-[#2C2825] flex-1">{item.text}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Matching (dropdowns) ── */}
        {activeQuestion.question_type === 'matching' && activeQuestion.matching_items && !answerResult && (
          <div className="mb-6 space-y-3">
            {activeQuestion.matching_items.lefts.map(left => (
              <div key={left} className="flex items-center gap-3">
                <span className="text-sm font-medium text-[#2C2825] w-1/3 truncate">{left}</span>
                <select
                  value={matchSelections[left] || ''}
                  onChange={e => setMatchSelections(prev => ({ ...prev, [left]: e.target.value }))}
                  className="flex-1 text-sm border border-[#E8E4DD] rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#2C2825]/20 focus:border-[#2C2825]"
                >
                  <option value="">Select...</option>
                  {activeQuestion.matching_items!.rights.map(right => (
                    <option key={right} value={right}>{right}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
        {activeQuestion.question_type === 'matching' && answerResult && answerResult.matching_pairs && (
          <div className="mb-6 space-y-2">
            {Object.entries(matchSelections).map(([left, right]) => {
              const correctRight = answerResult.matching_pairs!.find(p => p.left === left)?.right;
              const isCorrectPair = right.toLowerCase() === correctRight?.toLowerCase();
              return (
                <div key={left} className={`flex items-center gap-3 p-3 rounded-xl border-2 ${isCorrectPair ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'}`}>
                  <span className="text-sm font-medium text-[#2C2825] w-1/3">{left}</span>
                  <span className="text-xs text-[#A39B90]">→</span>
                  <span className="text-sm text-[#6B635A] flex-1">{right}</span>
                  {!isCorrectPair && <span className="text-xs text-green-600">(correct: {correctRight})</span>}
                </div>
              );
            })}
          </div>
        )}

        {/* ── MC / MS / TF / legacy ordering options ── */}
        {['multiple_choice', 'multiple_select', 'true_false'].includes(activeQuestion.question_type) && (
          <div className="space-y-2.5 mb-6">
            {activeQuestion.options.map((option, idx) => {
              const state = getOptionState(option.id);
              let borderClass = 'border-[#E8E4DD] hover:border-[#D4CFC7]';
              let bgClass = 'bg-white';
              let textClass = 'text-[#2C2825]';
              if (state === 'selected') { borderClass = 'border-[#2C2825] shadow-sm'; bgClass = 'bg-[#F5F3EF]'; }
              else if (state === 'correct') { borderClass = 'border-green-400'; bgClass = 'bg-green-50'; }
              else if (state === 'incorrect') { borderClass = 'border-red-400'; bgClass = 'bg-red-50'; }
              if (answerResult && state === 'default') textClass = 'text-[#A39B90]';

              return (
                <button
                  key={option.id}
                  onClick={() => toggleOption(option.id)}
                  disabled={!!answerResult}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all ${borderClass} ${bgClass} disabled:cursor-default`}
                >
                  <span className="text-sm font-medium text-[#6B635A] flex-shrink-0">{optionLabels[idx]}.</span>
                  <span className={`text-sm text-left ${textClass}`}>{option.text}</span>
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
            className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wide uppercase transition-all duration-200 ${
              canSubmit
                ? 'bg-[#2C2825] text-[#F5F3EF] hover:bg-[#1A1816] shadow-sm transform hover:scale-[1.01]'
                : 'bg-[#EBE8E2] text-[#A39B90] cursor-not-allowed'
            }`}
          >
            {submitting ? 'Checking...' : 'Check'}
          </button>
        )}

        {/* Feedback panel */}
        {answerResult && (
          <div className={`rounded-2xl p-5 space-y-3 animate-slide-up ${answerResult.is_correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center justify-between">
              <h3 className={`font-bold text-lg ${answerResult.is_correct ? 'text-green-700' : 'text-red-700'}`}>
                {answerResult.is_correct ? 'Correct!' : 'Not quite'}
              </h3>
              {answerResult.is_correct && answerResult.xp_earned > 0 && (
                <span className="text-sm font-bold text-green-600 bg-green-100 px-2.5 py-1 rounded-full animate-bounce-in">
                  +{answerResult.xp_earned} XP
                </span>
              )}
            </div>

            {/* Per-option explanation (MC/MS/TF wrong answers) */}
            {!answerResult.is_correct && answerResult.option_explanation && (
              <div className="bg-red-100/50 rounded-lg p-3 text-sm text-red-800">
                <p className="font-medium mb-1">Why your answer is wrong:</p>
                <p>{answerResult.option_explanation}</p>
              </div>
            )}

            <div className="text-sm text-[#6B635A] leading-relaxed">
              <p>{answerResult.explanation}</p>
            </div>

            {/* Linked lesson content (context-on-failure) */}
            {!answerResult.is_correct && answerResult.linked_lesson && (
              <div>
                <button
                  onClick={() => setShowLinkedBlock(!showLinkedBlock)}
                  className="flex items-center gap-2 text-sm font-medium text-[#2C2825] hover:text-[#1A1816]"
                >
                  <span>Review this lesson</span>
                  <svg className={`w-4 h-4 transition-transform ${showLinkedBlock ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showLinkedBlock && (
                  <div className="mt-2 bg-white rounded-lg border border-[#E8E4DD] p-3">
                    {answerResult.linked_lesson.title && (
                      <h4 className="text-sm font-semibold text-[#2C2825] mb-2">{answerResult.linked_lesson.title}</h4>
                    )}
                    <div className="prose prose-sm max-w-none [&_p]:text-sm [&_p]:text-[#6B635A]">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{answerResult.linked_lesson.body.slice(0, 500)}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleNext}
              className={`w-full py-3 rounded-xl font-semibold transition-colors ${
                answerResult.is_correct
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-white border border-[#E8E4DD] text-[#2C2825] hover:bg-[#F5F3EF]'
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
          <div className="animate-spin w-8 h-8 border-2 border-[#2C2825] border-t-transparent rounded-full mx-auto" />
          <p className="text-[#6B635A] text-sm">Loading...</p>
        </div>
      </div>
    }>
      <PracticeContent />
    </Suspense>
  );
}
