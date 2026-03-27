import { NextRequest, NextResponse } from 'next/server'
import { getCreatorCourse } from '@/lib/supabase/get-creator-course'
import Anthropic from '@anthropic-ai/sdk'

const SYSTEM_PROMPT = `You are an expert course builder for an online learning platform.

Given raw educational content, organize it into a structured course.

Output a JSON object with this exact structure:
{
  "modules": [
    {
      "title": "Module title",
      "lessons": [
        {
          "title": "Lesson title",
          "body": "Markdown content with ## headings for card sections.\\nEach ## heading becomes a separate card in the learner view.\\nInclude all relevant content from the source material.\\nUse > blockquotes for key concept callouts."
        }
      ]
    }
  ]
}

Rules:
- Create logical modules that group related topics (2-6 modules)
- Each lesson covers one coherent topic (2-8 lessons per module)
- Use ## headings to break lessons into sections (3-7 per lesson)
- Each section should be 50-200 words
- PRESERVE the source material content accurately - do NOT invent facts
- If the content has existing structure (headings, chapters), respect it
- Write in clear, direct language appropriate for learners
- Use > blockquotes for important definitions or key concepts
- Do NOT generate practice questions - creators add those
- Respond ONLY with the JSON object, no preamble or markdown fences`

const YOUTUBE_SYSTEM_PROMPT = `You are an expert course builder. Convert this YouTube video transcript into a structured lesson with ## section headings.

Output a JSON object:
{
  "modules": [
    {
      "title": "Module title",
      "lessons": [
        {
          "title": "Lesson title (from video title)",
          "body": "Markdown with ## headings for topic sections.\\nInclude [video:MM:SS] markers for where each section starts in the original video.",
          "video_url": "full YouTube URL"
        }
      ]
    }
  ]
}

Rules:
- Create 3-7 ## sections per lesson based on natural topic breaks
- Each section: 50-200 words SUMMARIZING that part of the video
- Do NOT transcribe verbatim - summarize and restructure for reading
- Use [video:MM:SS] at the start of each section to mark the timestamp
- Preserve all key concepts and terminology from the speaker
- Write in clear, educational prose (not conversational transcript style)
- Use > blockquotes for key definitions or important points
- Do NOT generate questions
- Respond ONLY with JSON`

export interface StructuredCourse {
  modules: Array<{
    title: string
    lessons: Array<{
      title: string
      body: string
      video_url?: string
    }>
  }>
}

/**
 * POST /api/creator/courses/[id]/import/structure
 * Sends extracted text to Claude API, returns structured course JSON.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { error } = await getCreatorCourse(id)
    if (error) return error

    const body = await request.json()
    const { text, course_title, category, import_type } = body

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 })
    }

    // Truncate to 60K characters for token limits
    const contentForAI = text.length > 60000 ? text.slice(0, 60000) : text

    const isYouTube = import_type === 'youtube'
    const systemPrompt = isYouTube ? YOUTUBE_SYSTEM_PROMPT : SYSTEM_PROMPT

    const userPrompt = isYouTube
      ? `Structure the following YouTube transcript into a course lesson:\n\n${contentForAI}`
      : `Structure the following content into an online course:\n\nCourse title: ${course_title || 'Untitled'}\nCategory: ${category || 'General'}\n\n--- SOURCE CONTENT ---\n${contentForAI}\n--- END ---`

    // Call Claude API
    const anthropic = new Anthropic()

    let response
    try {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 16000,
        temperature: 0.3,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      })
      response = message
    } catch (apiErr) {
      const msg = apiErr instanceof Error ? apiErr.message : String(apiErr)
      console.error('Claude API error:', msg)
      return NextResponse.json({ error: 'Content structuring failed. Please try again.' }, { status: 502 })
    }

    const responseText = response.content[0].type === 'text' ? response.content[0].text : ''
    if (!responseText.trim()) {
      return NextResponse.json({ error: 'AI returned empty response' }, { status: 502 })
    }

    // Parse JSON from response (handle fenced code blocks)
    let jsonText = responseText.trim()
    const fencedMatch = jsonText.match(/```(?:json)?\s*\n?([\s\S]*?)```/)
    if (fencedMatch) jsonText = fencedMatch[1].trim()

    const firstBrace = jsonText.indexOf('{')
    const lastBrace = jsonText.lastIndexOf('}')
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      return NextResponse.json({ error: 'AI response did not contain valid JSON' }, { status: 502 })
    }
    jsonText = jsonText.slice(firstBrace, lastBrace + 1)

    let structure: StructuredCourse
    try {
      structure = JSON.parse(jsonText)
    } catch {
      // Retry once with a repair prompt
      try {
        const repair = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 16000,
          temperature: 0,
          messages: [{
            role: 'user',
            content: `The following JSON is malformed. Fix it and return ONLY valid JSON:\n\n${jsonText}`,
          }],
        })
        const repairText = repair.content[0].type === 'text' ? repair.content[0].text : ''
        const repairBrace1 = repairText.indexOf('{')
        const repairBrace2 = repairText.lastIndexOf('}')
        if (repairBrace1 >= 0 && repairBrace2 > repairBrace1) {
          structure = JSON.parse(repairText.slice(repairBrace1, repairBrace2 + 1))
        } else {
          return NextResponse.json({ error: 'Structuring failed. Please try again.' }, { status: 502 })
        }
      } catch {
        return NextResponse.json({ error: 'Structuring failed. Please try again.' }, { status: 502 })
      }
    }

    if (!structure.modules || structure.modules.length === 0) {
      return NextResponse.json({ error: 'Could not structure this content' }, { status: 502 })
    }

    // Validate: ensure every lesson has a body
    for (const mod of structure.modules) {
      if (!mod.lessons) mod.lessons = []
      for (const lesson of mod.lessons) {
        if (!lesson.body) lesson.body = ''
      }
    }

    return NextResponse.json({ structure })
  } catch (err) {
    console.error('POST /import/structure error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
