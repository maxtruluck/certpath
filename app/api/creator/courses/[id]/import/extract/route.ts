import { NextRequest, NextResponse } from 'next/server'
import { getCreatorCourse } from '@/lib/supabase/get-creator-course'

/**
 * Extract plain text from a DOCX file (ZIP-based XML parsing).
 * Restored from archived generate-structure route.
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
  if (!docEntry) return ''

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

  const tagRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g
  const processed = xml.replace(/<\/w:p>/g, '\n')
  const textParts: string[] = []
  let match
  while ((match = tagRegex.exec(processed)) !== null) {
    textParts.push(match[1])
  }

  if (textParts.length === 0) {
    return processed.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  }
  return textParts.join('').replace(/\n+/g, '\n').trim()
}

/**
 * Extract text from PDF using pdf-parse.
 */
async function extractPdfText(arrayBuffer: ArrayBuffer): Promise<string> {
  // pdf-parse v1.1.1 — default export is the parse function
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse')
  const buffer = Buffer.from(arrayBuffer)
  const data = await pdfParse(buffer)
  return data.text || ''
}

/**
 * POST /api/creator/courses/[id]/import/extract
 * Accepts multipart form data with files. Returns extracted text.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { error } = await getCreatorCourse(id)
    if (error) return error

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const pasteText = formData.get('text') as string | null

    if ((!files || files.length === 0) && !pasteText) {
      return NextResponse.json({ error: 'No files or text provided' }, { status: 400 })
    }

    let extractedText = ''
    const metadata: { file_count: number; total_chars: number } = { file_count: 0, total_chars: 0 }

    // Handle pasted text
    if (pasteText && pasteText.trim()) {
      extractedText += pasteText.trim()
      metadata.total_chars += pasteText.trim().length
    }

    // Handle file uploads
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: `File "${file.name}" exceeds 10MB limit` }, { status: 413 })
      }

      const ext = file.name.split('.').pop()?.toLowerCase()
      let text = ''

      try {
        if (ext === 'pdf') {
          const arrayBuffer = await file.arrayBuffer()
          text = await extractPdfText(arrayBuffer)
        } else if (ext === 'docx') {
          const arrayBuffer = await file.arrayBuffer()
          text = await extractDocxText(arrayBuffer)
        } else if (ext === 'txt' || ext === 'md') {
          text = await file.text()
        } else {
          return NextResponse.json(
            { error: `Unsupported file format: .${ext}. Only PDF, DOCX, TXT, and MD files are supported.` },
            { status: 400 }
          )
        }
      } catch (parseErr) {
        console.error(`Failed to parse ${file.name}:`, parseErr)
        text = `[Could not parse file: ${file.name}]`
      }

      if (text.trim()) {
        extractedText += `\n\n=== ${file.name} ===\n${text}`
        metadata.file_count++
      }
    }

    if (!extractedText.trim()) {
      return NextResponse.json({ error: 'No readable content found' }, { status: 400 })
    }

    // Enforce 100K character limit
    if (extractedText.length > 100000) {
      return NextResponse.json(
        { error: 'Content is too long. Try splitting into multiple files.' },
        { status: 400 }
      )
    }

    metadata.total_chars = extractedText.length

    return NextResponse.json({ text: extractedText, metadata })
  } catch (err) {
    console.error('POST /import/extract error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
