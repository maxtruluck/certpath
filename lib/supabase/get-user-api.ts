import { createClient, createServiceClient } from './server';
import { DEMO_MODE, DEMO_USER_ID } from '@/lib/demo';
import { SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

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

  // Check auth from cookies
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
