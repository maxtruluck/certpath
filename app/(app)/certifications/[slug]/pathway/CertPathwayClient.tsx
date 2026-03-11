'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PathwayMap } from './PathwayMap';

interface DomainData {
  id: string;
  name: string;
  slug: string;
  weightPercent: number;
  displayOrder: number;
  score: number;
  questionsAttempted: number;
  questionsCorrect: number;
}

interface CertData {
  id: string;
  slug: string;
  shortName: string;
  name: string;
  iconEmoji: string;
  colorHex: string;
}

interface CertPathwayClientProps {
  cert: CertData;
  domains: DomainData[];
  isEnrolled: boolean;
  readinessScore: number;
  totalQuestions: number;
}

export function CertPathwayClient({ cert, domains, isEnrolled, readinessScore, totalQuestions }: CertPathwayClientProps) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const readinessPct = Math.round(readinessScore * 100);

  function handleDomainSelect(domain: DomainData) {
    router.push(`/certifications/${cert.slug}/pathway/${domain.slug}`);
  }

  return (
    <div className="relative -mx-4 -mt-2 min-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-lg border-b-2 border-cp-border px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <Link href={`/certifications/${cert.slug}`} className="flex items-center gap-2 text-cp-text-muted hover:text-cp-text transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </Link>
          <div className="text-center">
            <div className="flex items-center gap-1.5">
              <span className="text-lg">{cert.iconEmoji}</span>
              <h1 className="font-extrabold text-sm">{cert.shortName}</h1>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="text-right">
              <p className="text-[9px] text-cp-text-muted uppercase tracking-widest font-bold">Ready</p>
              <p className="text-sm font-mono font-black text-cp-green">{readinessPct}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pathway Map */}
      <div className={`transition-opacity duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        <PathwayMap
          domains={domains}
          certSlug={cert.slug}
          isEnrolled={isEnrolled}
          onDomainSelect={handleDomainSelect}
        />
      </div>
    </div>
  );
}
