import { getAuthUser } from '@/lib/supabase/get-user';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ReadinessGauge } from '@/components/gamification/ReadinessGauge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils/format';
import { CertDetailActions } from './CertDetailActions';

export default async function CertDetailPage({ params }: { params: Promise<{ slug: string }> }) {
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
  const scoreMap = new Map((scoresResult.data ?? []).map((s) => [s.domain_id, s]));
  const totalQuestions = questionCountResult.count ?? 0;

  let sprintLabel = '';
  if (userCert?.sprint_type === 'sprint_30') sprintLabel = '30-Day Sprint';
  else if (userCert?.sprint_type === 'sprint_60') sprintLabel = '60-Day Sprint';
  else if (userCert?.sprint_type === 'sprint_90') sprintLabel = '90-Day Sprint';

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 animate-fade-up">
        <span className="text-4xl">{cert.icon_emoji}</span>
        <div>
          <h1 className="text-xl font-bold">{cert.short_name}</h1>
          <p className="text-sm text-cp-text-muted">{cert.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5 animate-fade-up">
        <div className="rounded-xl bg-white border-2 border-cp-border p-3.5 text-center">
          <p className="text-lg font-bold font-mono">{formatCurrency(cert.exam_fee_usd)}</p>
          <p className="text-[10px] text-cp-text-muted uppercase tracking-wider font-bold">Exam Fee</p>
        </div>
        <div className="rounded-xl bg-white border-2 border-cp-border p-3.5 text-center">
          <p className="text-lg font-bold font-mono text-cp-success">+{formatCurrency(cert.avg_salary_bump_usd)}</p>
          <p className="text-[10px] text-cp-text-muted uppercase tracking-wider font-bold">Salary Bump</p>
        </div>
        <div className="rounded-xl bg-white border-2 border-cp-border p-3.5 text-center">
          <p className="text-lg font-bold font-mono">{cert.exam_duration_minutes}m</p>
          <p className="text-[10px] text-cp-text-muted uppercase tracking-wider font-bold">Exam Time</p>
        </div>
      </div>

      {userCert && (
        <div className="rounded-2xl bg-white border-2 border-cp-border p-5 flex items-center justify-between animate-fade-up">
          <div>
            <p className="text-[10px] text-cp-text-muted uppercase tracking-widest font-bold">Your Readiness</p>
            {sprintLabel && <Badge variant="accent" className="mt-1.5">{sprintLabel}</Badge>}
            <p className="text-sm text-cp-text-muted mt-2">
              <span className="font-mono font-bold">{userCert.questions_attempted}</span> / {totalQuestions} questions attempted
            </p>
            <p className="text-sm text-cp-text-muted">
              <span className="font-mono font-bold">{userCert.questions_correct}</span> correct
              <span className="text-cp-success ml-1 font-mono font-bold">
                ({userCert.questions_attempted > 0 ? Math.round((userCert.questions_correct / userCert.questions_attempted) * 100) : 0}%)
              </span>
            </p>
          </div>
          <ReadinessGauge score={userCert.readiness_score} size="md" />
        </div>
      )}

      {/* Pathway CTA */}
      <Link
        href={`/certifications/${cert.slug}/pathway`}
        className="block rounded-2xl bg-gradient-to-r from-cp-green/10 to-cp-accent/10 border-2 border-cp-green/30 p-5 hover:border-cp-green/60 transition-all group animate-fade-up"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cp-green/20 flex items-center justify-center">
              <span className="text-xl">🗺️</span>
            </div>
            <div>
              <p className="font-extrabold text-sm group-hover:text-cp-green transition-colors">Skill Tree</p>
              <p className="text-xs text-cp-text-muted">Interactive domain pathway</p>
            </div>
          </div>
          <svg className="w-5 h-5 text-cp-green group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </div>
      </Link>

      <div className="rounded-2xl bg-white border-2 border-cp-border p-5 space-y-3 animate-fade-up">
        <h3 className="font-bold text-sm">Exam Domains</h3>
        <div className="space-y-3 stagger">
          {domains.map((domain) => {
            const score = scoreMap.get(domain.id);
            return (
              <div key={domain.id} className="animate-fade-up">
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-cp-text-secondary truncate mr-2 font-medium">{domain.name}</span>
                  <span className="font-mono text-xs text-cp-text-muted font-bold shrink-0">{domain.weight_percent}%</span>
                </div>
                <ProgressBar value={score?.score ?? 0} size="sm" showLabel />
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl bg-white border-2 border-cp-border p-5 animate-fade-up">
        <h3 className="font-bold text-sm mb-2">About This Certification</h3>
        <p className="text-sm text-cp-text-muted leading-relaxed">{cert.description}</p>
        <div className="mt-3 flex items-center gap-4 text-sm">
          <div>
            <span className="text-cp-text-muted">Provider: </span>
            <span className="font-medium">{cert.provider_name}</span>
          </div>
          <span className="text-cp-border">|</span>
          <div>
            <span className="text-cp-text-muted">Passing: </span>
            <span className="font-mono font-bold">{cert.passing_score}/{cert.max_score}</span>
          </div>
        </div>
      </div>

      <CertDetailActions
        certId={cert.id}
        certSlug={cert.slug}
        isEnrolled={!!userCert}
        status={userCert?.status ?? null}
        totalQuestions={totalQuestions}
      />
    </div>
  );
}
