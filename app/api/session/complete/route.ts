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
    const { session_id, topic_id } = body

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
      .select('id, readiness_score, sessions_completed')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle()

    const readinessBefore = userCourse?.readiness_score || 0

    // Calculate new readiness
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

    // ── Mark topic as completed ──────────────────────────────────
    if (topic_id) {
      // Fetch current progress to get items_total
      const { data: progressRow } = await supabase
        .from('user_topic_progress')
        .select('id, session_items_total')
        .eq('user_id', userId)
        .eq('topic_id', topic_id)
        .maybeSingle()

      if (progressRow) {
        await supabase
          .from('user_topic_progress')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            session_items_completed: progressRow.session_items_total,
          })
          .eq('id', progressRow.id)
      } else {
        // No progress row yet — create a completed one
        await supabase
          .from('user_topic_progress')
          .insert({
            user_id: userId,
            topic_id: topic_id,
            course_id: courseId,
            status: 'completed',
            completed_at: new Date().toISOString(),
            session_items_completed: 0,
            session_items_total: 0,
          })
      }

      // TODO: When all topics in a module are completed, trigger "Module complete!" achievement
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
      xp_earned: sessionXp,
      streak: { current: currentStreak, longest: longestStreak },
      achievements: newAchievements,
    })
  } catch (err) {
    console.error('POST /api/session/complete error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
