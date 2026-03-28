import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const url = new URL(request.url);
  const segments = url.pathname.split('/').filter(Boolean);
  const action = segments[segments.length - 1];

  try {
    if (action === 'signup') {
      const { email, password, display_name } = await request.json();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: display_name || email },
        },
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ user: data.user });
    }

    if (action === 'login') {
      const { email, password } = await request.json();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ user: data.user, session: data.session });
    }

    if (action === 'logout') {
      await supabase.auth.signOut();
      return NextResponse.json({ success: true });
    }

    if (action === 'oauth') {
      const { provider } = await request.json();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
        },
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ url: data.url });
    }

    if (action === 'callback') {
      const code = url.searchParams.get('code');
      let destination = '/home';
      if (code) {
        const { data } = await supabase.auth.exchangeCodeForSession(code);
        if (data?.user) {
          const service = await createServiceClient();
          const { data: profile } = await service
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();
          if (profile?.role === 'creator') {
            destination = '/creator';
          }
        }
      }
      return NextResponse.redirect(new URL(destination, request.url));
    }

    return NextResponse.json({ error: 'Unknown auth action' }, { status: 404 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Handle OAuth callback
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  let destination = '/home';

  if (code) {
    const supabase = await createClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);

    // Check role for redirect
    if (data?.user) {
      const service = await createServiceClient();
      const { data: profile } = await service
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();
      if (profile?.role === 'creator') {
        destination = '/creator';
      }
    }
  }

  return NextResponse.redirect(new URL(destination, request.url));
}
