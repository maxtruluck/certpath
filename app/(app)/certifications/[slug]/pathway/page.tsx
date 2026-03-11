import { getAuthUser } from '@/lib/supabase/get-user';
import { redirect, notFound } from 'next/navigation';
import { CertPathwayClient } from './CertPathwayClient';

export default async function CertPathwayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { supabase, userId } = await getAuthUser();
  if (!userId) redirect('/login');

  const { data: cert } = await supabase
    .from('certifications')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!cert) notFound();

  const [domainsResult, userCertResult, scoresResult, questionCountResult] = await Promise.all([
    supabase.from('domains').select('*').eq('certification_id', cert.id).order('display_order'),
    supabase.from('user_certifications').select('*').eq('user_id', userId).eq('certification_id', cert.id).single(),
    supabase.from('user_domain_scores').select('*').eq('user_id', userId).eq('certification_id', cert.id),
    supabase.from('questions').select('id', { count: 'exact', head: true }).eq('certification_id', cert.id).eq('is_active', true),
  ]);

  const domains = domainsResult.data ?? [];
  const userCert = userCertResult.data;
  const scores = scoresResult.data ?? [];
  const totalQuestions = questionCountResult.count ?? 0;

  const domainData = domains.map((domain) => {
    const score = scores.find((s) => s.domain_id === domain.id);
    return {
      id: domain.id,
      name: domain.name,
      slug: domain.slug,
      weightPercent: domain.weight_percent,
      displayOrder: domain.display_order,
      score: score?.score ?? 0,
      questionsAttempted: score?.questions_attempted ?? 0,
      questionsCorrect: score?.questions_correct ?? 0,
    };
  });

  return (
    <CertPathwayClient
      cert={{
        id: cert.id,
        slug: cert.slug,
        shortName: cert.short_name,
        name: cert.name,
        iconEmoji: cert.icon_emoji,
        colorHex: cert.color_hex,
      }}
      domains={domainData}
      isEnrolled={!!userCert}
      readinessScore={userCert?.readiness_score ?? 0}
      totalQuestions={totalQuestions}
    />
  );
}
