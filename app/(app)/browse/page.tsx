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
  stats: { module_count: number; lesson_count: number; question_count: number };
  user_progress: { status: string; questions_seen: number } | null;
}

/* ─── Category styles (same as mobile category-styles.ts) ─── */

const CB = {
  blue: '#f8faff', purple: '#faf8ff', teal: '#f5faf8', amber: '#fffbf5',
  pink: '#fdf5fa', slate: '#f8f9fb', red: '#fdf6f6', green: '#f5faf8',
} as const;

interface CatStyle {
  badgeBg: string; badgeText: string; barColor: string; cardBg: string;
}

const CATEGORY_MAP: Record<string, CatStyle> = {
  cybersecurity:     { badgeBg: '#E6F1FB', badgeText: '#185FA5', barColor: '#3b82f6', cardBg: CB.blue },
  certification:     { badgeBg: '#E6F1FB', badgeText: '#185FA5', barColor: '#3b82f6', cardBg: CB.blue },
  'cloud computing': { badgeBg: '#E0F2FE', badgeText: '#0369A1', barColor: '#0ea5e9', cardBg: CB.blue },
  networking:        { badgeBg: '#FAEEDA', badgeText: '#854F0B', barColor: '#f59e0b', cardBg: CB.amber },
  'computer science':{ badgeBg: '#EEEDFE', badgeText: '#534AB7', barColor: '#8b5cf6', cardBg: CB.purple },
  'data science':    { badgeBg: '#E0F2FE', badgeText: '#0369A1', barColor: '#06b6d4', cardBg: CB.blue },
  'ai & machine learning': { badgeBg: '#EEEDFE', badgeText: '#534AB7', barColor: '#a855f7', cardBg: CB.purple },
  devops:            { badgeBg: '#FEE2E2', badgeText: '#991B1B', barColor: '#ef4444', cardBg: CB.red },
  mathematics:       { badgeBg: '#E1F5EE', badgeText: '#0F6E56', barColor: '#0d9488', cardBg: CB.teal },
  physics:           { badgeBg: '#E6F1FB', badgeText: '#185FA5', barColor: '#6366f1', cardBg: CB.blue },
  biology:           { badgeBg: '#E1F5EE', badgeText: '#0F6E56', barColor: '#22c55e', cardBg: CB.green },
  business:          { badgeBg: '#F1F5F9', badgeText: '#475569', barColor: '#64748b', cardBg: CB.slate },
  marketing:         { badgeBg: '#FCE7F3', badgeText: '#9D174D', barColor: '#ec4899', cardBg: CB.pink },
  finance:           { badgeBg: '#E1F5EE', badgeText: '#0F6E56', barColor: '#10b981', cardBg: CB.green },
  music:             { badgeBg: '#FCE7F3', badgeText: '#9D174D', barColor: '#ec4899', cardBg: CB.pink },
  design:            { badgeBg: '#EEEDFE', badgeText: '#534AB7', barColor: '#a855f7', cardBg: CB.purple },
  languages:         { badgeBg: '#E0F2FE', badgeText: '#0369A1', barColor: '#0ea5e9', cardBg: CB.blue },
  cooking:           { badgeBg: '#FEF3C7', badgeText: '#92400E', barColor: '#f59e0b', cardBg: CB.amber },
  general_knowledge: { badgeBg: '#F1F5F9', badgeText: '#64748b', barColor: '#64748b', cardBg: CB.slate },
  general:           { badgeBg: '#F1F5F9', badgeText: '#64748b', barColor: '#64748b', cardBg: CB.slate },
  academic:          { badgeBg: '#E6F1FB', badgeText: '#185FA5', barColor: '#0d9488', cardBg: CB.blue },
};

const DEFAULT_CAT: CatStyle = { badgeBg: '#F1F5F9', badgeText: '#64748b', barColor: '#64748b', cardBg: '#fafafa' };

function getCatStyle(cat: string | undefined | null): CatStyle {
  if (!cat) return DEFAULT_CAT;
  const key = cat.toLowerCase().replace(/\s+/g, '_');
  return CATEGORY_MAP[key] || CATEGORY_MAP[cat.toLowerCase()] || DEFAULT_CAT;
}

const TAG_MAP: Record<string, { color: string; bg: string }> = {
  'certification prep': { color: '#185FA5', bg: '#E6F1FB' },
  'beginner friendly': { color: '#0F6E56', bg: '#E1F5EE' },
  'advanced': { color: '#991B1B', bg: '#FEE2E2' },
  'hands-on': { color: '#854F0B', bg: '#FAEEDA' },
  'youtube companion': { color: '#991B1B', bg: '#FEE2E2' },
  'quick course': { color: '#534AB7', bg: '#EEEDFE' },
};

function getTagStyle(tag: string) { return TAG_MAP[tag.toLowerCase()] || { color: '#475569', bg: '#F1F5F9' }; }

const CATEGORY_DISPLAY: Record<string, string> = {
  general_knowledge: 'General', certification: 'Certification', cybersecurity: 'Cybersecurity',
  cloud_computing: 'Cloud Computing', computer_science: 'Computer Science',
  data_science: 'Data Science', 'ai_&_machine_learning': 'AI & ML',
  project_management: 'Project Management', 'health_&_fitness': 'Health & Fitness',
};

function formatCategoryName(cat: string): string {
  const key = cat.toLowerCase().replace(/\s+/g, '_');
  if (CATEGORY_DISPLAY[key]) return CATEGORY_DISPLAY[key];
  return cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

type SortOption = 'newest' | 'popular' | 'price_low' | 'price_high' | 'free_first';
const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: 'newest', label: 'Newest' }, { key: 'popular', label: 'Popular' },
  { key: 'price_low', label: 'Price: Low' }, { key: 'price_high', label: 'Price: High' },
  { key: 'free_first', label: 'Free First' },
];

/* ─── Browse Screen (mirrors mobile browse.tsx exactly) ─── */

function BrowseContent() {
  const searchParams = useSearchParams();
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showSortMenu, setShowSortMenu] = useState(false);
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

  const categoryFilters = useMemo(() => ['All', ...Object.keys(categoryCounts).sort()], [categoryCounts]);

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
    // Price filter
    if (priceFilter === 'free') result = result.filter((c) => !c.price_cents || c.price_cents === 0);
    else if (priceFilter === 'paid') result = result.filter((c) => c.price_cents && c.price_cents > 0);
    return result;
  }, [allCourses, debouncedSearch, category, isSearchActive, priceFilter]);

  const courses = useMemo(() => {
    const sorted = [...filteredCourses];
    switch (sortBy) {
      case 'popular': sorted.sort((a, b) => ((b.stats as any).enrollment_count || b.stats.question_count || 0) - ((a.stats as any).enrollment_count || a.stats.question_count || 0)); break;
      case 'price_low': sorted.sort((a, b) => (a.price_cents ?? 0) - (b.price_cents ?? 0)); break;
      case 'price_high': sorted.sort((a, b) => (b.price_cents ?? 0) - (a.price_cents ?? 0)); break;
      case 'free_first': sorted.sort((a, b) => ((a.price_cents ?? 0) === 0 ? 0 : 1) - ((b.price_cents ?? 0) === 0 ? 0 : 1)); break;
    }
    return sorted;
  }, [filteredCourses, sortBy]);

  const resultCountText = useMemo(() => {
    const count = courses.length;
    const label = count === 1 ? 'course' : 'courses';
    if (isSearchActive) return `${count} ${label}`;
    if (category !== 'All') return `${count} ${label} in ${formatCategoryName(category)}`;
    return `${count} ${label}`;
  }, [courses.length, category, isSearchActive]);

  return (
    <div className="space-y-3">
      {/* Header (matches mobile: "Explore", bold 20px) */}
      <h1 className="text-xl font-bold text-[#0f172a]">Explore</h1>

      {/* Search row (matches mobile searchRow) */}
      <div className="flex items-center gap-2 px-3 bg-[#f1f5f9] rounded-[10px] min-h-[44px]">
        <svg className="w-[18px] h-[18px] text-[#94a3b8] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input type="text" placeholder="Search courses..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="flex-1 text-base text-[#0f172a] bg-transparent py-2 focus:outline-none placeholder:text-[#94a3b8]" />
        {search.length > 0 && (
          <button onClick={() => setSearch('')} className="text-[#94a3b8] hover:text-[#64748b]">
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Category pills (matches mobile: bg #f1f5f9 inactive, bg primary active) */}
      {!isSearchActive && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          {categoryFilters.map((cat) => {
            const count = cat === 'All' ? allCourses.length : (categoryCounts[cat] || 0);
            const isActive = category === cat;
            return (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive ? 'bg-[#3B82F6] text-white' : 'bg-[#f1f5f9] text-[#475569]'
                }`}
              >
                {cat === 'All' ? 'All' : formatCategoryName(cat)} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Free / Paid toggle */}
      <div className="flex gap-2">
        {(['all', 'free', 'paid'] as const).map((opt) => (
          <button key={opt} onClick={() => setPriceFilter(opt)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              priceFilter === opt ? 'bg-[#2C2825] text-[#F5F3EF]' : 'bg-[#f1f5f9] text-[#475569]'
            }`}
          >
            {opt === 'all' ? 'All Prices' : opt === 'free' ? 'Free' : 'Paid'}
          </button>
        ))}
      </div>

      {/* Results bar + sort (matches mobile resultsBar) */}
      {!loading && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#94a3b8]">{resultCountText}</span>
          <div className="relative">
            <button onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-1 px-[10px] py-1 rounded-md bg-[#f1f5f9] text-xs font-medium text-[#475569]"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h6m0 0l-3-3m3 3L3 10M21 17h-6m0 0l3 3m-3-3l3-3" />
              </svg>
              {SORT_OPTIONS.find((s) => s.key === sortBy)?.label}
            </button>
            {showSortMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-[#e2e8f0] rounded-[10px] shadow-lg z-50 overflow-hidden min-w-[140px]">
                {SORT_OPTIONS.map((opt) => (
                  <button key={opt.key} onClick={() => { setSortBy(opt.key); setShowSortMenu(false); }}
                    className={`block w-full text-left px-4 py-[10px] text-[13px] transition-colors ${
                      sortBy === opt.key ? 'bg-[#f1f5f9] text-[#3B82F6] font-semibold' : 'text-[#475569]'
                    }`}
                  >{opt.label}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-[140px] bg-[#f1f5f9] rounded-[10px] animate-pulse" />)}
        </div>
      )}

      {/* Empty state (matches mobile) */}
      {!loading && courses.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <svg className="w-10 h-10 text-[#94a3b8] mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <p className="text-base text-[#94a3b8] text-center">
            {isSearchActive ? `No courses found for '${debouncedSearch.trim()}'`
              : category !== 'All' ? `No courses in ${formatCategoryName(category)} yet.\nCheck back soon!`
              : 'No courses found'}
          </p>
        </div>
      )}

      {/* Course grid (2-col, matches mobile DiscoveryCourseCard layout) */}
      {!loading && courses.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {courses.map((course) => {
            const catStyle = getCatStyle(course.category);
            const isFree = !course.price_cents || course.price_cents === 0;
            return (
              <Link key={course.id} href={`/course/${course.slug}`}
                className="rounded-[10px] overflow-hidden border-[0.5px] border-[#e8e4dd] min-h-[140px] flex flex-col hover:opacity-92 transition-opacity"
                style={{ backgroundColor: catStyle.cardBg }}
              >
                <div className="h-1 w-full" style={{ backgroundColor: catStyle.barColor }} />
                <div className="flex-1 p-[11px] flex flex-col">
                  <div className="flex justify-between items-start gap-1.5">
                    <h3 className="flex-1 text-[13px] font-bold text-[#1e293b] leading-[17px] line-clamp-2">{course.title}</h3>
                    <span className={`text-[9px] font-semibold px-[7px] py-0.5 rounded-[5px] mt-px flex-shrink-0 ${
                      isFree ? 'bg-[#E1F5EE] text-[#0F6E56]' : 'bg-[#f1f5f9] text-[#1e293b]'
                    }`}>{isFree ? 'Free' : `$${(course.price_cents / 100).toFixed(2)}`}</span>
                  </div>
                  {course.creator?.creator_name && (
                    <p className="text-[10px] text-[#94a3b8] mt-[3px] truncate">by {course.creator.creator_name}</p>
                  )}
                  {course.description && (
                    <p className="text-[10px] text-[#b0abb5] mt-0.5 leading-[13px] line-clamp-1">{course.description}</p>
                  )}
                  <div className="flex-1 min-h-[6px]" />
                  <div className="flex items-center gap-1 flex-wrap">
                    {(course.stats.lesson_count || course.stats.question_count) > 0 && (
                      <span className="text-[9px] text-[#94a3b8]">
                        {course.stats.lesson_count || course.stats.question_count} lessons
                      </span>
                    )}
                    {course.category && (
                      <span className="text-[8px] font-medium px-1.5 py-px rounded-[5px]"
                        style={{ backgroundColor: catStyle.badgeBg, color: catStyle.badgeText }}>
                        {formatCategoryName(course.category)}
                      </span>
                    )}
                    {(course.tags || []).slice(0, 2).map((tag) => {
                      const ts = getTagStyle(tag);
                      return <span key={tag} className="text-[8px] font-medium px-1.5 py-px rounded-[5px]" style={{ backgroundColor: ts.bg, color: ts.color }}>{tag}</span>;
                    })}
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
    <Suspense fallback={<div className="animate-pulse space-y-4"><div className="h-10 bg-gray-100 rounded-xl" /><div className="grid grid-cols-2 gap-2"><div className="h-[140px] bg-gray-100 rounded-[10px]" /><div className="h-[140px] bg-gray-100 rounded-[10px]" /></div></div>}>
      <BrowseContent />
    </Suspense>
  );
}
