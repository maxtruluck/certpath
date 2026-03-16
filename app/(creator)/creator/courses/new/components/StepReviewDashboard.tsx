'use client'

import { useState, useEffect } from 'react'
import { COURSE_FORMATS, type CourseFormat } from '../lib/course-formats'
import { BLOOMS_LEVELS, BLOOMS_COLORS, type BloomsLevel } from '../lib/blooms'

// ─── Types ───────────────────────────────────────────────────────
interface TopicReview {
  id: string
  title: string
  question_count: number
  lesson_count: number
}

interface ModuleReview {
  id: string
  title: string
  topics: TopicReview[]
  question_count: number
}

interface ReviewStats {
  total_questions: number
  total_modules: number
  total_topics: number
  content_coverage: number
  difficulty_distribution: Record<number, number>
  type_distribution: Record<string, number>
  blooms_distribution: Record<string, number>
  topics_needing_content: number
}

interface ValidationItem {
  label: string
  passed: boolean
  details?: string
  isWarning?: boolean
}

// ─── Stat Card ───────────────────────────────────────────────────
function StatCard({ label, value, suffix, alert }: { label: string; value: number; suffix?: string; alert?: boolean }) {
  return (
    <div className={`bg-white rounded-xl border p-4 text-center ${alert ? 'border-red-200' : 'border-gray-200'}`}>
      <p className={`text-2xl font-bold ${alert ? 'text-red-600' : 'text-gray-900'}`}>
        {value}{suffix}
      </p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  )
}

// ─── CSS Bar Chart ───────────────────────────────────────────────
function BarChart({ data, labels, colors }: { data: number[]; labels: string[]; colors: string[] }) {
  const max = Math.max(...data, 1)
  return (
    <div className="flex items-end gap-2 h-32">
      {data.map((value, i) => (
        <div key={labels[i]} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs font-semibold text-gray-700">{value}</span>
          <div
            className={`w-full rounded-t ${colors[i] || 'bg-blue-400'}`}
            style={{ height: `${Math.max((value / max) * 100, 4)}%` }}
          />
          <span className="text-[10px] text-gray-400">{labels[i]}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Bloom's Horizontal Bar Chart ────────────────────────────────
function BloomsChart({
  distribution,
  totalQuestions,
  targetDistribution,
}: {
  distribution: Record<string, number>
  totalQuestions: number
  targetDistribution?: Record<BloomsLevel, number>
}) {
  return (
    <div className="space-y-2.5">
      {BLOOMS_LEVELS.map(level => {
        const count = distribution[level.value] || 0
        const pct = totalQuestions > 0 ? Math.round((count / totalQuestions) * 100) : 0
        const targetPct = targetDistribution?.[level.value]
        const deviation = targetPct !== undefined ? pct - targetPct : 0

        return (
          <div key={level.value}>
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs font-medium ${level.color}`}>{level.label}</span>
              <span className="text-xs text-gray-500">
                {count} ({pct}%)
                {targetPct !== undefined && (
                  <span className="text-gray-300 ml-1">/ target {targetPct}%</span>
                )}
              </span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden relative">
              <div
                className={`h-full rounded-full ${BLOOMS_COLORS[level.value]}`}
                style={{ width: `${Math.max(pct, 2)}%` }}
              />
              {targetPct !== undefined && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-gray-400"
                  style={{ left: `${targetPct}%` }}
                />
              )}
            </div>
            {Math.abs(deviation) > 15 && targetPct !== undefined && (
              <p className="text-[10px] text-amber-600 mt-0.5">
                {deviation > 0 ? 'Over' : 'Under'}-represented by {Math.abs(deviation)}%
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Validation Checklist ────────────────────────────────────────
function ValidationChecklist({ items }: { items: ValidationItem[] }) {
  return (
    <div className="space-y-2">
      {items.map(item => (
        <div key={item.label} className="flex items-start gap-3 py-2">
          {item.passed ? (
            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6L5 9L10 3" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          ) : item.isWarning ? (
            <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M5 1L9 9H1L5 1Z" stroke="#F59E0B" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 2L8 8M2 8L8 2" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
          )}
          <div>
            <p className={`text-sm ${item.passed ? 'text-gray-700' : item.isWarning ? 'text-amber-700' : 'text-red-700 font-medium'}`}>
              {item.label}
            </p>
            {item.details && (
              <p className="text-xs text-gray-400 mt-0.5">{item.details}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────
export default function StepReviewDashboard({
  courseId,
  onBack,
  onSubmit,
  submitting,
  courseFormat,
}: {
  courseId: string
  onBack: () => void
  onSubmit: () => void
  submitting: boolean
  courseFormat?: CourseFormat
}) {
  const [loading, setLoading] = useState(true)
  const [modules, setModules] = useState<ModuleReview[]>([])
  const [stats, setStats] = useState<ReviewStats>({
    total_questions: 0,
    total_modules: 0,
    total_topics: 0,
    content_coverage: 0,
    difficulty_distribution: {},
    type_distribution: {},
    blooms_distribution: { remember: 0, understand: 0, apply: 0, analyze: 0 },
    topics_needing_content: 0,
  })
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())

  const formatGuidance = courseFormat ? COURSE_FORMATS[courseFormat]?.guidance : null

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/creator/courses/${courseId}/review`)
        const data = await res.json()

        const structure: ModuleReview[] = (data.structure || []).map((mod: any) => ({
          id: mod.id,
          title: mod.title,
          question_count: mod.question_count,
          topics: (mod.topics || []).map((t: any) => ({
            id: t.id,
            title: t.title,
            question_count: t.question_count,
            lesson_count: t.lesson_count || 0,
          })),
        }))

        const totalQ = data.stats?.question_count || 0
        const totalM = data.stats?.module_count || 0
        const totalT = data.stats?.topic_count || 0
        const bloomsDist = data.stats?.blooms_distribution || { remember: 0, understand: 0, apply: 0, analyze: 0 }
        const topicsNeedingContent = data.stats?.topics_needing_content || 0

        // Compute distributions from questions
        const diffDist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        const typeDist: Record<string, number> = { multiple_choice: 0, multiple_select: 0, true_false: 0 }

        // Fetch all questions for distributions
        try {
          const qRes = await fetch(`/api/creator/courses/${courseId}`)
          const courseData = await qRes.json()
          if (courseData.modules) {
            for (const mod of courseData.modules) {
              for (const topic of mod.topics || []) {
                try {
                  const tqRes = await fetch(`/api/creator/courses/${courseId}/topics/${topic.id}/questions`)
                  const tqData = await tqRes.json()
                  if (Array.isArray(tqData)) {
                    for (const q of tqData) {
                      diffDist[q.difficulty] = (diffDist[q.difficulty] || 0) + 1
                      typeDist[q.question_type] = (typeDist[q.question_type] || 0) + 1
                    }
                    // Also update content block count
                    // lesson counts come from the review API already
                  }
                } catch { /* skip */ }
              }
            }
          }
        } catch { /* skip */ }

        // Compute coverage using lesson counts
        const updatedTopicsWithContent = structure.flatMap(m => m.topics).filter(t => t.lesson_count > 0).length
        const updatedCoverage = totalT > 0 ? Math.round((updatedTopicsWithContent / totalT) * 100) : 0

        setModules(structure)
        setStats({
          total_questions: totalQ,
          total_modules: totalM,
          total_topics: totalT,
          content_coverage: updatedCoverage,
          difficulty_distribution: diffDist,
          type_distribution: typeDist,
          blooms_distribution: bloomsDist,
          topics_needing_content: topicsNeedingContent,
        })
      } catch (err) {
        console.error('Failed to load review data:', err)
      }
      setLoading(false)
    }
    load()
  }, [courseId])

  // ─── Build Validation Items ──────────────────────────────────
  const validations: ValidationItem[] = []

  // >= 50 total questions
  validations.push({
    label: `${stats.total_questions >= 50 ? 'Has' : 'Needs'} at least 50 total questions`,
    passed: stats.total_questions >= 50,
    details: `Currently: ${stats.total_questions} questions`,
  })

  // >= 3 topics per module
  const failingModules = modules.filter(m => m.topics.length < 3)
  validations.push({
    label: 'At least 3 topics per module',
    passed: failingModules.length === 0,
    details: failingModules.length > 0
      ? `Failing: ${failingModules.map(m => `"${m.title}" (${m.topics.length})`).join(', ')}`
      : undefined,
  })

  // >= 10 questions per topic
  const failingTopics = modules.flatMap(m => m.topics).filter(t => t.question_count < 10)
  validations.push({
    label: 'At least 10 questions per topic',
    passed: failingTopics.length === 0,
    details: failingTopics.length > 0
      ? `Failing: ${failingTopics.slice(0, 5).map(t => `"${t.title}" (${t.question_count})`).join(', ')}${failingTopics.length > 5 ? ` +${failingTopics.length - 5} more` : ''}`
      : undefined,
  })

  // All topics have at least 1 lesson
  const emptyTopics = modules.flatMap(m => m.topics).filter(t => t.lesson_count === 0)
  validations.push({
    label: 'All topics have at least one lesson',
    passed: emptyTopics.length === 0,
    details: emptyTopics.length > 0
      ? `Missing lessons: ${emptyTopics.slice(0, 5).map(t => `"${t.title}"`).join(', ')}${emptyTopics.length > 5 ? ` +${emptyTopics.length - 5} more` : ''}`
      : undefined,
  })

  // ─── Warning Items (non-blocking) ─────────────────────────────
  const warnings: ValidationItem[] = []

  if (stats.topics_needing_content > 0) {
    warnings.push({
      label: `${stats.topics_needing_content} topic${stats.topics_needing_content !== 1 ? 's have' : ' has'} questions but no lessons`,
      passed: false,
      isWarning: true,
      details: 'Learners benefit from studying lesson content before being tested',
    })
  }

  // Check if Bloom's distribution is heavily weighted toward recall
  const totalQ = stats.total_questions
  if (totalQ > 0 && formatGuidance) {
    const rememberPct = Math.round(((stats.blooms_distribution.remember || 0) / totalQ) * 100)
    const targetRemember = formatGuidance.bloomsDistribution.remember
    if (rememberPct > targetRemember + 15) {
      warnings.push({
        label: `Bloom's distribution heavily weighted toward recall (${rememberPct}% vs ${targetRemember}% target)`,
        passed: false,
        isWarning: true,
        details: 'Consider adding more application and analysis questions',
      })
    }
  }

  const allPassed = validations.every(v => v.passed)

  const toggleModule = (id: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-gray-200 rounded-xl" />)}
        </div>
        <div className="h-48 bg-gray-200 rounded-xl" />
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Review &amp; Submit</h2>
      <p className="text-sm text-gray-500 mb-6">Verify your course meets all requirements before submitting.</p>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        <StatCard label="Total Questions" value={stats.total_questions} />
        <StatCard label="Modules" value={stats.total_modules} />
        <StatCard label="Topics" value={stats.total_topics} />
        <StatCard label="Content Coverage" value={stats.content_coverage} suffix="%" />
        <StatCard
          label="Topics Need Content"
          value={stats.topics_needing_content}
          alert={stats.topics_needing_content > 0}
        />
      </div>

      {/* Validation Checklist */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Submission Requirements</h3>
        <ValidationChecklist items={validations} />
        {warnings.length > 0 && (
          <>
            <div className="border-t border-gray-100 my-3" />
            <h4 className="text-xs font-semibold text-amber-600 mb-2">Recommendations</h4>
            <ValidationChecklist items={warnings} />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Difficulty Distribution</h3>
          <BarChart
            data={[1, 2, 3, 4, 5].map(d => stats.difficulty_distribution[d] || 0)}
            labels={['1', '2', '3', '4', '5']}
            colors={['bg-green-300', 'bg-green-400', 'bg-amber-400', 'bg-orange-400', 'bg-red-400']}
          />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Bloom&apos;s Level Distribution</h3>
          <BloomsChart
            distribution={stats.blooms_distribution}
            totalQuestions={stats.total_questions}
            targetDistribution={formatGuidance?.bloomsDistribution}
          />
        </div>
      </div>

      {/* Question Type Distribution */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Question Type Distribution</h3>
        <BarChart
          data={[
            stats.type_distribution['multiple_choice'] || 0,
            stats.type_distribution['multiple_select'] || 0,
            stats.type_distribution['true_false'] || 0,
            stats.type_distribution['fill_blank'] || 0,
            stats.type_distribution['ordering'] || 0,
            stats.type_distribution['matching'] || 0,
          ]}
          labels={['MC', 'MS', 'T/F', 'FB', 'ORD', 'MATCH']}
          colors={['bg-blue-400', 'bg-purple-400', 'bg-indigo-400', 'bg-teal-400', 'bg-cyan-400', 'bg-pink-400']}
        />
      </div>

      {/* Structure Tree */}
      <div className="bg-white rounded-xl border border-gray-200 mb-6">
        <div className="px-5 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Course Structure</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {modules.map(mod => (
            <div key={mod.id}>
              <button
                onClick={() => toggleModule(mod.id)}
                className="w-full px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${expandedModules.has(mod.id) ? 'rotate-90' : ''}`}
                    fill="none" viewBox="0 0 24 24"
                  >
                    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-sm font-medium text-gray-900">{mod.title}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>{mod.topics.length} topics</span>
                  <span>{mod.question_count} questions</span>
                </div>
              </button>
              {expandedModules.has(mod.id) && (
                <div className="px-5 pb-3 pl-12 space-y-1">
                  {mod.topics.map(topic => (
                    <div key={topic.id} className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          topic.question_count >= 10 && topic.lesson_count > 0
                            ? 'bg-green-500'
                            : topic.question_count > 0 || topic.lesson_count > 0
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                        }`} />
                        <span className="text-sm text-gray-600">{topic.title}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>{topic.lesson_count} lesson{topic.lesson_count !== 1 ? 's' : ''}</span>
                        <span>{topic.question_count} questions</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-100">
        <button onClick={onBack} className="btn-ghost px-5 py-2.5 text-sm">Back</button>
        <div className="flex items-center gap-3">
          {!allPassed && (
            <p className="text-xs text-amber-600">Some requirements not met</p>
          )}
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="btn-primary px-6 py-2.5 text-sm disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : allPassed ? 'Submit for Review' : 'Submit Anyway'}
          </button>
        </div>
      </div>
    </div>
  )
}
