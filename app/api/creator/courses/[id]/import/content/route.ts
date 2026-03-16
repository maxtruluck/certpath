import { NextRequest, NextResponse } from 'next/server'
import { getCreatorCourse } from '@/lib/supabase/get-creator-course'
import Papa from 'papaparse'

const VALID_BLOCK_TYPES = [
  'concept', 'definition', 'example', 'exam_tip',
  'key_takeaway', 'code_block', 'summary', 'note',
]

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

    // Build topic lookup by title
    const { data: topics } = await supabase
      .from('topics')
      .select('id, title')
      .eq('course_id', id)

    const topicByTitle = new Map<string, string>()
    for (const t of topics || []) {
      topicByTitle.set(t.title.toLowerCase(), t.id)
    }

    // Track display_order per topic
    const orderMap = new Map<string, number>()

    // Get existing max orders
    const { data: existingBlocks } = await supabase
      .from('topic_content_blocks')
      .select('topic_id, display_order')
      .eq('course_id', id)
      .order('display_order', { ascending: false })

    for (const b of existingBlocks || []) {
      if (!orderMap.has(b.topic_id) || orderMap.get(b.topic_id)! < b.display_order) {
        orderMap.set(b.topic_id, b.display_order)
      }
    }

    let imported = 0
    const importErrors: { row: number; message: string }[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const topicTitle = row.topic_title?.trim()
      const blockType = row.block_type?.trim()
      const content = row.content?.trim()

      if (!topicTitle || !blockType || !content) {
        importErrors.push({ row: i + 2, message: 'topic_title, block_type, and content are required' })
        continue
      }

      if (!VALID_BLOCK_TYPES.includes(blockType)) {
        importErrors.push({ row: i + 2, message: `Invalid block_type: "${blockType}". Must be one of: ${VALID_BLOCK_TYPES.join(', ')}` })
        continue
      }

      const topicId = topicByTitle.get(topicTitle.toLowerCase())
      if (!topicId) {
        importErrors.push({ row: i + 2, message: `Topic not found: "${topicTitle}"` })
        continue
      }

      const currentOrder = (orderMap.get(topicId) ?? -1) + 1
      orderMap.set(topicId, currentOrder)

      const { error: insertError } = await supabase
        .from('topic_content_blocks')
        .insert({
          topic_id: topicId,
          course_id: id,
          creator_id: creatorId,
          block_type: blockType,
          title: row.title?.trim() || null,
          content,
          display_order: currentOrder,
        })

      if (insertError) {
        importErrors.push({ row: i + 2, message: `Failed to insert block: ${insertError.message}` })
        continue
      }

      imported++
    }

    return NextResponse.json({ imported, errors: importErrors })
  } catch (err) {
    console.error('POST import/content error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
