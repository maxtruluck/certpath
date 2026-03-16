import { NextRequest, NextResponse } from 'next/server'
import { getCreatorCourse } from '@/lib/supabase/get-creator-course'
import Papa from 'papaparse'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { supabase, error } = await getCreatorCourse(id)
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

    // Clear existing structure before importing
    // Delete in order: lessons -> topics -> modules (foreign key deps)
    await supabase.from('lessons').delete().eq('course_id', id)
    await supabase.from('topics').delete().eq('course_id', id)
    await supabase.from('modules').delete().eq('course_id', id)

    // In-memory maps for dedup within this import run
    const moduleMap = new Map<string, string>()   // lowercase title -> id
    const topicMap = new Map<string, { id: string; moduleId: string; lessonOrder: number }>()  // "moduleId::lowercase title" -> info

    let imported = 0
    const importErrors: { row: number; message: string }[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const moduleTitle = row.module_title?.trim()
      const topicTitle = row.topic_title?.trim()
      const lessonTitle = row.lesson_title?.trim()

      if (!moduleTitle || !topicTitle) {
        importErrors.push({ row: i + 2, message: 'module_title and topic_title are required' })
        continue
      }

      // ── Get or create module ──
      const moduleLookup = moduleTitle.toLowerCase()
      let moduleId = moduleMap.get(moduleLookup)

      if (!moduleId) {
        const nextOrder = moduleMap.size

        const { data: newMod, error: modErr } = await supabase
          .from('modules')
          .insert({
            course_id: id,
            title: moduleTitle,
            description: row.module_description?.trim() || null,
            display_order: nextOrder,
          })
          .select('id')
          .single()

        if (modErr || !newMod) {
          importErrors.push({ row: i + 2, message: `Failed to create module: ${moduleTitle}` })
          continue
        }
        moduleId = newMod.id
        moduleMap.set(moduleLookup, moduleId!)
        imported++
      }

      // ── Get or create topic ──
      const topicKey = `${moduleId}::${topicTitle.toLowerCase()}`
      let topicEntry = topicMap.get(topicKey)

      if (!topicEntry) {
        const topicsInModule = [...topicMap.keys()].filter(k => k.startsWith(`${moduleId}::`)).length

        const { data: newTopic, error: topicErr } = await supabase
          .from('topics')
          .insert({
            module_id: moduleId,
            course_id: id,
            title: topicTitle,
            description: row.topic_description?.trim() || null,
            display_order: topicsInModule,
          })
          .select('id')
          .single()

        if (topicErr || !newTopic) {
          importErrors.push({ row: i + 2, message: `Failed to create topic: ${topicTitle}` })
          continue
        }

        topicEntry = { id: newTopic.id, moduleId: moduleId!, lessonOrder: 0 }
        topicMap.set(topicKey, topicEntry)
        imported++
      }

      // ── Create lesson if provided ──
      if (lessonTitle) {
        const { error: lessonErr } = await supabase
          .from('lessons')
          .insert({
            topic_id: topicEntry.id,
            course_id: id,
            module_id: moduleId,
            title: lessonTitle,
            display_order: topicEntry.lessonOrder,
          })

        if (lessonErr) {
          importErrors.push({ row: i + 2, message: `Failed to create lesson: ${lessonTitle}` })
          continue
        }

        topicEntry.lessonOrder++
        imported++
      }
    }

    return NextResponse.json({ imported, errors: importErrors })
  } catch (err) {
    console.error('POST import/structure error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
