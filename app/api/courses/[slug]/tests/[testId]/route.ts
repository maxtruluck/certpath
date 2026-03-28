import { NextRequest, NextResponse } from 'next/server'
import { getApiUser } from '@/lib/supabase/get-user-api'

/**
 * POST /api/courses/[slug]/tests/[testId] — Start a new test attempt.
 * Fetches all questions from test_questions, shuffles them,
 * snapshots into a test_attempt row, and returns questions (without answers).
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

    // Fetch test (only columns that exist)
    const { data: test } = await supabase
      .from('tests')
      .select('id, title, course_id, passing_score, time_limit_minutes')
      .eq('id', testId)
      .eq('course_id', course.id)
      .single()

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    // Check for existing in_progress attempt — resume if found
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
        time_limit_minutes: test.time_limit_minutes,
        started_at: existingAttempt.started_at,
        questions,
        total_questions: questions.length,
      })
    }

    // ── Fetch all questions from test_questions ────────────────────────
    const { data: testQuestions, error: tqError } = await supabase
      .from('test_questions')
      .select('*')
      .eq('test_id', testId)
      .order('sort_order', { ascending: true })

    if (tqError) {
      console.error('Fetch test_questions error:', tqError)
      return NextResponse.json({ error: 'Failed to load questions' }, { status: 500 })
    }

    if (!testQuestions || testQuestions.length === 0) {
      return NextResponse.json({ error: 'No questions available for this test' }, { status: 400 })
    }

    // Always shuffle the question order
    const shuffled = [...testQuestions]
    shuffleArray(shuffled)

    // Snapshot questions (full data for grading, stripped for client)
    const snapshotQuestions = shuffled.map((q: any) => ({
      question_id: q.id,
      question_content: q,
      selected_answer: null,
      is_correct: null,
      flagged: false,
    }))

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
    const clientQuestions = snapshotQuestions.map((q: any) => ({
      question_id: q.question_id,
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

function shuffleArray<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
}
