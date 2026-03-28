import { NextRequest, NextResponse } from 'next/server'
import { getCreatorCourse } from '@/lib/supabase/get-creator-course'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { supabase, error } = await getCreatorCourse(id)
    if (error) return error

    const { data: tests } = await supabase
      .from('tests')
      .select('*')
      .eq('course_id', id)
      .order('created_at')

    const testList = tests || []

    // Count questions for each test from test_questions table
    const testsWithCounts = await Promise.all(
      testList.map(async (test: any) => {
        const { count } = await supabase
          .from('test_questions')
          .select('id', { count: 'exact', head: true })
          .eq('test_id', test.id)

        return { ...test, question_count: count || 0 }
      })
    )

    return NextResponse.json(testsWithCounts)
  } catch (err) {
    console.error('GET creator/tests error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { supabase, error } = await getCreatorCourse(id)
    if (error) return error

    const body = await request.json()
    const { title, passing_score = 70, time_limit_minutes } = body

    if (!title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }

    const insertData: Record<string, any> = {
      course_id: id,
      title,
      passing_score,
    }

    if (time_limit_minutes != null) insertData.time_limit_minutes = time_limit_minutes

    const { data: test, error: insertError } = await supabase
      .from('tests')
      .insert(insertData)
      .select('*')
      .single()

    if (insertError) {
      console.error('Insert test error:', insertError)
      return NextResponse.json({ error: 'Failed to create test' }, { status: 500 })
    }

    return NextResponse.json(test, { status: 201 })
  } catch (err) {
    console.error('POST creator/tests error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
