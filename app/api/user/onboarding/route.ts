import { getApiUser } from '@/lib/supabase/get-user-api';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { supabase, userId, error } = await getApiUser();
  if (error) return error;

  const {
    current_role,
    current_salary,
    target_role,
    career_path_id,
    certification_id,
    sprint_type,
  } = await request.json();

  // Update user profile
  await supabase
    .from('users')
    .update({
      current_role,
      current_salary,
      target_role,
      onboarding_complete: true,
    })
    .eq('id', userId);

  // Create user certification enrollment
  await supabase.from('user_certifications').upsert({
    user_id: userId,
    certification_id,
    status: 'active',
    sprint_type,
    sprint_start_date: new Date().toISOString().split('T')[0],
    sprint_current_day: 1,
  }, {
    onConflict: 'user_id,certification_id',
  });

  // Create user career path
  if (career_path_id) {
    // Deactivate any existing paths
    await supabase
      .from('user_career_paths')
      .update({ is_active: false })
      .eq('user_id', userId);

    await supabase.from('user_career_paths').upsert({
      user_id: userId,
      career_path_id,
      is_active: true,
    }, {
      onConflict: 'user_id,career_path_id',
    });
  }

  return NextResponse.json({ success: true });
}
