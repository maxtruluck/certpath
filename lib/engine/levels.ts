export interface LevelInfo {
  level: number
  title: string
  currentXp: number
  xpForCurrentLevel: number
  xpForNextLevel: number
  progressToNext: number
}

const LEVELS: { level: number; xp: number; title: string }[] = [
  { level: 1, xp: 0, title: 'Beginner' },
  { level: 2, xp: 100, title: 'Learner' },
  { level: 3, xp: 250, title: 'Student' },
  { level: 4, xp: 500, title: 'Scholar' },
  { level: 5, xp: 1000, title: 'Expert' },
  { level: 6, xp: 2000, title: 'Master' },
  { level: 7, xp: 3500, title: 'Grandmaster' },
  { level: 8, xp: 5500, title: 'Legend' },
  { level: 9, xp: 8000, title: 'Sage' },
  { level: 10, xp: 12000, title: 'Enlightened' },
]

export function getLevelInfo(totalXp: number): LevelInfo {
  let current = LEVELS[0]
  for (const lvl of LEVELS) {
    if (totalXp >= lvl.xp) current = lvl
    else break
  }

  const currentIndex = LEVELS.indexOf(current)
  const next = LEVELS[currentIndex + 1]

  if (!next) {
    return {
      level: current.level,
      title: current.title,
      currentXp: totalXp,
      xpForCurrentLevel: current.xp,
      xpForNextLevel: current.xp,
      progressToNext: 1,
    }
  }

  const xpIntoLevel = totalXp - current.xp
  const xpNeeded = next.xp - current.xp

  return {
    level: current.level,
    title: current.title,
    currentXp: totalXp,
    xpForCurrentLevel: current.xp,
    xpForNextLevel: next.xp,
    progressToNext: Math.min(1, xpIntoLevel / xpNeeded),
  }
}
