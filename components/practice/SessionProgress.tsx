'use client';

interface SessionProgressProps {
  current: number;
  total: number;
}

export function SessionProgress({ current, total }: SessionProgressProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1 flex-1">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full transition-all duration-300 ${
              i < current
                ? 'bg-cp-success'
                : i === current
                ? 'bg-cp-green animate-pulse'
                : 'bg-cp-bg-secondary'
            }`}
          />
        ))}
      </div>
      <span className="text-xs font-mono font-bold text-cp-text-muted whitespace-nowrap ml-1">
        {current + 1}/{total}
      </span>
    </div>
  );
}
