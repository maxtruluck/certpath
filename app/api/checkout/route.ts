import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/supabase/get-user-api';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const { supabase, userId, error } = await getApiUser();
    if (error) return error;

    const { course_id } = await request.json();
    if (!course_id) {
      return NextResponse.json({ error: 'course_id required' }, { status: 400 });
    }

    // Fetch course with creator info
    const { data: course } = await supabase
      .from('courses')
      .select('id, title, slug, price_cents, currency, creator_id, creators(creator_name)')
      .eq('id', course_id)
      .eq('status', 'published')
      .single();

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    if (!course.price_cents || course.price_cents === 0) {
      return NextResponse.json({ error: 'This course is free — enroll directly' }, { status: 400 });
    }

    // Check if user already enrolled
    const { data: existing } = await supabase
      .from('user_courses')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', course_id)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Already enrolled' }, { status: 400 });
    }

    // Get user email for Stripe
    const { data: { user } } = await supabase.auth.getUser();

    // Create Stripe Checkout Session
    const origin = request.headers.get('origin')
      || `https://${request.headers.get('host')}`
      || process.env.NEXT_PUBLIC_APP_URL
      || 'http://localhost:3000';

    const creatorInfo = course.creators as unknown as { creator_name: string } | null;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: user?.email || undefined,
      line_items: [
        {
          price_data: {
            currency: course.currency || 'usd',
            product_data: {
              name: course.title,
              description: `Course by ${creatorInfo?.creator_name || 'OpenED Creator'}`,
            },
            unit_amount: course.price_cents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        user_id: userId,
        course_id: course.id,
        creator_id: course.creator_id,
        course_slug: course.slug,
      },
      success_url: `${origin}/checkout/success?slug=${course.slug}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/course/${course.slug}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('POST /api/checkout error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
