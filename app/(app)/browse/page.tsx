'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  difficulty: string;
  thumbnail_url: string | null;
  price_cents: number;
  provider_name: string | null;
  creator: {
    id: string;
    creator_name: string;
  } | null;
  stats: {
    module_count: number;
    topic_count: number;
    question_count: number;
  };
  user_progress: {
    status: string;
    readiness_score: number;
    questions_seen: number;
  } | null;
}

const categoryFilters = [
  { label: 'All', value: '' },
  { label: 'Certification', value: 'certification' },
  { label: 'Academic', value: 'academic' },
  { label: 'Professional', value: 'professional' },
];

const difficultyColors: Record<string, string> = {
  beginner: 'bg-green-50 text-green-700',
  intermediate: 'bg-amber-50 text-amber-700',
  advanced: 'bg-red-50 text-red-700',
};

function BrowseContent() {
  const searchParams = useSearchParams();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || '');
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const fetchCourses = useCallback(async (reset = false) => {
    try {
      const params = new URLSearchParams();
      if (activeCategory) params.set('category', activeCategory);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (!reset && nextCursor) params.set('cursor', nextCursor);

      const res = await fetch(`/api/courses?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();

      if (reset) {
        setCourses(data.courses || []);
      } else {
        setCourses((prev) => [...prev, ...(data.courses || [])]);
      }
      setHasMore(data.has_more || false);
      setNextCursor(data.next_cursor || null);
    } catch (err) {
      console.error('Browse fetch error:', err);
    }
    setLoading(false);
  }, [activeCategory, searchQuery, nextCursor]);

  useEffect(() => {
    setLoading(true);
    setNextCursor(null);
    fetchCourses(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setNextCursor(null);
    fetchCourses(true);
  }

  // Group courses by category
  const groupedCourses: Record<string, Course[]> = {};
  for (const c of courses) {
    const cat = c.category || 'other';
    if (!groupedCourses[cat]) groupedCourses[cat] = [];
    groupedCourses[cat].push(c);
  }

  function getCategoryLabel(cat: string): string {
    const map: Record<string, string> = {
      certification: 'Certification prep',
      academic: 'Academic',
      professional: 'Professional',
      general_knowledge: 'General knowledge',
    };
    return map[cat] || cat.charAt(0).toUpperCase() + cat.slice(1);
  }

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
    <div className="space-y-5">
      {/* Page title */}
      <h1 className="text-lg font-bold text-gray-900 animate-fade-up">Browse courses</h1>

      {/* Search */}
      <form onSubmit={handleSearch} className="relative animate-fade-up">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          placeholder="Search courses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-300 transition-colors"
        />
      </form>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 animate-fade-up" style={{ animationDelay: '60ms' }}>
        {categoryFilters.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat.value
                ? 'bg-blue-500 text-white'
                : 'bg-gray-50 text-gray-600 border border-gray-200 hover:border-blue-300'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-50 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Course list */}
      {!loading && courses.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-sm">No courses found</p>
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setActiveCategory(''); }}
              className="text-blue-500 text-sm font-medium mt-2"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {!loading && Object.entries(groupedCourses).map(([category, categoryCourses]) => (
        <div key={category} className="space-y-3 animate-fade-up">
          {!activeCategory && (
            <h2 className="text-base font-bold text-gray-900">
              {getCategoryLabel(category)}
            </h2>
          )}
          {categoryCourses.map((course) => (
            <Link
              key={course.id}
              href={`/course/${course.slug}`}
              className="flex items-center gap-3 rounded-2xl bg-white border border-gray-200 p-4 hover:border-blue-300 transition-all"
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-blue-600">{getAbbreviation(course.title)}</span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm truncate">{course.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {course.creator?.creator_name || course.provider_name || 'openED'}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                    {course.stats.question_count} Qs
                  </span>
                  {course.difficulty && (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${difficultyColors[course.difficulty] || 'bg-gray-100 text-gray-600'}`}>
                      {course.difficulty}
                    </span>
                  )}
                  {course.price_cents === 0 && (
                    <span className="text-[10px] font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                      Free
                    </span>
                  )}
                </div>
              </div>

              {/* Progress or arrow */}
              {course.user_progress ? (
                <div className="text-right flex-shrink-0">
                  <span className="text-sm font-bold text-blue-500 font-mono">
                    {Math.round((course.user_progress.readiness_score || 0) * 100)}%
                  </span>
                  <p className="text-[10px] text-gray-400">enrolled</p>
                </div>
              ) : (
                <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              )}
            </Link>
          ))}
        </div>
      ))}

      {/* Load more */}
      {!loading && hasMore && (
        <button
          onClick={() => fetchCourses(false)}
          className="w-full py-2.5 text-sm font-medium text-blue-500 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
        >
          Load more courses
        </button>
      )}
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<div className="animate-pulse space-y-4"><div className="h-10 bg-gray-100 rounded-xl" /><div className="h-8 bg-gray-100 rounded-xl w-3/4" /><div className="h-32 bg-gray-100 rounded-xl" /></div>}>
      <BrowseContent />
    </Suspense>
  );
}
