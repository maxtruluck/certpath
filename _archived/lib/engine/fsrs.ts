/**
 * FSRS v5 Spaced Repetition Engine
 *
 * Implements the Free Spaced Repetition Scheduler v5 algorithm.
 * Rating buttons: 1=Again, 3=Good, 4=Easy
 * Target retention: 90%
 * Maximum interval: 365 days
 * Fuzz factor: +/-10% jitter
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CardState = 'new' | 'learning' | 'review' | 'relearning';
export type Rating = 1 | 3 | 4; // Again, Good, Easy

export interface CardParams {
  state: CardState;
  difficulty: number; // 1.0 - 10.0
  stability: number; // days until R drops to target retention
  dueDate: Date;
  lastReviewDate: Date | null;
  reps: number;
  lapses: number;
  elapsedDays: number;
  scheduledDays: number;
}

export interface ReviewResult {
  state: CardState;
  difficulty: number;
  stability: number;
  dueDate: Date;
  scheduledDays: number;
  elapsedDays: number;
  reps: number;
  lapses: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TARGET_RETENTION = 0.9;
const MAX_INTERVAL = 365;
const FUZZ_FACTOR = 0.1;
const DEFAULT_DIFFICULTY = 5.0;
const MIN_DIFFICULTY = 1.0;
const MAX_DIFFICULTY = 10.0;

/** Initial stability values by rating (days). */
const INITIAL_STABILITY: Record<Rating, number> = {
  1: 0.4,
  3: 2.0,
  4: 5.0,
};

// ---------------------------------------------------------------------------
// Core Formulas
// ---------------------------------------------------------------------------

/**
 * Retrievability — probability of recall at time `t` days after last review,
 * given stability `S`. Uses the FSRS power forgetting curve.
 *
 *   R(t) = (1 + t / (9 * S))^(-1)
 */
export function retrievability(elapsedDays: number, stability: number): number {
  if (stability <= 0) return 0;
  if (elapsedDays <= 0) return 1;
  return Math.pow(1 + elapsedDays / (9 * stability), -1);
}

/**
 * Initial difficulty for the first review of a card.
 *
 *   D0(G) = 5 - (G - 3)
 */
function initialDifficulty(rating: Rating): number {
  return clampDifficulty(DEFAULT_DIFFICULTY - (rating - 3));
}

/**
 * Updated difficulty after a review.
 *
 *   D'(D, G) = D - 0.5 * (G - 3)
 */
function nextDifficulty(current: number, rating: Rating): number {
  return clampDifficulty(current - 0.5 * (rating - 3));
}

function clampDifficulty(d: number): number {
  return Math.min(MAX_DIFFICULTY, Math.max(MIN_DIFFICULTY, d));
}

/**
 * New stability after a **successful** review (rating >= 3).
 *
 *   S'_recall(D, S, R) = S * (1 + exp(0.5) * (11 - D) * S^(-0.2)
 *                            * (exp(0.1 * (1 - R)) - 1))
 */
function stabilityAfterRecall(
  difficulty: number,
  stability: number,
  retrievabilityValue: number,
): number {
  const factor =
    1 +
    Math.exp(0.5) *
      (11 - difficulty) *
      Math.pow(stability, -0.2) *
      (Math.exp(0.1 * (1 - retrievabilityValue)) - 1);
  return Math.max(0.1, stability * factor);
}

/**
 * New stability after a **failed** review (rating = 1).
 *
 *   S'_fail(D, S, R) = S * min(1, exp(-0.5) * (D - 1)^0.2 * S^(-0.3)
 *                          * (exp(0.2 * (1 - R)) - 1) + 0.1)
 */
function stabilityAfterLapse(
  difficulty: number,
  stability: number,
  retrievabilityValue: number,
): number {
  const inner =
    Math.exp(-0.5) *
      Math.pow(difficulty - 1, 0.2) *
      Math.pow(stability, -0.3) *
      (Math.exp(0.2 * (1 - retrievabilityValue)) - 1) +
    0.1;
  return Math.max(0.1, stability * Math.min(1, inner));
}

/**
 * Convert stability to a review interval (days), applying the target
 * retention formula.
 *
 *   I = S * 9 * ((1 / target_retention) - 1)
 *
 * For 90% retention this simplifies to I ~ S * 1.0, i.e. roughly round(S).
 */
function intervalFromStability(stability: number): number {
  const raw = stability * 9 * (1 / TARGET_RETENTION - 1);
  return Math.min(MAX_INTERVAL, Math.max(1, Math.round(raw)));
}

/**
 * Apply +/-10% fuzz jitter to an interval to avoid cards clustering on the
 * same review date.
 */
function applyFuzz(interval: number): number {
  if (interval <= 2) return interval; // no fuzz for very short intervals
  const delta = Math.round(interval * FUZZ_FACTOR);
  const jitter = Math.floor(Math.random() * (2 * delta + 1)) - delta;
  return Math.max(1, interval + jitter);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Process a review and return the updated card parameters.
 *
 * This is the main entry point for the FSRS engine. Call it each time a user
 * rates a card.
 */
export function processReview(
  card: CardParams | null,
  rating: Rating,
  now: Date = new Date(),
): ReviewResult {
  // Brand-new card with no prior state
  if (!card || card.state === 'new') {
    return handleFirstReview(rating, now);
  }

  const elapsedDays = card.lastReviewDate
    ? Math.max(0, daysBetween(card.lastReviewDate, now))
    : 0;

  const R = retrievability(elapsedDays, card.stability);
  const newDifficulty = nextDifficulty(card.difficulty, rating);

  if (rating === 1) {
    // Failed review — card enters relearning
    const newStability = stabilityAfterLapse(card.difficulty, card.stability, R);
    const interval = applyFuzz(intervalFromStability(newStability));
    const dueDate = addDays(now, interval);
    return {
      state: 'relearning',
      difficulty: newDifficulty,
      stability: newStability,
      dueDate,
      scheduledDays: interval,
      elapsedDays,
      reps: card.reps + 1,
      lapses: card.lapses + 1,
    };
  }

  // Successful review (rating 3 or 4)
  const newStability = stabilityAfterRecall(card.difficulty, card.stability, R);
  const interval = applyFuzz(intervalFromStability(newStability));
  const dueDate = addDays(now, interval);

  return {
    state: 'review',
    difficulty: newDifficulty,
    stability: newStability,
    dueDate,
    scheduledDays: interval,
    elapsedDays,
    reps: card.reps + 1,
    lapses: card.lapses,
  };
}

/**
 * Handle the very first review of a card (state === 'new' or card is null).
 */
function handleFirstReview(rating: Rating, now: Date): ReviewResult {
  const difficulty = initialDifficulty(rating);
  const stability = INITIAL_STABILITY[rating];
  const interval = applyFuzz(intervalFromStability(stability));
  const dueDate = addDays(now, interval);

  const state: CardState = rating === 1 ? 'learning' : 'review';

  return {
    state,
    difficulty,
    stability,
    dueDate,
    scheduledDays: interval,
    elapsedDays: 0,
    reps: 1,
    lapses: rating === 1 ? 1 : 0,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysBetween(a: Date, b: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((b.getTime() - a.getTime()) / msPerDay);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// ---------------------------------------------------------------------------
// DB helper: convert a row from user_card_states into CardParams
// ---------------------------------------------------------------------------

export interface UserCardStateRow {
  id: string;
  user_id: string;
  question_id: string;
  course_id: string;
  topic_id: string;
  module_id: string;
  state: CardState;
  difficulty: number;
  stability: number;
  due_date: string; // ISO date string
  last_review_date: string | null;
  reps: number;
  lapses: number;
  last_rating: number | null;
  elapsed_days: number;
  scheduled_days: number;
}

export function rowToCardParams(row: UserCardStateRow): CardParams {
  return {
    state: row.state,
    difficulty: row.difficulty,
    stability: row.stability,
    dueDate: new Date(row.due_date),
    lastReviewDate: row.last_review_date ? new Date(row.last_review_date) : null,
    reps: row.reps,
    lapses: row.lapses,
    elapsedDays: row.elapsed_days,
    scheduledDays: row.scheduled_days,
  };
}

/**
 * Build a partial DB row update from a ReviewResult, suitable for upserting
 * into user_card_states.
 */
export function resultToRowUpdate(result: ReviewResult, now: Date = new Date()) {
  return {
    state: result.state,
    difficulty: result.difficulty,
    stability: result.stability,
    due_date: result.dueDate.toISOString().split('T')[0],
    last_review_date: now.toISOString(),
    reps: result.reps,
    lapses: result.lapses,
    last_rating: null as number | null, // caller should set this
    elapsed_days: result.elapsedDays,
    scheduled_days: result.scheduledDays,
  };
}
