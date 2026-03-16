'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
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
  lesson_count: number;
}

interface PathAssessment {
  id: string;
  title: string;
  type: 'topic_quiz' | 'module_test' | 'practice_exam';
  module_id: string | null;
  topic_id: string | null;
  best_score: number | null;
}

interface Module {
  id: string;
  title: string;
  description: string | null;
  weight_percent: number;
  display_order: number;
  topics: Topic[];
  assessments: PathAssessment[];
}

interface PathData {
  course_id: string;
  course_title?: string;
  readiness_score: number;
  current_topic_id: string | null;
  modules: Module[];
}

function getMasteryLevel(topic: Topic): 'mastered' | 'proficient' | 'familiar' | 'attempted' | 'locked' {
  if (topic.status === 'locked') return 'locked';
  if (topic.questions_seen === 0) return 'locked';
  const r = topic.readiness;
  if (r >= 0.8 && topic.questions_seen >= 10) return 'mastered';
  if (r >= 0.6) return 'proficient';
  if (r >= 0.3) return 'familiar';
  return 'attempted';
}

const masteryColors: Record<string, { bg: string; border: string; text: string }> = {
  mastered: { bg: 'bg-blue-800', border: 'border-blue-700', text: 'text-white' },
  proficient: { bg: 'bg-purple-600', border: 'border-purple-500', text: 'text-white' },
  familiar: { bg: 'bg-amber-400', border: 'border-amber-500', text: 'text-amber-900' },
  attempted: { bg: 'bg-white', border: 'border-orange-400', text: 'text-orange-600' },
  locked: { bg: 'bg-[#EBE8E2]', border: 'border-[#E8E4DD]', text: 'text-[#A39B90]' },
};

function CoursePathContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const unlockedTopicId = searchParams.get('unlocked');
  const [path, setPath] = useState<PathData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [showUnlockToast, setShowUnlockToast] = useState(false);
  const unlockedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    async function fetchPath() {
      try {
        const res = await fetch(`/api/courses/${slug}/path`);
        if (res.status === 403) {
          router.replace(`/course/${slug}/enroll`);
          return;
        }
        if (!res.ok) throw new Error('Failed to fetch');
        setPath(await res.json());
      } catch {
        setError('Something went wrong');
      }
      setLoading(false);
    }
    fetchPath();
  }, [slug, router]);

  // Scroll to and highlight newly unlocked topic
  useEffect(() => {
    if (!unlockedTopicId || !path) return;
    setShowUnlockToast(true);
    const timer = setTimeout(() => {
      if (unlockedRef.current) {
        unlockedRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
    const hideTimer = setTimeout(() => setShowUnlockToast(false), 4000);
    return () => { clearTimeout(timer); clearTimeout(hideTimer); };
  }, [unlockedTopicId, path]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-32 bg-[#EBE8E2] rounded-2xl" />
        {[1, 2, 3].map(i => (
          <div key={i} className="space-y-3">
            <div className="h-8 bg-[#EBE8E2] rounded-xl" />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map(j => <div key={j} className="w-14 h-14 bg-[#EBE8E2] rounded-lg" />)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !path) {
    return (
      <div className="text-center py-12">
        <p className="text-[#6B635A] mb-4">{error || 'Path not found'}</p>
        <button onClick={() => router.push('/home')} className="text-[#2C2825] font-medium text-sm">Back to home</button>
      </div>
    );
  }

  const readinessPct = Math.round((path.readiness_score || 0) * 100);
  const totalSeen = path.modules.flatMap(m => m.topics).reduce((s, t) => s + t.questions_seen, 0);
  const totalQuestions = path.modules.flatMap(m => m.topics).reduce((s, t) => s + t.questions_total, 0);
  const dueTopics = path.modules.flatMap(m => m.topics).filter(t => t.status !== 'locked' && t.readiness < 0.7 && t.questions_seen > 0);

  return (
    <div className="space-y-5">
      {/* Back + title */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/home')} className="text-[#A39B90] hover:text-[#6B635A]">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-base font-bold text-[#2C2825] flex-1 truncate">{path.course_title || 'Course'}</h1>
      </div>

      {/* Readiness hero */}
      <div className="rounded-2xl bg-white border border-[#E8E4DD] p-5 animate-fade-up">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-[#6B635A]">Readiness Score</h2>
          <span className="text-2xl font-bold text-[#2C2825]">{readinessPct}%</span>
        </div>
        <div className="w-full h-3 bg-[#EBE8E2] rounded-full overflow-hidden mb-3">
          <div className="h-full bg-blue-500 rounded-full transition-all duration-700 progress-shine" style={{ width: `${readinessPct}%` }} />
        </div>
        <p className="text-xs text-[#6B635A] mb-4">
          {totalSeen}/{totalQuestions} questions seen
          {dueTopics.length > 0 && ` · ${dueTopics.length} topic${dueTopics.length !== 1 ? 's' : ''} need review`}
        </p>
        <div className="flex gap-3">
          <Link
            href={`/practice/${slug}`}
            className="flex-1 bg-[#2C2825] hover:bg-[#1A1816] text-[#F5F3EF] font-semibold py-3 rounded-xl text-center text-sm transition-colors"
          >
            Practice Now
          </Link>
          <Link
            href={`/course/${slug}/guidebook`}
            className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-[#F5F3EF] border border-[#E8E4DD] text-sm font-medium text-[#6B635A] hover:bg-[#EBE8E2] transition-colors"
          >
            Guidebook
          </Link>
        </div>
      </div>

      {/* Module mastery grid */}
      {path.modules.map((mod, modIdx) => {
        const modReadiness = mod.topics.length > 0
          ? Math.round(mod.topics.reduce((s, t) => s + t.readiness, 0) / mod.topics.length * 100)
          : 0;

        return (
          <div key={mod.id} className="animate-fade-up" style={{ animationDelay: `${(modIdx + 1) * 60}ms` }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[#2C2825]">
                {mod.title}
                {mod.weight_percent > 0 && <span className="text-[#A39B90] font-normal ml-1">({mod.weight_percent}%)</span>}
              </h3>
              <span className="text-xs text-[#A39B90]">{modReadiness}%</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {mod.topics.map((topic, topicIdx) => {
                const mastery = getMasteryLevel(topic);
                const colors = masteryColors[mastery];
                const isCurrent = topic.id === path.current_topic_id;

                return (
                  <button
                    key={topic.id}
                    onClick={() => topic.status !== 'locked' ? setSelectedTopic(topic) : null}
                    disabled={topic.status === 'locked'}
                    className={`w-14 h-14 rounded-lg border-2 flex flex-col items-center justify-center transition-all ${colors.bg} ${colors.border} ${colors.text} ${
                      topic.status === 'locked' ? 'cursor-default opacity-60' : 'hover:scale-105 cursor-pointer'
                    } ${isCurrent ? 'animate-pulse-glow' : ''}`}
                  >
                    <span className="text-xs font-bold">{modIdx + 1}.{topicIdx + 1}</span>
                  </button>
                );
              })}
            </div>
            {/* Topic names below boxes */}
            <div className="flex flex-wrap gap-2 mt-1.5">
              {mod.topics.map((topic) => (
                <div key={topic.id} className="w-14 text-center">
                  <p className={`text-[9px] leading-tight ${topic.status === 'locked' ? 'text-[#D4CFC7]' : 'text-[#6B635A]'}`}>
                    {topic.title.length > 12 ? topic.title.slice(0, 10) + '...' : topic.title}
                  </p>
                </div>
              ))}
            </div>

            {/* Assessment indicators */}
            {mod.assessments && mod.assessments.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {mod.assessments.map(a => {
                  const scoreColor = a.best_score === null ? 'bg-[#EBE8E2] text-[#A39B90] border-[#E8E4DD]'
                    : a.best_score >= 70 ? 'bg-green-50 text-green-600 border-green-200'
                    : a.best_score >= 50 ? 'bg-amber-50 text-amber-600 border-amber-200'
                    : 'bg-red-50 text-red-600 border-red-200';
                  const icon = a.type === 'topic_quiz' ? '\u26A1' : a.type === 'module_test' ? '\u2B50' : '\uD83D\uDCCB';
                  return (
                    <span key={a.id} className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-lg border ${scoreColor}`}>
                      {icon} {a.title.length > 20 ? a.title.slice(0, 18) + '...' : a.title}
                      {a.best_score !== null && <span className="ml-1">{a.best_score}%</span>}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Topic detail bottom sheet */}
      {selectedTopic && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setSelectedTopic(null)}>
          <div
            className="w-full max-w-lg bg-white rounded-t-2xl p-5 space-y-4 animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[#2C2825]">{selectedTopic.title}</h3>
              <button onClick={() => setSelectedTopic(null)} className="text-[#A39B90] hover:text-[#6B635A]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Mastery bar */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-[#6B635A]">{Math.round(selectedTopic.readiness * 100)}% mastery</span>
                <span className="text-xs text-[#A39B90]">{selectedTopic.questions_seen}/{selectedTopic.questions_total} seen</span>
              </div>
              <div className="w-full h-2.5 bg-[#EBE8E2] rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.round(selectedTopic.readiness * 100)}%` }} />
              </div>
            </div>

            <div className="flex gap-3">
              <Link
                href={`/practice/${slug}?topic=${selectedTopic.id}`}
                className="flex-1 bg-[#2C2825] hover:bg-[#1A1816] text-[#F5F3EF] font-semibold py-3 rounded-xl text-center text-sm transition-colors"
                onClick={() => setSelectedTopic(null)}
              >
                Practice This Topic
              </Link>
              <Link
                href={`/course/${slug}/guidebook?topic=${selectedTopic.id}`}
                className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-[#F5F3EF] border border-[#E8E4DD] text-sm font-medium text-[#6B635A] hover:bg-[#EBE8E2]"
                onClick={() => setSelectedTopic(null)}
              >
                Lessons
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CoursePathPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[100dvh] bg-[#FAFAF8] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#2C2825] border-t-transparent rounded-full" />
      </div>
    }>
      <CoursePathContent />
    </Suspense>
  );
}
