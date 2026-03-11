'use client';

import { useState } from 'react';

interface ReviewQuestion {
  id: string;
  question_text: string;
  options: { id: string; text: string }[];
  correct_option_ids: string[];
  explanation: string;
  domain_id: string;
}

interface ReviewAnswer {
  selectedIds: string[];
  isCorrect: boolean;
  timeMs: number;
}

interface ReviewPanelProps {
  questions: ReviewQuestion[];
  answers: Record<string, ReviewAnswer>;
}

export function ReviewPanel({ questions, answers }: ReviewPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <h3 className="font-extrabold text-sm uppercase tracking-wider text-cp-text-muted">Question Review</h3>
      {questions.map((q, i) => {
        const answer = answers[q.id];
        const isExpanded = expandedId === q.id;
        const isCorrect = answer?.isCorrect ?? false;
        const timeSeconds = answer ? Math.round(answer.timeMs / 1000) : 0;

        return (
          <button
            key={q.id}
            onClick={() => setExpandedId(isExpanded ? null : q.id)}
            className={`w-full text-left rounded-2xl border-2 border-b-4 transition-all ${
              isCorrect
                ? 'border-cp-green/30 bg-cp-green/5'
                : 'border-cp-danger/30 bg-cp-danger/5'
            }`}
          >
            {/* Header - always visible */}
            <div className="flex items-center gap-3 p-4">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${
                isCorrect ? 'bg-cp-green text-white' : 'bg-cp-danger text-white'
              }`}>
                {isCorrect ? '✓' : '✗'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold leading-snug line-clamp-2">{q.question_text}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[11px] font-mono font-bold text-cp-text-muted">{timeSeconds}s</span>
                  <span className="text-[11px] font-bold text-cp-text-muted">Q{i + 1}</span>
                </div>
              </div>
              <svg
                className={`w-5 h-5 text-cp-text-muted shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </div>

            {/* Expanded content */}
            {isExpanded && (
              <div className="px-4 pb-4 space-y-3 animate-fade-up">
                <div className="h-px bg-cp-border" />
                {/* Options */}
                <div className="space-y-2">
                  {q.options.map((opt) => {
                    const isSelected = answer?.selectedIds.includes(opt.id);
                    const isCorrectOpt = q.correct_option_ids.includes(opt.id);
                    return (
                      <div
                        key={opt.id}
                        className={`flex items-start gap-2.5 p-3 rounded-xl text-sm ${
                          isCorrectOpt
                            ? 'bg-cp-green/10 border border-cp-green/30'
                            : isSelected
                            ? 'bg-cp-danger/10 border border-cp-danger/30'
                            : 'bg-cp-bg-secondary border border-transparent'
                        }`}
                      >
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5 ${
                          isCorrectOpt
                            ? 'bg-cp-green text-white'
                            : isSelected
                            ? 'bg-cp-danger text-white'
                            : 'bg-cp-surface-light text-cp-text-muted'
                        }`}>
                          {isCorrectOpt ? '✓' : isSelected ? '✗' : opt.id.toUpperCase()}
                        </span>
                        <span className="font-medium leading-relaxed">{opt.text}</span>
                      </div>
                    );
                  })}
                </div>
                {/* Explanation */}
                <div className="rounded-xl bg-white border border-cp-border p-3">
                  <p className="text-[13px] text-cp-text-secondary leading-relaxed font-medium">{q.explanation}</p>
                </div>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
