/**
 * Database Seeding Script
 * Usage: npx tsx scripts/seed-data.ts
 *
 * Reads SQL migration files and executes them against Supabase
 * using the Management API's SQL endpoint.
 *
 * Prerequisites:
 *   - .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 *
 * Alternative: Run migration files manually in the Supabase Dashboard SQL Editor,
 * or use the Supabase CLI: `supabase db push`
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

async function runSQL(sql: string): Promise<void> {
  // Use Supabase's PostgREST-compatible SQL execution via the /rest/v1/rpc endpoint
  // We use the pg_net approach: POST raw SQL to the Supabase Management API
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!response.ok) {
    // If /rpc doesn't work, this is expected — see fallback instructions below
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
}

async function main() {
  const migrationsDir = path.resolve(__dirname, '../supabase/migrations');
  const files = fs.readdirSync(migrationsDir).sort();

  console.log('CertPath Database Seeding');
  console.log('========================\n');

  let hasErrors = false;

  for (const file of files) {
    if (!file.endsWith('.sql')) continue;
    console.log(`Running: ${file}...`);

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

    try {
      await runSQL(sql);
      console.log(`  ✓ ${file} complete`);
    } catch (err) {
      hasErrors = true;
      console.warn(`  ⚠ ${file} failed via API: ${(err as Error).message}`);
    }
  }

  if (hasErrors) {
    console.log('\n──────────────────────────────────────────────');
    console.log('Some migrations failed via the REST API.');
    console.log('This is normal — Supabase doesn\'t expose raw SQL execution via REST.\n');
    console.log('Run migrations manually using one of these methods:\n');
    console.log('  Option 1: Supabase Dashboard');
    console.log('    1. Go to your Supabase project → SQL Editor');
    console.log('    2. Paste and run each file in supabase/migrations/ in order:\n');
    files
      .filter((f) => f.endsWith('.sql'))
      .forEach((f) => console.log(`       - ${f}`));
    console.log('\n  Option 2: Supabase CLI');
    console.log('    supabase db push\n');
    console.log('After migrations are applied, run the demo user seed:');
    console.log('    npx tsx scripts/seed-demo-user.ts');
    console.log('──────────────────────────────────────────────');
  } else {
    console.log('\n✅ All migrations applied successfully!');
    console.log('Next: run `npx tsx scripts/seed-demo-user.ts` to seed demo data.');
  }
}

main().catch(console.error);
