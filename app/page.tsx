import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { MobileNav } from './landing-nav';

// ─── Page ─────────────────────────────────────────────────────
export default async function LandingPage() {
  // Redirect logged-in users to their dashboard
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const service = await createServiceClient();
      const { data: profile } = await service
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      redirect(profile?.role === 'creator' ? '/creator' : '/home');
    }
  } catch (e) {
    // redirect() throws a NEXT_REDIRECT error — rethrow it
    if (e && typeof e === 'object' && 'digest' in e) throw e;
    // Otherwise swallow auth errors and show the public page
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ── Nav ──────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md">
        <div className="flex items-center justify-between" style={{ padding: '16px 48px' }}>
          <Link href="/" className="flex items-baseline">
            <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px', color: '#1a1a1a' }}>openED</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center" style={{ gap: 28 }}>
            <Link href="/browse" style={{ fontSize: 14, color: '#555' }} className="hover:opacity-70 transition-opacity">
              Browse Courses
            </Link>
            <Link href="/teach" style={{ fontSize: 14, color: '#555' }} className="hover:opacity-70 transition-opacity">
              Teach on openED
            </Link>
            <Link href="/login" style={{ fontSize: 14, color: '#555' }} className="hover:opacity-70 transition-opacity">
              Log in
            </Link>
            <Link
              href="/signup"
              style={{
                fontSize: 14,
                padding: '9px 22px',
                backgroundColor: '#1a1a1a',
                color: 'white',
                borderRadius: 8,
              }}
              className="hover:opacity-90 transition-opacity"
            >
              Get Started
            </Link>
          </nav>

          {/* Mobile nav */}
          <MobileNav />
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────── */}
      <section className="flex flex-col items-center text-center" style={{ maxWidth: 700, margin: '0 auto', paddingTop: 80, paddingBottom: 60, paddingLeft: 24, paddingRight: 24 }}>
        <h1 style={{ fontSize: 48, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.1, letterSpacing: '-1.5px' }}>
          Courses that actually teach.
        </h1>
        <p style={{ fontSize: 18, color: '#888', lineHeight: 1.5, marginBottom: 32, marginTop: 16 }}>
          Expert-created courses in bite-sized, interactive lessons. Not another video you&apos;ll never finish.
        </p>
        <div className="flex items-center justify-center" style={{ gap: 12 }}>
          <Link
            href="/browse"
            style={{
              fontSize: 16,
              fontWeight: 500,
              padding: '14px 32px',
              backgroundColor: '#1a1a1a',
              color: 'white',
              borderRadius: 10,
            }}
            className="hover:opacity-90 transition-opacity"
          >
            Browse Courses
          </Link>
          <Link
            href="/teach"
            style={{
              fontSize: 16,
              fontWeight: 500,
              padding: '14px 32px',
              backgroundColor: 'white',
              color: '#1a1a1a',
              borderRadius: 10,
              border: '1px solid #e5e5e5',
            }}
            className="hover:opacity-90 transition-opacity"
          >
            Start Teaching
          </Link>
        </div>
        <p style={{ fontSize: 13, color: '#bbb', marginTop: 16 }}>
          Free courses available &middot; No credit card required
        </p>
      </section>

      {/* ── Why openED is different ──────────────── */}
      <section style={{ backgroundColor: '#fafafa', borderTop: '1px solid #eee', borderBottom: '1px solid #eee', padding: '60px 48px' }}>
        <p className="text-center" style={{ fontSize: 14, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 32 }}>
          Why openED is different
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 text-center" style={{ maxWidth: 800, margin: '0 auto', gap: 32 }}>
          {[
            {
              icon: '\u2192',
              iconBg: '#E6F1FB',
              iconColor: '#185FA5',
              title: 'Step-by-step lessons',
              desc: 'No 4-hour videos. Learn through read, watch, practice, and test steps \u2014 each one focused and digestible.',
            },
            {
              icon: '?',
              iconBg: '#E1F5EE',
              iconColor: '#0F6E56',
              title: 'Built-in practice',
              desc: 'Questions embedded right in the lesson. Get instant feedback and explanations as you learn, not after.',
            },
            {
              icon: '\u2605',
              iconBg: '#FEF3CD',
              iconColor: '#856404',
              title: 'Expert creators',
              desc: 'Courses built by people who actually teach \u2014 educators, professionals, and subject matter experts.',
            },
          ].map(item => (
            <div key={item.title} className="flex flex-col items-center">
              <div
                className="flex items-center justify-center"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: item.iconBg,
                  color: item.iconColor,
                  fontSize: 20,
                  fontWeight: 700,
                  marginBottom: 12,
                }}
              >
                {item.icon}
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', marginBottom: 6 }}>{item.title}</h3>
              <p style={{ fontSize: 13, color: '#888', lineHeight: 1.5 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────── */}
      <section className="text-center" style={{ backgroundColor: '#fafafa', borderTop: '1px solid #eee', padding: 48 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: '#1a1a1a', marginBottom: 8 }}>Ready to start learning?</h2>
        <p style={{ fontSize: 14, color: '#888', marginBottom: 20 }}>
          Join thousands of learners building real skills with interactive courses.
        </p>
        <Link
          href="/signup"
          style={{
            fontSize: 15,
            fontWeight: 500,
            padding: '12px 28px',
            backgroundColor: '#1a1a1a',
            color: 'white',
            borderRadius: 10,
            display: 'inline-block',
          }}
          className="hover:opacity-90 transition-opacity"
        >
          Get Started &mdash; it&apos;s free
        </Link>
      </section>

      {/* ── Footer ───────────────────────────────── */}
      <footer className="flex items-center justify-between" style={{ padding: '24px 48px', borderTop: '1px solid #eee' }}>
        <span style={{ fontSize: 13, color: '#bbb' }}>&copy; 2026 openED</span>
        <div className="flex items-center" style={{ gap: 20 }}>
          <a href="#" style={{ fontSize: 13, color: '#999' }} className="hover:opacity-70 transition-opacity">About</a>
          <Link href="/teach" style={{ fontSize: 13, color: '#999' }} className="hover:opacity-70 transition-opacity">Teach on openED</Link>
          <a href="#" style={{ fontSize: 13, color: '#999' }} className="hover:opacity-70 transition-opacity">Privacy</a>
          <a href="#" style={{ fontSize: 13, color: '#999' }} className="hover:opacity-70 transition-opacity">Terms</a>
        </div>
      </footer>
    </div>
  );
}
