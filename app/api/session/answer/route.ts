import { NextRequest, NextResponse } from 'next/server'
import { getApiUser } from '@/lib/supabase/get-user-api'
import { XP } from '@/lib/utils/constants'

function calculateFSRS(isCorrect: boolean, cardState: any, rating?: number) {
  const finalRating = rating ?? (isCorrect ? 3 : 1)
  const prevDifficulty = cardState?.difficulty ?? 5.0
  const prevStability = cardState?.stability ?? 0
  const prevState = cardState?.state ?? 'new'

  // New difficulty
  let newDifficulty = prevDifficulty - 0.5 * (finalRating - 3)
  newDifficulty = Math.max(1, Math.min(10, newDifficulty))

  // New stability
  let newStability: number
  if (prevState === 'new' || prevStability === 0) {
    newStability = finalRating >= 3 ? 2.0 : 0.4
  } else if (finalRating >= 3) {
    newStability =
      prevStability *
      (1 +
        Math.exp(0.05) *
          (11 - newDifficulty) *
          Math.pow(prevStability, -0.2) *
          (Math.exp(0.1 * (1 - 0.9)) - 1))
    newStability = Math.max(newStability, prevStability + 0.5)
  } else {
    newStability = Math.max(0.4, prevStability * 0.5)
  }

  // New interval
  const interval = Math.max(1, Math.round(newStability))
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + Math.min(interval, 365))

  // New state
  let newState: string
  if (finalRating >= 3) {
    newState = prevState === 'new' ? 'learning' : 'review'
  } else {
    newState = prevState === 'new' ? 'learning' : 'relearning'
  }

  return { rating: finalRating, newDifficulty, newStability, newState, dueDate, interval }
}

// ─── Answer validation per question type ─────────────────────────
function validateAnswer(
  question: any,
  body: any
): { isCorrect: boolean; rating: number; selectedOptionIds: string[] } {
  const questionType = question.question_type

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

    // Build a map of correct left→right
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

  // Default: MC, MS, TF — existing array comparison
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

    // Look up the question — include new fields
    const { data: question, error: qError } = await supabase
      .from('questions')
      .select('id, topic_id, module_id, course_id, correct_option_ids, explanation, question_type, acceptable_answers, match_mode, correct_order, matching_pairs, option_explanations, lesson_id')
      .eq('id', question_id)
      .single()

    if (qError || !question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    // Validate answer based on question type
    const { isCorrect, rating, selectedOptionIds } = validateAnswer(question, body)

    // Get existing card state
    const { data: existingCard } = await supabase
      .from('user_card_states')
      .select('*')
      .eq('user_id', userId)
      .eq('question_id', question_id)
      .maybeSingle()

    // Calculate FSRS update (pass rating for partial credit types)
    const fsrs = calculateFSRS(isCorrect, existingCard, rating)

    // Calculate elapsed_days
    const elapsedDays = existingCard?.last_review_date
      ? Math.max(
          0,
          Math.round(
            (Date.now() - new Date(existingCard.last_review_date).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : 0

    // Upsert user_card_states
    const cardStateData = {
      user_id: userId,
      question_id: question_id,
      course_id: question.course_id,
      topic_id: question.topic_id,
      module_id: question.module_id,
      state: fsrs.newState,
      difficulty: fsrs.newDifficulty,
      stability: fsrs.newStability,
      due_date: fsrs.dueDate.toISOString(),
      last_review_date: new Date().toISOString(),
      reps: (existingCard?.reps || 0) + 1,
      lapses: isCorrect ? (existingCard?.lapses || 0) : (existingCard?.lapses || 0) + 1,
      last_rating: fsrs.rating,
      elapsed_days: elapsedDays,
      scheduled_days: fsrs.interval,
    }

    if (existingCard) {
      await supabase
        .from('user_card_states')
        .update(cardStateData)
        .eq('id', existingCard.id)
    } else {
      await supabase.from('user_card_states').insert(cardStateData)
    }

    // Insert review_log
    await supabase.from('review_log').insert({
      user_id: userId,
      question_id: question_id,
      course_id: question.course_id,
      topic_id: question.topic_id,
      module_id: question.module_id,
      rating: fsrs.rating,
      is_correct: isCorrect,
      selected_option_ids: selectedOptionIds,
      time_spent_ms: time_spent_ms || 0,
      state_before: existingCard?.state || 'new',
      state_after: fsrs.newState,
      difficulty_before: existingCard?.difficulty ?? 5.0,
      difficulty_after: fsrs.newDifficulty,
      stability_before: existingCard?.stability ?? 0,
      stability_after: fsrs.newStability,
      due_date_before: existingCard?.due_date || null,
      due_date_after: fsrs.dueDate.toISOString(),
      elapsed_days: elapsedDays,
      scheduled_days: fsrs.interval,
      session_id: session_id,
    })

    // Update user_courses stats
    const { data: userCourse } = await supabase
      .from('user_courses')
      .select('id, questions_seen, questions_correct')
      .eq('user_id', userId)
      .eq('course_id', question.course_id)
      .maybeSingle()

    if (userCourse) {
      const updates: any = {
        questions_seen: (userCourse.questions_seen || 0) + 1,
      }
      if (isCorrect) {
        updates.questions_correct = (userCourse.questions_correct || 0) + 1
      }
      await supabase.from('user_courses').update(updates).eq('id', userCourse.id)
    }

    // Award XP
    const xpAmount = isCorrect ? XP.CORRECT_ANSWER : XP.INCORRECT_ANSWER
    await supabase.from('xp_events').insert({
      user_id: userId,
      course_id: question.course_id,
      session_id: body.session_id,
      event_type: isCorrect ? 'correct_answer' : 'incorrect_answer',
      xp_amount: xpAmount,
    })

    // Increment total XP on profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('total_xp')
      .eq('id', userId)
      .single()
    await supabase
      .from('profiles')
      .update({ total_xp: (profileData?.total_xp || 0) + xpAmount })
      .eq('id', userId)

    // Build response — include per-option explanation and linked content block on wrong answers
    const response: any = {
      is_correct: isCorrect,
      correct_option_ids: question.correct_option_ids,
      explanation: question.explanation,
      xp_earned: xpAmount,
      fsrs: {
        rating: fsrs.rating,
        next_review_date: fsrs.dueDate.toISOString(),
        state: fsrs.newState,
      },
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
