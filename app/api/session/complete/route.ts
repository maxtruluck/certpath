import { NextRequest, NextResponse } from 'next/server'
import { getApiUser } from '@/lib/supabase/get-user-api'
import { updateReadinessScore } from '@/lib/engine/readiness'
import { XP } from '@/lib/utils/constants'
import { checkAchievements } from '@/lib/engine/achievements'

export async function POST(request: NextRequest) {
  try {
    const { supabase, userId, error } = await getApiUser()
    if (error) return error

    const body = await request.json()
    const { session_id } = body

    if (!session_id) {
      return NextResponse.json({ error: 'session_id is required' }, { status: 400 })
    }

    // Query review_log for this session
    const { data: reviews, error: reviewError } = await supabase
      .from('review_log')
      .select('id, question_id, course_id, topic_id, is_correct, rating, time_spent_ms')
      .eq('user_id', userId)
      .eq('session_id', session_id)

    if (reviewError) {
      console.error('Review log query error:', reviewError)
      return NextResponse.json({ error: 'Failed to fetch session data' }, { status: 500 })
    }

    if (!reviews || reviews.length === 0) {
      return NextResponse.json({ error: 'No reviews found for this session' }, { status: 404 })
    }

    const courseId = reviews[0].course_id
    const totalCount = reviews.length
    const correctCount = reviews.filter((r: any) => r.is_correct).length
    const accuracyPercent = Math.round((correctCount / totalCount) * 100)

    // Get current readiness before update
    const { data: userCourse } = await supabase
      .from('user_courses')
      .select('id, readiness_score, sessions_completed, current_topic_id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle()

    const readinessBefore = userCourse?.readiness_score || 0

    // Calculate new readiness using the proper weighted FSRS-based calculator
    const readinessRaw = await updateReadinessScore(supabase, userId, courseId)
    const readinessAfter = Math.round(readinessRaw * 100)
    const readinessDelta = readinessAfter - readinessBefore

    // Topic breakdown
    const topicMap: Record<string, { correct: number; total: number; topic_id: string }> = {}
    for (const r of reviews) {
      if (!topicMap[r.topic_id]) {
        topicMap[r.topic_id] = { correct: 0, total: 0, topic_id: r.topic_id }
      }
      topicMap[r.topic_id].total++
      if (r.is_correct) topicMap[r.topic_id].correct++
    }

    // Get topic names
    const topicIds = Object.keys(topicMap)
    let topicNames: Record<string, string> = {}
    if (topicIds.length > 0) {
      const { data: topics } = await supabase
        .from('topics')
        .select('id, title')
        .in('id', topicIds)
      for (const t of topics || []) {
        topicNames[t.id] = t.title
      }
    }

    const topicBreakdown = Object.values(topicMap).map((t: any) => ({
      topic_id: t.topic_id,
      topic_title: topicNames[t.topic_id] || 'Unknown',
      correct: t.correct,
      total: t.total,
      accuracy_percent: Math.round((t.correct / t.total) * 100),
    }))

    // Update user_courses
    if (userCourse) {
      await supabase
        .from('user_courses')
        .update({
          sessions_completed: (userCourse.sessions_completed || 0) + 1,
          last_session_at: new Date().toISOString(),
        })
        .eq('id', userCourse.id)
    }

    // Check if current topic should be advanced
    // A topic is "complete" if its readiness >= 0.7
    let unlockedTopic: any = null

    if (userCourse?.current_topic_id) {
      const { data: currentTopicCards } = await supabase
        .from('user_card_states')
        .select('state')
        .eq('user_id', userId)
        .eq('topic_id', userCourse.current_topic_id)

      const { count: topicQuestionCount } = await supabase
        .from('questions')
        .select('id', { count: 'exact', head: true })
        .eq('topic_id', userCourse.current_topic_id)
        .eq('is_active', true)

      const topicTotal = topicQuestionCount || 1
      const topicReview = (currentTopicCards || []).filter((c: any) => c.state === 'review').length
      const topicReadiness = topicReview / topicTotal

      if (topicReadiness >= 0.7) {
        // Find next topic
        const { data: currentTopic } = await supabase
          .from('topics')
          .select('display_order, course_id')
          .eq('id', userCourse.current_topic_id)
          .single()

        if (currentTopic) {
          const { data: nextTopic } = await supabase
            .from('topics')
            .select('id, title')
            .eq('course_id', currentTopic.course_id)
            .gt('display_order', currentTopic.display_order)
            .order('display_order', { ascending: true })
            .limit(1)
            .maybeSingle()

          if (nextTopic) {
            await supabase
              .from('user_courses')
              .update({ current_topic_id: nextTopic.id })
              .eq('id', userCourse.id)

            unlockedTopic = { id: nextTopic.id, title: nextTopic.title }
          } else {
            // No more topics — course may be complete
            // Check if overall readiness is high enough
            if (readinessAfter >= 70) {
              await supabase
                .from('user_courses')
                .update({ status: 'completed', completed_at: new Date().toISOString() })
                .eq('id', userCourse.id)
            }
          }
        }
      }
    }

    // --- XP & Streaks ---
    let sessionXp = XP.SESSION_COMPLETE
    const isPerfect = correctCount === totalCount && totalCount >= 5
    if (isPerfect) sessionXp += XP.PERFECT_SESSION

    // Update streak
    const today = new Date().toISOString().split('T')[0]
    const { data: streakRow } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', userId)
      .single()

    let currentStreak = 1
    let longestStreak = 1

    if (streakRow) {
      const lastDate = streakRow.last_activity_date
      if (lastDate === today) {
        // Already counted today
        currentStreak = streakRow.current_streak
        longestStreak = streakRow.longest_streak
      } else {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split('T')[0]

        if (lastDate === yesterdayStr) {
          currentStreak = streakRow.current_streak + 1
        } else {
          currentStreak = 1
        }
        longestStreak = Math.max(streakRow.longest_streak, currentStreak)
        await supabase
          .from('user_streaks')
          .update({ current_streak: currentStreak, longest_streak: longestStreak, last_activity_date: today })
          .eq('user_id', userId)
      }
    } else {
      await supabase.from('user_streaks').insert({
        user_id: userId,
        current_streak: 1,
        longest_streak: 1,
        last_activity_date: today,
      })
    }

    // Streak bonuses
    if (currentStreak === 7) sessionXp += XP.STREAK_BONUS_7
    if (currentStreak === 30) sessionXp += XP.STREAK_BONUS_30

    // Record XP events
    const xpEvents: Array<{ user_id: string; course_id: string; session_id: string; event_type: string; xp_amount: number }> = [
      { user_id: userId, course_id: courseId, session_id: session_id, event_type: 'session_complete', xp_amount: XP.SESSION_COMPLETE },
    ]
    if (isPerfect) {
      xpEvents.push({ user_id: userId, course_id: courseId, session_id: session_id, event_type: 'perfect_session', xp_amount: XP.PERFECT_SESSION })
    }
    if (currentStreak === 7) {
      xpEvents.push({ user_id: userId, course_id: courseId, session_id: session_id, event_type: 'streak_bonus', xp_amount: XP.STREAK_BONUS_7 })
    }
    if (currentStreak === 30) {
      xpEvents.push({ user_id: userId, course_id: courseId, session_id: session_id, event_type: 'streak_bonus', xp_amount: XP.STREAK_BONUS_30 })
    }
    await supabase.from('xp_events').insert(xpEvents)

    // Update total XP
    const { data: profileXp } = await supabase.from('profiles').select('total_xp').eq('id', userId).single()
    await supabase.from('profiles').update({ total_xp: (profileXp?.total_xp || 0) + sessionXp }).eq('id', userId)

    // Check achievements
    const completedAt = new Date().toISOString()
    const totalTimeMs = reviews.reduce((s: number, r: { time_spent_ms: number }) => s + (r.time_spent_ms || 0), 0)
    const newAchievements = await checkAchievements(supabase, userId, {
      courseId,
      accuracy: accuracyPercent,
      totalQuestions: totalCount,
      totalCorrect: correctCount,
      totalTimeMs,
      completedAt,
    })

    return NextResponse.json({
      correct_count: correctCount,
      total_count: totalCount,
      accuracy_percent: accuracyPercent,
      readiness_before: readinessBefore,
      readiness_after: readinessAfter,
      readiness_delta: readinessDelta,
      topic_breakdown: topicBreakdown,
      unlocked_topic: unlockedTopic,
      xp_earned: sessionXp,
      streak: { current: currentStreak, longest: longestStreak },
      achievements: newAchievements,
    })
  } catch (err) {
    console.error('POST /api/session/complete error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
