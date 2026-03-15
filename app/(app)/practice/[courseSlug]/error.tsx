'use client';

export default function PracticeError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="w-12 h-12 rounded-full bg-cp-danger/10 flex items-center justify-center mb-4">
        <span className="text-cp-danger text-xl">!</span>
      </div>
      <h2 className="text-lg font-semibold text-cp-text mb-2">Practice session error</h2>
      <p className="text-sm text-cp-text-muted mb-6">
        Something went wrong during your practice session. Your progress has been saved.
      </p>
      <button
        onClick={reset}
        className="px-6 py-2.5 rounded-xl bg-cp-primary text-white text-sm font-semibold transition-colors hover:bg-cp-primary/90"
      >
        Try again
      </button>
    </div>
  );
}
