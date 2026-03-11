'use client';

import Link from 'next/link';

interface Domain {
  name: string;
  weight: number;
  completed: boolean;
  active: boolean;
}

interface CertPathCardProps {
  slug: string;
  name: string;
  shortName: string;
  icon: string;
  domains: Domain[];
  progress: number; // 0-100
  totalQuestions: number;
  color: string; // tailwind color class like 'cp-green'
  delay?: number;
}

export function CertPathCard({
  slug,
  name,
  shortName,
  icon,
  domains,
  progress,
  totalQuestions,
  color,
  delay = 0,
}: CertPathCardProps) {
  const colorMap: Record<string, { bg: string; border: string; text: string; dot: string; line: string; glow: string }> = {
    'cp-green': {
      bg: 'bg-cp-green/10',
      border: 'border-cp-green/30',
      text: 'text-cp-green',
      dot: 'bg-cp-green',
      line: 'bg-cp-green/30',
      glow: 'shadow-[0_0_12px_rgba(99,102,241,0.3)]',
    },
    'cp-accent': {
      bg: 'bg-cp-accent/10',
      border: 'border-cp-accent/30',
      text: 'text-cp-accent',
      dot: 'bg-cp-accent',
      line: 'bg-cp-accent/30',
      glow: 'shadow-[0_0_12px_rgba(16,185,129,0.3)]',
    },
    'cp-orange': {
      bg: 'bg-cp-orange/10',
      border: 'border-cp-orange/30',
      text: 'text-cp-orange',
      dot: 'bg-cp-orange',
      line: 'bg-cp-orange/30',
      glow: 'shadow-[0_0_12px_rgba(249,115,22,0.3)]',
    },
    'cp-purple': {
      bg: 'bg-cp-purple/10',
      border: 'border-cp-purple/30',
      text: 'text-cp-purple',
      dot: 'bg-cp-purple',
      line: 'bg-cp-purple/30',
      glow: 'shadow-[0_0_12px_rgba(168,85,247,0.3)]',
    },
    'cp-blue': {
      bg: 'bg-cp-blue/10',
      border: 'border-cp-blue/30',
      text: 'text-cp-blue',
      dot: 'bg-cp-blue',
      line: 'bg-cp-blue/30',
      glow: 'shadow-[0_0_12px_rgba(59,130,246,0.3)]',
    },
  };

  const c = colorMap[color] ?? colorMap['cp-green'];

  return (
    <Link
      href={`/certifications/${slug}`}
      className="animate-fade-up block rounded-2xl bg-white border-2 border-cp-border border-b-4 p-5 hover:border-cp-green/40 transition-all hover:-translate-y-1 group"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center text-2xl`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-extrabold text-base truncate">{shortName}</h3>
          <p className="text-xs text-cp-text-muted truncate">{name}</p>
        </div>
        <div className="text-right shrink-0">
          <p className={`font-mono font-black text-lg ${c.text}`}>{progress}%</p>
          <p className="text-[10px] text-cp-text-muted font-bold uppercase">Ready</p>
        </div>
      </div>

      {/* Visual Path */}
      <div className="relative pl-4 space-y-0">
        {domains.map((domain, i) => {
          const isLast = i === domains.length - 1;
          return (
            <div key={i} className="relative flex items-start gap-3 pb-3">
              {/* Connecting line */}
              {!isLast && (
                <div
                  className={`absolute left-0 top-4 w-0.5 h-full ${
                    domain.completed ? c.dot : 'bg-cp-border'
                  }`}
                  style={{ opacity: domain.completed ? 0.5 : 0.3 }}
                />
              )}
              {/* Node dot */}
              <div className="relative z-10 shrink-0 -ml-4">
                {domain.completed ? (
                  <div className={`w-4 h-4 rounded-full ${c.dot} flex items-center justify-center`}>
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : domain.active ? (
                  <div className={`w-4 h-4 rounded-full border-[3px] ${c.border} bg-white animate-pulse-glow`} />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-cp-border bg-cp-bg-secondary" />
                )}
              </div>
              {/* Label */}
              <div className="flex-1 min-w-0 -mt-0.5">
                <p className={`text-xs font-semibold truncate ${
                  domain.completed ? 'text-cp-text' : domain.active ? c.text : 'text-cp-text-muted'
                }`}>
                  {domain.name}
                </p>
                <p className="text-[10px] text-cp-text-muted font-mono">{domain.weight}% of exam</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-2 pt-3 border-t-2 border-cp-border flex items-center justify-between">
        <span className="text-xs text-cp-text-muted font-bold">{totalQuestions} questions</span>
        <span className={`text-xs font-extrabold uppercase tracking-wider ${c.text} group-hover:translate-x-1 transition-transform`}>
          Continue →
        </span>
      </div>
    </Link>
  );
}
