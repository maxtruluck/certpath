'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface ModulePreview {
  id: string;
  title: string;
  display_order: number;
  lessons: { id: string; title: string; display_order: number }[];
}

interface CourseDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  difficulty: string;
  price_cents: number;
  card_color?: string;
  tags?: string[];
  learning_objectives?: string[];
  estimated_duration_minutes?: number | null;
  creator: {
    id: string;
    creator_name: string;
    bio: string | null;
  } | null;
  stats: {
    module_count: number;
    lesson_count: number;
    question_count: number;
  };
  modules?: ModulePreview[];
  user_progress: {
    id: string;
    status: string;
  } | null;
}

export default function CourseOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPreview = searchParams.get('preview') === 'true';
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set([0]));

  useEffect(() => {
    async function fetchCourse() {
      try {
        const res = await fetch(`/api/courses/${params.slug}`);
        if (res.status === 404) { setError('Course not found'); setLoading(false); return; }
        if (!res.ok) throw new Error('Failed to fetch');
        setCourse(await res.json());
      } catch {
        setError('Something went wrong');
      }
      setLoading(false);
    }
    fetchCourse();
  }, [params.slug]);

  function toggleModule(index: number) {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-4 bg-gray-100 rounded w-16" />
        <div className="h-1.5 bg-gray-100 rounded w-full" />
        <div className="h-7 bg-gray-100 rounded w-3/4" />
        <div className="h-4 bg-gray-100 rounded w-1/3" />
        <div className="h-20 bg-gray-100 rounded-[10px]" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="text-center py-12">
        <p style={{ color: '#999', marginBottom: 16 }}>{error || 'Course not found'}</p>
        <button onClick={() => router.push('/browse')} style={{ fontSize: 13, color: '#1a1a1a', fontWeight: 500 }}>
          Back to browse
        </button>
      </div>
    );
  }

  const isEnrolled = !!course.user_progress;
  const accentColor = course.card_color || '#3b82f6';
  const isFree = !course.price_cents || course.price_cents === 0;
  const duration = course.estimated_duration_minutes;

  return (
    <div className="space-y-5">
      {/* Preview banner */}
      {isPreview && (
        <div style={{ backgroundColor: '#FEF3CD', color: '#856404', fontSize: 12, textAlign: 'center', padding: '8px 0', margin: '-16px -16px 0' }}>
          Preview mode — this course is not yet published
        </div>
      )}

      {/* Back link */}
      <button onClick={() => router.back()} style={{ fontSize: 13, color: '#888', display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
        Back
      </button>

      {/* Color bar */}
      <div style={{ height: 6, borderRadius: 3, width: '100%', backgroundColor: accentColor, marginBottom: 20 }} />

      {/* Title */}
      <h1 style={{ fontSize: 22, fontWeight: 600, color: '#1a1a1a', marginBottom: 4 }}>{course.title}</h1>

      {/* Creator */}
      <p style={{ fontSize: 14, color: '#999', marginBottom: 12 }}>
        by {course.creator?.creator_name || 'openED'}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5" style={{ marginBottom: 12 }}>
        {/* Primary category tag */}
        <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 4, backgroundColor: '#E6F1FB', color: '#185FA5' }}>
          {course.category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
        </span>
        {(course.tags || [])
          .filter(tag => tag.toLowerCase().replace(/[\s_]+/g, '_') !== course.category.toLowerCase().replace(/[\s_]+/g, '_'))
          .map(tag => (
            <span key={tag} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 4, border: '1px solid #e5e5e5', color: '#555' }}>
              {tag}
            </span>
          ))}
      </div>

      {/* Description */}
      {course.description && (
        <p style={{ fontSize: 14, color: '#555', lineHeight: 1.6, marginBottom: 20 }}>{course.description}</p>
      )}

      {/* Stats row - 3 cards */}
      <div className="flex gap-3" style={{ marginBottom: 20 }}>
        <div style={{ flex: 1, textAlign: 'center', padding: '14px 8px', border: '1px solid #e5e5e5', borderRadius: 10 }}>
          <p style={{ fontSize: 20, fontWeight: 600, color: '#1a1a1a' }}>{course.stats.module_count}</p>
          <p style={{ fontSize: 11, color: '#999' }}>Modules</p>
        </div>
        <div style={{ flex: 1, textAlign: 'center', padding: '14px 8px', border: '1px solid #e5e5e5', borderRadius: 10 }}>
          <p style={{ fontSize: 20, fontWeight: 600, color: '#1a1a1a' }}>{course.stats.lesson_count}</p>
          <p style={{ fontSize: 11, color: '#999' }}>Lessons</p>
        </div>
        <div style={{ flex: 1, textAlign: 'center', padding: '14px 8px', border: '1px solid #e5e5e5', borderRadius: 10 }}>
          <p style={{ fontSize: 20, fontWeight: 600, color: '#1a1a1a' }}>{duration ? `~${duration}m` : '--'}</p>
          <p style={{ fontSize: 11, color: '#999' }}>Duration</p>
        </div>
      </div>

      {/* What you'll learn */}
      {(course.learning_objectives || []).length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', marginBottom: 10 }}>What you&apos;ll learn</h3>
          <div className="space-y-2">
            {(course.learning_objectives || []).map((obj, i) => (
              <div key={i} className="flex gap-2" style={{ alignItems: 'flex-start' }}>
                <span style={{ fontSize: 14, color: '#1D9E75', marginTop: 2, flexShrink: 0 }}>&#10003;</span>
                <span style={{ fontSize: 13, color: '#555', lineHeight: 1.4 }}>{obj}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Course content - collapsible modules */}
      {(course.modules || []).length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', marginBottom: 10 }}>Course content</h3>
          <div>
            {(course.modules || []).map((mod, i) => {
              const isExpanded = expandedModules.has(i);
              return (
                <div key={mod.id}>
                  {/* Module header */}
                  <button
                    onClick={() => toggleModule(i)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 0',
                      borderBottom: '1px solid #eee',
                      background: 'none',
                      border: 'none',
                      borderBottomWidth: 1,
                      borderBottomStyle: 'solid',
                      borderBottomColor: '#eee',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', textAlign: 'left' }}>{mod.title}</span>
                    <span style={{ fontSize: 12, color: '#999', flexShrink: 0, marginLeft: 8 }}>
                      {mod.lessons.length} lessons {isExpanded ? '\u25B4' : '\u25BE'}
                    </span>
                  </button>
                  {/* Expanded lessons */}
                  {isExpanded && (
                    <div>
                      {mod.lessons.map((lesson, li) => (
                        <div
                          key={lesson.id}
                          className="flex gap-2"
                          style={{ padding: '8px 0 8px 12px', alignItems: 'center' }}
                        >
                          <span style={{ fontSize: 11, color: '#999', width: 24, flexShrink: 0 }}>{li + 1}</span>
                          <span style={{ fontSize: 13, color: '#666' }}>{lesson.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Price + enroll */}
      <div>
        {/* Price display */}
        <div className="flex justify-between items-center" style={{ marginBottom: 12 }}>
          <span style={{ fontSize: 18, fontWeight: 600, color: isFree ? '#1D9E75' : '#1a1a1a' }}>
            {isFree ? 'Free' : `$${(course.price_cents / 100).toFixed(2)}`}
          </span>
        </div>

        {/* Action button */}
        {isPreview ? (
          <button
            onClick={() => window.close()}
            style={{
              width: '100%', padding: 14, backgroundColor: '#1a1a1a', color: '#fff',
              borderRadius: 10, fontSize: 15, fontWeight: 500, border: 'none', cursor: 'pointer',
            }}
          >
            Close Preview
          </button>
        ) : isEnrolled ? (
          <Link
            href={`/course/${course.slug}/path`}
            style={{
              display: 'block', width: '100%', padding: 14, backgroundColor: '#1a1a1a', color: '#fff',
              borderRadius: 10, fontSize: 15, fontWeight: 500, textAlign: 'center',
            }}
          >
            Continue learning &rarr;
          </Link>
        ) : isFree ? (
          <button
            onClick={async () => {
              if (actionLoading) return;
              setActionLoading(true);
              try {
                const res = await fetch(`/api/courses/${course.slug}/enroll`, {
                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                });
                if (res.ok || res.status === 409) {
                  router.push(`/course/${course.slug}/path`);
                } else {
                  const data = await res.json();
                  setError(data.error || 'Enrollment failed');
                  setActionLoading(false);
                }
              } catch { setError('Something went wrong'); setActionLoading(false); }
            }}
            disabled={actionLoading}
            style={{
              width: '100%', padding: 14, backgroundColor: '#1a1a1a', color: '#fff',
              borderRadius: 10, fontSize: 15, fontWeight: 500, border: 'none', cursor: 'pointer',
              opacity: actionLoading ? 0.5 : 1,
            }}
          >
            {actionLoading ? 'Enrolling...' : 'Enroll for free'}
          </button>
        ) : (
          <button
            onClick={async () => {
              if (actionLoading) return;
              setActionLoading(true);
              try {
                const res = await fetch('/api/checkout', {
                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ course_id: course.id }),
                });
                const data = await res.json();
                if (data.url) { window.location.href = data.url; }
                else { setError(data.error || 'Checkout failed'); setActionLoading(false); }
              } catch { setError('Something went wrong'); setActionLoading(false); }
            }}
            disabled={actionLoading}
            style={{
              width: '100%', padding: 14, backgroundColor: '#1a1a1a', color: '#fff',
              borderRadius: 10, fontSize: 15, fontWeight: 500, border: 'none', cursor: 'pointer',
              opacity: actionLoading ? 0.5 : 1,
            }}
          >
            {actionLoading ? 'Redirecting...' : `Buy for $${(course.price_cents / 100).toFixed(2)}`}
          </button>
        )}
      </div>
    </div>
  );
}
