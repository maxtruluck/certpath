import { getApiUser } from '@/lib/supabase/get-user-api'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const UNSUPPORTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]

const SYSTEM_PROMPT = `You are an expert course organizer. Your job is to analyze educational source material and organize it into a structured course format for a learning platform.

You are NOT generating new content. You are CLASSIFYING and ORGANIZING the creator's existing material into modules, topics, and lessons. Every lesson must map back to a specific section of the source material.

Output a JSON object with this exact structure:
{
  "modules": [
    {
      "title": "Module title",
      "description": "Brief module description",
      "topics": [
        {
          "title": "Topic title",
          "description": "Brief topic description",
          "lessons": [
            {
              "title": "Lesson title",
              "source_excerpt": "The exact portion of the source material that this lesson covers. Copy the relevant text verbatim — this will be used later to generate the lesson content. Include all relevant paragraphs, lists, definitions, and examples from the source. Do NOT summarize — include the full source text for this section."
            }
          ]
        }
      ]
    }
  ]
}

Rules:
- Every lesson MUST have a source_excerpt that maps back to the uploaded content
- source_excerpt should be the VERBATIM text from the source material, not a summary
- If a section of source material doesn't fit any lesson, include it in the most relevant lesson's source_excerpt
- Each module should group 3-6 related topics
- Each topic should have 1-4 lessons
- Lesson titles should be specific and descriptive
- Order modules from foundational to advanced
- If the content has clear chapter/section/heading structure, follow it
- If the content is flat (like a study guide), organize by concept clusters
- Do NOT invent content that isn't in the source material
- Do NOT skip any source material — all uploaded content should appear in some lesson's source_excerpt
- Respond ONLY with the JSON object, no markdown, no preamble`

/**
 * Extract plain text from a DOCX file (which is a ZIP containing XML).
 * Uses Node.js built-in zlib — no external dependencies needed.
 */
async function extractDocxText(arrayBuffer: ArrayBuffer): Promise<string> {
  const { Readable } = await import('stream')
  const { createInflateRaw } = await import('zlib')

  const buffer = Buffer.from(arrayBuffer)

  const entries: Array<{ name: string; compressedData: Buffer; compressionMethod: number }> = []
  let offset = 0

  while (offset < buffer.length - 4) {
    if (buffer.readUInt32LE(offset) !== 0x04034b50) {
      offset++
      continue
    }

    const compressionMethod = buffer.readUInt16LE(offset + 8)
    const compressedSize = buffer.readUInt32LE(offset + 18)
    const nameLength = buffer.readUInt16LE(offset + 26)
    const extraLength = buffer.readUInt16LE(offset + 28)
    const name = buffer.toString('utf8', offset + 30, offset + 30 + nameLength)
    const dataStart = offset + 30 + nameLength + extraLength
    const compressedData = buffer.subarray(dataStart, dataStart + compressedSize)

    entries.push({ name, compressedData, compressionMethod })
    offset = dataStart + compressedSize
  }

  const docEntry = entries.find(e => e.name === 'word/document.xml')
  if (!docEntry) return '[No document.xml found in DOCX]'

  let xml: string
  if (docEntry.compressionMethod === 0) {
    xml = docEntry.compressedData.toString('utf8')
  } else {
    xml = await new Promise<string>((resolve, reject) => {
      const chunks: Buffer[] = []
      const inflate = createInflateRaw()
      inflate.on('data', (chunk: Buffer) => chunks.push(chunk))
      inflate.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
      inflate.on('error', reject)
      const readable = Readable.from(docEntry.compressedData)
      readable.pipe(inflate)
    })
  }

  const textParts: string[] = []
  const tagRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g
  const paraRegex = /<\/w:p>/g
  let match

  let processed = xml.replace(paraRegex, '\n')

  while ((match = tagRegex.exec(processed)) !== null) {
    textParts.push(match[1])
  }

  if (textParts.length === 0) {
    return processed
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  return textParts.join('').replace(/\n+/g, '\n').trim()
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
    .from('courses').select('id, title, category, difficulty')
    .eq('id', courseId).eq('creator_id', creator.id).single()
  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

  // Fetch uploaded files
  const { data: files } = await supabase
    .from('course_files').select('*').eq('course_id', courseId)
  if (!files || files.length === 0) {
    return NextResponse.json({ error: 'No files uploaded. Upload your course materials first.' }, { status: 400 })
  }

  // Check for unsupported file types
  const unsupported = files.filter(f => UNSUPPORTED_TYPES.includes(f.file_type))
  if (unsupported.length > 0 && unsupported.length === files.length) {
    const types = unsupported.map(f => f.file_name.split('.').pop()?.toUpperCase()).join(', ')
    return NextResponse.json({
      error: `${types} parsing coming soon. Please upload DOCX, CSV, or TXT files for now.`,
    }, { status: 400 })
  }

  // Parse file content
  let allContent = ''
  const DOCX_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

  for (const file of files) {
    if (UNSUPPORTED_TYPES.includes(file.file_type)) continue

    const { data: fileData, error: dlErr } = await supabase.storage
      .from('course-files').download(file.storage_path)
    if (dlErr || !fileData) continue

    let text = ''
    if (file.file_type === DOCX_TYPE || file.file_name.endsWith('.docx')) {
      try {
        const arrayBuffer = await fileData.arrayBuffer()
        text = await extractDocxText(arrayBuffer)
      } catch {
        text = `[Could not parse DOCX file: ${file.file_name}]`
      }
    } else {
      text = await fileData.text()
    }

    if (text.trim()) {
      allContent += `\n\n=== FILE: ${file.file_name} ===\n${text}`
    }
  }

  if (!allContent.trim()) {
    return NextResponse.json({ error: 'No readable content found in uploaded files' }, { status: 400 })
  }

  // Truncate to 60,000 characters
  const contentForAI = allContent.length > 60000 ? allContent.slice(0, 60000) : allContent

  // Call Claude API
  const anthropic = new Anthropic()

  let response
  try {
    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 32000,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Here is the course content to organize:\n\n${contentForAI}`,
      }],
    })
    response = await stream.finalMessage()
  } catch (apiErr) {
    const msg = apiErr instanceof Error ? apiErr.message : String(apiErr)
    return NextResponse.json({ error: `AI processing failed: ${msg}` }, { status: 500 })
  }

  const responseText = response.content[0].type === 'text' ? response.content[0].text : ''
  if (!responseText.trim()) {
    return NextResponse.json({ error: 'AI returned empty response' }, { status: 500 })
  }

  // Parse JSON from response
  let jsonText = responseText.trim()
  const fencedMatch = jsonText.match(/```(?:json)?\s*\n?([\s\S]*?)```/)
  if (fencedMatch) jsonText = fencedMatch[1].trim()

  const firstBrace = jsonText.indexOf('{')
  const lastBrace = jsonText.lastIndexOf('}')
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return NextResponse.json({ error: 'AI response did not contain valid JSON' }, { status: 500 })
  }
  jsonText = jsonText.slice(firstBrace, lastBrace + 1)

  let structure: {
    modules: Array<{
      title: string
      description?: string
      topics: Array<{
        title: string
        description?: string
        lessons: Array<{
          title: string
          source_excerpt: string
        }>
      }>
    }>
  }

  try {
    structure = JSON.parse(jsonText)
  } catch (parseErr) {
    const msg = parseErr instanceof Error ? parseErr.message : String(parseErr)
    return NextResponse.json({ error: `Failed to parse AI response: ${msg}` }, { status: 500 })
  }

  if (!structure.modules || structure.modules.length === 0) {
    return NextResponse.json({ error: 'AI returned no modules' }, { status: 500 })
  }

  // Insert into database
  const resultStructure: Array<{
    id: string
    title: string
    description: string
    topics: Array<{
      id: string
      title: string
      description: string
      lessons: Array<{ id: string; title: string }>
    }>
  }> = []
  const sourceMap: Record<string, string> = {}
  let modulesCreated = 0
  let topicsCreated = 0
  let lessonsCreated = 0

  for (let mi = 0; mi < structure.modules.length; mi++) {
    const mod = structure.modules[mi]

    const { data: dbModule } = await supabase.from('modules').insert({
      course_id: courseId,
      title: mod.title,
      description: mod.description || '',
      display_order: mi,
    }).select().single()

    if (!dbModule) continue
    modulesCreated++

    const moduleResult: typeof resultStructure[0] = {
      id: dbModule.id,
      title: dbModule.title,
      description: dbModule.description || '',
      topics: [],
    }

    for (let ti = 0; ti < (mod.topics || []).length; ti++) {
      const topic = mod.topics[ti]

      const { data: dbTopic } = await supabase.from('topics').insert({
        course_id: courseId,
        module_id: dbModule.id,
        title: topic.title,
        description: topic.description || '',
        display_order: ti,
      }).select().single()

      if (!dbTopic) continue
      topicsCreated++

      const topicResult: typeof moduleResult.topics[0] = {
        id: dbTopic.id,
        title: dbTopic.title,
        description: dbTopic.description || '',
        lessons: [],
      }

      for (let li = 0; li < (topic.lessons || []).length; li++) {
        const lesson = topic.lessons[li]

        const { data: dbLesson } = await supabase.from('lessons').insert({
          course_id: courseId,
          module_id: dbModule.id,
          topic_id: dbTopic.id,
          title: lesson.title,
          display_order: li,
          body: '',
          concept_cards: [],
        }).select().single()

        if (!dbLesson) continue
        lessonsCreated++

        topicResult.lessons.push({ id: dbLesson.id, title: dbLesson.title })

        if (lesson.source_excerpt) {
          sourceMap[dbLesson.id] = lesson.source_excerpt
        }
      }

      moduleResult.topics.push(topicResult)
    }

    resultStructure.push(moduleResult)
  }

  return NextResponse.json({
    success: true,
    modules_created: modulesCreated,
    topics_created: topicsCreated,
    lessons_created: lessonsCreated,
    structure: resultStructure,
    source_map: sourceMap,
  })
}
