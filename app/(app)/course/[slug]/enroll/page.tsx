'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface CourseInfo {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  price_cents: number;
  creator: {
    creator_name: string;
  } | null;
  stats: {
    question_count: number;
    module_count: number;
    lesson_count: number;
  };
}

export default function EnrollPage() {
  const params = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<CourseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCourse() {
      try {
        const res = await fetch(`/api/courses/${params.slug}`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();

        if (data.user_progress) {
          router.replace(`/course/${params.slug}/path`);
          return;
        }

        setCourse(data);
      } catch (err) {
        setError('Course not found');
        console.error(err);
      }
      setLoading(false);
    }
    fetchCourse();
  }, [params.slug, router]);

  async function handleEnroll() {
    if (enrolling || !course) return;
    setEnrolling(true);
    setError(null);

    // Paid course: redirect to Stripe Checkout
    if (course.price_cents && course.price_cents > 0) {
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
          setEnrolling(false);
        }
      } catch (err) {
        setError('Something went wrong. Please try again.');
        console.error(err);
        setEnrolling(false);
      }
      return;
    }

    // Free course: enroll directly
    try {
      const res = await fetch(`/api/courses/${params.slug}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.status === 409) {
        router.push(`/course/${params.slug}/path`);
        return;
      }

      if (!res.ok) throw new Error('Enrollment failed');

      router.push(`/course/${params.slug}/path`);
    } catch (err) {
      setError('Failed to enroll. Please try again.');
      console.error(err);
      setEnrolling(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 bg-gray-100 rounded w-20" />
        <div className="h-20 bg-gray-100 rounded-2xl" />
        <div className="h-48 bg-gray-100 rounded-2xl" />
        <div className="h-12 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">{error || 'Course not found'}</p>
        <button onClick={() => router.push('/browse')} className="text-blue-500 font-medium text-sm">
          Back to browse
        </button>
      </div>
    );
  }

  const priceFormatted = course.price_cents
    ? `$${(course.price_cents / 100).toFixed(2)}`
    : 'Free';

  function getAbbreviation(title: string): string {
    return title
      .split(/[\s-]+/)
      .filter((w) => w.length > 1)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  }

  // Dynamic features based on course stats
  const features = [
    `${course.stats.question_count} practice questions across ${course.stats.module_count} domains`,
    'Adaptive spaced repetition engine',
    'Detailed explanations for every question',
    `${course.stats.lesson_count} lessons with guided content`,
  ];

  return (
    <div className="space-y-6">
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
        <h1 className="text-sm font-semibold text-gray-900 flex-1 text-center">Confirm enrollment</h1>
        <div className="w-12" />
      </div>

      {/* Centered course icon + title */}
      <div className="text-center animate-fade-up">
        <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl font-bold text-gray-400">
            {getAbbreviation(course.title)}
          </span>
        </div>
        <h2 className="text-lg font-bold text-gray-900">{course.title}</h2>
        <p className="text-sm text-gray-500 mt-1">
          By {course.creator?.creator_name || 'openED'}
        </p>
      </div>

      {/* What you will get */}
      <div className="rounded-2xl bg-gray-50 border border-gray-200 p-5 space-y-4 animate-fade-up" style={{ animationDelay: '60ms' }}>
        <h3 className="font-bold text-gray-900 text-sm">What you will get</h3>
        <ul className="space-y-3">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-3">
              <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              <span className="text-sm text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Price card */}
      <div className="rounded-2xl bg-gray-50 border border-gray-200 p-5 animate-fade-up" style={{ animationDelay: '120ms' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xl font-bold text-gray-900">{priceFormatted}</p>
            {course.price_cents > 0 && (
              <p className="text-xs text-gray-500 mt-0.5">One-time, lifetime access</p>
            )}
          </div>
          {course.price_cents > 0 && (
            <p className="text-xs text-gray-400">or included with Pro</p>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl">{error}</div>
      )}

      {/* Enroll button */}
      <div className="space-y-2 animate-fade-up" style={{ animationDelay: '180ms' }}>
        <button
          onClick={handleEnroll}
          disabled={enrolling}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {enrolling ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {course?.price_cents && course.price_cents > 0 ? 'Redirecting...' : 'Enrolling...'}
            </>
          ) : course?.price_cents && course.price_cents > 0 ? (
            `Buy Course — ${priceFormatted}`
          ) : (
            'Enroll Free'
          )}
        </button>
        <p className="text-xs text-gray-400 text-center">You can start studying immediately</p>
      </div>
    </div>
  );
}
