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

const categories = [
  { label: 'Certification', value: 'certification' },
  { label: 'Academic', value: 'academic' },
  { label: 'Professional', value: 'professional' },
  { label: 'General Knowledge', value: 'general_knowledge' },
];

export default function HomePage() {
  const [activeCourses, setActiveCourses] = useState<ActiveCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
        <div className="h-8 bg-gray-100 rounded-xl w-48" />
        <div className="h-4 bg-gray-100 rounded w-32" />
        <div className="h-40 bg-gray-100 rounded-2xl" />
        <div className="h-40 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  const hasActiveCourses = activeCourses.length > 0;

  return (
    <div className="space-y-6">
      {hasActiveCourses ? (
        <>
          {/* Welcome back header */}
          <div className="animate-fade-up">
            <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          </div>

          {/* Active course cards */}
          <div className="space-y-3">
            {activeCourses.map((uc) => {
              const readinessPct = Math.round((uc.readiness_score || 0) * 100);
              return (
                <div
                  key={uc.id}
                  className="rounded-2xl bg-white border border-gray-200 p-4 animate-fade-up"
                >
                  {/* Title row with active badge */}
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900">{uc.course.title}</h3>
                    <span className="text-[10px] font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                      active
                    </span>
                  </div>

                  {/* Current topic */}
                  {uc.current_topic_title && (
                    <p className="text-sm text-gray-500 mb-3">
                      {uc.current_topic_title}
                    </p>
                  )}

                  {/* Stats row */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                    <span>{readinessPct}% ready</span>
                    <span>{uc.questions_seen}/{uc.questions_total} seen</span>
                  </div>

                  {/* Continue studying button */}
                  <Link
                    href={`/course/${uc.course.slug}/path`}
                    className="block w-full bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold py-3 rounded-xl text-center transition-colors"
                  >
                    Continue studying
                  </Link>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* Empty state - matches wireframe 12 */
        <div className="text-center py-12 animate-fade-up">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-5">
            <span className="text-2xl text-gray-400">?</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Welcome to openED</h1>
          <p className="text-sm text-gray-500 mb-6">
            You have not enrolled in any courses yet.<br />
            Browse our catalog to find your first course.
          </p>
          <Link
            href="/browse"
            className="block w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl text-center transition-colors mb-4"
          >
            Browse courses
          </Link>
          <p className="text-sm text-gray-400 mb-3">Or search for something specific</p>
        </div>
      )}

      {/* Search */}
      <div className="animate-fade-up">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                window.location.href = `/browse?search=${encodeURIComponent(searchQuery.trim())}`;
              }
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-300 transition-colors"
          />
        </div>
      </div>

      {hasActiveCourses && (
        <>
          {/* Category chips */}
          <div className="animate-fade-up">
            <h2 className="text-base font-bold text-gray-900 mb-3">Browse categories</h2>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Link
                  key={cat.value}
                  href={`/browse?category=${cat.value}`}
                  className="px-4 py-2 rounded-full bg-gray-50 border border-gray-200 text-sm font-medium text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
                >
                  {cat.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Popular courses */}
          <div className="animate-fade-up">
            <h2 className="text-base font-bold text-gray-900 mb-3">Popular courses</h2>
            <Link
              href="/browse"
              className="flex items-center gap-3 rounded-2xl bg-white border border-gray-200 p-4 hover:border-blue-300 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-blue-600">A+</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm">CompTIA A+</h3>
                <p className="text-xs text-gray-500">By Jason Dion</p>
              </div>
              <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
