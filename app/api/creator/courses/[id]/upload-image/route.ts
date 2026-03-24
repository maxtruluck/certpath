import { NextRequest, NextResponse } from 'next/server'
import { getCreatorCourse } from '@/lib/supabase/get-creator-course'

const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = [
  'image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml',
]

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params
    const { supabase, error } = await getCreatorCourse(courseId)
    if (error) return error

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File must be 5MB or smaller' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}. Allowed: PNG, JPG, GIF, WebP, SVG` },
        { status: 400 }
      )
    }

    const ext = file.name.split('.').pop() || 'png'
    const filename = `${crypto.randomUUID()}.${ext}`
    const storagePath = `${courseId}/steps/${filename}`

    const buffer = await file.arrayBuffer()

    const { error: uploadError } = await supabase.storage
      .from('content-images')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Image upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
    }

    const { data: urlData } = supabase.storage
      .from('content-images')
      .getPublicUrl(storagePath)

    return NextResponse.json({ url: urlData.publicUrl })
  } catch (err) {
    console.error('POST upload-image error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
