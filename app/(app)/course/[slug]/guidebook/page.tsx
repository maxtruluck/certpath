'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

interface GuidebookData {
  topic_id: string;
  topic_title: string;
  content_html: string;
  key_concepts: string[];
  prev_topic?: { id: string; title: string };
  next_topic?: { id: string; title: string };
}

function GuidebookContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const topicId = searchParams.get('topic');

  const [data, setData] = useState<GuidebookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!topicId) {
      setError('No topic specified');
      setLoading(false);
      return;
    }

    async function fetchGuidebook() {
      try {
        const res = await fetch(`/api/topics/${topicId}/guidebook`);
        if (!res.ok) throw new Error('Failed to load guidebook');
        const result = await res.json();
        setData(result);
      } catch (err) {
        setError('Could not load guidebook content');
        console.error('Guidebook fetch error:', err);
      }
      setLoading(false);
    }

    fetchGuidebook();
  }, [topicId]);

  function navigateToTopic(newTopicId: string) {
    setLoading(true);
    setData(null);
    setError(null);
    router.replace(`/course/${slug}/guidebook?topic=${newTopicId}`);
  }

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-white">
        <div className="max-w-lg mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div className="h-6 w-48 bg-gray-100 rounded animate-pulse" />
            <div className="w-8 h-8 bg-gray-100 rounded-full animate-pulse" />
          </div>
          <div className="space-y-3 mt-4">
            <div className="h-4 bg-gray-100 rounded w-full animate-pulse" />
            <div className="h-4 bg-gray-100 rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-gray-100 rounded w-5/6 animate-pulse" />
            <div className="h-4 bg-gray-100 rounded w-2/3 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[100dvh] bg-white">
        <div className="max-w-lg mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <button
              onClick={() => router.push(`/course/${slug}/path`)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">{error || 'Guidebook not found'}</p>
            <button
              onClick={() => router.push(`/course/${slug}/path`)}
              className="text-blue-500 font-medium text-sm"
            >
              Back to path
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-white">
      <div className="max-w-lg mx-auto px-4 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between py-4 sticky top-0 bg-white z-10 border-b border-gray-100">
          <h1 className="text-base font-semibold text-gray-900 truncate pr-4">
            {data.topic_title}
          </h1>
          <button
            onClick={() => router.push(`/course/${slug}/path`)}
            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 rounded-full hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="mt-6">
          <div
            className="prose prose-sm prose-gray max-w-none [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-gray-700 [&_ul]:text-sm [&_ul]:text-gray-700 [&_ol]:text-sm [&_ol]:text-gray-700 [&_code]:text-xs [&_code]:bg-gray-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_pre]:bg-gray-50 [&_pre]:rounded-xl [&_pre]:p-4 [&_pre]:text-xs"
            dangerouslySetInnerHTML={{ __html: data.content_html }}
          />
        </div>

        {/* Key Concepts */}
        {data.key_concepts && data.key_concepts.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Key concepts</h2>
            <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4 space-y-2">
              {data.key_concepts.map((concept, i) => (
                <div key={i} className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-blue-900">{concept}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Prev/Next navigation */}
        <div className="mt-8 flex items-center gap-3">
          {data.prev_topic ? (
            <button
              onClick={() => navigateToTopic(data.prev_topic!.id)}
              className="flex-1 flex items-center gap-2 py-3 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              <div className="text-left min-w-0">
                <p className="text-[10px] text-gray-400 uppercase font-medium">Previous</p>
                <p className="text-xs text-gray-700 font-medium truncate">{data.prev_topic.title}</p>
              </div>
            </button>
          ) : (
            <div className="flex-1" />
          )}

          {data.next_topic ? (
            <button
              onClick={() => navigateToTopic(data.next_topic!.id)}
              className="flex-1 flex items-center justify-end gap-2 py-3 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="text-right min-w-0">
                <p className="text-[10px] text-gray-400 uppercase font-medium">Next</p>
                <p className="text-xs text-gray-700 font-medium truncate">{data.next_topic.title}</p>
              </div>
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          ) : (
            <div className="flex-1" />
          )}
        </div>
      </div>
    </div>
  );
}

export default function GuidebookPage() {
  return (
    <Suspense fallback={
      <div className="space-y-4 animate-pulse">
        <div className="h-6 bg-gray-100 rounded w-48" />
        <div className="h-4 bg-gray-100 rounded w-full" />
        <div className="h-4 bg-gray-100 rounded w-5/6" />
      </div>
    }>
      <GuidebookContent />
    </Suspense>
  );
}
