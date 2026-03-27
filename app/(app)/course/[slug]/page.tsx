'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface CourseDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  difficulty: string;
  thumbnail_url: string | null;
  price_cents: number;
  provider_name: string | null;
  creator: {
    id: string;
    creator_name: string;
    bio: string | null;
    expertise_areas: string[] | null;
    credentials: string | null;
  } | null;
  stats: {
    module_count: number;
    lesson_count: number;
    question_count: number;
  };
  cert_info: {
    passing_score: number | null;
    max_score: number | null;
    exam_duration_minutes: number | null;
    total_questions_on_exam: number | null;
    exam_fee_cents: number | null;
    provider_name: string | null;
    provider_url: string | null;
  };
  user_progress: {
    id: string;
    status: string;
    readiness_score: number;
    questions_seen: number;
    questions_correct: number;
    sessions_completed: number;
  } | null;
}

const difficultyColors: Record<string, string> = {
  beginner: 'bg-green-50 text-green-700 border-green-200',
  intermediate: 'bg-amber-50 text-amber-700 border-amber-200',
  advanced: 'bg-red-50 text-red-700 border-red-200',
};

export default function CourseOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPreview = searchParams.get('preview') === 'true';
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const previewCourseId = searchParams.get('courseId');

  useEffect(() => {
    async function fetchCourse() {
      try {
        const url = isPreview && previewCourseId
          ? `/api/creator/preview/course?courseId=${previewCourseId}`
          : `/api/courses/${params.slug}`;
        const res = await fetch(url);
        if (res.status === 404) {
          setError('Course not found');
          setLoading(false);
          return;
        }
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setCourse(data);
      } catch (err) {
        setError('Something went wrong');
        console.error('Course fetch error:', err);
      }
      setLoading(false);
    }
    fetchCourse();
  }, [params.slug, isPreview, previewCourseId]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 bg-[#EBE8E2] rounded w-16" />
        <div className="h-32 bg-[#EBE8E2] rounded-2xl" />
        <div className="h-8 bg-[#EBE8E2] rounded w-2/3" />
        <div className="h-4 bg-[#EBE8E2] rounded w-1/2" />
        <div className="h-20 bg-[#EBE8E2] rounded-2xl" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="text-center py-12">
        <p className="text-[#6B635A] mb-4">{error || 'Course not found'}</p>
        <button
          onClick={() => router.push('/browse')}
          className="text-[#2C2825] font-medium text-sm"
        >
          Back to browse
        </button>
      </div>
    );
  }

  const isEnrolled = !!course.user_progress;
  const priceFormatted = course.price_cents
    ? `$${(course.price_cents / 100).toFixed(2)}`
    : 'Free';
  const examFee = course.cert_info.exam_fee_cents
    ? `$${(course.cert_info.exam_fee_cents / 100).toFixed(0)}`
    : null;

  function getAbbreviation(title: string): string {
    return title
      .split(/[\s-]+/)
      .filter((w) => w.length > 1)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  }

  const accentColor = (course as any).card_color || '#2C2825';

  return (
    <div className="space-y-5">
      {/* Preview banner */}
      {isPreview && (
        <div className="bg-amber-100 text-amber-700 text-center text-sm font-medium py-2 -mx-4 -mt-4 rounded-t-lg">
          Preview Mode — progress not saved
        </div>
      )}

      {/* Accent color bar */}
      <div className={`h-1 -mx-4 ${isPreview ? '' : '-mt-4 rounded-t-lg'}`} style={{ backgroundColor: accentColor }} />

      {/* Header bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-[#6B635A] hover:text-[#2C2825] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back
        </button>
        <h1 className="text-sm font-semibold text-[#2C2825] flex-1 text-center">Course overview</h1>
        <div className="w-12" />
      </div>

      {/* Thumbnail/icon */}
      <div className="w-full h-36 rounded-2xl bg-[#F5F3EF] flex items-center justify-center animate-fade-up">
        {course.thumbnail_url ? (
          <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover rounded-2xl" />
        ) : (
          <span className="text-4xl font-bold text-[#D4CFC7]">
            {getAbbreviation(course.title)}
          </span>
        )}
      </div>

      {/* Title and creator */}
      <div className="animate-fade-up">
        <h2 className="text-xl font-bold text-[#2C2825]">{course.title}</h2>
        <p className="text-sm text-[#6B635A] mt-1">
          By {course.creator?.creator_name || course.provider_name || 'openED'}
        </p>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 animate-fade-up">
        <span className="text-xs font-medium px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200 capitalize">
          {course.category.replace('_', ' ')}
        </span>
        {[...new Set<string>((course as any).tags || [])].filter((tag: string) => tag.toLowerCase().replace(/[\s_]+/g, '_') !== course.category.toLowerCase().replace(/[\s_]+/g, '_')).map((tag: string) => (
          <span key={tag} className="text-xs font-medium px-3 py-1 rounded-full bg-[#F5F3EF] text-[#6B635A] border border-[#E8E4DD]">
            {tag}
          </span>
        ))}
      </div>

      {/* Description */}
      {course.description && (
        <p className="text-sm text-[#6B635A] leading-relaxed animate-fade-up">{course.description}</p>
      )}

      {/* Stats row 1: Questions, Modules, Exam fee */}
      <div className="grid grid-cols-3 gap-3 animate-fade-up">
        <div className="rounded-xl bg-[#F5F3EF] border border-[#E8E4DD] p-3 text-center">
          <p className="text-lg font-bold text-[#2C2825] font-mono">{course.stats.question_count}</p>
          <p className="text-[10px] text-[#6B635A] font-medium">Questions</p>
        </div>
        <div className="rounded-xl bg-[#F5F3EF] border border-[#E8E4DD] p-3 text-center">
          <p className="text-lg font-bold text-[#2C2825] font-mono">{course.stats.module_count}</p>
          <p className="text-[10px] text-[#6B635A] font-medium">Modules</p>
        </div>
        <div className="rounded-xl bg-[#F5F3EF] border border-[#E8E4DD] p-3 text-center">
          <p className="text-lg font-bold text-[#2C2825] font-mono">{examFee || `$${0}`}</p>
          <p className="text-[10px] text-[#6B635A] font-medium">Exam fee</p>
        </div>
      </div>

      {/* Stats row 2: Pass score, Exam time, Lessons */}
      <div className="grid grid-cols-3 gap-3 animate-fade-up">
        <div className="rounded-xl bg-[#F5F3EF] border border-[#E8E4DD] p-3 text-center">
          <p className="text-lg font-bold text-[#2C2825] font-mono">
            {course.cert_info.passing_score || '---'}
          </p>
          <p className="text-[10px] text-[#6B635A] font-medium">Pass score</p>
        </div>
        <div className="rounded-xl bg-[#F5F3EF] border border-[#E8E4DD] p-3 text-center">
          <p className="text-lg font-bold text-[#2C2825] font-mono">
            {course.cert_info.exam_duration_minutes ? `${course.cert_info.exam_duration_minutes}m` : '---'}
          </p>
          <p className="text-[10px] text-[#6B635A] font-medium">Exam time</p>
        </div>
        <div className="rounded-xl bg-[#F5F3EF] border border-[#E8E4DD] p-3 text-center">
          <p className="text-lg font-bold text-[#2C2825] font-mono">{course.stats.lesson_count}</p>
          <p className="text-[10px] text-[#6B635A] font-medium">Lessons</p>
        </div>
      </div>

      {/* Learning objectives */}
      {(course as any).learning_objectives?.length > 0 ? (
        <div className="animate-fade-up">
          <h3 className="text-sm font-bold text-[#2C2825] mb-2">What you&apos;ll learn</h3>
          <ul className="space-y-1.5">
            {(course as any).learning_objectives.map((obj: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[#6B635A]">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                {obj}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="animate-fade-up">
          <h3 className="text-sm font-bold text-[#2C2825] mb-2">What you&apos;ll learn</h3>
          <p className="text-sm text-[#6B635A]">
            {course.stats.module_count} module{course.stats.module_count !== 1 ? 's' : ''} covering {course.stats.lesson_count} lesson{course.stats.lesson_count !== 1 ? 's' : ''} with {course.stats.question_count} practice questions.
          </p>
        </div>
      )}

      {/* Enrolled: show progress */}
      {isEnrolled && course.user_progress && (
        <div className="rounded-2xl bg-[#F5F3EF] border border-[#E8E4DD] p-4 space-y-3 animate-fade-up">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#2C2825]">Your progress</span>
            <span className="text-sm font-bold text-[#6B635A] font-mono">
              {Math.round((course.user_progress.readiness_score || 0) * 100)}% readiness
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#EBE8E2] rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${Math.round((course.user_progress.readiness_score || 0) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-[#6B635A]">
            <span>{course.user_progress.questions_seen} questions seen</span>
            <span>{course.user_progress.sessions_completed} sessions</span>
          </div>
        </div>
      )}

      {/* Action button */}
      {isPreview ? (
        <button
          onClick={() => window.close()}
          className="w-full bg-[#2C2825] hover:bg-[#1A1816] text-[#F5F3EF] font-semibold py-3 rounded-xl text-center transition-colors"
        >
          Close Preview
        </button>
      ) : isEnrolled ? (
        <Link
          href={`/course/${course.slug}/path`}
          className="block w-full bg-[#2C2825] hover:bg-[#1A1816] text-[#F5F3EF] font-semibold py-3 rounded-xl text-center transition-colors"
        >
          Continue studying
        </Link>
      ) : course.price_cents > 0 ? (
        <div className="space-y-2">
          <button
            onClick={async () => {
              if (actionLoading) return;
              setActionLoading(true);
              try {
                const res = await fetch('/api/checkout', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ course_id: course.id }),
                });
                const data = await res.json();
                if (data.url) {
                  window.location.href = data.url;
                } else {
                  setError(data.error || 'Checkout failed');
                  setActionLoading(false);
                }
              } catch {
                setError('Something went wrong');
                setActionLoading(false);
              }
            }}
            disabled={actionLoading}
            className="w-full bg-[#2C2825] hover:bg-[#1A1816] disabled:opacity-50 text-[#F5F3EF] font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {actionLoading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Redirecting...
              </>
            ) : (
              `Buy Course — ${priceFormatted}`
            )}
          </button>
          <p className="text-xs text-[#A39B90] text-center">One-time payment, lifetime access</p>
        </div>
      ) : (
        <div className="space-y-2">
          <button
            onClick={async () => {
              if (actionLoading) return;
              setActionLoading(true);
              try {
                const res = await fetch(`/api/courses/${course.slug}/enroll`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                });
                if (res.ok || res.status === 409) {
                  router.push(`/course/${course.slug}/path`);
                } else {
                  const data = await res.json();
                  setError(data.error || 'Enrollment failed');
                  setActionLoading(false);
                }
              } catch {
                setError('Something went wrong');
                setActionLoading(false);
              }
            }}
            disabled={actionLoading}
            className="w-full bg-[#2C2825] hover:bg-[#1A1816] disabled:opacity-50 text-[#F5F3EF] font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {actionLoading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Enrolling...
              </>
            ) : (
              'Enroll Free'
            )}
          </button>
          <p className="text-xs text-[#A39B90] text-center">Free - start studying immediately</p>
        </div>
      )}
    </div>
  );
}
