'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface ProfileData {
  display_name: string;
  email: string;
  created_at: string;
  avatar_url: string | null;
}

interface ActiveCourse {
  course_id: string;
  course_slug: string;
  course_title: string;
  status: string;
  readiness_score: number;
  questions_seen: number;
  questions_total: number;
  questions_correct: number;
  sessions_completed: number;
  enrolled_at: string;
  completed_at: string | null;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [activeCourses, setActiveCourses] = useState<ActiveCourse[]>([]);
  const [completedCourses, setCompletedCourses] = useState<ActiveCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const [profileRes, dashboardRes] = await Promise.all([
          fetch('/api/profile'),
          fetch('/api/dashboard'),
        ]);

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData);
        }

        if (dashboardRes.ok) {
          const dashboardData = await dashboardRes.json();
          const courses: ActiveCourse[] = (dashboardData.active_courses || []).map((uc: any) => ({
            course_id: uc.course_id,
            course_slug: uc.course?.slug,
            course_title: uc.course?.title,
            status: uc.status,
            readiness_score: uc.readiness_score,
            questions_seen: uc.questions_seen,
            questions_total: uc.questions_total || 0,
            questions_correct: uc.questions_correct || 0,
            sessions_completed: uc.sessions_completed,
            enrolled_at: uc.enrolled_at,
            completed_at: uc.completed_at || null,
          }));
          setActiveCourses(courses.filter((c) => c.status === 'active'));
          setCompletedCourses(courses.filter((c) => c.status === 'completed'));
        }
      } catch (err) {
        console.error('Profile fetch error:', err);
      }
      setLoading(false);
    }
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full" />
          <div className="space-y-2">
            <div className="h-5 bg-gray-100 rounded w-32" />
            <div className="h-3 bg-gray-100 rounded w-24" />
          </div>
        </div>
        <div className="h-24 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  const initials = profile?.display_name
    ? profile.display_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const joinDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '';

  const allCourses = [...activeCourses, ...completedCourses];
  const totalQuestions = allCourses.reduce((s, c) => s + c.questions_seen, 0);
  const totalCorrect = allCourses.reduce((s, c) => s + c.questions_correct, 0);
  const accuracyPct = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  function getAbbreviation(title: string): string {
    return title
      .split(/[\s-]+/)
      .filter((w) => w.length > 1)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">Profile</h1>
        <button
          onClick={async () => {
            const supabase = createClient();
            await supabase.auth.signOut();
            window.location.href = '/login';
          }}
          className="text-sm font-medium text-red-500 hover:text-red-600"
        >
          Log out
        </button>
      </div>

      {/* Avatar and info */}
      <div className="flex items-center gap-4 animate-fade-up">
        <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <span className="text-lg font-bold text-blue-600">{initials}</span>
        </div>
        <div>
          <h2 className="font-bold text-gray-900">{profile?.display_name || 'Learner'}</h2>
          {joinDate && <p className="text-xs text-gray-500">Joined {joinDate}</p>}
        </div>
      </div>

      {/* Active courses */}
      {activeCourses.length > 0 && (
        <div className="space-y-3 animate-fade-up" style={{ animationDelay: '60ms' }}>
          <h3 className="text-sm font-bold text-gray-900">Active courses</h3>
          {activeCourses.map((course) => {
            const readinessPct = Math.round((course.readiness_score || 0) * 100);
            return (
              <Link
                key={course.course_id}
                href={`/course/${course.course_slug}/path`}
                className="block rounded-2xl bg-white border border-gray-200 p-4 hover:border-blue-300 transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-blue-600">{getAbbreviation(course.course_title)}</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm">{course.course_title}</h4>
                </div>
                {/* Progress bar */}
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${readinessPct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{readinessPct}% ready</span>
                  <span>{course.questions_seen} seen</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Course history */}
      {completedCourses.length > 0 && (
        <div className="space-y-3 animate-fade-up" style={{ animationDelay: '120ms' }}>
          <h3 className="text-sm font-bold text-gray-900">Course history</h3>
          {completedCourses.map((course) => {
            const completedDate = course.completed_at
              ? new Date(course.completed_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : null;
            const readinessPct = Math.round((course.readiness_score || 0) * 100);

            return (
              <div
                key={course.course_id}
                className="rounded-xl bg-white border border-gray-200 p-3"
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-900">{course.course_title}</p>
                  <span className="text-[10px] font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                    Completed
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Readiness: {readinessPct}%
                  {completedDate && ` · Completed ${completedDate}`}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Stats */}
      <div className="animate-fade-up" style={{ animationDelay: '180ms' }}>
        <h3 className="text-sm font-bold text-gray-900 mb-3">Stats</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900 font-mono">{totalQuestions.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Questions answered</p>
          </div>
          <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900 font-mono">{accuracyPct}%</p>
            <p className="text-xs text-gray-500 mt-1">Accuracy</p>
          </div>
        </div>
      </div>

      {/* No courses */}
      {allCourses.length === 0 && (
        <div className="text-center py-8 animate-fade-up">
          <p className="text-gray-500 text-sm mb-4">No courses yet</p>
          <Link
            href="/browse"
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            Browse courses
          </Link>
        </div>
      )}
    </div>
  );
}
