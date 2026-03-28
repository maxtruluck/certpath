'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function TeachApplyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [expertise, setExpertise] = useState('');
  const [link, setLink] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Not logged in — redirect to signup with return URL
        router.push('/signup?redirect=/teach/apply');
        return;
      }

      // Check if already a creator
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'creator') {
        router.push('/creator');
        return;
      }

      setLoading(false);
    }
    checkAuth();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/creator/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creator_name: name,
          bio,
          expertise_areas: expertise ? [expertise] : [],
          website_url: link || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Something went wrong. Please try again.');
        setSubmitting(false);
        return;
      }

      router.push('/creator');
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div style={{ fontSize: 14, color: '#888' }}>Loading...</div>
      </div>
    );
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
            <Link href="/teach" style={{ fontSize: 14, color: '#555' }} className="hover:opacity-70 transition-opacity">
              Teach on openED
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Form ─────────────────────────────────── */}
      <div className="flex flex-col items-center" style={{ maxWidth: 500, margin: '0 auto', padding: '60px 24px' }}>
        <div className="text-center" style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#378ADD', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Teach on openED
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>
            Tell us about yourself
          </h1>
          <p style={{ fontSize: 14, color: '#888' }}>
            We review applications and get back to you quickly.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {error && (
            <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', fontSize: 14, padding: 12, borderRadius: 8 }}>
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#555', display: 'block', marginBottom: 6 }}>
              Your name <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Jason Dion"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e5e5e5',
                borderRadius: 8,
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Expertise */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#555', display: 'block', marginBottom: 6 }}>
              What do you teach? <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="text"
              required
              value={expertise}
              onChange={e => setExpertise(e.target.value)}
              placeholder="e.g., Cybersecurity, Physics, Espresso brewing"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e5e5e5',
                borderRadius: 8,
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Link */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#555', display: 'block', marginBottom: 6 }}>
              Link to your website, YouTube, or social
            </label>
            <input
              type="url"
              value={link}
              onChange={e => setLink(e.target.value)}
              placeholder="https://"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e5e5e5',
                borderRadius: 8,
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <p style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
              Helps us understand your audience and expertise
            </p>
          </div>

          {/* Bio */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#555', display: 'block', marginBottom: 6 }}>
              Brief bio <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <textarea
              required
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Tell us about your background and what makes you qualified to teach this subject."
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e5e5e5',
                borderRadius: 8,
                fontSize: 14,
                outline: 'none',
                minHeight: 80,
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              padding: 14,
              backgroundColor: submitting ? '#666' : '#1a1a1a',
              color: 'white',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 500,
              border: 'none',
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? 'Submitting...' : 'Submit application'}
          </button>
          <p className="text-center" style={{ fontSize: 12, color: '#bbb' }}>
            Applications are reviewed and approved quickly.
          </p>
        </form>
      </div>
    </div>
  );
}
