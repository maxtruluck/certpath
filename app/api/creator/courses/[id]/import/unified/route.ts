import { NextRequest, NextResponse } from 'next/server'
import { getCreatorCourse } from '@/lib/supabase/get-creator-course'
import Papa from 'papaparse'

/**
 * Unified CSV import: structure + lesson content + questions in one file.
 *
 * Each row has a `row_type` column:
 *   - "structure"  -> creates module/lesson (deduped by title)
 *   - "content"    -> sets the markdown body for a lesson
 *   - "question"   -> adds a question linked to a lesson
 *
 * All rows use module_title + lesson_title to locate the target.
 * Structure rows are processed first (sorted to front) so content/question rows
 * can reference lessons created in the same file.
 *
 * topic_title column is accepted for backward compatibility but ignored
 * (or used as lesson title fallback if lesson_title is empty).
 */
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

    if (rows.length === 0) {
      return NextResponse.json({ error: 'CSV has no data rows' }, { status: 400 })
    }

    // Detect format: unified (has row_type) or structure-only (no row_type)
    const hasRowType = rows.some(r => r.row_type?.trim())

    // Tag each row with its original index for error reporting
    interface TaggedRow {
      [key: string]: string | number | undefined
      _origRow: number
    }
    const taggedRows: TaggedRow[] = rows.map((r, i) => ({ ...r, _origRow: i + 2 } as TaggedRow))

    // Helper to safely get string value from tagged row
    const str = (row: TaggedRow, key: string): string => {
      const v = row[key]
      return typeof v === 'string' ? v.trim() : ''
    }

    // If no row_type column, infer type from columns present
    if (!hasRowType) {
      for (const row of taggedRows) {
        if (str(row, 'question_text')) {
          row.row_type = 'question'
        } else if (str(row, 'lesson_body')) {
          row.row_type = 'content'
        } else {
          row.row_type = 'structure'
        }
      }
    }

    // Sort: structure first, then content, then questions
    const typeOrder: Record<string, number> = { structure: 0, content: 1, question: 2 }
    const sorted = [...taggedRows].sort((a, b) => {
      const aType = str(a, 'row_type').toLowerCase() || 'structure'
      const bType = str(b, 'row_type').toLowerCase() || 'structure'
      return (typeOrder[aType] ?? 1) - (typeOrder[bType] ?? 1)
    })

    // In-memory maps for dedup
    const moduleMap = new Map<string, string>()   // lowercase title -> id
    const lessonMap = new Map<string, { id: string; nextOrder?: number }>()  // "moduleId|lowercase title" -> { id }

    // Track lesson order per module
    const lessonOrderByModule = new Map<string, number>()

    // Load existing structure so we can append rather than replace
    const { data: existingModules } = await supabase
      .from('modules')
      .select('id, title, display_order')
      .eq('course_id', id)
      .order('display_order')

    for (const m of existingModules || []) {
      moduleMap.set(m.title.toLowerCase(), m.id)
    }

    const { data: existingLessons } = await supabase
      .from('lessons')
      .select('id, title, module_id, display_order')
      .eq('course_id', id)

    for (const l of existingLessons || []) {
      lessonMap.set(`${l.module_id}|${l.title.toLowerCase()}`, { id: l.id })
      // Track max lesson order per module
      const currentMax = lessonOrderByModule.get(l.module_id) || 0
      lessonOrderByModule.set(l.module_id, Math.max(currentMax, (l.display_order || 0) + 1))
    }

    const stats = { modules: 0, lessons: 0, content: 0, questions: 0, steps: 0 }
    const importErrors: { row: number; message: string }[] = []

    // Track step sort_order per lesson for sequential step creation
    const stepOrderByLesson = new Map<string, number>()

    // Load existing step counts
    const lessonIdsForSteps = [...lessonMap.values()].map(l => l.id)
    if (lessonIdsForSteps.length > 0) {
      const { data: existingSteps } = await supabase
        .from('lesson_steps')
        .select('lesson_id, sort_order')
        .in('lesson_id', lessonIdsForSteps)
        .order('sort_order', { ascending: false })

      for (const s of existingSteps || []) {
        const current = stepOrderByLesson.get(s.lesson_id)
        if (current == null || s.sort_order >= current) {
          stepOrderByLesson.set(s.lesson_id, s.sort_order + 1)
        }
      }
    }

    function getNextStepOrder(lessonId: string): number {
      const order = stepOrderByLesson.get(lessonId) || 0
      stepOrderByLesson.set(lessonId, order + 1)
      return order
    }

    // Helper: resolve or create module/lesson from a row
    const resolveStructure = async (row: TaggedRow): Promise<{ moduleId: string; lessonId: string | null } | null> => {
      const moduleTitle = str(row, 'module_title')
      // lesson_title is primary; fall back to topic_title for backward compat
      let lessonTitle = str(row, 'lesson_title')
      if (!lessonTitle) {
        const topicTitle = str(row, 'topic_title')
        // Use topic_title as lesson title fallback only if no lesson_title
        if (topicTitle) {
          lessonTitle = topicTitle
        }
      }

      if (!moduleTitle) {
        importErrors.push({ row: row._origRow, message: 'module_title is required' })
        return null
      }

      // Get or create module
      const moduleLookup = moduleTitle.toLowerCase()
      let moduleId = moduleMap.get(moduleLookup)

      if (!moduleId) {
        const nextOrder = moduleMap.size
        const { data: newMod, error: modErr } = await supabase
          .from('modules')
          .insert({
            course_id: id,
            title: moduleTitle,
            description: str(row, 'module_description') || null,
            display_order: nextOrder,
          })
          .select('id')
          .single()

        if (modErr || !newMod) {
          importErrors.push({ row: row._origRow, message: `Failed to create module: ${moduleTitle}` })
          return null
        }
        moduleId = newMod.id
        moduleMap.set(moduleLookup, moduleId!)
        stats.modules++
      }

      if (!moduleId) return null

      // Get or create lesson (directly under module, no topic)
      let lessonId: string | null = null
      if (lessonTitle) {
        const lessonKey = `${moduleId}|${lessonTitle.toLowerCase()}`
        const existing = lessonMap.get(lessonKey)
        lessonId = existing?.id || null

        if (!lessonId) {
          const currentOrder = lessonOrderByModule.get(moduleId) || 0
          const { data: newLesson, error: lessonErr } = await supabase
            .from('lessons')
            .insert({
              module_id: moduleId,
              course_id: id,
              title: lessonTitle,
              body: '',
              display_order: currentOrder,
            })
            .select('id')
            .single()

          if (lessonErr || !newLesson) {
            importErrors.push({ row: row._origRow, message: `Failed to create lesson: ${lessonTitle}` })
            return null
          }
          lessonId = newLesson.id
          lessonMap.set(lessonKey, { id: lessonId! })
          lessonOrderByModule.set(moduleId, currentOrder + 1)
          stats.lessons++
        }
      }

      return { moduleId, lessonId }
    }

    // Process all rows
    for (const row of sorted) {
      const rowType = (str(row, 'row_type') || 'structure').toLowerCase()

      if (rowType === 'structure') {
        await resolveStructure(row)
        continue
      }

      if (rowType === 'content') {
        const resolved = await resolveStructure(row)
        if (!resolved?.lessonId) {
          if (!importErrors.find(e => e.row === row._origRow)) {
            importErrors.push({ row: row._origRow, message: 'content row requires lesson_title to target a lesson' })
          }
          continue
        }

        const body = str(row, 'lesson_body')
        if (!body) {
          importErrors.push({ row: row._origRow, message: 'content row has empty lesson_body' })
          continue
        }

        // Replace \n with actual newlines
        const processedBody = body.replace(/\\n/g, '\n')

        // Update legacy body field
        await supabase
          .from('lessons')
          .update({ body: processedBody })
          .eq('id', resolved.lessonId)

        // Create a read step
        const { error: stepErr } = await supabase
          .from('lesson_steps')
          .insert({
            lesson_id: resolved.lessonId,
            sort_order: getNextStepOrder(resolved.lessonId),
            step_type: 'read',
            content: { markdown: processedBody },
          })

        if (stepErr) {
          importErrors.push({ row: row._origRow, message: `Failed to create read step: ${stepErr.message}` })
          continue
        }
        stats.content++
        stats.steps++
        continue
      }

      if (rowType === 'question') {
        const resolved = await resolveStructure(row)
        if (!resolved) continue

        const questionText = str(row, 'question_text')
        if (!questionText) {
          importErrors.push({ row: row._origRow, message: 'question row requires question_text' })
          continue
        }

        // Build options
        const options: { id: string; text: string }[] = []
        for (const letter of ['a', 'b', 'c', 'd', 'e', 'f']) {
          const optText = str(row, `option_${letter}`)
          if (optText) options.push({ id: letter, text: optText })
        }

        const correctStr = str(row, 'correct_answers') || str(row, 'correct')
        const correctOptionIds = correctStr.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)

        let questionType = str(row, 'question_type') || 'multiple_choice'
        if (questionType === 'tf') questionType = 'true_false'
        else if (questionType === 'ms') questionType = 'multiple_select'
        else if (!['multiple_choice', 'multiple_select', 'true_false', 'fill_blank', 'ordering', 'matching'].includes(questionType)) {
          questionType = 'multiple_choice'
        }

        const difficulty = Math.min(5, Math.max(1, parseInt(str(row, 'difficulty') || '3') || 3))
        const tagsStr = str(row, 'tags')
        const tags = tagsStr ? tagsStr.split(';').map(t => t.trim()).filter(Boolean) : []

        const insertData: Record<string, unknown> = {
          topic_id: null,
          module_id: resolved.moduleId,
          course_id: id,
          creator_id: creatorId,
          question_text: questionText,
          question_type: questionType,
          options,
          correct_option_ids: correctOptionIds,
          explanation: str(row, 'explanation'),
          difficulty,
          tags,
          source: 'creator_original',
          blooms_level: str(row, 'blooms_level') || 'remember',
          lesson_id: resolved.lessonId,
        }

        // Fill blank
        if (questionType === 'fill_blank') {
          const acceptableStr = str(row, 'acceptable_answers')
          const acceptableAnswers = acceptableStr.split('|').map(s => s.trim()).filter(Boolean)
          if (acceptableAnswers.length === 0) {
            importErrors.push({ row: row._origRow, message: 'fill_blank requires acceptable_answers (pipe-separated)' })
            continue
          }
          insertData.acceptable_answers = acceptableAnswers
          insertData.match_mode = str(row, 'match_mode') || 'exact'
          insertData.options = []
          insertData.correct_option_ids = []
        }

        // Ordering
        if (questionType === 'ordering') {
          const correctOrder = str(row, 'correct_order').split(',').map(s => s.trim()).filter(Boolean)
          if (correctOrder.length < 3) {
            importErrors.push({ row: row._origRow, message: 'ordering requires 3+ items in correct_order' })
            continue
          }
          insertData.correct_order = correctOrder
        }

        // Matching
        if (questionType === 'matching') {
          const lefts = str(row, 'matching_left').split('|').map(s => s.trim()).filter(Boolean)
          const rights = str(row, 'matching_right').split('|').map(s => s.trim()).filter(Boolean)
          if (lefts.length < 3 || lefts.length !== rights.length) {
            importErrors.push({ row: row._origRow, message: 'matching requires 3+ pairs with equal left/right counts' })
            continue
          }
          insertData.matching_pairs = lefts.map((l, idx) => ({ left: l, right: rights[idx] }))
          insertData.options = []
          insertData.correct_option_ids = []
        }

        const { data: newQuestion, error: insertError } = await supabase
          .from('questions')
          .insert(insertData)
          .select('id')
          .single()

        if (insertError || !newQuestion) {
          importErrors.push({ row: row._origRow, message: `Failed to insert question: ${insertError?.message}` })
          continue
        }

        // Create an answer step linked to this question
        if (resolved.lessonId) {
          await supabase
            .from('lesson_steps')
            .insert({
              lesson_id: resolved.lessonId,
              sort_order: getNextStepOrder(resolved.lessonId),
              step_type: 'answer',
              content: {
                question_id: newQuestion.id,
                question_text: questionText,
                question_type: questionType,
                options,
                correct_ids: correctOptionIds,
                explanation: str(row, 'explanation'),
                option_explanations: {},
              },
            })
          stats.steps++
        }
        stats.questions++
        continue
      }

      if (rowType === 'watch') {
        const resolved = await resolveStructure(row)
        if (!resolved?.lessonId) {
          if (!importErrors.find(e => e.row === row._origRow)) {
            importErrors.push({ row: row._origRow, message: 'watch row requires lesson_title' })
          }
          continue
        }
        const url = str(row, 'video_url') || str(row, 'url')
        if (!url) {
          importErrors.push({ row: row._origRow, message: 'watch row requires video_url' })
          continue
        }
        await supabase.from('lesson_steps').insert({
          lesson_id: resolved.lessonId,
          sort_order: getNextStepOrder(resolved.lessonId),
          step_type: 'watch',
          content: { url },
        })
        stats.steps++
        continue
      }

      if (rowType === 'callout') {
        const resolved = await resolveStructure(row)
        if (!resolved?.lessonId) {
          if (!importErrors.find(e => e.row === row._origRow)) {
            importErrors.push({ row: row._origRow, message: 'callout row requires lesson_title' })
          }
          continue
        }
        const calloutStyle = str(row, 'callout_style') || 'tip'
        const title = str(row, 'callout_title') || str(row, 'title') || calloutStyle.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())
        const markdown = (str(row, 'lesson_body') || str(row, 'callout_body') || '').replace(/\\n/g, '\n')
        await supabase.from('lesson_steps').insert({
          lesson_id: resolved.lessonId,
          sort_order: getNextStepOrder(resolved.lessonId),
          step_type: 'callout',
          content: { callout_style: calloutStyle, title, markdown },
        })
        stats.steps++
        continue
      }

      if (rowType === 'embed') {
        const resolved = await resolveStructure(row)
        if (!resolved?.lessonId) {
          if (!importErrors.find(e => e.row === row._origRow)) {
            importErrors.push({ row: row._origRow, message: 'embed row requires lesson_title' })
          }
          continue
        }
        const subType = str(row, 'embed_type') || str(row, 'sub_type') || 'image'
        let content: Record<string, unknown> = { sub_type: subType }
        if (subType === 'image') {
          content.url = str(row, 'url') || str(row, 'image_url') || ''
          content.caption = str(row, 'caption') || ''
          content.alt = str(row, 'alt') || ''
        } else if (subType === 'diagram') {
          content.mermaid = (str(row, 'mermaid') || str(row, 'lesson_body') || '').replace(/\\n/g, '\n')
        }
        await supabase.from('lesson_steps').insert({
          lesson_id: resolved.lessonId,
          sort_order: getNextStepOrder(resolved.lessonId),
          step_type: 'embed',
          content,
        })
        stats.steps++
        continue
      }

      importErrors.push({ row: row._origRow, message: `Unknown row_type: "${rowType}". Use structure, content, question, watch, callout, or embed.` })
    }

    const totalImported = stats.modules + stats.lessons + stats.content + stats.questions

    return NextResponse.json({
      imported: totalImported,
      stats,
      errors: importErrors,
    })
  } catch (err) {
    console.error('POST import/unified error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
