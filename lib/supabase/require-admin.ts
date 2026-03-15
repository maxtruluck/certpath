import { createClient, createServiceClient } from './server';
import { DEMO_MODE, DEMO_ADMIN_ID } from '@/lib/demo';
import { SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

interface ApiAuthResult {
  supabase: SupabaseClient;
  userId: string;
  error?: NextResponse;
}

export async function requireAdmin(): Promise<ApiAuthResult> {
  const serviceClient = await createServiceClient();

  if (DEMO_MODE) {
    return { supabase: serviceClient, userId: DEMO_ADMIN_ID };
  }

  // Check auth from cookies
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();

  if (!user) {
    return {
      supabase: serviceClient,
      userId: '',
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  // Check profile role
  const { data } = await serviceClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (data?.role !== 'admin') {
    return {
      supabase: serviceClient,
      userId: user.id,
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  return { supabase: serviceClient, userId: user.id };
}
