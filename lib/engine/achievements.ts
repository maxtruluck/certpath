import { SupabaseClient } from '@supabase/supabase-js'

export interface EarnedAchievement {
  id: string
  slug: string
  title: string
  description: string
  icon: string
  xp_reward: number
}

interface SessionData {
  courseId: string
  accuracy: number
  totalQuestions: number
  totalCorrect: number
  totalTimeMs: number
  completedAt: string
}

export async function checkAchievements(
  supabase: SupabaseClient,
  userId: string,
  sessionData: SessionData,
): Promise<EarnedAchievement[]> {
  // Fetch all achievements and which ones user already has
  const [{ data: allAchievements }, { data: earned }] = await Promise.all([
    supabase.from('achievements').select('*'),
    supabase.from('user_achievements').select('achievement_id').eq('user_id', userId),
  ])

  if (!allAchievements) return []
  const earnedIds = new Set((earned || []).map((e: { achievement_id: string }) => e.achievement_id))
  const unearnedAchievements = allAchievements.filter((a: { id: string }) => !earnedIds.has(a.id))

  if (unearnedAchievements.length === 0) return []

  // Gather user stats for evaluation
  const [{ data: coursesData }, { data: streakData }, { data: lastSessionData }] = await Promise.all([
    supabase
      .from('user_courses')
      .select('status, readiness_score, questions_seen, sessions_completed, last_session_at')
      .eq('user_id', userId),
    supabase.from('user_streaks').select('current_streak').eq('user_id', userId).single(),
    supabase
      .from('user_courses')
      .select('last_session_at')
      .eq('user_id', userId)
      .not('last_session_at', 'is', null)
      .order('last_session_at', { ascending: false })
      .limit(2),
  ])

  const courses = coursesData || []
  const totalQuestionsSeen = courses.reduce((s: number, c: { questions_seen: number }) => s + (c.questions_seen || 0), 0)
  const totalSessions = courses.reduce((s: number, c: { sessions_completed: number }) => s + (c.sessions_completed || 0), 0)
  const currentStreak = streakData?.current_streak || 0
  const hasCompletedCourse = courses.some((c: { status: string }) => c.status === 'completed')
  const maxReadiness = Math.max(0, ...courses.map((c: { readiness_score: number }) => c.readiness_score || 0))

  // Check days since previous session (for comeback achievement)
  let daysSinceLastSession = 0
  if (lastSessionData && lastSessionData.length >= 2) {
    const prev = new Date(lastSessionData[1].last_session_at)
    const now = new Date(sessionData.completedAt)
    daysSinceLastSession = Math.floor((now.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24))
  }

  const completedHour = new Date(sessionData.completedAt).getHours()

  // Evaluate each unearned achievement
  const newlyEarned: EarnedAchievement[] = []

  for (const achievement of unearnedAchievements) {
    let met = false
    const slug = achievement.slug as string

    switch (slug) {
      case 'first_session':
        met = totalSessions >= 1
        break
      case 'ten_sessions':
        met = totalSessions >= 10
        break
      case 'fifty_sessions':
        met = totalSessions >= 50
        break
      case 'perfect_session':
        met = sessionData.accuracy === 100 && sessionData.totalQuestions >= 5
        break
      case 'streak_3':
        met = currentStreak >= 3
        break
      case 'streak_7':
        met = currentStreak >= 7
        break
      case 'streak_30':
        met = currentStreak >= 30
        break
      case 'questions_100':
        met = totalQuestionsSeen >= 100
        break
      case 'questions_500':
        met = totalQuestionsSeen >= 500
        break
      case 'questions_1000':
        met = totalQuestionsSeen >= 1000
        break
      case 'course_complete':
        met = hasCompletedCourse
        break
      case 'mastery_80':
        met = maxReadiness >= 80
        break
      case 'mastery_90':
        met = maxReadiness >= 90
        break
      case 'speed_demon':
        met = sessionData.totalTimeMs < 180000 && sessionData.totalQuestions >= 10
        break
      case 'night_owl':
        met = completedHour >= 22 || completedHour < 4
        break
      case 'early_bird':
        met = completedHour >= 5 && completedHour < 7
        break
      case 'comeback':
        met = daysSinceLastSession >= 7
        break
    }

    if (met) {
      newlyEarned.push({
        id: achievement.id,
        slug: achievement.slug,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        xp_reward: achievement.xp_reward,
      })
    }
  }

  // Award achievements and XP
  if (newlyEarned.length > 0) {
    const achievementInserts = newlyEarned.map(a => ({
      user_id: userId,
      achievement_id: a.id,
    }))

    const xpInserts = newlyEarned
      .filter(a => a.xp_reward > 0)
      .map(a => ({
        user_id: userId,
        event_type: 'achievement',
        xp_amount: a.xp_reward,
        metadata: { achievement_slug: a.slug },
      }))

    const totalAchievementXp = newlyEarned.reduce((s, a) => s + a.xp_reward, 0)

    await Promise.all([
      supabase.from('user_achievements').insert(achievementInserts),
      xpInserts.length > 0 ? supabase.from('xp_events').insert(xpInserts) : Promise.resolve(),
      totalAchievementXp > 0
        ? supabase
            .from('profiles')
            .select('total_xp')
            .eq('id', userId)
            .single()
            .then(({ data }) => {
              const current = data?.total_xp || 0
              return supabase.from('profiles').update({ total_xp: current + totalAchievementXp }).eq('id', userId)
            })
        : Promise.resolve(),
    ])
  }

  return newlyEarned
}
