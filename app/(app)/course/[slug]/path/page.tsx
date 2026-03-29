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
  primary_cta?: { type: string; lesson_id: string | null; label: string };
  progress: { completed: number; total: number };
}

// ---------------------------------------------------------------------------
// "Get the App" page for learners
// ---------------------------------------------------------------------------

function GetTheAppView({ slug }: { slug: string }) {
  return (
    <div className="flex flex-col items-center justify-center" style={{ minHeight: '60vh', textAlign: 'center', padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
        </svg>
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>
        Continue learning in the app
      </h1>
      <p style={{ fontSize: 14, color: '#888', marginBottom: 24, maxWidth: 320, lineHeight: 1.5 }}>
        Open this course in the openED app to access interactive lessons and track your progress.
      </p>
      <div className="flex flex-col gap-3 w-full" style={{ maxWidth: 280 }}>
        <a
          href={`opened://course/${slug}`}
          style={{
            display: 'block', backgroundColor: '#1a1a1a', color: '#fff',
            fontSize: 14, fontWeight: 600, textAlign: 'center',
            padding: '12px 0', borderRadius: 10,
          }}
        >
          Open in App
        </a>
        <a
          href="https://apps.apple.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'block', backgroundColor: '#fff', color: '#1a1a1a',
            fontSize: 14, fontWeight: 600, textAlign: 'center',
            padding: '12px 0', borderRadius: 10,
            border: '1px solid #e5e5e5',
          }}
        >
          Download on the App Store
        </a>
      </div>
      <Link
        href={`/course/${slug}`}
        style={{ fontSize: 12, color: '#3b82f6', textDecoration: 'underline', marginTop: 16 }}
      >
        View course details
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Creator preview (kept for course review functionality)
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
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 500, color: isLocked ? '#ccc' : '#1a1a1a' }} className="truncate">
          {lesson.title}
        </p>
        {statusText && (
          <p style={{ fontSize: 12, color: statusColor, marginTop: 2 }}>{statusText}</p>
        )}
      </div>
      <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
        {isInProgress && lesson.items_total > 0 && (
          <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 4, backgroundColor: '#E6F1FB', color: '#185FA5' }}>
            {progressPct}%
          </span>
        )}
        {!isLocked && <span style={{ fontSize: 14, color: '#ccc' }}>&rsaquo;</span>}
      </div>
    </div>
  );

  if (isLocked) return <div>{content}</div>;

  return (
    <Link href={`/lesson/${slug}/${lesson.id}?preview=true`} className="block hover:bg-[#fafafa]">
      {content}
    </Link>
  );
}

function CreatorPreviewContent({ slug }: { slug: string }) {
  const router = useRouter();
  const [data, setData] = useState<PathResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPath() {
      try {
        const res = await fetch(`/api/courses/${slug}/path?preview=true`);
        if (res.status === 403) { router.replace(`/course/${slug}`); return; }
        if (!res.ok) throw new Error('Failed to fetch');
        setData(await res.json());
      } catch {
        setError('Something went wrong');
      }
      setLoading(false);
    }
    fetchPath();
  }, [slug, router]);

  if (loading) {
    return (
      <div className="space-y-5 animate-pulse pb-24">
        <div className="h-10 bg-gray-100 rounded-xl w-2/3" />
        <div className="h-24 bg-gray-100 rounded-xl" />
        {[1, 2, 3].map(i => (
          <div key={i} className="space-y-3">
            <div className="h-6 bg-gray-100 rounded-lg w-1/2" />
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
        <button onClick={() => router.push('/home')} style={{ fontSize: 13, color: '#1a1a1a', fontWeight: 500 }}>Back to home</button>
      </div>
    );
  }

  const progressPct = data.progress.total > 0
    ? Math.round((data.progress.completed / data.progress.total) * 100)
    : 0;

  return (
    <div className="pb-8">
      <div style={{ backgroundColor: '#FEF3CD', color: '#856404', fontSize: 12, textAlign: 'center', padding: '8px 0', marginBottom: 16 }}>
        Preview mode -- this course is not yet published
      </div>
      <div style={{ backgroundColor: '#fafafa', padding: '16px 20px', borderBottom: '1px solid #eee', margin: '-16px -16px 0' }}>
        <Link href={`/course/${slug}`} style={{ fontSize: 13, color: '#888', marginBottom: 8, display: 'inline-block' }}>&larr; Back</Link>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a', marginBottom: 4 }}>{data.course.title}</h1>
        <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: '#999' }}>Progress</span>
          <span style={{ fontSize: 12, color: '#999' }}>{data.progress.completed} of {data.progress.total} lessons</span>
        </div>
        <div style={{ height: 4, backgroundColor: '#eee', borderRadius: 2 }}>
          <div style={{ height: '100%', width: `${progressPct}%`, backgroundColor: '#1D9E75', borderRadius: 2, transition: 'width 0.5s' }} />
        </div>
      </div>
      {data.modules.map((mod, modIdx) => (
        <div key={mod.id}>
          <div style={{ padding: '16px 20px 8px 20px' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{mod.title}</h3>
          </div>
          {mod.lessons.map((lesson, lessonIdx) => (
            <LessonRow
              key={lesson.id}
              lesson={{ ...lesson, state: lesson.state === 'locked' ? 'available' : lesson.state }}
              moduleIndex={modIdx}
              lessonIndex={lessonIdx}
              slug={slug}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page — show preview for creators, "get the app" for learners
// ---------------------------------------------------------------------------

function CoursePathContent() {
  const params = useParams();
  const searchParamsHook = useSearchParams();
  const slug = params.slug as string;
  const isPreview = searchParamsHook.get('preview') === 'true';

  if (isPreview) {
    return <CreatorPreviewContent slug={slug} />;
  }

  return <GetTheAppView slug={slug} />;
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
