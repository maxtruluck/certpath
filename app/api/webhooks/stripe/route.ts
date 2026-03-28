import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

// Service role client for webhook — bypasses RLS
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { user_id, course_id, creator_id } = session.metadata || {};

    if (!user_id || !course_id || !creator_id) {
      console.error('Missing metadata in checkout session:', session.id);
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
    }

    const supabase = getServiceClient();

    // Check for duplicate processing (idempotency)
    const { data: existingTx } = await supabase
      .from('transactions')
      .select('id')
      .eq('stripe_checkout_session_id', session.id)
      .single();

    if (existingTx) {
      // Already processed — return success
      return NextResponse.json({ received: true });
    }

    const amountCents = session.amount_total || 0;
    const platformFeeCents = Math.round(amountCents * 0.30); // 30% platform fee
    const creatorEarningsCents = amountCents - platformFeeCents;

    // Find first lesson for enrollment
    const { data: firstLesson } = await supabase
      .from('lessons')
      .select('id')
      .eq('course_id', course_id)
      .order('display_order', { ascending: true })
      .limit(1)
      .maybeSingle();

    // Enroll user in course
    const { error: enrollError } = await supabase
      .from('user_courses')
      .upsert({
        user_id,
        course_id,
        status: 'active',
        current_lesson_id: firstLesson?.id || null,
        questions_seen: 0,
        questions_correct: 0,
        sessions_completed: 0,
      }, {
        onConflict: 'user_id,course_id',
      });

    if (enrollError) {
      console.error('Enrollment failed:', enrollError);
      // Don't return error — still log the transaction
    }

    // Log transaction
    const { error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id,
        course_id,
        creator_id,
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || null,
        amount_cents: amountCents,
        currency: session.currency || 'usd',
        platform_fee_cents: platformFeeCents,
        creator_earnings_cents: creatorEarningsCents,
        status: 'completed',
      });

    if (txError) {
      console.error('Transaction log failed:', txError);
    }
  }

  return NextResponse.json({ received: true });
}
