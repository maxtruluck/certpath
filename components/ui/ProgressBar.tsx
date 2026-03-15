'use client';

interface ProgressBarProps {
  value: number;
  color?: 'accent' | 'success' | 'warning' | 'danger' | 'auto';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function ProgressBar({ value, color = 'auto', size = 'md', showLabel = false, className = '' }: ProgressBarProps) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);

  const resolvedColor = color === 'auto'
    ? pct >= 75 ? 'success' : pct >= 50 ? 'warning' : 'danger'
    : color;

  const barColors = {
    accent: 'bg-cp-green',
    success: 'bg-cp-success',
    warning: 'bg-cp-warning',
    danger: 'bg-cp-danger',
  };

  const textColors = {
    accent: 'text-cp-green',
    success: 'text-cp-success',
    warning: 'text-cp-warning',
    danger: 'text-cp-danger',
  };

  const heights = { sm: 'h-2', md: 'h-3', lg: 'h-4' };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        className={`flex-1 rounded-full bg-cp-bg-secondary overflow-hidden ${heights[size]}`}
      >
        <div
          className={`${heights[size]} rounded-full transition-all duration-700 ease-out progress-shine ${barColors[resolvedColor]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className={`text-xs font-mono font-extrabold min-w-[3ch] text-right ${textColors[resolvedColor]}`}>{pct}%</span>
      )}
    </div>
  );
}
