'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Check role for redirect
    let destination = '/home';
    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();
      if (profile?.role === 'creator') {
        destination = '/creator';
      }
    }

    router.push(destination);
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
          <p className="text-[#A39B90] mt-2 text-sm">Welcome back</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl">{error}</div>
          )}
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
              className="w-full px-4 py-3 bg-white border border-[#E8E4DD] rounded-xl text-[#2C2825] focus:outline-none focus:border-[#2C2825] transition-colors"
              placeholder="Enter your password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2C2825] hover:bg-[#1A1816] disabled:opacity-50 text-[#F5F3EF] font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? 'Logging in...' : 'Log in'}
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
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-[#2C2825] hover:text-[#1A1816] font-semibold">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
