import { NextRequest, NextResponse } from 'next/server'
import { getApiUser } from '@/lib/supabase/get-user-api'
import { XP } from '@/lib/utils/constants'

function calculateFSRS(isCorrect: boolean, cardState: any) {
  const rating = isCorrect ? 3 : 1 // Good or Again
  const prevDifficulty = cardState?.difficulty ?? 5.0
  const prevStability = cardState?.stability ?? 0
  const prevState = cardState?.state ?? 'new'

  // New difficulty
  let newDifficulty = prevDifficulty - 0.5 * (rating - 3)
  newDifficulty = Math.max(1, Math.min(10, newDifficulty))

  // New stability
  let newStability: number
  if (prevState === 'new' || prevStability === 0) {
    newStability = isCorrect ? 2.0 : 0.4
  } else if (isCorrect) {
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
  if (isCorrect) {
    newState = prevState === 'new' ? 'learning' : 'review'
  } else {
    newState = prevState === 'new' ? 'learning' : 'relearning'
  }

  return { rating, newDifficulty, newStability, newState, dueDate, interval }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, userId, error } = await getApiUser()
    if (error) return error

    const body = await request.json()
    const { session_id, question_id, selected_option_ids, time_spent_ms } = body

    if (!session_id || !question_id || !selected_option_ids) {
      return NextResponse.json(
        { error: 'session_id, question_id, and selected_option_ids are required' },
        { status: 400 }
      )
    }

    // Look up the question for correct answer
    const { data: question, error: qError } = await supabase
      .from('questions')
      .select('id, topic_id, module_id, course_id, correct_option_ids, explanation')
      .eq('id', question_id)
      .single()

    if (qError || !question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    // Determine correctness
    const correctIds = (question.correct_option_ids || []).sort()
    const selectedIds = [...selected_option_ids].sort()
    const isCorrect =
      correctIds.length === selectedIds.length &&
      correctIds.every((id: string, i: number) => id === selectedIds[i])

    // Get existing card state
    const { data: existingCard } = await supabase
      .from('user_card_states')
      .select('*')
      .eq('user_id', userId)
      .eq('question_id', question_id)
      .maybeSingle()

    // Calculate FSRS update
    const fsrs = calculateFSRS(isCorrect, existingCard)

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
      selected_option_ids: selected_option_ids,
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

    return NextResponse.json({
      is_correct: isCorrect,
      correct_option_ids: question.correct_option_ids,
      explanation: question.explanation,
      xp_earned: xpAmount,
      fsrs: {
        rating: fsrs.rating,
        next_review_date: fsrs.dueDate.toISOString(),
        state: fsrs.newState,
      },
    })
  } catch (err) {
    console.error('POST /api/session/answer error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
