'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

/* ─── Types ─── */

interface ProfileData {
  user: { display_name: string; avatar_url: string | null; created_at?: string; email?: string };
  stats: {
    courses_enrolled: number; courses_completed: number;
    total_questions_seen: number; total_questions_correct: number;
    accuracy_percent: number; total_sessions: number;
  };
}

interface DashboardCourse {
  id: string; course_id: string;
  course: { id: string; title: string; slug: string; card_color?: string };
  progress_percent?: number;
  status?: string;
  last_session_at: string | null;
}

/* ─── Component ─── */

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [courses, setCourses] = useState<DashboardCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [profileRes, dashRes] = await Promise.all([fetch('/api/profile'), fetch('/api/dashboard')]);
        if (profileRes.ok) setProfile(await profileRes.json());
        if (dashRes.ok) { const d = await dashRes.json(); setCourses(d.active_courses || []); }

        // Get email from Supabase auth
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) setEmail(user.email);
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="flex flex-col items-center gap-3 py-6">
          <div className="w-16 h-16 bg-gray-100 rounded-full" />
          <div className="h-5 bg-gray-100 rounded w-32" />
          <div className="h-3 bg-gray-100 rounded w-24" />
        </div>
        <div className="flex gap-3 justify-center">
          <div className="w-20 h-14 bg-gray-100 rounded-lg" />
          <div className="w-20 h-14 bg-gray-100 rounded-lg" />
          <div className="w-20 h-14 bg-gray-100 rounded-lg" />
        </div>
      </div>
    );
  }

  const user = profile?.user;
  const stats = profile?.stats;
  const initial = user?.display_name?.charAt(0)?.toUpperCase() || '?';

  // Count lessons done from courses
  const lessonsDone = stats?.total_questions_correct || 0; // Using questions as proxy; ideally from separate endpoint

  return (
    <div className="space-y-5">
      {/* Profile header - centered */}
      <div className="flex flex-col items-center" style={{ paddingTop: 8, paddingBottom: 16 }}>
        {/* Avatar */}
        <div
          style={{
            width: 64, height: 64, borderRadius: '50%',
            backgroundColor: '#E6F1FB',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 22, fontWeight: 600, color: '#185FA5' }}>{initial}</span>
        </div>
        {/* Name */}
        <p style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a', marginBottom: 2 }}>
          {user?.display_name || 'Learner'}
        </p>
        {/* Email */}
        <p style={{ fontSize: 13, color: '#999', marginBottom: 16 }}>
          {email || user?.email || ''}
        </p>

        {/* Stats row */}
        <div className="flex items-center justify-center" style={{ gap: 24 }}>
          <div className="text-center">
            <p style={{ fontSize: 20, fontWeight: 600, color: '#1a1a1a' }}>{stats?.courses_enrolled || 0}</p>
            <p style={{ fontSize: 11, color: '#999' }}>Courses</p>
          </div>
          <div className="text-center">
            <p style={{ fontSize: 20, fontWeight: 600, color: '#1a1a1a' }}>{stats?.courses_completed || 0}</p>
            <p style={{ fontSize: 11, color: '#999' }}>Lessons done</p>
          </div>
          <div className="text-center">
            <p style={{ fontSize: 20, fontWeight: 600, color: '#1a1a1a' }}>{stats?.total_questions_seen || 0}</p>
            <p style={{ fontSize: 11, color: '#999' }}>Questions</p>
          </div>
        </div>
      </div>

      {/* Enrolled courses section */}
      <div>
        <p style={{
          fontSize: 13, fontWeight: 600, color: '#888',
          textTransform: 'uppercase', letterSpacing: 0.5,
          marginBottom: 12,
        }}>
          Enrolled courses
        </p>

        {courses.length > 0 ? (
          <div>
            {[...courses].sort((a, b) => {
              const aTime = a.last_session_at ? new Date(a.last_session_at).getTime() : 0;
              const bTime = b.last_session_at ? new Date(b.last_session_at).getTime() : 0;
              return bTime - aTime;
            }).map((item) => {
              const pct = Math.min(100, item.progress_percent ?? 0);
              const isComplete = pct >= 100 || item.status === 'completed';
              const color = item.course.card_color || '#3b82f6';
              return (
                <Link key={item.id} href={`/course/${item.course.slug}/path`} className="block">
                  <div
                    className="flex items-center gap-3"
                    style={{ padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}
                  >
                    {/* Color bar */}
                    <div style={{ width: 4, height: 32, backgroundColor: color, borderRadius: 2, flexShrink: 0 }} />
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }} className="truncate">
                        {item.course.title}
                      </p>
                      <p style={{ fontSize: 11, color: '#999' }}>{pct}% complete</p>
                    </div>
                    {/* Badge */}
                    <span
                      style={{
                        fontSize: 10, padding: '2px 8px', borderRadius: 4, flexShrink: 0,
                        backgroundColor: isComplete ? '#E1F5EE' : '#E6F1FB',
                        color: isComplete ? '#0F6E56' : '#185FA5',
                      }}
                    >
                      {isComplete ? 'Completed' : 'Active'}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center" style={{ padding: '24px 0' }}>
            <p style={{ fontSize: 13, color: '#999', marginBottom: 12 }}>No courses enrolled yet</p>
            <Link
              href="/browse"
              style={{
                display: 'inline-block',
                backgroundColor: '#1a1a1a', color: '#fff',
                fontSize: 13, fontWeight: 500,
                padding: '8px 20px', borderRadius: 8,
              }}
            >
              Browse courses
            </Link>
          </div>
        )}
      </div>

      {/* Account section */}
      <div style={{ borderTop: '1px solid #eee', paddingTop: 16 }}>
        <p style={{
          fontSize: 13, fontWeight: 600, color: '#888',
          textTransform: 'uppercase', letterSpacing: 0.5,
          marginBottom: 12,
        }}>
          Account
        </p>

        <div>
          {/* Edit profile */}
          <button
            className="w-full flex items-center justify-between"
            style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0', background: 'none', border: 'none', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: '#f0f0f0', cursor: 'pointer' }}
            onClick={() => alert('Edit profile will be available in a future update.')}
          >
            <span style={{ fontSize: 14, color: '#555' }}>Edit profile</span>
            <span style={{ fontSize: 14, color: '#ccc' }}>&rsaquo;</span>
          </button>

          {/* Notification preferences */}
          <button
            className="w-full flex items-center justify-between"
            style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0', background: 'none', border: 'none', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: '#f0f0f0', cursor: 'pointer' }}
            onClick={() => alert('Notification preferences coming soon.')}
          >
            <span style={{ fontSize: 14, color: '#555' }}>Notification preferences</span>
            <span style={{ fontSize: 14, color: '#ccc' }}>&rsaquo;</span>
          </button>

          {/* Purchase history */}
          <button
            className="w-full flex items-center justify-between"
            style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0', background: 'none', border: 'none', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: '#f0f0f0', cursor: 'pointer' }}
            onClick={() => alert('Purchase history coming soon.')}
          >
            <span style={{ fontSize: 14, color: '#555' }}>Purchase history</span>
            <span style={{ fontSize: 14, color: '#ccc' }}>&rsaquo;</span>
          </button>

          {/* Sign out */}
          <button
            className="w-full flex items-center justify-between"
            style={{ padding: '12px 0', background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={async () => {
              if (confirm('Are you sure you want to sign out?')) {
                const supabase = createClient();
                await supabase.auth.signOut();
                window.location.href = '/';
              }
            }}
          >
            <span style={{ fontSize: 14, color: '#E24B4A' }}>Sign out</span>
            <span style={{ fontSize: 14, color: '#ccc' }}>&rsaquo;</span>
          </button>
        </div>
      </div>
    </div>
  );
}
