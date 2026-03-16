# Learner UX Improvements -- Chat Prompt

Copy and paste this into a new Claude Code chat:

---

I need you to implement learner UX improvements for the openED platform. Read `docs/planned-improvements.md` for the full context, but here's the summary of what needs to be done:

## What to implement (in this order)

### 1. Topic Unlock Celebration (Quick Win)
The API at `app/api/session/complete` already returns `unlocked_topic` data when a session completes, but the complete page at `app/(app)/practice/[courseSlug]/complete/page.tsx` completely ignores it. Add an animated unlock card between the accuracy circle and stats row. Show the topic title, a visual flourish, and link to the guidebook for that topic.

### 2. Configurable Session Length
Session length is hardcoded to 10 questions. Add a session length picker (5 / 10 / 15 / 20) before the session starts in `app/(app)/practice/[courseSlug]/page.tsx`. Pass it as a param to `app/api/session/generate/route.ts`. The 3-pool algorithm percentages (60% due reviews, 25% weak topic, 15% new cards) stay the same -- just scale the counts.

### 3. Fix Review Mistakes Flow
The review page tries to call `/api/session/{sessionId}/review` which doesn't exist. Either build that API endpoint (preferred -- survives page refresh) or properly populate the Zustand store mistakes array before navigating. Check `app/(app)/practice/[courseSlug]/review/` and `lib/store/index.ts`.

### 4. Focused Topic Practice Mode
The `?topic=` query param on practice sessions exists but still runs the generic 3-pool algorithm. When a specific topic is requested, change the mix to: 80% from that topic (due + unseen), 20% due reviews from other topics. This is what "Practice This Topic" buttons on the path and guidebook should trigger. Files: `app/api/session/generate/route.ts`, `lib/engine/session-generator.ts`.

### 5. Requeue with Context
When wrong answers are requeued at end of session, they're re-presented cold with no context. Before the retry attempt, show a brief recap of the correct answer and explanation so the requeue is a learning moment. This is in the session component at `app/(app)/practice/[courseSlug]/page.tsx`.

### 6. Topic Unlock Animation on Path Page
When a learner returns to the path page after unlocking a topic, animate the newly unlocked topic -- pulse it, scroll to it, show a brief toast. Currently it silently re-renders. File: `app/(app)/course/[slug]/path/page.tsx`. You can pass the unlocked topic ID as a query param from the complete page.

## Important notes
- No emojis in the UI. Ever.
- The app uses Tailwind CSS v4, Next.js 16 App Router, TypeScript.
- Dark mode is the default for the learner side. Colors use `cp-` prefix (cp-dark, cp-surface, cp-accent, etc).
- Spaced repetition engine is FSRS v5 in `lib/engine/sm2.ts` (misnamed but it's FSRS).
- Session generation algorithm is in `lib/engine/session-generator.ts`.
- Zustand store for practice sessions is at `lib/store/index.ts`.
- Run `npx next build` to verify your changes compile.
- Start by reading the relevant files before making changes.
