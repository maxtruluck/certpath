import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/server';
import { MobileNav } from './landing-nav';

// ─── Color palette for course card accent bars ────────────────
const CARD_COLORS = ['#3B82F6', '#22C55E', '#F59E0B', '#A855F7', '#F97316', '#EC4899'];

// ─── Data fetching ────────────────────────────────────────────
interface FeaturedCourse {
  id: string;
  title: string;
  slug: string;
  is_free: boolean;
  price_cents: number | null;
  thumbnail_url: string | null;
  creator_name: string;
  module_count: number;
  lesson_count: number;
}

async function getFeaturedCourses(): Promise<FeaturedCourse[]> {
  try {
    const supabase = await createServiceClient();

    const { data: courses } = await supabase
      .from('courses')
      .select('id, title, slug, is_free, price_cents, thumbnail_url, creator_id')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(6);

    if (!courses || courses.length === 0) return [];

    const creatorIds = [...new Set(courses.map(c => c.creator_id))];
    const courseIds = courses.map(c => c.id);

    const [{ data: creators }, { data: modules }, { data: lessons }] = await Promise.all([
      supabase.from('creators').select('id, creator_name').in('id', creatorIds),
      supabase.from('modules').select('id, course_id').in('course_id', courseIds),
      supabase.from('lessons').select('id, course_id').in('course_id', courseIds).eq('is_active', true),
    ]);

    const creatorMap = new Map((creators || []).map(c => [c.id, c.creator_name]));

    return courses.map(c => ({
      id: c.id,
      title: c.title,
      slug: c.slug,
      is_free: c.is_free,
      price_cents: c.price_cents,
      thumbnail_url: c.thumbnail_url || null,
      creator_name: creatorMap.get(c.creator_id) || 'Unknown',
      module_count: (modules || []).filter(m => m.course_id === c.id).length,
      lesson_count: (lessons || []).filter(l => l.course_id === c.id).length,
    }));
  } catch {
    return [];
  }
}

// ─── Page ─────────────────────────────────────────────────────
export default async function LandingPage() {
  const courses = await getFeaturedCourses();

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* ── Nav ──────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#FAFAF8]/90 backdrop-blur-md border-b border-[#E8E4DD]">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-5 py-3">
          <Link href="/" className="flex items-baseline gap-0.5">
            <span className="text-xl font-semibold text-[#2C2825] tracking-tight">open</span>
            <span className="text-xl font-extrabold text-[#2C2825] tracking-tight">ED</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="#courses" className="text-sm font-medium text-[#6B635A] hover:text-[#2C2825] transition-colors">
              Browse Courses
            </a>
            <a href="#teach" className="text-sm font-medium text-[#6B635A] hover:text-[#2C2825] transition-colors">
              Teach on openED
            </a>
            <Link href="/login" className="text-sm font-medium text-[#6B635A] hover:text-[#2C2825] transition-colors">
              Log in
            </Link>
            <Link href="/signup" className="bg-[#2C2825] hover:bg-[#1A1816] text-[#F5F3EF] text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
              Get Started
            </Link>
          </nav>

          {/* Mobile nav */}
          <MobileNav />
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-5 pt-20 md:pt-28 pb-16 text-center">
        <h1 className="text-4xl md:text-[3.5rem] font-extrabold text-[#2C2825] leading-[1.1] tracking-tight mb-5 animate-fade-up">
          Courses that actually teach.
        </h1>
        <p className="text-lg text-[#6B635A] max-w-xl mx-auto mb-8 animate-fade-up" style={{ animationDelay: '80ms' }}>
          Expert-created courses in bite-sized, interactive lessons.
          Not another video you&apos;ll never finish.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6 animate-fade-up" style={{ animationDelay: '160ms' }}>
          <a href="#courses" className="w-full sm:w-auto bg-[#2C2825] hover:bg-[#1A1816] text-[#F5F3EF] font-semibold px-6 py-3 rounded-xl transition-colors text-center">
            Browse Courses
          </a>
          <a href="#teach" className="w-full sm:w-auto border border-[#2C2825] text-[#2C2825] hover:bg-[#2C2825] hover:text-[#F5F3EF] font-semibold px-6 py-3 rounded-xl transition-colors text-center">
            Start Teaching
          </a>
        </div>
        <p className="text-sm text-[#A39B90] animate-fade-up" style={{ animationDelay: '240ms' }}>
          Free courses available &middot; No credit card required
        </p>
      </section>

      {/* ── Featured Courses ─────────────────────── */}
      <section id="courses" className="max-w-6xl mx-auto px-5 pb-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-extrabold text-[#2C2825] tracking-tight">Featured Courses</h2>
          <Link href="/browse" className="text-sm font-medium text-[#6B635A] hover:text-[#2C2825] transition-colors">
            View all &rarr;
          </Link>
        </div>

        {courses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map((course, i) => (
              <Link
                key={course.id}
                href={`/course/${course.slug}`}
                className="group rounded-2xl bg-white border border-[#E8E4DD] overflow-hidden hover:border-[#D4CFC7] hover:shadow-sm transition-all"
              >
                {course.thumbnail_url ? (
                  <div className="h-32 overflow-hidden">
                    <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="h-1.5" style={{ backgroundColor: CARD_COLORS[i % CARD_COLORS.length] }} />
                )}
                <div className="p-5">
                  <h3 className="font-bold text-[#2C2825] text-base mb-1 group-hover:text-[#1A1816]">
                    {course.title}
                  </h3>
                  <p className="text-sm text-[#A39B90] mb-3">by {course.creator_name}</p>
                  <p className="text-xs text-[#6B635A] mb-4">
                    {course.module_count} module{course.module_count !== 1 ? 's' : ''} &middot; {course.lesson_count} lesson{course.lesson_count !== 1 ? 's' : ''}
                  </p>
                  <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-lg ${
                    course.is_free || !course.price_cents
                      ? 'bg-green-50 text-green-700'
                      : 'bg-[#F5F3EF] text-[#2C2825]'
                  }`}>
                    {course.is_free || !course.price_cents
                      ? 'Free'
                      : `$${(course.price_cents / 100).toFixed(2)}`}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 rounded-2xl bg-white border border-[#E8E4DD]">
            <h3 className="text-lg font-bold text-[#2C2825] mb-2">Courses coming soon</h3>
            <p className="text-sm text-[#6B635A] mb-6">Be among the first learners on openED.</p>
            <Link href="/signup" className="inline-block bg-[#2C2825] hover:bg-[#1A1816] text-[#F5F3EF] font-semibold px-6 py-3 rounded-xl transition-colors">
              Get Started
            </Link>
          </div>
        )}
      </section>

      {/* ── How It Works ─────────────────────────── */}
      <section className="bg-white border-y border-[#E8E4DD]">
        <div className="max-w-6xl mx-auto px-5 py-20">
          <h2 className="text-2xl font-extrabold text-[#2C2825] tracking-tight mb-12 text-center">
            Learning that fits your life
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                num: '01',
                title: 'Pick a course',
                desc: 'Browse courses from expert creators. Free and paid options available.',
              },
              {
                num: '02',
                title: 'Learn in bite-sized lessons',
                desc: 'Interactive cards walk you through concepts, then test your understanding. Sessions take 5\u201310 minutes.',
              },
              {
                num: '03',
                title: 'Track your progress',
                desc: 'See what you\u2019ve completed, pick up where you left off, and work through courses at your own pace.',
              },
            ].map(step => (
              <div key={step.num}>
                <span className="text-sm font-bold text-[#A39B90]">{step.num}</span>
                <h3 className="text-lg font-bold text-[#2C2825] mt-2 mb-2">{step.title}</h3>
                <p className="text-sm text-[#6B635A] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What Makes openED Different ──────────── */}
      <section className="max-w-6xl mx-auto px-5 py-20">
        <h2 className="text-2xl font-extrabold text-[#2C2825] tracking-tight mb-12 text-center">
          Not another video course platform
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <div>
            <p className="text-base text-[#6B635A] leading-relaxed">
              Most online courses are 40-hour video playlists with a 7% completion rate.
              openED courses break content into interactive lessons&nbsp;&mdash; read a concept,
              then immediately test your understanding. It&apos;s how your brain actually learns.
            </p>
          </div>
          <div className="space-y-5">
            {[
              {
                title: 'Interactive, not passive',
                desc: 'Every lesson alternates teaching and practice. No more zoning out to lecture videos.',
              },
              {
                title: 'Made by real experts',
                desc: 'Courses are built by subject matter experts and professional educators, not AI content farms.',
              },
              {
                title: 'Actually completable',
                desc: 'Bite-sized lessons you can finish in one sitting. No 40-hour backlogs.',
              },
            ].map(f => (
              <div key={f.title} className="rounded-xl bg-[#F5F3EF] border border-[#E8E4DD] p-5">
                <h3 className="font-bold text-[#2C2825] mb-1">{f.title}</h3>
                <p className="text-sm text-[#6B635A]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Creator Pitch ────────────────────────── */}
      <section id="teach" className="bg-[#F5F3EF] border-y border-[#E8E4DD]">
        <div className="max-w-6xl mx-auto px-5 py-20">
          <h2 className="text-2xl font-extrabold text-[#2C2825] tracking-tight mb-2 text-center">
            Teach on openED
          </h2>
          <p className="text-base text-[#6B635A] text-center mb-12">
            Upload your expertise. We handle the rest.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            {/* Value props */}
            <div className="space-y-8">
              {[
                {
                  title: 'Bring your audience',
                  desc: 'Share your course link anywhere. Your students enroll directly on openED.',
                },
                {
                  title: 'We format your content',
                  desc: 'Upload your material and our tools turn it into interactive, structured lessons. No tech skills needed.',
                },
                {
                  title: 'You keep 80%',
                  desc: 'Earn 80% of every sale. Get paid monthly via Stripe.',
                },
              ].map(vp => (
                <div key={vp.title}>
                  <h3 className="font-bold text-[#2C2825] mb-1">{vp.title}</h3>
                  <p className="text-sm text-[#6B635A]">{vp.desc}</p>
                </div>
              ))}
            </div>

            {/* CTA card */}
            <div className="rounded-2xl bg-white border border-[#E8E4DD] p-8 text-center">
              <h3 className="text-xl font-bold text-[#2C2825] mb-2">Start teaching today</h3>
              <p className="text-sm text-[#6B635A] mb-6">Create your first course in minutes.</p>
              <Link
                href="/signup"
                className="inline-block w-full bg-[#2C2825] hover:bg-[#1A1816] text-[#F5F3EF] font-semibold px-6 py-3.5 rounded-xl transition-colors"
              >
                Create Your Course
              </Link>
              <p className="text-xs text-[#A39B90] mt-4">
                Free to get started &middot; No platform fees until you sell
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────── */}
      <footer className="bg-[#2C2825] text-[#F5F3EF]">
        <div className="max-w-6xl mx-auto px-5 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
            {/* Brand */}
            <div>
              <div className="flex items-baseline gap-0.5 mb-3">
                <span className="text-xl font-semibold tracking-tight">open</span>
                <span className="text-xl font-extrabold tracking-tight">ED</span>
              </div>
              <p className="text-sm text-[#A39B90]">Where experts teach and learners grow.</p>
            </div>

            {/* Platform links */}
            <div>
              <h4 className="text-sm font-semibold mb-4">Platform</h4>
              <ul className="space-y-2.5 text-sm text-[#A39B90]">
                <li><Link href="/browse" className="hover:text-white transition-colors">Browse Courses</Link></li>
                <li><a href="#teach" className="hover:text-white transition-colors">Start Teaching</a></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Log In</Link></li>
                <li><Link href="/signup" className="hover:text-white transition-colors">Sign Up</Link></li>
              </ul>
            </div>

            {/* Company links */}
            <div>
              <h4 className="text-sm font-semibold mb-4">Company</h4>
              <ul className="space-y-2.5 text-sm text-[#A39B90]">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="mailto:hello@opened.app" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-[#3D3835] pt-6">
            <p className="text-sm text-[#A39B90]">&copy; {new Date().getFullYear()} openED</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
