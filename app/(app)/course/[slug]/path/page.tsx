'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TopicState = 'locked' | 'new' | 'learning' | 'review' | 'mastered'

interface TopicData {
  id: string;
  title: string;
  display_order: number;
  state: TopicState;
  total_questions: number;
  cards_seen: number;
  cards_due: number;
  lesson_count: number;
  best_quiz_score: number | null;
  has_read: boolean;
}

interface ModuleData {
  id: string;
  title: string;
  description: string | null;
  display_order: number;
  weight_percent: number;
  topics: TopicData[];
  best_test_score: number | null;
  assessment_id: string | null;
}

interface PrimaryCta {
  type: 'review' | 'continue' | 'start_new' | 'caught_up';
  topic_id: string | null;
  label: string;
  due_count: number | null;
}

interface PracticeExam {
  id: string;
  title: string;
  best_score: number | null;
  attempts_count: number;
}

interface PathResponse {
  course: { id: string; title: string; readiness_score: number };
  modules: ModuleData[];
  primary_cta: PrimaryCta;
  practice_exam: PracticeExam | null;
}

// ---------------------------------------------------------------------------
// State styling
// ---------------------------------------------------------------------------

const stateStyles: Record<TopicState, {
  bg: string; border: string; text: string; badge: string; dot: string;
}> = {
  locked: {
    bg: 'bg-gray-50 dark:bg-gray-800/40',
    border: 'border-gray-200 dark:border-gray-700',
    text: 'text-gray-400 dark:text-gray-500',
    badge: 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500',
    dot: 'bg-gray-300 dark:bg-gray-600',
  },
  new: {
    bg: 'bg-white dark:bg-gray-900',
    border: 'border-dashed border-gray-300 dark:border-gray-600',
    text: 'text-gray-600 dark:text-gray-300',
    badge: 'bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
    dot: 'bg-gray-400 dark:bg-gray-500',
  },
  learning: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-300 dark:border-blue-700',
    text: 'text-blue-700 dark:text-blue-300',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    dot: 'bg-blue-500',
  },
  review: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-300 dark:border-amber-700',
    text: 'text-amber-700 dark:text-amber-300',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  mastered: {
    bg: 'bg-green-50 dark:bg-green-950/30',
    border: 'border-green-300 dark:border-green-700',
    text: 'text-green-700 dark:text-green-300',
    badge: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
    dot: 'bg-green-500',
  },
};

const ctaColors: Record<PrimaryCta['type'], string> = {
  review: 'bg-amber-500 hover:bg-amber-600 text-white',
  continue: 'bg-blue-600 hover:bg-blue-700 text-white',
  start_new: 'bg-blue-600 hover:bg-blue-700 text-white',
  caught_up: 'bg-green-600 hover:bg-green-700 text-white',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function practiceUrl(slug: string, topicId: string, sessionType: string): string {
  return `/practice/${slug}?topic=${topicId}&session_type=${sessionType}`;
}

function guidebookUrl(slug: string, topicId: string): string {
  return `/course/${slug}/guidebook?topic=${topicId}&from=path`;
}

/** Determine where tapping a topic row should navigate */
function topicHref(slug: string, topic: TopicData): string {
  switch (topic.state) {
    case 'new':
      // Read-first: if not read yet, go to guidebook; if already read, go to practice
      return topic.has_read
        ? practiceUrl(slug, topic.id, 'learn')
        : guidebookUrl(slug, topic.id);
    case 'learning':
      return practiceUrl(slug, topic.id, 'learn');
    case 'review':
      return practiceUrl(slug, topic.id, 'review');
    case 'mastered':
      return practiceUrl(slug, topic.id, 'mixed');
    default:
      return '#';
  }
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <div className="space-y-5 animate-pulse pb-24">
      <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-xl w-2/3" />
      <div className="h-24 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
      {[1, 2, 3].map(i => (
        <div key={i} className="space-y-3">
          <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-lg w-1/2" />
          {[1, 2, 3].map(j => (
            <div key={j} className="h-16 bg-gray-200 dark:bg-gray-800 rounded-xl" />
          ))}
        </div>
      ))}
    </div>
  );
}

function TopicRow({
  topic,
  moduleIndex,
  topicIndex,
  isLast,
  slug,
  onLockedTap,
}: {
  topic: TopicData;
  moduleIndex: number;
  topicIndex: number;
  isLast: boolean;
  slug: string;
  onLockedTap: (title: string) => void;
}) {
  const style = stateStyles[topic.state];
  const number = `${moduleIndex + 1}.${topicIndex + 1}`;
  const isLocked = topic.state === 'locked';

  function handleTap() {
    if (isLocked) {
      onLockedTap(topic.title);
    }
    // Navigation handled by Link wrapper for non-locked
  }

  const content = (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${style.bg} ${style.border} transition-all ${
      isLocked ? 'opacity-60 cursor-default' : 'hover:shadow-sm cursor-pointer'
    }`}>
      {/* Number circle */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${style.dot} ${
        topic.state === 'locked' ? 'text-white/70' : 'text-white'
      }`}>
        {number}
      </div>

      {/* Title + subtitle */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${
          isLocked ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'
        }`}>
          {topic.title}
        </p>
        <p className={`text-xs mt-0.5 ${style.text}`}>
          {topic.state === 'locked' && 'Locked'}
          {topic.state === 'new' && `${topic.total_questions} question${topic.total_questions === 1 ? '' : 's'}`}
          {topic.state === 'learning' && `${topic.cards_seen}/${topic.total_questions} cards seen`}
          {topic.state === 'review' && `${topic.cards_due} due`}
          {topic.state === 'mastered' && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Mastered
            </span>
          )}
        </p>
      </div>

      {/* Right badges */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Quiz score */}
        {topic.best_quiz_score !== null && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${style.badge} flex items-center gap-1`}>
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
            </svg>
            {topic.best_quiz_score}%
          </span>
        )}

        {/* State-specific badge */}
        {topic.state === 'review' && topic.cards_due > 0 && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">
            {topic.cards_due}
          </span>
        )}

        {/* Arrow for non-locked */}
        {!isLocked && (
          <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        )}
      </div>
    </div>
  );

  if (isLocked) {
    return (
      <div className="relative">
        <div onClick={handleTap}>{content}</div>
        {/* Connecting line */}
        {!isLast && (
          <div className="absolute left-[1.4rem] top-full w-0.5 h-2 bg-gray-200 dark:bg-gray-700" />
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <Link href={topicHref(slug, topic)}>
        {content}
      </Link>
      {/* Connecting line */}
      {!isLast && (
        <div className="absolute left-[1.4rem] top-full w-0.5 h-2 bg-gray-200 dark:bg-gray-700" />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main content
// ---------------------------------------------------------------------------

function CoursePathContent() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [data, setData] = useState<PathResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPath() {
      try {
        const res = await fetch(`/api/courses/${slug}/path`);
        if (res.status === 403) {
          router.replace(`/course/${slug}/enroll`);
          return;
        }
        if (!res.ok) throw new Error('Failed to fetch');
        setData(await res.json());
      } catch {
        setError('Something went wrong');
      }
      setLoading(false);
    }
    fetchPath();
  }, [slug, router]);

  function showLockedToast(title: string) {
    setToast(`Complete the previous topic first`);
    setTimeout(() => setToast(null), 2500);
  }

  if (loading) return <LoadingSkeleton />;

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400 mb-4">{error || 'Path not found'}</p>
        <button
          onClick={() => router.push('/home')}
          className="text-gray-900 dark:text-gray-100 font-medium text-sm"
        >
          Back to home
        </button>
      </div>
    );
  }

  const readinessPct = Math.round((data.course.readiness_score || 0) * 100);
  const totalDue = data.modules
    .flatMap(m => m.topics)
    .reduce((s, t) => s + t.cards_due, 0);

  return (
    <div className="pb-28 space-y-5">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/home')}
          className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex-1 truncate">
          {data.course.title}
        </h1>
      </div>

      {/* ── Readiness hero ─────────────────────────────────────── */}
      <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Readiness</h2>
          <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">{readinessPct}%</span>
        </div>
        <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-700"
            style={{ width: `${readinessPct}%` }}
          />
        </div>
        {totalDue > 0 && (
          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
            {totalDue} card{totalDue !== 1 ? 's' : ''} due for review
          </p>
        )}

        {/* Practice exam button */}
        {data.practice_exam && (
          <Link
            href={`/course/${slug}/assessment/${data.practice_exam.id}`}
            className="mt-3 flex items-center justify-between w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
          >
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {data.practice_exam.title}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {data.practice_exam.best_score !== null
                ? `Best: ${data.practice_exam.best_score}%`
                : `${data.practice_exam.attempts_count} attempts`}
            </span>
          </Link>
        )}

        {/* Quick links */}
        <div className="flex gap-3 mt-3">
          <Link
            href={`/practice/${slug}`}
            className="flex-1 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900 font-semibold py-3 rounded-xl text-center text-sm transition-colors"
          >
            Quick Practice
          </Link>
          <Link
            href={`/course/${slug}/guidebook${data.modules[0]?.topics[0]?.id ? `?topic=${data.modules[0].topics[0].id}` : ''}`}
            className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
          >
            Guidebook
          </Link>
        </div>
      </div>

      {/* ── Modules + Topics ───────────────────────────────────── */}
      {data.modules.map((mod, modIdx) => (
        <div key={mod.id} className="animate-fade-up" style={{ animationDelay: `${(modIdx + 1) * 60}ms` }}>
          {/* Module header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {mod.title}
              </h3>
              {mod.weight_percent > 0 && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  {mod.weight_percent}%
                </span>
              )}
            </div>
            {/* Module test indicator */}
            {mod.assessment_id && (
              <Link
                href={`/course/${slug}/assessment/${mod.assessment_id}`}
                className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {mod.best_test_score !== null ? `${mod.best_test_score}%` : 'Test'}
              </Link>
            )}
          </div>

          {/* Topic rows */}
          <div className="space-y-2">
            {mod.topics.map((topic, topicIdx) => (
              <TopicRow
                key={topic.id}
                topic={topic}
                moduleIndex={modIdx}
                topicIndex={topicIdx}
                isLast={topicIdx === mod.topics.length - 1}
                slug={slug}
                onLockedTap={showLockedToast}
              />
            ))}
          </div>
        </div>
      ))}

      {/* ── Sticky CTA ─────────────────────────────────────────── */}
      <div className="fixed bottom-20 left-0 right-0 px-4 pb-4 z-40">
        <div className="max-w-lg mx-auto">
          {data.primary_cta.type === 'caught_up' ? (
            <div className={`w-full py-3.5 rounded-xl text-center text-sm font-semibold shadow-lg ${ctaColors[data.primary_cta.type]}`}>
              {data.primary_cta.label}
            </div>
          ) : (
            <Link
              href={
                data.primary_cta.topic_id
                  ? (() => {
                      if (data.primary_cta.type === 'review') return practiceUrl(slug, data.primary_cta.topic_id!, 'review')
                      if (data.primary_cta.type === 'continue') return practiceUrl(slug, data.primary_cta.topic_id!, 'learn')
                      // start_new: check has_read on the topic
                      const topic = data.modules.flatMap(m => m.topics).find(t => t.id === data.primary_cta.topic_id)
                      if (topic && !topic.has_read) return guidebookUrl(slug, data.primary_cta.topic_id!)
                      return practiceUrl(slug, data.primary_cta.topic_id!, 'learn')
                    })()
                  : `/practice/${slug}`
              }
              className={`block w-full py-3.5 rounded-xl text-center text-sm font-semibold shadow-lg transition-colors ${ctaColors[data.primary_cta.type]}`}
            >
              {data.primary_cta.label}
            </Link>
          )}
        </div>
      </div>

      {/* ── Toast ──────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium shadow-lg animate-fade-up">
          {toast}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page export
// ---------------------------------------------------------------------------

export default function CoursePathPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[100dvh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-gray-900 dark:border-gray-100 border-t-transparent rounded-full" />
      </div>
    }>
      <CoursePathContent />
    </Suspense>
  );
}
