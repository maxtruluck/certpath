import { NextRequest, NextResponse } from 'next/server'
import { getCreatorCourse } from '@/lib/supabase/get-creator-course'
import Papa from 'papaparse'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { supabase, creatorId, error } = await getCreatorCourse(id)
    if (error) return error

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'CSV file is required' }, { status: 400 })
    }

    const csvText = await file.text()
    const { data: rows, errors: parseErrors } = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
    })

    if (parseErrors.length > 0) {
      return NextResponse.json({
        error: 'CSV parsing failed',
        errors: parseErrors.map(e => ({ row: e.row, message: e.message })),
      }, { status: 400 })
    }

    // Build lookup maps for modules and topics by title
    const { data: modules } = await supabase
      .from('modules')
      .select('id, title')
      .eq('course_id', id)

    const { data: topics } = await supabase
      .from('topics')
      .select('id, title, module_id')
      .eq('course_id', id)

    const moduleByTitle = new Map<string, string>()
    for (const m of modules || []) {
      moduleByTitle.set(m.title.toLowerCase(), m.id)
    }

    const topicByTitle = new Map<string, { id: string; module_id: string }>()
    for (const t of topics || []) {
      topicByTitle.set(t.title.toLowerCase(), { id: t.id, module_id: t.module_id })
    }

    // Build lesson lookup and track created lessons
    const { data: existingLessons } = await supabase
      .from('lessons')
      .select('id, title, topic_id')
      .eq('course_id', id)

    // Key: "topicId|lessonTitle" → lesson_id
    const lessonLookup = new Map<string, string>()
    for (const l of existingLessons || []) {
      lessonLookup.set(`${l.topic_id}|${l.title.toLowerCase()}`, l.id)
    }

    let imported = 0
    const importErrors: { row: number; message: string }[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const topicTitle = row.topic_title?.trim()
      const questionText = row.question_text?.trim()

      if (!topicTitle || !questionText) {
        importErrors.push({ row: i + 2, message: 'topic_title and question_text are required' })
        continue
      }

      const topicInfo = topicByTitle.get(topicTitle.toLowerCase())
      if (!topicInfo) {
        importErrors.push({ row: i + 2, message: `Topic not found: "${topicTitle}"` })
        continue
      }

      // Build options from option_a through option_f columns
      const options: { id: string; text: string }[] = []
      for (const letter of ['a', 'b', 'c', 'd', 'e', 'f']) {
        const optText = row[`option_${letter}`]?.trim()
        if (optText) {
          options.push({ id: letter, text: optText })
        }
      }

      // Parse correct_answers (comma-separated letters)
      const correctStr = row.correct_answers?.trim() || row.correct?.trim() || ''
      const correctOptionIds = correctStr.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)

      // Determine question type
      let questionType = row.question_type?.trim() || 'multiple_choice'
      if (questionType === 'true_false' || questionType === 'tf') {
        questionType = 'true_false'
      } else if (questionType === 'multiple_select' || questionType === 'ms') {
        questionType = 'multiple_select'
      } else if (questionType === 'fill_blank') {
        questionType = 'fill_blank'
      } else if (questionType === 'ordering') {
        questionType = 'ordering'
      } else if (questionType === 'matching') {
        questionType = 'matching'
      } else {
        questionType = 'multiple_choice'
      }

      const difficulty = Math.min(5, Math.max(1, parseInt(row.difficulty || '3') || 3))
      const tags = row.tags ? row.tags.split(';').map(t => t.trim()).filter(Boolean) : []

      // Resolve lesson_id from lesson_title column
      let lessonId: string | null = null
      const lessonTitle = row.lesson_title?.trim()
      if (lessonTitle) {
        const lookupKey = `${topicInfo.id}|${lessonTitle.toLowerCase()}`
        if (lessonLookup.has(lookupKey)) {
          lessonId = lessonLookup.get(lookupKey)!
        } else {
          // Create the lesson
          const { data: newLesson, error: lessonErr } = await supabase
            .from('lessons')
            .insert({
              topic_id: topicInfo.id,
              course_id: id,
              module_id: topicInfo.module_id,
              title: lessonTitle,
              body: '',
              display_order: lessonLookup.size,
            })
            .select('id')
            .single()

          if (lessonErr) {
            importErrors.push({ row: i + 2, message: `Failed to create lesson: ${lessonErr.message}` })
          } else if (newLesson) {
            lessonId = newLesson.id
            lessonLookup.set(lookupKey, newLesson.id)
          }
        }
      } else {
        // No lesson_title: use or create default "{topic} — General"
        const defaultTitle = `${topicTitle} — General`
        const defaultKey = `${topicInfo.id}|${defaultTitle.toLowerCase()}`
        if (lessonLookup.has(defaultKey)) {
          lessonId = lessonLookup.get(defaultKey)!
        } else {
          const { data: newLesson } = await supabase
            .from('lessons')
            .insert({
              topic_id: topicInfo.id,
              course_id: id,
              module_id: topicInfo.module_id,
              title: defaultTitle,
              body: '',
              display_order: 0,
            })
            .select('id')
            .single()

          if (newLesson) {
            lessonId = newLesson.id
            lessonLookup.set(defaultKey, newLesson.id)
          }
        }
      }

      // Build insert data
      const insertData: Record<string, unknown> = {
        topic_id: topicInfo.id,
        module_id: topicInfo.module_id,
        course_id: id,
        creator_id: creatorId,
        question_text: questionText,
        question_type: questionType,
        options,
        correct_option_ids: correctOptionIds,
        explanation: row.explanation?.trim() || '',
        difficulty,
        tags,
        source: 'creator_original',
        blooms_level: row.blooms_level?.trim() || 'remember',
        lesson_id: lessonId,
      }

      // Handle fill_blank type
      if (questionType === 'fill_blank') {
        const acceptableStr = row.acceptable_answers?.trim() || ''
        const acceptableAnswers = acceptableStr.split('|').map(s => s.trim()).filter(Boolean)
        if (acceptableAnswers.length === 0) {
          importErrors.push({ row: i + 2, message: 'fill_blank requires at least one acceptable_answer' })
          continue
        }
        insertData.acceptable_answers = acceptableAnswers
        insertData.match_mode = row.match_mode?.trim() || 'exact'
        insertData.options = []
        insertData.correct_option_ids = []
      }

      // Handle ordering type
      if (questionType === 'ordering') {
        const correctOrderStr = row.correct_order?.trim() || ''
        const correctOrder = correctOrderStr.split(',').map(s => s.trim()).filter(Boolean)
        if (correctOrder.length < 3) {
          importErrors.push({ row: i + 2, message: 'ordering requires at least 3 items in correct_order' })
          continue
        }
        insertData.correct_order = correctOrder
      }

      // Handle matching type
      if (questionType === 'matching') {
        const leftStr = row.matching_left?.trim() || ''
        const rightStr = row.matching_right?.trim() || ''
        const lefts = leftStr.split('|').map(s => s.trim()).filter(Boolean)
        const rights = rightStr.split('|').map(s => s.trim()).filter(Boolean)
        if (lefts.length < 3 || lefts.length !== rights.length) {
          importErrors.push({ row: i + 2, message: 'matching requires 3+ pairs with equal left/right counts' })
          continue
        }
        insertData.matching_pairs = lefts.map((l, idx) => ({ left: l, right: rights[idx] }))
        insertData.options = []
        insertData.correct_option_ids = []
      }

      const { error: insertError } = await supabase
        .from('questions')
        .insert(insertData)

      if (insertError) {
        importErrors.push({ row: i + 2, message: `Failed to insert question: ${insertError.message}` })
        continue
      }

      imported++
    }

    return NextResponse.json({ imported, errors: importErrors })
  } catch (err) {
    console.error('POST import/questions error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
