import { SESSION } from '@/lib/utils/constants';
import { SupabaseClient } from '@supabase/supabase-js';

interface Question {
  id: string;
  domain_id: string;
  certification_id: string;
  question_text: string;
  question_type: string;
  options: { id: string; text: string; is_correct: boolean }[];
  correct_option_ids: string[];
  explanation: string;
  difficulty: number;
  tags: string[];
}

export async function generateSession(
  supabase: SupabaseClient,
  userId: string,
  certificationId: string,
  questionCount: number = SESSION.DEFAULT_QUESTION_COUNT
): Promise<Question[]> {
  // Get user's total questions attempted
  const { count: totalAttempted } = await supabase
    .from('user_question_history')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('certification_id', certificationId);

  const isNewUser = (totalAttempted ?? 0) < SESSION.NEW_USER_THRESHOLD;

  // Calculate slot distribution
  let dueCount = Math.round(questionCount * SESSION.DUE_REVIEW_PCT);
  let weakCount = Math.round(questionCount * SESSION.WEAK_DOMAIN_PCT);
  let newCount = isNewUser
    ? Math.round(questionCount * SESSION.NEW_USER_NEW_PCT)
    : questionCount - dueCount - weakCount;

  if (isNewUser) {
    weakCount = Math.round(questionCount * SESSION.WEAK_DOMAIN_PCT);
    dueCount = questionCount - newCount - weakCount;
  }

  const questions: Question[] = [];
  const usedIds = new Set<string>();

  // 1. Due reviews
  const { data: dueQuestions } = await supabase
    .from('user_question_history')
    .select('question_id')
    .eq('user_id', userId)
    .eq('certification_id', certificationId)
    .lte('next_review_date', new Date().toISOString().split('T')[0])
    .order('next_review_date', { ascending: true })
    .limit(dueCount);

  if (dueQuestions && dueQuestions.length > 0) {
    const dueIds = dueQuestions.map((d) => d.question_id);
    const { data: dueQs } = await supabase
      .from('questions')
      .select('*')
      .in('id', dueIds)
      .eq('is_active', true);

    if (dueQs) {
      dueQs.forEach((q) => {
        if (!usedIds.has(q.id)) {
          questions.push(q);
          usedIds.add(q.id);
        }
      });
    }
  }

  // Fill remaining due slots with weak domain questions
  const remainingDue = dueCount - questions.length;
  weakCount += remainingDue;

  // 2. Weak domain questions — distribute across multiple weak domains
  const { data: domainScores } = await supabase
    .from('user_domain_scores')
    .select('domain_id, score')
    .eq('user_id', userId)
    .eq('certification_id', certificationId)
    .order('score', { ascending: true });

  const { data: domains } = await supabase
    .from('domains')
    .select('id')
    .eq('certification_id', certificationId);

  const scoredDomainIds = new Set((domainScores ?? []).map((d) => d.domain_id));
  const allDomainIds = (domains ?? []).map((d) => d.id);

  // Build weak domains list: unscored first, then lowest scored
  const weakDomains: string[] = [
    ...allDomainIds.filter((id) => !scoredDomainIds.has(id)),
    ...(domainScores ?? []).filter((d) => d.score < 0.7).map((d) => d.domain_id),
  ];

  const domainsToTarget = weakDomains.slice(0, 3);
  let weakAdded = 0;

  for (const domainId of domainsToTarget) {
    if (weakAdded >= weakCount) break;
    const perDomain = Math.ceil((weakCount - weakAdded) / (domainsToTarget.length - domainsToTarget.indexOf(domainId)));
    const answeredIds = usedIds.size > 0 ? Array.from(usedIds) : ['00000000-0000-0000-0000-000000000000'];

    const { data: weakQs } = await supabase
      .from('questions')
      .select('*')
      .eq('certification_id', certificationId)
      .eq('domain_id', domainId)
      .eq('is_active', true)
      .not('id', 'in', `(${answeredIds.join(',')})`)
      .order('difficulty', { ascending: true })
      .limit(perDomain);

    if (weakQs) {
      weakQs.forEach((q) => {
        if (!usedIds.has(q.id) && weakAdded < weakCount) {
          questions.push(q);
          usedIds.add(q.id);
          weakAdded++;
        }
      });
    }
  }

  // 3. New questions (unseen, proportional to domain weights)
  const remainingSlots = questionCount - questions.length;
  if (remainingSlots > 0) {
    // Get all question IDs user has seen
    const { data: seenHistory } = await supabase
      .from('user_question_history')
      .select('question_id')
      .eq('user_id', userId)
      .eq('certification_id', certificationId);

    const seenIds = new Set((seenHistory ?? []).map((h) => h.question_id));
    const allUsedIds = new Set([...usedIds, ...seenIds]);
    const excludeIds = allUsedIds.size > 0 ? Array.from(allUsedIds) : ['00000000-0000-0000-0000-000000000000'];

    const { data: newQs } = await supabase
      .from('questions')
      .select('*')
      .eq('certification_id', certificationId)
      .eq('is_active', true)
      .not('id', 'in', `(${excludeIds.join(',')})`)
      .limit(remainingSlots);

    if (newQs) {
      newQs.forEach((q) => {
        if (!usedIds.has(q.id)) {
          questions.push(q);
          usedIds.add(q.id);
        }
      });
    }
  }

  // Shuffle questions
  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [questions[i], questions[j]] = [questions[j], questions[i]];
  }

  // Strip is_correct from options before returning
  return questions.map((q) => ({
    ...q,
    options: q.options.map((o: { id: string; text: string }) => ({
      id: o.id,
      text: o.text,
    })),
  })) as Question[];
}
