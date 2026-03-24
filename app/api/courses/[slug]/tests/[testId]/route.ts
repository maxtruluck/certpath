import { NextRequest, NextResponse } from 'next/server'
import { getApiUser } from '@/lib/supabase/get-user-api'

/**
 * POST /api/courses/[slug]/tests/[testId] — Start a new test attempt.
 * Generates a random set of questions from the pool, snapshots them,
 * creates a test_attempt row, and returns questions (without answers).
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string; testId: string }> }
) {
  try {
    const { supabase, userId, error } = await getApiUser()
    if (error) return error

    const { slug, testId } = await params

    // Fetch course
    const { data: course } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Verify enrollment
    const { data: enrollment } = await supabase
      .from('user_courses')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', course.id)
      .maybeSingle()

    if (!enrollment) {
      return NextResponse.json({ error: 'Not enrolled' }, { status: 403 })
    }

    // Fetch test
    const { data: test } = await supabase
      .from('tests')
      .select('*')
      .eq('id', testId)
      .eq('course_id', course.id)
      .eq('status', 'published')
      .single()

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    // Check max_attempts for final_assessment
    if (test.max_attempts) {
      const { count } = await supabase
        .from('test_attempts')
        .select('id', { count: 'exact', head: true })
        .eq('test_id', testId)
        .eq('user_id', userId)
        .in('status', ['completed', 'in_progress'])

      if ((count || 0) >= test.max_attempts) {
        return NextResponse.json({ error: 'Maximum attempts reached' }, { status: 409 })
      }
    }

    // Check for existing in_progress attempt
    const { data: existingAttempt } = await supabase
      .from('test_attempts')
      .select('*')
      .eq('test_id', testId)
      .eq('user_id', userId)
      .eq('status', 'in_progress')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingAttempt) {
      // Resume existing attempt - return questions without answers
      const questions = (existingAttempt.questions || []).map((q: any) => ({
        question_id: q.question_id,
        source: q.source,
        question_text: q.question_content.question_text,
        question_type: q.question_content.question_type || 'multiple_choice',
        options: q.question_content.options?.map((o: any) => ({ id: o.id, text: o.text })),
        selected_answer: q.selected_answer,
        flagged: q.flagged || false,
      }))

      return NextResponse.json({
        attempt_id: existingAttempt.id,
        resumed: true,
        test_title: test.title,
        test_type: test.test_type,
        time_limit_minutes: test.time_limit_minutes,
        started_at: existingAttempt.started_at,
        questions,
        total_questions: questions.length,
      })
    }

    // ── Build question pool ─────────────────────────────────────────
    const pool = await buildQuestionPool(supabase, course.id, test.module_id, test.test_type)

    if (pool.length === 0) {
      return NextResponse.json({ error: 'No questions available in pool' }, { status: 400 })
    }

    // ── Select & shuffle ────────────────────────────────────────────
    const selected = selectRandom(pool, test.question_count)

    if (test.shuffle_questions) {
      shuffleArray(selected)
    }

    // Snapshot questions (with answers for grading, but strip for client)
    const snapshotQuestions = selected.map(q => {
      const content = { ...q.content }
      if (test.shuffle_options && content.options) {
        content.options = [...content.options]
        shuffleArray(content.options)
      }
      return {
        question_id: q.id,
        source: q.source,
        question_content: content,
        selected_answer: null,
        is_correct: null,
        flagged: false,
      }
    })

    // Create attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('test_attempts')
      .insert({
        test_id: testId,
        user_id: userId,
        questions: snapshotQuestions,
        status: 'in_progress',
      })
      .select('id, started_at')
      .single()

    if (attemptError) {
      console.error('Create attempt error:', attemptError)
      return NextResponse.json({ error: 'Failed to start test' }, { status: 500 })
    }

    // Return questions without correct answers
    const clientQuestions = snapshotQuestions.map(q => ({
      question_id: q.question_id,
      source: q.source,
      question_text: q.question_content.question_text,
      question_type: q.question_content.question_type || 'multiple_choice',
      options: q.question_content.options?.map((o: any) => ({ id: o.id, text: o.text })),
      selected_answer: null,
      flagged: false,
    }))

    return NextResponse.json({
      attempt_id: attempt.id,
      resumed: false,
      test_title: test.title,
      test_type: test.test_type,
      time_limit_minutes: test.time_limit_minutes,
      started_at: attempt.started_at,
      questions: clientQuestions,
      total_questions: clientQuestions.length,
    }, { status: 201 })

  } catch (err) {
    console.error('POST test/start error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

interface PoolQuestion {
  id: string
  source: 'step' | 'pool'
  content: any
}

async function buildQuestionPool(
  supabase: any,
  courseId: string,
  moduleId: string | null,
  testType: string,
): Promise<PoolQuestion[]> {
  const pool: PoolQuestion[] = []
  const seenTexts = new Set<string>()

  const isModuleScope = testType === 'module_quiz' && moduleId

  // 1. Get Answer steps from lessons
  let lessonQuery = supabase
    .from('lessons')
    .select('id')
    .eq('course_id', courseId)
    .eq('is_active', true)

  if (isModuleScope) {
    lessonQuery = lessonQuery.eq('module_id', moduleId)
  }

  const { data: lessons } = await lessonQuery

  if (lessons && lessons.length > 0) {
    const lessonIds = lessons.map((l: any) => l.id)

    const { data: steps } = await supabase
      .from('lesson_steps')
      .select('id, content')
      .in('lesson_id', lessonIds)
      .eq('step_type', 'answer')

    for (const step of steps || []) {
      const text = step.content?.question_text || ''
      if (text && !seenTexts.has(text)) {
        seenTexts.add(text)
        pool.push({
          id: step.id,
          source: 'step',
          content: step.content,
        })
      }
    }
  }

  // 2. Get standalone pool questions
  let poolQuery = supabase
    .from('question_pool')
    .select('id, content')
    .eq('course_id', courseId)

  if (isModuleScope) {
    poolQuery = poolQuery.eq('module_id', moduleId)
  }

  const { data: poolQuestions } = await poolQuery

  for (const pq of poolQuestions || []) {
    const text = pq.content?.question_text || ''
    if (text && !seenTexts.has(text)) {
      seenTexts.add(text)
      pool.push({
        id: pq.id,
        source: 'pool',
        content: pq.content,
      })
    }
  }

  return pool
}

function selectRandom<T>(arr: T[], n: number): T[] {
  if (arr.length <= n) return [...arr]
  const copy = [...arr]
  shuffleArray(copy)
  return copy.slice(0, n)
}

function shuffleArray<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
}
