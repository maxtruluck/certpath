'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

interface ActiveCourse {
  id: string;
  course_id: string;
  course: {
    id: string;
    title: string;
    slug: string;
    description: string;
    category: string;
    difficulty: string;
    thumbnail_url: string | null;
    provider_name: string | null;
  };
  status: string;
  readiness_score: number;
  questions_seen: number;
  questions_total: number;
  lessons_total: number;
  sessions_completed: number;
  last_session_at: string | null;
  enrolled_at: string;
  lessons_completed?: number;
}

interface BrowseCourse {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  difficulty: string;
  thumbnail_url: string | null;
  provider_name: string | null;
  price_cents: number | null;
  tags?: string[];
  stats: {
    module_count: number;
    topic_count: number;
    question_count: number;
  };
  user_progress: {
    status: string;
    readiness_score: number;
    sessions_completed: number;
  } | null;
}

const CATEGORY_COLORS: Record<string, { bar: string; bg: string; badge: string; badgeText: string }> = {
  cybersecurity:     { bar: '#3b82f6', bg: '#f8faff', badge: '#E6F1FB', badgeText: '#185FA5' },
  certification:     { bar: '#3b82f6', bg: '#f8faff', badge: '#E6F1FB', badgeText: '#185FA5' },
  general:           { bar: '#64748b', bg: '#f8f9fb', badge: '#F1F5F9', badgeText: '#64748b' },
  general_knowledge: { bar: '#64748b', bg: '#f8f9fb', badge: '#F1F5F9', badgeText: '#64748b' },
  academic:          { bar: '#0d9488', bg: '#f5faf8', badge: '#E6F1FB', badgeText: '#185FA5' },
  mathematics:       { bar: '#0d9488', bg: '#f5faf8', badge: '#E1F5EE', badgeText: '#0F6E56' },
  business:          { bar: '#64748b', bg: '#f8f9fb', badge: '#F1F5F9', badgeText: '#475569' },
};

function getCatStyle(cat: string) {
  const key = (cat || '').toLowerCase().replace(/\s+/g, '_');
  return CATEGORY_COLORS[key] || { bar: '#64748b', bg: '#fafafa', badge: '#F1F5F9', badgeText: '#64748b' };
}

const CATEGORY_DISPLAY: Record<string, string> = {
  general_knowledge: 'General',
  certification: 'Certification',
  cybersecurity: 'Cybersecurity',
};

function formatCategoryName(cat: string): string {
  const key = cat.toLowerCase().replace(/\s+/g, '_');
  if (CATEGORY_DISPLAY[key]) return CATEGORY_DISPLAY[key];
  return cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

export default function HomePage() {
  const [activeCourses, setActiveCourses] = useState<ActiveCourse[]>([]);
  const [allCourses, setAllCourses] = useState<BrowseCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [dashRes, browseRes] = await Promise.all([
          fetch('/api/dashboard'),
          fetch('/api/courses'),
        ]);
        if (dashRes.ok) {
          const d = await dashRes.json();
          setActiveCourses(d.active_courses || []);
        }
        if (browseRes.ok) {
          const b = await browseRes.json();
          setAllCourses(b.courses || []);
        }
      } catch (err) {
        console.error('Home fetch error:', err);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const sorted = useMemo(() => [...activeCourses].sort((a, b) => {
    if (a.last_session_at && b.last_session_at) {
      return new Date(b.last_session_at).getTime() - new Date(a.last_session_at).getTime();
    }
    if (a.last_session_at) return -1;
    if (b.last_session_at) return 1;
    return (b.sessions_completed || 0) - (a.sessions_completed || 0);
  }), [activeCourses]);

  const primaryCourse = sorted[0] || null;
  const otherCourses = sorted.slice(1);

  const enrolledIds = useMemo(() => new Set(activeCourses.map((c) => c.course_id)), [activeCourses]);
  const discoveryCourses = useMemo(
    () => allCourses.filter((c) => !enrolledIds.has(c.id)).slice(0, 6),
    [allCourses, enrolledIds],
  );

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-100 rounded-xl w-48" />
        <div className="h-48 bg-gray-100 rounded-2xl" />
        <div className="h-20 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  const isReturning = activeCourses.length > 0;

  if (!isReturning) {
    return (
      <div className="space-y-6">
        {/* New user hero */}
        <div className="rounded-2xl bg-gray-900 p-6 text-center animate-fade-up">
          <h1 className="text-xl font-bold text-white mb-2">Start learning today</h1>
          <p className="text-sm text-gray-400 mb-5">Bite-sized interactive courses from expert creators</p>
          <Link
            href="/browse"
            className="inline-block bg-white text-gray-900 font-semibold px-6 py-3 rounded-xl text-sm hover:bg-gray-100 transition-colors"
          >
            Explore courses
          </Link>
        </div>

        {/* Discovery grid */}
        {allCourses.length > 0 && (
          <div className="animate-fade-up" style={{ animationDelay: '100ms' }}>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">NEW ON OPENED</h2>
            <div className="grid grid-cols-2 gap-2">
              {allCourses.slice(0, 6).map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const primaryPct = primaryCourse!.questions_total > 0
    ? Math.round((primaryCourse!.questions_seen / primaryCourse!.questions_total) * 100)
    : 0;

  return (
    <div className="space-y-5">
      {/* Hero course */}
      <div className="rounded-2xl bg-gray-900 p-5 animate-fade-up">
        <p className="text-xs text-gray-400 font-medium mb-1">Continue learning</p>
        <h2 className="font-bold text-white text-lg leading-tight mb-1">{primaryCourse!.course.title}</h2>
        <p className="text-sm text-gray-400 mb-3">{primaryPct}% complete</p>
        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-700"
            style={{ width: `${primaryPct}%` }}
          />
        </div>
        <Link
          href={`/course/${primaryCourse!.course.slug}/path`}
          className="block w-full bg-white text-gray-900 font-semibold py-3 rounded-xl text-center text-sm hover:bg-gray-100 transition-colors"
        >
          Continue learning
        </Link>
      </div>

      {/* Your Courses (horizontal scroll) */}
      {otherCourses.length > 0 && (
        <div className="animate-fade-up" style={{ animationDelay: '80ms' }}>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">YOUR COURSES</h3>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4">
            {otherCourses.map((uc) => {
              const pct = uc.questions_total > 0 ? Math.round((uc.questions_seen / uc.questions_total) * 100) : 0;
              return (
                <Link
                  key={uc.id}
                  href={`/course/${uc.course.slug}/path`}
                  className="flex-shrink-0 w-40 rounded-xl bg-gray-50 p-3 hover:bg-gray-100 transition-all"
                >
                  <h4 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2">{uc.course.title}</h4>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-1.5">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-gray-500">{pct}% complete</p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {uc.questions_seen === 0 ? 'Not started' : timeAgo(uc.last_session_at)}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Recommended for you (2-col grid matching mobile) */}
      {discoveryCourses.length > 0 && (
        <div className="animate-fade-up" style={{ animationDelay: '160ms' }}>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">RECOMMENDED FOR YOU</h3>
          <div className="grid grid-cols-2 gap-2">
            {discoveryCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* Course card matching mobile DiscoveryCourseCard style */
function CourseCard({ course }: { course: BrowseCourse }) {
  const catStyle = getCatStyle(course.category);
  const isFree = !course.price_cents || course.price_cents === 0;

  return (
    <Link
      href={`/course/${course.slug}`}
      className="rounded-[10px] overflow-hidden border border-gray-200/60 hover:border-gray-300 transition-all"
      style={{ backgroundColor: catStyle.bg }}
    >
      {/* Thin color bar */}
      <div className="h-1 w-full" style={{ backgroundColor: catStyle.bar }} />

      {/* Body */}
      <div className="p-3">
        {/* Title row with price */}
        <div className="flex justify-between items-start gap-1.5 mb-0.5">
          <h3 className="text-[13px] font-bold text-gray-900 leading-tight line-clamp-2 flex-1">
            {course.title}
          </h3>
          <span
            className={`text-[9px] font-semibold px-2 py-0.5 rounded-md flex-shrink-0 mt-0.5 ${
              isFree ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {isFree ? 'Free' : `$${(course.price_cents! / 100).toFixed(2)}`}
          </span>
        </div>

        {course.provider_name && (
          <p className="text-[10px] text-gray-400 mt-0.5">by {course.provider_name}</p>
        )}

        {course.description && (
          <p className="text-[10px] text-gray-300 mt-0.5 line-clamp-1">{course.description}</p>
        )}

        {/* Spacer */}
        <div className="min-h-[12px]" />

        {/* Meta row */}
        <div className="flex items-center gap-1 flex-wrap">
          {course.stats.topic_count > 0 && (
            <span className="text-[9px] text-gray-400">
              {course.stats.topic_count} {course.stats.topic_count === 1 ? 'lesson' : 'lessons'}
            </span>
          )}
          {course.category && (
            <span
              className="text-[8px] font-medium px-1.5 py-0.5 rounded"
              style={{ backgroundColor: catStyle.badge, color: catStyle.badgeText }}
            >
              {formatCategoryName(course.category)}
            </span>
          )}
          {(course.tags || []).slice(0, 2).map((tag) => (
            <span key={tag} className="text-[8px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
