import { NextRequest, NextResponse } from 'next/server'
import { getApiUser } from '@/lib/supabase/get-user-api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DifficultyLabel = 'easy' | 'medium' | 'challenging'

interface LessonSectionEntry {
  card_type: 'lesson_section'
  section: {
    title: string
    content: string
    lesson_id: string
    lesson_title: string
  }
}

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
    difficulty_label: DifficultyLabel
    topic_title: string
    lesson_id: string | null
  }
}

type CardEntry = LessonSectionEntry | ConceptCardEntry | QuestionCardEntry

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function splitLessonIntoSections(body: string): { title: string; content: string }[] {
  if (!body || body.trim().length === 0) return []

  const parts = body.split(/^##\s+/m)
  const sections: { title: string; content: string }[] = []

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim()
    if (!part) continue

    if (i === 0 && !body.trimStart().startsWith('## ')) {
      // Content before first ## heading
      sections.push({ title: '', content: part })
    } else {
      const lines = part.split('\n')
      const title = lines[0]?.trim() || ''
      const content = lines.slice(1).join('\n').trim()
      sections.push({ title, content })
    }
  }

  return sections
}

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

  // Auto-extract from body
  if (!lesson.body || lesson.body.trim().length === 0) return []
  const bodyParts = lesson.body.split(/^##\s+/m).filter(Boolean)
  const cards: ConceptCardEntry[] = []

  for (let i = 0; i < Math.min(bodyParts.length, maxCards); i++) {
    const section = bodyParts[i].trim()
    const lines = section.split('\n')
    const title = lines[0]?.trim() || `Concept ${i + 1}`
    const contentLines = lines.slice(1).join('\n').trim()
    const sentences = contentLines.split(/(?<=[.!?])\s+/)
    const content = sentences.slice(0, 2).join(' ').trim()
    if (!content) continue

    cards.push({
      card_type: 'concept',
      concept: {
        id: `${lesson.id}-concept-${i}`,
        title,
        content,
        lesson_id: lesson.id,
        lesson_title: lesson.title,
        topic_id: topicId,
        topic_title: topicTitle,
      },
    })
  }

  return cards
}

function questionCard(q: any, topicTitle: string): QuestionCardEntry {
  return {
    card_type: 'question',
    question: {
      ...q,
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

    // ══════════════════════════════════════════════════════════════
    // TOPIC LESSON SESSION (primary flow)
    // ══════════════════════════════════════════════════════════════
    if (topicIdParam) {
      // Fetch topic title
      const { data: topic } = await supabase
        .from('topics')
        .select('title')
        .eq('id', topicIdParam)
        .single()
      const topicTitle = topic?.title || ''

      // Parallel: lessons, questions, progress
      const [
        { data: lessons },
        { data: topicQuestions },
        { data: existingProgress },
      ] = await Promise.all([
        supabase
          .from('lessons')
          .select('id, title, body, concept_cards, display_order')
          .eq('topic_id', topicIdParam)
          .eq('is_active', true)
          .order('display_order', { ascending: true }),
        supabase
          .from('questions')
          .select(QUESTION_FIELDS)
          .eq('topic_id', topicIdParam)
          .eq('course_id', courseId)
          .eq('is_active', true),
        supabase
          .from('user_topic_progress')
          .select('id, status, session_items_completed, session_items_total')
          .eq('user_id', userId)
          .eq('topic_id', topicIdParam)
          .maybeSingle(),
      ])

      // Group questions by lesson
      const questionsByLesson: Record<string, any[]> = {}
      const unlinkedQuestions: any[] = []
      for (const q of topicQuestions || []) {
        if (q.lesson_id) {
          if (!questionsByLesson[q.lesson_id]) questionsByLesson[q.lesson_id] = []
          questionsByLesson[q.lesson_id].push(q)
        } else {
          unlinkedQuestions.push(q)
        }
      }

      // Sort questions within each lesson by difficulty ASC
      for (const lid of Object.keys(questionsByLesson)) {
        questionsByLesson[lid].sort((a: any, b: any) => (a.difficulty ?? 3) - (b.difficulty ?? 3))
      }
      unlinkedQuestions.sort((a: any, b: any) => (a.difficulty ?? 3) - (b.difficulty ?? 3))

      // Build ordered card stack
      const cards: CardEntry[] = []

      for (const lesson of lessons || []) {
        const sections = splitLessonIntoSections(lesson.body || '')
        const lessonQs = questionsByLesson[lesson.id] || []
        const conceptCards = buildConceptCards(lesson, topicIdParam, topicTitle, 3)
        let qIdx = 0
        let cIdx = 0

        if (sections.length > 0) {
          // Distribute questions across sections
          const qPerSection = lessonQs.length > 0
            ? Math.max(1, Math.ceil(lessonQs.length / sections.length))
            : 0

          for (let si = 0; si < sections.length; si++) {
            const sec = sections[si]
            // Add lesson_section card
            cards.push({
              card_type: 'lesson_section',
              section: {
                title: sec.title,
                content: sec.content,
                lesson_id: lesson.id,
                lesson_title: lesson.title,
              },
            })

            // Add concept card if available for this section area
            if (cIdx < conceptCards.length) {
              cards.push(conceptCards[cIdx++])
            }

            // Add 1-2 questions for this section
            const batchSize = Math.min(qPerSection, 2)
            for (let qi = 0; qi < batchSize && qIdx < lessonQs.length; qi++) {
              const stripped = stripAnswers(lessonQs[qIdx++])
              cards.push(questionCard(stripped, topicTitle))
            }
          }

          // Remaining questions after all sections
          while (qIdx < lessonQs.length) {
            const stripped = stripAnswers(lessonQs[qIdx++])
            cards.push(questionCard(stripped, topicTitle))
          }
        } else {
          // No ## headings — concept cards first, then questions
          for (const cc of conceptCards) {
            cards.push(cc)
          }
          for (const q of lessonQs) {
            const stripped = stripAnswers(q)
            cards.push(questionCard(stripped, topicTitle))
          }
        }
      }

      // Add unlinked questions at the end
      for (const q of unlinkedQuestions) {
        const stripped = stripAnswers(q)
        cards.push(questionCard(stripped, topicTitle))
      }

      // If no cards at all, return error
      if (cards.length === 0) {
        return NextResponse.json({ error: 'No content available for this topic' }, { status: 404 })
      }

      // Handle user_topic_progress
      let itemsCompleted = 0
      const totalItems = cards.length

      if (!existingProgress) {
        // Create new progress row
        await supabase.from('user_topic_progress').insert({
          user_id: userId,
          topic_id: topicIdParam,
          course_id: courseId,
          status: 'in_progress',
          session_items_completed: 0,
          session_items_total: totalItems,
          started_at: new Date().toISOString(),
        })
      } else if (existingProgress.status === 'in_progress') {
        // Resume: skip already-completed items
        itemsCompleted = existingProgress.session_items_completed || 0
        // Update total in case content changed
        await supabase
          .from('user_topic_progress')
          .update({ session_items_total: totalItems })
          .eq('id', existingProgress.id)
      } else if (existingProgress.status === 'completed') {
        // Redo mode: serve full stack, reset progress to in_progress
        await supabase
          .from('user_topic_progress')
          .update({
            status: 'in_progress',
            session_items_completed: 0,
            session_items_total: totalItems,
            started_at: new Date().toISOString(),
            completed_at: null,
          })
          .eq('id', existingProgress.id)
      }

      // Slice cards for resume
      const resumedCards = itemsCompleted > 0 ? cards.slice(itemsCompleted) : cards

      const sessionId = crypto.randomUUID()
      const estimatedMinutes = Math.round(totalItems * 0.4 * 10) / 10

      return NextResponse.json({
        session_id: sessionId,
        course_id: courseId,
        topic_id: topicIdParam,
        topic_title: topicTitle,
        session_type: 'lesson',
        cards: resumedCards,
        total_items: totalItems,
        items_completed: itemsCompleted,
        estimated_minutes: estimatedMinutes,
      })
    }

    // ══════════════════════════════════════════════════════════════
    // QUICK PRACTICE (no topic_id — random questions across course)
    // ══════════════════════════════════════════════════════════════
    const questionCountParam = request.nextUrl.searchParams.get('question_count')
    const SESSION_SIZE = Math.min(Math.max(parseInt(questionCountParam || '10', 10) || 10, 5), 20)

    const { data: allQuestions } = await supabase
      .from('questions')
      .select(QUESTION_FIELDS)
      .eq('course_id', courseId)
      .eq('is_active', true)

    if (!allQuestions || allQuestions.length === 0) {
      return NextResponse.json({ error: 'No questions available for this course' }, { status: 404 })
    }

    // Shuffle and take SESSION_SIZE
    fisherYatesShuffle(allQuestions)
    const selectedQuestions = allQuestions.slice(0, SESSION_SIZE)

    // Build topic title cache
    const topicIds = [...new Set(selectedQuestions.map((q: any) => q.topic_id))]
    const topicTitleCache: Record<string, string> = {}
    if (topicIds.length > 0) {
      const { data: topicRows } = await supabase
        .from('topics')
        .select('id, title')
        .in('id', topicIds)
      for (const t of topicRows || []) {
        topicTitleCache[t.id] = t.title
      }
    }

    const cards: CardEntry[] = []
    const questionsOnly: any[] = []

    for (const q of selectedQuestions) {
      const stripped = stripAnswers(q)
      const tTitle = topicTitleCache[q.topic_id] || ''
      const card = questionCard(stripped, tTitle)
      cards.push(card)
      questionsOnly.push(card.question)
    }

    const sessionId = crypto.randomUUID()
    const totalItems = cards.length
    const estimatedMinutes = Math.round(totalItems * 0.4 * 10) / 10

    return NextResponse.json({
      session_id: sessionId,
      course_id: courseId,
      session_type: 'quick_practice',
      cards,
      questions: questionsOnly,
      total_items: totalItems,
      items_completed: 0,
      estimated_minutes: estimatedMinutes,
    })

  } catch (err) {
    console.error('GET /api/session/generate error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
