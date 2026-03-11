import { SupabaseClient } from '@supabase/supabase-js';

const RECENCY_HALF_LIFE_DAYS = 14;

export async function calculateReadinessScore(
  supabase: SupabaseClient,
  userId: string,
  certificationId: string
): Promise<number> {
  // Get domains with weights
  const { data: domains } = await supabase
    .from('domains')
    .select('id, weight_percent')
    .eq('certification_id', certificationId);

  if (!domains || domains.length === 0) return 0;

  // Get domain scores
  const { data: scores } = await supabase
    .from('user_domain_scores')
    .select('domain_id, score, questions_attempted, last_practiced_at')
    .eq('user_id', userId)
    .eq('certification_id', certificationId);

  const scoreMap = new Map(
    (scores ?? []).map((s) => [s.domain_id, s])
  );

  // Get total questions per domain
  const { data: questionCounts } = await supabase
    .from('questions')
    .select('domain_id')
    .eq('certification_id', certificationId)
    .eq('is_active', true);

  const domainQuestionCounts = new Map<string, number>();
  (questionCounts ?? []).forEach((q) => {
    domainQuestionCounts.set(q.domain_id, (domainQuestionCounts.get(q.domain_id) ?? 0) + 1);
  });

  let readiness = 0;

  for (const domain of domains) {
    const score = scoreMap.get(domain.id);
    if (!score || score.questions_attempted === 0) continue;

    const totalQuestions = domainQuestionCounts.get(domain.id) ?? 1;

    // Coverage factor: penalize low question coverage
    const coverageFactor = Math.min(1, score.questions_attempted / (totalQuestions * 0.5));

    // Recency factor: decay for domains not practiced recently
    let recencyFactor = 1;
    if (score.last_practiced_at) {
      const daysSince = Math.floor(
        (Date.now() - new Date(score.last_practiced_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      recencyFactor = Math.pow(0.5, daysSince / RECENCY_HALF_LIFE_DAYS);
    }

    const domainScore = score.score * coverageFactor * recencyFactor;
    readiness += domainScore * (domain.weight_percent / 100);
  }

  return Math.min(1, Math.max(0, readiness));
}

export async function updateDomainScore(
  supabase: SupabaseClient,
  userId: string,
  domainId: string,
  certificationId: string,
  isCorrect: boolean
): Promise<void> {
  // Get existing score
  const { data: existing } = await supabase
    .from('user_domain_scores')
    .select('*')
    .eq('user_id', userId)
    .eq('domain_id', domainId)
    .single();

  if (existing) {
    const attempted = existing.questions_attempted + 1;
    const correct = existing.questions_correct + (isCorrect ? 1 : 0);
    await supabase
      .from('user_domain_scores')
      .update({
        questions_attempted: attempted,
        questions_correct: correct,
        score: correct / attempted,
        last_practiced_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
  } else {
    await supabase.from('user_domain_scores').insert({
      user_id: userId,
      domain_id: domainId,
      certification_id: certificationId,
      questions_attempted: 1,
      questions_correct: isCorrect ? 1 : 0,
      score: isCorrect ? 1 : 0,
      last_practiced_at: new Date().toISOString(),
    });
  }
}
