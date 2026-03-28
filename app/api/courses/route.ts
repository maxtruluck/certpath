import { NextRequest, NextResponse } from 'next/server'
import { getApiUser } from '@/lib/supabase/get-user-api'

export async function GET(request: NextRequest) {
  try {
    const { supabase, userId, error } = await getApiUser()
    if (error) return error

    const { searchParams } = request.nextUrl
    const category = searchParams.get('category')
    const difficulty = searchParams.get('difficulty')
    const search = searchParams.get('search')
    const sort = searchParams.get('sort') || 'published_at'
    const cursor = searchParams.get('cursor')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50)

    // Build base query for published courses with creator info
    let query = supabase
      .from('courses')
      .select(`
        *,
        creator:creators(id, creator_name, bio, expertise_areas, credentials),
        user_progress:user_courses!left(id, status, questions_seen, questions_correct, sessions_completed, last_session_at, enrolled_at, completed_at)
      `)
      .eq('status', 'published')

    // Filter user_progress to current user
    query = query.eq('user_courses.user_id', userId)

    // Apply filters
    if (category) {
      query = query.eq('category', category)
    }
    if (difficulty) {
      query = query.eq('difficulty', difficulty)
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Cursor-based pagination
    if (cursor) {
      const sortColumn = sort === 'title' ? 'title' : 'published_at'
      query = query.gt(sortColumn, cursor)
    }

    // Sorting
    if (sort === 'title') {
      query = query.order('title', { ascending: true })
    } else {
      query = query.order('published_at', { ascending: false })
    }

    // Fetch limit + 1 to determine has_more
    query = query.limit(limit + 1)

    const { data: courses, error: queryError } = await query

    if (queryError) {
      console.error('Courses query error:', queryError)
      return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 })
    }

    const hasMore = (courses?.length || 0) > limit
    const resultCourses = courses?.slice(0, limit) || []

    // Get stats for each course (module_count, lesson_count, question_count)
    const courseIds = resultCourses.map((c: any) => c.id)

    let statsMap: Record<string, { module_count: number; lesson_count: number; question_count: number }> = {}

    if (courseIds.length > 0) {
      // Fetch modules and lessons (both have course_id)
      const [modulesRes, lessonsRes] = await Promise.all([
        supabase
          .from('modules')
          .select('course_id')
          .in('course_id', courseIds),
        supabase
          .from('lessons')
          .select('id, course_id')
          .in('course_id', courseIds),
      ])

      // lesson_steps has no course_id, so query by lesson_ids
      const lessonIds = (lessonsRes.data || []).map((l: any) => l.id)
      let answerStepsByLesson: Record<string, number> = {}

      if (lessonIds.length > 0) {
        const { data: answerSteps } = await supabase
          .from('lesson_steps')
          .select('lesson_id')
          .in('lesson_id', lessonIds)
          .eq('step_type', 'answer')

        for (const s of answerSteps || []) {
          answerStepsByLesson[s.lesson_id] = (answerStepsByLesson[s.lesson_id] || 0) + 1
        }
      }

      // Build a map of lesson_id -> course_id for aggregation
      const lessonCourseMap: Record<string, string> = {}
      for (const l of lessonsRes.data || []) {
        lessonCourseMap[l.id] = l.course_id
      }

      for (const id of courseIds) {
        const lessonCount = (lessonsRes.data || []).filter((l: any) => l.course_id === id).length
        // Sum answer steps for all lessons belonging to this course
        let questionCount = 0
        for (const [lessonId, count] of Object.entries(answerStepsByLesson)) {
          if (lessonCourseMap[lessonId] === id) questionCount += count
        }

        statsMap[id] = {
          module_count: (modulesRes.data || []).filter((m: any) => m.course_id === id).length,
          lesson_count: lessonCount,
          question_count: questionCount,
        }
      }
    }

    // Shape response
    const shaped = resultCourses.map((c: any) => {
      const { user_progress, ...course } = c
      return {
        ...course,
        stats: statsMap[c.id] || { module_count: 0, lesson_count: 0, question_count: 0 },
        user_progress: user_progress?.[0] || null,
      }
    })

    // Determine next cursor
    let nextCursor: string | null = null
    if (hasMore && resultCourses.length > 0) {
      const last = resultCourses[resultCourses.length - 1]
      nextCursor = sort === 'title' ? last.title : last.published_at
    }

    return NextResponse.json({
      courses: shaped,
      next_cursor: nextCursor,
      has_more: hasMore,
    })
  } catch (err) {
    console.error('GET /api/courses error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
