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

    const questionCountParam = request.nextUrl.searchParams.get('question_count')
    const topicIdParam = request.nextUrl.searchParams.get('topic_id')
    const SESSION_SIZE = Math.min(Math.max(parseInt(questionCountParam || '10', 10) || 10, 5), 20)

    const now = new Date().toISOString()

    // Get all card states grouped by topic
    const { data: allCardStates } = await supabase
      .from('user_card_states')
      .select('question_id, topic_id, state, due_date')
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

    const cardsByTopic: Record<string, any[]> = {}
    for (const cs of allCardStates || []) {
      if (!cardsByTopic[cs.topic_id]) cardsByTopic[cs.topic_id] = []
      cardsByTopic[cs.topic_id].push(cs)
    }

    let selectedIds: string[]

    if (topicIdParam) {
      // ── Focused Topic Practice Mode ──
      // 80% from target topic (due + unseen), 20% due reviews from other topics
      const FOCUS_TARGET = Math.round(SESSION_SIZE * 0.8)
      const OTHER_DUE_TARGET = SESSION_SIZE - FOCUS_TARGET

      // Focus topic: due reviews + unseen
      const focusCards = (cardsByTopic[topicIdParam] || [])
      const focusDueIds = focusCards
        .filter((c: any) => c.state !== 'new' && c.due_date && c.due_date <= now)
        .map((c: any) => c.question_id)
      const focusSeenIds = new Set(focusCards.map((c: any) => c.question_id))
      const focusUnseenIds = (questionsByTopic[topicIdParam] || [])
        .filter((q: any) => !focusSeenIds.has(q.id))
        .map((q: any) => q.id)
      const focusPool = [...focusDueIds, ...focusUnseenIds].slice(0, FOCUS_TARGET)

      // Other topics: due reviews only
      const otherDueIds = (allCardStates || [])
        .filter((c: any) => c.topic_id !== topicIdParam && c.state !== 'new' && c.due_date && c.due_date <= now)
        .map((c: any) => c.question_id)
        .filter((id: string) => !focusPool.includes(id))
      const otherPool = otherDueIds.slice(0, OTHER_DUE_TARGET)

      // Combine; if still short, fill with more from focus topic
      const combined = [...new Set([...focusPool, ...otherPool])]
      if (combined.length < SESSION_SIZE) {
        const remaining = (questionsByTopic[topicIdParam] || [])
          .filter((q: any) => !combined.includes(q.id))
          .map((q: any) => q.id)
        combined.push(...remaining.slice(0, SESSION_SIZE - combined.length))
      }
      selectedIds = [...new Set(combined)].slice(0, SESSION_SIZE)
    } else {
      // ── Standard 3-Pool Algorithm ──
      const DUE_POOL_TARGET = Math.round(SESSION_SIZE * 0.6)
      const WEAK_POOL_TARGET = Math.round(SESSION_SIZE * 0.25)
      const NEW_POOL_TARGET = SESSION_SIZE - DUE_POOL_TARGET - WEAK_POOL_TARGET

      // Pool 1: Due reviews
      const dueCards = (allCardStates || [])
        .filter((c: any) => c.state !== 'new' && c.due_date && c.due_date <= now)
        .sort((a: any, b: any) => (a.due_date > b.due_date ? 1 : -1))
      const dueQuestionIds = dueCards.map((c: any) => c.question_id)

      // Pool 2: Weak topic
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

      const totalSelected = duePool.length + weakPool.length + newPool.length
      const shortfall = SESSION_SIZE - totalSelected

      if (shortfall > 0) {
        const remainingDue = dueQuestionIds.filter((id: string) => !duePool.includes(id))
        const remainingWeak = weakQuestionIds.filter((id: string) => !weakPool.includes(id))
        const remainingNew = newQuestionIds.filter((id: string) => !newPool.includes(id))
        const overflow = [...remainingDue, ...remainingWeak, ...remainingNew]

        const fill = overflow.slice(0, shortfall)
        duePool = [...duePool, ...fill.filter((id: string) => remainingDue.includes(id))]
        weakPool = [...weakPool, ...fill.filter((id: string) => remainingWeak.includes(id))]
        newPool = [...newPool, ...fill.filter((id: string) => remainingNew.includes(id))]
      }

      const allSelectedIds = [...duePool, ...weakPool, ...newPool]
      if (allSelectedIds.length < SESSION_SIZE) {
        const allSeenIds = (allCardStates || []).map((cs: any) => cs.question_id)
        const allUnseen = (allQuestions || [])
          .filter((q: any) => !allSeenIds.includes(q.id) && !allSelectedIds.includes(q.id))
          .map((q: any) => q.id)
        const extra = allUnseen.slice(0, SESSION_SIZE - allSelectedIds.length)
        newPool = [...newPool, ...extra]
      }

      selectedIds = [...new Set([...duePool, ...weakPool, ...newPool])].slice(0, SESSION_SIZE)
    }

    // Fisher-Yates shuffle
    for (let i = selectedIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [selectedIds[i], selectedIds[j]] = [selectedIds[j], selectedIds[i]]
    }

    if (selectedIds.length === 0) {
      return NextResponse.json({ error: 'No questions available for this course' }, { status: 404 })
    }

    // Fetch full question data — include new type fields, exclude correct answers
    const { data: questions, error: qError } = await supabase
      .from('questions')
      .select('id, topic_id, module_id, course_id, question_text, question_type, options, difficulty, tags, acceptable_answers, match_mode, correct_order, matching_pairs')
      .in('id', selectedIds)

    if (qError) {
      console.error('Question fetch error:', qError)
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
    }

    // Strip answer data from questions sent to client
    const safeQuestions = (questions || []).map((q: any) => {
      const safe: any = { ...q }
      // Don't send correct answers to client
      delete safe.acceptable_answers
      delete safe.correct_order
      // For matching, shuffle the right-side items but keep pairs for display
      if (q.question_type === 'matching' && q.matching_pairs) {
        const lefts = q.matching_pairs.map((p: any) => p.left)
        const rights = q.matching_pairs.map((p: any) => p.right)
        // Fisher-Yates shuffle rights
        for (let i = rights.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [rights[i], rights[j]] = [rights[j], rights[i]]
        }
        safe.matching_items = { lefts, rights }
        delete safe.matching_pairs
      }
      return safe
    })

    // Maintain shuffle order
    const questionMap = new Map(safeQuestions.map((q: any) => [q.id, q]))
    const orderedQuestions = selectedIds
      .map((id: string) => questionMap.get(id))
      .filter(Boolean)

    // Generate session ID
    const sessionId = crypto.randomUUID()

    // ─── First-encounter topic intros ────────────────────────────
    const topicIds = [...new Set(orderedQuestions.map((q: any) => q.topic_id))]
    let introTopics: any[] = []

    if (topicIds.length > 0) {
      const { data: seenIntros } = await supabase
        .from('user_topic_intros')
        .select('topic_id')
        .eq('user_id', userId)
        .in('topic_id', topicIds)

      const seenSet = new Set((seenIntros || []).map((s: any) => s.topic_id))
      const newTopicIds = topicIds.filter((id: string) => !seenSet.has(id))

      for (const topicId of newTopicIds) {
        const { data: lesson } = await supabase
          .from('lessons')
          .select('title, body')
          .eq('topic_id', topicId)
          .eq('is_active', true)
          .order('display_order')
          .limit(1)
          .maybeSingle()

        const { data: topic } = await supabase
          .from('topics')
          .select('title')
          .eq('id', topicId)
          .single()

        if (lesson && lesson.body) {
          introTopics.push({
            topic_id: topicId,
            title: topic?.title || '',
            lesson_title: lesson.title,
            body_preview: lesson.body.slice(0, 500),
          })
        }
      }
    }

    return NextResponse.json({
      session_id: sessionId,
      course_id: courseId,
      questions: orderedQuestions,
      intro_topics: introTopics,
    })
  } catch (err) {
    console.error('GET /api/session/generate error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
