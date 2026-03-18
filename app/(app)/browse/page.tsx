'use client';

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
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
  tags?: string[];
  stats: {
    module_count: number;
    lesson_count: number;
    question_count: number;
  };
  user_progress: {
    status: string;
    readiness_score: number;
    questions_seen: number;
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

type SortOption = 'newest' | 'popular' | 'price_low' | 'price_high' | 'free_first';

const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: 'newest', label: 'Newest' },
  { key: 'popular', label: 'Popular' },
  { key: 'price_low', label: 'Price: Low' },
  { key: 'price_high', label: 'Price: High' },
  { key: 'free_first', label: 'Free First' },
];

function BrowseContent() {
  const searchParams = useSearchParams();
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'All');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [search]);

  const fetchCourses = useCallback(async () => {
    try {
      const res = await fetch('/api/courses');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setAllCourses(data.courses || []);
    } catch (err) {
      console.error('Browse fetch error:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const isSearchActive = debouncedSearch.trim().length > 0;

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of allCourses) {
      if (c.category) counts[c.category] = (counts[c.category] || 0) + 1;
    }
    return counts;
  }, [allCourses]);

  const categoryFilters = useMemo(() => {
    return ['All', ...Object.keys(categoryCounts).sort()];
  }, [categoryCounts]);

  const filteredCourses = useMemo(() => {
    let result = allCourses;
    if (isSearchActive) {
      const q = debouncedSearch.trim().toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          (c.provider_name || '').toLowerCase().includes(q) ||
          (c.creator?.creator_name || '').toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q),
      );
    } else if (activeCategory !== 'All') {
      result = result.filter((c) => c.category === activeCategory);
    }
    return result;
  }, [allCourses, debouncedSearch, activeCategory, isSearchActive]);

  const courses = useMemo(() => {
    const sorted = [...filteredCourses];
    switch (sortBy) {
      case 'popular':
        sorted.sort((a, b) => (b.stats.question_count || 0) - (a.stats.question_count || 0));
        break;
      case 'price_low':
        sorted.sort((a, b) => (a.price_cents ?? 0) - (b.price_cents ?? 0));
        break;
      case 'price_high':
        sorted.sort((a, b) => (b.price_cents ?? 0) - (a.price_cents ?? 0));
        break;
      case 'free_first':
        sorted.sort((a, b) => {
          const aFree = (a.price_cents ?? 0) === 0 ? 0 : 1;
          const bFree = (b.price_cents ?? 0) === 0 ? 0 : 1;
          return aFree - bFree;
        });
        break;
      default:
        break;
    }
    return sorted;
  }, [filteredCourses, sortBy]);

  const resultCountText = useMemo(() => {
    const count = courses.length;
    const label = count === 1 ? 'course' : 'courses';
    if (isSearchActive) return `${count} ${label}`;
    if (activeCategory !== 'All') return `${count} ${label} in ${formatCategoryName(activeCategory)}`;
    return `${count} ${label}`;
  }, [courses.length, activeCategory, isSearchActive]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <h1 className="text-xl font-bold text-gray-900 animate-fade-up">Explore</h1>

      {/* Search */}
      <div className="relative animate-fade-up">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          placeholder="Search courses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-10 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
        />
        {search.length > 0 && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Category pills - hidden when searching */}
      {!isSearchActive && (
        <div className="flex gap-2 overflow-x-auto pb-1 animate-fade-up" style={{ animationDelay: '60ms' }}>
          {categoryFilters.map((cat) => {
            const count = cat === 'All' ? allCourses.length : (categoryCounts[cat] || 0);
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {cat === 'All' ? 'All' : formatCategoryName(cat)} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Results + sort */}
      {!loading && (
        <div className="flex items-center justify-between animate-fade-up">
          <span className="text-xs text-gray-400">{resultCountText}</span>
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h6m0 0l-3-3m3 3L3 10M21 17h-6m0 0l3 3m-3-3l3-3" />
              </svg>
              {SORT_OPTIONS.find((s) => s.key === sortBy)?.label}
            </button>
            {showSortMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden min-w-[140px]">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => { setSortBy(opt.key); setShowSortMenu(false); }}
                    className={`block w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      sortBy === opt.key
                        ? 'bg-gray-50 text-blue-600 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 bg-gray-50 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && courses.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <p className="text-gray-500 text-sm">
            {isSearchActive
              ? `No courses found for '${debouncedSearch.trim()}'`
              : activeCategory !== 'All'
                ? `No courses in ${formatCategoryName(activeCategory)} yet. Check back soon!`
                : 'No courses found'}
          </p>
          {(isSearchActive || activeCategory !== 'All') && (
            <button
              onClick={() => { setSearch(''); setActiveCategory('All'); }}
              className="text-blue-500 text-sm font-medium mt-2"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Course grid (2-col, matching mobile) */}
      {!loading && courses.length > 0 && (
        <div className="grid grid-cols-2 gap-2 animate-fade-up">
          {courses.map((course) => {
            const catStyle = getCatStyle(course.category);
            const isFree = !course.price_cents || course.price_cents === 0;
            return (
              <Link
                key={course.id}
                href={`/course/${course.slug}`}
                className="rounded-[10px] overflow-hidden border border-gray-200/60 hover:border-gray-300 transition-all"
                style={{ backgroundColor: catStyle.bg }}
              >
                {/* Thin color bar */}
                <div className="h-1 w-full" style={{ backgroundColor: catStyle.bar }} />

                {/* Body */}
                <div className="p-3">
                  <div className="flex justify-between items-start gap-1.5 mb-0.5">
                    <h3 className="text-[13px] font-bold text-gray-900 leading-tight line-clamp-2 flex-1">
                      {course.title}
                    </h3>
                    <span
                      className={`text-[9px] font-semibold px-2 py-0.5 rounded-md flex-shrink-0 mt-0.5 ${
                        isFree ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {isFree ? 'Free' : `$${(course.price_cents / 100).toFixed(2)}`}
                    </span>
                  </div>

                  {(course.creator?.creator_name || course.provider_name) && (
                    <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                      by {course.creator?.creator_name || course.provider_name}
                    </p>
                  )}

                  {course.description && (
                    <p className="text-[10px] text-gray-300 mt-0.5 line-clamp-1">{course.description}</p>
                  )}

                  <div className="min-h-[12px]" />

                  <div className="flex items-center gap-1 flex-wrap">
                    {course.stats.question_count > 0 && (
                      <span className="text-[9px] text-gray-400">
                        {course.stats.lesson_count || course.stats.question_count} {(course.stats.lesson_count || course.stats.question_count) === 1 ? 'lesson' : 'lessons'}
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

                  {/* Enrolled indicator */}
                  {course.user_progress && (
                    <div className="mt-2 flex items-center gap-1">
                      <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.round((course.user_progress.readiness_score || 0) * 100)}%` }} />
                      </div>
                      <span className="text-[9px] text-gray-400 flex-shrink-0">enrolled</span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<div className="animate-pulse space-y-4"><div className="h-10 bg-gray-100 rounded-xl" /><div className="h-8 bg-gray-100 rounded-xl w-3/4" /><div className="grid grid-cols-2 gap-2"><div className="h-36 bg-gray-100 rounded-xl" /><div className="h-36 bg-gray-100 rounded-xl" /></div></div>}>
      <BrowseContent />
    </Suspense>
  );
}
