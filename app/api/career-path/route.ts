import { getApiUser } from '@/lib/supabase/get-user-api';
import { NextResponse } from 'next/server';

export async function GET() {
  const { supabase, userId, error } = await getApiUser();
  if (error) return error;

  // Get active career path
  const { data: userCareerPath } = await supabase
    .from('user_career_paths')
    .select('*, career_paths(*)')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  if (!userCareerPath) {
    return NextResponse.json({ careerPath: null, milestones: [] });
  }

  // Get milestones with cert details
  const { data: milestones } = await supabase
    .from('career_path_milestones')
    .select('*, certifications(name, short_name, slug)')
    .eq('career_path_id', userCareerPath.career_path_id)
    .order('milestone_order');

  // Get user cert status for each milestone cert
  const { data: userCerts } = await supabase
    .from('user_certifications')
    .select('certification_id, status, readiness_score')
    .eq('user_id', userId);

  const certStatusMap = new Map(
    (userCerts ?? []).map((c) => [c.certification_id, c])
  );

  const enrichedMilestones = (milestones ?? []).map((m) => {
    const userCert = certStatusMap.get(m.certification_id);
    return {
      certName: m.certifications?.short_name ?? m.certifications?.name ?? 'Unknown',
      projectedSalary: m.projected_salary_usd,
      salaryBump: m.salary_bump_usd,
      status: userCert?.status === 'completed'
        ? 'earned'
        : userCert?.status === 'active'
        ? 'in_progress'
        : 'locked',
    };
  });

  const completedCount = enrichedMilestones.filter((m) => m.status === 'earned').length;
  const progress = milestones && milestones.length > 0 ? completedCount / milestones.length : 0;

  return NextResponse.json({
    careerPath: userCareerPath.career_paths,
    milestones: enrichedMilestones,
    progress,
  });
}
