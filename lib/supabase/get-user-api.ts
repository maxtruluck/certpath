import { createClient, createServiceClient } from './server';
import { DEMO_MODE, DEMO_USER_ID } from '@/lib/demo';
import { SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

interface ApiAuthResult {
  supabase: SupabaseClient;
  userId: string;
  error?: NextResponse;
}

export async function getApiUser(): Promise<ApiAuthResult> {
  // Always get the service client for API routes (bypasses RLS, needed for cross-table writes)
  const serviceClient = await createServiceClient();

  if (DEMO_MODE) {
    return { supabase: serviceClient, userId: DEMO_USER_ID };
  }

  // Check for Bearer token (mobile app auth)
  const headerStore = await headers();
  const authHeader = headerStore.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const { data: { user }, error: tokenError } = await serviceClient.auth.getUser(token);
    if (user && !tokenError) {
      return { supabase: serviceClient, userId: user.id };
    }
  }

  // Check auth from cookies (web app auth)
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();

  if (user) {
    // Use service client for data operations but authenticated user's ID
    return { supabase: serviceClient, userId: user.id };
  }

  return {
    supabase: serviceClient,
    userId: '',
    error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
  };
}
