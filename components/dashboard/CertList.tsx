'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils/format';

interface CertItem {
  slug: string;
  name: string;
  shortName: string;
  iconEmoji: string;
  status: 'active' | 'not_started' | 'completed' | 'paused';
  readinessScore: number;
  salaryBump: number;
}

const statusBadges: Record<string, { label: string; variant: 'success' | 'warning' | 'accent' | 'default' }> = {
  active: { label: 'Active', variant: 'accent' },
  completed: { label: 'Earned', variant: 'success' },
  paused: { label: 'Paused', variant: 'warning' },
  not_started: { label: 'Locked', variant: 'default' },
};

export function CertList({ certs }: { certs: CertItem[] }) {
  return (
    <div className="rounded-2xl bg-white border-2 border-cp-border border-b-4 p-5 space-y-3 animate-fade-up">
      <h3 className="font-extrabold text-sm">Your Certifications</h3>
      <div className="space-y-2 stagger">
        {certs.map((cert) => {
          const badge = statusBadges[cert.status];
          return (
            <Link key={cert.slug} href={`/certifications/${cert.slug}`} className="block animate-fade-up">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-cp-bg-secondary hover:bg-cp-bg-secondary border-2 border-cp-border hover:border-cp-green/40 transition-all group">
                <span className="text-2xl">{cert.iconEmoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm group-hover:text-cp-green transition-colors">{cert.shortName}</p>
                  <p className="text-xs text-cp-text-muted">
                    <span className="font-mono font-extrabold">{Math.round(cert.readinessScore * 100)}%</span> ready
                    <span className="mx-1.5 text-cp-border">|</span>
                    <span className="text-cp-green font-mono font-extrabold">+{formatCurrency(cert.salaryBump)}</span>
                  </p>
                </div>
                <Badge variant={badge.variant}>{badge.label}</Badge>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
