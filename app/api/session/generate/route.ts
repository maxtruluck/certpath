import { NextRequest, NextResponse } from 'next/server'
import { getApiUser } from '@/lib/supabase/get-user-api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SessionType = 'learn' | 'review' | 'mixed'
type DifficultyLabel = 'easy' | 'medium' | 'challenging'

interface ConceptCardEntry {
  card_type: 'concept'
  concept: {
    id: string
    title: string
    content: string
    lesson_id: string
    lesson_title: string
    topic_id: string
    topic_title: string
  }
}

interface QuestionCardEntry {
  card_type: 'question'
  question: Record<string, unknown> & {
    is_review: boolean
    difficulty_label: DifficultyLabel
    topic_title: string
    lesson_id: string | null
  }
}

type CardEntry = ConceptCardEntry | QuestionCardEntry

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Compute difficulty label. If pass_rate data is available (>= 10 attempts),
 * use it. Otherwise fall back to creator-set difficulty.
 */
function difficultyLabel(
  d: number,
  attemptCount?: number | null,
  passRate?: number | null,
): DifficultyLabel {
  if (attemptCount != null && attemptCount >= 10 && passRate != null) {
    if (passRate >= 0.9) return 'easy'
    if (passRate >= 0.5) return 'medium'
    return 'challenging'
  }
  if (d <= 2) return 'easy'
  if (d === 3) return 'medium'
  return 'challenging'
}

function fisherYatesShuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
}

/** Strip answer data from a question for client delivery */
function stripAnswers(q: any): any {
  const safe: any = { ...q }
  delete safe.acceptable_answers
  delete safe.correct_order
  if (q.question_type === 'matching' && q.matching_pairs) {
    const lefts = q.matching_pairs.map((p: any) => p.left)
    const rights = q.matching_pairs.map((p: any) => p.right)
    fisherYatesShuffle(rights)
    safe.matching_items = { lefts, rights }
    delete safe.matching_pairs
  }
  return safe
}

/**
 * Auto-extract concept cards from lesson body when concept_cards JSONB is
 * empty. Splits by ## headings, takes first 2-3 sections.
 */
function extractConceptCardsFromBody(
  lessonId: string,
  lessonTitle: string,
  topicId: string,
  topicTitle: string,
  body: string,
  maxCards: number = 3,
): ConceptCardEntry[] {
  if (!body || body.trim().length === 0) return []

  const sections = body.split(/^##\s+/m).filter(Boolean)
  const cards: ConceptCardEntry[] = []

  for (let i = 0; i < Math.min(sections.length, maxCards); i++) {
    const section = sections[i].trim()
    const lines = section.split('\n')
    const title = lines[0]?.trim() || `Concept ${i + 1}`
    const contentLines = lines.slice(1).join('\n').trim()
    // Take first 2 sentences
    const sentences = contentLines.split(/(?<=[.!?])\s+/)
    const content = sentences.slice(0, 2).join(' ').trim()
    if (!content) continue

    cards.push({
      card_type: 'concept',
      concept: {
        id: `${lessonId}-concept-${i}`,
        title,
        content,
        lesson_id: lessonId,
        lesson_title: lessonTitle,
        topic_id: topicId,
        topic_title: topicTitle,
      },
    })
  }

  return cards
}

/**
 * Build concept card entries from a lesson's concept_cards JSONB, or
 * auto-extract from body if empty.
 */
function buildConceptCards(
  lesson: any,
  topicId: string,
  topicTitle: string,
  maxCards: number = 5,
): ConceptCardEntry[] {
  const stored: any[] = lesson.concept_cards || []

  if (stored.length > 0) {
    return stored.slice(0, maxCards).map((c: any, i: number) => ({
      card_type: 'concept' as const,
      concept: {
        id: c.id || `${lesson.id}-concept-${i}`,
        title: c.title || `Concept ${i + 1}`,
        content: c.content || '',
        lesson_id: lesson.id,
        lesson_title: lesson.title,
        topic_id: topicId,
        topic_title: topicTitle,
      },
    }))
  }

  return extractConceptCardsFromBody(
    lesson.id,
    lesson.title,
    topicId,
    topicTitle,
    lesson.body || '',
    maxCards,
  )
}

/** Wrap a stripped question into a CardEntry */
function questionCard(
  q: any,
  isReview: boolean,
  topicTitle: string,
): QuestionCardEntry {
  return {
    card_type: 'question',
    question: {
      ...q,
      is_review: isReview,
      difficulty_label: difficultyLabel(q.difficulty ?? 3, q.attempt_count, q.pass_rate),
      topic_title: topicTitle,
      lesson_id: q.lesson_id ?? null,
    },
  }
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

const QUESTION_FIELDS =
  'id, topic_id, module_id, course_id, lesson_id, question_text, question_type, options, difficulty, tags, acceptable_answers, match_mode, correct_order, matching_pairs, attempt_count, pass_rate'

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

    const topicIdParam = request.nextUrl.searchParams.get('topic_id')
    const sessionTypeParam = (request.nextUrl.searchParams.get('session_type') || 'mixed') as SessionType
    const questionCountParam = request.nextUrl.searchParams.get('question_count')

    // Validate session_type
    if (!['learn', 'review', 'mixed'].includes(sessionTypeParam)) {
      return NextResponse.json({ error: 'session_type must be learn, review, or mixed' }, { status: 400 })
    }

    // Learn requires topic_id
    if (sessionTypeParam === 'learn' && !topicIdParam) {
      return NextResponse.json({ error: 'topic_id is required for learn sessions' }, { status: 400 })
    }

    const now = new Date().toISOString()

    // ── Shared data fetches ──────────────────────────────────────
    const [
      { data: allCardStates },
      { data: allQuestions },
    ] = await Promise.all([
      supabase
        .from('user_card_states')
        .select('question_id, topic_id, state, due_date')
        .eq('user_id', userId)
        .eq('course_id', courseId),
      supabase
        .from('questions')
        .select('id, topic_id, lesson_id, difficulty, attempt_count, pass_rate')
        .eq('course_id', courseId)
        .eq('is_active', true),
    ])

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

    const seenQuestionIds = new Set((allCardStates || []).map((cs: any) => cs.question_id))

    // Due reviews across entire course
    const allDueCards = (allCardStates || [])
      .filter((c: any) => c.state !== 'new' && c.due_date && c.due_date <= now)
      .sort((a: any, b: any) => (a.due_date > b.due_date ? 1 : -1))
    const allDueIds = allDueCards.map((c: any) => c.question_id)

    // Topic title cache — fetched on demand
    const topicTitleCache: Record<string, string> = {}
    async function getTopicTitle(topicId: string): Promise<string> {
      if (topicTitleCache[topicId]) return topicTitleCache[topicId]
      const { data } = await supabase
        .from('topics')
        .select('title')
        .eq('id', topicId)
        .single()
      topicTitleCache[topicId] = data?.title || ''
      return topicTitleCache[topicId]
    }

    // ── Build cards based on session type ────────────────────────
    let cards: CardEntry[] = []
    let selectedQuestionIds: string[] = []

    if (sessionTypeParam === 'learn') {
      // ============================================================
      // LEARN SESSION
      // ============================================================
      const targetTopicId = topicIdParam!
      const topicTitle = await getTopicTitle(targetTopicId)

      // Fetch lessons for this topic, ordered
      const { data: lessons } = await supabase
        .from('lessons')
        .select('id, title, body, concept_cards, display_order')
        .eq('topic_id', targetTopicId)
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      // Find the first lesson where user has NOT seen all its questions
      const topicQuestions = questionsByTopic[targetTopicId] || []
      const questionsByLesson: Record<string, any[]> = {}
      for (const q of topicQuestions) {
        const lid = q.lesson_id || '_unlinked'
        if (!questionsByLesson[lid]) questionsByLesson[lid] = []
        questionsByLesson[lid].push(q)
      }

      let targetLesson: any = null
      for (const lesson of lessons || []) {
        const lessonQs = questionsByLesson[lesson.id] || []
        const allSeen = lessonQs.length > 0 && lessonQs.every((q: any) => seenQuestionIds.has(q.id))
        if (!allSeen) {
          targetLesson = lesson
          break
        }
      }

      // Fallback: if all lessons complete, use first lesson anyway
      if (!targetLesson && lessons && lessons.length > 0) {
        targetLesson = lessons[0]
      }

      if (!targetLesson) {
        // No lessons at all — fall back to mixed behavior
        return buildMixedSession()
      }

      // Build concept cards from lesson
      const conceptCards = buildConceptCards(targetLesson, targetTopicId, topicTitle, 5)

      // Get new (unseen) questions from this lesson, split by effective difficulty.
      // When pass_rate data is available (>= 10 attempts), use it.
      // High pass_rate = easy (goes first), low pass_rate = hard (comes later).
      const lessonQIds = (questionsByLesson[targetLesson.id] || [])
      const unseenLessonQs = lessonQIds.filter((q: any) => !seenQuestionIds.has(q.id))

      function isEasy(q: any): boolean {
        if (q.attempt_count >= 10 && q.pass_rate != null) return q.pass_rate >= 0.7
        return (q.difficulty ?? 3) <= 2
      }
      function isHard(q: any): boolean {
        if (q.attempt_count >= 10 && q.pass_rate != null) return q.pass_rate < 0.5
        return (q.difficulty ?? 3) >= 3
      }

      // Sort easy questions by pass_rate descending (easiest first)
      const easyQs = unseenLessonQs.filter(isEasy)
        .sort((a: any, b: any) => (b.pass_rate ?? 1) - (a.pass_rate ?? 1))
      const hardQs = unseenLessonQs.filter(isHard)
        .sort((a: any, b: any) => (a.pass_rate ?? 0) - (b.pass_rate ?? 0))

      // If not enough easy, use medium; if not enough hard, use whatever's available
      if (easyQs.length === 0) {
        easyQs.push(...unseenLessonQs.filter((q: any) => !isHard(q)))
      }
      if (hardQs.length === 0) {
        hardQs.push(...unseenLessonQs)
      }

      // Review cards (FSRS due, any topic)
      const reviewIds = allDueIds.filter((id: string) => !unseenLessonQs.some((q: any) => q.id === id))

      // Scaffolding: interleave concept cards with questions
      // Pattern: concept -> easy x1-2 -> review x1 -> hard x1 -> concept -> repeat -> reviews at end
      const usedNewIds = new Set<string>()
      const usedReviewIds = new Set<string>()
      let conceptIdx = 0
      let easyIdx = 0
      let hardIdx = 0
      let reviewIdx = 0

      const MAX_ITEMS = 15
      const MAX_CONCEPTS = 5
      const MAX_NEW = 8
      const MAX_REVIEW = 4

      let newCount = 0
      let reviewCount = 0
      let conceptCount = 0

      function addConcept(): boolean {
        if (conceptIdx >= conceptCards.length || conceptCount >= MAX_CONCEPTS) return false
        cards.push(conceptCards[conceptIdx++])
        conceptCount++
        return true
      }

      function addEasyQuestion(): boolean {
        if (easyIdx >= easyQs.length || newCount >= MAX_NEW) return false
        const q = easyQs[easyIdx++]
        if (usedNewIds.has(q.id)) return addEasyQuestion()
        usedNewIds.add(q.id)
        selectedQuestionIds.push(q.id)
        newCount++
        return true
      }

      function addHardQuestion(): boolean {
        if (hardIdx >= hardQs.length || newCount >= MAX_NEW) return false
        const q = hardQs[hardIdx++]
        if (usedNewIds.has(q.id)) return addHardQuestion()
        usedNewIds.add(q.id)
        selectedQuestionIds.push(q.id)
        newCount++
        return true
      }

      function addReview(): boolean {
        if (reviewIdx >= reviewIds.length || reviewCount >= MAX_REVIEW) return false
        const id = reviewIds[reviewIdx++]
        usedReviewIds.add(id)
        selectedQuestionIds.push(id)
        reviewCount++
        return true
      }

      // Build scaffolded sequence
      while (cards.length + selectedQuestionIds.length < MAX_ITEMS) {
        const before = cards.length + selectedQuestionIds.length

        // a. Concept card
        addConcept()
        // b. 1-2 easy questions
        addEasyQuestion()
        addEasyQuestion()
        // c. 1 review interleaved
        addReview()
        // d. 1 hard question
        addHardQuestion()

        // Break if nothing was added (all pools exhausted)
        if (cards.length + selectedQuestionIds.length === before) break
        if (cards.length + selectedQuestionIds.length >= MAX_ITEMS) break
      }

      // g. 1-2 more reviews at the end
      addReview()
      addReview()

    } else if (sessionTypeParam === 'review') {
      // ============================================================
      // REVIEW SESSION
      // ============================================================
      const SESSION_SIZE = Math.min(Math.max(parseInt(questionCountParam || '12', 10) || 12, 10), 15)

      let dueIds: string[]

      if (topicIdParam) {
        // Due cards for this topic only
        dueIds = allDueCards
          .filter((c: any) => c.topic_id === topicIdParam)
          .map((c: any) => c.question_id)
      } else {
        // Due cards across all topics
        dueIds = allDueIds
      }

      // Take due cards up to session size
      selectedQuestionIds = dueIds.slice(0, SESSION_SIZE)

      // Fill remaining with weak-topic cards (seen but low retrievability)
      if (selectedQuestionIds.length < SESSION_SIZE) {
        const remaining = SESSION_SIZE - selectedQuestionIds.length
        const usedSet = new Set(selectedQuestionIds)

        // Find weakest topics by review ratio
        const topicWeakness: { topicId: string; readiness: number }[] = []
        for (const [topicId, topicCards] of Object.entries(cardsByTopic)) {
          const totalQ = (questionsByTopic[topicId] || []).length
          if (totalQ === 0) continue
          const reviewCards = topicCards.filter((c: any) => c.state === 'review').length
          topicWeakness.push({ topicId, readiness: reviewCards / totalQ })
        }
        topicWeakness.sort((a, b) => a.readiness - b.readiness)

        // Pull seen-but-not-due cards from weakest topics
        for (const { topicId } of topicWeakness) {
          if (selectedQuestionIds.length >= SESSION_SIZE) break
          const topicCards = cardsByTopic[topicId] || []
          const seenNotDue = topicCards
            .filter((c: any) => !usedSet.has(c.question_id) && !dueIds.includes(c.question_id))
            .map((c: any) => c.question_id)
          for (const id of seenNotDue) {
            if (selectedQuestionIds.length >= SESSION_SIZE) break
            selectedQuestionIds.push(id)
            usedSet.add(id)
          }
        }
      }

      fisherYatesShuffle(selectedQuestionIds)

    } else {
      // ============================================================
      // MIXED SESSION (backward compatible with old behavior)
      // ============================================================
      return buildMixedSession()
    }

    // ── Fetch full question data for selected IDs ────────────────
    if (selectedQuestionIds.length > 0) {
      const { data: fullQuestions, error: qError } = await supabase
        .from('questions')
        .select(QUESTION_FIELDS)
        .in('id', selectedQuestionIds)

      if (qError) {
        console.error('Question fetch error:', qError)
        return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
      }

      const qMap = new Map((fullQuestions || []).map((q: any) => [q.id, q]))

      if (sessionTypeParam === 'learn') {
        // Interleave fetched questions into the cards array at correct positions
        // cards already has concept entries; now insert question entries
        const finalCards: CardEntry[] = []
        let qIdx = 0

        for (const card of cards) {
          finalCards.push(card)
        }

        // Rebuild cards array: walk through selectedQuestionIds in order,
        // interleaving with existing concept cards
        const rebuiltCards: CardEntry[] = []
        let conceptI = 0
        let questionI = 0
        const conceptPositions = cards.map((_, i) => i) // concept cards are already in cards[]

        // The cards array currently holds only concept cards.
        // selectedQuestionIds holds questions in scaffolded order.
        // Rebuild by walking the original scaffolding pattern.
        const allConcepts = cards.filter(c => c.card_type === 'concept') as ConceptCardEntry[]
        // Interleave: concept, easy, easy, review, hard, concept, ...
        // We'll reconstruct by inserting questions between concepts
        let qi = 0
        let ci = 0

        // Simple approach: concept cards are at indices in the original scaffolding.
        // For every concept card, insert it, then insert the next batch of questions
        // until the next concept or end.

        // Since we built cards and selectedQuestionIds in parallel scaffolded order,
        // we know the pattern: for each "round", there's 1 concept + ~4 questions.
        // Reconstruct by ratio.
        const roundSize = allConcepts.length > 0
          ? Math.ceil(selectedQuestionIds.length / Math.max(allConcepts.length, 1))
          : selectedQuestionIds.length

        for (let round = 0; round < Math.max(allConcepts.length, 1); round++) {
          // Add concept card if available
          if (ci < allConcepts.length) {
            rebuiltCards.push(allConcepts[ci++])
          }
          // Add questions for this round
          const batchEnd = Math.min(qi + roundSize, selectedQuestionIds.length)
          for (; qi < batchEnd; qi++) {
            const q = qMap.get(selectedQuestionIds[qi])
            if (!q) continue
            const stripped = stripAnswers(q)
            const isReview = allDueIds.includes(q.id)
            const topicTitle = await getTopicTitle(q.topic_id)
            rebuiltCards.push(questionCard(stripped, isReview, topicTitle))
          }
        }

        // Any remaining questions (e.g. trailing reviews)
        for (; qi < selectedQuestionIds.length; qi++) {
          const q = qMap.get(selectedQuestionIds[qi])
          if (!q) continue
          const stripped = stripAnswers(q)
          const isReview = allDueIds.includes(q.id)
          const topicTitle = await getTopicTitle(q.topic_id)
          rebuiltCards.push(questionCard(stripped, isReview, topicTitle))
        }

        cards = rebuiltCards

      } else {
        // Review session: all question cards, no concepts
        for (const id of selectedQuestionIds) {
          const q = qMap.get(id)
          if (!q) continue
          const stripped = stripAnswers(q)
          const topicTitle = await getTopicTitle(q.topic_id)
          cards.push(questionCard(stripped, true, topicTitle))
        }
      }
    }

    // If no cards at all, 404
    if (cards.length === 0) {
      return NextResponse.json({ error: 'No questions available for this course' }, { status: 404 })
    }

    // Build backward-compatible questions array (just question cards)
    const questionsOnly = cards
      .filter((c): c is QuestionCardEntry => c.card_type === 'question')
      .map(c => c.question)

    const sessionId = crypto.randomUUID()

    // ─── Legacy intro_topics (deprecated but kept) ────────────────
    const introTopicIds = [...new Set(questionsOnly.map((q: any) => q.topic_id))]
    let introTopics: any[] = []

    if (introTopicIds.length > 0) {
      try {
        const { data: seenIntros } = await supabase
          .from('user_topic_intros')
          .select('topic_id')
          .eq('user_id', userId)
          .in('topic_id', introTopicIds)

        const seenSet = new Set((seenIntros || []).map((s: any) => s.topic_id))
        const newTopicIds = introTopicIds.filter((id: string) => !seenSet.has(id))

        for (const topicId of newTopicIds) {
          const { data: lesson } = await supabase
            .from('lessons')
            .select('title, body')
            .eq('topic_id', topicId)
            .eq('is_active', true)
            .order('display_order')
            .limit(1)
            .maybeSingle()

          const topicTitle = await getTopicTitle(topicId)

          if (lesson && lesson.body) {
            introTopics.push({
              topic_id: topicId,
              title: topicTitle,
              lesson_title: lesson.title,
              body_preview: lesson.body.slice(0, 500),
            })
          }
        }
      } catch {
        // user_topic_intros table may not exist yet — silently skip
      }
    }

    const totalItems = cards.length
    const estimatedMinutes = Math.round(totalItems * 0.4 * 10) / 10

    return NextResponse.json({
      session_id: sessionId,
      course_id: courseId,
      session_type: sessionTypeParam,
      cards,
      questions: questionsOnly,
      intro_topics: introTopics,
      total_items: totalItems,
      estimated_minutes: estimatedMinutes,
    })

    // ── Mixed session builder (inline, reuses outer scope) ───────
    async function buildMixedSession() {
      const SESSION_SIZE = Math.min(Math.max(parseInt(questionCountParam || '10', 10) || 10, 5), 20)

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

      for (const [tid, tCards] of Object.entries(cardsByTopic)) {
        const totalQ = (questionsByTopic[tid] || []).length
        if (totalQ === 0) continue
        const reviewCards = tCards.filter((c: any) => c.state === 'review').length
        const readiness = reviewCards / totalQ
        if (readiness < lowestReadiness) {
          lowestReadiness = readiness
          weakestTopicId = tid
        }
      }

      let weakQuestionIds: string[] = []
      if (weakestTopicId) {
        const seenInWeak = (cardsByTopic[weakestTopicId] || []).map((c: any) => c.question_id || '')
        weakQuestionIds = (questionsByTopic[weakestTopicId] || [])
          .filter((q: any) => !seenInWeak.includes(q.id) && !dueQuestionIds.includes(q.id))
          .map((q: any) => q.id)
          .slice(0, SESSION_SIZE)
      }

      // Pool 3: New cards from current topic
      const currentTopicId = userCourse!.current_topic_id
      let newQuestionIds: string[] = []

      if (currentTopicId) {
        const seenInCurrent = (cardsByTopic[currentTopicId] || []).map((c: any) => c.question_id || '')
        const usedIds = [...dueQuestionIds, ...weakQuestionIds]
        newQuestionIds = (questionsByTopic[currentTopicId] || [])
          .filter((q: any) => !seenInCurrent.includes(q.id) && !usedIds.includes(q.id))
          .map((q: any) => q.id)
          .slice(0, SESSION_SIZE)
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
        const extra = (allQuestions || [])
          .filter((q: any) => !allSeenIds.includes(q.id) && !allSelectedIds.includes(q.id))
          .map((q: any) => q.id)
          .slice(0, SESSION_SIZE - allSelectedIds.length)
        newPool = [...newPool, ...extra]
      }

      let mixedSelectedIds = [...new Set([...duePool, ...weakPool, ...newPool])].slice(0, SESSION_SIZE)

      // ── Mixed-mode concept card injection ──────────────────────
      // If user has a topic in "learning" state, include 1-2 concept cards + 2-3 new questions
      let mixedConceptCards: ConceptCardEntry[] = []
      const MAX_MIXED_CONCEPTS = 2
      const MAX_MIXED_NEW = 3

      // Find a topic in "learning" state (some cards seen, not all)
      let learningTopicId: string | null = null
      for (const [tid, tCards] of Object.entries(cardsByTopic)) {
        const totalQ = (questionsByTopic[tid] || []).length
        if (totalQ === 0) continue
        const seenCount = tCards.length
        if (seenCount > 0 && seenCount < totalQ) {
          learningTopicId = tid
          break
        }
      }

      if (learningTopicId) {
        const ltTitle = await getTopicTitle(learningTopicId)

        // Find the next unseen lesson in this topic
        const { data: topicLessons } = await supabase
          .from('lessons')
          .select('id, title, body, concept_cards')
          .eq('topic_id', learningTopicId)
          .eq('is_active', true)
          .order('display_order', { ascending: true })

        const topicQs = questionsByTopic[learningTopicId] || []
        const qsByLesson: Record<string, any[]> = {}
        for (const q of topicQs) {
          const lid = q.lesson_id || '_unlinked'
          if (!qsByLesson[lid]) qsByLesson[lid] = []
          qsByLesson[lid].push(q)
        }

        let nextLesson: any = null
        for (const lesson of topicLessons || []) {
          const lqs = qsByLesson[lesson.id] || []
          const allSeen = lqs.length > 0 && lqs.every((q: any) => seenQuestionIds.has(q.id))
          if (!allSeen) {
            nextLesson = lesson
            break
          }
        }

        if (nextLesson) {
          mixedConceptCards = buildConceptCards(nextLesson, learningTopicId, ltTitle, MAX_MIXED_CONCEPTS)

          // Get new questions from this lesson (replace Pool 3 slots)
          const lessonNewQs = (qsByLesson[nextLesson.id] || [])
            .filter((q: any) => !seenQuestionIds.has(q.id))
            .slice(0, MAX_MIXED_NEW)
          const lessonNewIds = lessonNewQs.map((q: any) => q.id)

          // Replace end of newPool with these lesson questions
          const replaceCount = Math.min(lessonNewIds.length, newPool.length)
          if (replaceCount > 0) {
            newPool.splice(newPool.length - replaceCount, replaceCount, ...lessonNewIds)
          } else {
            newPool.push(...lessonNewIds)
          }

          mixedSelectedIds = [...new Set([...duePool, ...weakPool, ...newPool])].slice(0, SESSION_SIZE)
        }
      }

      // Shuffle question IDs
      fisherYatesShuffle(mixedSelectedIds)

      if (mixedSelectedIds.length === 0 && mixedConceptCards.length === 0) {
        return NextResponse.json({ error: 'No questions available for this course' }, { status: 404 })
      }

      // Fetch full question data
      const { data: fullQs, error: qErr } = mixedSelectedIds.length > 0
        ? await supabase.from('questions').select(QUESTION_FIELDS).in('id', mixedSelectedIds)
        : { data: [], error: null }

      if (qErr) {
        console.error('Question fetch error:', qErr)
        return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
      }

      const qMap = new Map((fullQs || []).map((q: any) => [q.id, q]))

      // Build cards array
      const mixedCards: CardEntry[] = []

      // Insert concept cards at the front (replacing first few items)
      for (const cc of mixedConceptCards) {
        mixedCards.push(cc)
      }

      // Add question cards
      const dueIdSet = new Set(dueQuestionIds)
      for (const id of mixedSelectedIds) {
        const q = qMap.get(id)
        if (!q) continue
        const stripped = stripAnswers(q)
        const isReview = dueIdSet.has(q.id)
        const tTitle = await getTopicTitle(q.topic_id)
        mixedCards.push(questionCard(stripped, isReview, tTitle))
      }

      const mixedQuestionsOnly = mixedCards
        .filter((c): c is QuestionCardEntry => c.card_type === 'question')
        .map(c => c.question)

      const mixedSessionId = crypto.randomUUID()

      // Legacy intro_topics
      const mixedTopicIds = [...new Set(mixedQuestionsOnly.map((q: any) => q.topic_id))]
      let mixedIntroTopics: any[] = []

      if (mixedTopicIds.length > 0) {
        try {
          const { data: seenIntros } = await supabase
            .from('user_topic_intros')
            .select('topic_id')
            .eq('user_id', userId)
            .in('topic_id', mixedTopicIds)

          const seenSet = new Set((seenIntros || []).map((s: any) => s.topic_id))
          const newTids = mixedTopicIds.filter((id: string) => !seenSet.has(id))

          for (const tid of newTids) {
            const { data: lesson } = await supabase
              .from('lessons')
              .select('title, body')
              .eq('topic_id', tid)
              .eq('is_active', true)
              .order('display_order')
              .limit(1)
              .maybeSingle()

            const tTitle = await getTopicTitle(tid)
            if (lesson && lesson.body) {
              mixedIntroTopics.push({
                topic_id: tid,
                title: tTitle,
                lesson_title: lesson.title,
                body_preview: lesson.body.slice(0, 500),
              })
            }
          }
        } catch {
          // user_topic_intros table may not exist — skip
        }
      }

      const mixedTotalItems = mixedCards.length
      return NextResponse.json({
        session_id: mixedSessionId,
        course_id: courseId,
        session_type: 'mixed' as SessionType,
        cards: mixedCards,
        questions: mixedQuestionsOnly,
        intro_topics: mixedIntroTopics,
        total_items: mixedTotalItems,
        estimated_minutes: Math.round(mixedTotalItems * 0.4 * 10) / 10,
      })
    }

  } catch (err) {
    console.error('GET /api/session/generate error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
