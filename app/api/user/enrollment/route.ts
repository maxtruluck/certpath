import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/supabase/get-user-api';

export async function GET(request: NextRequest) {
  try {
    const { supabase, userId, error } = await getApiUser();
    if (error) return error;

    const courseSlug = request.nextUrl.searchParams.get('course_slug');
    if (!courseSlug) {
      return NextResponse.json({ error: 'course_slug required' }, { status: 400 });
    }

    // Look up course by slug, then check enrollment
    const { data: course } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', courseSlug)
      .single();

    if (!course) {
      return NextResponse.json({ enrolled: false });
    }

    const { data: enrollment } = await supabase
      .from('user_courses')
      .select('id, status')
      .eq('user_id', userId)
      .eq('course_id', course.id)
      .single();

    return NextResponse.json({
      enrolled: !!enrollment,
      status: enrollment?.status || null,
    });
  } catch (err) {
    console.error('GET /api/user/enrollment error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
