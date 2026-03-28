'use client';

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

/* ─── Types ─── */

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  difficulty: string;
  price_cents: number;
  creator: { id: string; creator_name: string } | null;
  tags?: string[];
  card_color?: string;
  stats: { module_count: number; lesson_count: number; question_count: number };
  user_progress: { status: string; questions_seen: number } | null;
}

type SortOption = 'newest' | 'popular' | 'price_low' | 'price_high' | 'free_first';

/* ─── Browse Screen ─── */

function BrowseContent() {
  const searchParams = useSearchParams();
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'paid'>('all');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [search]);

  const fetchCourses = useCallback(async () => {
    try {
      const res = await fetch('/api/courses');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setAllCourses(data.courses || []);
    } catch (err) { console.error('Browse fetch error:', err); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const isSearchActive = debouncedSearch.trim().length > 0;

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of allCourses) { if (c.category) counts[c.category] = (counts[c.category] || 0) + 1; }
    return counts;
  }, [allCourses]);

  const categoryFilters = useMemo(() => {
    const cats = Object.keys(categoryCounts).filter(k => categoryCounts[k] >= 1).sort();
    return ['All', ...cats];
  }, [categoryCounts]);

  const filteredCourses = useMemo(() => {
    let result = allCourses;
    if (isSearchActive) {
      const q = debouncedSearch.trim().toLowerCase();
      result = result.filter((c) =>
        c.title.toLowerCase().includes(q) ||
        (c.creator?.creator_name || '').toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q));
    } else if (category !== 'All') {
      result = result.filter((c) => c.category === category);
    }
    if (priceFilter === 'free') result = result.filter((c) => !c.price_cents || c.price_cents === 0);
    else if (priceFilter === 'paid') result = result.filter((c) => c.price_cents && c.price_cents > 0);
    return result;
  }, [allCourses, debouncedSearch, category, isSearchActive, priceFilter]);

  const courses = useMemo(() => {
    const sorted = [...filteredCourses];
    switch (sortBy) {
      case 'popular': break; // default order
      case 'price_low': sorted.sort((a, b) => (a.price_cents ?? 0) - (b.price_cents ?? 0)); break;
      case 'price_high': sorted.sort((a, b) => (b.price_cents ?? 0) - (a.price_cents ?? 0)); break;
      case 'free_first': sorted.sort((a, b) => ((a.price_cents ?? 0) === 0 ? 0 : 1) - ((b.price_cents ?? 0) === 0 ? 0 : 1)); break;
    }
    return sorted;
  }, [filteredCourses, sortBy]);

  function formatCategoryName(cat: string): string {
    return cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return (
    <div className="space-y-3">
      {/* Page title */}
      <h1 style={{ fontSize: 20, fontWeight: 600, color: '#1a1a1a', marginBottom: 14 }}>Explore</h1>

      {/* Search bar */}
      <input
        type="text"
        placeholder="Search courses..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 14px',
          border: '1px solid #e5e5e5',
          borderRadius: 10,
          fontSize: 14,
          outline: 'none',
          backgroundColor: '#fff',
        }}
      />

      {/* Category pills */}
      {!isSearchActive && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4">
          {categoryFilters.map((cat) => {
            const count = cat === 'All' ? allCourses.length : (categoryCounts[cat] || 0);
            const isActive = category === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className="whitespace-nowrap"
                style={{
                  fontSize: 12,
                  padding: '5px 14px',
                  borderRadius: 20,
                  border: `1px solid ${isActive ? '#1a1a1a' : '#e5e5e5'}`,
                  backgroundColor: isActive ? '#1a1a1a' : '#fff',
                  color: isActive ? '#fff' : '#888',
                }}
              >
                {cat === 'All' ? `All (${count})` : `${formatCategoryName(cat)} (${count})`}
              </button>
            );
          })}
        </div>
      )}

      {/* Price pills */}
      <div className="flex gap-1.5">
        {(['all', 'free', 'paid'] as const).map((opt) => {
          const isActive = priceFilter === opt;
          return (
            <button
              key={opt}
              onClick={() => setPriceFilter(opt)}
              style={{
                fontSize: 11,
                padding: '4px 12px',
                borderRadius: 5,
                border: `1px solid ${isActive ? '#1a1a1a' : '#e5e5e5'}`,
                backgroundColor: isActive ? '#1a1a1a' : '#fff',
                color: isActive ? '#fff' : '#888',
              }}
            >
              {opt === 'all' ? 'All Prices' : opt === 'free' ? 'Free' : 'Paid'}
            </button>
          );
        })}
      </div>

      {/* Course count + sort */}
      {!loading && (
        <div className="flex items-center justify-between">
          <span style={{ fontSize: 12, color: '#999' }}>{courses.length} courses</span>
          <button
            onClick={() => {
              const opts: SortOption[] = ['newest', 'popular', 'price_low', 'price_high', 'free_first'];
              const idx = opts.indexOf(sortBy);
              setSortBy(opts[(idx + 1) % opts.length]);
            }}
            style={{ fontSize: 12, color: '#378ADD', cursor: 'pointer', background: 'none', border: 'none' }}
          >
            {sortBy === 'newest' ? 'Newest' : sortBy === 'popular' ? 'Popular' : sortBy === 'price_low' ? 'Price: Low' : sortBy === 'price_high' ? 'Price: High' : 'Free First'}
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-2 gap-2.5">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-[160px] bg-gray-100 rounded-[10px] animate-pulse" />)}
        </div>
      )}

      {/* Empty state */}
      {!loading && courses.length === 0 && (
        <div className="text-center py-16">
          <p style={{ fontSize: 14, color: '#999' }}>
            {isSearchActive ? `No courses found for "${debouncedSearch.trim()}"` : 'No courses found'}
          </p>
        </div>
      )}

      {/* Course grid - 2 cols mobile, 3 cols desktop */}
      {!loading && courses.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
          {courses.map((course) => {
            const isFree = !course.price_cents || course.price_cents === 0;
            const color = course.card_color || '#3b82f6';
            return (
              <Link key={course.id} href={`/course/${course.slug}`}>
                <div
                  style={{
                    border: '1px solid #e5e5e5',
                    borderRadius: 10,
                    overflow: 'hidden',
                  }}
                >
                  {/* Color bar */}
                  <div style={{ height: 4, backgroundColor: color }} />
                  {/* Body */}
                  <div style={{ padding: 12 }}>
                    {/* Title + price */}
                    <div className="flex justify-between items-start gap-2" style={{ marginBottom: 4 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a', lineHeight: 1.3, flex: 1 }} className="line-clamp-2">
                        {course.title}
                      </p>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 4,
                          backgroundColor: isFree ? '#E1F5EE' : '#f0f0f0',
                          color: isFree ? '#0F6E56' : '#1a1a1a',
                          flexShrink: 0,
                        }}
                      >
                        {isFree ? 'Free' : `$${(course.price_cents / 100).toFixed(2)}`}
                      </span>
                    </div>
                    {/* Creator */}
                    {course.creator?.creator_name && (
                      <p style={{ fontSize: 11, color: '#999', marginBottom: 2 }}>{course.creator.creator_name}</p>
                    )}
                    {/* Description */}
                    {course.description && (
                      <p style={{ fontSize: 11, color: '#aaa', marginBottom: 4, lineHeight: 1.3 }} className="line-clamp-2">
                        {course.description}
                      </p>
                    )}
                    {/* Lesson count */}
                    <p style={{ fontSize: 10, color: '#aaa', marginBottom: 4 }}>
                      {course.stats.lesson_count} lessons
                    </p>
                    {/* Tags */}
                    {(course.tags || []).length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {(course.tags || []).slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            style={{
                              fontSize: 9,
                              padding: '1px 5px',
                              backgroundColor: '#f0f0f0',
                              color: '#666',
                              borderRadius: 3,
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
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
    <Suspense fallback={
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-gray-100 rounded-xl" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-[160px] bg-gray-100 rounded-[10px]" />
          <div className="h-[160px] bg-gray-100 rounded-[10px]" />
        </div>
      </div>
    }>
      <BrowseContent />
    </Suspense>
  );
}
