// XP Award Values
export const XP = {
  CORRECT_ANSWER: 15,
  INCORRECT_ANSWER: 3,
  SESSION_COMPLETE: 25,
  STREAK_BONUS_7: 10,
  STREAK_BONUS_30: 25,
  PERFECT_SESSION: 50,
} as const;

// SM-2 Parameters
export const SM2 = {
  INITIAL_EASE_FACTOR: 2.5,
  MIN_EASE_FACTOR: 1.3,
  INITIAL_INTERVAL: 1,
  SECOND_INTERVAL: 3,
  EASE_BONUS: 0.1,
  EASE_PENALTY: 0.2,
  MAX_INTERVAL: 180,
  FUZZ_FACTOR: 0.1,
} as const;

// Session Parameters
export const SESSION = {
  DEFAULT_QUESTION_COUNT: 12,
  DUE_REVIEW_PCT: 0.6,
  WEAK_DOMAIN_PCT: 0.25,
  NEW_QUESTION_PCT: 0.15,
  NEW_USER_THRESHOLD: 50,
  NEW_USER_NEW_PCT: 0.4,
} as const;

// Design System Colors
export const COLORS = {
  dark: '#0a0a0f',
  surface: '#1a1a2e',
  surfaceLight: '#252545',
  accent: '#6c5ce7',
  accentLight: '#a29bfe',
  success: '#00b894',
  warning: '#fdcb6e',
  danger: '#e17055',
  text: '#f0f0f5',
  textMuted: '#a0a0b5',
} as const;

// Readiness thresholds
export const READINESS = {
  HIGH: 0.75,
  MEDIUM: 0.6,
} as const;
