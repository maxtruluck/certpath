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
  items_completed: number;
  items_total: number;
}

interface TestData {
  id: string;
  title: string;
  question_count: number;
  time_limit_minutes: number | null;
  passing_score: number;
  best_score: number | null;
  passed: boolean;
  attempts_count: number;
}

interface ModuleData {
  id: string;
  title: string;
  description: string | null;
  display_order: number;
  lessons: LessonData[];
}

interface PathResponse {
  course: { id: string; title: string };
  modules: ModuleData[];
  course_tests?: TestData[];
  primary_cta?: { type: string; lesson_id: string | null; label: string };
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
        return 'Start';
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
      <Link href={`/lesson/${slug}/${lesson.id}`}>
        {content}
      </Link>
      {!isLast && (
        <div className="absolute left-[1.4rem] top-full w-0.5 h-2 bg-[#E8E4DD]" />
      )}
    </div>
  );
}

function TestRow({
  test,
  slug,
  allLessonsCompleted,
}: {
  test: TestData;
  slug: string;
  allLessonsCompleted: boolean;
}) {
  // Module quizzes lock until all module lessons completed
  // Practice exams are always unlocked
  // Final assessments lock until all module quizzes passed
  const isLocked = !allLessonsCompleted;
  const hasPassed = test.passed;

  const subtitle = test.time_limit_minutes ? `${test.time_limit_minutes} min` : 'Untimed';

  const content = (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
      isLocked
        ? 'bg-[#F5F3EF] border-dashed border-[#D4CFC7] opacity-60 cursor-default'
        : hasPassed
          ? 'bg-green-50 border-green-300 hover:shadow-sm cursor-pointer'
          : 'bg-white border-[#E8E4DD] hover:shadow-sm cursor-pointer'
    }`}>
      {/* Icon */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
        isLocked ? 'bg-[#D4CFC7]' : hasPassed ? 'bg-green-500' : 'bg-[#6B635A]'
      }`}>
        {hasPassed ? (
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
          </svg>
        )}
      </div>

      {/* Title + subtitle */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${isLocked ? 'text-[#A39B90]' : 'text-[#2C2825]'}`}>
          {test.title}
        </p>
        <p className={`text-xs mt-0.5 ${isLocked ? 'text-[#A39B90]' : 'text-[#6B635A]'}`}>
          {isLocked ? 'Complete lessons first' : subtitle}
        </p>
      </div>

      {/* Score badge + arrow */}
      <div className="flex items-center gap-2 shrink-0">
        {test.best_score !== null && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            hasPassed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {test.best_score}%
          </span>
        )}
        {test.attempts_count > 0 && (
          <span className="text-xs text-[#A39B90]">
            {test.attempts_count} attempt{test.attempts_count !== 1 ? 's' : ''}
          </span>
        )}
        {!isLocked && (
          <svg className="w-4 h-4 text-[#A39B90]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        )}
      </div>
    </div>
  );

  if (isLocked) return <div>{content}</div>;

  return (
    <Link href={`/test/${slug}/${test.id}`}>
      {content}
    </Link>
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
    <div className="pb-8 space-y-5">
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
            </div>
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

      {/* -- Course-level tests ------------------------------------------ */}
      {data.course_tests && data.course_tests.length > 0 && (
        <div className="animate-fade-up" style={{ animationDelay: `${(data.modules.length + 1) * 60}ms` }}>
          <h3 className="text-sm font-bold text-[#2C2825] mb-3">Practice & Assessment</h3>
          <div className="space-y-2">
            {data.course_tests.map(test => (
              <TestRow
                key={test.id}
                test={test}
                slug={slug}
                allLessonsCompleted={progressPct === 100}
              />
            ))}
          </div>
        </div>
      )}

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
