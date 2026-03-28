'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

/* ─── Types ─── */

interface DashboardCourse {
  id: string;
  course_id: string;
  course: {
    id: string;
    title: string;
    slug: string;
    description: string;
    category: string;
    difficulty: string;
  };
  status: string;
  questions_seen: number;
  questions_total: number;
  lessons_total: number;
  sessions_completed: number;
  last_session_at: string | null;
  enrolled_at: string;
  progress_percent?: number;
  resume_point?: {
    module_title: string;
    lesson_title: string;
    lesson_id: string;
    step_index: number;
    step_total: number;
  } | null;
}

interface BrowseCourse {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  difficulty: string;
  price_cents: number | null;
  tags?: string[];
  stats: {
    module_count: number;
    lesson_count: number;
    question_count: number;
  };
  user_progress: {
    status: string;
    sessions_completed: number;
  } | null;
}

/* ─── Category styles (mirroring mobile category-styles.ts) ─── */

const CB = {
  blue: '#f8faff', purple: '#faf8ff', teal: '#f5faf8', amber: '#fffbf5',
  pink: '#fdf5fa', slate: '#f8f9fb', red: '#fdf6f6', green: '#f5faf8',
} as const;

interface CatStyle {
  icon: string; bgColor: string; textColor: string; badgeBg: string;
  badgeText: string; barColor: string; cardBg: string;
  gradientColors: [string, string];
}

const CATEGORY_MAP: Record<string, CatStyle> = {
  cybersecurity:       { icon: 'shield-checkmark', bgColor: '#E6F1FB', textColor: '#185FA5', badgeBg: '#E6F1FB', badgeText: '#185FA5', barColor: '#3b82f6', cardBg: CB.blue, gradientColors: ['#3b82f6', '#1d4ed8'] },
  certification:       { icon: 'shield-checkmark', bgColor: '#E6F1FB', textColor: '#185FA5', badgeBg: '#E6F1FB', badgeText: '#185FA5', barColor: '#3b82f6', cardBg: CB.blue, gradientColors: ['#3b82f6', '#1d4ed8'] },
  'cloud computing':   { icon: 'cloud', bgColor: '#E0F2FE', textColor: '#0369A1', badgeBg: '#E0F2FE', badgeText: '#0369A1', barColor: '#0ea5e9', cardBg: CB.blue, gradientColors: ['#0ea5e9', '#0284c7'] },
  networking:          { icon: 'globe', bgColor: '#FAEEDA', textColor: '#854F0B', badgeBg: '#FAEEDA', badgeText: '#854F0B', barColor: '#f59e0b', cardBg: CB.amber, gradientColors: ['#f59e0b', '#d97706'] },
  'computer science':  { icon: 'code-slash', bgColor: '#EEEDFE', textColor: '#534AB7', badgeBg: '#EEEDFE', badgeText: '#534AB7', barColor: '#8b5cf6', cardBg: CB.purple, gradientColors: ['#8b5cf6', '#6d28d9'] },
  'data science':      { icon: 'bar-chart', bgColor: '#E0F2FE', textColor: '#0369A1', badgeBg: '#E0F2FE', badgeText: '#0369A1', barColor: '#06b6d4', cardBg: CB.blue, gradientColors: ['#06b6d4', '#0891b2'] },
  'ai & machine learning': { icon: 'hardware-chip', bgColor: '#EEEDFE', textColor: '#534AB7', badgeBg: '#EEEDFE', badgeText: '#534AB7', barColor: '#a855f7', cardBg: CB.purple, gradientColors: ['#a855f7', '#9333ea'] },
  devops:              { icon: 'git-branch', bgColor: '#FEE2E2', textColor: '#991B1B', badgeBg: '#FEE2E2', badgeText: '#991B1B', barColor: '#ef4444', cardBg: CB.red, gradientColors: ['#ef4444', '#dc2626'] },
  mathematics:         { icon: 'calculator', bgColor: '#E1F5EE', textColor: '#0F6E56', badgeBg: '#E1F5EE', badgeText: '#0F6E56', barColor: '#0d9488', cardBg: CB.teal, gradientColors: ['#0d9488', '#0f766e'] },
  physics:             { icon: 'planet', bgColor: '#E6F1FB', textColor: '#185FA5', badgeBg: '#E6F1FB', badgeText: '#185FA5', barColor: '#6366f1', cardBg: CB.blue, gradientColors: ['#6366f1', '#4f46e5'] },
  biology:             { icon: 'leaf', bgColor: '#E1F5EE', textColor: '#0F6E56', badgeBg: '#E1F5EE', badgeText: '#0F6E56', barColor: '#22c55e', cardBg: CB.green, gradientColors: ['#22c55e', '#15803d'] },
  business:            { icon: 'briefcase', bgColor: '#F1F5F9', textColor: '#475569', badgeBg: '#F1F5F9', badgeText: '#475569', barColor: '#64748b', cardBg: CB.slate, gradientColors: ['#64748b', '#475569'] },
  marketing:           { icon: 'megaphone', bgColor: '#FCE7F3', textColor: '#9D174D', badgeBg: '#FCE7F3', badgeText: '#9D174D', barColor: '#ec4899', cardBg: CB.pink, gradientColors: ['#ec4899', '#be185d'] },
  finance:             { icon: 'cash', bgColor: '#E1F5EE', textColor: '#0F6E56', badgeBg: '#E1F5EE', badgeText: '#0F6E56', barColor: '#10b981', cardBg: CB.green, gradientColors: ['#10b981', '#059669'] },
  music:               { icon: 'musical-notes', bgColor: '#FCE7F3', textColor: '#9D174D', badgeBg: '#FCE7F3', badgeText: '#9D174D', barColor: '#ec4899', cardBg: CB.pink, gradientColors: ['#ec4899', '#db2777'] },
  design:              { icon: 'color-palette', bgColor: '#EEEDFE', textColor: '#534AB7', badgeBg: '#EEEDFE', badgeText: '#534AB7', barColor: '#a855f7', cardBg: CB.purple, gradientColors: ['#a855f7', '#7c3aed'] },
  languages:           { icon: 'language', bgColor: '#E0F2FE', textColor: '#0369A1', badgeBg: '#E0F2FE', badgeText: '#0369A1', barColor: '#0ea5e9', cardBg: CB.blue, gradientColors: ['#0ea5e9', '#0284c7'] },
  cooking:             { icon: 'restaurant', bgColor: '#FEF3C7', textColor: '#92400E', badgeBg: '#FEF3C7', badgeText: '#92400E', barColor: '#f59e0b', cardBg: CB.amber, gradientColors: ['#f59e0b', '#d97706'] },
  general_knowledge:   { icon: 'book', bgColor: '#F1F5F9', textColor: '#64748b', badgeBg: '#F1F5F9', badgeText: '#64748b', barColor: '#64748b', cardBg: CB.slate, gradientColors: ['#64748b', '#475569'] },
  general:             { icon: 'book', bgColor: '#F1F5F9', textColor: '#64748b', badgeBg: '#F1F5F9', badgeText: '#64748b', barColor: '#64748b', cardBg: CB.slate, gradientColors: ['#64748b', '#475569'] },
  academic:            { icon: 'flask', bgColor: '#E6F1FB', textColor: '#185FA5', badgeBg: '#E6F1FB', badgeText: '#185FA5', barColor: '#0d9488', cardBg: CB.blue, gradientColors: ['#0d9488', '#0f766e'] },
};

const DEFAULT_CAT: CatStyle = { icon: 'book', bgColor: '#F1F5F9', textColor: '#64748b', badgeBg: '#F1F5F9', badgeText: '#64748b', barColor: '#64748b', cardBg: '#fafafa', gradientColors: ['#64748b', '#475569'] };

function getCatStyle(category: string | undefined | null): CatStyle {
  if (!category) return DEFAULT_CAT;
  const key = category.toLowerCase().replace(/\s+/g, '_');
  return CATEGORY_MAP[key] || CATEGORY_MAP[category.toLowerCase()] || DEFAULT_CAT;
}

const TAG_MAP: Record<string, { color: string; bg: string }> = {
  'certification prep': { color: '#185FA5', bg: '#E6F1FB' },
  'beginner friendly': { color: '#0F6E56', bg: '#E1F5EE' },
  'advanced': { color: '#991B1B', bg: '#FEE2E2' },
  'hands-on': { color: '#854F0B', bg: '#FAEEDA' },
  'youtube companion': { color: '#991B1B', bg: '#FEE2E2' },
  'quick course': { color: '#534AB7', bg: '#EEEDFE' },
};

function getTagStyle(tag: string) {
  return TAG_MAP[tag.toLowerCase()] || { color: '#475569', bg: '#F1F5F9' };
}

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

const CURATED_CATEGORIES = [
  'Cybersecurity', 'Cloud Computing', 'Computer Science', 'AI & Machine Learning',
  'Mathematics', 'Physics', 'Business', 'Marketing', 'Music', 'Design', 'Languages', 'Cooking',
];

const FEATURED_GRADIENTS: [string, string][] = [
  ['#3b82f6', '#1d4ed8'], ['#8b5cf6', '#6d28d9'], ['#0d9488', '#0f766e'],
  ['#f59e0b', '#d97706'], ['#ec4899', '#be185d'], ['#22c55e', '#15803d'],
];

/* ─── Component ─── */

export default function HomePage() {
  const [enrolled, setEnrolled] = useState<DashboardCourse[]>([]);
  const [allCourses, setAllCourses] = useState<BrowseCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [dashRes, browseRes] = await Promise.all([
          fetch('/api/dashboard'),
          fetch('/api/courses'),
        ]);
        if (dashRes.ok) { const d = await dashRes.json(); setEnrolled(d.active_courses || []); }
        if (browseRes.ok) { const b = await browseRes.json(); setAllCourses(b.courses || []); }
      } catch (err) { console.error('Home fetch error:', err); }
      setLoading(false);
    }
    fetchData();
  }, []);

  const isReturningUser = enrolled.length > 0;

  const heroCourse = useMemo(() => {
    if (enrolled.length === 0) return null;
    const sorted = [...enrolled].sort((a, b) => {
      const aTime = a.last_session_at ? new Date(a.last_session_at).getTime() : 0;
      const bTime = b.last_session_at ? new Date(b.last_session_at).getTime() : 0;
      return bTime - aTime;
    });
    return sorted[0];
  }, [enrolled]);

  const otherEnrolled = useMemo(() => {
    if (!heroCourse) return [];
    return enrolled.filter((c) => c.id !== heroCourse.id);
  }, [enrolled, heroCourse]);

  const enrolledCourseIds = useMemo(() => new Set(enrolled.map((c) => c.course_id)), [enrolled]);
  const discoveryCourses = useMemo(() => allCourses.filter((c) => !enrolledCourseIds.has(c.id)).slice(0, 3), [allCourses, enrolledCourseIds]);
  const featuredCourses = useMemo(() => allCourses.slice(0, 6), [allCourses]);

  const categories = useMemo(() => {
    return CURATED_CATEGORIES.map((name) => {
      const style = getCatStyle(name);
      return { name, bgColor: style.bgColor, iconColor: style.textColor };
    });
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-[170px] bg-gray-100 rounded-[15px]" />
        <div className="h-6 bg-gray-100 rounded w-32" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-[140px] bg-gray-100 rounded-[10px]" />
          <div className="h-[140px] bg-gray-100 rounded-[10px]" />
        </div>
      </div>
    );
  }

  if (isReturningUser) {
    const heroProgress = heroCourse!.progress_percent ?? (
      (heroCourse! as any).lessons_total > 0
        ? Math.min(100, Math.round(((heroCourse! as any).lessons_completed || 0) / (heroCourse! as any).lessons_total * 100))
        : 0
    );

    // Build subtitle with resume point
    let heroSubtitle = `${heroProgress}% complete`;
    const rp = heroCourse!.resume_point;
    if (rp) {
      const parts = [];
      if (rp.module_title) parts.push(rp.module_title);
      parts.push(rp.lesson_title);
      if (rp.step_total > 0) parts.push(`Step ${rp.step_index} of ${rp.step_total}`);
      heroSubtitle = parts.join(' · ');
    }

    // Link directly to lesson player if resume point available
    const heroHref = rp
      ? `/lesson/${heroCourse!.course.slug}/${rp.lesson_id}`
      : `/course/${heroCourse!.course.slug}/path`;

    return (
      <div className="space-y-4">
        {/* Section A: Hero Card (matches HeroCourseCard.tsx) */}
        <HeroCard
          title={heroCourse!.course.title}
          subtitle={heroSubtitle}
          progressPercent={heroProgress}
          buttonLabel="Continue learning"
          href={heroHref}
        />

        {/* Section B: Your Courses (horizontal, matches CompactCourseCard) */}
        {otherEnrolled.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-[#999] uppercase tracking-[0.5px] mb-2">YOUR COURSES</p>
            <div className="flex gap-[10px] overflow-x-auto pb-1 -mx-4 px-4">
              {otherEnrolled.map((item) => {
                const pct = item.progress_percent ?? 0;
                return (
                  <Link key={item.id} href={`/course/${item.course.slug}/path`}
                    className="flex-shrink-0 w-[150px] min-h-[100px] bg-[#f8fafc] rounded-lg border border-[#e2e8f0] p-3 flex flex-col justify-between hover:bg-[#f1f5f9] transition-colors"
                  >
                    <p className="text-sm font-semibold text-[#0f172a] mb-2 line-clamp-2">{item.course.title}</p>
                    <div className="space-y-1">
                      <div className="h-1 bg-[#e2e8f0] rounded-full overflow-hidden">
                        <div className="h-full bg-[#3B82F6] rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs font-semibold text-[#3B82F6]">{pct}%</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Section C: Recommended (2-col grid, matches DiscoveryCourseCard) */}
        {discoveryCourses.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-[#999] uppercase tracking-[0.5px] mb-2">RECOMMENDED FOR YOU</p>
            <div className="grid grid-cols-2 gap-2">
              {discoveryCourses.map((course) => (
                <DiscoveryCard key={course.id} course={course} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // New user view
  return (
    <div className="space-y-4">
      {/* Section A: Hero */}
      <HeroCard
        title="Start learning today"
        subtitle="Bite-sized interactive courses from expert creators"
        buttonLabel="Explore courses"
        href="/browse"
      />

      {/* Section B: Category Icons (matches CategoryIcon.tsx) */}
      {categories.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-[#999] uppercase tracking-[0.5px] mb-2">CATEGORIES</p>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4">
            {categories.map((cat) => (
              <Link key={cat.name} href={`/browse?category=${encodeURIComponent(cat.name)}`}
                className="flex flex-col items-center w-[62px] flex-shrink-0 hover:opacity-70 transition-opacity"
              >
                <div className="w-[46px] h-[46px] rounded-xl flex items-center justify-center text-lg"
                  style={{ backgroundColor: cat.bgColor, color: cat.iconColor }}
                >
                  <span className="text-base font-bold">{cat.name.charAt(0)}</span>
                </div>
                <span className="text-[9px] font-medium text-[#64748b] mt-1 text-center capitalize">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Section C: Featured (horizontal scroll, matches FeaturedCourseCard) */}
      {featuredCourses.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-[#999] uppercase tracking-[0.5px] mb-2">FEATURED</p>
          <div className="flex gap-[10px] overflow-x-auto pb-1 -mx-4 px-4 snap-x snap-mandatory">
            {featuredCourses.map((course, index) => {
              const grad = FEATURED_GRADIENTS[index % FEATURED_GRADIENTS.length];
              const isFree = !course.price_cents || course.price_cents === 0;
              return (
                <Link key={course.id} href={`/course/${course.slug}`}
                  className="flex-shrink-0 w-[160px] rounded-xl overflow-hidden border border-[#e2e8f0] bg-white snap-start hover:opacity-90 transition-opacity"
                >
                  <div className="h-[76px] relative p-2 flex items-end">
                    <div className="absolute inset-0" style={{ backgroundColor: grad[0] }} />
                    <div className="absolute bottom-0 left-0 right-0 h-[55%] opacity-65" style={{ backgroundColor: grad[1] }} />
                    <span className="relative text-[9px] font-semibold text-[#1e293b] bg-white/90 px-2 py-0.5 rounded-md">
                      {isFree ? 'Free' : `$${(course.price_cents! / 100).toFixed(2)}`}
                    </span>
                  </div>
                  <div className="p-2 space-y-0.5">
                    <p className="text-xs font-bold text-[#1e293b] leading-4 line-clamp-2">{course.title}</p>
                    <p className="text-[9px] text-[#94a3b8]">
                      {'openED'}
                      {course.stats.lesson_count > 0 ? ` \u00B7 ${course.stats.lesson_count} lessons` : ''}
                    </p>
                    {(course.tags || []).length > 0 && (
                      <div className="flex gap-[3px] flex-wrap mt-[3px]">
                        {(course.tags || []).slice(0, 2).map((tag) => {
                          const ts = getTagStyle(tag);
                          return (
                            <span key={tag} className="text-[7px] font-medium px-[5px] py-px rounded" style={{ backgroundColor: ts.bg, color: ts.color }}>
                              {tag}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Section D: New on openED (2-col grid) */}
      {allCourses.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-[#999] uppercase tracking-[0.5px] mb-2">NEW ON OPENED</p>
          <div className="grid grid-cols-2 gap-2">
            {allCourses.slice(0, 10).map((course) => (
              <DiscoveryCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── HeroCard (matches mobile HeroCourseCard.tsx exactly) ─── */
function HeroCard({ title, subtitle, progressPercent, buttonLabel, href }: {
  title: string; subtitle: string; progressPercent?: number; buttonLabel: string; href: string;
}) {
  const clamped = progressPercent != null ? Math.min(Math.max(progressPercent, 0), 100) : null;
  return (
    <div className="relative min-h-[170px] rounded-[15px] overflow-hidden">
      {/* Gradient layers */}
      <div className="absolute inset-0 bg-[#1e293b]" />
      <div className="absolute bottom-0 left-0 right-0 h-[60%] bg-[#334155] opacity-60" />
      {/* Decorative circles */}
      <div className="absolute -top-5 -right-5 w-20 h-20 rounded-full bg-[rgba(96,165,250,0.08)]" />
      <div className="absolute -bottom-[15px] -left-[15px] w-[60px] h-[60px] rounded-full bg-[rgba(96,165,250,0.08)]" />
      {/* Content */}
      <div className="relative p-5 space-y-2">
        <h2 className="text-[19px] font-bold text-white leading-tight line-clamp-2">{title}</h2>
        <p className="text-[13px] text-[#94a3b8] line-clamp-2">{subtitle}</p>
        {clamped != null && (
          <div className="h-1 bg-[#475569] rounded-full overflow-hidden mt-1">
            <div className="h-full bg-[#60a5fa] rounded-full" style={{ width: `${clamped}%` }} />
          </div>
        )}
        <Link href={href}
          className="block w-full bg-white rounded-[10px] h-11 flex items-center justify-center text-base font-semibold text-[#1e293b] mt-3 hover:bg-[#e2e8f0] transition-colors text-center leading-[44px]"
        >
          {buttonLabel}
        </Link>
      </div>
    </div>
  );
}

/* ─── DiscoveryCard (matches mobile DiscoveryCourseCard.tsx exactly) ─── */
function DiscoveryCard({ course }: { course: BrowseCourse }) {
  const catStyle = getCatStyle(course.category);
  const isFree = !course.price_cents || course.price_cents === 0;

  return (
    <Link href={`/course/${course.slug}`}
      className="rounded-[10px] overflow-hidden border-[0.5px] border-[#e8e4dd] min-h-[140px] flex flex-col hover:opacity-92 transition-opacity"
      style={{ backgroundColor: catStyle.cardBg }}
    >
      {/* Thin color bar (4px, matches mobile topBar) */}
      <div className="h-1 w-full" style={{ backgroundColor: catStyle.barColor }} />

      {/* Body (padding 11px, matches mobile) */}
      <div className="flex-1 p-[11px] flex flex-col">
        {/* Title row with price badge */}
        <div className="flex justify-between items-start gap-1.5">
          <h3 className="flex-1 text-[13px] font-bold text-[#1e293b] leading-[17px] line-clamp-2">{course.title}</h3>
          <span className={`text-[9px] font-semibold px-[7px] py-0.5 rounded-[5px] mt-px flex-shrink-0 ${
            isFree ? 'bg-[#E1F5EE] text-[#0F6E56]' : 'bg-[#f1f5f9] text-[#1e293b]'
          }`}>
            {isFree ? 'Free' : `$${(course.price_cents! / 100).toFixed(2)}`}
          </span>
        </div>

        {course.description && (
          <p className="text-[10px] text-[#b0abb5] mt-0.5 leading-[13px] line-clamp-1">{course.description}</p>
        )}

        {/* Spacer (flex:1, minHeight 6px, matches mobile) */}
        <div className="flex-1 min-h-[6px]" />

        {/* Meta row */}
        <div className="flex items-center gap-1 flex-wrap">
          {course.stats.lesson_count > 0 && (
            <span className="text-[9px] text-[#94a3b8]">
              {course.stats.lesson_count} {course.stats.lesson_count === 1 ? 'lesson' : 'lessons'}
            </span>
          )}
          {course.category && (
            <span className="text-[8px] font-medium px-1.5 py-px rounded-[5px]"
              style={{ backgroundColor: catStyle.badgeBg, color: catStyle.badgeText }}
            >
              {formatCategoryName(course.category)}
            </span>
          )}
          {(course.tags || []).slice(0, 2).map((tag) => {
            const ts = getTagStyle(tag);
            return (
              <span key={tag} className="text-[8px] font-medium px-1.5 py-px rounded-[5px]"
                style={{ backgroundColor: ts.bg, color: ts.color }}
              >
                {tag}
              </span>
            );
          })}
        </div>
      </div>
    </Link>
  );
}
