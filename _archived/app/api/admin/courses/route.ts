import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/require-admin'

export async function GET(request: NextRequest) {
  try {
    const { supabase, error } = await requireAdmin()
    if (error) return error

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    let query = supabase
      .from('courses')
      .select(`
        *,
        creator:creators(id, creator_name, bio, expertise_areas)
      `, { count: 'exact' })
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: courses, count, error: queryError } = await query

    if (queryError) {
      console.error('List courses query error:', queryError)
      return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 })
    }

    // Get question counts for returned courses
    const courseIds = (courses || []).map((c: any) => c.id)
    let statsMap: Record<string, number> = {}

    if (courseIds.length > 0) {
      const { data: questions } = await supabase
        .from('questions')
        .select('id, course_id')
        .in('course_id', courseIds)
        .eq('is_active', true)

      for (const id of courseIds) {
        statsMap[id] = (questions || []).filter((q: any) => q.course_id === id).length
      }
    }

    const shaped = (courses || []).map((c: any) => ({
      ...c,
      question_count: statsMap[c.id] || 0,
    }))

    return NextResponse.json({
      courses: shaped,
      total: count || 0,
      page,
      limit,
    })
  } catch (err) {
    console.error('GET /api/admin/courses error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
