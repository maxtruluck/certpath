'use client';

interface ExplanationPanelProps {
  isCorrect: boolean;
  explanation: string;
  xpEarned: number;
  nextReviewDays?: number;
  onNext: () => void;
  isLast: boolean;
  questionId?: string;
  onBookmark?: (questionId: string) => void;
  isBookmarked?: boolean;
}

export function ExplanationPanel({ isCorrect, explanation, xpEarned, nextReviewDays, onNext, isLast, questionId, onBookmark, isBookmarked }: ExplanationPanelProps) {
  return (
    <div className="animate-slide-up mt-6 space-y-4">
      {/* Result header */}
      <div className={`flex items-center gap-3 p-4 rounded-2xl border-2 border-b-4 ${
        isCorrect
          ? 'bg-cp-green/10 border-cp-green/30 text-cp-green'
          : 'bg-cp-danger/10 border-cp-danger/30 text-cp-danger'
      }`}>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg font-black ${
          isCorrect ? 'bg-cp-green text-white' : 'bg-cp-danger text-white'
        }`}>
          {isCorrect ? '✓' : '✗'}
        </div>
        <div className="flex-1">
          <span className="font-extrabold text-base">{isCorrect ? 'Correct!' : 'Not quite'}</span>
          {isCorrect && <p className="text-xs opacity-80 mt-0.5 font-bold">Keep it up!</p>}
        </div>
        <span className="font-mono text-sm font-black xp-pop">+{xpEarned} XP</span>
      </div>

      {/* Explanation */}
      <div className="rounded-2xl bg-white border-2 border-cp-border p-4 space-y-2">
        <p className="text-[13px] leading-relaxed text-cp-text-secondary font-medium">{explanation}</p>
        {nextReviewDays !== undefined && (
          <p className="text-xs text-cp-text-muted flex items-center gap-1.5 font-bold">
            <span>📅</span> Review again in {nextReviewDays} {nextReviewDays === 1 ? 'day' : 'days'}
          </p>
        )}
      </div>

      {/* Bookmark button */}
      {questionId && onBookmark && (
        <button
          onClick={(e) => { e.stopPropagation(); onBookmark(questionId); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            isBookmarked
              ? 'bg-cp-warning/15 text-cp-warning border-2 border-cp-warning/25'
              : 'bg-cp-bg-secondary text-cp-text-muted border-2 border-cp-border hover:border-cp-warning/30'
          }`}
        >
          <svg className="w-4 h-4" fill={isBookmarked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
          </svg>
          {isBookmarked ? 'Bookmarked' : 'Bookmark'}
        </button>
      )}

      {/* Next button */}
      <button
        onClick={onNext}
        className="btn-primary w-full py-4 text-sm"
      >
        {isLast ? 'Complete Session' : 'Continue'}
      </button>
    </div>
  );
}
