/**
 * Session Generator — 3-pool algorithm for building practice sessions.
 *
 * Pool 1 (60%): Due reviews — cards from user_card_states WHERE due_date <= TODAY,
 *               ordered most overdue first.
 * Pool 2 (25%): Weak topic fill — new unseen cards from the lowest-scoring topic
 *               the learner has already started.
 * Pool 3 (15%): New cards — from learner's current topic on the linear path,
 *               easier questions first.
 *
 * If a pool has fewer cards than needed, surplus slots redistribute to other pools.
 * The final session is shuffled.
 */

import { SupabaseClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SessionQuestion {
  id: string;
  topic_id: string;
  module_id: string;
  course_id: string;
  question_text: string;
  question_type: string;
  options: { id: string; text: string }[];
  correct_option_ids: string[];
  explanation: string;
  difficulty: number;
  tags: string[];
}

interface RawQuestion {
  id: string;
  topic_id: string;
  module_id: string;
  course_id: string;
  question_text: string;
  question_type: string;
  options: { id: string; text: string; is_correct?: boolean }[];
  correct_option_ids: string[];
  explanation: string;
  difficulty: number;
  tags: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_SESSION_SIZE = 10;
const POOL_1_PCT = 0.6; // due reviews
const POOL_2_PCT = 0.25; // weak topic fill
const POOL_3_PCT = 0.15; // new cards

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Validate that every value looks like a UUID before interpolation. */
function validUUIDs(ids: Iterable<string>): string[] {
  return Array.from(ids).filter((id) => UUID_RE.test(id));
}

/**
 * Build a Supabase query that optionally excludes a set of IDs.
 * Skips the `.not()` filter entirely when there is nothing to exclude,
 * avoiding the old dummy-UUID hack.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyExcludeFilter(query: any, excludeIds: Set<string>): any {
  const safe = validUUIDs(excludeIds);
  if (safe.length === 0) return query;
  return query.not('id', 'in', `(${safe.join(',')})`);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate a practice session of `questionCount` questions for the given user
 * and course. Returns questions with `is_correct` stripped from options.
 */
export async function generateSession(
  supabase: SupabaseClient,
  userId: string,
  courseId: string,
  questionCount: number = DEFAULT_SESSION_SIZE,
): Promise<SessionQuestion[]> {
  const today = new Date().toISOString().split('T')[0];

  // Target pool sizes
  let pool1Target = Math.round(questionCount * POOL_1_PCT);
  let pool2Target = Math.round(questionCount * POOL_2_PCT);
  let pool3Target = questionCount - pool1Target - pool2Target;

  const usedIds = new Set<string>();
  const questions: RawQuestion[] = [];

  // ------------------------------------------------------------------
  // Pool 1: Due reviews
  // ------------------------------------------------------------------
  const pool1 = await fetchDueReviews(supabase, userId, courseId, today, pool1Target);
  for (const q of pool1) {
    if (!usedIds.has(q.id)) {
      questions.push(q);
      usedIds.add(q.id);
    }
  }

  // Redistribute unfilled Pool 1 slots
  const pool1Shortfall = pool1Target - pool1.length;
  if (pool1Shortfall > 0) {
    // Give 60% of surplus to pool 2, 40% to pool 3
    pool2Target += Math.ceil(pool1Shortfall * 0.6);
    pool3Target += pool1Shortfall - Math.ceil(pool1Shortfall * 0.6);
  }

  // ------------------------------------------------------------------
  // Pool 2: Weak topic fill
  // ------------------------------------------------------------------
  const pool2 = await fetchWeakTopicCards(
    supabase,
    userId,
    courseId,
    pool2Target,
    usedIds,
  );
  for (const q of pool2) {
    if (!usedIds.has(q.id)) {
      questions.push(q);
      usedIds.add(q.id);
    }
  }

  // Redistribute unfilled Pool 2 slots to Pool 3
  const pool2Shortfall = pool2Target - pool2.length;
  if (pool2Shortfall > 0) {
    pool3Target += pool2Shortfall;
  }

  // ------------------------------------------------------------------
  // Pool 3: New cards from current topic (linear path)
  // ------------------------------------------------------------------
  const pool3 = await fetchNewCards(
    supabase,
    userId,
    courseId,
    pool3Target,
    usedIds,
  );
  for (const q of pool3) {
    if (!usedIds.has(q.id)) {
      questions.push(q);
      usedIds.add(q.id);
    }
  }

  // If pool 3 also fell short, try to backfill from any remaining unseen cards
  const totalShortfall = questionCount - questions.length;
  if (totalShortfall > 0) {
    const backfill = await fetchAnyUnseen(
      supabase,
      courseId,
      totalShortfall,
      usedIds,
    );
    for (const q of backfill) {
      if (!usedIds.has(q.id)) {
        questions.push(q);
        usedIds.add(q.id);
      }
    }
  }

  // Shuffle (Fisher-Yates)
  shuffle(questions);

  // Strip is_correct from options before returning
  return questions.map(stripAnswers);
}

// ---------------------------------------------------------------------------
// Pool fetchers
// ---------------------------------------------------------------------------

/**
 * Pool 1: Fetch cards where due_date <= today, ordered most overdue first.
 */
async function fetchDueReviews(
  supabase: SupabaseClient,
  userId: string,
  courseId: string,
  today: string,
  limit: number,
): Promise<RawQuestion[]> {
  // Get due card question IDs
  const { data: dueCards } = await supabase
    .from('user_card_states')
    .select('question_id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .lte('due_date', today)
    .neq('state', 'new')
    .order('due_date', { ascending: true })
    .limit(limit);

  if (!dueCards || dueCards.length === 0) return [];

  const ids = dueCards.map((c) => c.question_id);
  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .in('id', ids)
    .eq('is_active', true);

  return (questions ?? []) as RawQuestion[];
}

/**
 * Pool 2: Fetch unseen cards from the learner's weakest topic that they have
 * already started (has at least one card state).
 */
async function fetchWeakTopicCards(
  supabase: SupabaseClient,
  userId: string,
  courseId: string,
  limit: number,
  excludeIds: Set<string>,
): Promise<RawQuestion[]> {
  if (limit <= 0) return [];

  // Find topics the user has started, ordered by average retrievability (weakest first).
  // We approximate "weak" as topics with the lowest average stability.
  const { data: topicStats } = await supabase
    .from('user_card_states')
    .select('topic_id, stability')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .neq('state', 'new');

  if (!topicStats || topicStats.length === 0) return [];

  // Compute average stability per topic
  const topicStabilityMap = new Map<string, { total: number; count: number }>();
  for (const row of topicStats) {
    const entry = topicStabilityMap.get(row.topic_id) ?? { total: 0, count: 0 };
    entry.total += row.stability;
    entry.count += 1;
    topicStabilityMap.set(row.topic_id, entry);
  }

  // Sort topics by average stability ascending (weakest first)
  const sortedTopics = Array.from(topicStabilityMap.entries())
    .map(([topicId, stats]) => ({ topicId, avgStability: stats.total / stats.count }))
    .sort((a, b) => a.avgStability - b.avgStability);

  // Batch-fetch all seen question IDs across all weak topics in one query
  const weakTopicIds = sortedTopics.map((t) => t.topicId);
  const { data: allSeenCards } = await supabase
    .from('user_card_states')
    .select('question_id, topic_id')
    .eq('user_id', userId)
    .in('topic_id', weakTopicIds);

  const seenIdsByTopic = new Map<string, Set<string>>();
  for (const row of allSeenCards ?? []) {
    let s = seenIdsByTopic.get(row.topic_id);
    if (!s) { s = new Set(); seenIdsByTopic.set(row.topic_id, s); }
    s.add(row.question_id);
  }

  // Get unseen cards from the weakest topics
  const result: RawQuestion[] = [];
  for (const { topicId } of sortedTopics) {
    if (result.length >= limit) break;

    const seenIds = seenIdsByTopic.get(topicId) ?? new Set<string>();
    const allExclude = new Set([...excludeIds, ...seenIds]);

    const remaining = limit - result.length;
    let query = supabase
      .from('questions')
      .select('*')
      .eq('topic_id', topicId)
      .eq('course_id', courseId)
      .eq('is_active', true);

    query = applyExcludeFilter(query, allExclude);

    const { data: questions } = await query
      .order('difficulty', { ascending: true })
      .limit(remaining);

    if (questions) {
      result.push(...(questions as RawQuestion[]));
    }
  }

  return result.slice(0, limit);
}

/**
 * Pool 3: Fetch new (unseen) cards from the learner's current topic on the
 * linear module/topic path, easiest questions first.
 */
async function fetchNewCards(
  supabase: SupabaseClient,
  userId: string,
  courseId: string,
  limit: number,
  excludeIds: Set<string>,
): Promise<RawQuestion[]> {
  if (limit <= 0) return [];

  // Determine the learner's current topic from user_courses
  const { data: enrollment } = await supabase
    .from('user_courses')
    .select('current_topic_id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .single();

  let currentTopicId = enrollment?.current_topic_id;

  // If no current topic, find the first topic in display order
  if (!currentTopicId) {
    const { data: firstModule } = await supabase
      .from('modules')
      .select('id')
      .eq('course_id', courseId)
      .order('display_order', { ascending: true })
      .limit(1)
      .single();

    if (firstModule) {
      const { data: firstTopic } = await supabase
        .from('topics')
        .select('id')
        .eq('module_id', firstModule.id)
        .order('display_order', { ascending: true })
        .limit(1)
        .single();

      currentTopicId = firstTopic?.id;
    }
  }

  if (!currentTopicId) return [];

  // Get all question IDs user has seen (any state)
  const { data: seenCards } = await supabase
    .from('user_card_states')
    .select('question_id')
    .eq('user_id', userId)
    .eq('course_id', courseId);

  const seenIds = new Set((seenCards ?? []).map((c) => c.question_id));
  const allExclude = new Set([...excludeIds, ...seenIds]);

  let query = supabase
    .from('questions')
    .select('*')
    .eq('topic_id', currentTopicId)
    .eq('course_id', courseId)
    .eq('is_active', true);

  query = applyExcludeFilter(query, allExclude);

  const { data: questions } = await query
    .order('difficulty', { ascending: true })
    .limit(limit);

  return (questions ?? []) as RawQuestion[];
}

/**
 * Backfill: Fetch any unseen active cards from the course to fill remaining
 * session slots.
 */
async function fetchAnyUnseen(
  supabase: SupabaseClient,
  courseId: string,
  limit: number,
  excludeIds: Set<string>,
): Promise<RawQuestion[]> {
  if (limit <= 0) return [];

  let query = supabase
    .from('questions')
    .select('*')
    .eq('course_id', courseId)
    .eq('is_active', true);

  query = applyExcludeFilter(query, excludeIds);

  const { data: questions } = await query
    .order('difficulty', { ascending: true })
    .limit(limit);

  return (questions ?? []) as RawQuestion[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function shuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function stripAnswers(q: RawQuestion): SessionQuestion {
  return {
    id: q.id,
    topic_id: q.topic_id,
    module_id: q.module_id,
    course_id: q.course_id,
    question_text: q.question_text,
    question_type: q.question_type,
    options: q.options.map((o) => ({ id: o.id, text: o.text })),
    correct_option_ids: q.correct_option_ids,
    explanation: q.explanation,
    difficulty: q.difficulty,
    tags: q.tags,
  };
}
