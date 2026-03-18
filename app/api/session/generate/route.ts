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
    video_url: string | null
    video_start_seconds: number | null
    video_end_seconds: number | null
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
    module_id: string
    module_title: string
  }
}

interface QuestionCardEntry {
  card_type: 'question'
  question: Record<string, unknown> & {
    difficulty_label: DifficultyLabel
    module_title: string
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
  moduleId: string,
  moduleTitle: string,
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
        module_id: moduleId,
        module_title: moduleTitle,
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
        module_id: moduleId,
        module_title: moduleTitle,
      },
    })
  }

  return cards
}

function questionCard(q: any, moduleTitle: string): QuestionCardEntry {
  return {
    card_type: 'question',
    question: {
      ...q,
      difficulty_label: difficultyLabel(q.difficulty ?? 3, q.attempt_count, q.pass_rate),
      module_title: moduleTitle,
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
      .select('id, current_topic_id, current_lesson_id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('status', 'active')
      .maybeSingle()

    if (!userCourse) {
      return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 })
    }

    const lessonIdParam = request.nextUrl.searchParams.get('lesson_id')

    // ══════════════════════════════════════════════════════════════
    // LESSON SESSION (primary flow)
    // ══════════════════════════════════════════════════════════════
    if (lessonIdParam) {
      // Fetch the lesson directly
      const { data: lesson } = await supabase
        .from('lessons')
        .select('id, title, body, concept_cards, display_order, video_url, video_start_seconds, video_end_seconds, module_id')
        .eq('id', lessonIdParam)
        .eq('is_active', true)
        .single()

      if (!lesson) {
        return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
      }

      // Fetch the lesson's module for title
      const { data: mod } = await supabase
        .from('modules')
        .select('id, title')
        .eq('id', lesson.module_id)
        .single()
      const moduleTitle = mod?.title || ''
      const moduleId = mod?.id || lesson.module_id

      // Parallel: questions + progress
      const [
        { data: lessonQuestions },
        { data: existingProgress },
      ] = await Promise.all([
        supabase
          .from('questions')
          .select(QUESTION_FIELDS)
          .eq('lesson_id', lessonIdParam)
          .eq('course_id', courseId)
          .eq('is_active', true),
        supabase
          .from('user_lesson_progress')
          .select('id, status, session_items_completed, session_items_total')
          .eq('user_id', userId)
          .eq('lesson_id', lessonIdParam)
          .maybeSingle(),
      ])

      // Sort questions by difficulty ASC
      const sortedQuestions = (lessonQuestions || []).sort(
        (a: any, b: any) => (a.difficulty ?? 3) - (b.difficulty ?? 3),
      )

      // Build ordered card stack
      const cards: CardEntry[] = []
      const sections = splitLessonIntoSections(lesson.body || '')
      const conceptCards = buildConceptCards(lesson, moduleId, moduleTitle, 3)
      let qIdx = 0
      let cIdx = 0

      if (sections.length > 0) {
        // Distribute questions across sections
        const qPerSection = sortedQuestions.length > 0
          ? Math.max(1, Math.ceil(sortedQuestions.length / sections.length))
          : 0

        for (let si = 0; si < sections.length; si++) {
          const sec = sections[si]
          // Add lesson_section card (first section carries the lesson video)
          cards.push({
            card_type: 'lesson_section',
            section: {
              title: sec.title,
              content: sec.content,
              lesson_id: lesson.id,
              lesson_title: lesson.title,
              video_url: si === 0 ? (lesson.video_url || null) : null,
              video_start_seconds: si === 0 ? (lesson.video_start_seconds ?? null) : null,
              video_end_seconds: si === 0 ? (lesson.video_end_seconds ?? null) : null,
            },
          })

          // Add concept card if available for this section area
          if (cIdx < conceptCards.length) {
            cards.push(conceptCards[cIdx++])
          }

          // Add 1-2 questions for this section
          const batchSize = Math.min(qPerSection, 2)
          for (let qi = 0; qi < batchSize && qIdx < sortedQuestions.length; qi++) {
            const stripped = stripAnswers(sortedQuestions[qIdx++])
            cards.push(questionCard(stripped, moduleTitle))
          }
        }

        // Remaining questions after all sections
        while (qIdx < sortedQuestions.length) {
          const stripped = stripAnswers(sortedQuestions[qIdx++])
          cards.push(questionCard(stripped, moduleTitle))
        }
      } else {
        // No ## headings -- concept cards first, then questions
        for (const cc of conceptCards) {
          cards.push(cc)
        }
        for (const q of sortedQuestions) {
          const stripped = stripAnswers(q)
          cards.push(questionCard(stripped, moduleTitle))
        }
      }

      // If no cards at all, return error
      if (cards.length === 0) {
        return NextResponse.json({ error: 'No content available for this lesson' }, { status: 404 })
      }

      // Handle user_lesson_progress
      let itemsCompleted = 0
      const totalItems = cards.length

      if (!existingProgress) {
        // Create new progress row
        await supabase.from('user_lesson_progress').insert({
          user_id: userId,
          lesson_id: lessonIdParam,
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
          .from('user_lesson_progress')
          .update({ session_items_total: totalItems })
          .eq('id', existingProgress.id)
      } else if (existingProgress.status === 'completed') {
        // Redo mode: serve full stack, reset progress to in_progress
        await supabase
          .from('user_lesson_progress')
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
        lesson_id: lessonIdParam,
        lesson_title: lesson.title,
        session_type: 'lesson',
        cards: resumedCards,
        total_items: totalItems,
        items_completed: itemsCompleted,
        estimated_minutes: estimatedMinutes,
      })
    }

    // ══════════════════════════════════════════════════════════════
    // QUICK PRACTICE (no lesson_id -- random questions across course)
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

    // Build module title cache from module_id on questions
    const moduleIds = [...new Set(selectedQuestions.map((q: any) => q.module_id).filter(Boolean))]
    const moduleTitleCache: Record<string, string> = {}
    if (moduleIds.length > 0) {
      const { data: moduleRows } = await supabase
        .from('modules')
        .select('id, title')
        .in('id', moduleIds)
      for (const m of moduleRows || []) {
        moduleTitleCache[m.id] = m.title
      }
    }

    const cards: CardEntry[] = []
    const questionsOnly: any[] = []

    for (const q of selectedQuestions) {
      const stripped = stripAnswers(q)
      const mTitle = moduleTitleCache[q.module_id] || ''
      const card = questionCard(stripped, mTitle)
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
