import { getApiUser } from '@/lib/supabase/get-user-api';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { supabase, userId, error } = await getApiUser();
  if (error) return error;

  const { question_id } = await request.json();

  // Toggle bookmark
  const { data: existing } = await supabase
    .from('user_question_bookmarks')
    .select('id')
    .eq('user_id', userId)
    .eq('question_id', question_id)
    .single();

  if (existing) {
    await supabase
      .from('user_question_bookmarks')
      .delete()
      .eq('id', existing.id);
    return NextResponse.json({ bookmarked: false });
  } else {
    await supabase
      .from('user_question_bookmarks')
      .insert({ user_id: userId, question_id });
    return NextResponse.json({ bookmarked: true });
  }
}
