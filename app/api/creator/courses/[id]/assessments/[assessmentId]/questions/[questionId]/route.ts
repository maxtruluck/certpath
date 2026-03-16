import { NextRequest, NextResponse } from 'next/server'
import { getCreatorCourse } from '@/lib/supabase/get-creator-course'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; assessmentId: string; questionId: string }> }
) {
  try {
    const { id, assessmentId, questionId } = await params
    const { supabase, error } = await getCreatorCourse(id)
    if (error) return error

    const { error: deleteError } = await supabase
      .from('assessment_questions')
      .delete()
      .eq('assessment_id', assessmentId)
      .eq('question_id', questionId)

    if (deleteError) {
      console.error('Delete assessment question error:', deleteError)
      return NextResponse.json({ error: 'Failed to remove question' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE assessment question error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
