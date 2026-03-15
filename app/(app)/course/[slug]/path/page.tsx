'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Topic {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  display_order: number;
  status: 'completed' | 'current' | 'locked';
  readiness: number;
  questions_seen: number;
  questions_total: number;
}

interface Module {
  id: string;
  title: string;
  description: string | null;
  weight_percent: number;
  display_order: number;
  topics: Topic[];
}

interface PathData {
  course_id: string;
  course_title?: string;
  readiness_score: number;
  current_topic_id: string | null;
  modules: Module[];
}

export default function CoursePathPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [path, setPath] = useState<PathData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPath() {
      try {
        const res = await fetch(`/api/courses/${slug}/path`);
        if (res.status === 403) {
          router.replace(`/course/${slug}/enroll`);
          return;
        }
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setPath(data);
      } catch (err) {
        setError('Something went wrong');
        console.error('Path fetch error:', err);
      }
      setLoading(false);
    }
    fetchPath();
  }, [slug, router]);

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 space-y-4 animate-pulse">
        <div className="flex items-center justify-between py-4">
          <div className="h-5 bg-gray-100 rounded w-16" />
          <div className="h-5 bg-gray-100 rounded w-12" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3">
            <div className="h-10 bg-gray-100 rounded-xl w-full" />
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-gray-100 rounded-full" />
              <div className="w-12 h-12 bg-gray-100 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !path) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">{error || 'Path not found'}</p>
        <button onClick={() => router.push('/home')} className="text-blue-500 font-medium text-sm">
          Back to home
        </button>
      </div>
    );
  }

  const readinessPct = Math.round((path.readiness_score || 0) * 100);
  let moduleCounter = 0;

  const allCompleted = path.modules.every((m) => m.topics.every((t) => t.status === 'completed'));

  // Zigzag positions: each topic alternates in a pattern
  const zigzagPositions = ['center-left', 'center', 'center-right', 'center'] as const;

  function getZigzagClass(globalIdx: number): string {
    const pos = zigzagPositions[globalIdx % zigzagPositions.length];
    switch (pos) {
      case 'center-left': return 'mr-auto ml-8';
      case 'center-right': return 'ml-auto mr-8';
      case 'center': return 'mx-auto';
      default: return 'mx-auto';
    }
  }

  let globalTopicIndex = 0;

  return (
    <div className="min-h-[100dvh] bg-white">
      <div className="max-w-lg mx-auto px-4 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between py-4">
          <button
            onClick={() => router.push('/home')}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Home
          </button>
          <h1 className="text-sm font-semibold text-gray-900">
            {path.course_title || 'Course'}
          </h1>
          <span className="text-sm font-medium text-gray-500 font-mono">{readinessPct}%</span>
        </div>

        {/* Course complete banner */}
        {allCompleted && (
          <Link
            href={`/course/${slug}/complete`}
            className="block rounded-2xl bg-green-50 border border-green-200 p-4 text-center hover:bg-green-100 transition-colors mb-6"
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold text-green-700 text-sm">All topics completed! View results</span>
            </div>
          </Link>
        )}

        {/* Modules and zigzag path */}
        <div className="space-y-2 mt-2">
          {path.modules.map((mod) => {
            moduleCounter++;
            const moduleNum = moduleCounter;

            return (
              <div key={mod.id} className="animate-fade-up">
                {/* Module header pill - centered */}
                <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 mb-6 text-center">
                  <h2 className="text-sm font-semibold text-gray-900">
                    Module {moduleNum}: {mod.title}
                    {mod.weight_percent > 0 && (
                      <span className="text-gray-400 font-normal"> ({mod.weight_percent}%)</span>
                    )}
                  </h2>
                </div>

                {/* Zigzag topic nodes */}
                <div className="relative flex flex-col items-center">
                  {mod.topics.map((topic, topicIdx) => {
                    const topicNum = `${moduleNum}.${topicIdx + 1}`;
                    const isCompleted = topic.status === 'completed';
                    const isCurrent = topic.status === 'current';
                    const isLocked = topic.status === 'locked';
                    const zigzagClass = getZigzagClass(globalTopicIndex);
                    globalTopicIndex++;

                    return (
                      <div key={topic.id} className="w-full">
                        {/* Connecting line */}
                        {topicIdx > 0 && (
                          <div className="flex justify-center">
                            <div className={`w-0.5 h-8 ${isCompleted || isCurrent ? 'bg-green-300' : 'bg-gray-200'}`} />
                          </div>
                        )}

                        {/* Topic node */}
                        <div className={`flex flex-col items-center w-fit ${zigzagClass}`}>
                          {isCurrent ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => router.push(`/practice/${slug}?topic=${topic.id}`)}
                                className="relative"
                              >
                                <div className="absolute inset-0 w-12 h-12 rounded-full bg-blue-400 opacity-20 animate-ping" />
                                <div className="w-12 h-12 rounded-full border-[3px] border-blue-500 bg-white flex items-center justify-center shadow-sm relative z-10">
                                  <span className="text-xs font-bold text-blue-600">{topicNum}</span>
                                </div>
                              </button>
                              <Link
                                href={`/course/${slug}/guidebook?topic=${topic.id}`}
                                className="w-7 h-7 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center hover:bg-gray-200 transition-colors"
                              >
                                <span className="text-xs text-gray-500">?</span>
                              </Link>
                            </div>
                          ) : isCompleted ? (
                            <button
                              onClick={() => router.push(`/practice/${slug}?topic=${topic.id}`)}
                              className="w-12 h-12 rounded-full border-2 border-green-500 bg-white flex items-center justify-center"
                            >
                              <span className="text-xs font-bold text-green-600">{topicNum}</span>
                            </button>
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
                              <span className="text-xs font-medium text-gray-400">{topicNum}</span>
                            </div>
                          )}

                          {/* Topic label */}
                          <p className={`text-xs mt-1.5 text-center max-w-[120px] ${
                            isCurrent ? 'text-gray-900 font-medium' :
                            isCompleted ? 'text-gray-700' :
                            'text-gray-400'
                          }`}>
                            {topic.title}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Spacer between modules */}
                {moduleCounter < path.modules.length && (
                  <div className="flex justify-center mt-2">
                    <div className="w-0.5 h-6 bg-gray-200" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
