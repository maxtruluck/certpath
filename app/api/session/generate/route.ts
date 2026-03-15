import { NextRequest, NextResponse } from 'next/server'
import { getApiUser } from '@/lib/supabase/get-user-api'

export async function GET(request: NextRequest) {
  try {
    const { supabase, userId, error } = await getApiUser()
    if (error) return error

    const courseId = request.nextUrl.searchParams.get('course_id')
    if (!courseId) {
      return NextResponse.json({ error: 'course_id is required' }, { status: 400 })
    }

    // Verify enrollment
    const { data: userCourse } = await supabase
      .from('user_courses')
      .select('id, current_topic_id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('status', 'active')
      .maybeSingle()

    if (!userCourse) {
      return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 })
    }

    const SESSION_SIZE = 10
    const DUE_POOL_TARGET = 6    // 60%
    const WEAK_POOL_TARGET = 3   // 25% (rounded up from 2.5)
    const NEW_POOL_TARGET = 1    // 15% (rounded down from 1.5)

    const now = new Date().toISOString()

    // Pool 1: Due reviews — cards where due_date <= now and state != 'new'
    const { data: dueCards } = await supabase
      .from('user_card_states')
      .select('question_id, topic_id, state, due_date')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .lte('due_date', now)
      .neq('state', 'new')
      .order('due_date', { ascending: true })
      .limit(SESSION_SIZE)

    const dueQuestionIds = (dueCards || []).map((c: any) => c.question_id)

    // Pool 2: Weak topic — find topic with lowest readiness that user has started
    // Get all card states grouped by topic
    const { data: allCardStates } = await supabase
      .from('user_card_states')
      .select('topic_id, state')
      .eq('user_id', userId)
      .eq('course_id', courseId)

    // Get question counts by topic
    const { data: allQuestions } = await supabase
      .from('questions')
      .select('id, topic_id')
      .eq('course_id', courseId)
      .eq('is_active', true)

    const questionsByTopic: Record<string, any[]> = {}
    for (const q of allQuestions || []) {
      if (!questionsByTopic[q.topic_id]) questionsByTopic[q.topic_id] = []
      questionsByTopic[q.topic_id].push(q)
    }

    // Calculate readiness per topic (started topics only)
    const cardsByTopic: Record<string, any[]> = {}
    for (const cs of allCardStates || []) {
      if (!cardsByTopic[cs.topic_id]) cardsByTopic[cs.topic_id] = []
      cardsByTopic[cs.topic_id].push(cs)
    }

    let weakestTopicId: string | null = null
    let lowestReadiness = Infinity

    for (const [topicId, cards] of Object.entries(cardsByTopic)) {
      const totalQ = (questionsByTopic[topicId] || []).length
      if (totalQ === 0) continue
      const reviewCards = cards.filter((c: any) => c.state === 'review').length
      const readiness = reviewCards / totalQ
      if (readiness < lowestReadiness) {
        lowestReadiness = readiness
        weakestTopicId = topicId
      }
    }

    // Get unseen questions from weak topic
    let weakQuestionIds: string[] = []
    if (weakestTopicId) {
      const seenInWeakTopic = (cardsByTopic[weakestTopicId] || []).map((c: any) => c.question_id || '')
      const unseenWeak = (questionsByTopic[weakestTopicId] || [])
        .filter((q: any) => !seenInWeakTopic.includes(q.id) && !dueQuestionIds.includes(q.id))
        .map((q: any) => q.id)
      weakQuestionIds = unseenWeak.slice(0, SESSION_SIZE)
    }

    // Pool 3: New cards from current topic
    const currentTopicId = userCourse.current_topic_id
    let newQuestionIds: string[] = []

    if (currentTopicId) {
      const seenInCurrent = (cardsByTopic[currentTopicId] || []).map((c: any) => c.question_id || '')
      const usedIds = [...dueQuestionIds, ...weakQuestionIds]
      const unseenNew = (questionsByTopic[currentTopicId] || [])
        .filter((q: any) => !seenInCurrent.includes(q.id) && !usedIds.includes(q.id))
        .map((q: any) => q.id)
      newQuestionIds = unseenNew.slice(0, SESSION_SIZE)
    }

    // Fill pools with redistribution
    let duePool = dueQuestionIds.slice(0, DUE_POOL_TARGET)
    let weakPool = weakQuestionIds.slice(0, WEAK_POOL_TARGET)
    let newPool = newQuestionIds.slice(0, NEW_POOL_TARGET)

    // Redistribute shortfall
    const totalSelected = duePool.length + weakPool.length + newPool.length
    const shortfall = SESSION_SIZE - totalSelected

    if (shortfall > 0) {
      // Try to fill from remaining due cards
      const remainingDue = dueQuestionIds.filter((id: string) => !duePool.includes(id))
      const remainingWeak = weakQuestionIds.filter((id: string) => !weakPool.includes(id))
      const remainingNew = newQuestionIds.filter((id: string) => !newPool.includes(id))
      const overflow = [...remainingDue, ...remainingWeak, ...remainingNew]

      const fill = overflow.slice(0, shortfall)
      // Add to whichever pool makes sense — just add to a combined list
      duePool = [...duePool, ...fill.filter((id: string) => remainingDue.includes(id))]
      weakPool = [...weakPool, ...fill.filter((id: string) => remainingWeak.includes(id))]
      newPool = [...newPool, ...fill.filter((id: string) => remainingNew.includes(id))]
    }

    // If still short, grab any unseen questions from the course
    const allSelectedIds = [...duePool, ...weakPool, ...newPool]
    if (allSelectedIds.length < SESSION_SIZE) {
      const allSeenIds = (allCardStates || []).map((cs: any) => cs.question_id)
      const allUnseen = (allQuestions || [])
        .filter((q: any) => !allSeenIds.includes(q.id) && !allSelectedIds.includes(q.id))
        .map((q: any) => q.id)
      const extra = allUnseen.slice(0, SESSION_SIZE - allSelectedIds.length)
      newPool = [...newPool, ...extra]
    }

    // Combine and shuffle
    const selectedIds = [...new Set([...duePool, ...weakPool, ...newPool])].slice(0, SESSION_SIZE)

    // Fisher-Yates shuffle
    for (let i = selectedIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [selectedIds[i], selectedIds[j]] = [selectedIds[j], selectedIds[i]]
    }

    if (selectedIds.length === 0) {
      return NextResponse.json({ error: 'No questions available for this course' }, { status: 404 })
    }

    // Fetch full question data (without correct_option_ids)
    const { data: questions, error: qError } = await supabase
      .from('questions')
      .select('id, topic_id, module_id, course_id, question_text, question_type, options, difficulty, tags')
      .in('id', selectedIds)

    if (qError) {
      console.error('Question fetch error:', qError)
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
    }

    // Maintain shuffle order
    const questionMap = new Map((questions || []).map((q: any) => [q.id, q]))
    const orderedQuestions = selectedIds
      .map((id: string) => questionMap.get(id))
      .filter(Boolean)

    // Generate session ID
    const sessionId = crypto.randomUUID()

    return NextResponse.json({
      session_id: sessionId,
      course_id: courseId,
      questions: orderedQuestions,
    })
  } catch (err) {
    console.error('GET /api/session/generate error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
