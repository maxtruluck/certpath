import { createClient, createServiceClient } from './server';
import { DEMO_MODE, DEMO_USER_ID } from '@/lib/demo';
import { SupabaseClient } from '@supabase/supabase-js';

interface AuthResult {
  supabase: SupabaseClient;
  userId: string;
}

export async function getAuthUser(): Promise<AuthResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    return { supabase, userId: user.id };
  }

  if (DEMO_MODE) {
    // Use service client to bypass RLS for demo user
    const serviceClient = await createServiceClient();
    return { supabase: serviceClient, userId: DEMO_USER_ID };
  }

  // Return regular client with empty userId — callers handle redirect
  return { supabase, userId: '' };
}
