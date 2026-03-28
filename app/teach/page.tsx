import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';

export default async function TeachPage() {
  // If logged in and already a creator, redirect to creator dashboard
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const service = await createServiceClient();
      const { data: creator } = await service
        .from('creators')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .single();
      if (creator) {
        redirect('/creator');
      }
    }
  } catch (e) {
    if (e && typeof e === 'object' && 'digest' in e) throw e;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ── Nav ──────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md">
        <div className="flex items-center justify-between" style={{ padding: '16px 48px' }}>
          <Link href="/" className="flex items-baseline">
            <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px', color: '#1a1a1a' }}>openED</span>
          </Link>

          <nav className="hidden md:flex items-center" style={{ gap: 28 }}>
            <Link href="/browse" style={{ fontSize: 14, color: '#555' }} className="hover:opacity-70 transition-opacity">
              Browse Courses
            </Link>
            <Link href="/teach" style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>
              Teach on openED
            </Link>
            <Link href="/login" style={{ fontSize: 14, color: '#555' }} className="hover:opacity-70 transition-opacity">
              Log in
            </Link>
            <Link
              href="/teach/apply"
              style={{
                fontSize: 14,
                padding: '9px 22px',
                backgroundColor: '#1a1a1a',
                color: 'white',
                borderRadius: 8,
              }}
              className="hover:opacity-90 transition-opacity"
            >
              Apply to teach
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────── */}
      <section className="flex flex-col items-center text-center" style={{ maxWidth: 700, margin: '0 auto', padding: '80px 48px 60px' }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#378ADD', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
          For educators &amp; experts
        </p>
        <h1 style={{ fontSize: 44, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.1, letterSpacing: '-1px', marginBottom: 16 }}>
          Build courses for your audience.
        </h1>
        <p style={{ fontSize: 18, color: '#888', lineHeight: 1.5, marginBottom: 32 }}>
          We handle the platform. You bring the expertise. Keep 80% of every sale &mdash; the highest creator share in the industry.
        </p>
        <Link
          href="/teach/apply"
          style={{
            fontSize: 16,
            fontWeight: 500,
            padding: '14px 36px',
            backgroundColor: '#1a1a1a',
            color: 'white',
            borderRadius: 10,
            display: 'inline-block',
          }}
          className="hover:opacity-90 transition-opacity"
        >
          Apply to teach &rarr;
        </Link>
      </section>

      {/* ── How it works ─────────────────────────── */}
      <section style={{ backgroundColor: '#fafafa', borderTop: '1px solid #eee', borderBottom: '1px solid #eee', padding: '60px 48px' }}>
        <h2 className="text-center" style={{ fontSize: 24, fontWeight: 600, color: '#1a1a1a', marginBottom: 40 }}>
          How it works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 text-center" style={{ maxWidth: 800, margin: '0 auto', gap: 32 }}>
          {[
            {
              num: '1',
              title: 'Apply',
              desc: 'Tell us who you are and what you teach. Takes 60 seconds. We review and approve quickly.',
            },
            {
              num: '2',
              title: 'Build',
              desc: 'Create interactive courses with our step-by-step builder. Add lessons, questions, videos, and more. Import from CSV.',
            },
            {
              num: '3',
              title: 'Earn',
              desc: 'Set your price, publish to our marketplace, and keep 80% of every sale. Get paid via Stripe.',
            },
          ].map(step => (
            <div key={step.num} className="flex flex-col items-center">
              <div
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 40,
                  height: 40,
                  backgroundColor: '#1a1a1a',
                  color: 'white',
                  fontSize: 16,
                  fontWeight: 600,
                  marginBottom: 14,
                }}
              >
                {step.num}
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{step.title}</h3>
              <p style={{ fontSize: 13, color: '#888', lineHeight: 1.5 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Revenue comparison ────────────────────── */}
      <section style={{ backgroundColor: 'white', padding: '60px 48px' }}>
        <h2 className="text-center" style={{ fontSize: 24, fontWeight: 600, color: '#1a1a1a', marginBottom: 8 }}>
          Keep more of what you earn
        </h2>
        <p className="text-center" style={{ fontSize: 14, color: '#888', marginBottom: 32 }}>
          See how openED compares to other platforms
        </p>
        <div style={{ maxWidth: 700, margin: '0 auto', border: '1px solid #e5e5e5', borderRadius: 12, overflow: 'hidden' }}>
          {/* Header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 120px 180px',
              backgroundColor: '#fafafa',
              padding: '14px 20px',
              borderBottom: '1px solid #eee',
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>Platform</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>Creator keeps</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>Note</span>
          </div>
          {/* Rows */}
          {[
            { platform: 'openED', share: '80%', note: 'Simple flat rate, every sale', highlight: true, platformColor: '#1D9E75', shareColor: '#1D9E75' },
            { platform: 'Udemy (marketplace)', share: '37%', note: 'When Udemy drives the sale', highlight: false, shareColor: '#E24B4A' },
            { platform: 'Udemy (subscription)', share: '15%', note: 'Down from 25% in 2023', highlight: false, shareColor: '#E24B4A' },
            { platform: 'Skillshare', share: '~30%', note: 'Watch-time pool, unpredictable', highlight: false, shareColor: '#856404' },
            { platform: 'Coursera', share: '15\u201320%', note: 'Institutional partnerships only', highlight: false, shareColor: '#E24B4A' },
            { platform: 'Teachable', share: '~90%', note: '$39\u2013119/mo fee, no marketplace', highlight: false, shareColor: '#856404' },
          ].map((row, i, arr) => (
            <div
              key={row.platform}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 120px 180px',
                padding: '14px 20px',
                backgroundColor: row.highlight ? '#f0faf5' : 'white',
                borderBottom: i < arr.length - 1 ? '1px solid #eee' : 'none',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: 14, fontWeight: row.highlight ? 600 : 400, color: row.highlight ? '#1D9E75' : '#1a1a1a' }}>
                {row.platform}
              </span>
              <span style={{ fontSize: 14, fontWeight: 600, color: row.shareColor }}>
                {row.share}
              </span>
              <span style={{ fontSize: 12, color: '#999' }}>
                {row.note}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── What you get ─────────────────────────── */}
      <section style={{ backgroundColor: '#fafafa', borderTop: '1px solid #eee', borderBottom: '1px solid #eee', padding: '60px 48px' }}>
        <h2 className="text-center" style={{ fontSize: 24, fontWeight: 600, color: '#1a1a1a', marginBottom: 32 }}>
          What you get
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2" style={{ maxWidth: 700, margin: '0 auto', gap: 20 }}>
          {[
            {
              icon: '\u2192',
              iconBg: '#E6F1FB',
              iconColor: '#185FA5',
              title: 'Step-by-step builder',
              desc: 'Create lessons with read, watch, answer, embed, and callout steps. Drag to reorder.',
            },
            {
              icon: '\u2191',
              iconBg: '#E1F5EE',
              iconColor: '#0F6E56',
              title: 'CSV import',
              desc: 'Already have content? Import your courses from a spreadsheet in seconds.',
            },
            {
              icon: '$',
              iconBg: '#FEF3CD',
              iconColor: '#856404',
              title: 'Stripe payouts',
              desc: 'Set your own price. Get paid directly to your bank account via Stripe Connect.',
            },
            {
              icon: '\u25CE',
              iconBg: '#FDEEE8',
              iconColor: '#8B3518',
              title: 'Marketplace exposure',
              desc: 'Your courses appear on our marketplace. We drive learners \u2014 you focus on content.',
            },
          ].map(item => (
            <div
              key={item.title}
              className="flex"
              style={{
                gap: 14,
                padding: 16,
                backgroundColor: 'white',
                borderRadius: 10,
                border: '1px solid #e5e5e5',
              }}
            >
              <div
                className="flex items-center justify-center flex-shrink-0"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  backgroundColor: item.iconBg,
                  color: item.iconColor,
                  fontSize: 16,
                  fontWeight: 700,
                }}
              >
                {item.icon}
              </div>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 4 }}>{item.title}</h3>
                <p style={{ fontSize: 12, color: '#888', lineHeight: 1.4 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────── */}
      <section className="text-center" style={{ backgroundColor: 'white', padding: '60px 48px' }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.5px', marginBottom: 10 }}>
          Ready to teach on openED?
        </h2>
        <p style={{ fontSize: 15, color: '#888', marginBottom: 24 }}>
          Join a growing community of expert educators sharing their knowledge.
        </p>
        <Link
          href="/teach/apply"
          style={{
            fontSize: 16,
            fontWeight: 500,
            padding: '14px 36px',
            backgroundColor: '#1a1a1a',
            color: 'white',
            borderRadius: 10,
            display: 'inline-block',
          }}
          className="hover:opacity-90 transition-opacity"
        >
          Apply to teach &rarr;
        </Link>
        <p style={{ fontSize: 13, color: '#bbb', marginTop: 12 }}>
          Free to join &middot; No monthly fees &middot; 60-second application
        </p>
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
