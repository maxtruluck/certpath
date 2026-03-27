import { NextRequest, NextResponse } from 'next/server'
import { getCreatorCourse } from '@/lib/supabase/get-creator-course'
import type { StructuredCourse } from './structure/route'

/**
 * POST /api/creator/courses/[id]/import
 *
 * Main import orchestrator. Accepts multipart form data with:
 *   - import_type: 'file' | 'paste' | 'youtube'
 *   - files: File[] (for file import)
 *   - text: string (for paste import)
 *   - url: string (for YouTube import)
 *   - course_title: string
 *   - category: string
 *
 * Coordinates: extract -> structure (Claude) -> insert modules/lessons
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params
    const { supabase, creatorId, error } = await getCreatorCourse(courseId)
    if (error) return error

    const formData = await request.formData()
    const importType = formData.get('import_type') as string
    const courseTitle = formData.get('course_title') as string || ''
    const category = formData.get('category') as string || ''

    if (!importType) {
      return NextResponse.json({ error: 'import_type is required' }, { status: 400 })
    }

    // ─── Step 1: Extract text ────────────────────────────────────
    let extractedText = ''

    if (importType === 'paste') {
      const text = formData.get('text') as string
      if (!text?.trim()) {
        return NextResponse.json({ error: 'No text provided' }, { status: 400 })
      }
      extractedText = text.trim()
    } else if (importType === 'file') {
      // Call the extract endpoint internally
      const files = formData.getAll('files') as File[]
      if (!files || files.length === 0) {
        return NextResponse.json({ error: 'No files provided' }, { status: 400 })
      }

      // Forward to extract endpoint
      const extractForm = new FormData()
      for (const file of files) {
        extractForm.append('files', file)
      }

      const baseUrl = request.nextUrl.origin
      const extractRes = await fetch(`${baseUrl}/api/creator/courses/${courseId}/import/extract`, {
        method: 'POST',
        body: extractForm,
        headers: {
          cookie: request.headers.get('cookie') || '',
        },
      })

      const extractData = await extractRes.json()
      if (!extractRes.ok) {
        return NextResponse.json({ error: extractData.error || 'Extraction failed' }, { status: extractRes.status })
      }
      extractedText = extractData.text
    } else if (importType === 'youtube') {
      // YouTube import -- Phase 3 (return placeholder for now)
      return NextResponse.json({ error: 'YouTube import coming soon' }, { status: 400 })
    } else {
      return NextResponse.json({ error: `Unknown import_type: ${importType}` }, { status: 400 })
    }

    if (!extractedText.trim()) {
      return NextResponse.json({ error: 'No content to structure' }, { status: 400 })
    }

    // ─── Step 2: Structure via Claude ────────────────────────────
    const baseUrl = request.nextUrl.origin
    const structureRes = await fetch(`${baseUrl}/api/creator/courses/${courseId}/import/structure`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: request.headers.get('cookie') || '',
      },
      body: JSON.stringify({
        text: extractedText,
        course_title: courseTitle,
        category,
        import_type: importType,
      }),
    })

    const structureData = await structureRes.json()
    if (!structureRes.ok) {
      return NextResponse.json({ error: structureData.error || 'Structuring failed' }, { status: structureRes.status })
    }

    const structure: StructuredCourse = structureData.structure

    // ─── Step 3: Insert modules and lessons ──────────────────────
    let modulesCreated = 0
    let lessonsCreated = 0

    for (let mi = 0; mi < structure.modules.length; mi++) {
      const mod = structure.modules[mi]

      // Create module via existing API
      const { data: dbModule, error: modErr } = await supabase
        .from('modules')
        .insert({
          course_id: courseId,
          title: mod.title,
          display_order: mi,
        })
        .select('id')
        .single()

      if (modErr || !dbModule) {
        console.error('Module insert error:', modErr)
        continue
      }
      modulesCreated++

      for (let li = 0; li < mod.lessons.length; li++) {
        const lesson = mod.lessons[li]

        // Create lesson
        const { data: dbLesson, error: lessonErr } = await supabase
          .from('lessons')
          .insert({
            course_id: courseId,
            module_id: dbModule.id,
            title: lesson.title,
            body: lesson.body || '',
            display_order: li,
          })
          .select('id')
          .single()

        if (lessonErr || !dbLesson) {
          console.error('Lesson insert error:', lessonErr)
          continue
        }
        lessonsCreated++
      }
    }

    return NextResponse.json({
      success: true,
      modules_created: modulesCreated,
      lessons_created: lessonsCreated,
    })
  } catch (err) {
    console.error('POST /import error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
