# CertPath Database Structure

Complete reference for the CertPath database schema. This document reflects the single migration in `supabase/migrations/001_initial_schema.sql`.

---

## Enums

| Enum | Values |
|------|--------|
| `user_role` | learner, creator, admin |
| `creator_status` | pending, approved, suspended, rejected |
| `course_difficulty` | beginner, intermediate, advanced |
| `course_status` | draft, published, archived |
| `question_type` | multiple_choice, multiple_select, true_false, fill_blank, ordering, matching |
| `step_type` | read, watch, answer, embed, callout |
| `enrollment_status` | active, paused, completed |
| `test_attempt_status` | in_progress, completed, abandoned |

---

## Functions

### `update_updated_at()`
Trigger function that sets `updated_at = now()` before any UPDATE on tables that use it.

### `handle_new_user()`
Trigger function (SECURITY DEFINER) that auto-creates a `profiles` row when a new `auth.users` row is inserted. Extracts `display_name` from user metadata, falling back to the email prefix.

---

## Tables

### 1. profiles

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | UUID (PK, FK -> auth.users) | NO | - |
| display_name | TEXT | NO | - |
| avatar_url | TEXT | YES | NULL |
| role | user_role | NO | 'learner' |
| timezone | TEXT | NO | 'America/Los_Angeles' |
| onboarding_complete | BOOLEAN | NO | false |
| created_at | TIMESTAMPTZ | NO | now() |
| updated_at | TIMESTAMPTZ | NO | now() |

**Triggers:** `profiles_updated_at`, `on_auth_user_created`
**RLS:** Users read/update own profile.

---

### 2. creators

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | UUID (PK) | NO | gen_random_uuid() |
| user_id | UUID (FK -> profiles, UNIQUE) | NO | - |
| creator_name | TEXT | NO | - |
| bio | TEXT | YES | NULL |
| expertise_areas | TEXT[] | NO | '{}' |
| credentials | TEXT | YES | NULL |
| website_url | TEXT | YES | NULL |
| status | creator_status | NO | 'approved' |
| revenue_share_percent | INTEGER | YES | 80 |
| stripe_account_id | TEXT | YES | NULL |
| avatar_url | TEXT | YES | NULL |
| onboarding_checklist_dismissed | BOOLEAN | YES | false |
| created_at | TIMESTAMPTZ | NO | now() |

**RLS:** Public read approved creators. Users insert/read/update own creator.

---

### 3. courses

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | UUID (PK) | NO | gen_random_uuid() |
| creator_id | UUID (FK -> creators) | NO | - |
| title | TEXT | NO | - |
| slug | TEXT (UNIQUE) | NO | - |
| description | TEXT | NO | '' |
| category | TEXT | NO | 'General' |
| difficulty | course_difficulty | NO | 'beginner' |
| is_free | BOOLEAN | NO | true |
| price_cents | INTEGER | NO | 0 |
| currency | TEXT | YES | 'usd' |
| status | course_status | NO | 'draft' |
| published_at | TIMESTAMPTZ | YES | NULL |
| tags | TEXT[] | YES | '{}' |
| learning_objectives | TEXT[] | YES | '{}' |
| card_color | TEXT | YES | '#3b82f6' |
| estimated_duration_minutes | INTEGER | YES | NULL |
| last_wizard_step | INTEGER | YES | 1 |
| created_at | TIMESTAMPTZ | NO | now() |
| updated_at | TIMESTAMPTZ | NO | now() |

**Triggers:** `courses_updated_at`
**RLS:** Public read published courses. Creators manage own courses.

---

### 4. modules

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | UUID (PK) | NO | gen_random_uuid() |
| course_id | UUID (FK -> courses) | NO | - |
| title | TEXT | NO | - |
| description | TEXT | YES | NULL |
| display_order | INTEGER | NO | 0 |
| created_at | TIMESTAMPTZ | NO | now() |

**RLS:** Public read modules of published courses. Creators manage own modules.

---

### 5. lessons

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | UUID (PK) | NO | gen_random_uuid() |
| module_id | UUID (FK -> modules) | NO | - |
| course_id | UUID (FK -> courses) | NO | - |
| title | TEXT | NO | - |
| display_order | INTEGER | NO | 0 |
| created_at | TIMESTAMPTZ | YES | now() |
| updated_at | TIMESTAMPTZ | YES | now() |

**Triggers:** `lessons_updated_at`
**RLS:** Creators manage own lessons. Enrolled learners read lessons.

---

### 6. lesson_steps

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | UUID (PK) | NO | gen_random_uuid() |
| lesson_id | UUID (FK -> lessons) | NO | - |
| sort_order | INTEGER | NO | 0 |
| step_type | step_type | NO | - |
| title | TEXT | YES | NULL |
| content | JSONB | NO | '{}' |
| created_at | TIMESTAMPTZ | YES | now() |
| updated_at | TIMESTAMPTZ | YES | now() |

**Constraints:** UNIQUE(lesson_id, sort_order) DEFERRABLE INITIALLY DEFERRED
**Triggers:** `update_lesson_steps_updated_at`
**RLS:** Creators manage own lesson steps. Enrolled learners read lesson steps.

---

### 7. tests

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | UUID (PK) | NO | gen_random_uuid() |
| course_id | UUID (FK -> courses) | NO | - |
| title | TEXT | NO | - |
| passing_score | INTEGER | YES | NULL |
| time_limit_minutes | INTEGER | YES | NULL |
| created_at | TIMESTAMPTZ | NO | now() |
| updated_at | TIMESTAMPTZ | NO | now() |

**Triggers:** `set_tests_updated_at`
**RLS:** Creators manage own tests. Enrolled learners read published tests.

---

### 8. test_questions

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | UUID (PK) | NO | gen_random_uuid() |
| test_id | UUID (FK -> tests) | NO | - |
| sort_order | INTEGER | NO | 0 |
| question_text | TEXT | NO | - |
| question_type | question_type | NO | 'multiple_choice' |
| options | JSONB | NO | '[]' |
| correct_option_ids | TEXT[] | NO | '{}' |
| explanation | TEXT | NO | '' |
| option_explanations | JSONB | YES | NULL |
| acceptable_answers | TEXT[] | YES | NULL |
| correct_order | TEXT[] | YES | NULL |
| matching_pairs | JSONB | YES | NULL |
| created_at | TIMESTAMPTZ | NO | now() |
| updated_at | TIMESTAMPTZ | NO | now() |

**Triggers:** `set_test_questions_updated_at`
**RLS:** Creators manage own test questions. Enrolled learners read test questions.

---

### 9. test_attempts

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | UUID (PK) | NO | gen_random_uuid() |
| test_id | UUID (FK -> tests) | NO | - |
| user_id | UUID (FK -> auth.users) | NO | - |
| started_at | TIMESTAMPTZ | NO | now() |
| completed_at | TIMESTAMPTZ | YES | NULL |
| time_spent_seconds | INTEGER | YES | NULL |
| questions | JSONB | NO | '[]' |
| score | INTEGER | YES | NULL |
| score_percent | INTEGER | YES | NULL |
| passed | BOOLEAN | YES | NULL |
| status | test_attempt_status | NO | 'in_progress' |
| created_at | TIMESTAMPTZ | NO | now() |

**RLS:** Users manage own test attempts. Creators read attempts on own tests.

---

### 10. user_courses

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | UUID (PK) | NO | gen_random_uuid() |
| user_id | UUID (FK -> profiles) | NO | - |
| course_id | UUID (FK -> courses) | NO | - |
| status | enrollment_status | NO | 'active' |
| current_lesson_id | UUID (FK -> lessons) | YES | NULL |
| questions_seen | INTEGER | NO | 0 |
| questions_correct | INTEGER | NO | 0 |
| sessions_completed | INTEGER | NO | 0 |
| last_session_at | TIMESTAMPTZ | YES | NULL |
| enrolled_at | TIMESTAMPTZ | NO | now() |
| completed_at | TIMESTAMPTZ | YES | NULL |

**Constraints:** UNIQUE(user_id, course_id)
**RLS:** Users manage own enrollments.

---

### 11. user_lesson_progress

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | UUID (PK) | NO | gen_random_uuid() |
| user_id | UUID (FK -> auth.users) | NO | - |
| lesson_id | UUID (FK -> lessons) | NO | - |
| course_id | UUID (FK -> courses) | NO | - |
| module_id | UUID (FK -> modules) | NO | - |
| status | TEXT (CHECK) | NO | 'available' |
| session_items_completed | INTEGER | YES | 0 |
| session_items_total | INTEGER | YES | 0 |
| current_step_index | INTEGER | YES | 0 |
| step_completions | JSONB | YES | '[]' |
| started_at | TIMESTAMPTZ | YES | NULL |
| completed_at | TIMESTAMPTZ | YES | NULL |

**Constraints:** UNIQUE(user_id, lesson_id), CHECK status IN ('available', 'in_progress', 'completed')
**RLS:** Users manage own lesson progress.

---

### 12. transactions

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | UUID (PK) | NO | gen_random_uuid() |
| user_id | UUID (FK -> auth.users) | NO | - |
| course_id | UUID (FK -> courses) | NO | - |
| creator_id | UUID (FK -> creators) | NO | - |
| stripe_checkout_session_id | TEXT (UNIQUE) | NO | - |
| stripe_payment_intent_id | TEXT | YES | NULL |
| amount_cents | INTEGER | NO | - |
| currency | TEXT | NO | 'usd' |
| platform_fee_cents | INTEGER | NO | - |
| creator_earnings_cents | INTEGER | NO | - |
| status | TEXT (CHECK) | NO | 'completed' |
| created_at | TIMESTAMPTZ | YES | now() |

**Constraints:** CHECK status IN ('completed', 'refunded', 'disputed')
**RLS:** Users read own transactions. Creators read own earnings.

---

## Indexes

| Index | Table | Column(s) |
|-------|-------|-----------|
| idx_courses_creator | courses | creator_id |
| idx_courses_status | courses | status |
| idx_courses_category | courses | category |
| idx_modules_course | modules | course_id |
| idx_modules_order | modules | course_id, display_order |
| idx_lessons_module | lessons | module_id |
| idx_lessons_course | lessons | course_id |
| idx_lessons_order | lessons | module_id, display_order |
| idx_lesson_steps_lesson | lesson_steps | lesson_id |
| idx_lesson_steps_order | lesson_steps | lesson_id, sort_order |
| idx_tests_course | tests | course_id |
| idx_test_questions_test | test_questions | test_id |
| idx_test_questions_order | test_questions | test_id, sort_order |
| idx_test_attempts_test | test_attempts | test_id |
| idx_test_attempts_user | test_attempts | user_id |
| idx_user_courses_user | user_courses | user_id |
| idx_user_courses_course | user_courses | course_id |
| idx_user_lesson_progress_user | user_lesson_progress | user_id |
| idx_user_lesson_progress_lesson | user_lesson_progress | lesson_id |
| idx_user_lesson_progress_course | user_lesson_progress | course_id |
| idx_transactions_user | transactions | user_id |
| idx_transactions_course | transactions | course_id |
| idx_transactions_creator | transactions | creator_id |
