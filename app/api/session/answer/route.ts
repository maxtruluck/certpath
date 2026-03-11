import { getApiUser } from '@/lib/supabase/get-user-api';
import { NextRequest, NextResponse } from 'next/server';
import { calculateSM2 } from '@/lib/engine/sm2';
import { updateDomainScore } from '@/lib/engine/readiness';
import { XP } from '@/lib/utils/constants';

export async function POST(request: NextRequest) {
  const { supabase, userId, error } = await getApiUser();
  if (error) return error;

  const { question_id, selected_option_ids, time_spent_ms } = await request.json();

  // Get question details
  const { data: question, error: qError } = await supabase
    .from('questions')
    .select('*')
    .eq('id', question_id)
    .single();

  if (qError || !question) {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 });
  }

  // Check correctness
  const correctIds = new Set(question.correct_option_ids);
  const selectedIds = new Set(selected_option_ids);
  const isCorrect =
    correctIds.size === selectedIds.size &&
    [...correctIds].every((id) => selectedIds.has(id));

  // Get previous SM-2 state
  const { data: prevHistory } = await supabase
    .from('user_question_history')
    .select('ease_factor, interval_days, repetition_number')
    .eq('user_id', userId)
    .eq('question_id', question_id)
    .order('answered_at', { ascending: false })
    .limit(1)
    .single();

  const sm2Result = calculateSM2(
    isCorrect,
    prevHistory
      ? {
          easeFactor: prevHistory.ease_factor,
          intervalDays: prevHistory.interval_days,
          repetitionNumber: prevHistory.repetition_number,
        }
      : null
  );

  // Insert history
  await supabase.from('user_question_history').insert({
    user_id: userId,
    question_id,
    certification_id: question.certification_id,
    domain_id: question.domain_id,
    is_correct: isCorrect,
    selected_option_ids,
    time_spent_ms,
    ease_factor: sm2Result.easeFactor,
    interval_days: sm2Result.intervalDays,
    repetition_number: sm2Result.repetitionNumber,
    next_review_date: sm2Result.nextReviewDate.toISOString().split('T')[0],
  });

  // Award XP
  const xpEarned = isCorrect ? XP.CORRECT_ANSWER : XP.INCORRECT_ANSWER;
  await supabase.from('user_xp_log').insert({
    user_id: userId,
    xp_amount: xpEarned,
    source: isCorrect ? 'correct_answer' : 'wrong_answer',
    reference_id: question_id,
  });

  // Update user certification stats
  const { data: cert } = await supabase
    .from('user_certifications')
    .select('questions_attempted, questions_correct, total_xp')
    .eq('user_id', userId)
    .eq('certification_id', question.certification_id)
    .single();

  if (cert) {
    await supabase
      .from('user_certifications')
      .update({
        questions_attempted: cert.questions_attempted + 1,
        questions_correct: cert.questions_correct + (isCorrect ? 1 : 0),
        total_xp: cert.total_xp + xpEarned,
      })
      .eq('user_id', userId)
      .eq('certification_id', question.certification_id);
  } else {
    // Auto-enroll if user somehow practices without enrollment
    await supabase.from('user_certifications').insert({
      user_id: userId,
      certification_id: question.certification_id,
      status: 'active',
      sprint_type: 'sprint_60',
      sprint_start_date: new Date().toISOString().split('T')[0],
      sprint_current_day: 1,
      questions_attempted: 1,
      questions_correct: isCorrect ? 1 : 0,
      total_xp: xpEarned,
    });
  }

  // Update domain score
  await updateDomainScore(supabase, userId, question.domain_id, question.certification_id, isCorrect);

  return NextResponse.json({
    is_correct: isCorrect,
    correct_option_ids: question.correct_option_ids,
    explanation: question.explanation,
    xp_earned: xpEarned,
    next_review_date: sm2Result.nextReviewDate.toISOString().split('T')[0],
    next_review_days: sm2Result.intervalDays,
  });
}
