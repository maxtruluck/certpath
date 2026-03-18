'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LessonState = 'locked' | 'available' | 'in_progress' | 'completed'

interface LessonData {
  id: string;
  title: string;
  display_order: number;
  state: LessonState;
  question_count: number;
  word_count: number;
  items_completed: number;
  items_total: number;
}

interface ModuleData {
  id: string;
  title: string;
  description: string | null;
  display_order: number;
  weight_percent: number;
  lessons: LessonData[];
  best_test_score: number | null;
  assessment_id: string | null;
}

interface PrimaryCta {
  type: 'continue' | 'start' | 'caught_up';
  lesson_id: string | null;
  label: string;
}

interface PracticeExam {
  id: string;
  title: string;
  best_score: number | null;
  attempts_count: number;
}

interface PathResponse {
  course: { id: string; title: string };
  modules: ModuleData[];
  primary_cta: PrimaryCta;
  practice_exam: PracticeExam | null;
  progress: { completed: number; total: number };
}

// ---------------------------------------------------------------------------
// State styling
// ---------------------------------------------------------------------------

const stateStyles: Record<LessonState, {
  bg: string; border: string; text: string; badge: string; dot: string;
}> = {
  locked: {
    bg: 'bg-[#F5F3EF]',
    border: 'border-dashed border-[#D4CFC7]',
    text: 'text-[#A39B90]',
    badge: 'bg-[#EBE8E2] text-[#A39B90]',
    dot: 'bg-[#D4CFC7]',
  },
  available: {
    bg: 'bg-white',
    border: 'border-[#E8E4DD]',
    text: 'text-[#6B635A]',
    badge: 'bg-[#F5F3EF] text-[#6B635A]',
    dot: 'bg-[#6B635A]',
  },
  in_progress: {
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    text: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-700',
    dot: 'bg-blue-500',
  },
  completed: {
    bg: 'bg-green-50',
    border: 'border-green-300',
    text: 'text-green-700',
    badge: 'bg-green-100 text-green-700',
    dot: 'bg-green-500',
  },
};

const ctaColors: Record<PrimaryCta['type'], string> = {
  continue: 'bg-blue-600 hover:bg-blue-700 text-white',
  start: 'bg-green-600 hover:bg-green-700 text-white',
  caught_up: 'bg-[#6B635A] text-white',
};

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <div className="space-y-5 animate-pulse pb-24">
      <div className="h-10 bg-[#EBE8E2] rounded-xl w-2/3" />
      <div className="h-24 bg-[#EBE8E2] rounded-2xl" />
      {[1, 2, 3].map(i => (
        <div key={i} className="space-y-3">
          <div className="h-6 bg-[#EBE8E2] rounded-lg w-1/2" />
          {[1, 2, 3].map(j => (
            <div key={j} className="h-16 bg-[#EBE8E2] rounded-xl" />
          ))}
        </div>
      ))}
    </div>
  );
}

function LessonRow({
  lesson,
  moduleIndex,
  lessonIndex,
  isLast,
  slug,
  onLockedTap,
}: {
  lesson: LessonData;
  moduleIndex: number;
  lessonIndex: number;
  isLast: boolean;
  slug: string;
  onLockedTap: (title: string) => void;
}) {
  const style = stateStyles[lesson.state];
  const number = `${moduleIndex + 1}.${lessonIndex + 1}`;
  const isLocked = lesson.state === 'locked';

  function handleTap() {
    if (isLocked) {
      onLockedTap(lesson.title);
    }
  }

  const subtitle = (() => {
    switch (lesson.state) {
      case 'locked':
        return 'Locked';
      case 'available':
        return lesson.word_count > 0
          ? `${lesson.word_count.toLocaleString()} words`
          : lesson.question_count > 0
            ? `${lesson.question_count} question${lesson.question_count === 1 ? '' : 's'}`
            : 'Start';
      case 'in_progress':
        return lesson.items_total > 0
          ? `${lesson.items_completed}/${lesson.items_total} complete`
          : 'In progress';
      case 'completed':
        return null; // Rendered as icon
    }
  })();

  const content = (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${style.bg} ${style.border} transition-all ${
      isLocked ? 'opacity-60 cursor-default' : 'hover:shadow-sm cursor-pointer'
    }`}>
      {/* Number circle */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${style.dot} ${
        lesson.state === 'locked' ? 'text-white/70' : 'text-white'
      }`}>
        {lesson.state === 'completed' ? (
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        ) : number}
      </div>

      {/* Title + subtitle */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${
          isLocked ? 'text-[#A39B90]' : 'text-[#2C2825]'
        }`}>
          {lesson.title}
        </p>
        {subtitle && (
          <p className={`text-xs mt-0.5 ${style.text}`}>
            {subtitle}
          </p>
        )}
        {lesson.state === 'completed' && (
          <p className={`text-xs mt-0.5 ${style.text} flex items-center gap-1`}>
            Complete
          </p>
        )}
      </div>

      {/* Right badges */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Progress indicator for in_progress */}
        {lesson.state === 'in_progress' && lesson.items_total > 0 && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-500 text-white">
            {Math.round((lesson.items_completed / lesson.items_total) * 100)}%
          </span>
        )}

        {/* Arrow for non-locked */}
        {!isLocked && (
          <svg className="w-4 h-4 text-[#A39B90]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
        {!isLast && (
          <div className="absolute left-[1.4rem] top-full w-0.5 h-2 bg-[#E8E4DD]" />
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <Link href={`/practice/${slug}?lesson=${lesson.id}`}>
        {content}
      </Link>
      {!isLast && (
        <div className="absolute left-[1.4rem] top-full w-0.5 h-2 bg-[#E8E4DD]" />
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

  function showLockedToast() {
    setToast('Complete the previous lesson first');
    setTimeout(() => setToast(null), 2500);
  }

  if (loading) return <LoadingSkeleton />;

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-[#6B635A] mb-4">{error || 'Path not found'}</p>
        <button
          onClick={() => router.push('/home')}
          className="text-[#2C2825] font-medium text-sm"
        >
          Back to home
        </button>
      </div>
    );
  }

  const progressPct = data.progress.total > 0
    ? Math.round((data.progress.completed / data.progress.total) * 100)
    : 0;

  return (
    <div className="pb-28 space-y-5">
      {/* -- Header --------------------------------------------------- */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/home')}
          className="text-[#A39B90] hover:text-[#6B635A]"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-[#2C2825] flex-1 truncate">
          {data.course.title}
        </h1>
      </div>

      {/* -- Progress hero ---------------------------------------------- */}
      <div className="rounded-2xl bg-white border border-[#E8E4DD] p-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-[#6B635A]">Progress</h2>
          <span className="text-sm font-medium text-[#2C2825]">
            {data.progress.completed} of {data.progress.total} lessons completed
          </span>
        </div>
        <div className="w-full h-3 bg-[#EBE8E2] rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Practice exam button */}
        {data.practice_exam && (
          <Link
            href={`/course/${slug}/assessment/${data.practice_exam.id}`}
            className="mt-3 flex items-center justify-between w-full px-4 py-3 rounded-xl bg-[#F5F3EF] border border-[#E8E4DD] text-sm hover:bg-[#EBE8E2] transition-colors"
          >
            <span className="font-medium text-[#2C2825]">
              {data.practice_exam.title}
            </span>
            <span className="text-xs text-[#6B635A]">
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
            className="flex-1 bg-[#2C2825] hover:bg-[#1A1816] text-[#F5F3EF] font-semibold py-3 rounded-xl text-center text-sm transition-colors"
          >
            Quick Practice
          </Link>
          <Link
            href={`/course/${slug}/guidebook${data.modules[0]?.lessons[0]?.id ? `?lesson=${data.modules[0].lessons[0].id}` : ''}`}
            className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-[#F5F3EF] border border-[#E8E4DD] text-sm font-medium text-[#6B635A] hover:bg-[#EBE8E2] transition-colors"
          >
            Guidebook
          </Link>
        </div>
      </div>

      {/* -- Modules + Lessons ----------------------------------------- */}
      {data.modules.map((mod, modIdx) => (
        <div key={mod.id} className="animate-fade-up" style={{ animationDelay: `${(modIdx + 1) * 60}ms` }}>
          {/* Module header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#2C2825]">
                {mod.title}
              </h3>
              {mod.weight_percent > 0 && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#F5F3EF] text-[#6B635A]">
                  {mod.weight_percent}%
                </span>
              )}
            </div>
            {/* Module test indicator */}
            {mod.assessment_id && (
              <Link
                href={`/course/${slug}/assessment/${mod.assessment_id}`}
                className="flex items-center gap-1 text-xs text-[#6B635A] hover:text-[#2C2825]"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {mod.best_test_score !== null ? `${mod.best_test_score}%` : 'Test'}
              </Link>
            )}
          </div>

          {/* Lesson rows */}
          <div className="space-y-2">
            {mod.lessons.map((lesson, lessonIdx) => (
              <LessonRow
                key={lesson.id}
                lesson={lesson}
                moduleIndex={modIdx}
                lessonIndex={lessonIdx}
                isLast={lessonIdx === mod.lessons.length - 1}
                slug={slug}
                onLockedTap={showLockedToast}
              />
            ))}
          </div>
        </div>
      ))}

      {/* -- Sticky CTA ------------------------------------------------ */}
      <div className="fixed bottom-20 left-0 right-0 px-4 pb-4 z-40">
        <div className="max-w-lg mx-auto">
          {data.primary_cta.type === 'caught_up' ? (
            <div className={`w-full py-3.5 rounded-xl text-center text-sm font-semibold shadow-lg ${ctaColors[data.primary_cta.type]}`}>
              {data.primary_cta.label}
            </div>
          ) : (
            <Link
              href={
                data.primary_cta.lesson_id
                  ? `/practice/${slug}?lesson=${data.primary_cta.lesson_id}`
                  : `/practice/${slug}`
              }
              className={`block w-full py-3.5 rounded-xl text-center text-sm font-semibold shadow-lg transition-colors ${ctaColors[data.primary_cta.type]}`}
            >
              {data.primary_cta.label}
            </Link>
          )}
        </div>
      </div>

      {/* -- Toast ----------------------------------------------------- */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-[#2C2825] text-white text-sm font-medium shadow-lg animate-fade-up">
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
        <div className="animate-spin w-8 h-8 border-2 border-[#2C2825] border-t-transparent rounded-full" />
      </div>
    }>
      <CoursePathContent />
    </Suspense>
  );
}
