'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface LessonData {
  id: string;
  tag: string;
  label: string;
  questionCount: number;
  attempted: number;
  correct: number;
  difficulty: number;
  order: number;
}

interface DomainLessonsClientProps {
  cert: { id: string; slug: string; shortName: string; iconEmoji: string };
  domain: { id: string; name: string; slug: string; weightPercent: number; description: string };
  lessons: LessonData[];
  score: number;
  questionsAttempted: number;
  questionsCorrect: number;
}

const domainColors: Record<string, { primary: string; light: string; dark: string }> = {
  'general-security-concepts': { primary: '#6366f1', light: '#eef2ff', dark: '#4338ca' },
  'threats-vulnerabilities-mitigations': { primary: '#ef4444', light: '#fef2f2', dark: '#b91c1c' },
  'security-architecture': { primary: '#f59e0b', light: '#fffbeb', dark: '#b45309' },
  'security-operations': { primary: '#10b981', light: '#ecfdf5', dark: '#047857' },
  'security-program-management': { primary: '#8b5cf6', light: '#f5f3ff', dark: '#6d28d9' },
};

const defaultColors = { primary: '#6366f1', light: '#eef2ff', dark: '#4338ca' };

function getLessonStatus(lesson: LessonData, index: number, lessons: LessonData[]): 'locked' | 'available' | 'in-progress' | 'completed' {
  const mastery = lesson.questionCount > 0 ? lesson.correct / lesson.questionCount : 0;
  if (mastery >= 0.8) return 'completed';
  if (lesson.attempted > 0) return 'in-progress';
  if (index === 0) return 'available';
  // Unlock if previous lesson has been attempted
  const prev = lessons[index - 1];
  if (prev.attempted > 0) return 'available';
  return 'locked';
}

function getLessonIcon(lesson: LessonData, status: string): string {
  if (status === 'completed') return '✅';
  if (status === 'locked') return '🔒';
  // Map common security tags to emojis
  const tagIcons: Record<string, string> = {
    'access-control': '🔐',
    'least-privilege': '🔑',
    'security-concepts': '📚',
    'baseline': '📏',
    'security-controls': '🎛️',
    'configuration': '⚙️',
    'authentication': '👤',
    'multi-factor': '🔐',
    'mfa': '🔐',
    'encryption': '🔏',
    'cryptography': '🔣',
    'phishing': '🎣',
    'social-engineering': '🎭',
    'malware': '🦠',
    'ransomware': '💰',
    'vulnerability': '⚠️',
    'network': '🌐',
    'firewall': '🧱',
    'ids': '🔍',
    'ips': '🛡️',
    'incident-response': '🚨',
    'forensics': '🔬',
    'risk': '📊',
    'compliance': '📋',
    'governance': '🏛️',
    'cloud': '☁️',
    'zero-trust': '🚫',
    'pki': '📜',
    'cia-triad': '🔺',
    'threat-modeling': '🗺️',
    'penetration-testing': '🧪',
    'logging': '📝',
    'monitoring': '📡',
    'backup': '💾',
    'disaster-recovery': '🔄',
  };
  return tagIcons[lesson.tag] || ['📖', '⚡', '🎯', '💡', '🧩', '🔮'][lesson.order % 6];
}

export function DomainLessonsClient({ cert, domain, lessons, score, questionsAttempted, questionsCorrect }: DomainLessonsClientProps) {
  const [animatedNodes, setAnimatedNodes] = useState<Set<number>>(new Set());
  const [mounted, setMounted] = useState(false);
  const colors = domainColors[domain.slug] || defaultColors;
  const pct = Math.round(score * 100);
  const accuracy = questionsAttempted > 0 ? Math.round((questionsCorrect / questionsAttempted) * 100) : 0;

  useEffect(() => {
    setMounted(true);
    lessons.forEach((_, i) => {
      setTimeout(() => {
        setAnimatedNodes(prev => new Set([...prev, i]));
      }, 200 + i * 120);
    });
  }, [lessons]);

  return (
    <div className="relative -mx-4 -mt-2 min-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-lg border-b-2 border-cp-border">
        <div className="px-4 py-3 max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            <Link
              href={`/certifications/${cert.slug}/pathway`}
              className="flex items-center gap-1 text-cp-text-muted hover:text-cp-text transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              <span className="text-xs font-bold">Map</span>
            </Link>
            <div className="text-center">
              <h1 className="font-black text-sm tracking-tight" style={{ color: colors.primary }}>{domain.name}</h1>
              <p className="text-[10px] text-gray-400 font-semibold">{domain.weightPercent}% of exam</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-mono font-black" style={{ color: colors.primary }}>{pct}%</p>
              <p className="text-[9px] text-gray-400 font-bold uppercase">Mastery</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-2.5 h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${pct}%`, backgroundColor: colors.primary }}
            />
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className={`px-4 pt-4 pb-2 transition-all duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        <div className="max-w-lg mx-auto grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-3 text-center">
            <p className="text-lg font-mono font-black">{lessons.length}</p>
            <p className="text-[9px] text-gray-400 uppercase tracking-wider font-bold">Lessons</p>
          </div>
          <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-3 text-center">
            <p className="text-lg font-mono font-black">{questionsAttempted}</p>
            <p className="text-[9px] text-gray-400 uppercase tracking-wider font-bold">Practiced</p>
          </div>
          <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-3 text-center">
            <p className="text-lg font-mono font-black" style={{ color: accuracy >= 70 ? '#10b981' : accuracy >= 50 ? '#f59e0b' : accuracy > 0 ? '#ef4444' : undefined }}>
              {accuracy > 0 ? `${accuracy}%` : '—'}
            </p>
            <p className="text-[9px] text-gray-400 uppercase tracking-wider font-bold">Accuracy</p>
          </div>
        </div>
      </div>

      {/* Lesson path */}
      <div className="relative px-4 pb-32 pt-6">
        <div className="max-w-lg mx-auto relative">
          {/* Vertical connecting line */}
          <div
            className="absolute left-1/2 -translate-x-1/2 w-1 rounded-full"
            style={{
              top: 32,
              height: Math.max(0, (lessons.length - 1) * 140),
              background: `linear-gradient(to bottom, ${colors.primary}40, ${colors.primary}15)`,
            }}
          />

          {/* Lesson nodes */}
          {lessons.map((lesson, i) => {
            const status = getLessonStatus(lesson, i, lessons);
            const icon = getLessonIcon(lesson, status);
            const isVisible = animatedNodes.has(i);
            const mastery = lesson.questionCount > 0 ? Math.round((lesson.correct / lesson.questionCount) * 100) : 0;
            // Zigzag offset
            const offsetX = i % 2 === 0 ? -40 : 40;

            return (
              <div
                key={lesson.id}
                className={`relative flex items-center justify-center transition-all duration-500 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
                style={{
                  height: 140,
                  transitionDelay: `${200 + i * 120}ms`,
                }}
              >
                {/* Node + card */}
                <div
                  className="relative flex items-center gap-4"
                  style={{ transform: `translateX(${offsetX}px)` }}
                >
                  {/* The lesson node circle */}
                  <Link
                    href={status !== 'locked' ? `/practice/${cert.slug}?domain=${domain.id}` : '#'}
                    className={`relative flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                      status === 'locked'
                        ? 'bg-gray-100 border-[3px] border-gray-200 cursor-not-allowed'
                        : status === 'completed'
                        ? 'border-[3px] shadow-lg hover:scale-110'
                        : 'border-[3px] shadow-lg hover:scale-110 active:scale-95'
                    }`}
                    style={{
                      backgroundColor: status === 'locked' ? undefined : colors.light,
                      borderColor: status === 'locked' ? undefined : status === 'completed' ? '#10b981' : colors.primary,
                      boxShadow: status !== 'locked' ? `0 4px 20px ${colors.primary}25` : undefined,
                    }}
                    onClick={(e) => { if (status === 'locked') e.preventDefault(); }}
                  >
                    {/* Pulse ring for available/in-progress */}
                    {(status === 'available' || status === 'in-progress') && (
                      <div
                        className="absolute inset-0 -m-2 rounded-full animate-ping opacity-20"
                        style={{ backgroundColor: colors.primary }}
                      />
                    )}

                    <span className="text-2xl relative z-10">{icon}</span>

                    {/* Progress ring for in-progress */}
                    {status === 'in-progress' && (
                      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 64 64">
                        <circle
                          cx="32" cy="32" r="29"
                          fill="none"
                          stroke={colors.primary}
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 29}`}
                          strokeDashoffset={`${2 * Math.PI * 29 * (1 - mastery / 100)}`}
                          opacity="0.4"
                        />
                      </svg>
                    )}

                    {/* Crown for completed */}
                    {status === 'completed' && (
                      <div className="absolute -top-2 -right-1 text-sm animate-bounce" style={{ animationDuration: '2s' }}>
                        👑
                      </div>
                    )}
                  </Link>

                  {/* Info card */}
                  <div
                    className={`rounded-xl bg-white shadow-sm border px-3.5 py-2.5 min-w-[160px] transition-all duration-300 ${
                      status === 'locked'
                        ? 'border-gray-100 opacity-50'
                        : 'border-gray-100 hover:shadow-md'
                    }`}
                  >
                    <p className={`text-[13px] font-black tracking-tight leading-tight ${
                      status === 'locked' ? 'text-gray-400' : ''
                    }`} style={{ color: status === 'locked' ? undefined : colors.primary }}>
                      {lesson.label}
                    </p>
                    <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                      {lesson.questionCount} question{lesson.questionCount !== 1 ? 's' : ''} · Level {lesson.difficulty}
                    </p>

                    {lesson.attempted > 0 && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <div className="h-1.5 flex-1 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${mastery}%`,
                              backgroundColor: mastery >= 80 ? '#10b981' : colors.primary,
                            }}
                          />
                        </div>
                        <span className="text-[10px] font-mono font-bold" style={{
                          color: mastery >= 80 ? '#10b981' : colors.primary,
                        }}>
                          {mastery}%
                        </span>
                      </div>
                    )}

                    {status === 'available' && lesson.attempted === 0 && (
                      <div className="mt-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{
                          backgroundColor: colors.light,
                          color: colors.primary,
                        }}>
                          Start →
                        </span>
                      </div>
                    )}

                    {status === 'locked' && (
                      <p className="text-[9px] text-gray-300 font-medium mt-1">Complete previous lesson</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Domain complete badge at the bottom */}
          {lessons.length > 0 && (
            <div
              className={`flex justify-center pt-4 transition-all duration-700 ${
                animatedNodes.has(lessons.length - 1) ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
              }`}
              style={{ transitionDelay: `${300 + lessons.length * 120}ms` }}
            >
              <div className="text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto shadow-lg" style={{
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.dark})`,
                }}>
                  <span className="text-2xl">🏆</span>
                </div>
                <p className="text-xs font-black mt-2" style={{ color: colors.primary }}>Domain Mastered!</p>
                <p className="text-[10px] text-gray-400 font-semibold">Complete all lessons above</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating practice button */}
      <div className="fixed bottom-24 left-0 right-0 z-20 px-4">
        <div className="max-w-lg mx-auto">
          <Link
            href={`/practice/${cert.slug}?domain=${domain.id}`}
            className="block w-full py-4 rounded-2xl text-center text-white font-black text-sm shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.dark})`,
              boxShadow: `0 8px 30px ${colors.primary}40`,
            }}
          >
            Practice {domain.name}
          </Link>
        </div>
      </div>
    </div>
  );
}
