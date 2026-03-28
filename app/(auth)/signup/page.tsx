'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName || email },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Check for redirect param (e.g., from /teach/apply)
    const params = new URLSearchParams(window.location.search);
    const redirectTo = params.get('redirect');
    router.push(redirectTo || '/home');
    router.refresh();
  }

  async function handleOAuth(provider: 'google' | 'github') {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#FAFAF8]">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-baseline gap-0.5">
            <span className="text-3xl font-semibold text-[#2C2825] tracking-tight">open</span>
            <span className="text-3xl font-extrabold text-[#2C2825] tracking-tight">ED</span>
          </Link>
          <p className="text-[#A39B90] mt-2 text-sm">Create your account</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl">{error}</div>
          )}
          <div>
            <label htmlFor="name" className="block text-sm text-[#6B635A] mb-1">Display name</label>
            <input
              id="name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-[#E8E4DD] rounded-xl text-[#2C2825] focus:outline-none focus:border-[#2C2825] transition-colors"
              placeholder="Your name"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm text-[#6B635A] mb-1">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white border border-[#E8E4DD] rounded-xl text-[#2C2825] focus:outline-none focus:border-[#2C2825] transition-colors"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm text-[#6B635A] mb-1">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 bg-white border border-[#E8E4DD] rounded-xl text-[#2C2825] focus:outline-none focus:border-[#2C2825] transition-colors"
              placeholder="At least 6 characters"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2C2825] hover:bg-[#1A1816] disabled:opacity-50 text-[#F5F3EF] font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#E8E4DD]" /></div>
          <div className="relative flex justify-center text-sm"><span className="bg-[#FAFAF8] px-2 text-[#A39B90]">or continue with</span></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleOAuth('google')}
            className="w-full py-2.5 rounded-xl border border-[#E8E4DD] text-sm font-medium text-[#2C2825] hover:bg-[#F5F3EF] transition-colors"
          >
            Google
          </button>
          <button
            onClick={() => handleOAuth('github')}
            className="w-full py-2.5 rounded-xl border border-[#E8E4DD] text-sm font-medium text-[#2C2825] hover:bg-[#F5F3EF] transition-colors"
          >
            GitHub
          </button>
        </div>

        <p className="text-center text-sm text-[#6B635A]">
          Already have an account?{' '}
          <Link href="/login" className="text-[#2C2825] hover:text-[#1A1816] font-semibold">Log in</Link>
        </p>
      </div>
    </div>
  );
}
