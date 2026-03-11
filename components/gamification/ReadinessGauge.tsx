'use client';

interface ReadinessGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

export function ReadinessGauge({ score, size = 'md' }: ReadinessGaugeProps) {
  const pct = Math.round(score * 100);
  const radius = size === 'sm' ? 28 : size === 'md' ? 42 : 56;
  const strokeWidth = size === 'sm' ? 6 : size === 'md' ? 7 : 8;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score);
  const svgSize = (radius + strokeWidth) * 2;

  const color = pct >= 75 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';
  const fontSize = size === 'sm' ? 'text-sm' : size === 'md' ? 'text-2xl' : 'text-4xl';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={svgSize} height={svgSize} className="-rotate-90">
        <circle
          cx={radius + strokeWidth}
          cy={radius + strokeWidth}
          r={radius}
          fill="none"
          stroke="#cbd5e1"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={radius + strokeWidth}
          cy={radius + strokeWidth}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-mono font-black ${fontSize}`} style={{ color }}>
          {pct}%
        </span>
        {size !== 'sm' && (
          <span className="text-[9px] text-cp-text-muted uppercase tracking-widest font-extrabold">Ready</span>
        )}
      </div>
    </div>
  );
}
