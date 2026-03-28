'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
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
  course: { id: string; title: string; creator_id?: string };
  modules: ModuleData[];
  course_tests?: TestData[];
  primary_cta?: { type: string; lesson_id: string | null; label: string };
  progress: { completed: number; total: number };
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function LessonRow({
  lesson,
  moduleIndex,
  lessonIndex,
  slug,
}: {
  lesson: LessonData;
  moduleIndex: number;
  lessonIndex: number;
  slug: string;
}) {
  const isLocked = lesson.state === 'locked';
  const isCompleted = lesson.state === 'completed';
  const isActive = lesson.state === 'in_progress' || lesson.state === 'available';
  const isInProgress = lesson.state === 'in_progress';

  const progressPct = isInProgress && lesson.items_total > 0
    ? Math.round((lesson.items_completed / lesson.items_total) * 100)
    : 0;

  const statusText = isCompleted ? 'Complete' :
    isInProgress && lesson.items_total > 0 ? `${lesson.items_completed}/${lesson.items_total} complete` :
    isLocked ? 'Locked' : '';

  const statusColor = isCompleted ? '#1D9E75' :
    isInProgress ? '#378ADD' :
    '#ccc';

  const content = (
    <div
      className="flex items-center gap-3"
      style={{
        padding: '12px 20px',
        backgroundColor: isInProgress ? '#fafafa' : 'transparent',
        cursor: isLocked ? 'default' : 'pointer',
      }}
    >
      {/* Circle */}
      <div
        style={{
          width: 36, height: 36, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 600,
          backgroundColor: isCompleted ? '#1D9E75' : isInProgress ? '#E6F1FB' : isLocked ? '#f0f0f0' : '#E6F1FB',
          color: isCompleted ? '#fff' : isInProgress ? '#185FA5' : isLocked ? '#ccc' : '#185FA5',
          border: isInProgress ? '2px solid #378ADD' : 'none',
          flexShrink: 0,
        }}
      >
        {isCompleted ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        ) : (
          `${moduleIndex + 1}.${lessonIndex + 1}`
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 14, fontWeight: 500,
          color: isLocked ? '#ccc' : '#1a1a1a',
        }} className="truncate">
          {lesson.title}
        </p>
        {statusText && (
          <p style={{ fontSize: 12, color: statusColor, marginTop: 2 }}>
            {statusText}
          </p>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
        {/* Progress badge for in_progress */}
        {isInProgress && lesson.items_total > 0 && (
          <span style={{
            fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 4,
            backgroundColor: '#E6F1FB', color: '#185FA5',
          }}>
            {progressPct}%
          </span>
        )}
        {/* Arrow for non-locked */}
        {!isLocked && (
          <span style={{ fontSize: 14, color: '#ccc' }}>&rsaquo;</span>
        )}
      </div>
    </div>
  );

  if (isLocked) return <div>{content}</div>;

  return (
    <Link href={`/lesson/${slug}/${lesson.id}`} className="block hover:bg-[#fafafa]">
      {content}
    </Link>
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
  const isLocked = !allLessonsCompleted;
  const subtitle = test.time_limit_minutes
    ? `${test.question_count} questions · ${test.time_limit_minutes} min`
    : `${test.question_count} questions · Untimed`;

  const content = (
    <div
      className="flex items-center gap-3"
      style={{
        margin: '4px 16px',
        padding: '12px 20px',
        border: '1px solid #e5e5e5',
        borderRadius: 10,
        opacity: isLocked ? 0.5 : 1,
        cursor: isLocked ? 'default' : 'pointer',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 36, height: 36, borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: '#FEF3CD', color: '#856404',
          fontSize: 16, fontWeight: 700, flexShrink: 0,
        }}
      >
        ?
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a' }} className="truncate">
          {test.title}
        </p>
        <p style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
          {isLocked ? 'Complete all lessons first' : subtitle}
        </p>
      </div>

      {/* Arrow */}
      {!isLocked && (
        <span style={{ fontSize: 14, color: '#ccc', flexShrink: 0 }}>&rsaquo;</span>
      )}
    </div>
  );

  if (isLocked) return <div>{content}</div>;

  return (
    <Link href={`/test/${slug}/${test.id}`} className="block hover:border-[#ccc]">
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
  const searchParamsHook = useSearchParams();
  const slug = params.slug as string;
  const isPreview = searchParamsHook.get('preview') === 'true';
  const [data, setData] = useState<PathResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPath() {
      try {
        const url = `/api/courses/${slug}/path${isPreview ? '?preview=true' : ''}`;
        const res = await fetch(url);
        if (res.status === 403) {
          router.replace(`/course/${slug}`);
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
  }, [slug, router, isPreview]);

  if (loading) {
    return (
      <div className="space-y-5 animate-pulse pb-24">
        <div className="h-10 bg-gray-100 rounded-xl w-2/3" />
        <div className="h-24 bg-gray-100 rounded-xl" />
        {[1, 2, 3].map(i => (
          <div key={i} className="space-y-3">
            <div className="h-6 bg-gray-100 rounded-lg w-1/2" />
            <div className="h-16 bg-gray-100 rounded-xl" />
            <div className="h-16 bg-gray-100 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p style={{ color: '#999', marginBottom: 16 }}>{error || 'Path not found'}</p>
        <button onClick={() => router.push('/home')} style={{ fontSize: 13, color: '#1a1a1a', fontWeight: 500 }}>
          Back to home
        </button>
      </div>
    );
  }

  const progressPct = data.progress.total > 0
    ? Math.round((data.progress.completed / data.progress.total) * 100)
    : 0;

  return (
    <div className="pb-8">
      {/* Preview banner */}
      {isPreview && (
        <div style={{
          backgroundColor: '#FEF3CD', color: '#856404', fontSize: 12,
          textAlign: 'center', padding: '8px 0', marginBottom: 16,
        }}>
          Preview mode — this course is not yet published
        </div>
      )}

      {/* Header */}
      <div style={{ backgroundColor: '#fafafa', padding: '16px 20px', borderBottom: '1px solid #eee', margin: '-16px -16px 0' }}>
        <Link
          href={`/course/${slug}`}
          style={{ fontSize: 13, color: '#888', marginBottom: 8, display: 'inline-block' }}
          className="hover:text-[#555]"
        >
          &larr; Back
        </Link>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a', marginBottom: 4 }}>
          {data.course.title}
        </h1>
        <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: '#999' }}>Progress</span>
          <span style={{ fontSize: 12, color: '#999' }}>
            {data.progress.completed} of {data.progress.total} lessons completed
          </span>
        </div>
        <div style={{ height: 4, backgroundColor: '#eee', borderRadius: 2 }}>
          <div style={{ height: '100%', width: `${progressPct}%`, backgroundColor: '#1D9E75', borderRadius: 2, transition: 'width 0.5s' }} />
        </div>
      </div>

      {/* Modules + Lessons */}
      {data.modules.map((mod, modIdx) => (
        <div key={mod.id}>
          {/* Module title */}
          <div style={{ padding: '16px 20px 8px 20px' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{mod.title}</h3>
          </div>

          {/* Lesson rows */}
          {mod.lessons.map((lesson, lessonIdx) => (
            <LessonRow
              key={lesson.id}
              lesson={isPreview ? { ...lesson, state: lesson.state === 'locked' ? 'available' : lesson.state } : lesson}
              moduleIndex={modIdx}
              lessonIndex={lessonIdx}
              slug={slug}
            />
          ))}
        </div>
      ))}

      {/* Course-level tests */}
      {data.course_tests && data.course_tests.length > 0 && (
        <div style={{ marginTop: 16 }}>
          {data.course_tests.map(test => (
            <TestRow
              key={test.id}
              test={test}
              slug={slug}
              allLessonsCompleted={isPreview || progressPct === 100}
            />
          ))}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
          zIndex: 50, padding: '8px 16px', borderRadius: 8,
          backgroundColor: '#1a1a1a', color: '#fff', fontSize: 14, fontWeight: 500,
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}

export default function CoursePathPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[100dvh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#1a1a1a] border-t-transparent rounded-full" />
      </div>
    }>
      <CoursePathContent />
    </Suspense>
  );
}
