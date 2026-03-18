'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface ProfileData {
  user: { display_name: string; avatar_url: string | null; created_at?: string };
  stats: {
    courses_enrolled: number;
    courses_completed: number;
    total_questions_seen: number;
    total_questions_correct: number;
    accuracy_percent: number;
    total_sessions: number;
  };
}

interface DashboardCourse {
  course_id: string;
  course: { title: string; slug: string };
  questions_seen: number;
  questions_total: number;
  lessons_total: number;
  last_session_at: string | null;
  enrolled_at?: string;
  status: string;
}

function formatMemberSince(profile: ProfileData, courses: DashboardCourse[]): string {
  let earliest: Date | null = null;
  if (profile.user.created_at) {
    earliest = new Date(profile.user.created_at);
  } else {
    const dates = courses
      .map((c) => c.enrolled_at)
      .filter(Boolean)
      .map((d) => new Date(d!).getTime());
    if (dates.length > 0) earliest = new Date(Math.min(...dates));
  }
  if (!earliest) return 'Learning on openED';
  const month = earliest.toLocaleString('en-US', { month: 'short' });
  const year = earliest.getFullYear();
  return `Learning on openED since ${month} ${year}`;
}

function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return 'Not started';
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now.getTime() - then.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Last studied today';
  if (diffDays === 1) return 'Last studied 1d ago';
  if (diffDays < 7) return `Last studied ${diffDays}d ago`;
  if (diffDays < 30) return `Last studied ${Math.floor(diffDays / 7)}w ago`;
  return `Last studied ${Math.floor(diffDays / 30)}mo ago`;
}

function getAccuracyColor(pct: number): string {
  if (pct > 70) return 'text-green-700';
  if (pct >= 40) return 'text-amber-700';
  return 'text-gray-400';
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [courses, setCourses] = useState<DashboardCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [profileRes, dashRes] = await Promise.all([
          fetch('/api/profile'),
          fetch('/api/dashboard'),
        ]);
        if (profileRes.ok) setProfile(await profileRes.json());
        if (dashRes.ok) {
          const d = await dashRes.json();
          setCourses(d.active_courses || []);
        }
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gray-100 rounded-full" />
          <div className="space-y-2"><div className="h-5 bg-gray-100 rounded w-32" /><div className="h-3 bg-gray-100 rounded w-24" /></div>
        </div>
        <div className="h-24 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  const user = profile?.user;
  const stats = profile?.stats;

  const initials = user?.display_name
    ? user.display_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <div className="space-y-5">
      {/* Header */}
      <h1 className="text-xl font-bold text-gray-900 animate-fade-up">Profile</h1>

      {/* Avatar + name */}
      <div className="flex items-center gap-4 animate-fade-up">
        <div className="w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
          <span className="text-xl font-bold text-white">{initials}</span>
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">{user?.display_name || 'Learner'}</h2>
          <p className="text-xs text-gray-400">{profile ? formatMemberSince(profile, courses) : 'Learning on openED'}</p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="flex gap-3 animate-fade-up" style={{ animationDelay: '60ms' }}>
        <div className="flex-1 rounded-xl bg-gray-50 p-3 text-center">
          <p className={`text-2xl font-bold ${getAccuracyColor(stats?.accuracy_percent || 0)}`}>{stats?.accuracy_percent || 0}%</p>
          <p className="text-[8px] text-gray-400 mt-0.5 uppercase font-medium">Accuracy</p>
        </div>
        <div className="flex-1 rounded-xl bg-gray-50 p-3 text-center">
          <p className="text-2xl font-bold text-gray-900">{stats?.total_questions_seen || 0}</p>
          <p className="text-[8px] text-gray-400 mt-0.5 uppercase font-medium">Questions</p>
        </div>
        <div className="flex-1 rounded-xl bg-gray-50 p-3 text-center">
          <p className="text-2xl font-bold text-gray-900">{stats?.courses_enrolled || 0}</p>
          <p className="text-[8px] text-gray-400 mt-0.5 uppercase font-medium">Courses</p>
        </div>
      </div>

      {/* My Courses */}
      <div className="animate-fade-up" style={{ animationDelay: '120ms' }}>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">My Courses</h3>
        {courses.length > 0 ? (
          <div className="space-y-1.5">
            {courses.map((c: DashboardCourse) => {
              const pct = c.questions_total > 0 ? Math.round((c.questions_seen / c.questions_total) * 100) : 0;
              return (
                <Link key={c.course_id} href={`/course/${c.course.slug}/path`} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">{c.course.title}</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">
                      {c.lessons_total || 0} lessons &middot; {formatRelativeDate(c.last_session_at)}
                    </p>
                    <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden mt-1.5">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-400 ml-3 flex-shrink-0">{pct}%</span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl bg-gray-50 py-6 px-5 text-center">
            <p className="text-[15px] font-bold text-gray-900 mb-1">Start your learning journey</p>
            <p className="text-xs text-gray-400 mb-4">Browse interactive courses from expert creators</p>
            <Link
              href="/browse"
              className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              Browse courses
            </Link>
          </div>
        )}
      </div>

      {/* Learning Stats */}
      <div className="animate-fade-up" style={{ animationDelay: '180ms' }}>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Learning Stats</h3>
        <div className="rounded-xl bg-gray-50 divide-y divide-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-xs text-gray-400">Questions answered</span>
            <span className="text-xs font-semibold text-gray-900">{(stats?.total_questions_seen || 0).toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-xs text-gray-400">Correct answers</span>
            <span className="text-xs font-semibold text-gray-900">{(stats?.total_questions_correct || 0).toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-xs text-gray-400">Sessions completed</span>
            <span className="text-xs font-semibold text-gray-900">{stats?.total_sessions || 0}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-xs text-gray-400">Courses enrolled</span>
            <span className="text-xs font-semibold text-gray-900">{stats?.courses_enrolled || 0}</span>
          </div>
        </div>
      </div>

      {/* Become a creator */}
      <div className="animate-fade-up" style={{ animationDelay: '240ms' }}>
        <Link href="/creator" className="block w-full py-3 rounded-xl bg-gray-900 text-white font-semibold text-sm text-center hover:bg-gray-800 transition-colors">
          Become a Creator
        </Link>
      </div>

      {/* Settings & sign out */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 animate-fade-up" style={{ animationDelay: '300ms' }}>
        <button className="text-sm text-gray-400 hover:text-gray-900">Settings</button>
        <button
          onClick={async () => {
            const supabase = createClient();
            await supabase.auth.signOut();
            window.location.href = '/login';
          }}
          className="text-sm text-red-500 hover:text-red-600 font-medium"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
