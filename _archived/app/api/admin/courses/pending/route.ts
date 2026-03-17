import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/require-admin'

export async function GET(_request: NextRequest) {
  try {
    const { supabase, error } = await requireAdmin()
    if (error) return error

    const { data: courses, error: queryError } = await supabase
      .from('courses')
      .select(`
        *,
        creator:creators(id, creator_name, bio, expertise_areas)
      `)
      .eq('status', 'in_review')
      .order('updated_at', { ascending: true })

    if (queryError) {
      console.error('Pending courses query error:', queryError)
      return NextResponse.json({ error: 'Failed to fetch pending courses' }, { status: 500 })
    }

    // Get stats for each course
    const courseIds = (courses || []).map((c: any) => c.id)
    let statsMap: Record<string, any> = {}

    if (courseIds.length > 0) {
      const [modulesRes, topicsRes, questionsRes] = await Promise.all([
        supabase.from('modules').select('id, course_id').in('course_id', courseIds),
        supabase.from('topics').select('id, course_id').in('course_id', courseIds),
        supabase.from('questions').select('id, course_id').in('course_id', courseIds).eq('is_active', true),
      ])

      for (const id of courseIds) {
        statsMap[id] = {
          module_count: (modulesRes.data || []).filter((m: any) => m.course_id === id).length,
          topic_count: (topicsRes.data || []).filter((t: any) => t.course_id === id).length,
          question_count: (questionsRes.data || []).filter((q: any) => q.course_id === id).length,
        }
      }
    }

    const shaped = (courses || []).map((c: any) => ({
      ...c,
      stats: statsMap[c.id] || { module_count: 0, topic_count: 0, question_count: 0 },
    }))

    return NextResponse.json({ courses: shaped })
  } catch (err) {
    console.error('GET /api/admin/courses/pending error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
