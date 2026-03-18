import { NextRequest, NextResponse } from 'next/server'
import { getApiUser } from '@/lib/supabase/get-user-api'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, userId, error } = await getApiUser()
    if (error) return error

    const { id: sessionId } = await params

    // Fetch review logs for this session where user got it wrong
    const { data: reviews, error: reviewError } = await supabase
      .from('review_log')
      .select('id, question_id, topic_id, module_id, is_correct, selected_option_ids, time_spent_ms, rating, reviewed_at')
      .eq('user_id', userId)
      .eq('session_id', sessionId)
      .eq('is_correct', false)
      .order('reviewed_at', { ascending: true })

    if (reviewError) {
      console.error('Review query error:', reviewError)
      return NextResponse.json({ error: 'Failed to fetch review data' }, { status: 500 })
    }

    if (!reviews || reviews.length === 0) {
      return NextResponse.json({ session_id: sessionId, mistakes: [] })
    }

    // Fetch question details for mistakes
    const questionIds = reviews.map((r: any) => r.question_id)
    const { data: questions } = await supabase
      .from('questions')
      .select('id, topic_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, tags')
      .in('id', questionIds)

    const questionMap = new Map((questions || []).map((q: any) => [q.id, q]))

    // Get module names
    const moduleIds = [...new Set(reviews.map((r: any) => r.module_id).filter(Boolean))]
    let moduleNames: Record<string, string> = {}
    if (moduleIds.length > 0) {
      const { data: modules } = await supabase
        .from('modules')
        .select('id, title')
        .in('id', moduleIds)
      for (const m of modules || []) {
        moduleNames[m.id] = m.title
      }
    }

    const mistakes = reviews.map((r: any) => {
      const question = questionMap.get(r.question_id)
      return {
        review_id: r.id,
        question_id: r.question_id,
        module_id: r.module_id,
        module_title: r.module_id ? (moduleNames[r.module_id] || 'Unknown') : 'Unknown',
        question_text: question?.question_text || '',
        question_type: question?.question_type || '',
        options: question?.options || [],
        correct_option_ids: question?.correct_option_ids || [],
        selected_option_ids: r.selected_option_ids,
        explanation: question?.explanation || '',
        difficulty: question?.difficulty || null,
        time_spent_ms: r.time_spent_ms,
      }
    })

    return NextResponse.json({
      session_id: sessionId,
      mistakes,
    })
  } catch (err) {
    console.error('GET /api/session/[id]/review error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
