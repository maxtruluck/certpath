import { getApiUser } from '@/lib/supabase/get-user-api';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { supabase, userId, error } = await getApiUser();
  if (error) return error;

  const { certification_id, sprint_type } = await request.json();

  if (!certification_id) {
    return NextResponse.json({ error: 'certification_id required' }, { status: 400 });
  }

  // Verify certification exists
  const { data: cert } = await supabase
    .from('certifications')
    .select('id, slug')
    .eq('id', certification_id)
    .single();

  if (!cert) {
    return NextResponse.json({ error: 'Certification not found' }, { status: 404 });
  }

  // Upsert enrollment
  const { data, error: upsertError } = await supabase
    .from('user_certifications')
    .upsert({
      user_id: userId,
      certification_id,
      status: 'active',
      sprint_type: sprint_type || 'sprint_60',
      sprint_start_date: new Date().toISOString().split('T')[0],
      sprint_current_day: 1,
    }, {
      onConflict: 'user_id,certification_id',
    })
    .select()
    .single();

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 400 });
  }

  // Create streak record if it doesn't exist
  await supabase
    .from('user_streaks')
    .upsert({
      user_id: userId,
      current_streak: 0,
      longest_streak: 0,
    }, {
      onConflict: 'user_id',
      ignoreDuplicates: true,
    });

  return NextResponse.json({ enrollment: data, slug: cert.slug });
}
