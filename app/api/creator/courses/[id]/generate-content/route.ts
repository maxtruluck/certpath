import { getApiUser } from '@/lib/supabase/get-user-api'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const SYSTEM_PROMPT = `You are reformatting and organizing the creator's existing content into a structured lesson format for a learning platform.

You are strictly an import and formatting tool. Do not add information. Do not create new examples. Do not write new questions that test concepts not explicitly covered in the source material. Every word of the lesson body, every concept card, and every question must trace back to something in the source material.

You may:
- Reorganize the source material for clarity and flow
- Add formatting (headings, bold terms, blockquotes)
- Break into logical sections
- Extract key concepts into concept cards
- Create questions that test understanding of concepts explicitly present in the source material

You may NOT:
- Add facts, claims, or information not in the source material
- Invent examples, analogies, or explanations not present in the source
- Change the meaning or accuracy of the source content
- Write questions about topics not covered in the source material

Output a JSON object:
{
  "body": "Full lesson content in markdown format",
  "concept_cards": [
    { "id": "{lesson_id}-concept-0", "title": "Key concept name", "content": "2-3 sentence explanation from the source" }
  ],
  "questions": [
    {
      "question_text": "Question that tests understanding of the source material",
      "question_type": "multiple_choice",
      "options": [
        { "id": "a", "text": "Option text" },
        { "id": "b", "text": "Option text" },
        { "id": "c", "text": "Option text" },
        { "id": "d", "text": "Option text" }
      ],
      "correct_option_ids": ["c"],
      "explanation": "Why this is correct, referencing the source material",
      "option_explanations": { "a": "Why A is wrong", "b": "Why B is wrong", "d": "Why D is wrong" },
      "difficulty": 3,
      "blooms_level": "application",
      "tags": ["tag1", "tag2"]
    }
  ]
}

Rules for lesson body:
- Use ## headings to break content into 3-5 sections based on the source material
- Use **bold** for key terms on first mention
- Include only examples and explanations that appear in the source
- End with a > blockquote "Key Takeaway:" summarizing the most important point from the source
- Length should reflect the source material — do not pad or expand beyond what was provided
- Do not include the lesson title as the first heading (the UI handles that)

Rules for concept_cards:
- 2-4 per lesson, each covering one testable concept FROM the source material
- Title is a short noun phrase
- Content is 2-3 sentences pulled/paraphrased from the source
- IDs must follow format: "{lesson_id}-concept-{index}"

Rules for questions:
- 3-5 per lesson, testing comprehension of concepts explicitly present in the source material
- Mix difficulty levels (1-5) and Bloom's taxonomy levels
- Question types to use:
  - multiple_choice: 4 options, 1 correct
  - multiple_select: 4-6 options, 2-3 correct
  - true_false: [{id:"true",text:"True"},{id:"false",text:"False"}]
  - fill_blank: set acceptable_answers array (2-3 acceptable variations)
  - ordering: options array is items to order, correct_order is ordered IDs
  - matching: matching_pairs array of {left, right} objects
- Aim for mostly multiple_choice (60%), with the rest mixed across other types
- Include option_explanations for every wrong answer in MC/MS/TF questions
- Every question needs an explanation

Respond ONLY with the JSON object, no markdown, no preamble.`

interface LessonRow {
  id: string
  title: string
  body: string | null
  topic_id: string
  module_id: string
  course_id: string
  display_order: number
}

interface QuestionFromAI {
  question_text: string
  question_type: string
  options?: Array<{ id: string; text: string }>
  correct_option_ids?: string[]
  explanation?: string
  option_explanations?: Record<string, string>
  difficulty?: number
  blooms_level?: string
  tags?: string[]
  acceptable_answers?: string[]
  match_mode?: string
  correct_order?: string[]
  matching_pairs?: Array<{ left: string; right: string }>
}

async function formatLessonFromSource(
  anthropic: Anthropic,
  supabase: ReturnType<typeof getApiUser> extends Promise<infer U> ? U extends { supabase: infer S } ? S : never : never,
  lesson: LessonRow,
  sourceExcerpt: string,
  courseTitle: string,
  courseDescription: string,
  creatorId: string,
  context: { moduleTitle: string; topicTitle: string; prevLessonTitle: string | null; nextLessonTitle: string | null }
): Promise<{ success: boolean; lesson_id: string; body_length: number; concept_cards_count: number; questions_count: number }> {
  const userContent = `Course: ${courseTitle}
Course description: ${courseDescription}
Module: ${context.moduleTitle}
Topic: ${context.topicTitle}
Lesson: ${lesson.title}
Previous lesson: ${context.prevLessonTitle || 'None (first lesson)'}
Next lesson: ${context.nextLessonTitle || 'None (last lesson)'}

SOURCE MATERIAL FOR THIS LESSON:
${sourceExcerpt}

Reformat and organize this source material into the lesson format. Stay faithful to the source content. Do not add information that is not present in the source.`

  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 32000,
    system: SYSTEM_PROMPT.replaceAll('{lesson_id}', lesson.id),
    messages: [{ role: 'user', content: userContent }],
  })

  const response = await stream.finalMessage()
  const responseText = response.content[0].type === 'text' ? response.content[0].text : ''

  if (!responseText.trim()) {
    throw new Error(`AI returned empty response for lesson "${lesson.title}"`)
  }

  // Parse JSON
  let jsonText = responseText.trim()
  const fencedMatch = jsonText.match(/```(?:json)?\s*\n?([\s\S]*?)```/)
  if (fencedMatch) jsonText = fencedMatch[1].trim()

  const firstBrace = jsonText.indexOf('{')
  const lastBrace = jsonText.lastIndexOf('}')
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error(`No JSON found in AI response for lesson "${lesson.title}"`)
  }
  jsonText = jsonText.slice(firstBrace, lastBrace + 1)

  const result: {
    body: string
    concept_cards: Array<{ id: string; title: string; content: string }>
    questions: QuestionFromAI[]
  } = JSON.parse(jsonText)

  // Ensure concept card IDs follow format
  const conceptCards = (result.concept_cards || []).map((card, idx) => ({
    id: card.id || `${lesson.id}-concept-${idx}`,
    title: card.title,
    content: card.content,
  }))

  // Update lesson body and concept_cards
  await supabase.from('lessons').update({
    body: result.body || '',
    concept_cards: conceptCards,
  }).eq('id', lesson.id)

  // Create questions
  let questionsCreated = 0
  for (const q of (result.questions || [])) {
    if (!q.question_text) continue

    const questionType = q.question_type || 'multiple_choice'

    const insertData: Record<string, unknown> = {
      course_id: lesson.course_id,
      module_id: lesson.module_id,
      topic_id: lesson.topic_id,
      lesson_id: lesson.id,
      creator_id: creatorId,
      question_text: q.question_text,
      question_type: questionType,
      explanation: q.explanation || '',
      difficulty: Math.min(5, Math.max(1, q.difficulty || 3)),
      blooms_level: q.blooms_level || 'remember',
      tags: q.tags || [],
      source: 'ai_generated',
      is_active: true,
    }

    if (['multiple_choice', 'multiple_select', 'true_false'].includes(questionType)) {
      insertData.options = (q.options || []).map(o => ({ id: o.id, text: o.text }))
      insertData.correct_option_ids = q.correct_option_ids || []
      if (q.option_explanations && Object.keys(q.option_explanations).length > 0) {
        insertData.option_explanations = q.option_explanations
      }
    } else if (questionType === 'fill_blank') {
      insertData.acceptable_answers = q.acceptable_answers || []
      insertData.match_mode = q.match_mode || 'exact'
    } else if (questionType === 'ordering') {
      insertData.options = (q.options || []).map(o => ({ id: o.id, text: o.text }))
      insertData.correct_order = q.correct_order || []
    } else if (questionType === 'matching') {
      insertData.matching_pairs = q.matching_pairs || []
      insertData.match_mode = 'exact'
    }

    const { error: qErr } = await supabase.from('questions').insert(insertData)
    if (!qErr) questionsCreated++
  }

  return {
    success: true,
    lesson_id: lesson.id,
    body_length: (result.body || '').length,
    concept_cards_count: conceptCards.length,
    questions_count: questionsCreated,
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: courseId } = await params
  const { supabase, userId, error } = await getApiUser()
  if (error) return error

  const { data: creator } = await supabase
    .from('creators').select('id').eq('user_id', userId).single()
  if (!creator) return NextResponse.json({ error: 'Creator not found' }, { status: 404 })

  const { data: course } = await supabase
    .from('courses').select('id, title, description')
    .eq('id', courseId).eq('creator_id', creator.id).single()
  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

  const body = await request.json()
  const { lesson_id, source_excerpt, all, source_map } = body as {
    lesson_id?: string
    source_excerpt?: string
    all?: boolean
    source_map?: Record<string, string>
  }

  const anthropic = new Anthropic()

  // Helper to get lesson context (module title, topic title, neighbors)
  async function getLessonContext(lesson: LessonRow) {
    const { data: topic } = await supabase
      .from('topics').select('title').eq('id', lesson.topic_id).single()
    const { data: mod } = await supabase
      .from('modules').select('title').eq('id', lesson.module_id).single()

    // Get neighboring lessons
    const { data: siblings } = await supabase
      .from('lessons')
      .select('id, title, display_order')
      .eq('topic_id', lesson.topic_id)
      .order('display_order', { ascending: true })

    let prevTitle: string | null = null
    let nextTitle: string | null = null
    if (siblings) {
      const idx = siblings.findIndex(s => s.id === lesson.id)
      if (idx > 0) prevTitle = siblings[idx - 1].title
      if (idx < siblings.length - 1) nextTitle = siblings[idx + 1].title
    }

    return {
      moduleTitle: mod?.title || 'Unknown Module',
      topicTitle: topic?.title || 'Unknown Topic',
      prevLessonTitle: prevTitle,
      nextLessonTitle: nextTitle,
    }
  }

  // Single lesson mode
  if (lesson_id && !all) {
    if (!source_excerpt || !source_excerpt.trim()) {
      return NextResponse.json({ error: 'Source material is required. Upload content in the previous step first.' }, { status: 400 })
    }

    const { data: lesson } = await supabase
      .from('lessons')
      .select('id, title, body, topic_id, module_id, course_id, display_order')
      .eq('id', lesson_id)
      .eq('course_id', courseId)
      .single()

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    try {
      const context = await getLessonContext(lesson as LessonRow)
      const result = await formatLessonFromSource(
        anthropic, supabase, lesson as LessonRow,
        source_excerpt, course.title, course.description || '',
        creator.id, context
      )
      return NextResponse.json(result)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return NextResponse.json({ error: msg }, { status: 500 })
    }
  }

  // Bulk mode — only process lessons that have source material
  if (all) {
    if (!source_map || Object.keys(source_map).length === 0) {
      return NextResponse.json({ error: 'Source material is required. Upload content in the previous step first.' }, { status: 400 })
    }

    const lessonIds = Object.keys(source_map)
    const { data: lessonsWithSource } = await supabase
      .from('lessons')
      .select('id, title, body, topic_id, module_id, course_id, display_order')
      .eq('course_id', courseId)
      .in('id', lessonIds)
      .or('body.is.null,body.eq.')
      .order('display_order', { ascending: true })

    if (!lessonsWithSource || lessonsWithSource.length === 0) {
      return NextResponse.json({ success: true, lessons_processed: 0, total_questions: 0, skipped: 0 })
    }

    let lessonsProcessed = 0
    let totalQuestions = 0
    const errors: string[] = []

    // Process sequentially to respect rate limits
    for (const lesson of lessonsWithSource) {
      const excerpt = source_map[lesson.id]
      if (!excerpt || !excerpt.trim()) continue

      try {
        const context = await getLessonContext(lesson as LessonRow)
        const result = await formatLessonFromSource(
          anthropic, supabase, lesson as LessonRow,
          excerpt, course.title, course.description || '',
          creator.id, context
        )
        lessonsProcessed++
        totalQuestions += result.questions_count
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        errors.push(`${lesson.title}: ${msg}`)
      }
    }

    return NextResponse.json({
      success: true,
      lessons_processed: lessonsProcessed,
      total_questions: totalQuestions,
      skipped: lessonIds.length - lessonsProcessed - errors.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  }

  return NextResponse.json({ error: 'Provide lesson_id or set all: true' }, { status: 400 })
}
