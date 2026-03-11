import { getApiUser } from '@/lib/supabase/get-user-api';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const { supabase, userId, error } = await getApiUser();
  if (error) return error;

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  const { data: streak } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .single();

  // Total XP across all certs
  const { data: xpData } = await supabase
    .from('user_xp_log')
    .select('xp_amount')
    .eq('user_id', userId);

  const totalXp = (xpData ?? []).reduce((sum, r) => sum + r.xp_amount, 0);

  // Active cert
  const { data: activeCert } = await supabase
    .from('user_certifications')
    .select('*, certifications(*)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  return NextResponse.json({
    profile,
    streak,
    totalXp,
    activeCert,
  });
}

export async function PATCH(request: NextRequest) {
  const { supabase, userId, error } = await getApiUser();
  if (error) return error;

  const updates = await request.json();
  const allowedFields = ['display_name', 'current_role', 'target_role', 'current_salary', 'avatar_url'];
  const filtered = Object.fromEntries(
    Object.entries(updates).filter(([k]) => allowedFields.includes(k))
  );

  const { data, error: updateError } = await supabase
    .from('users')
    .update(filtered)
    .eq('id', userId)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

  // Update sprint type if provided
  const { sprint_type, certification_id } = updates;
  if (sprint_type && certification_id) {
    await supabase
      .from('user_certifications')
      .update({ sprint_type })
      .eq('user_id', userId)
      .eq('certification_id', certification_id);
  }

  return NextResponse.json(data);
}
