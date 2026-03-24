import { NextRequest, NextResponse } from 'next/server'
import { getCreatorCourse } from '@/lib/supabase/get-creator-course'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; lessonId: string; questionId: string }> }
) {
  try {
    const { id, lessonId, questionId } = await params
    const { supabase, error } = await getCreatorCourse(id)
    if (error) return error

    const { error: deleteError } = await supabase
      .from('questions')
      .delete()
      .eq('id', questionId)
      .eq('lesson_id', lessonId)
      .eq('course_id', id)

    if (deleteError) {
      console.error('Delete question error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE question error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
