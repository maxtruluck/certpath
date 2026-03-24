import { NextRequest, NextResponse } from 'next/server'
import { getApiUser } from '@/lib/supabase/get-user-api'

// ─── Answer validation per question type ─────────────────────────
function validateAnswer(
  question: any,
  body: any
): { isCorrect: boolean; rating: number; selectedOptionIds: string[] } {
  const questionType = question.question_type

  if (questionType === 'plot_point') {
    const userPoint = body.user_point
    const correctPoint = question.correct_point
    if (!userPoint || !correctPoint) {
      return { isCorrect: false, rating: 1, selectedOptionIds: [] }
    }
    const tolerance = correctPoint.tolerance ?? 0.5
    const dx = Math.abs(userPoint.x - correctPoint.x)
    const dy = Math.abs(userPoint.y - correctPoint.y)
    const isCorrect = dx <= tolerance && dy <= tolerance
    return { isCorrect, rating: isCorrect ? 3 : 1, selectedOptionIds: [] }
  }

  if (questionType === 'fill_blank') {
    const answerText = (body.answer_text || '').trim().toLowerCase()
    const acceptableAnswers: string[] = question.acceptable_answers || []
    const matchMode = question.match_mode || 'exact'

    let isCorrect = false
    if (matchMode === 'exact') {
      isCorrect = acceptableAnswers.some(
        (a: string) => a.trim().toLowerCase() === answerText
      )
    } else {
      // contains mode
      isCorrect = acceptableAnswers.some(
        (a: string) => answerText.includes(a.trim().toLowerCase())
      )
    }
    return { isCorrect, rating: isCorrect ? 3 : 1, selectedOptionIds: [] }
  }

  if (questionType === 'ordering') {
    const userOrder: string[] = body.user_order || body.selected_option_ids || []
    const correctOrder: string[] = question.correct_order || []

    if (correctOrder.length === 0) {
      return { isCorrect: false, rating: 1, selectedOptionIds: userOrder }
    }

    let correctPositions = 0
    for (let i = 0; i < correctOrder.length; i++) {
      if (userOrder[i] === correctOrder[i]) correctPositions++
    }

    const ratio = correctPositions / correctOrder.length
    const isCorrect = ratio === 1
    const rating = isCorrect ? 3 : ratio >= 0.75 ? 2 : 1

    return { isCorrect, rating, selectedOptionIds: userOrder }
  }

  if (questionType === 'matching') {
    const userPairs: { left: string; right: string }[] = body.user_pairs || []
    const correctPairs: { left: string; right: string }[] = question.matching_pairs || []

    if (correctPairs.length === 0) {
      return { isCorrect: false, rating: 1, selectedOptionIds: [] }
    }

    // Build a map of correct left->right
    const correctMap = new Map<string, string>()
    for (const pair of correctPairs) {
      correctMap.set(pair.left.toLowerCase(), pair.right.toLowerCase())
    }

    let correctCount = 0
    for (const userPair of userPairs) {
      const expected = correctMap.get(userPair.left.toLowerCase())
      if (expected && expected === userPair.right.toLowerCase()) {
        correctCount++
      }
    }

    const ratio = correctCount / correctPairs.length
    const isCorrect = ratio === 1
    const rating = isCorrect ? 3 : ratio >= 0.75 ? 2 : 1

    return { isCorrect, rating, selectedOptionIds: [] }
  }

  // Default: MC, MS, TF, diagram -- existing array comparison
  const correctIds = (question.correct_option_ids || []).sort()
  const selectedIds = [...(body.selected_option_ids || [])].sort()
  const isCorrect =
    correctIds.length === selectedIds.length &&
    correctIds.every((id: string, i: number) => id === selectedIds[i])

  return { isCorrect, rating: isCorrect ? 3 : 1, selectedOptionIds: body.selected_option_ids || [] }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, userId, error } = await getApiUser()
    if (error) return error

    const body = await request.json()
    const { session_id, question_id, time_spent_ms } = body

    if (!session_id || !question_id) {
      return NextResponse.json(
        { error: 'session_id and question_id are required' },
        { status: 400 }
      )
    }

    // Look up the question
    const { data: question, error: qError } = await supabase
      .from('questions')
      .select('id, topic_id, module_id, course_id, correct_option_ids, explanation, question_type, acceptable_answers, match_mode, correct_order, matching_pairs, option_explanations, lesson_id, attempt_count, pass_rate, correct_point')
      .eq('id', question_id)
      .single()

    if (qError || !question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    // Validate answer based on question type
    const { isCorrect, rating, selectedOptionIds } = validateAnswer(question, body)

    // Insert review_log (keep for analytics / session complete)
    await supabase.from('review_log').insert({
      user_id: userId,
      question_id: question_id,
      course_id: question.course_id,
      topic_id: question.topic_id,
      module_id: question.module_id,
      rating: rating,
      is_correct: isCorrect,
      selected_option_ids: selectedOptionIds,
      time_spent_ms: time_spent_ms || 0,
      state_before: 'new',
      state_after: isCorrect ? 'learning' : 'new',
      difficulty_before: 5.0,
      difficulty_after: 5.0,
      stability_before: 0,
      stability_after: 0,
      due_date_before: null,
      due_date_after: null,
      elapsed_days: 0,
      scheduled_days: 0,
      session_id: session_id,
    })

    // Update question pass_rate (running average)
    const oldCount = question.attempt_count ?? 0
    const oldRate = question.pass_rate ?? 0
    const newCount = oldCount + 1
    const newRate = (oldRate * oldCount + (isCorrect ? 1 : 0)) / newCount
    await supabase
      .from('questions')
      .update({ attempt_count: newCount, pass_rate: newRate })
      .eq('id', question_id)

    // Update user_courses stats
    const { data: userCourse } = await supabase
      .from('user_courses')
      .select('id, questions_seen, questions_correct')
      .eq('user_id', userId)
      .eq('course_id', question.course_id)
      .maybeSingle()

    if (userCourse) {
      // Only count questions_seen for first-time answers (not repeat reviews)
      const { count: priorAttempts } = await supabase
        .from('review_log')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('question_id', question_id)

      const isFirstAttempt = (priorAttempts ?? 0) <= 1 // 1 because we already inserted this attempt above

      const updates: any = {}
      if (isFirstAttempt) {
        updates.questions_seen = (userCourse.questions_seen || 0) + 1
      }
      if (isCorrect) {
        updates.questions_correct = (userCourse.questions_correct || 0) + 1
      }
      if (Object.keys(updates).length > 0) {
        await supabase.from('user_courses').update(updates).eq('id', userCourse.id)
      }
    }

    // Build response
    const response: any = {
      is_correct: isCorrect,
      correct_option_ids: question.correct_option_ids,
      explanation: question.explanation,
    }

    // For ordering/matching, include correct data for feedback
    if (question.question_type === 'ordering') {
      response.correct_order = question.correct_order
    }
    if (question.question_type === 'matching') {
      response.matching_pairs = question.matching_pairs
    }
    if (question.question_type === 'fill_blank') {
      response.acceptable_answers = question.acceptable_answers
    }
    if (question.question_type === 'plot_point' && question.correct_point) {
      response.correct_point = { x: question.correct_point.x, y: question.correct_point.y }
    }

    if (!isCorrect) {
      // Per-option explanation (MC/MS/TF)
      if (question.option_explanations && selectedOptionIds.length > 0) {
        const firstWrongId = selectedOptionIds.find(
          (id: string) => question.option_explanations[id]
        )
        if (firstWrongId) {
          response.option_explanation = question.option_explanations[firstWrongId]
        }
      }

      // Linked lesson content (context-on-failure)
      if (question.lesson_id) {
        const { data: linkedLesson } = await supabase
          .from('lessons')
          .select('title, body')
          .eq('id', question.lesson_id)
          .single()

        if (linkedLesson) {
          response.linked_lesson = {
            title: linkedLesson.title,
            body: linkedLesson.body,
          }
        }
      }
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error('POST /api/session/answer error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
