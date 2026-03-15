'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface ModuleReadiness {
  module_title: string;
  readiness: number;
}

interface CourseCompleteData {
  course_title: string;
  final_readiness: number;
  questions_seen: number;
  accuracy: number;
  sessions_completed: number;
  module_readiness: ModuleReadiness[];
}

export default function CourseCompletePage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [data, setData] = useState<CourseCompleteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCompletion() {
      try {
        const res = await fetch(`/api/courses/${slug}/complete`);
        if (!res.ok) throw new Error('Failed to load');
        const result = await res.json();
        setData(result);
      } catch (err) {
        setError('Could not load course completion data');
        console.error('Course complete fetch error:', err);
      }
      setLoading(false);
    }
    fetchCompletion();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-gray-500 text-sm">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">{error || 'Not found'}</p>
        <button
          onClick={() => router.push(`/course/${slug}/path`)}
          className="text-blue-500 font-medium text-sm"
        >
          Back to path
        </button>
      </div>
    );
  }

  const readinessPct = Math.round(data.final_readiness * 100);
  const accuracyPct = Math.round(data.accuracy * 100);

  return (
    <div className="min-h-[100dvh] bg-white">
      <div className="max-w-lg mx-auto px-4 pb-8">
        {/* Success icon */}
        <div className="text-center pt-12 pb-6 animate-fade-up">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
            <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Course complete!</h1>
          <p className="text-sm text-gray-500 mt-2 px-4">
            You completed all topics in {data.course_title}
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-6 animate-fade-up" style={{ animationDelay: '100ms' }}>
          <div className="rounded-2xl bg-green-50 border border-green-200 p-4 text-center">
            <p className="text-2xl font-bold text-green-600 font-mono">{readinessPct}%</p>
            <p className="text-xs text-gray-500 mt-1">Final readiness</p>
          </div>
          <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4 text-center">
            <p className="text-2xl font-bold text-blue-600 font-mono">{data.questions_seen}</p>
            <p className="text-xs text-gray-500 mt-1">Questions seen</p>
          </div>
          <div className="rounded-2xl bg-purple-50 border border-purple-200 p-4 text-center">
            <p className="text-2xl font-bold text-purple-600 font-mono">{accuracyPct}%</p>
            <p className="text-xs text-gray-500 mt-1">Accuracy</p>
          </div>
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-center">
            <p className="text-2xl font-bold text-amber-600 font-mono">{data.sessions_completed}</p>
            <p className="text-xs text-gray-500 mt-1">Sessions</p>
          </div>
        </div>

        {/* Module readiness breakdown */}
        {data.module_readiness && data.module_readiness.length > 0 && (
          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4 mb-6 animate-fade-up" style={{ animationDelay: '200ms' }}>
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Module readiness</h2>
            <div className="space-y-3">
              {data.module_readiness.map((mod) => {
                const modPct = Math.round(mod.readiness * 100);
                return (
                  <div key={mod.module_title}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700 truncate pr-2">{mod.module_title}</span>
                      <span className="text-sm font-mono font-medium text-gray-900 flex-shrink-0">{modPct}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${modPct}%`,
                          backgroundColor: modPct >= 80 ? '#22C55E' : modPct >= 50 ? '#3B82F6' : '#F59E0B',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-3 animate-fade-up" style={{ animationDelay: '300ms' }}>
          <button
            onClick={() => router.push('/browse')}
            className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-colors"
          >
            Browse more courses
          </button>
          <button
            onClick={() => router.push(`/course/${slug}/path`)}
            className="w-full py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 font-medium hover:bg-gray-100 transition-colors"
          >
            Keep practicing reviews
          </button>
        </div>
      </div>
    </div>
  );
}
