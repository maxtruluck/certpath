import { getAuthUser } from '@/lib/supabase/get-user';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils/format';

export default async function CertificationsPage() {
  const { supabase, userId } = await getAuthUser();
  if (!userId) redirect('/login');

  const { data: certifications } = await supabase
    .from('certifications')
    .select('*')
    .eq('is_active', true)
    .order('display_order');

  const { data: userCerts } = await supabase
    .from('user_certifications')
    .select('certification_id, status, readiness_score')
    .eq('user_id', userId);

  const userCertMap = new Map((userCerts ?? []).map((c) => [c.certification_id, c]));

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Certifications</h1>
      <p className="text-sm text-cp-text-muted">Browse available certifications and track your progress</p>

      <div className="space-y-3 stagger">
        {(certifications ?? []).map((cert) => {
          const userCert = userCertMap.get(cert.id);
          return (
            <Link key={cert.id} href={userCert?.status === 'active' ? `/certifications/${cert.slug}/pathway` : `/certifications/${cert.slug}`} className="block animate-fade-up">
              <div className="rounded-2xl bg-white border-2 border-cp-border p-5 hover:border-cp-green/40 transition-all group">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{cert.icon_emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold group-hover:text-cp-green transition-colors">{cert.short_name}</h3>
                      {userCert && (
                        <Badge variant={
                          userCert.status === 'completed' ? 'success' :
                          userCert.status === 'active' ? 'accent' : 'default'
                        }>
                          {userCert.status === 'completed' ? 'Earned' :
                           userCert.status === 'active' ? 'Active' : 'Enrolled'}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-cp-text-muted mt-1">{cert.name}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-cp-text-muted">
                      <span className="font-medium">{cert.provider_name}</span>
                      <span className="text-cp-border">|</span>
                      <span>Exam: {formatCurrency(cert.exam_fee_usd)}</span>
                      <span className="text-cp-border">|</span>
                      <span className="text-cp-success font-mono font-bold">+{formatCurrency(cert.avg_salary_bump_usd)}</span>
                    </div>
                    {userCert && (
                      <div className="mt-3 flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-cp-bg-secondary overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-cp-green to-cp-accent transition-all"
                            style={{ width: `${Math.round(userCert.readiness_score * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono font-bold text-cp-green">
                          {Math.round(userCert.readiness_score * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
