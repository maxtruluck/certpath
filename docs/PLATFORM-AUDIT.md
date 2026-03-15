# openED Platform — Complete Technical & UX Documentation

> Generated: March 14, 2026 | Codebase: certpath (openED MVP)

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [User Flows — Learner](#2-user-flows--learner)
3. [User Flows — Creator](#3-user-flows--creator)
4. [User Flows — Admin](#4-user-flows--admin)
5. [Screen-by-Screen UI/UX Reference](#5-screen-by-screen-uiux-reference)
6. [Navigation Map](#6-navigation-map)
7. [Design System](#7-design-system)
8. [Component Library](#8-component-library)
9. [API Reference (30 Endpoints)](#9-api-reference-30-endpoints)
10. [Database Schema (9 Tables)](#10-database-schema-9-tables)
11. [FSRS v5 Spaced Repetition Engine](#11-fsrs-v5-spaced-repetition-engine)
12. [Session Generation Algorithm](#12-session-generation-algorithm)
13. [Readiness Score Calculation](#13-readiness-score-calculation)
14. [State Management (Zustand)](#14-state-management-zustand)
15. [Auth & Middleware](#15-auth--middleware)
16. [Configuration & Infrastructure](#16-configuration--infrastructure)
17. [Business Model & Strategy](#17-business-model--strategy)
18. [Feature Tier Roadmap](#18-feature-tier-roadmap)
19. [Competitive Landscape](#19-competitive-landscape)

---

## 1. Platform Overview

**openED** is a mobile-first web platform for adaptive learning using spaced repetition (FSRS v5) and gamification. It combines a **creator marketplace** (upload content, earn revenue) with a **Duolingo-grade learner experience** (gamified sessions, linear paths, readiness tracking).

**Mission:** "Free to learn. Fair to create. Built to last."

**MVP Focus:** CompTIA Security+ SY0-701 certification prep.

**Tech Stack:**
| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1.6 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS v4 |
| Language | TypeScript 5 (strict mode) |
| Database | Supabase (PostgreSQL + Auth + RLS) |
| State | Zustand 5 |
| AI | Claude API (Anthropic SDK) for question generation |
| Hosting | Vercel (web), planned Expo/EAS (mobile) |

**Content Hierarchy:** Course → Module → Topic → Question

---

## 2. User Flows — Learner

### 2.1 First-Time User Flow
```
Landing (/) → Sign Up (/signup) → Home (/home) [empty state]
→ Browse (/browse) → Course Detail (/course/{slug})
→ Enroll (/course/{slug}/enroll) → Course Path (/course/{slug}/path)
→ First Practice Session (/practice/{slug})
→ Session Complete (/practice/{slug}/complete)
→ Back to Path (topic may unlock)
```

### 2.2 Returning User Flow
```
Login (/login) → Home (/home) [shows active courses]
→ "Continue studying" → Course Path (/course/{slug}/path)
→ Tap current topic → Practice Session (/practice/{slug})
→ Session Complete → Review Mistakes (optional)
→ Back to Path
```

### 2.3 Practice Session Flow (Detail)
```
1. Generate session (GET /api/session/generate)
   - 10 questions from 3 pools (60% due, 25% weak, 15% new)

2. For each question:
   a. Display question + options
   b. User selects option(s) → highlights blue
   c. User taps "Check" → POST /api/session/answer
   d. Correct: green sheet with explanation → "Continue"
   e. Wrong: red sheet with why wrong + why right → "Got it"
   f. Wrong answers collected in requeue

3. After main questions, replay wrong answers (requeue loop)

4. POST /api/session/complete
   - Returns: accuracy, readiness delta, topic breakdown, unlocked topic

5. Session Complete screen with results
   - Option to "Review X mistake(s)" → Review page
```

### 2.4 Topic Advancement
- Topic unlocks when readiness reaches ~70%
- Readiness = weighted average of FSRS retrievability across all cards in topic
- Linear path: topics unlock sequentially within modules, modules sequential
- Course completes when all topics done AND overall readiness >= 70%

### 2.5 Course Completion Flow
```
Path page shows "All topics completed!" banner
→ Course Complete (/course/{slug}/complete)
→ Final readiness %, module breakdown, stats
→ "Browse more courses" or "Keep practicing reviews"
```

---

## 3. User Flows — Creator

### 3.1 Creator Application Flow
```
1. Apply (POST /api/creator/apply)
   - Provide: creator_name, bio, expertise_areas, credentials
   - Status: pending

2. Wait for admin approval (24-48 hours)
   - GET /api/creator/status to check

3. Approved → access creator portal (/creator)
```

### 3.2 Course Creation Flow (5-Step Wizard)
```
Step 1: Course Information
  - Title, category, difficulty, pricing, cert exam fields
  - "Save Draft" or "Continue to Upload"

Step 2: Upload Content
  - Drag/drop files (CSV, XLSX, JSON, PDF, DOCX, TXT)
  - 50MB per file limit
  - "Submit Content" when files uploaded

Step 3: Processing (AI)
  - Progress bar with 5 steps: Parse → Organize → Identify → Generate → QA
  - Auto-advances to Step 4 on completion

Step 4: Review Course Structure
  - Stats: questions, modules, topics, flagged, warnings
  - Collapsible module/topic tree
  - Sample questions with edit/remove
  - "Submit for Review" or "Save Draft"

Step 5: Submitted
  - Confirmation with "In Review" badge
  - "Back to Dashboard" or "Preview as Learner"
```

### 3.3 Course Review Pipeline
```
Creator submits → status: in_review
→ Admin reviews (GET /api/admin/courses/pending)
→ Approve: status → published, visible to learners
→ Reject: status → draft, returned to creator with reason
```

### 3.4 Creator Dashboard
- Stats: published courses, total students, total earnings, avg rating
- Course list with status badges (draft/in_review/published)
- Quick actions: create new, edit existing

### 3.5 Earnings
- Lifetime, monthly, pending payout, paid out stats
- Revenue breakdown by course
- Monthly earnings timeline
- Payout history and settings

---

## 4. User Flows — Admin

### 4.1 Creator Approval
```
GET /api/admin/creators/pending → list pending applications
PATCH /api/admin/creators/{id}/approve → approve creator
```

### 4.2 Course Approval
```
GET /api/admin/courses/pending → list courses in review
PATCH /api/admin/courses/{id}/approve → publish course
PATCH /api/admin/courses/{id}/reject → return to draft with reason
```

*Note: No admin UI exists yet — API-only.*

---

## 5. Screen-by-Screen UI/UX Reference

### 5.1 Landing Page (`/`)
- **Layout:** Full-width, light mode, desktop-optimized
- **Header:** "openED" logo + Login / Sign up buttons
- **Hero:** "The Learning Engine That Makes Education Stick" + subtitle
- **Features:** 3-column grid (Spaced Repetition, Guided Paths, Readiness Tracking)
- **Categories:** Certification, Academic, Professional, General Knowledge pills
- **Footer:** Branding tagline "Learning that sticks"
- **CTAs:** "Browse courses" → /browse, "Get started free" → /signup

### 5.2 Login Page (`/login`)
- **Layout:** Centered card (max-w-sm), white background
- **Elements:** Logo, "Welcome back" subtitle, email input, password input
- **Actions:** Submit form, Google OAuth, GitHub OAuth, "Sign up" link
- **States:** Loading (button shows "Logging in..."), Error (red banner)

### 5.3 Signup Page (`/signup`)
- **Layout:** Same as login
- **Elements:** Logo, "Create your account" subtitle, display name (optional), email, password (min 6)
- **Actions:** Submit form, OAuth buttons, "Log in" link
- **On success:** Redirect to /home

### 5.4 Home Page (`/home`)
- **With courses:** "Welcome back" heading, active course cards (animated, staggered), search bar, category pills, popular courses section
- **Empty state:** Welcome icon, "You have not enrolled" message, "Browse courses" CTA, search bar
- **Course card:** Title, "active" badge, current topic, readiness %, questions seen, "Continue studying" button
- **Search:** Enter key navigates to /browse?search=...
- **Categories:** Navigate to /browse?category=...

### 5.5 Browse Page (`/browse`)
- **Layout:** Search input, horizontal category filter buttons, course cards grouped by category
- **Filters:** All, Certification, Academic, Professional (active = blue bg)
- **Course card:** Abbreviation icon, title, creator, tags (question count, difficulty, free badge), progress or arrow
- **Pagination:** "Load more courses" button (cursor-based)
- **States:** Loading (skeleton cards), No results (clear filters button)

### 5.6 Course Overview (`/course/{slug}`)
- **Header:** Back button, "Course overview" title
- **Content:** Thumbnail/icon, title, creator, category + difficulty badges, description
- **Stats grid (3x2):** Questions, Modules, Exam fee, Pass score, Exam time, Topics
- **If enrolled:** Blue progress card (readiness %, progress bar, questions/sessions)
- **Actions:** "Continue studying" (enrolled) or "Enroll in this course" (not enrolled)

### 5.7 Enrollment Page (`/course/{slug}/enroll`)
- **Layout:** Centered, header with back button
- **Content:** Course icon, title, creator, "What you will get" checklist (5 items with checkmarks)
- **Price card:** Large price, "One-time, lifetime access" or "included with Pro"
- **Action:** "Enroll now" button (loading: "Enrolling...")
- **On success:** Redirect to course path

### 5.8 Course Path (`/course/{slug}/path`)
- **Layout:** Full-height, no bottom nav
- **Header:** Back button, course title, readiness %
- **Complete banner:** Green background if all topics done, links to /course/{slug}/complete
- **Module sections:** Module header pill with name + weight %
- **Topic nodes (zigzag layout):**
  - Completed: green border circle with number
  - Current: blue pinging circle, "?" info button
  - Locked: gray circle, dimmed text
- **Connecting lines:** Green (completed/current), gray (locked)
- **Interactions:** Current → practice, "?" → guidebook, completed → review practice

### 5.9 Practice Session (`/practice/{slug}`)
- **Layout:** Full-screen, no bottom nav, min-h-[100dvh]
- **Top bar:** X exit button, progress bar, "X/Y" counter
- **Question area:** Topic badge (blue), requeue indicator (amber if review), question text
- **Options:** Lettered buttons (A, B, C, D), states: default/selected/correct/incorrect
- **Before submit:** "Check" button (disabled if no selection)
- **After submit — correct:** Green bottom sheet, explanation, "Continue" button
- **After submit — wrong:** Red bottom sheet, why wrong + why right, "Got it" button
- **Exit modal:** "Leave session?" with "Keep going" / "Leave" buttons
- **Requeue:** Wrong answers replayed after main questions

### 5.10 Session Complete (`/practice/{slug}/complete`)
- **Layout:** Centered results
- **Content:** Checkmark icon, "Session complete", stats (correct/total, readiness delta)
- **Topic breakdown:** Table with topic name, correct/total, review badge
- **Unlocked topic:** Blue banner if new topic unlocked
- **Actions:** "Continue to path" (primary), "Review X mistake(s)" (if any)

### 5.11 Review Mistakes (`/practice/{slug}/review`)
- **Content:** List of wrong answers with question text, selected vs correct options, explanation

### 5.12 Course Complete (`/course/{slug}/complete`)
- **Content:** Green checkmark, "Course complete!", final stats (readiness, questions, accuracy, sessions)
- **Module breakdown:** Table with readiness per module, color-coded bars
- **Actions:** "Browse more courses", "Keep practicing reviews"

### 5.13 Profile (`/profile`)
- **Header:** "Profile" heading, red "Log out" button
- **User card:** Avatar circle with initials, display name, "Joined {date}"
- **Active courses:** Course cards with progress bars linking to path
- **Course history:** Completed courses with "Completed" badge and date
- **Stats grid:** Total questions answered, overall accuracy %
- **Empty state:** "No courses yet" with browse button

### 5.14 Creator Dashboard (`/creator`)
- **Layout:** Desktop, sidebar + main content
- **Stats (4-col):** Published courses, students, earnings, avg rating
- **Course table:** Title, status badge, question/module/topic counts, actions

### 5.15 Creator Courses (`/creator/courses`)
- **Filters:** All, Published, Drafts, In Review
- **Course list:** Same table as dashboard, filterable

### 5.16 Create Course Wizard (`/creator/courses/new`)
- **5-step wizard** with visual step indicator (numbered circles, connecting lines)
- See Section 3.2 for full step-by-step detail

### 5.17 Creator Earnings (`/creator/earnings`)
- **Stats (4-col):** Lifetime, this month, pending, paid out
- **Tables:** Revenue by course, monthly breakdown, payout history
- **Payout settings:** Method dropdown, threshold dropdown, save button

### 5.18 Creator Settings (`/creator/settings`)
- **Profile card:** Name, email, bio textarea, website URL
- **Notifications:** 4 toggle switches (enrollments, reviews, payouts, updates)
- **Danger zone:** Red "Delete Creator Account" button

---

## 6. Navigation Map

```
/ (Landing)
├── /login
├── /signup
└── /browse

/home (Dashboard)
├── /course/{slug}/path (Continue studying)
├── /browse (Browse courses)
├── /browse?search=... (Search)
└── /browse?category=... (Category filter)

/browse
└── /course/{slug} (Course detail)

/course/{slug}
├── /course/{slug}/enroll → /course/{slug}/path
├── /course/{slug}/path
│   ├── /practice/{slug}?topic={id}
│   ├── /course/{slug}/guidebook?topic={id}
│   └── /course/{slug}/complete
└── /course/{slug}/complete
    ├── /browse
    └── /course/{slug}/path

/practice/{slug}
├── /course/{slug}/path (exit)
└── /practice/{slug}/complete
    ├── /course/{slug}/path (continue)
    └── /practice/{slug}/review (review mistakes)

/profile
├── /course/{slug}/path (course card)
├── /browse
└── /login (logout)

/creator (Dashboard)
├── /creator/courses
├── /creator/courses/new
│   └── /creator/courses/new?edit={id}
├── /creator/earnings
└── /creator/settings
```

**Bottom Navigation (3 tabs):**
- Home (`/home`) — active icon fill
- Browse (`/browse`) — active icon fill
- Profile (`/profile`) — active icon fill

**Hidden on:** `/practice/*`, `/session/*`

---

## 7. Design System

### 7.1 Color Palette

**Backgrounds & Surfaces**
| Token | Hex | Usage |
|-------|-----|-------|
| `cp-bg` | #ffffff | Page background |
| `cp-bg-secondary` | #f8fafc | Secondary background |
| `cp-surface` | #ffffff | Card/panel background |
| `cp-surface-light` | #f1f5f9 | Subtle surface |
| `cp-surface-hover` | #e2e8f0 | Hover state |
| `cp-border` | #e2e8f0 | Borders |
| `cp-border-light` | #f1f5f9 | Subtle borders |

**Text**
| Token | Hex | Usage |
|-------|-----|-------|
| `cp-text` | #0f172a | Primary text |
| `cp-text-secondary` | #475569 | Secondary text |
| `cp-text-muted` | #94a3b8 | Muted/placeholder |
| `cp-dark` | #0f172a | Dark emphasis |
| `cp-darker` | #020617 | Darkest |

**Primary (Blue)**
| Token | Hex | Usage |
|-------|-----|-------|
| `cp-primary` | #3B82F6 | Primary actions, links |
| `cp-primary-light` | #60A5FA | Hover, light variant |
| `cp-primary-dark` | #2563EB | Active/pressed |
| `cp-primary-glow` | rgba(59,130,246,0.15) | Glow effects |

**Accent (Green)**
| Token | Hex | Usage |
|-------|-----|-------|
| `cp-accent` | #22C55E | Success, completion |
| `cp-accent-light` | #4ADE80 | Light variant |
| `cp-accent-dark` | #16A34A | Dark variant |

**Semantic**
| Token | Hex | Usage |
|-------|-----|-------|
| `cp-success` | #22C55E | Correct answers, completed |
| `cp-warning` | #F59E0B | Warnings, review items |
| `cp-danger` | #EF4444 | Errors, wrong answers |
| `cp-purple` | #A855F7 | Accent differentiation |
| `cp-orange` | #F97316 | Additional accent |

*Note: `cp-green` is aliased to `cp-primary` (blue) for legacy compatibility.*

### 7.2 Typography

| Property | Value |
|----------|-------|
| Font family (body) | Inter, system-ui, -apple-system, sans-serif |
| Font family (mono) | ui-monospace, SF Mono, Menlo, monospace |
| Weights used | 400 (regular), 500 (medium), 600 (semibold), 700 (bold), 800, 900 |
| Stats/numbers | font-mono for tabular alignment |

### 7.3 Animations

| Class | Effect | Duration |
|-------|--------|----------|
| `animate-fade-up` | Fade in + slide up 12px | 350ms ease-out |
| `animate-slide-in` | Fade in + slide right 16px | 300ms ease-out |
| `animate-bounce-in` | Scale 0.8→1.04→1 with fade | 400ms ease-out |
| `animate-pop` | Scale 1→1.08→1 | 250ms ease |
| `animate-slide-up` | Slide up from 100% | 350ms ease-out |
| `animate-fade-in` | Simple fade in | 250ms ease-out |
| `animate-float-up` | Float up 40px + fade out | 1200ms ease-out |
| `animate-shimmer` | Gradient shine sweep | 2000ms infinite |
| `animate-shake` | Horizontal oscillation ±4px | 400ms ease-out |
| `animate-correct-pulse` | Green box-shadow pulse | 500ms ease-out |

**Stagger System:** Children of `.stagger` receive incremental delays: 0ms, 60ms, 120ms, ..., 420ms (8 children max).

### 7.4 Button System

| Class | Background | Text | Border | Hover |
|-------|-----------|------|--------|-------|
| `.btn-primary` | cp-primary | white | none | cp-primary-dark |
| `.btn-secondary` | cp-surface-light | cp-text | cp-border | cp-surface-hover |
| `.btn-ghost` | transparent | cp-primary | cp-border | cp-surface-light + blue border |

All buttons: `font-semibold`, `rounded-xl (0.75rem)`, `px-5 py-2.5`, `active:scale(0.98)`, `transition 150ms`.

### 7.5 Mobile / PWA Utilities

- `.pb-safe` / `.pt-safe` — safe area inset padding
- `-webkit-tap-highlight-color: transparent` on interactive elements
- `-webkit-user-select: none` on buttons/links
- `scroll-behavior: smooth`, `-webkit-overflow-scrolling: touch`
- Custom scrollbar: 6px width, cp-border colored

---

## 8. Component Library

### 8.1 Layout Components

**AppShell** (`components/layout/AppShell.tsx`)
- Wraps all authenticated pages
- Props: `children`, `hideBottomNav?`, `userInitial?`, `streak?`, `totalXp?`
- Renders TopBar + main content (max-w-lg, mx-auto) + BottomNav
- Auto-hides BottomNav on /practice and /session routes

**TopBar** (`components/layout/TopBar.tsx`)
- Fixed sticky header, white background, border-bottom
- Left: "openED" logo (links to /home)
- Right: User initial circle (links to /profile)

**BottomNav** (`components/layout/BottomNav.tsx`)
- Fixed bottom, 3 tabs: Home, Browse, Profile
- Active indicator: blue dot above icon, filled icon, blue text
- Inactive: outline icon, muted text
- `aria-label="Main navigation"`, `aria-current="page"` on active

### 8.2 UI Components

**Button** (`components/ui/Button.tsx`)
- Props: `variant` (primary|secondary|ghost|danger|success), `size` (sm|md|lg), `loading?`
- Uses `forwardRef`, extends HTMLButtonAttributes
- Loading state: spinning icon, disabled
- Active: `translate-y-[2px]` press effect with border-b reduction

**Badge** (`components/ui/Badge.tsx`)
- Props: `children`, `variant` (default|success|warning|danger|accent)
- Inline span, px-2.5 py-0.5, rounded-lg, text-[11px], font-semibold, border-2

**ProgressBar** (`components/ui/ProgressBar.tsx`)
- Props: `value` (0-1), `color?` (accent|success|warning|danger|auto), `size?` (sm|md|lg), `showLabel?`
- Auto-color: >=75% green, >=50% yellow, <50% red
- Accessible: `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- Animation: 700ms ease-out transition, progress-shine effect

### 8.3 Error Boundaries

**App Error** (`app/(app)/error.tsx`)
- Catches all authenticated page errors
- Shows "Something went wrong" with retry button
- Logs error to console

**Practice Error** (`app/(app)/practice/[courseSlug]/error.tsx`)
- Practice-specific error boundary
- "Your progress has been saved" reassurance message
- "Try again" and "Return to course" buttons

---

## 9. API Reference (30 Endpoints)

### 9.1 Authentication (4 endpoints)

#### `POST /api/auth/signup`
- **Body:** `{ email, password, display_name? }`
- **Response:** `{ user }` — Supabase user object
- **Side effect:** Creates profile via database trigger

#### `POST /api/auth/login`
- **Body:** `{ email, password }`
- **Response:** `{ user, session }` — includes access_token

#### `POST /api/auth/logout`
- **Response:** `{ success: true }`

#### `POST /api/auth/oauth`
- **Body:** `{ provider }` — "google" or "github"
- **Response:** `{ url }` — OAuth redirect URL
- **Callback:** `GET /api/auth/callback?code=...` → redirects to /home

### 9.2 Dashboard & Profile (2 endpoints)

#### `GET /api/dashboard`
- **Auth:** Required
- **Response:**
```typescript
{
  active_courses: [{
    id, course_id,
    course: { id, title, slug, description, category, difficulty, thumbnail_url, provider_name },
    status: 'active',
    readiness_score: number,        // 0-100
    current_topic_id: string | null,
    current_topic_title: string | null,
    questions_seen: number,
    questions_correct: number,
    questions_total: number,         // active questions in course
    topics_total: number,
    sessions_completed: number,
    last_session_at: string | null,  // ISO
    enrolled_at: string,             // ISO
    due_cards: number                // cards due for review today
  }]
}
```

#### `GET /api/profile`
- **Auth:** Required
- **Response:**
```typescript
{
  user: { id, display_name, avatar_url?, role, timezone, onboarding_complete },
  stats: {
    courses_enrolled, courses_completed,
    total_questions_seen, total_questions_correct,
    accuracy_percent,    // 0-100
    total_sessions, total_reviews
  },
  completed_courses: [{ ...user_course, course: { id, title, slug, ... } }]
}
```

### 9.3 Course Browse & Enrollment (5 endpoints)

#### `GET /api/courses`
- **Params:** `category?`, `difficulty?`, `search?`, `sort?` (published_at|title), `cursor?`, `limit?` (1-50, default 20)
- **Response:**
```typescript
{
  courses: [{
    id, title, slug, description, category, difficulty,
    is_free, price_cents, thumbnail_url, status,
    provider_name, passing_score, max_score,
    exam_duration_minutes, exam_fee_cents,
    creator: { id, creator_name, bio?, expertise_areas? },
    stats: { module_count, topic_count, question_count },
    user_progress?: {
      status, readiness_score, questions_seen,
      questions_correct, sessions_completed
    } | null
  }],
  next_cursor: string | null,
  has_more: boolean
}
```

#### `GET /api/courses/{slug}`
- **Response:** Single course with all fields + cert_info + creator + stats + user_progress

#### `POST /api/courses/{slug}/enroll`
- **Body:** Empty
- **Response (201):** `{ user_course }` — initial enrollment with status 'active'
- **Error 409:** Already enrolled

#### `GET /api/courses/{slug}/path`
- **Response:**
```typescript
{
  course_id, readiness_score, current_topic_id,
  modules: [{
    id, title, description, weight_percent, display_order,
    topics: [{
      id, title, description, display_order,
      status: 'completed' | 'current' | 'locked',
      readiness: number,       // 0-1
      questions_seen: number,
      questions_total: number
    }]
  }]
}
```
- **Error 403:** Not enrolled

#### `GET /api/courses/{slug}/guidebook`
- **Response:** Module/topic tree with `has_guidebook` flags and `current_topic_id`

### 9.4 Topics (1 endpoint)

#### `GET /api/topics/{id}/guidebook`
- **Response:** Topic with `guidebook_content` (markdown/HTML) + prev/next topic links

### 9.5 Practice Sessions (4 endpoints)

#### `GET /api/session/generate`
- **Params:** `course_id` (required), `question_count?` (default 10), `topic_id?`
- **Response:**
```typescript
{
  session_id: string,    // UUID
  course_id: string,
  questions: [{
    id, topic_id, module_id, course_id,
    question_text, question_type,
    options: [{ id, text }],   // NO is_correct — server validates
    difficulty, tags
  }]
}
```
- **Note:** `correct_option_ids` intentionally excluded (prevents cheating)

#### `POST /api/session/answer`
- **Body:** `{ session_id, question_id, selected_option_ids: string[], time_spent_ms? }`
- **Response:**
```typescript
{
  is_correct: boolean,
  correct_option_ids: string[],
  explanation: string,
  fsrs: {
    rating: 1 | 3,              // 1=Again, 3=Good
    next_review_date: string,    // ISO
    state: CardState
  }
}
```
- **Side effects:** Updates user_card_states (FSRS), inserts review_log, updates user_courses counts

#### `POST /api/session/complete`
- **Body:** `{ session_id }`
- **Response:**
```typescript
{
  correct_count, total_count, accuracy_percent,
  readiness_before, readiness_after, readiness_delta,
  topic_breakdown: [{
    topic_id, topic_title,
    correct, total, accuracy_percent
  }],
  unlocked_topic?: { id, title } | null
}
```
- **Side effects:** Recalculates readiness (FSRS-weighted), may advance current_topic_id, may complete course

#### `GET /api/session/{id}/review`
- **Response:** `{ session_id, mistakes: [{ question details + selected vs correct }] }`

### 9.6 Creator Management (12 endpoints)

#### `GET /api/creator/status`
- **Response:** `{ status: 'not_applied'|'pending'|'approved'|'rejected', applied_at?, approved_at? }`

#### `POST /api/creator/apply`
- **Body:** `{ creator_name, bio?, expertise_areas?, credentials? }`
- **Response (201):** `{ creator_id, status: 'pending' }`

#### `GET /api/creator/dashboard`
- **Response:** Creator profile + stats (courses, students, earnings, rating) + course list

#### `GET /api/creator/earnings`
- **Response:** Lifetime/monthly/pending/paid stats + revenue by course + monthly breakdown + payout history
- *Note: Currently returns mock data*

#### `POST /api/creator/courses`
- **Body:** `{ title, description?, category?, difficulty?, is_free?, price_cents?, ...cert_fields }`
- **Response (201):** `{ id, slug, status: 'draft' }`
- **Error 403:** Creator not approved

#### `GET /api/creator/courses/{id}`
- **Response:** Full course with modules/topics/question counts

#### `PATCH /api/creator/courses/{id}`
- **Body:** Any course fields
- **Response:** Updated course

#### `DELETE /api/creator/courses/{id}`
- **Response:** `{ success: true }`
- **Error 409:** Can't delete published courses

#### `POST /api/creator/courses/{id}/upload`
- **Response:** `{ uploaded_files: [{ id, name, type, size_bytes, status }] }`
- *Note: Currently stubbed*

#### `POST /api/creator/courses/{id}/process`
- **Response (202):** `{ process_id, status: 'started' }`
- *Note: Currently stubbed*

#### `GET /api/creator/courses/{id}/process/status`
- **Response:** `{ status, progress: 0-100, steps: [{ name, status }], result? }`
- *Note: Currently returns mock 'complete' status*

#### `GET /api/creator/courses/{id}/review`
- **Response:** Course stats + validation warnings + module/topic structure + sample questions

#### `PATCH /api/creator/questions/{id}`
- **Body:** Question field updates
- **Response:** Updated question

#### `POST /api/creator/courses/{id}/submit`
- **Response:** `{ status: 'in_review', warnings, stats }`
- **Validation:** >= 50 questions, >= 3 topics/module, >= 10 questions/topic
- **Error 409:** Not in draft status

### 9.7 Admin (5 endpoints)

#### `GET /api/admin/creators/pending`
- **Response:** `{ creators: [{ ...creator, profile }] }`

#### `PATCH /api/admin/creators/{id}/approve`
- **Response:** `{ creator: { id, status: 'approved' } }`

#### `GET /api/admin/courses/pending`
- **Response:** `{ courses: [{ ...course, creator, stats }] }`

#### `PATCH /api/admin/courses/{id}/approve`
- **Response:** `{ course: { id, status: 'published', published_at } }`

#### `PATCH /api/admin/courses/{id}/reject`
- **Body:** `{ reason? }`
- **Response:** `{ course: { id, status: 'draft' }, reason }`

---

## 10. Database Schema (9 Tables)

### 10.1 Entity-Relationship Overview

```
auth.users (Supabase)
    │ 1:1
    ▼
profiles ─── 1:1 ──→ creators
                        │ 1:N
                        ▼
                     courses
                        │ 1:N
                        ▼
                     modules
                        │ 1:N
                        ▼
                      topics
                        │ 1:N
                        ▼
                    questions

profiles ←─── N:1 ──→ user_courses ←── N:1 ──→ courses
                           │
profiles ←─── N:1 ──→ user_card_states ←── N:1 ──→ questions
                           │
profiles ←─── N:1 ──→ review_log ←── N:1 ──→ questions
```

### 10.2 Enum Types

```sql
user_role:          'learner' | 'creator' | 'admin'
creator_status:     'pending' | 'approved' | 'suspended'
course_category:    'certification' | 'academic' | 'professional' | 'general_knowledge' | 'institutional'
course_difficulty:  'beginner' | 'intermediate' | 'advanced'
course_status:      'draft' | 'in_review' | 'published' | 'archived'
question_type:      'multiple_choice' | 'multiple_select' | 'true_false'
question_source:    'creator_original' | 'ai_generated' | 'ai_enhanced'
enrollment_status:  'active' | 'paused' | 'completed'
card_state:         'new' | 'learning' | 'review' | 'relearning'
```

### 10.3 Table Definitions

#### `profiles`
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID PK | FK → auth.users ON DELETE CASCADE |
| display_name | TEXT | NOT NULL |
| avatar_url | TEXT | nullable |
| role | user_role | DEFAULT 'learner' |
| timezone | TEXT | DEFAULT 'America/Los_Angeles' |
| onboarding_complete | BOOLEAN | DEFAULT false |
| created_at | TIMESTAMPTZ | DEFAULT now() |
| updated_at | TIMESTAMPTZ | auto-trigger |

#### `creators`
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID PK | DEFAULT gen_random_uuid() |
| user_id | UUID | UNIQUE NOT NULL, FK → profiles |
| creator_name | TEXT | NOT NULL |
| bio | TEXT | nullable |
| expertise_areas | TEXT[] | DEFAULT '{}' |
| credentials | TEXT | nullable |
| status | creator_status | DEFAULT 'pending' |
| created_at | TIMESTAMPTZ | DEFAULT now() |

#### `courses`
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID PK | DEFAULT gen_random_uuid() |
| creator_id | UUID | NOT NULL, FK → creators |
| title | TEXT | NOT NULL |
| slug | TEXT | UNIQUE NOT NULL |
| description | TEXT | nullable |
| guidebook_content | TEXT | nullable |
| category | course_category | DEFAULT 'general_knowledge' |
| difficulty | course_difficulty | DEFAULT 'beginner' |
| thumbnail_url | TEXT | nullable |
| is_free | BOOLEAN | DEFAULT true |
| price_cents | INTEGER | nullable |
| exam_fee_cents | INTEGER | nullable |
| passing_score | INTEGER | nullable |
| max_score | INTEGER | nullable |
| exam_duration_minutes | INTEGER | nullable |
| total_questions_on_exam | INTEGER | nullable |
| provider_name | TEXT | nullable |
| provider_url | TEXT | nullable |
| status | course_status | DEFAULT 'draft' |
| published_at | TIMESTAMPTZ | nullable |
| created_at | TIMESTAMPTZ | DEFAULT now() |
| updated_at | TIMESTAMPTZ | auto-trigger |

#### `modules`
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID PK | DEFAULT gen_random_uuid() |
| course_id | UUID | NOT NULL, FK → courses CASCADE |
| title | TEXT | NOT NULL |
| description | TEXT | nullable |
| guidebook_content | TEXT | nullable |
| weight_percent | INTEGER | nullable |
| display_order | INTEGER | DEFAULT 0 |
| created_at | TIMESTAMPTZ | DEFAULT now() |

#### `topics`
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID PK | DEFAULT gen_random_uuid() |
| module_id | UUID | NOT NULL, FK → modules CASCADE |
| course_id | UUID | NOT NULL, FK → courses CASCADE |
| title | TEXT | NOT NULL |
| description | TEXT | nullable |
| guidebook_content | TEXT | nullable |
| display_order | INTEGER | DEFAULT 0 |
| created_at | TIMESTAMPTZ | DEFAULT now() |

#### `questions`
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID PK | DEFAULT gen_random_uuid() |
| topic_id | UUID | NOT NULL, FK → topics CASCADE |
| module_id | UUID | NOT NULL, FK → modules CASCADE |
| course_id | UUID | NOT NULL, FK → courses CASCADE |
| creator_id | UUID | NOT NULL, FK → creators |
| question_text | TEXT | NOT NULL |
| question_type | question_type | DEFAULT 'multiple_choice' |
| options | JSONB | DEFAULT '[]' — `[{id, text, is_correct?}]` |
| correct_option_ids | TEXT[] | DEFAULT '{}' |
| explanation | TEXT | DEFAULT '' |
| difficulty | INTEGER | CHECK 1-5, DEFAULT 3 |
| tags | TEXT[] | DEFAULT '{}' |
| source | question_source | DEFAULT 'creator_original' |
| is_active | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMPTZ | DEFAULT now() |
| updated_at | TIMESTAMPTZ | auto-trigger |

#### `user_courses`
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID PK | DEFAULT gen_random_uuid() |
| user_id | UUID | NOT NULL, FK → profiles |
| course_id | UUID | NOT NULL, FK → courses |
| status | enrollment_status | DEFAULT 'active' |
| readiness_score | FLOAT | DEFAULT 0.0 |
| current_topic_id | UUID | FK → topics, nullable |
| questions_seen | INTEGER | DEFAULT 0 |
| questions_correct | INTEGER | DEFAULT 0 |
| sessions_completed | INTEGER | DEFAULT 0 |
| last_session_at | TIMESTAMPTZ | nullable |
| enrolled_at | TIMESTAMPTZ | DEFAULT now() |
| completed_at | TIMESTAMPTZ | nullable |
| | | UNIQUE(user_id, course_id) |

#### `user_card_states`
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID PK | DEFAULT gen_random_uuid() |
| user_id | UUID | NOT NULL, FK → profiles |
| question_id | UUID | NOT NULL, FK → questions |
| course_id | UUID | NOT NULL, FK → courses |
| topic_id | UUID | NOT NULL, FK → topics |
| module_id | UUID | NOT NULL, FK → modules |
| state | card_state | DEFAULT 'new' |
| difficulty | FLOAT | CHECK 1.0-10.0, DEFAULT 5.0 |
| stability | FLOAT | DEFAULT 0.0 |
| due_date | DATE | DEFAULT CURRENT_DATE |
| last_review_date | TIMESTAMPTZ | nullable |
| reps | INTEGER | DEFAULT 0 |
| lapses | INTEGER | DEFAULT 0 |
| last_rating | INTEGER | CHECK (1,3,4), nullable |
| elapsed_days | INTEGER | DEFAULT 0 |
| scheduled_days | INTEGER | DEFAULT 0 |
| created_at | TIMESTAMPTZ | DEFAULT now() |
| updated_at | TIMESTAMPTZ | auto-trigger |
| | | UNIQUE(user_id, question_id) |

#### `review_log`
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID PK | DEFAULT gen_random_uuid() |
| user_id | UUID | NOT NULL, FK → profiles |
| question_id | UUID | NOT NULL, FK → questions |
| course_id | UUID | NOT NULL, FK → courses |
| topic_id | UUID | NOT NULL, FK → topics |
| module_id | UUID | NOT NULL, FK → modules |
| rating | INTEGER | CHECK (1,3,4), NOT NULL |
| is_correct | BOOLEAN | NOT NULL |
| selected_option_ids | TEXT[] | DEFAULT '{}' |
| time_spent_ms | INTEGER | DEFAULT 0 |
| state_before | card_state | NOT NULL |
| state_after | card_state | NOT NULL |
| difficulty_before | FLOAT | NOT NULL |
| difficulty_after | FLOAT | NOT NULL |
| stability_before | FLOAT | NOT NULL |
| stability_after | FLOAT | NOT NULL |
| due_date_before | DATE | NOT NULL |
| due_date_after | DATE | NOT NULL |
| elapsed_days | INTEGER | DEFAULT 0 |
| scheduled_days | INTEGER | DEFAULT 0 |
| session_id | UUID | NOT NULL |
| reviewed_at | TIMESTAMPTZ | DEFAULT now() |

### 10.4 RLS Policies

All 9 tables have Row Level Security enabled:
- **profiles:** Read/update own only
- **creators:** Public read (approved), insert/view own
- **courses:** Public read (published), creator manages own
- **modules/topics:** Public read (published courses), creator manages own
- **questions:** Public read (active + published), creator manages own
- **user_courses:** View/insert/update own
- **user_card_states:** View/insert/update own
- **review_log:** View/insert own

### 10.5 Indexes (16 total)

**FSRS Critical Path:**
- `(user_id, course_id, due_date, state)` on user_card_states
- `(user_id, question_id)` on user_card_states

**Review Log:**
- `(user_id, course_id, reviewed_at DESC)`
- `(session_id)`

**Course Browsing:**
- `(status, category)`, `(slug)`, `(creator_id)` on courses

**Content Hierarchy:**
- `(course_id, display_order)` on modules
- `(module_id, display_order)` on topics
- `(course_id)` on topics
- `(topic_id, is_active)` on questions
- `(course_id, is_active)` on questions

**User Data:**
- `(user_id, status)` on user_courses
- `(course_id)` on user_courses
- `(user_id)` on creators
- `(status)` on creators

### 10.6 Seed Data

- **Demo user:** `a1111111-1111-1111-1111-111111111111` (john.doe@opened.app)
- **Creator:** Jason Dion (approved, same user)
- **3 courses:** CompTIA Security+ SY0-701, CompTIA A+ Core 1, World Geography
- **Security+ detail:** 5 modules (weights: 12%, 22%, 18%, 28%, 20%), 20 topics, 50 questions
- **Question types:** multiple_choice, multiple_select, true_false
- **Difficulties:** 1-3 range in seed

---

## 11. FSRS v5 Spaced Repetition Engine

**File:** `lib/engine/fsrs.ts`

### 11.1 Core Parameters

| Parameter | Value | Purpose |
|-----------|-------|---------|
| TARGET_RETENTION | 0.9 | 90% probability of recall at review time |
| MAX_INTERVAL | 365 | Maximum days between reviews |
| FUZZ_FACTOR | 0.1 | ±10% jitter to prevent clustering |
| DEFAULT_DIFFICULTY | 5.0 | Starting difficulty (scale 1-10) |
| INITIAL_STABILITY | {1: 0.4, 3: 2.0, 4: 5.0} | Days of stability by first rating |

### 11.2 Card States

```
new ──→ learning ──→ review ──→ review (loop)
                        │
                        ▼ (on lapse)
                   relearning ──→ review
```

### 11.3 Rating System

| Rating | Meaning | Trigger |
|--------|---------|---------|
| 1 (Again) | Failed recall | Wrong answer |
| 3 (Good) | Successful recall | Correct answer |
| 4 (Easy) | Easy recall | Currently unused in UI |

### 11.4 Core Formulas

**Retrievability (Power Forgetting Curve):**
```
R(t) = (1 + t / (9 × S))^(-1)
```
- t = elapsed days since last review
- S = stability (days until R drops to target retention)

**Difficulty Update:**
```
D' = clamp(D - 0.5 × (G - 3), 1.0, 10.0)
```
- G=1 (wrong): D increases by 1.0
- G=3 (correct): D unchanged
- G=4 (easy): D decreases by 0.5

**Stability After Successful Recall:**
```
S'_recall = S × (1 + e^0.05 × (11 - D) × S^(-0.2) × (e^(0.1×(1-R)) - 1))
```
- Minimum: max(S'_recall, S + 0.1)

**Stability After Lapse:**
```
S'_lapse = S × min(1, e^(-0.5) × (D-1)^0.2 × S^(-0.3) × (e^(0.2×(1-R)) - 1) + 0.1)
```
- Minimum: 0.1

**Interval from Stability:**
```
I = round(S × 9 × (1/R_target - 1))
```
- For 90% retention: I ≈ S × 1.0
- Capped at MAX_INTERVAL (365 days), minimum 1 day
- Fuzz applied: ±10% jitter for intervals > 2 days

### 11.5 Review Processing Flow

```
1. Get current card state (or null for first review)
2. Compute elapsed days since last review
3. Compute current retrievability R
4. Determine rating from correctness (1 or 3)
5. Update difficulty: D' = D - 0.5 * (rating - 3)
6. Update stability:
   - If correct: S'_recall formula
   - If wrong: S'_lapse formula
7. Compute next interval from new stability
8. Apply fuzz jitter
9. Set next due_date = today + interval
10. Update card state (new→learning, learning→review, review→relearning on fail)
11. Persist to user_card_states + append to review_log
```

---

## 12. Session Generation Algorithm

**File:** `lib/engine/session-generator.ts`

### 12.1 Three-Pool Strategy

| Pool | % of Session | Source | Selection |
|------|-------------|--------|-----------|
| Pool 1 (Due) | 60% | Cards with due_date <= today | Most overdue first |
| Pool 2 (Weak) | 25% | Unseen cards from weakest started topic | Easiest first |
| Pool 3 (New) | 15% | Unseen cards from current topic on path | Easiest first |

**Default session size:** 10 questions

### 12.2 Pool Fetching

**Pool 1 — Due Reviews:**
```sql
SELECT * FROM user_card_states
WHERE user_id = ? AND course_id = ? AND due_date <= TODAY AND state != 'new'
ORDER BY due_date ASC
LIMIT 6
```
Then fetch corresponding questions by ID.

**Pool 2 — Weak Topic Fill:**
1. Fetch all non-'new' card states for user+course
2. Group by topic_id, compute average stability per topic
3. Sort topics by avg stability ASC (weakest first)
4. For weakest topics, fetch unseen active questions ORDER BY difficulty ASC
5. Batch query: single `.in('topic_id', weakTopicIds)` (no N+1)

**Pool 3 — New Cards:**
1. Get current_topic_id from user_courses enrollment
2. Fallback: find first topic by module.display_order + topic.display_order
3. Fetch unseen active questions from that topic ORDER BY difficulty ASC

### 12.3 Redistribution

```
If Pool 1 shortfall:
  Pool 2 gets 60% of surplus
  Pool 3 gets 40% of surplus

If still short:
  Backfill from ANY unseen questions in course (difficulty ASC)
```

### 12.4 Final Processing

1. Combine all pools
2. Fisher-Yates shuffle (randomize order)
3. Strip `is_correct` from options (client never sees answers)

### 12.5 Safety

- UUID validation on all exclude filter values
- Empty exclude sets skip the `.not()` filter entirely
- Backfill ensures session has questions even if all pools are empty

---

## 13. Readiness Score Calculation

**File:** `lib/engine/readiness.ts`

### 13.1 Formula

```
For each card c in topic t:
  R_c = retrievability(elapsed_days_c, stability_c)

Topic score = avg(R_c for all non-'new' cards in topic)

Module score = avg(topic_scores for topics with cards in module)

Overall readiness = SUM(module_score × weight_percent / 100)
```

### 13.2 Behavior

- Only considers cards with state != 'new' (must have been reviewed at least once)
- Unstarted modules contribute 0 (penalizes not studying all domains)
- Returns 0-1, stored as 0-100 in user_courses.readiness_score
- Recalculated after every session completion via `updateReadinessScore()`

### 13.3 Topic Advancement

- Topic unlocks when current topic readiness >= 0.7 (70%)
- Next topic determined by display_order within module, then next module
- Course completes when all topics done AND overall readiness >= 70%

---

## 14. State Management (Zustand)

**File:** `lib/store/index.ts`

### 14.1 Store Shape

```typescript
interface AppStore {
  // Session state
  sessionId: string | null
  courseId: string | null
  questions: SessionQuestion[]
  currentIndex: number
  answers: Record<string, {
    selectedIds: string[]
    isCorrect: boolean
    timeMs: number
  }>
  sessionStartTime: number | null
  questionStartTime: number | null
  isComplete: boolean

  // Persists across navigation
  sessionReview: SessionReviewData | null

  // Actions
  startSession(sessionId, courseId, questions): void
  answerQuestion(questionId, selectedIds, isCorrect): void
  nextQuestion(): void
  completeSession(): void
  resetSession(): void
  saveSessionForReview(data): void
  clearSessionReview(): void
}
```

### 14.2 Key Types

```typescript
interface SessionQuestion {
  id: string
  topic_id: string
  topic_title: string
  question_text: string
  question_type: 'multiple_choice' | 'multiple_select' | 'true_false'
  options: { id: string; text: string }[]
  difficulty: number
}

interface SessionReviewData {
  sessionId: string
  courseSlug: string
  correctCount: number
  totalCount: number
  accuracyPercent: number
  readinessBefore: number
  readinessAfter: number
  readinessDelta: number
  topicBreakdown: Array<{
    topic_id: string
    topic_title: string
    correct: number
    total: number
    is_review: boolean
  }>
  unlockedTopic: { id: string; title: string } | null
  mistakes: Array<{
    questionId: string
    questionText: string
    topicTitle: string
    questionType: string
    options: { id: string; text: string }[]
    selectedIds: string[]
    correctIds: string[]
    explanation: string
  }>
}
```

---

## 15. Auth & Middleware

### 15.1 Auth Flow

```
Request → Root middleware.ts → lib/supabase/middleware.ts
  │
  ├─ DEMO_MODE=true → Skip all auth, pass through
  │
  ├─ Protected paths (/home, /browse, /profile, /course, /practice, /creator)
  │   └─ No user → Redirect to /login
  │
  ├─ Auth pages (/login, /signup)
  │   └─ Has user → Redirect to /home
  │
  └─ All other paths → Pass through
```

### 15.2 Server-Side Auth Helpers

**`getAuthUser()`** — For server components (pages)
- Returns `{ supabase, userId }` using SSR client with cookies
- DEMO_MODE: uses service client + hardcoded demo user ID

**`getApiUser()`** — For API routes
- Returns `{ supabase, userId, error? }` using service client
- Returns 401 NextResponse if no user and not DEMO_MODE

### 15.3 Supabase Clients

- **Browser client:** `createClient()` — uses anon key, for client components
- **SSR client:** `createClient()` (server.ts) — uses anon key + cookies
- **Service client:** `createServiceClient()` — uses service role key, bypasses RLS

---

## 16. Configuration & Infrastructure

### 16.1 Environment Variables

| Variable | Scope | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Service role (bypasses RLS) |
| `ANTHROPIC_API_KEY` | Server | Claude API for question generation |
| `NEXT_PUBLIC_APP_URL` | Public | App URL (OAuth redirects) |
| `DEMO_MODE` | Server | Enable demo mode (default: false) |

### 16.2 Security Headers

Applied to all routes via `next.config.ts`:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

### 16.3 Dependencies

**Runtime (8):**
- next 16.1.6, react 19.2.3, react-dom 19.2.3
- @supabase/supabase-js 2.99.0, @supabase/ssr 0.9.0
- zustand 5.0.11
- @anthropic-ai/sdk 0.78.0
- dotenv 17.3.1

**Dev (7):**
- typescript 5, tailwindcss 4, @tailwindcss/postcss 4
- eslint 9, eslint-config-next 16.1.6
- @types/node 20, @types/react 19, @types/react-dom 19

### 16.4 TypeScript Config

- `strict: true` — full type checking
- `target: ES2017`
- `module: esnext`, `moduleResolution: bundler`
- Path alias: `@/*` → `./*`
- Incremental compilation enabled

---

## 17. Business Model & Strategy

### 17.1 Pricing Tiers

| Tier | Price | Access |
|------|-------|--------|
| Free | $0 | Foundational courses (math, science, geography) |
| Per-course | $9.99-$19.99 | Lifetime access to one course |
| Pro Monthly | $14.99/month | All courses, all features |
| Pro Annual | $99/year | Same as monthly ($8.33/mo) |
| Enterprise | $15-$25/user/month | Team dashboards, compliance, SSO |

### 17.2 Creator Revenue Share

| Attribution | Creator | Platform |
|------------|---------|----------|
| Creator-referred sale | 80% | 20% |
| Platform-discovered | 60% | 40% |
| Pro subscription pool | 70% | 30% |
| Enterprise | 50% | 50% |

**Founding Creator Program:** 80/20 split permanently locked.

### 17.3 Target Markets

1. **Professional Certifications (beachhead):** CompTIA, AWS, Cisco, PMI
2. **Academic & Cultural Education:** Museums, universities, K-12
3. **Enterprise Training:** AI companies, SaaS, DoD contractors

### 17.4 Go-to-Market

Target creators: Jason Dion (2.8M), Professor Messer (1M+), Mike Meyers (1M+), Stephane Maarek (2.5M+)

**Pitch:** "You already have the content. Zero exclusivity, zero risk. Upload existing questions, earn 70-80% of every sale."

---

## 18. Feature Tier Roadmap

### Tier 1 — MVP (Implemented)
- Auth (email + OAuth)
- Creator apply/approve workflow
- Course upload + AI processing pipeline
- Learner enrollment + FSRS engine
- Practice sessions with 3-pool generation
- Answer submission with FSRS scheduling
- Progress tracking + readiness scoring
- Course path with topic unlocking
- Browse catalog with search/filter
- Profile with stats

### Tier 2 — Real Product Feel (Partially Implemented)
- Streaks + XP system (constants defined, engine stubbed)
- Daily goals
- Session complete feedback (implemented)
- Onboarding flow
- Enhanced browse experience (implemented)

### Tier 3 — Engagement & Growth (Not Started)
- Achievements/badges
- Leagues/leaderboards
- Career GPS
- Study sprints
- Push notifications
- Mobile app (React Native + Expo)

### Stubbed Features
| Feature | File | Status |
|---------|------|--------|
| Achievements | `lib/engine/achievements.ts` | Returns null |
| Levels/XP | `lib/engine/levels.ts` | Hardcoded level 1 |
| File upload | `/api/creator/courses/{id}/upload` | Mock response |
| AI processing | `/api/creator/courses/{id}/process` | Mock response |
| Earnings data | `/api/creator/earnings` | Mock data |

---

## 19. Competitive Landscape

| Platform | Gamification | Spaced Repetition | Creator Marketplace | openED Advantage |
|----------|-------------|-------------------|--------------------|-----------------|
| Duolingo | Best-in-class | Custom algo | No creators | Creator marketplace + certs |
| Quizlet | Basic | Basic | User-generated | FSRS algorithm, fair pricing |
| Pocket Prep | None | Static | No creators | Gamification + marketplace |
| Anki | None | FSRS | Community decks | Duolingo-grade UX |
| Brilliant | Good | None | No creators | All categories + creators |
| Udemy | None | None | Largest | 70-80% share, active learning |
| Kahoot | Great | None | Limited | FSRS + deep explanations |
| Go1 | None | None | Aggregator | Engagement layer |

**Key Differentiator:** No existing platform combines gamification + FSRS spaced repetition + creator marketplace + mobile-first UX.
