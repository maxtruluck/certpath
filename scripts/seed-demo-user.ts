/**
 * Demo User Seed Script
 * Usage: npx tsx scripts/seed-demo-user.ts
 *
 * Populates all user-scoped tables for the demo user so the app
 * shows a realistic, populated experience. Safe to re-run (idempotent).
 *
 * Prerequisites:
 *   - Supabase project running with migrations applied
 *   - .env.local with SUPABASE_SERVICE_ROLE_KEY set
 */

import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Fixed IDs from seed data
const DEMO_USER_ID = 'a1111111-1111-1111-1111-111111111111';
const CERT_ID = 'a0000000-0000-0000-0000-000000000001';
const DOMAIN_IDS = [
  'd0000000-0000-0000-0000-000000000001', // General Security Concepts
  'd0000000-0000-0000-0000-000000000002', // Threats, Vulnerabilities
  'd0000000-0000-0000-0000-000000000003', // Security Architecture
  'd0000000-0000-0000-0000-000000000004', // Security Operations
  'd0000000-0000-0000-0000-000000000005', // Security Program Management
];
const CAREER_PATH_ID = 'c0000000-0000-0000-0000-000000000001';

// Domain scores: General 82%, Threats 65%, Architecture 50%, Ops 38%, Management 71%
const DOMAIN_SCORES = [
  { domain_id: DOMAIN_IDS[0], score: 0.82, attempted: 22, correct: 18 },
  { domain_id: DOMAIN_IDS[1], score: 0.65, attempted: 20, correct: 13 },
  { domain_id: DOMAIN_IDS[2], score: 0.50, attempted: 18, correct: 9 },
  { domain_id: DOMAIN_IDS[3], score: 0.38, attempted: 16, correct: 6 },
  { domain_id: DOMAIN_IDS[4], score: 0.71, attempted: 11, correct: 8 },
];

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function dateOnly(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
}

async function main() {
  console.log('🔧 Seeding demo user...\n');

  // Step 1: Create auth user
  console.log('1. Creating auth user...');
  const { error: authError } = await supabase.auth.admin.createUser({
    user_id: DEMO_USER_ID,
    email: 'demo@certpath.app',
    password: 'demo-password-123',
    email_confirm: true,
    user_metadata: { display_name: 'Alex Chen' },
  });

  if (authError) {
    if (authError.message.includes('already been registered') || authError.message.includes('already exists')) {
      console.log('  ↳ Auth user already exists, continuing...');
    } else {
      console.error('  ✗ Auth error:', authError.message);
      // Continue anyway — the trigger may have created the users row
    }
  } else {
    console.log('  ✓ Auth user created');
  }

  // Brief pause for trigger to fire
  await new Promise((r) => setTimeout(r, 1000));

  // Step 2: Upsert users table
  console.log('2. Upserting user profile...');
  const { error: userError } = await supabase.from('users').upsert(
    {
      id: DEMO_USER_ID,
      display_name: 'Alex Chen',
      current_role: 'Help Desk Analyst',
      target_role: 'Security Engineer',
      current_salary: 4200000, // $42,000 in cents
      timezone: 'America/Los_Angeles',
      onboarding_complete: true,
    },
    { onConflict: 'id' }
  );
  if (userError) console.error('  ✗', userError.message);
  else console.log('  ✓ User profile set');

  // Step 3: User certification
  console.log('3. Setting up certification enrollment...');
  const { error: certError } = await supabase.from('user_certifications').upsert(
    {
      user_id: DEMO_USER_ID,
      certification_id: CERT_ID,
      status: 'active',
      readiness_score: 0.42,
      sprint_type: 'sprint_60',
      sprint_start_date: dateOnly(-18),
      sprint_current_day: 18,
      total_xp: 1340,
      questions_attempted: 87,
      questions_correct: 64,
      enrolled_at: daysAgo(18),
    },
    { onConflict: 'user_id,certification_id' }
  );
  if (certError) console.error('  ✗', certError.message);
  else console.log('  ✓ Certification enrollment set');

  // Step 4: User streaks
  console.log('4. Setting up streak data...');
  const { error: streakError } = await supabase.from('user_streaks').upsert(
    {
      user_id: DEMO_USER_ID,
      current_streak: 5,
      longest_streak: 12,
      last_activity_date: dateOnly(-1), // yesterday
    },
    { onConflict: 'user_id' }
  );
  if (streakError) console.error('  ✗', streakError.message);
  else console.log('  ✓ Streak data set');

  // Step 5: Domain scores
  console.log('5. Setting up domain scores...');
  for (const ds of DOMAIN_SCORES) {
    const { error } = await supabase.from('user_domain_scores').upsert(
      {
        user_id: DEMO_USER_ID,
        domain_id: ds.domain_id,
        certification_id: CERT_ID,
        score: ds.score,
        questions_attempted: ds.attempted,
        questions_correct: ds.correct,
        last_practiced_at: daysAgo(1),
      },
      { onConflict: 'user_id,domain_id' }
    );
    if (error) console.error(`  ✗ Domain ${ds.domain_id}:`, error.message);
  }
  console.log('  ✓ Domain scores set');

  // Step 6: Question history — fetch real question IDs from DB
  console.log('6. Seeding question history...');
  const { data: questions, error: qError } = await supabase
    .from('questions')
    .select('id, domain_id, difficulty')
    .eq('certification_id', CERT_ID)
    .eq('is_active', true)
    .order('domain_id')
    .order('difficulty');

  if (qError || !questions || questions.length === 0) {
    console.error('  ✗ Could not fetch questions:', qError?.message ?? 'no questions found');
    console.log('  ↳ Skipping question history (run seed data migration first)');
  } else {
    // Pick ~25 questions, create varied SM-2 states
    const picked = questions.slice(0, 25);
    const historyRows = picked.map((q, i) => {
      const isCorrect = i % 3 !== 2; // ~67% correct
      const repetition = isCorrect ? Math.min(i % 4 + 1, 4) : 0;
      const easeFactor = isCorrect ? 2.5 + (i % 3) * 0.1 : 2.1;
      const interval = isCorrect ? [1, 3, 7, 14][repetition - 1] ?? 1 : 1;

      // Make ~8 questions due for review (next_review_date in the past)
      const isDue = i < 8;
      const reviewOffset = isDue ? -(Math.floor(i / 2) + 1) : interval;

      return {
        user_id: DEMO_USER_ID,
        question_id: q.id,
        certification_id: CERT_ID,
        domain_id: q.domain_id,
        is_correct: isCorrect,
        selected_option_ids: isCorrect ? ['a'] : ['c'],
        time_spent_ms: 8000 + Math.floor(Math.random() * 20000),
        ease_factor: easeFactor,
        interval_days: interval,
        repetition_number: repetition,
        next_review_date: dateOnly(reviewOffset),
        answered_at: daysAgo(Math.max(1, 18 - i)),
      };
    });

    // Delete existing history for demo user to avoid duplicates
    await supabase
      .from('user_question_history')
      .delete()
      .eq('user_id', DEMO_USER_ID);

    const { error: histError } = await supabase
      .from('user_question_history')
      .insert(historyRows);

    if (histError) console.error('  ✗', histError.message);
    else console.log(`  ✓ ${historyRows.length} question history rows inserted`);
  }

  // Step 7: XP log
  console.log('7. Seeding XP log...');
  await supabase.from('user_xp_log').delete().eq('user_id', DEMO_USER_ID);

  const xpRows: { user_id: string; xp_amount: number; source: string; earned_at: string }[] = [];

  // Correct answers: 64 * ~15 XP avg = ~960
  for (let i = 0; i < 12; i++) {
    xpRows.push({
      user_id: DEMO_USER_ID,
      xp_amount: 10 + (i % 3) * 5,
      source: 'correct_answer',
      earned_at: daysAgo(18 - i),
    });
  }
  // Session completes
  for (let i = 0; i < 6; i++) {
    xpRows.push({
      user_id: DEMO_USER_ID,
      xp_amount: 50,
      source: 'session_complete',
      earned_at: daysAgo(17 - i * 3),
    });
  }
  // Streak bonuses
  for (let i = 0; i < 4; i++) {
    xpRows.push({
      user_id: DEMO_USER_ID,
      xp_amount: 25,
      source: 'streak_bonus',
      earned_at: daysAgo(4 - i),
    });
  }
  // Achievement XP
  const achievementXP = [
    { amount: 50, days: 17 },  // first_steps
    { amount: 50, days: 16 },  // path_pioneer
    { amount: 100, days: 8 },  // week_warrior
    { amount: 150, days: 3 },  // sharpshooter
  ];
  for (const ax of achievementXP) {
    xpRows.push({
      user_id: DEMO_USER_ID,
      xp_amount: ax.amount,
      source: 'achievement',
      earned_at: daysAgo(ax.days),
    });
  }

  const { error: xpError } = await supabase.from('user_xp_log').insert(xpRows);
  if (xpError) console.error('  ✗', xpError.message);
  else console.log(`  ✓ ${xpRows.length} XP log entries inserted`);

  // Step 8: Achievements — look up by slug
  console.log('8. Seeding achievements...');
  const achievementSlugs = ['first_steps', 'path_pioneer', 'week_warrior', 'sharpshooter'];
  const { data: achievements, error: achError } = await supabase
    .from('achievements')
    .select('id, slug')
    .in('slug', achievementSlugs);

  if (achError || !achievements || achievements.length === 0) {
    console.error('  ✗ Could not fetch achievements:', achError?.message ?? 'none found');
  } else {
    await supabase.from('user_achievements').delete().eq('user_id', DEMO_USER_ID);

    const achRows = achievements.map((a, i) => ({
      user_id: DEMO_USER_ID,
      achievement_id: a.id,
      earned_at: daysAgo([17, 16, 8, 3][i] ?? 1),
    }));

    const { error: uaError } = await supabase.from('user_achievements').insert(achRows);
    if (uaError) console.error('  ✗', uaError.message);
    else console.log(`  ✓ ${achRows.length} achievements unlocked`);
  }

  // Step 9: Career path enrollment
  console.log('9. Setting up career path...');
  const { error: cpError } = await supabase.from('user_career_paths').upsert(
    {
      user_id: DEMO_USER_ID,
      career_path_id: CAREER_PATH_ID,
      is_active: true,
      started_at: daysAgo(18),
    },
    { onConflict: 'user_id,career_path_id' }
  );
  if (cpError) console.error('  ✗', cpError.message);
  else console.log('  ✓ Career path enrollment set');

  console.log('\n✅ Demo user seeded successfully!');
  console.log(`   User: Alex Chen (${DEMO_USER_ID})`);
  console.log('   Email: demo@certpath.app');
  console.log('   Security+ sprint day 18/60, 5-day streak, 1340 XP');
  console.log('\n   Run "npm run dev" and visit http://localhost:3000');
}

main().catch((err) => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
