// XP Level System
// Level 1 = 0 XP, Level 2 = 100 XP, etc. Each level requires progressively more XP.
// Formula: XP needed for level N = 100 * N * (N-1) / 2 (triangular numbers)

export interface LevelInfo {
  level: number;
  title: string;
  currentXp: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  progressToNext: number; // 0-1
}

const LEVEL_TITLES = [
  '',              // 0
  'Beginner',      // 1
  'Apprentice',    // 2
  'Student',       // 3
  'Scholar',       // 4
  'Practitioner',  // 5
  'Specialist',    // 6
  'Expert',        // 7
  'Master',        // 8
  'Grandmaster',   // 9
  'Legend',         // 10+
];

function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return 100 * level * (level - 1) / 2;
}

export function getLevelInfo(totalXp: number): LevelInfo {
  let level = 1;
  while (xpForLevel(level + 1) <= totalXp) {
    level++;
  }

  const xpForCurrentLevel = xpForLevel(level);
  const xpForNextLevel = xpForLevel(level + 1);
  const progressToNext = (totalXp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel);

  return {
    level,
    title: LEVEL_TITLES[Math.min(level, LEVEL_TITLES.length - 1)],
    currentXp: totalXp,
    xpForCurrentLevel,
    xpForNextLevel,
    progressToNext: Math.min(1, Math.max(0, progressToNext)),
  };
}
