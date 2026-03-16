'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface ProfileData {
  user: { display_name: string; avatar_url: string | null; total_xp: number };
  stats: {
    courses_enrolled: number;
    courses_completed: number;
    total_questions_seen: number;
    total_questions_correct: number;
    accuracy_percent: number;
    total_sessions: number;
  };
  xp: { total: number; level?: number };
  streak: { current_streak: number; longest_streak: number };
  achievements: any[];
}

interface DashboardCourse {
  course_id: string;
  course: { title: string; slug: string };
  readiness_score: number;
  questions_seen: number;
  questions_total: number;
  status: string;
}

function ActivityGrid() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  // Placeholder — would need real data from review_log
  const today = new Date().getDay();
  const active = days.map((_, i) => i < today || (i === today - 1));

  return (
    <div className="flex items-center justify-between gap-1">
      {days.map((day, i) => (
        <div key={day} className="flex flex-col items-center gap-1">
          <span className="text-[10px] text-[#A39B90]">{day}</span>
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
            active[i] ? 'bg-green-100' : 'bg-[#EBE8E2]'
          }`}>
            {active[i] ? (
              <span className="text-green-600 text-xs">✓</span>
            ) : (
              <span className="text-[#D4CFC7] text-xs">·</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
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
          <div className="w-16 h-16 bg-[#EBE8E2] rounded-full" />
          <div className="space-y-2"><div className="h-5 bg-[#EBE8E2] rounded w-32" /><div className="h-3 bg-[#EBE8E2] rounded w-24" /></div>
        </div>
        <div className="h-24 bg-[#EBE8E2] rounded-2xl" />
      </div>
    );
  }

  const user = profile?.user;
  const stats = profile?.stats;
  const streak = profile?.streak;
  const xp = profile?.xp;

  const initials = user?.display_name
    ? user.display_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <div className="space-y-6">
      {/* Avatar + name */}
      <div className="flex items-center gap-4 animate-fade-up">
        <div className="w-16 h-16 rounded-full bg-[#2C2825] flex items-center justify-center flex-shrink-0">
          <span className="text-xl font-bold text-[#F5F3EF]">{initials}</span>
        </div>
        <div>
          <h1 className="text-lg font-bold text-[#2C2825]">{user?.display_name || 'Learner'}</h1>
          <p className="text-xs text-[#6B635A]">Member since 2026</p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="flex gap-3 animate-fade-up" style={{ animationDelay: '60ms' }}>
        <div className="flex-1 rounded-xl bg-[#F5F3EF] border border-[#E8E4DD] p-3 text-center">
          <p className="text-xl font-bold text-[#2C2825]">{streak?.current_streak || 0}</p>
          <p className="text-[10px] text-[#6B635A] mt-0.5">streak days</p>
        </div>
        <div className="flex-1 rounded-xl bg-[#F5F3EF] border border-[#E8E4DD] p-3 text-center">
          <p className="text-xl font-bold text-[#2C2825]">{(xp?.total || 0).toLocaleString()}</p>
          <p className="text-[10px] text-[#6B635A] mt-0.5">total XP</p>
        </div>
        <div className="flex-1 rounded-xl bg-[#F5F3EF] border border-[#E8E4DD] p-3 text-center">
          <p className="text-xl font-bold text-[#2C2825]">{stats?.accuracy_percent || 0}%</p>
          <p className="text-[10px] text-[#6B635A] mt-0.5">accuracy</p>
        </div>
      </div>

      {/* This week */}
      <div className="animate-fade-up" style={{ animationDelay: '120ms' }}>
        <h2 className="text-sm font-bold text-[#2C2825] mb-3">This Week</h2>
        <ActivityGrid />
      </div>

      {/* Courses */}
      {courses.length > 0 && (
        <div className="animate-fade-up" style={{ animationDelay: '180ms' }}>
          <h2 className="text-sm font-bold text-[#2C2825] mb-3">Courses</h2>
          <div className="space-y-2">
            {courses.map((c: any) => {
              const readiness = Math.round((c.readiness_score || 0) * 100);
              return (
                <Link key={c.course_id} href={`/course/${c.course.slug}/path`} className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#E8E4DD] hover:border-[#D4CFC7] transition-all">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#2C2825] truncate">{c.course.title}</p>
                    <div className="w-full h-1 bg-[#EBE8E2] rounded-full overflow-hidden mt-1.5">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${readiness}%` }} />
                    </div>
                  </div>
                  <span className="text-xs text-[#6B635A] ml-3 flex-shrink-0">{readiness}%</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="animate-fade-up" style={{ animationDelay: '240ms' }}>
        <h2 className="text-sm font-bold text-[#2C2825] mb-3">Stats</h2>
        <div className="rounded-xl bg-[#F5F3EF] border border-[#E8E4DD] divide-y divide-[#E8E4DD]">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-[#6B635A]">Questions answered</span>
            <span className="text-sm font-bold text-[#2C2825] font-mono">{(stats?.total_questions_seen || 0).toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-[#6B635A]">Overall accuracy</span>
            <span className="text-sm font-bold text-[#2C2825] font-mono">{stats?.accuracy_percent || 0}%</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-[#6B635A]">Sessions completed</span>
            <span className="text-sm font-bold text-[#2C2825] font-mono">{stats?.total_sessions || 0}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-[#6B635A]">Longest streak</span>
            <span className="text-sm font-bold text-[#2C2825] font-mono">{streak?.longest_streak || 0} days</span>
          </div>
        </div>
      </div>

      {/* Become a creator */}
      <div className="animate-fade-up" style={{ animationDelay: '300ms' }}>
        <Link href="/creator" className="block w-full py-3 rounded-xl bg-[#2C2825] text-[#F5F3EF] font-semibold text-sm text-center hover:bg-[#1A1816] transition-colors">
          Become a Creator
        </Link>
      </div>

      {/* Settings & sign out */}
      <div className="flex items-center justify-between pt-4 border-t border-[#E8E4DD] animate-fade-up" style={{ animationDelay: '360ms' }}>
        <button className="text-sm text-[#6B635A] hover:text-[#2C2825]">Settings</button>
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
