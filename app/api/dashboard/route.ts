import { getApiUser } from '@/lib/supabase/get-user-api';
import { NextResponse } from 'next/server';

export async function GET() {
  const { supabase, userId, error } = await getApiUser();
  if (error) return error;

  // Parallel fetches
  const [
    profileResult,
    streakResult,
    activeCertResult,
    allCertsResult,
    xpResult,
    careerPathResult,
  ] = await Promise.all([
    supabase.from('users').select('*').eq('id', userId).single(),
    supabase.from('user_streaks').select('*').eq('user_id', userId).single(),
    supabase
      .from('user_certifications')
      .select('*, certifications(*)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single(),
    supabase
      .from('user_certifications')
      .select('*, certifications(*)')
      .eq('user_id', userId),
    supabase
      .from('user_xp_log')
      .select('xp_amount')
      .eq('user_id', userId),
    supabase
      .from('user_career_paths')
      .select('*, career_paths(*)')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single(),
  ]);

  const totalXp = (xpResult.data ?? []).reduce((sum, r) => sum + r.xp_amount, 0);

  // Get domain breakdown for active cert
  let domainBreakdown: { name: string; score: number; weight: number }[] = [];
  if (activeCertResult.data) {
    const { data: domains } = await supabase
      .from('domains')
      .select('id, name, weight_percent')
      .eq('certification_id', activeCertResult.data.certification_id)
      .order('display_order');

    const { data: scores } = await supabase
      .from('user_domain_scores')
      .select('domain_id, score')
      .eq('user_id', userId)
      .eq('certification_id', activeCertResult.data.certification_id);

    const scoreMap = new Map((scores ?? []).map((s) => [s.domain_id, s.score]));

    domainBreakdown = (domains ?? []).map((d) => ({
      name: d.name,
      score: scoreMap.get(d.id) ?? 0,
      weight: d.weight_percent,
    }));
  }

  // Sprint info
  let sprintTotal = 90;
  if (activeCertResult.data?.sprint_type === 'sprint_30') sprintTotal = 30;
  else if (activeCertResult.data?.sprint_type === 'sprint_60') sprintTotal = 60;

  return NextResponse.json({
    profile: profileResult.data,
    streak: streakResult.data,
    totalXp,
    activeCert: activeCertResult.data,
    allCerts: allCertsResult.data ?? [],
    domainBreakdown,
    careerPath: careerPathResult.data,
    sprintTotal,
  });
}
