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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    return { supabase, userId: user.id };
  }

  if (DEMO_MODE) {
    const serviceClient = await createServiceClient();
    return { supabase: serviceClient, userId: DEMO_USER_ID };
  }

  return {
    supabase,
    userId: '',
    error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
  };
}
