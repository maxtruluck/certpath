'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseSlug = searchParams.get('course');
  const [enrolled, setEnrolled] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  const poll = useCallback(async () => {
    if (!courseSlug) return false;
    try {
      const res = await fetch(`/api/user/enrollment?course_slug=${courseSlug}`);
      if (!res.ok) return false;
      const data = await res.json();
      return data.enrolled === true;
    } catch {
      return false;
    }
  }, [courseSlug]);

  useEffect(() => {
    if (!courseSlug) return;

    let cancelled = false;
    const startTime = Date.now();

    async function check() {
      if (cancelled) return;
      const isEnrolled = await poll();
      if (cancelled) return;

      if (isEnrolled) {
        setEnrolled(true);
        return;
      }

      if (Date.now() - startTime > 30000) {
        setTimedOut(true);
        return;
      }

      setTimeout(check, 2000);
    }

    check();
    return () => { cancelled = true; };
  }, [courseSlug, poll, router]);

  if (!courseSlug) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">Missing course information.</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4 max-w-sm">
        {enrolled ? (
          <>
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900">You&apos;re in!</h1>
            <p className="text-sm text-gray-500">Course enrolled successfully.</p>
            <div className="flex flex-col gap-3 items-center mt-2">
              <a
                href={`opened://course/${courseSlug}`}
                className="inline-block px-6 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors"
              >
                Return to App
              </a>
              <a
                href={`/course/${courseSlug}/path`}
                className="inline-block text-sm text-blue-500 font-medium hover:underline"
              >
                Continue on web
              </a>
            </div>
          </>
        ) : timedOut ? (
          <>
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Still processing</h1>
            <p className="text-sm text-gray-500">
              Your payment was received but enrollment is still being set up. This usually takes a few seconds.
            </p>
            <div className="flex flex-col gap-3 items-center mt-2">
              <a
                href={`opened://course/${courseSlug}`}
                className="inline-block px-6 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors"
              >
                Return to App
              </a>
              <a
                href={`/course/${courseSlug}/path`}
                className="inline-block text-sm text-blue-500 font-medium hover:underline"
              >
                Continue on web
              </a>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Setting up your course...</h1>
            <p className="text-sm text-gray-500">Payment received. Enrolling you now.</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
