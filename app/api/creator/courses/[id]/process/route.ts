import { getApiUser } from '@/lib/supabase/get-user-api'
import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

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
    .from('courses').select('id, title, category, difficulty').eq('id', courseId).eq('creator_id', creator.id).single()
  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

  // Clean up old failed/complete jobs so status endpoint returns the new one
  await supabase
    .from('processing_jobs')
    .delete()
    .eq('course_id', courseId)
    .in('status', ['failed', 'complete'])

  // Check for existing active job (prevent duplicates)
  const { data: existingJob } = await supabase
    .from('processing_jobs')
    .select('id, status')
    .eq('course_id', courseId)
    .in('status', ['pending', 'processing'])
    .limit(1)
    .maybeSingle()

  if (existingJob) {
    return NextResponse.json({
      process_id: existingJob.id,
      status: 'already_running',
      started_at: new Date().toISOString(),
    })
  }

  // Check for uploaded files
  const { data: files } = await supabase
    .from('course_files').select('*').eq('course_id', courseId)
  if (!files || files.length === 0) {
    return NextResponse.json({ error: 'No files to process' }, { status: 400 })
  }

  // Create processing job
  const initialSteps = [
    { name: 'Parsing uploaded files', status: 'pending' },
    { name: 'Analyzing content structure', status: 'pending' },
    { name: 'Generating modules and topics', status: 'pending' },
    { name: 'Generating questions and guidebook content', status: 'pending' },
    { name: 'Quality check', status: 'pending' },
  ]

  const { data: job, error: jobErr } = await supabase
    .from('processing_jobs').insert({
      course_id: courseId, creator_id: creator.id,
      status: 'pending', progress: 0, steps: initialSteps,
    }).select().single()

  if (jobErr) {
    return NextResponse.json({ error: `Failed to create job: ${jobErr.message}` }, { status: 500 })
  }

  // Fire-and-forget background processing
  processInBackground(job.id, courseId, creator.id, course.title, course.category, files).catch(console.error)

  return NextResponse.json({
    process_id: job.id,
    status: 'started',
    started_at: new Date().toISOString(),
  })
}

// ============================================================
// System prompt — matches workbench-tested prompt
// ============================================================
const SYSTEM_PROMPT = `You are the OpenED content processing engine. Your role is to transform raw educational content into a structured course format following the OpenED schema.

## Task Overview

You will analyze the raw educational content and transform it into a structured course with modules, topics, guidebook content, and practice questions. You will also identify gaps and generate supplemental content where needed, clearly marking all AI-generated material so creators can review and approve it.

## Content Structure

Every course follows this hierarchy:

**Course → Module → Topic → (Guidebook Content + Questions)**

- **Module**: A major division (like an exam domain or textbook chapter)
- **Topic**: A specific concept within a module (like a sub-objective or lesson)
- **Each Topic contains**:
  - \`guidebook_content\`: Teaching material formatted in markdown (definitions, explanations, frameworks, tips)
  - \`questions\`: Practice questions in structured format

## Processing Workflow

Here is a flowchart showing the complete processing workflow you should follow:

\`\`\`mermaid
flowchart TD
    A[Receive Raw Educational Content] --> B[Step 1: Classify Content]
    B --> C{Content Type?}
    C -->|Educational Material| D[Educational Content Pool]
    C -->|Questions| E[Questions Pool]
    C -->|Mixed| F[Split into Both Pools]
    F --> D
    F --> E

    D --> G[Step 2: Organize into Modules/Topics]
    E --> G

    G --> H{Known Certification Structure?}
    H -->|Yes| I[Use Official Structure]
    H -->|No| J[Analyze Subject Matter & Create Logical Structure]
    I --> K[Assign Display Orders]
    J --> K

    K --> L[Step 3: Format Educational Material]
    L --> M[Preserve Creator's Words]
    M --> N[Format as Markdown]
    N --> O[Place in guidebook_content]

    K --> P[Step 4: Parse Questions]
    P --> Q[Determine question_type]
    Q --> R[Extract/Generate Options]
    R --> S[Identify Correct Answers]
    S --> T[Extract/Generate Explanations]
    T --> U[Assign Difficulty 1-5]
    U --> V[Add Relevant Tags]

    O --> W[Step 5: Gap Analysis]
    V --> W

    W --> X{Topic has <10 questions?}
    X -->|Yes| Y[Generate Questions to Reach 10]
    X -->|No| Z[Continue]
    Y --> AA[Mark as ai_generated]
    AA --> Z

    Z --> AB{Topic has questions but no guidebook?}
    AB -->|Yes| AC[Generate Guidebook Content]
    AB -->|No| AD[Continue]
    AC --> AE[Mark guidebook_ai_generated: true]
    AE --> AD

    AD --> AF{Questions missing explanations?}
    AF -->|Yes| AG[Generate Explanations]
    AF -->|No| AH[Continue]
    AG --> AI[Mark as ai_enhanced]
    AI --> AH

    AH --> AJ[Step 6: Validate & Flag Issues]
    AJ --> AK[Check for no correct answer]
    AK --> AL[Check for duplicates]
    AL --> AM[Check for thin topics]
    AM --> AN[Check for copyright concerns]
    AN --> AO[Check for possible multi_select]

    AO --> AP[Generate Final JSON Output]
\`\`\`

## Detailed Step-by-Step Instructions

### Step 1: Classify Each Piece of Content

Examine each section of the educational content and determine whether it is:
- **EDUCATIONAL MATERIAL**: Explanations, definitions, concepts, frameworks, study notes, teaching content
- **QUESTIONS**: Practice questions, quizzes, exam questions, Q&A pairs

### Step 2: Organize into Modules and Topics

- Group related content into logical modules
- Within each module, group content into specific topics
- If the content maps to a known certification or standard (e.g., CompTIA Security+ SY0-701 domains), use the official structure
- If no official structure exists, propose a logical organization based on subject matter
- If the creator has already organized their content, respect their organization
- Assign a \`display_order\` to each module and topic (starting from 1)

### Step 3: Format Educational Material as Guidebook Content

For all content you classified as EDUCATIONAL MATERIAL:

**Critical: DO NOT rewrite, rephrase, or alter the educational content**

- Format the content cleanly in markdown
- Organize key concepts as **bold term** + definition pairs where appropriate
- Add section headers (using ## or ###) if the source material lacks them
- Preserve the creator's voice and explanations exactly as written
- Place the formatted content in the appropriate topic's \`guidebook_content\` field

### Step 4: Parse Questions into Structured Format

For all content you classified as QUESTIONS, parse each question into this exact structure:

\`\`\`json
{
  "question_text": "The full question stem",
  "question_type": "multiple_choice | multiple_select | true_false",
  "options": [
    { "id": "a", "text": "Option text", "is_correct": false },
    { "id": "b", "text": "Option text", "is_correct": true },
    { "id": "c", "text": "Option text", "is_correct": false },
    { "id": "d", "text": "Option text", "is_correct": false }
  ],
  "correct_option_ids": ["b"],
  "explanation": "Why the correct answer is correct",
  "difficulty": 3,
  "tags": ["relevant", "topic", "tags"],
  "source": "creator_original | ai_generated | ai_enhanced"
}
\`\`\`

**Question Type Classification Rules:**
- \`multiple_choice\`: Exactly one correct answer out of 2-6 options
- \`multiple_select\`: Two or more correct answers (look for phrases like "select all that apply", "choose two", etc.)
- \`true_false\`: Binary true/false or yes/no questions
- If a question is open-ended Q&A with no predefined options, convert it to \`multiple_choice\` by generating 3 plausible incorrect options based on the subject matter

**Difficulty Scale:**
- **1**: Pure recall (define a term, name a concept)
- **2**: Basic understanding (explain what something does)
- **3**: Application (apply a concept to a scenario)
- **4**: Analysis (compare options, evaluate tradeoffs)
- **5**: Synthesis (complex scenarios requiring multiple concepts)

**Source Field:**
- \`creator_original\`: Question from the original content with its original explanation
- \`ai_generated\`: Entirely AI-generated question
- \`ai_enhanced\`: Original question from creator, but explanation was generated by AI

### Step 5: Generate Supplemental Content for Gaps

After organizing all creator content, check each topic for gaps:

**Thin Question Sets (fewer than 10 questions per topic):**
- Generate additional questions to bring the topic to at least 10 questions
- Match the style, difficulty distribution, and subject focus of the creator's existing questions
- Mark every generated question with \`"source": "ai_generated"\`

**Missing Guidebook Content (topic has questions but no educational material):**
- Generate a guidebook entry covering the key concepts tested by the topic's questions
- Include: an overview paragraph, key terms as **bold term** + definition pairs, and an exam/study tip
- Mark the topic with \`"guidebook_ai_generated": true\`

**Missing Explanations (questions with no explanation):**
- Generate a clear, educational explanation for each question that lacks one
- Mark these questions with \`"source": "ai_enhanced"\` (original question, AI explanation)

**Important**: All AI-generated content must be clearly labeled so the creator can review, edit, approve, or reject each piece individually.

### Step 6: Validate and Flag Issues

Check for the following issues and add warnings for any that you find:
- Questions with no clear correct answer
- Questions with multiple possible correct answers (may need to be \`multiple_select\` instead)
- Duplicate or near-duplicate questions
- Topics with fewer than 10 questions (thin content warning, even after AI generation)
- Educational material that appears to be copied verbatim from a copyrighted source

## Output Format

Return ONLY valid JSON with NO preamble, NO explanation, and NO markdown code fences. Your entire response must be a single JSON object.

The JSON must follow this exact structure:

\`\`\`json
{
  "course_analysis": {
    "total_educational_sections": 0,
    "total_questions_parsed": 0,
    "total_questions_generated": 0,
    "total_guidebooks_generated": 0,
    "total_explanations_generated": 0,
    "modules_identified": 0,
    "topics_identified": 0,
    "content_types_detected": ["educational", "questions"],
    "organization_basis": "official_certification_structure | subject_matter_analysis | creator_provided"
  },
  "modules": [
    {
      "title": "Module Title",
      "description": "Brief description of what this module covers",
      "weight_percent": null,
      "display_order": 1,
      "topics": [
        {
          "title": "Topic Title",
          "description": "Brief description of this topic",
          "display_order": 1,
          "guidebook_content": "# Topic Title\\n\\nEducational content in markdown format...",
          "guidebook_ai_generated": false,
          "questions": [
            {
              "question_text": "Sample question text?",
              "question_type": "multiple_choice",
              "options": [
                {"id": "a", "text": "Option A text", "is_correct": false},
                {"id": "b", "text": "Option B text", "is_correct": true},
                {"id": "c", "text": "Option C text", "is_correct": false},
                {"id": "d", "text": "Option D text", "is_correct": false}
              ],
              "correct_option_ids": ["b"],
              "explanation": "Explanation of why B is correct",
              "difficulty": 3,
              "tags": ["sample", "topic"],
              "source": "creator_original"
            }
          ]
        }
      ]
    }
  ],
  "warnings": [
    {
      "type": "thin_topic | duplicate_question | no_correct_answer | possible_multi_select | copyright_concern",
      "message": "Human-readable description of the issue",
      "location": "Module X > Topic Y > Question Z"
    }
  ],
  "unclassified": []
}
\`\`\`

## Critical Rules

- **NEVER alter educational content**: Format it and organize it, but preserve the creator's exact words
- **ALWAYS provide an explanation** for every question, even if you must generate one
- **ALWAYS assign** \`difficulty\`, \`tags\`, and \`question_type\` to every question
- **ALWAYS generate supplemental questions** for topics with fewer than 10 questions, matching the creator's style
- **ALWAYS generate guidebook content** for topics that have questions but no educational material
- **ALWAYS mark AI-generated content clearly** with appropriate source fields so creators can identify every AI contribution
- **If content maps to a known certification**, use the official domain/objective structure
- **If content doesn't map to a known structure**, propose logical groupings based on subject matter
- **If the creator has already organized their content**, respect their organization

Begin processing the educational content now. Output ONLY the raw JSON object.`

/**
 * Extract plain text from a DOCX file (which is a ZIP containing XML).
 * Uses Node.js built-in zlib — no external dependencies needed.
 */
async function extractDocxText(arrayBuffer: ArrayBuffer): Promise<string> {
  const { Readable } = await import('stream')
  const { createInflateRaw } = await import('zlib')

  const buffer = Buffer.from(arrayBuffer)

  // DOCX is a ZIP file. We need to find word/document.xml inside it.
  // Minimal ZIP parser — find local file headers and extract.
  const entries: Array<{ name: string; compressedData: Buffer; compressionMethod: number }> = []
  let offset = 0

  while (offset < buffer.length - 4) {
    // Local file header signature: 0x04034b50
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

  // Find word/document.xml
  const docEntry = entries.find(e => e.name === 'word/document.xml')
  if (!docEntry) return '[No document.xml found in DOCX]'

  // Decompress if needed
  let xml: string
  if (docEntry.compressionMethod === 0) {
    // Stored (no compression)
    xml = docEntry.compressedData.toString('utf8')
  } else {
    // Deflate
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

  // Strip XML tags, extract text from <w:t> elements
  const textParts: string[] = []
  const tagRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g
  const paraRegex = /<\/w:p>/g
  let match

  // Replace paragraph endings with newlines first
  let processed = xml.replace(paraRegex, '\n')

  while ((match = tagRegex.exec(processed)) !== null) {
    textParts.push(match[1])
  }

  // If regex didn't work (different namespace), fallback to stripping all XML tags
  if (textParts.length === 0) {
    return processed
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  return textParts.join('').replace(/\n+/g, '\n').trim()
}

async function processInBackground(
  jobId: string, courseId: string, creatorId: string,
  courseTitle: string, courseCategory: string,
  files: Array<{ id: string; file_name: string; file_type: string; storage_path: string }>
) {
  const supabase = await createServiceClient()

  const updateJob = async (updates: Record<string, unknown>) => {
    await supabase.from('processing_jobs').update(updates).eq('id', jobId)
  }

  const updateStep = async (stepIndex: number, status: string, progress: number) => {
    const { data: job } = await supabase.from('processing_jobs').select('steps').eq('id', jobId).single()
    const steps = (job?.steps as Array<{ name: string; status: string }>) || []
    if (steps[stepIndex]) steps[stepIndex].status = status
    await updateJob({ steps, progress, current_step: steps[stepIndex]?.name, status: 'processing' })
  }

  try {
    await updateJob({ status: 'processing', started_at: new Date().toISOString() })

    // Clean up any data from previous failed processing attempts
    await supabase.from('questions').delete().eq('course_id', courseId)
    await supabase.from('topics').delete().eq('course_id', courseId)
    await supabase.from('modules').delete().eq('course_id', courseId)

    // ── Step 1: Parse uploaded files ──
    await updateStep(0, 'in_progress', 5)
    let allContent = ''

    for (const file of files) {
      console.log(`[Process] Downloading file: ${file.file_name} (${file.file_type})`)
      const { data: fileData, error: dlErr } = await supabase.storage
        .from('course-files').download(file.storage_path)
      if (dlErr || !fileData) {
        console.error(`[Process] Failed to download ${file.file_name}:`, dlErr?.message)
        continue
      }
      console.log(`[Process] Downloaded ${file.file_name}: ${fileData.size} bytes`)

      let text = ''
      const DOCX_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

      if (file.file_type === DOCX_TYPE || file.file_name.endsWith('.docx')) {
        // DOCX is a ZIP — extract text from word/document.xml
        try {
          const arrayBuffer = await fileData.arrayBuffer()
          text = await extractDocxText(arrayBuffer)
        } catch (e) {
          console.error(`[Process] Failed to parse DOCX ${file.file_name}:`, e)
          text = `[Could not parse DOCX file: ${file.file_name}]`
        }
      } else {
        text = await fileData.text()
      }

      console.log(`[Process] Extracted ${text.length} chars from ${file.file_name}`)
      console.log(`[Process] First 200 chars: ${text.slice(0, 200)}`)

      if (file.file_type === 'text/csv') {
        allContent += `\n\n=== CSV FILE: ${file.file_name} ===\n${text}`
      } else {
        allContent += `\n\n=== FILE: ${file.file_name} ===\n${text}`
      }

      await supabase.from('course_files').update({ status: 'processed' }).eq('id', file.id)
    }

    if (!allContent.trim()) {
      throw new Error('No readable content found in uploaded files')
    }

    await updateStep(0, 'complete', 15)

    // ── Step 2: Send to Claude with full system prompt ──
    await updateStep(1, 'in_progress', 20)

    const anthropic = new Anthropic()

    // Truncate if extremely large (Claude context limit)
    const contentForAI = allContent.length > 80000 ? allContent.slice(0, 80000) : allContent

    const userMessage = `Process the following educational content for the course "${courseTitle}" (category: ${courseCategory}).

${contentForAI}`

    console.log(`[Process] Total content for AI: ${contentForAI.length} chars`)
    console.log(`[Process] User message length: ${userMessage.length} chars`)

    // Use streaming to avoid 10-minute timeout on long requests
    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 64000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })

    console.log('[Process] Waiting for Claude streaming response...')
    let response
    try {
      response = await stream.finalMessage()
    } catch (apiErr) {
      const msg = apiErr instanceof Error ? apiErr.message : String(apiErr)
      console.error('[Process] Claude API call failed:', msg)
      throw new Error(`Claude API error: ${msg}`)
    }

    const responseText = response.content[0].type === 'text' ? response.content[0].text : ''
    console.log(`[Process] Claude response received: ${responseText.length} chars, stop_reason: ${response.stop_reason}`)
    console.log(`[Process] Response first 300 chars: ${responseText.slice(0, 300)}`)
    console.log(`[Process] Response last 300 chars: ${responseText.slice(-300)}`)

    if (response.stop_reason === 'max_tokens') {
      console.warn('[Process] Claude response was truncated — output hit max_tokens limit')
    }

    if (!responseText.trim()) {
      throw new Error('Claude returned empty response')
    }

    await updateStep(1, 'complete', 40)

    // ── Step 3: Parse response and insert modules/topics ──
    await updateStep(2, 'in_progress', 45)

    // Try to extract JSON — handle markdown code fences, preamble text, etc.
    let jsonText = responseText.trim()

    // Strip markdown code fences if present
    const fencedMatch = jsonText.match(/```(?:json)?\s*\n?([\s\S]*?)```/)
    if (fencedMatch) {
      jsonText = fencedMatch[1].trim()
      console.log('[Process] Stripped markdown code fences')
    }

    // If there's preamble text before the JSON, find the first {
    const firstBrace = jsonText.indexOf('{')
    const lastBrace = jsonText.lastIndexOf('}')
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      console.error('[Process] No JSON object found in response')
      console.error('[Process] Full response:', responseText.slice(0, 2000))
      throw new Error('Failed to parse structured course data — no JSON object in AI response')
    }
    jsonText = jsonText.slice(firstBrace, lastBrace + 1)
    console.log(`[Process] JSON extracted: ${jsonText.length} chars (braces at ${firstBrace}..${lastBrace})`)

    let structure: {
      course_analysis?: Record<string, unknown>
      modules: Array<{
        title: string
        description?: string
        weight_percent?: number
        display_order?: number
        topics: Array<{
          title: string
          description?: string
          display_order?: number
          guidebook_content?: string
          questions?: Array<{
            question_text: string
            question_type?: string
            options: Array<{ id: string; text: string }>
            correct_option_ids: string[]
            explanation?: string
            difficulty?: number
            tags?: string[]
          }>
        }>
      }>
    }

    try {
      structure = JSON.parse(jsonText)
    } catch (parseErr) {
      const msg = parseErr instanceof Error ? parseErr.message : String(parseErr)
      console.error('[Process] JSON parse error:', msg)
      console.error('[Process] JSON text first 500 chars:', jsonText.slice(0, 500))
      console.error('[Process] JSON text last 500 chars:', jsonText.slice(-500))
      throw new Error(`AI returned invalid JSON: ${msg}`)
    }

    if (!structure.modules || structure.modules.length === 0) {
      throw new Error('AI returned no modules')
    }

    // Insert modules and topics into database
    let totalQuestionsCreated = 0
    let globalTopicOrder = 0

    for (let mi = 0; mi < structure.modules.length; mi++) {
      const mod = structure.modules[mi]

      const { data: dbModule } = await supabase.from('modules').insert({
        course_id: courseId,
        title: mod.title,
        description: mod.description || '',
        weight_percent: mod.weight_percent || Math.round(100 / structure.modules.length),
        display_order: mod.display_order ?? mi,
      }).select().single()

      if (!dbModule) continue

      for (let ti = 0; ti < (mod.topics || []).length; ti++) {
        const topic = mod.topics[ti]

        const { data: dbTopic } = await supabase.from('topics').insert({
          module_id: dbModule.id,
          course_id: courseId,
          title: topic.title,
          description: topic.description || '',
          guidebook_content: topic.guidebook_content || '',
          display_order: topic.display_order ?? globalTopicOrder,
        }).select().single()

        globalTopicOrder++
        if (!dbTopic) continue

        // Insert questions for this topic
        const questions = topic.questions || []
        for (const q of questions) {
          // Validate question has minimum required fields
          if (!q.question_text || !q.options || q.options.length < 2 || !q.correct_option_ids?.length) {
            continue
          }

          // Determine question type
          let questionType = q.question_type || 'multiple_choice'
          if (questionType === 'true_false' && q.options.length !== 2) {
            questionType = 'multiple_choice'
          }
          if (q.correct_option_ids.length > 1 && questionType !== 'multiple_select' && questionType !== 'ordering') {
            questionType = 'multiple_select'
          }

          // Strip is_correct from options (our schema uses correct_option_ids)
          const cleanOptions = q.options.map(o => ({ id: o.id, text: o.text }))

          await supabase.from('questions').insert({
            topic_id: dbTopic.id,
            module_id: dbModule.id,
            course_id: courseId,
            creator_id: creatorId,
            question_text: q.question_text,
            question_type: questionType,
            options: cleanOptions,
            correct_option_ids: q.correct_option_ids,
            explanation: q.explanation || '',
            difficulty: Math.min(5, Math.max(1, q.difficulty || 3)),
            tags: q.tags || [],
            source: 'ai_generated',
          })
          totalQuestionsCreated++
        }
      }
    }

    console.log(`[Process] Inserted ${structure.modules.length} modules, ${globalTopicOrder} topics, ${totalQuestionsCreated} questions`)
    await updateStep(2, 'complete', 75)

    // ── Step 4: Check if we need more questions ──
    await updateStep(3, 'in_progress', 80)

    // Count what we have per topic and generate more if needed
    const { data: allTopics } = await supabase
      .from('topics')
      .select('id, title, module_id')
      .eq('course_id', courseId)

    if (allTopics && totalQuestionsCreated < (allTopics.length * 10)) {
      // Some topics may need more questions — generate supplemental
      for (const topic of allTopics) {
        const { count } = await supabase
          .from('questions')
          .select('*', { count: 'exact', head: true })
          .eq('topic_id', topic.id)

        const needed = 10 - (count || 0)
        if (needed <= 0) continue

        try {
          const supStream = anthropic.messages.stream({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 8192,
            system: SYSTEM_PROMPT,
            messages: [{
              role: 'user',
              content: `Generate exactly ${needed} additional questions for the topic "${topic.title}" in the course "${courseTitle}" (category: ${courseCategory}).

Return ONLY a JSON array of question objects (not wrapped in any other structure):
[
  {
    "question_text": "...",
    "question_type": "multiple_choice",
    "options": [{"id": "a", "text": "..."}, {"id": "b", "text": "..."}, {"id": "c", "text": "..."}, {"id": "d", "text": "..."}],
    "correct_option_ids": ["a"],
    "explanation": "...",
    "difficulty": 3,
    "tags": ["tag"]
  }
]`
            }],
          })

          const supplementResponse = await supStream.finalMessage()
          const supText = supplementResponse.content[0].type === 'text' ? supplementResponse.content[0].text : '[]'
          const supMatch = supText.match(/\[[\s\S]*\]/)
          if (supMatch) {
            const extraQs = JSON.parse(supMatch[0])
            for (const q of extraQs) {
              if (!q.question_text || !q.options || !q.correct_option_ids?.length) continue
              const cleanOptions = q.options.map((o: { id: string; text: string }) => ({ id: o.id, text: o.text }))
              await supabase.from('questions').insert({
                topic_id: topic.id, module_id: topic.module_id, course_id: courseId,
                creator_id: creatorId, question_text: q.question_text,
                question_type: q.question_type || 'multiple_choice',
                options: cleanOptions, correct_option_ids: q.correct_option_ids,
                explanation: q.explanation || '', difficulty: Math.min(5, Math.max(1, q.difficulty || 3)),
                tags: q.tags || [], source: 'ai_generated',
              })
              totalQuestionsCreated++
            }
          }
        } catch (e) {
          console.error(`Supplemental generation failed for topic ${topic.title}:`, e)
        }
      }
    }

    await updateStep(3, 'complete', 90)

    // ── Step 5: Quality check ──
    await updateStep(4, 'in_progress', 92)

    const [{ count: moduleCount }, { count: topicCount }, { count: questionCount }] = await Promise.all([
      supabase.from('modules').select('*', { count: 'exact', head: true }).eq('course_id', courseId),
      supabase.from('topics').select('*', { count: 'exact', head: true }).eq('course_id', courseId),
      supabase.from('questions').select('*', { count: 'exact', head: true }).eq('course_id', courseId),
    ])

    let flaggedItems = 0
    let warnings = 0
    if ((questionCount || 0) < 50) warnings++
    if ((topicCount || 0) < 3) warnings++

    // Check for topics with fewer than 10 questions
    if (allTopics) {
      for (const topic of allTopics) {
        const { count } = await supabase
          .from('questions')
          .select('*', { count: 'exact', head: true })
          .eq('topic_id', topic.id)
        if ((count || 0) < 10) flaggedItems++
      }
    }

    const result = {
      modules_created: moduleCount || 0,
      topics_created: topicCount || 0,
      questions_generated: questionCount || 0,
      flagged_items: flaggedItems,
      warnings,
    }

    await updateStep(4, 'complete', 100)
    await updateJob({
      status: 'complete', progress: 100, result,
      completed_at: new Date().toISOString(),
    })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    const stack = err instanceof Error ? err.stack : ''
    console.error('[Process] FAILED:', message)
    console.error('[Process] Stack:', stack)
    await updateJob({ status: 'failed', error: message })
  }
}
