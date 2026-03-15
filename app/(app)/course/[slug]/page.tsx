'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
    topic_count: number;
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
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCourse() {
      try {
        const res = await fetch(`/api/courses/${params.slug}`);
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
  }, [params.slug]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 bg-gray-100 rounded w-16" />
        <div className="h-32 bg-gray-100 rounded-2xl" />
        <div className="h-8 bg-gray-100 rounded w-2/3" />
        <div className="h-4 bg-gray-100 rounded w-1/2" />
        <div className="h-20 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">{error || 'Course not found'}</p>
        <button
          onClick={() => router.push('/browse')}
          className="text-blue-500 font-medium text-sm"
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

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back
        </button>
        <h1 className="text-sm font-semibold text-gray-900 flex-1 text-center">Course overview</h1>
        <div className="w-12" />
      </div>

      {/* Thumbnail/icon */}
      <div className="w-full h-36 rounded-2xl bg-gray-50 flex items-center justify-center animate-fade-up">
        {course.thumbnail_url ? (
          <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover rounded-2xl" />
        ) : (
          <span className="text-4xl font-bold text-gray-300">
            {getAbbreviation(course.title)}
          </span>
        )}
      </div>

      {/* Title and creator */}
      <div className="animate-fade-up">
        <h2 className="text-xl font-bold text-gray-900">{course.title}</h2>
        <p className="text-sm text-gray-500 mt-1">
          By {course.creator?.creator_name || course.provider_name || 'openED'}
        </p>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 animate-fade-up">
        <span className="text-xs font-medium px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200 capitalize">
          {course.category.replace('_', ' ')}
        </span>
        {course.difficulty && (
          <span className={`text-xs font-medium px-3 py-1 rounded-full border capitalize ${difficultyColors[course.difficulty] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
            {course.difficulty}
          </span>
        )}
      </div>

      {/* Description */}
      {course.description && (
        <p className="text-sm text-gray-600 leading-relaxed animate-fade-up">{course.description}</p>
      )}

      {/* Stats row 1: Questions, Modules, Exam fee */}
      <div className="grid grid-cols-3 gap-3 animate-fade-up">
        <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 text-center">
          <p className="text-lg font-bold text-gray-900 font-mono">{course.stats.question_count}</p>
          <p className="text-[10px] text-gray-500 font-medium">Questions</p>
        </div>
        <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 text-center">
          <p className="text-lg font-bold text-gray-900 font-mono">{course.stats.module_count}</p>
          <p className="text-[10px] text-gray-500 font-medium">Modules</p>
        </div>
        <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 text-center">
          <p className="text-lg font-bold text-gray-900 font-mono">{examFee || `$${0}`}</p>
          <p className="text-[10px] text-gray-500 font-medium">Exam fee</p>
        </div>
      </div>

      {/* Stats row 2: Pass score, Exam time, Topics */}
      <div className="grid grid-cols-3 gap-3 animate-fade-up">
        <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 text-center">
          <p className="text-lg font-bold text-gray-900 font-mono">
            {course.cert_info.passing_score || '—'}
          </p>
          <p className="text-[10px] text-gray-500 font-medium">Pass score</p>
        </div>
        <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 text-center">
          <p className="text-lg font-bold text-gray-900 font-mono">
            {course.cert_info.exam_duration_minutes ? `${course.cert_info.exam_duration_minutes}m` : '—'}
          </p>
          <p className="text-[10px] text-gray-500 font-medium">Exam time</p>
        </div>
        <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 text-center">
          <p className="text-lg font-bold text-gray-900 font-mono">{course.stats.topic_count}</p>
          <p className="text-[10px] text-gray-500 font-medium">Topics</p>
        </div>
      </div>

      {/* Enrolled: show progress */}
      {isEnrolled && course.user_progress && (
        <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4 space-y-3 animate-fade-up">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-700">Your progress</span>
            <span className="text-sm font-bold text-blue-600 font-mono">
              {Math.round((course.user_progress.readiness_score || 0) * 100)}% readiness
            </span>
          </div>
          <div className="w-full h-1.5 bg-blue-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${Math.round((course.user_progress.readiness_score || 0) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-blue-600">
            <span>{course.user_progress.questions_seen} questions seen</span>
            <span>{course.user_progress.sessions_completed} sessions</span>
          </div>
        </div>
      )}

      {/* Action button */}
      {isEnrolled ? (
        <Link
          href={`/course/${course.slug}/path`}
          className="block w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl text-center transition-colors"
        >
          Continue studying
        </Link>
      ) : (
        <div className="space-y-2">
          <Link
            href={`/course/${course.slug}/enroll`}
            className="block w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl text-center transition-colors"
          >
            Enroll in this course
          </Link>
          <p className="text-xs text-gray-400 text-center">
            {priceFormatted === 'Free' ? 'Free' : `${priceFormatted} one-time or included with Pro`}
          </p>
        </div>
      )}
    </div>
  );
}
