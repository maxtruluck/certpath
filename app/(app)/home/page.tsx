'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

/* ─── Types ─── */

interface DashboardCourse {
  id: string;
  course_id: string;
  course: {
    id: string;
    title: string;
    slug: string;
    description: string;
    category: string;
    difficulty: string;
    card_color?: string;
  };
  status: string;
  questions_seen: number;
  questions_total: number;
  lessons_total: number;
  sessions_completed: number;
  last_session_at: string | null;
  enrolled_at: string;
  progress_percent?: number;
  resume_point?: {
    module_title: string;
    lesson_title: string;
    lesson_id: string;
    step_index: number;
    step_total: number;
  } | null;
}

interface BrowseCourse {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  difficulty: string;
  price_cents: number | null;
  tags?: string[];
  card_color?: string;
  creator?: { id: string; creator_name: string } | null;
  estimated_duration_minutes?: number | null;
  stats: {
    module_count: number;
    lesson_count: number;
    question_count: number;
  };
  user_progress: {
    status: string;
    sessions_completed: number;
  } | null;
}

/* ─── Component ─── */

export default function HomePage() {
  const [enrolled, setEnrolled] = useState<DashboardCourse[]>([]);
  const [allCourses, setAllCourses] = useState<BrowseCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [dashRes, browseRes] = await Promise.all([
          fetch('/api/dashboard'),
          fetch('/api/courses'),
        ]);
        if (dashRes.ok) { const d = await dashRes.json(); setEnrolled(d.active_courses || []); }
        if (browseRes.ok) { const b = await browseRes.json(); setAllCourses(b.courses || []); }
      } catch (err) { console.error('Home fetch error:', err); }
      setLoading(false);
    }
    fetchData();
  }, []);

  // Sort enrolled by last_session_at desc
  const sortedEnrolled = useMemo(() => {
    return [...enrolled].sort((a, b) => {
      const aTime = a.last_session_at ? new Date(a.last_session_at).getTime() : 0;
      const bTime = b.last_session_at ? new Date(b.last_session_at).getTime() : 0;
      return bTime - aTime;
    });
  }, [enrolled]);

  // Most recently active = hero course (only non-completed)
  const heroCourse = useMemo(() => {
    const active = sortedEnrolled.filter(c => c.status !== 'completed');
    return active.length > 0 ? active[0] : null;
  }, [sortedEnrolled]);

  const enrolledCourseIds = useMemo(() => new Set(enrolled.map((c) => c.course_id)), [enrolled]);

  // Recommended = published courses not enrolled in, newest first
  const recommended = useMemo(
    () => allCourses.filter((c) => !enrolledCourseIds.has(c.id)),
    [allCourses, enrolledCourseIds]
  );

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-[180px] bg-gray-100 rounded-[10px]" />
        <div className="h-5 bg-gray-100 rounded w-28" />
        <div className="flex gap-3">
          <div className="h-[100px] w-[150px] bg-gray-100 rounded-[10px]" />
          <div className="h-[100px] w-[150px] bg-gray-100 rounded-[10px]" />
        </div>
      </div>
    );
  }

  // No enrolled courses at all
  if (enrolled.length === 0) {
    return (
      <div className="space-y-5">
        <div className="text-center py-12">
          <p style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', marginBottom: 4 }}>
            No courses yet
          </p>
          <p style={{ fontSize: 13, color: '#999', marginBottom: 16 }}>
            Browse courses to get started
          </p>
          <Link
            href="/browse"
            style={{
              display: 'inline-block',
              backgroundColor: '#1a1a1a',
              color: '#fff',
              fontSize: 14,
              fontWeight: 500,
              padding: '10px 24px',
              borderRadius: 10,
            }}
          >
            Browse courses
          </Link>
        </div>
      </div>
    );
  }

  // Build hero data
  const heroProgress = heroCourse
    ? (heroCourse.progress_percent ?? 0)
    : 0;
  const rp = heroCourse?.resume_point;

  let heroSubtitle = '';
  if (heroCourse && rp) {
    const completed = rp.step_index;
    const total = rp.step_total;
    heroSubtitle = `${rp.lesson_title} · ${completed}/${total} complete`;
  } else if (heroCourse) {
    heroSubtitle = `${heroProgress}% complete`;
  }

  const heroHref = heroCourse
    ? rp
      ? `/lesson/${heroCourse.course.slug}/${rp.lesson_id}`
      : `/course/${heroCourse.course.slug}/path`
    : '/browse';

  return (
    <div className="space-y-5">
      {/* Hero resume card */}
      {heroCourse && (
        <div
          style={{
            background: 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)',
            borderRadius: 10,
            padding: 20,
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 4, lineHeight: 1.3 }}>
            {heroCourse.course.title}
          </h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 12 }}>
            {heroSubtitle}
          </p>
          {/* Progress bar */}
          <div style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, marginBottom: 16 }}>
            <div
              style={{
                height: '100%',
                width: `${Math.min(100, heroProgress)}%`,
                backgroundColor: '#fff',
                borderRadius: 2,
              }}
            />
          </div>
          <Link
            href={heroHref}
            style={{
              display: 'block',
              width: '100%',
              backgroundColor: '#fff',
              color: '#1a1a1a',
              fontSize: 14,
              fontWeight: 500,
              textAlign: 'center',
              padding: '12px 0',
              borderRadius: 10,
            }}
          >
            Continue learning
          </Link>
        </div>
      )}

      {/* Your courses - horizontal scroll */}
      {sortedEnrolled.length > 0 && (
        <div>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', marginBottom: 12 }}>
            Your courses
          </p>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4">
            {sortedEnrolled.map((item) => {
              const pct = item.progress_percent ?? 0;
              const color = item.course.card_color || '#3b82f6';
              return (
                <Link
                  key={item.id}
                  href={`/course/${item.course.slug}/path`}
                  className="flex-shrink-0"
                  style={{ minWidth: 150 }}
                >
                  <div
                    style={{
                      border: '1px solid #e5e5e5',
                      borderRadius: 10,
                      overflow: 'hidden',
                    }}
                  >
                    {/* Color bar */}
                    <div style={{ height: 4, backgroundColor: color }} />
                    {/* Body */}
                    <div style={{ padding: 12 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a', marginBottom: 8, lineHeight: 1.3 }} className="line-clamp-2">
                        {item.course.title}
                      </p>
                      {/* Progress bar */}
                      <div style={{ height: 3, backgroundColor: '#eee', borderRadius: 2, marginBottom: 4 }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${pct}%`,
                            backgroundColor: '#1D9E75',
                            borderRadius: 2,
                          }}
                        />
                      </div>
                      <p style={{ fontSize: 11, color: '#999' }}>{pct}%</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Recommended for you */}
      {recommended.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', marginBottom: 12 }}>
            Recommended for you
          </p>
          <div className="space-y-3">
            {recommended.map((course) => {
              const isFree = !course.price_cents || course.price_cents === 0;
              const color = course.card_color || '#3b82f6';
              return (
                <Link key={course.id} href={`/course/${course.slug}`}>
                  <div
                    style={{
                      border: '1px solid #e5e5e5',
                      borderRadius: 10,
                      overflow: 'hidden',
                    }}
                  >
                    {/* Color bar */}
                    <div style={{ height: 4, backgroundColor: color }} />
                    {/* Body */}
                    <div style={{ padding: 14, display: 'flex', gap: 12 }}>
                      {/* Left info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a', marginBottom: 2, lineHeight: 1.3 }} className="line-clamp-2">
                          {course.title}
                        </p>
                        {course.creator?.creator_name && (
                          <p style={{ fontSize: 12, color: '#999', marginBottom: 2 }}>
                            {course.creator.creator_name}
                          </p>
                        )}
                        <p style={{ fontSize: 11, color: '#aaa', marginBottom: 6 }}>
                          {course.stats.lesson_count} lessons
                          {course.estimated_duration_minutes ? ` · ~${course.estimated_duration_minutes} min` : ''}
                        </p>
                        {/* Tags */}
                        {(course.tags || []).length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {(course.tags || []).slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                style={{
                                  fontSize: 10,
                                  padding: '1.5px 6px',
                                  backgroundColor: '#f0f0f0',
                                  color: '#666',
                                  borderRadius: 3,
                                }}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* Right price */}
                      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: isFree ? '#1D9E75' : '#1a1a1a' }}>
                          {isFree ? 'Free' : `$${(course.price_cents! / 100).toFixed(2)}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
