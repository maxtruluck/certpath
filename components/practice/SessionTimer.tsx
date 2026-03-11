'use client';

import { useState, useEffect } from 'react';

interface SessionTimerProps {
  startTime: number | null;
  questionStartTime: number | null;
}

export function SessionTimer({ startTime, questionStartTime }: SessionTimerProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const sessionSeconds = startTime ? Math.floor((now - startTime) / 1000) : 0;
  const questionSeconds = questionStartTime ? Math.floor((now - questionStartTime) / 1000) : 0;

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center justify-between text-xs font-mono font-bold text-cp-text-muted">
      <div className="flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{formatTime(sessionSeconds)}</span>
      </div>
      <span className="text-cp-accent font-extrabold">This Q: {formatTime(questionSeconds)}</span>
    </div>
  );
}
