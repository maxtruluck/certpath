/**
 * Readiness Score Calculation
 *
 * Computes a learner's exam readiness as a weighted average of per-topic
 * retrievability scores, weighted by each module's weight_percent.
 *
 * Topic score = average retrievability of all cards the user has in that topic.
 * Module score = average of its topic scores.
 * Readiness = SUM(module_score * module.weight_percent / 100).
 *
 * Recalculated after every session and stored on user_courses.readiness_score.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { retrievability } from './fsrs';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Calculate the readiness score (0-1) for a user's enrollment in a course.
 */
export async function calculateReadinessScore(
  supabase: SupabaseClient,
  userId: string,
  courseId: string,
): Promise<number> {
  // Fetch modules with their weights
  const { data: modules } = await supabase
    .from('modules')
    .select('id, weight_percent')
    .eq('course_id', courseId);

  if (!modules || modules.length === 0) return 0;

  // Fetch all topics for this course
  const { data: topics } = await supabase
    .from('topics')
    .select('id, module_id')
    .eq('course_id', courseId);

  if (!topics || topics.length === 0) return 0;

  // Build module -> topics mapping
  const moduleTopics = new Map<string, string[]>();
  for (const topic of topics) {
    const list = moduleTopics.get(topic.module_id) ?? [];
    list.push(topic.id);
    moduleTopics.set(topic.module_id, list);
  }

  // Fetch all user card states for this course
  const { data: cardStates } = await supabase
    .from('user_card_states')
    .select('topic_id, stability, due_date, last_review_date')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .neq('state', 'new');

  if (!cardStates || cardStates.length === 0) return 0;

  const now = new Date();

  // Group cards by topic and compute average retrievability
  const topicCards = new Map<string, number[]>();
  for (const card of cardStates) {
    const elapsedDays = card.last_review_date
      ? Math.max(0, daysBetween(new Date(card.last_review_date), now))
      : 0;
    const R = retrievability(elapsedDays, card.stability);

    const list = topicCards.get(card.topic_id) ?? [];
    list.push(R);
    topicCards.set(card.topic_id, list);
  }

  // Compute topic scores (average retrievability)
  const topicScores = new Map<string, number>();
  for (const [topicId, rValues] of Array.from(topicCards.entries())) {
    const avg = rValues.reduce((sum, r) => sum + r, 0) / rValues.length;
    topicScores.set(topicId, avg);
  }

  // Compute weighted readiness across modules
  let readiness = 0;
  let totalWeight = 0;

  for (const mod of modules) {
    const weight = mod.weight_percent ?? 0;
    if (weight === 0) continue;

    const modTopicIds = moduleTopics.get(mod.id) ?? [];
    if (modTopicIds.length === 0) continue;

    // Module score = average of its topic scores (only scored topics count)
    const scoredTopics = modTopicIds
      .map((tid) => topicScores.get(tid))
      .filter((s): s is number => s !== undefined);

    if (scoredTopics.length === 0) continue;

    const moduleScore = scoredTopics.reduce((sum, s) => sum + s, 0) / scoredTopics.length;

    readiness += moduleScore * (weight / 100);
    totalWeight += weight;
  }

  // Normalize if not all modules have been started
  // (penalizes unstarted modules by counting them as 0)
  const totalWeightAll = modules.reduce((sum, m) => sum + (m.weight_percent ?? 0), 0);
  if (totalWeightAll > 0 && totalWeight < totalWeightAll) {
    // readiness already only accounts for started modules;
    // unstarted modules contribute 0, so no adjustment needed
    // since we multiply by weight/100 above.
  }

  return Math.min(1, Math.max(0, readiness));
}

/**
 * Recalculate and persist the readiness score for a user's course enrollment.
 * Call this after every completed session.
 */
export async function updateReadinessScore(
  supabase: SupabaseClient,
  userId: string,
  courseId: string,
): Promise<number> {
  const score = await calculateReadinessScore(supabase, userId, courseId);

  await supabase
    .from('user_courses')
    .update({ readiness_score: score })
    .eq('user_id', userId)
    .eq('course_id', courseId);

  return score;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysBetween(a: Date, b: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((b.getTime() - a.getTime()) / msPerDay);
}
