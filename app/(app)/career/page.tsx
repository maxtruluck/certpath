import { getAuthUser } from '@/lib/supabase/get-user';
import { redirect } from 'next/navigation';
import { CareerContent } from './CareerContent';

export default async function CareerPage() {
  const { supabase, userId } = await getAuthUser();
  if (!userId) redirect('/login');

  const { data: userCareerPath } = await supabase
    .from('user_career_paths')
    .select('*, career_paths(*)')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  const { data: userProfile } = await supabase
    .from('users')
    .select('"current_role", current_salary')
    .eq('id', userId)
    .single();

  if (!userCareerPath) {
    return (
      <div className="text-center py-12 space-y-3">
        <p className="text-5xl">🗺️</p>
        <h2 className="text-xl font-bold">No Career Path Selected</h2>
        <p className="text-cp-text-muted">Complete onboarding to set up your career path.</p>
      </div>
    );
  }

  const { data: milestones } = await supabase
    .from('career_path_milestones')
    .select('*, certifications(name, short_name, slug)')
    .eq('career_path_id', userCareerPath.career_path_id)
    .order('milestone_order');

  const { data: userCerts } = await supabase
    .from('user_certifications')
    .select('certification_id, status')
    .eq('user_id', userId);

  const certStatusMap = new Map((userCerts ?? []).map((c) => [c.certification_id, c.status]));

  const enrichedMilestones = (milestones ?? []).map((m) => {
    const status = certStatusMap.get(m.certification_id);
    return {
      certName: m.certifications?.short_name ?? 'Unknown',
      projectedSalary: m.projected_salary_usd,
      salaryBump: m.salary_bump_usd,
      status: (status === 'completed' ? 'earned' : status === 'active' ? 'in_progress' : 'locked') as 'earned' | 'in_progress' | 'locked',
    };
  });

  const completedCount = enrichedMilestones.filter((m) => m.status === 'earned').length;
  const progress = enrichedMilestones.length > 0 ? completedCount / enrichedMilestones.length : 0;

  return (
    <CareerContent
      currentRole={userProfile?.current_role ?? 'Unknown'}
      currentSalary={userProfile?.current_salary ?? 0}
      targetRole={userCareerPath.career_paths?.target_role ?? 'Unknown'}
      targetSalary={userCareerPath.career_paths?.target_salary_usd ?? 0}
      progress={progress}
      milestones={enrichedMilestones}
      certsRemaining={enrichedMilestones.length - completedCount}
    />
  );
}
