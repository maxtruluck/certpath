'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';

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

    router.push('/onboarding');
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
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-1.5">
            <span className="text-3xl font-bold text-cp-green">Cert</span>
            <span className="text-3xl font-bold text-cp-text">Path</span>
          </Link>
          <p className="text-cp-text-muted mt-2">Start your certification journey</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          {error && (
            <div className="bg-cp-danger/20 text-cp-danger text-sm p-3 rounded-xl">{error}</div>
          )}
          <div>
            <label htmlFor="name" className="block text-sm text-cp-text-muted mb-1">Display Name</label>
            <input
              id="name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 bg-cp-surface border border-cp-surface-light rounded-xl text-cp-text focus:outline-none focus:border-cp-green transition-colors"
              placeholder="Your name"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm text-cp-text-muted mb-1">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-cp-surface border border-cp-surface-light rounded-xl text-cp-text focus:outline-none focus:border-cp-green transition-colors"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm text-cp-text-muted mb-1">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 bg-cp-surface border border-cp-surface-light rounded-xl text-cp-text focus:outline-none focus:border-cp-green transition-colors"
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" loading={loading} className="w-full">
            Create Account
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-cp-surface-light" /></div>
          <div className="relative flex justify-center text-sm"><span className="bg-cp-bg px-2 text-cp-text-muted">or continue with</span></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={() => handleOAuth('google')} className="w-full">
            Google
          </Button>
          <Button variant="secondary" onClick={() => handleOAuth('github')} className="w-full">
            GitHub
          </Button>
        </div>

        <p className="text-center text-sm text-cp-text-muted">
          Already have an account?{' '}
          <Link href="/login" className="text-cp-green hover:text-cp-green-light">Log in</Link>
        </p>
      </div>
    </div>
  );
}
