'use client';

import { useState, useEffect } from 'react';
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
  current_topic_id: string | null;
  current_topic_title: string | null;
  questions_seen: number;
  questions_total: number;
  topics_total: number;
  sessions_completed: number;
  last_session_at: string | null;
  enrolled_at: string;
  due_cards: number;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch('/api/dashboard');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setActiveCourses(data.active_courses || []);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      }
      setLoading(false);
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-[#EBE8E2] rounded-xl w-48" />
        <div className="h-48 bg-[#EBE8E2] rounded-2xl" />
        <div className="h-20 bg-[#EBE8E2] rounded-2xl" />
      </div>
    );
  }

  // Sort: most recently studied first, then by due cards
  const sorted = [...activeCourses].sort((a, b) => {
    if (a.last_session_at && b.last_session_at) {
      return new Date(b.last_session_at).getTime() - new Date(a.last_session_at).getTime();
    }
    if (a.last_session_at) return -1;
    if (b.last_session_at) return 1;
    return b.due_cards - a.due_cards;
  });

  const primaryCourse = sorted[0] || null;
  const otherCourses = sorted.slice(1);

  // Daily goal placeholder (3 sessions target)
  const todaySessions = primaryCourse ? Math.min(primaryCourse.sessions_completed, 3) : 0;
  const dailyTarget = 3;

  if (!primaryCourse) {
    return (
      <div className="text-center py-16 animate-fade-up">
        <div className="w-20 h-20 rounded-full bg-[#F5F3EF] flex items-center justify-center mx-auto mb-5">
          <svg className="w-10 h-10 text-[#6B635A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-[#2C2825] mb-2">Welcome to openED</h1>
        <p className="text-sm text-[#6B635A] mb-6">Find your first course and start learning with spaced repetition.</p>
        <Link
          href="/browse"
          className="inline-block bg-[#2C2825] hover:bg-[#1A1816] text-[#F5F3EF] font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          Find your first course
        </Link>
      </div>
    );
  }

  const primaryReadiness = Math.round((primaryCourse.readiness_score || 0) * 100);

  return (
    <div className="space-y-5">
      {/* Hero course card */}
      <div className="rounded-2xl bg-white border border-[#E8E4DD] p-5 animate-fade-up">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-[#2C2825] text-lg leading-tight">{primaryCourse.course.title}</h2>
            {primaryCourse.course.provider_name && (
              <p className="text-xs text-[#A39B90] mt-0.5">by {primaryCourse.course.provider_name}</p>
            )}
          </div>
        </div>

        {/* Readiness progress bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-semibold text-[#2C2825]">{primaryReadiness}% ready</span>
            <span className="text-xs text-[#A39B90]">{primaryCourse.questions_seen}/{primaryCourse.questions_total} seen</span>
          </div>
          <div className="w-full h-2.5 bg-[#EBE8E2] rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-700 progress-shine"
              style={{ width: `${primaryReadiness}%` }}
            />
          </div>
        </div>

        {/* Due cards & current topic */}
        <div className="space-y-1 mb-4">
          {primaryCourse.due_cards > 0 && (
            <p className="text-sm text-amber-600 font-medium">
              {primaryCourse.due_cards} question{primaryCourse.due_cards !== 1 ? 's' : ''} due for review
            </p>
          )}
          {primaryCourse.current_topic_title && (
            <p className="text-sm text-[#6B635A]">
              Current: {primaryCourse.current_topic_title}
            </p>
          )}
        </div>

        {/* Continue button */}
        <Link
          href={`/practice/${primaryCourse.course.slug}`}
          className="block w-full bg-[#2C2825] hover:bg-[#1A1816] text-[#F5F3EF] font-semibold py-3.5 rounded-xl text-center transition-colors text-sm"
        >
          Continue Studying
        </Link>

        {/* Last studied */}
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-[#A39B90]">Last studied: {timeAgo(primaryCourse.last_session_at)}</p>
          <Link href={`/course/${primaryCourse.course.slug}/path`} className="text-xs text-[#2C2825] font-medium hover:text-[#1A1816]">
            View path →
          </Link>
        </div>
      </div>

      {/* Daily goal */}
      <div className="rounded-2xl bg-[#F5F3EF] border border-[#E8E4DD] p-4 animate-fade-up" style={{ animationDelay: '60ms' }}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-[#2C2825]">Today&apos;s Goal</h3>
          <span className="text-xs text-[#6B635A]">{Math.min(todaySessions, dailyTarget)}/{dailyTarget} sessions</span>
        </div>
        <div className="w-full h-2 bg-[#D4CFC7] rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${Math.min((todaySessions / dailyTarget) * 100, 100)}%` }}
          />
        </div>
        <p className="text-xs text-[#6B635A]">
          {todaySessions >= dailyTarget
            ? 'Daily goal complete! Keep going?'
            : `Complete ${dailyTarget - todaySessions} more session${dailyTarget - todaySessions !== 1 ? 's' : ''} to maintain your streak!`}
        </p>
      </div>

      {/* Other courses */}
      {otherCourses.length > 0 && (
        <div className="animate-fade-up" style={{ animationDelay: '120ms' }}>
          <h3 className="text-sm font-semibold text-[#2C2825] mb-3">Other Courses</h3>
          <div className="scroll-snap-x flex gap-3 -mx-4 px-4">
            {otherCourses.map((uc) => {
              const readiness = Math.round((uc.readiness_score || 0) * 100);
              return (
                <Link
                  key={uc.id}
                  href={`/course/${uc.course.slug}/path`}
                  className="flex-shrink-0 w-44 rounded-xl bg-white border border-[#E8E4DD] p-3 hover:border-[#D4CFC7] transition-all"
                >
                  <h4 className="font-semibold text-[#2C2825] text-sm mb-2 line-clamp-2">{uc.course.title}</h4>
                  <div className="w-full h-1.5 bg-[#EBE8E2] rounded-full overflow-hidden mb-1.5">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${readiness}%` }} />
                  </div>
                  <p className="text-xs text-[#6B635A]">{readiness}% ready</p>
                  <p className="text-[10px] text-[#A39B90] mt-1">
                    {uc.due_cards > 0 ? `${uc.due_cards} due` : uc.questions_seen === 0 ? 'Not started' : timeAgo(uc.last_session_at)}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="flex gap-3 animate-fade-up" style={{ animationDelay: '180ms' }}>
        <Link
          href="/browse"
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#F5F3EF] border border-[#E8E4DD] text-sm font-medium text-[#2C2825] hover:bg-[#EBE8E2] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          Browse Courses
        </Link>
        <Link
          href="/profile"
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#F5F3EF] border border-[#E8E4DD] text-sm font-medium text-[#2C2825] hover:bg-[#EBE8E2] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75z" />
          </svg>
          My Stats
        </Link>
      </div>
    </div>
  );
}
