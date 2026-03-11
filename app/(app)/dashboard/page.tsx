import { getAuthUser } from '@/lib/supabase/get-user';
import { redirect } from 'next/navigation';
import { DashboardContent } from './DashboardContent';

export default async function DashboardPage() {
  const { supabase, userId } = await getAuthUser();
  if (!userId) redirect('/login');

  // Fetch dashboard data
  const [streakResult, activeCertResult, xpResult] = await Promise.all([
    supabase.from('user_streaks').select('*').eq('user_id', userId).single(),
    supabase
      .from('user_certifications')
      .select('*, certifications(*)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single(),
    supabase.from('user_xp_log').select('xp_amount').eq('user_id', userId),
  ]);

  const totalXp = (xpResult.data ?? []).reduce((sum, r) => sum + r.xp_amount, 0);

  // Domain breakdown
  let domainBreakdown: { name: string; score: number; weight: number }[] = [];
  if (activeCertResult.data) {
    const [domainsResult, scoresResult] = await Promise.all([
      supabase
        .from('domains')
        .select('id, name, weight_percent')
        .eq('certification_id', activeCertResult.data.certification_id)
        .order('display_order'),
      supabase
        .from('user_domain_scores')
        .select('domain_id, score')
        .eq('user_id', userId)
        .eq('certification_id', activeCertResult.data.certification_id),
    ]);

    const scoreMap = new Map((scoresResult.data ?? []).map((s) => [s.domain_id, s.score]));
    domainBreakdown = (domainsResult.data ?? []).map((d) => ({
      name: d.name,
      score: scoreMap.get(d.id) ?? 0,
      weight: d.weight_percent,
    }));
  }

  // All user certs
  const { data: allCerts } = await supabase
    .from('user_certifications')
    .select('*, certifications(*)')
    .eq('user_id', userId);

  // Career path for earnings
  const { data: careerPath } = await supabase
    .from('user_career_paths')
    .select('*, career_paths(*)')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  const { data: userProfile } = await supabase
    .from('users')
    .select('current_salary')
    .eq('id', userId)
    .single();

  let sprintTotal = 90;
  if (activeCertResult.data?.sprint_type === 'sprint_30') sprintTotal = 30;
  else if (activeCertResult.data?.sprint_type === 'sprint_60') sprintTotal = 60;

  // Auto-calculate sprint day from start date
  let sprintDay = activeCertResult.data?.sprint_current_day ?? 1;
  if (activeCertResult.data?.sprint_start_date) {
    const startDate = new Date(activeCertResult.data.sprint_start_date);
    const today = new Date();
    const diffMs = today.getTime() - startDate.getTime();
    sprintDay = Math.min(sprintTotal, Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1));
  }

  // Count questions due for review
  let questionsDue = 0;
  if (activeCertResult.data) {
    const { count } = await supabase
      .from('user_question_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('certification_id', activeCertResult.data.certification_id)
      .lte('next_review_date', new Date().toISOString().split('T')[0]);
    questionsDue = count ?? 0;
  }

  // Check if user practiced today
  const todayStr = new Date().toISOString().split('T')[0];
  const { count: sessionsToday } = await supabase
    .from('user_xp_log')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('source', 'session_complete')
    .gte('earned_at', todayStr);
  const dailyGoalMet = (sessionsToday ?? 0) > 0;

  return (
    <DashboardContent
      activeCert={activeCertResult.data}
      streak={streakResult.data?.current_streak ?? 0}
      totalXp={totalXp}
      domainBreakdown={domainBreakdown}
      sprintTotal={sprintTotal}
      allCerts={(allCerts ?? []).map((c) => ({
        slug: c.certifications?.slug ?? '',
        name: c.certifications?.name ?? '',
        shortName: c.certifications?.short_name ?? '',
        iconEmoji: c.certifications?.icon_emoji ?? '📜',
        status: c.status,
        readinessScore: c.readiness_score,
        salaryBump: c.certifications?.avg_salary_bump_usd ?? 0,
      }))}
      currentSalary={userProfile?.current_salary ?? 0}
      targetSalary={careerPath?.career_paths?.target_salary_usd ?? 0}
      questionsDue={questionsDue}
      dailyGoalMet={dailyGoalMet}
      sprintDay={sprintDay}
    />
  );
}
