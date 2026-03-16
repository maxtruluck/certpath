import { NextRequest, NextResponse } from 'next/server'
import { getApiUser } from '@/lib/supabase/get-user-api'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { supabase, userId, error } = await getApiUser()
    if (error) return error

    // Verify creator
    const { data: creator } = await supabase
      .from('creators')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    // Get full course
    const { data: course } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .eq('creator_id', creator.id)
      .single()

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Get modules, topics, questions, and lessons
    const [modulesRes, topicsRes, questionsRes, lessonsRes] = await Promise.all([
      supabase.from('modules').select('*').eq('course_id', id).order('display_order'),
      supabase.from('topics').select('*').eq('course_id', id).order('display_order'),
      supabase.from('questions').select('*').eq('course_id', id).eq('is_active', true),
      supabase.from('lessons').select('id, topic_id').eq('course_id', id).eq('is_active', true),
    ])

    const modules = modulesRes.data || []
    const topics = topicsRes.data || []
    const questions = questionsRes.data || []
    const lessons = lessonsRes.data || []

    // Count lessons per topic
    const lessonCountByTopic = new Map<string, number>()
    for (const l of lessons) {
      lessonCountByTopic.set(l.topic_id, (lessonCountByTopic.get(l.topic_id) || 0) + 1)
    }

    // Build structure
    const structure = modules.map((mod: any) => ({
      ...mod,
      topics: topics
        .filter((t: any) => t.module_id === mod.id)
        .map((t: any) => {
          const topicQuestions = questions.filter((q: any) => q.topic_id === t.id)
          return {
            ...t,
            question_count: topicQuestions.length,
            lesson_count: lessonCountByTopic.get(t.id) || 0,
          }
        }),
      question_count: questions.filter((q: any) => q.module_id === mod.id).length,
    }))

    // Compute warnings
    const warnings: string[] = []
    const totalQuestions = questions.length

    if (totalQuestions < 50) {
      warnings.push(`Course has ${totalQuestions} questions (minimum recommended: 50)`)
    }

    for (const mod of structure) {
      if (mod.topics.length < 3) {
        warnings.push(`Module "${mod.title}" has ${mod.topics.length} topics (minimum recommended: 3)`)
      }
      for (const topic of mod.topics) {
        if (topic.question_count < 10) {
          warnings.push(`Topic "${topic.title}" has ${topic.question_count} questions (minimum recommended: 10)`)
        }
        if (topic.lesson_count === 0) {
          warnings.push(`Topic "${topic.title}" has no lessons`)
        }
      }
    }

    // Sample questions (first 5)
    const sampleQuestions = questions.slice(0, 5)

    // Content coverage stat
    const topicsWithContent = topics.filter((t: any) => (lessonCountByTopic.get(t.id) || 0) > 0).length
    const contentCoverage = topics.length > 0 ? Math.round((topicsWithContent / topics.length) * 100) : 0

    // Bloom's distribution
    const bloomsDist: Record<string, number> = { remember: 0, understand: 0, apply: 0, analyze: 0 }
    for (const q of questions) {
      const level = (q as any).blooms_level || 'remember'
      bloomsDist[level] = (bloomsDist[level] || 0) + 1
    }

    // Topics with questions but no lessons
    const topicsNeedingContent = structure.flatMap((m: any) => m.topics)
      .filter((t: any) => t.question_count > 0 && t.lesson_count === 0).length

    return NextResponse.json({
      course,
      stats: {
        question_count: totalQuestions,
        module_count: modules.length,
        topic_count: topics.length,
        lesson_count: lessons.length,
        content_coverage: contentCoverage,
        flagged: 0,
        warnings: warnings.length,
        blooms_distribution: bloomsDist,
        topics_needing_content: topicsNeedingContent,
      },
      warnings,
      structure,
      sample_questions: sampleQuestions,
    })
  } catch (err) {
    console.error('GET /api/creator/courses/[id]/review error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
