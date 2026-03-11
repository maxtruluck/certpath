# CertPath

A mobile-first web app for IT certification prep using spaced repetition and gamification. The MVP focuses on **CompTIA Security+ SY0-701**.

## Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS v4, TypeScript
- **Backend:** Supabase (PostgreSQL + Auth + Row Level Security)
- **AI:** Claude API (Sonnet) for question generation
- **State:** Zustand for client-side session state
- **Hosting:** Vercel

## Features

- Spaced repetition engine (SM-2 algorithm) for optimal review scheduling
- 12-question practice sessions mixing due reviews, weak domains, and new material
- 5 Security+ domains with 50 seed questions
- Gamification: XP, streaks, achievements, career path progression
- Sprint modes (30/60/90 day study plans)
- Career GPS with salary milestone tracking
- Dark mode UI with custom animations

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Copy `.env.local.example` to `.env.local` and fill in your keys:

```bash
cp .env.local.example .env.local
```

You need:
- `NEXT_PUBLIC_SUPABASE_URL` — your project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` — service role key (for seed scripts)
- `ANTHROPIC_API_KEY` — for AI question generation (optional for demo)

### 3. Run database migrations

Run each SQL file in the Supabase Dashboard SQL Editor, in order:

1. `supabase/migrations/001_create_tables.sql`
2. `supabase/migrations/002_rls_policies.sql`
3. `supabase/migrations/003_indexes.sql`
4. `supabase/migrations/004_seed_data.sql`

Or use the Supabase CLI:
```bash
supabase db push
```

### 4. Seed demo user data

```bash
npx tsx scripts/seed-demo-user.ts
```

This creates a demo user (Alex Chen) with realistic data: 18-day study sprint, 5-day streak, domain scores, question history, achievements, and career path enrollment.

### 5. Run the dev server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

## Demo Mode

The app ships with `DEMO_MODE = true` in `lib/demo.ts`. In this mode:
- Authentication is bypassed — all requests use the demo user
- No real Supabase Auth flow is required

To use real authentication, set `DEMO_MODE = false` in `lib/demo.ts`.

## Project Structure

```
app/
  (auth)/          Login, signup pages
  (app)/           Authenticated pages (dashboard, practice, profile, etc.)
  api/             API routes (auth, sessions, dashboard, career, achievements)
components/        Shared UI components (AppShell, TopBar, BottomNav, etc.)
lib/
  engine/          SM-2 algorithm, session generator, readiness calculator
  store/           Zustand store for practice sessions
  demo.ts          Demo mode flag and user ID
  supabase/        Supabase client helpers
supabase/
  migrations/      SQL migration files (schema, RLS, indexes, seed data)
scripts/
  seed-data.ts     Run migrations via API (or see manual instructions)
  seed-demo-user.ts  Seed demo user with realistic data
```
