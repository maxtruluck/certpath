'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

/* ─── Types (matches mobile profile.tsx) ─── */

interface ProfileData {
  user: { display_name: string; avatar_url: string | null; created_at?: string };
  stats: {
    courses_enrolled: number; courses_completed: number;
    total_questions_seen: number; total_questions_correct: number;
    accuracy_percent: number; total_sessions: number;
  };
}

interface DashboardCourse {
  id: string; course_id: string;
  course: { id: string; title: string; slug: string; description: string; category: string; difficulty: string; thumbnail_url: string | null; provider_name: string };
  readiness_score: number; questions_seen: number; questions_correct: number;
  questions_total: number; lessons_total: number; sessions_completed: number;
  last_session_at: string | null; enrolled_at?: string;
}

/* ─── Helpers (same as mobile) ─── */

function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return 'Not started';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Last studied today';
  if (diffDays === 1) return 'Last studied 1d ago';
  if (diffDays < 7) return `Last studied ${diffDays}d ago`;
  if (diffDays < 14) return 'Last studied 1w ago';
  if (diffDays < 30) return `Last studied ${Math.floor(diffDays / 7)}w ago`;
  return `Last studied ${Math.floor(diffDays / 30)}mo ago`;
}

function formatMemberSince(profile: ProfileData, courses: DashboardCourse[]): string {
  let earliest: Date | null = null;
  if (profile.user.created_at) { earliest = new Date(profile.user.created_at); }
  else {
    const dates = courses.map((c) => c.enrolled_at).filter(Boolean).map((d) => new Date(d!).getTime());
    if (dates.length > 0) earliest = new Date(Math.min(...dates));
  }
  if (!earliest) return 'Learning on openED';
  const month = earliest.toLocaleString('en-US', { month: 'short' });
  return `Learning on openED since ${month} ${earliest.getFullYear()}`;
}

function getAccuracyColor(pct: number): string {
  if (pct > 70) return '#0F6E56';
  if (pct >= 40) return '#854F0B';
  return '#94a3b8';
}

/* ─── Component (mirrors mobile profile.tsx) ─── */

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [courses, setCourses] = useState<DashboardCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [profileRes, dashRes] = await Promise.all([fetch('/api/profile'), fetch('/api/dashboard')]);
        if (profileRes.ok) setProfile(await profileRes.json());
        if (dashRes.ok) { const d = await dashRes.json(); setCourses(d.active_courses || []); }
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-100 rounded-full" />
          <div className="space-y-2"><div className="h-5 bg-gray-100 rounded w-32" /><div className="h-3 bg-gray-100 rounded w-24" /></div>
        </div>
        <div className="flex gap-2"><div className="flex-1 h-16 bg-gray-100 rounded-lg" /><div className="flex-1 h-16 bg-gray-100 rounded-lg" /><div className="flex-1 h-16 bg-gray-100 rounded-lg" /></div>
      </div>
    );
  }

  const user = profile?.user;
  const stats = profile?.stats;
  const initial = user?.display_name?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className="space-y-4">
      {/* Header bar (matches mobile topBar: "Profile" bold 20px) */}
      <h1 className="text-xl font-bold text-[#0f172a]">Profile</h1>

      {/* Section A: Avatar + name (matches mobile: 48x48 blue circle, 17px name, 11px memberSince) */}
      <div className="flex items-center gap-3 py-4">
        <div className="w-12 h-12 rounded-full bg-[#3b82f6] flex items-center justify-center flex-shrink-0">
          <span className="text-lg font-bold text-white">{initial}</span>
        </div>
        <div className="flex-1 space-y-0.5">
          <p className="text-[17px] font-bold text-[#0f172a] truncate">{user?.display_name || 'Learner'}</p>
          <p className="text-[11px] text-[#94a3b8]">{profile ? formatMemberSince(profile, courses) : 'Learning on openED'}</p>
        </div>
      </div>

      {/* Section B: Stats row (matches mobile: 22px value, 8px label, accuracy colored) */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 bg-[#f8fafc] rounded-lg py-3 text-center">
          <p className="text-[22px] font-bold mb-0.5" style={{ color: getAccuracyColor(stats?.accuracy_percent || 0) }}>{stats?.accuracy_percent || 0}%</p>
          <p className="text-[8px] font-medium text-[#94a3b8] uppercase">Accuracy</p>
        </div>
        <div className="flex-1 bg-[#f8fafc] rounded-lg py-3 text-center">
          <p className="text-[22px] font-bold text-[#0f172a] mb-0.5">{stats?.total_questions_seen || 0}</p>
          <p className="text-[8px] font-medium text-[#94a3b8] uppercase">Questions</p>
        </div>
        <div className="flex-1 bg-[#f8fafc] rounded-lg py-3 text-center">
          <p className="text-[22px] font-bold text-[#0f172a] mb-0.5">{stats?.courses_enrolled || 0}</p>
          <p className="text-[8px] font-medium text-[#94a3b8] uppercase">Courses</p>
        </div>
      </div>

      {/* Section C: My Courses (matches mobile exactly) */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-[#999] uppercase tracking-[0.5px] mb-2">MY COURSES</p>
        {courses.length > 0 ? (
          <div className="space-y-1.5">
            {courses.map((item) => {
              const pct = item.questions_total > 0 ? Math.round((item.questions_seen / item.questions_total) * 100) : 0;
              return (
                <Link key={item.id} href={`/course/${item.course.slug}/path`}
                  className="flex items-center gap-3 bg-[#f8fafc] rounded-lg p-3 hover:bg-[#f1f5f9] transition-colors"
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-xs font-semibold text-[#0f172a] truncate">{item.course.title}</p>
                    <p className="text-[9px] text-[#94a3b8]">{item.lessons_total} lessons &middot; {formatRelativeDate(item.last_session_at)}</p>
                    <div className="h-1 bg-[#e2e8f0] rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-[#3B82F6] rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-[#94a3b8] min-w-[36px] text-right">{pct}%</span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="bg-[#f8fafc] rounded-xl py-6 px-5 text-center">
            <p className="text-[15px] font-bold text-[#0f172a] mb-1">Start your learning journey</p>
            <p className="text-xs text-[#94a3b8] mb-4">Browse interactive courses from expert creators</p>
            <Link href="/browse" className="inline-block bg-[#3B82F6] text-white font-semibold px-5 py-2.5 rounded-[10px] text-sm hover:bg-[#2563EB] transition-colors">
              Browse courses
            </Link>
          </div>
        )}
      </div>

      {/* Section E: Learning Stats (matches mobile learningStatsCard) */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-[#999] uppercase tracking-[0.5px] mb-2">LEARNING STATS</p>
        <div className="bg-[#f8fafc] rounded-lg overflow-hidden divide-y divide-[#e2e8f0]">
          {[
            { label: 'Questions answered', value: stats?.total_questions_seen || 0 },
            { label: 'Correct answers', value: stats?.total_questions_correct || 0 },
            { label: 'Sessions completed', value: stats?.total_sessions || 0 },
            { label: 'Courses enrolled', value: stats?.courses_enrolled || 0 },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between px-[14px] py-3">
              <span className="text-xs text-[#94a3b8]">{row.label}</span>
              <span className="text-xs font-semibold text-[#0f172a]">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Section D: Account (matches mobile accountCard) */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-[#999] uppercase tracking-[0.5px] mb-2">ACCOUNT</p>
        <div className="bg-white rounded-lg border border-[#e2e8f0] overflow-hidden divide-y divide-[#e2e8f0]">
          <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-[#f1f5f9] transition-colors"
            onClick={() => alert('Edit profile will be available in a future update.')}
          >
            <span className="text-base font-medium text-[#0f172a]">Edit profile</span>
            <svg className="w-[18px] h-[18px] text-[#94a3b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
          <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-[#f1f5f9] transition-colors"
            onClick={async () => {
              if (confirm('Are you sure you want to sign out?')) {
                const supabase = createClient();
                await supabase.auth.signOut();
                window.location.href = '/login';
              }
            }}
          >
            <span className="text-base font-medium text-[#0f172a]">Sign out</span>
            <svg className="w-[18px] h-[18px] text-[#94a3b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
