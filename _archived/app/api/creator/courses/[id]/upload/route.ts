import { getApiUser } from '@/lib/supabase/get-user-api'
import { NextRequest, NextResponse } from 'next/server'

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
    .from('courses').select('id').eq('id', courseId).eq('creator_id', creator.id).single()
  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

  const formData = await request.formData()
  const files = formData.getAll('files') as File[]
  if (!files.length) {
    return NextResponse.json({ error: 'No files provided' }, { status: 400 })
  }

  const ALLOWED_TYPES = [
    'application/pdf', 'text/csv', 'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ]

  const uploaded = []
  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: `Unsupported file type: ${file.type}` }, { status: 400 })
    }

    const fileId = crypto.randomUUID()
    const storagePath = `courses/${courseId}/${fileId}-${file.name}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadErr } = await supabase.storage
      .from('course-files').upload(storagePath, buffer, { contentType: file.type, upsert: false })
    if (uploadErr) {
      return NextResponse.json({ error: `Upload failed: ${uploadErr.message}` }, { status: 500 })
    }

    const { data: record, error: dbErr } = await supabase
      .from('course_files').insert({
        course_id: courseId, creator_id: creator.id,
        file_name: file.name, file_type: file.type, file_size: file.size,
        storage_path: storagePath, status: 'uploaded',
      }).select().single()
    if (dbErr) {
      return NextResponse.json({ error: `DB error: ${dbErr.message}` }, { status: 500 })
    }

    uploaded.push({
      id: record.id, name: file.name, type: file.type,
      size_bytes: file.size, status: 'uploaded', uploaded_at: record.created_at,
    })
  }

  return NextResponse.json({ uploaded_files: uploaded })
}
