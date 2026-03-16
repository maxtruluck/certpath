'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LearnPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/dashboard');
        if (res.ok) {
          const data = await res.json();
          const active = data.active_courses || [];
          if (active.length === 1) {
            router.replace(`/course/${active[0].course.slug}/path`);
            return;
          }
          setCourses(active);
        }
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-gray-500">No active courses</p>
        <Link href="/browse" className="inline-block bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl">
          Browse Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Choose a course</h1>
      {courses.map((uc: any) => (
        <Link
          key={uc.id}
          href={`/course/${uc.course.slug}/path`}
          className="block rounded-2xl bg-white border border-gray-200 p-4 hover:border-blue-300 transition-all"
        >
          <h3 className="font-bold text-gray-900 mb-1">{uc.course.title}</h3>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.round((uc.readiness_score || 0) * 100)}%` }} />
          </div>
          <p className="text-xs text-gray-500">{Math.round((uc.readiness_score || 0) * 100)}% ready</p>
        </Link>
      ))}
    </div>
  );
}
