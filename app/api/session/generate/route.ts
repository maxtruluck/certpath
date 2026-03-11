import { getApiUser } from '@/lib/supabase/get-user-api';
import { NextRequest, NextResponse } from 'next/server';
import { generateSession } from '@/lib/engine/session-generator';

export async function GET(request: NextRequest) {
  const { supabase, userId, error } = await getApiUser();
  if (error) return error;

  const url = new URL(request.url);
  const certificationId = url.searchParams.get('certification_id');
  const questionCount = parseInt(url.searchParams.get('question_count') ?? '12');

  if (!certificationId) {
    return NextResponse.json({ error: 'certification_id required' }, { status: 400 });
  }

  try {
    const questions = await generateSession(supabase, userId, certificationId, questionCount);
    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Session generation error:', error);
    return NextResponse.json({ error: 'Failed to generate session' }, { status: 500 });
  }
}
