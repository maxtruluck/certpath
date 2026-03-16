import { NextResponse } from 'next/server'
import { getApiUser } from './get-user-api'
import { SupabaseClient } from '@supabase/supabase-js'

interface CreatorCourseResult {
  supabase: SupabaseClient
  userId: string
  creatorId: string
  courseId: string
  error?: NextResponse
}

/**
 * Shared helper that verifies auth + creator ownership of a course.
 * Deduplicates the auth + creator + course ownership check pattern
 * used across all creator API routes.
 */
export async function getCreatorCourse(courseId: string): Promise<CreatorCourseResult> {
  const { supabase, userId, error } = await getApiUser()
  if (error) {
    return { supabase, userId, creatorId: '', courseId, error }
  }

  const { data: creator } = await supabase
    .from('creators')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (!creator) {
    return {
      supabase,
      userId,
      creatorId: '',
      courseId,
      error: NextResponse.json({ error: 'Creator not found' }, { status: 404 }),
    }
  }

  // Verify course belongs to this creator
  const { data: course } = await supabase
    .from('courses')
    .select('id')
    .eq('id', courseId)
    .eq('creator_id', creator.id)
    .single()

  if (!course) {
    return {
      supabase,
      userId,
      creatorId: creator.id,
      courseId,
      error: NextResponse.json({ error: 'Course not found' }, { status: 404 }),
    }
  }

  return {
    supabase,
    userId,
    creatorId: creator.id,
    courseId,
  }
}
