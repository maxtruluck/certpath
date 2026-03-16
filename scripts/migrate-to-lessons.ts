/**
 * One-time migration script: Convert existing topic_content_blocks → lessons
 *
 * For each topic that has content blocks or questions:
 * 1. Create one lesson titled "{topic_title} — Overview"
 * 2. Concatenate all content blocks into the lesson body as markdown
 * 3. Update all questions for that topic to set lesson_id = the new lesson's ID
 * 4. Keep topic_id on questions unchanged (FSRS still queries by topic_id)
 *
 * Usage: npx tsx scripts/migrate-to-lessons.ts
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface ContentBlock {
  id: string
  block_type: string
  title: string | null
  content: string
  display_order: number
  media_url?: string | null
  media_type?: string | null
}

function blocksToMarkdown(blocks: ContentBlock[]): string {
  return blocks
    .sort((a, b) => a.display_order - b.display_order)
    .map((block) => {
      let md = ''
      if (block.title && block.block_type !== 'code' && block.block_type !== 'code_block')
        md += `### ${block.title}\n\n`

      // Handle image blocks
      if (block.block_type === 'image' && block.media_url) {
        md += `![${block.content || ''}](${block.media_url})`
        return md
      }

      // Handle video blocks
      if (block.block_type === 'video' && block.media_url) {
        md += block.media_url
        if (block.content) md += `\n\n${block.content}`
        return md
      }

      if (block.block_type === 'exam_tip') md += `> **Exam Tip:** `
      if (block.block_type === 'key_takeaway') md += `> **Key Takeaway:** `
      if (block.block_type === 'definition') md += `> **Definition:** `
      if (block.block_type === 'code' || block.block_type === 'code_block')
        md += `\`\`\`${block.title || ''}\n`
      md += block.content
      if (block.block_type === 'code' || block.block_type === 'code_block') md += `\n\`\`\``
      return md
    })
    .join('\n\n')
}

async function main() {
  console.log('Starting migration: topic_content_blocks → lessons\n')

  // 1. Fetch all topics
  const { data: topics, error: topicsError } = await supabase
    .from('topics')
    .select('id, title, course_id, module_id')
    .order('display_order')

  if (topicsError) {
    console.error('Failed to fetch topics:', topicsError)
    process.exit(1)
  }

  let lessonsCreated = 0
  let questionsLinked = 0
  let topicsMigrated = 0

  for (const topic of topics || []) {
    // Fetch content blocks for this topic
    // Skip topics that already have lessons with content (idempotency)
    const { data: existingLessons } = await supabase
      .from('lessons')
      .select('id, body')
      .eq('topic_id', topic.id)

    const hasExistingContent = existingLessons && existingLessons.some((l: any) => l.body && l.body.trim().length > 0)
    if (hasExistingContent) {
      console.log(`  [skip] ${topic.title}: already has lessons with content`)
      continue
    }

    const { data: blocks } = await supabase
      .from('topic_content_blocks')
      .select('id, block_type, title, content, display_order, media_url, media_type')
      .eq('topic_id', topic.id)
      .order('display_order')

    // Fetch questions for this topic that have no lesson_id
    const { data: questions } = await supabase
      .from('questions')
      .select('id')
      .eq('topic_id', topic.id)
      .is('lesson_id', null)

    const hasBlocks = blocks && blocks.length > 0
    const hasQuestions = questions && questions.length > 0

    if (!hasBlocks && !hasQuestions) continue

    // Create a lesson for this topic
    const body = hasBlocks ? blocksToMarkdown(blocks as ContentBlock[]) : ''

    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .insert({
        topic_id: topic.id,
        course_id: topic.course_id,
        module_id: topic.module_id,
        title: `${topic.title} — Overview`,
        body,
        display_order: 0,
      })
      .select('id')
      .single()

    if (lessonError) {
      console.error(`  Failed to create lesson for topic "${topic.title}":`, lessonError.message)
      continue
    }

    lessonsCreated++

    // Link questions to this lesson
    if (hasQuestions) {
      const questionIds = questions.map((q: { id: string }) => q.id)
      const { error: updateError, count } = await supabase
        .from('questions')
        .update({ lesson_id: lesson.id })
        .in('id', questionIds)

      if (updateError) {
        console.error(`  Failed to link questions for topic "${topic.title}":`, updateError.message)
      } else {
        questionsLinked += questionIds.length
      }
    }

    topicsMigrated++
    console.log(
      `  [done] ${topic.title}: lesson created, ${blocks?.length || 0} blocks -> markdown, ${questions?.length || 0} questions linked`
    )
  }

  console.log(`\nMigration complete:`)
  console.log(`  Topics migrated: ${topicsMigrated}`)
  console.log(`  Lessons created: ${lessonsCreated}`)
  console.log(`  Questions linked: ${questionsLinked}`)
}

main().catch(console.error)
