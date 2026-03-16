# openED Planned Improvements

## Creator Flow Rework (Priority: Now)

### New Step Flow
1. **Course Info** (Q&A style) -- DONE
2. **Outline** -- Modules -> Topics -> Lessons (just titles/structure, no content)
3. **Content** -- Upload/write content into each lesson, topic, module
4. **Questions & Assessments** -- Questions per topic/lesson, topic quizzes, module tests, practice exams. AI generate option via Claude API.
5. **Review & Submit** -- Summary + submit

### Step 2: Outline Builder
- Current structure builder only handles Modules + Topics
- Need to add Lessons as a third level: Module -> Topic -> Lesson
- DB and API routes for lessons already exist (migration 012)
- Keep drag-and-drop reordering at all levels
- Keep CSV import (update template to include lesson_title column)
- Keep format-based template pre-population (add suggested lessons)
- Rename header from "Course Structure" to "Course Outline"
- Button text: "Continue to Content" instead of "Continue to Content & Questions"

### Step 3: Content (new, split from old Step 3)
- Sidebar tree: Modules > Topics > Lessons
- Select a lesson/topic -> add content blocks to it
- Content block types: concept, definition, example, exam_tip, key_takeaway, code_block, summary, note
- Support for text content, code blocks, images, video embeds
- CSV import for bulk content
- No questions on this step -- purely content

### Step 4: Questions & Assessments (new, split from old Step 3)
- Sidebar tree same as Step 3
- Per-topic/lesson question authoring
- Question types: multiple_choice, multiple_select, true_false, fill_blank, ordering, matching
- Bloom's level tagging per question
- AI generation via Claude API: "Generate questions for this topic" button
  - Uses topic content + lesson content as context
  - Creator reviews/edits generated questions before saving
  - Configurable: count, difficulty, Bloom's distribution
- Assessment builder:
  - Topic Quiz: auto-pulls questions from topic, configurable count/time/passing score
  - Module Test: pulls from all topics in module
  - Practice Exam / Course Final: pulls from entire course, simulates real exam
- Assessment settings: time limit, passing score, shuffle, show explanations

### Step 5: Review & Submit (merge old Steps 4+5)
- Course completeness dashboard
- Stats: total modules, topics, lessons, content blocks, questions
- Per-module/topic readiness indicators
- Warnings for: empty topics, topics with no questions, low question counts
- Submit for review button

---

## Learner UX Improvements

### Tier 1: Quick Wins

**1. Topic Unlock Celebration**
- API already returns `unlocked_topic` on session complete but UI ignores it
- Add animated unlock card on complete page between accuracy circle and stats
- "New topic unlocked: [Topic Title]" with visual flourish
- Link to guidebook for that topic
- Files: `app/(app)/practice/[courseSlug]/complete/page.tsx`

**2. Configurable Session Length**
- Currently hardcoded to 10 questions
- Add quick picker before session starts: 5 / 10 / 15 / 20
- Pass as query param, 3-pool percentages stay the same
- Files: `app/(app)/practice/[courseSlug]/page.tsx`, `app/api/session/generate/route.ts`

**3. Fix Review Mistakes Flow**
- Review page calls `/api/session/{sessionId}/review` which doesn't exist
- Falls back to Zustand store data that isn't fully populated
- Either build the missing API endpoint (better -- survives page refresh) or properly populate mistakes array in store
- Files: `app/(app)/practice/[courseSlug]/review/`, `app/api/session/`

### Tier 2: UX Improvements

**4. Focused Topic Practice Mode**
- `?topic=` param exists but still runs 3-pool algorithm
- Add focused mode: 80% from target topic (due + unseen), 20% due reviews from other topics
- Useful when learner taps "Practice This Topic" from path or guidebook
- Files: `app/api/session/generate/route.ts`, `lib/engine/session-generator.ts`

**5. Requeue with Context**
- Wrong answers re-presented cold -- no explanation before retry
- Show brief recap of correct answer/explanation before retry attempt
- Makes requeue a learning moment instead of a guessing retry
- Files: `app/(app)/practice/[courseSlug]/page.tsx` (requeue logic in session component)

**6. Topic Unlock Animation on Path Page**
- When returning to path after unlock, animate the newly unlocked topic
- Pulse animation, scroll to it, brief toast
- Currently path just silently re-renders
- Files: `app/(app)/course/[slug]/path/page.tsx`

### Tier 3: Deeper Features

**7. Session History & Trends**
- Past sessions: date, accuracy, XP earned, topics covered
- Readiness trend line over time (data exists in review_log)
- Accessible from profile or course path
- New page + API endpoint needed

**8. Cram Mode / Exam Simulation**
- Pre-exam rapid-fire mode that overrides spaced repetition
- Questions across all topics weighted by exam domain percentages
- Timed to match real exam pacing
- No FSRS updates (or optional) -- simulation, not learning
- Uses existing assessment infrastructure with random question selection

**9. Test-Out / Placement**
- On enrollment, offer placement assessment
- Score 70%+ on a topic -> auto-unlock (mark completed)
- Skip ahead to where they actually need to learn
- Uses existing assessment flow wired into enrollment

---

## Format Selection Page (Done)

### Categories (6 total)
- Certification Prep -- exam-aligned, domain-based
- Academic / Textbook -- chapter-based, theory-first
- Software & Tools -- enterprise software, AI tools, workflow-based
- Skills Training -- hands-on, scenario-based
- Compliance & Policy -- corporate compliance, pass/fail
- Language & Vocabulary -- memorization-heavy, flashcard-style, spaced repetition focused
- Start from Scratch -- skip link (no card)

### Design Rules
- No emojis anywhere in the UI
- Icon field exists in config but not rendered on format cards
- Clean 3x2 grid layout
- "Skip -- I'll start from scratch" link below grid

---

## Database Status

### Existing Tables (ready to use)
- modules, topics -- fully wired
- lessons -- migration 012, CRUD API exists, not yet in structure builder UI
- assessments, assessment_questions, assessment_attempts -- migration 012, API exists
- topic_content_blocks -- migration 009
- questions -- has optional lesson_id column for lesson-level linking

### Existing API Routes
- `/api/creator/courses/[id]/modules` -- full CRUD + reorder
- `/api/creator/courses/[id]/modules/[moduleId]/topics` -- create
- `/api/creator/courses/[id]/topics/[topicId]` -- update/delete
- `/api/creator/courses/[id]/topics/[topicId]/lessons` -- CRUD + reorder
- `/api/creator/courses/[id]/lessons/[lessonId]` -- update/delete
- `/api/creator/courses/[id]/assessments` -- CRUD
- `/api/creator/courses/[id]/assessments/[assessmentId]/questions` -- link questions
- `/api/creator/courses/[id]/topics/[topicId]/content-blocks` -- CRUD + reorder
