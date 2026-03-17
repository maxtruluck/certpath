'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import MarkdownContent from '@/components/ui/MarkdownContent';

// ─── Types ───────────────────────────────────────────────────────
interface Lesson {
  id: string;
  title: string;
  body: string;
  display_order: number;
}

interface TopicAssessment {
  id: string;
  title: string;
  assessment_type: string;
  question_count: number;
  passing_score_percent: number;
}

interface GuidebookData {
  id: string;
  title: string;
  course_id: string;
  guidebook_content: string | null;
  lessons: Lesson[];
  assessments: TopicAssessment[];
  prev: { id: string; title: string } | null;
  next: { id: string; title: string } | null;
}

// ─── Reading Progress Bar ────────────────────────────────────────
function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function handleScroll() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) { setProgress(100); return; }
      setProgress(Math.min(100, Math.round((scrollTop / docHeight) * 100)));
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-transparent">
      <div
        className="h-full bg-green-500 opacity-70 transition-[width] duration-150"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// ─── Main Content ────────────────────────────────────────────────
function GuidebookContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const topicId = searchParams.get('topic');
  const fromPath = searchParams.get('from') === 'path';

  const [data, setData] = useState<GuidebookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);
  const [markingRead, setMarkingRead] = useState(false);

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

  const markReadAndPractice = useCallback(async () => {
    if (!topicId || !data) return;
    setMarkingRead(true);
    try {
      await fetch(`/api/user/topic-read/${topicId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: data.course_id }),
      });
    } catch { /* non-blocking */ }
    router.push(`/practice/${slug}?topic=${topicId}&session_type=learn`);
  }, [topicId, data, slug, router]);

  function skipToPractice() {
    router.push(`/practice/${slug}?topic=${topicId}&session_type=learn`);
  }

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[#FAFAF8]">
        <div className="max-w-lg mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div className="h-6 w-48 bg-[#EBE8E2] rounded animate-pulse" />
            <div className="w-8 h-8 bg-[#EBE8E2] rounded-full animate-pulse" />
          </div>
          <div className="space-y-3 mt-4">
            <div className="h-4 bg-[#EBE8E2] rounded w-full animate-pulse" />
            <div className="h-4 bg-[#EBE8E2] rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-[#EBE8E2] rounded w-5/6 animate-pulse" />
            <div className="h-4 bg-[#EBE8E2] rounded w-2/3 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[100dvh] bg-[#FAFAF8]">
        <div className="max-w-lg mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <button
              onClick={() => router.push(`/course/${slug}/path`)}
              className="p-1 text-[#A39B90] hover:text-[#6B635A] transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="text-center py-12">
            <p className="text-[#6B635A] mb-4">{error || 'Guidebook not found'}</p>
            <button
              onClick={() => router.push(`/course/${slug}/path`)}
              className="text-[#2C2825] font-medium text-sm"
            >
              Back to path
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hasLessons = data.lessons && data.lessons.length > 0;
  const hasAssessments = data.assessments && data.assessments.length > 0;

  // ─── READING MODE (from=path with lessons) ─────────────────
  if (fromPath && hasLessons) {
    return (
      <div className="min-h-[100dvh] bg-[#FAFAF8]">
        <ReadingProgressBar />

        {/* Sticky header */}
        <div className="sticky top-1 z-40 bg-[#FAFAF8] border-b border-[#E8E4DD]">
          <div className="max-w-prose mx-auto px-4 flex items-center justify-between py-3">
            <button
              onClick={() => router.push(`/course/${slug}/path`)}
              className="p-1 text-[#A39B90] hover:text-[#6B635A] transition-colors flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <span className="text-xs font-medium text-[#A39B90] truncate px-3">{data.title}</span>
            <button
              onClick={skipToPractice}
              className="text-xs font-medium text-[#A39B90] hover:text-[#6B635A] transition-colors flex-shrink-0"
            >
              Skip to practice
            </button>
          </div>
        </div>

        {/* Article body */}
        <article className="max-w-prose mx-auto px-4 pt-8 pb-4">
          {/* Topic title */}
          <h1 className="text-2xl font-bold text-[#2C2825] mb-8 leading-tight">
            {data.title}
          </h1>

          {/* Lessons rendered inline */}
          <div className="space-y-10">
            {data.lessons.map((lesson, idx) => (
              <section key={lesson.id}>
                {/* Lesson header */}
                <h2 className="text-lg font-bold text-[#2C2825] mb-4">
                  {lesson.title}
                </h2>

                {/* Lesson body — article-style prose */}
                <div className="prose prose-sm max-w-none text-[#2C2825] leading-relaxed [&_p]:text-[15px] [&_p]:leading-[1.75] [&_p]:text-[#2C2825] [&_p]:mb-4 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-[#2C2825] [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-[#2C2825] [&_h3]:mt-5 [&_h3]:mb-2 [&_strong]:text-[#2C2825] [&_strong]:font-semibold [&_ul]:text-[15px] [&_ul]:text-[#2C2825] [&_ul]:leading-[1.75] [&_ol]:text-[15px] [&_ol]:text-[#2C2825] [&_ol]:leading-[1.75] [&_li]:mb-1 [&_blockquote]:border-l-4 [&_blockquote]:border-amber-400 [&_blockquote]:bg-amber-50/50 [&_blockquote]:pl-4 [&_blockquote]:py-2 [&_blockquote]:pr-3 [&_blockquote]:rounded-r-lg [&_blockquote]:italic [&_blockquote]:text-[#6B635A] [&_blockquote]:text-sm [&_blockquote]:my-4 [&_blockquote_p]:text-sm [&_blockquote_p]:text-[#6B635A] [&_blockquote_strong]:text-amber-800 [&_blockquote_strong]:not-italic [&_code]:text-xs [&_code]:bg-[#F5F3EF] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[#2C2825] [&_pre]:bg-[#F5F3EF] [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:text-sm [&_a]:text-blue-600 [&_a]:underline">
                  <MarkdownContent content={lesson.body || '*No content yet*'} className="!max-w-none" />
                </div>

                {/* Divider between lessons */}
                {idx < data.lessons.length - 1 && (
                  <div className="mt-10 border-t border-[#E8E4DD]" />
                )}
              </section>
            ))}
          </div>
        </article>

        {/* Bottom CTA */}
        <div className="max-w-prose mx-auto px-4 pb-10 pt-6 space-y-3">
          <button
            onClick={markReadAndPractice}
            disabled={markingRead}
            className="w-full py-3.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {markingRead ? 'Loading...' : (
              <>
                I&apos;ve read this — Start Practicing
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </>
            )}
          </button>
          <button
            onClick={skipToPractice}
            className="w-full text-sm text-[#A39B90] hover:text-[#6B635A] py-1 transition-colors"
          >
            Skip to practice
          </button>
        </div>
      </div>
    );
  }

  // ─── REFERENCE MODE (normal guidebook access) ──────────────
  return (
    <div className="min-h-[100dvh] bg-[#FAFAF8]">
      <div className="max-w-lg mx-auto px-4 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between py-4 sticky top-0 bg-[#FAFAF8] z-10 border-b border-[#E8E4DD]">
          <button
            onClick={() => router.push(`/course/${slug}/path`)}
            className="p-1 text-[#A39B90] hover:text-[#6B635A] transition-colors flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h1 className="text-base font-semibold text-[#2C2825] truncate px-4 text-center flex-1">
            {data.title}
          </h1>
          <div className="w-5" />
        </div>

        {/* Content */}
        <div className="mt-6">
          {hasLessons ? (
            <div>
              <h2 className="text-xs font-semibold text-[#A39B90] uppercase tracking-wider mb-3">Lessons</h2>
              <div className="space-y-2 mb-6">
                {data.lessons.map((lesson, idx) => (
                  <div key={lesson.id} className="border border-[#E8E4DD] rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedLesson(expandedLesson === lesson.id ? null : lesson.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F5F3EF] transition-colors"
                    >
                      <span className="w-6 h-6 rounded-full bg-[#F5F3EF] text-[#2C2825] flex items-center justify-center text-xs font-semibold flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-medium text-[#2C2825] flex-1 text-left">{lesson.title}</span>
                      <svg
                        className={`w-4 h-4 text-[#A39B90] transition-transform ${expandedLesson === lesson.id ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {expandedLesson === lesson.id && (
                      <div className="px-4 pb-4 border-t border-[#E8E4DD]">
                        <div className="mt-3">
                          <MarkdownContent content={lesson.body || '*No content yet*'} />
                        </div>
                        <button
                          onClick={() => router.push(`/practice/${slug}?topic=${topicId}`)}
                          className="mt-4 w-full py-2.5 rounded-xl bg-[#2C2825] text-[#F5F3EF] font-semibold text-sm hover:bg-[#1A1816] transition-colors border-none"
                        >
                          Practice this lesson
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Topic quizzes */}
              {hasAssessments && (
                <div className="space-y-2">
                  {data.assessments.map(a => (
                    <button
                      key={a.id}
                      onClick={() => router.push(`/course/${slug}/assessment/${a.id}`)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors"
                    >
                      <span className="text-sm font-medium text-amber-800 flex-1 text-left">{a.title}</span>
                      <span className="text-xs text-amber-600 font-medium">Take Quiz</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : data.guidebook_content ? (
            <MarkdownContent content={data.guidebook_content} />
          ) : (
            <div className="text-center py-12 text-[#A39B90]">
              <p>No content available for this topic yet.</p>
            </div>
          )}
        </div>

        {/* Prev/Next navigation */}
        <div className="mt-8 flex items-center gap-3">
          {data.prev ? (
            <button
              onClick={() => navigateToTopic(data.prev!.id)}
              className="flex-1 flex items-center gap-2 py-3 px-4 rounded-xl border border-[#E8E4DD] hover:bg-[#F5F3EF] transition-colors"
            >
              <svg className="w-4 h-4 text-[#A39B90] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              <div className="text-left min-w-0">
                <p className="text-[10px] text-[#A39B90] uppercase font-medium">Previous</p>
                <p className="text-xs text-[#6B635A] font-medium truncate">{data.prev.title}</p>
              </div>
            </button>
          ) : (
            <div className="flex-1" />
          )}

          {data.next ? (
            <button
              onClick={() => navigateToTopic(data.next!.id)}
              className="flex-1 flex items-center justify-end gap-2 py-3 px-4 rounded-xl border border-[#E8E4DD] hover:bg-[#F5F3EF] transition-colors"
            >
              <div className="text-right min-w-0">
                <p className="text-[10px] text-[#A39B90] uppercase font-medium">Next</p>
                <p className="text-xs text-[#6B635A] font-medium truncate">{data.next.title}</p>
              </div>
              <svg className="w-4 h-4 text-[#A39B90] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
        <div className="h-6 bg-[#EBE8E2] rounded w-48" />
        <div className="h-4 bg-[#EBE8E2] rounded w-full" />
        <div className="h-4 bg-[#EBE8E2] rounded w-5/6" />
      </div>
    }>
      <GuidebookContent />
    </Suspense>
  );
}
