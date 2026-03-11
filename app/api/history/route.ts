import { getApiUser } from '@/lib/supabase/get-user-api';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { supabase, userId, error } = await getApiUser();
  if (error) return error;

  const url = new URL(request.url);
  const certificationId = url.searchParams.get('certification_id');

  if (!certificationId) {
    return NextResponse.json({ error: 'certification_id required' }, { status: 400 });
  }

  // Get recent sessions (group by date)
  const { data: sessions } = await supabase
    .from('user_xp_log')
    .select('xp_amount, earned_at')
    .eq('user_id', userId)
    .eq('source', 'session_complete')
    .order('earned_at', { ascending: false })
    .limit(20);

  // Get recently missed questions
  const { data: missedQuestions } = await supabase
    .from('user_question_history')
    .select('question_id, is_correct, answered_at, questions(question_text, domain_id, difficulty)')
    .eq('user_id', userId)
    .eq('certification_id', certificationId)
    .eq('is_correct', false)
    .order('answered_at', { ascending: false })
    .limit(20);

  // Get bookmarked questions
  const { data: bookmarked } = await supabase
    .from('user_question_bookmarks')
    .select('question_id, created_at, questions(question_text, domain_id, difficulty, explanation)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return NextResponse.json({
    sessions: sessions ?? [],
    missedQuestions: missedQuestions ?? [],
    bookmarked: bookmarked ?? [],
  });
}
