'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppStore, type SessionReviewData } from '@/lib/store';

interface Mistake {
  question_id: string;
  topic_title: string;
  question_text: string;
  question_type: string;
  options: { id: string; text: string }[];
  selected_option_ids: string[];
  correct_option_ids: string[];
  explanation: string;
}

export default function ReviewMistakesPage() {
  const router = useRouter();
  const params = useParams();
  const courseSlug = params.courseSlug as string;
  const { sessionReview, sessionId } = useAppStore();
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to get mistakes from the session review API
    async function loadMistakes() {
      if (sessionId) {
        try {
          const res = await fetch(`/api/session/${sessionId}/review`);
          if (res.ok) {
            const data = await res.json();
            if (data.mistakes) {
              setMistakes(data.mistakes);
              setLoading(false);
              return;
            }
          }
        } catch { /* fallback below */ }
      }

      // Fallback: use sessionReview from store if it has mistakes
      if (sessionReview && 'mistakes' in sessionReview && Array.isArray((sessionReview as any).mistakes)) {
        setMistakes((sessionReview as any).mistakes);
      }
      setLoading(false);
    }

    loadMistakes();
  }, [sessionId, sessionReview]);

  const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];

  function getLabel(options: { id: string; text: string }[], optionId: string): string {
    const idx = options.findIndex((o) => o.id === optionId);
    return idx >= 0 ? optionLabels[idx] : '?';
  }

  function getText(options: { id: string; text: string }[], optionId: string): string {
    return options.find((o) => o.id === optionId)?.text ?? '';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    );
  }

  if (mistakes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <p className="text-gray-500">No mistakes to review</p>
          <button
            onClick={() => router.push(`/course/${courseSlug}/path`)}
            className="text-blue-500 font-medium text-sm"
          >
            Back to path
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-white">
      <div className="max-w-lg mx-auto px-4 pb-8">
        {/* Header */}
        <div className="flex items-center gap-3 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back
          </button>
          <h1 className="text-sm font-semibold text-gray-900 flex-1 text-center">Review mistakes</h1>
          <div className="w-12" />
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-500">
            {mistakes.length} question{mistakes.length !== 1 ? 's' : ''} to review
          </p>
        </div>

        {/* Mistake cards */}
        <div className="space-y-6">
          {mistakes.map((m, idx) => {
            const yourAnswerId = m.selected_option_ids[0];
            const correctId = m.correct_option_ids[0];

            return (
              <div
                key={m.question_id}
                className="rounded-2xl border border-gray-200 p-4 space-y-3 animate-fade-up"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {/* Topic + incorrect badge */}
                <div className="flex items-center gap-2 flex-wrap">
                  {m.topic_title && (
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                      {m.topic_title}
                    </span>
                  )}
                  <span className="text-xs font-medium text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                    Incorrect
                  </span>
                </div>

                {/* Question text */}
                <p className="text-sm font-medium text-gray-900 leading-relaxed">
                  {m.question_text}
                </p>

                {/* Your answer */}
                {m.question_type === 'ordering' ? (
                  <>
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-red-500 font-medium mt-0.5 flex-shrink-0">Your order:</span>
                      <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl">
                        <ol className="list-decimal list-inside">
                          {m.selected_option_ids.map((id) => (
                            <li key={id}>{getText(m.options, id)}</li>
                          ))}
                        </ol>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-green-600 font-medium mt-0.5 flex-shrink-0">Correct order:</span>
                      <div className="text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-xl">
                        <ol className="list-decimal list-inside">
                          {m.correct_option_ids.map((id) => (
                            <li key={id}>{getText(m.options, id)}</li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  </>
                ) : m.question_type === 'multiple_select' ? (
                  <>
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-red-500 font-medium mt-0.5 flex-shrink-0">Your answers:</span>
                      <div className="flex flex-wrap gap-1">
                        {m.selected_option_ids.map((id) => (
                          <span key={id} className="text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl">
                            {getLabel(m.options, id)}. {getText(m.options, id)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-green-600 font-medium mt-0.5 flex-shrink-0">Correct:</span>
                      <div className="flex flex-wrap gap-1">
                        {m.correct_option_ids.map((id) => (
                          <span key={id} className="text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-xl">
                            {getLabel(m.options, id)}. {getText(m.options, id)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {yourAnswerId && (
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-red-500 font-medium mt-0.5 flex-shrink-0">Your answer:</span>
                        <span className="text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl">
                          {getLabel(m.options, yourAnswerId)}. {getText(m.options, yourAnswerId)}
                        </span>
                      </div>
                    )}
                    {correctId && (
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-green-600 font-medium mt-0.5 flex-shrink-0">Correct:</span>
                        <span className="text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-xl">
                          {getLabel(m.options, correctId)}. {getText(m.options, correctId)}
                        </span>
                      </div>
                    )}
                  </>
                )}

                {/* Explanation */}
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-sm text-gray-600 leading-relaxed">{m.explanation}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Back to path button */}
        <div className="mt-8">
          <button
            onClick={() => router.push(`/course/${courseSlug}/path`)}
            className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-colors"
          >
            Back to path
          </button>
        </div>
      </div>
    </div>
  );
}
