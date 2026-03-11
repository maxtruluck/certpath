import { getAuthUser } from '@/lib/supabase/get-user';
import { redirect, notFound } from 'next/navigation';
import { DomainLessonsClient } from './DomainLessonsClient';

export default async function DomainLessonsPage({ params }: { params: Promise<{ slug: string; domainSlug: string }> }) {
  const { slug, domainSlug } = await params;
  const { supabase, userId } = await getAuthUser();
  if (!userId) redirect('/login');

  // Get cert
  const { data: cert } = await supabase
    .from('certifications')
    .select('*')
    .eq('slug', slug)
    .single();
  if (!cert) notFound();

  // Get domain
  const { data: domain } = await supabase
    .from('domains')
    .select('*')
    .eq('certification_id', cert.id)
    .eq('slug', domainSlug)
    .single();
  if (!domain) notFound();

  // Get all questions for this domain
  const { data: questions } = await supabase
    .from('questions')
    .select('id, tags, difficulty')
    .eq('domain_id', domain.id)
    .eq('is_active', true)
    .order('difficulty');

  // Get user's question responses for this domain
  const { data: responses } = await supabase
    .from('user_question_history')
    .select('question_id, is_correct')
    .eq('user_id', userId)
    .in('question_id', (questions ?? []).map(q => q.id));

  // Get domain score
  const { data: domainScore } = await supabase
    .from('user_domain_scores')
    .select('*')
    .eq('user_id', userId)
    .eq('domain_id', domain.id)
    .single();

  // Group questions by primary tag to create "lessons"
  const tagGroups = new Map<string, { questions: typeof questions; attempted: number; correct: number }>();

  for (const q of questions ?? []) {
    // Use first tag as the lesson grouping key
    const primaryTag = (q.tags && q.tags.length > 0) ? q.tags[0] : 'general';
    if (!tagGroups.has(primaryTag)) {
      tagGroups.set(primaryTag, { questions: [], attempted: 0, correct: 0 });
    }
    const group = tagGroups.get(primaryTag)!;
    group.questions!.push(q);

    // Check if user has answered this question
    const resp = (responses ?? []).filter(r => r.question_id === q.id);
    if (resp.length > 0) {
      group.attempted++;
      if (resp.some(r => r.is_correct)) group.correct++;
    }
  }

  const lessons = Array.from(tagGroups.entries()).map(([tag, data], i) => ({
    id: tag,
    tag,
    label: formatTagLabel(tag),
    questionCount: data.questions!.length,
    attempted: data.attempted,
    correct: data.correct,
    difficulty: Math.round(data.questions!.reduce((sum, q) => sum + (q.difficulty ?? 1), 0) / data.questions!.length),
    order: i,
  }));

  return (
    <DomainLessonsClient
      cert={{ id: cert.id, slug: cert.slug, shortName: cert.short_name, iconEmoji: cert.icon_emoji }}
      domain={{
        id: domain.id,
        name: domain.name,
        slug: domain.slug,
        weightPercent: domain.weight_percent,
        description: domain.description,
      }}
      lessons={lessons}
      score={domainScore?.score ?? 0}
      questionsAttempted={domainScore?.questions_attempted ?? 0}
      questionsCorrect={domainScore?.questions_correct ?? 0}
    />
  );
}

function formatTagLabel(tag: string): string {
  return tag
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
