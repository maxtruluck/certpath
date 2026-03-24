-- ============================================================================
-- 036: Tests & Assessments — question pools, practice exams, graded tests
-- ============================================================================

-- ── Enum types ──────────────────────────────────────────────────────────────

CREATE TYPE test_type AS ENUM ('module_quiz', 'practice_exam', 'final_assessment');
CREATE TYPE test_show_results AS ENUM ('after_submit', 'after_all_attempts', 'never');
CREATE TYPE test_status AS ENUM ('draft', 'published');
CREATE TYPE test_attempt_status AS ENUM ('in_progress', 'completed', 'abandoned');

-- ── tests table ─────────────────────────────────────────────────────────────

CREATE TABLE tests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id     UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  module_id     UUID REFERENCES modules(id) ON DELETE CASCADE,  -- NULL for course-level tests
  title         TEXT NOT NULL,
  test_type     test_type NOT NULL,
  question_count INTEGER NOT NULL DEFAULT 10,
  time_limit_minutes INTEGER,                                   -- NULL = untimed
  passing_score INTEGER NOT NULL DEFAULT 70,                    -- percentage 0-100
  max_attempts  INTEGER,                                        -- NULL = unlimited
  shuffle_questions BOOLEAN NOT NULL DEFAULT true,
  shuffle_options   BOOLEAN NOT NULL DEFAULT true,
  show_results  test_show_results NOT NULL DEFAULT 'after_submit',
  sort_order    INTEGER NOT NULL DEFAULT 0,
  status        test_status NOT NULL DEFAULT 'draft',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── question_pool table ─────────────────────────────────────────────────────
-- Standalone questions not in any lesson, added directly to a module's pool

CREATE TABLE question_pool (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id     UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  course_id     UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  content       JSONB NOT NULL,    -- Same schema as Answer step content
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── test_attempts table ─────────────────────────────────────────────────────

CREATE TABLE test_attempts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id         UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ,
  time_spent_seconds INTEGER,
  questions       JSONB NOT NULL DEFAULT '[]'::jsonb,
  score           INTEGER,                -- number correct
  score_percent   INTEGER,                -- rounded percentage
  passed          BOOLEAN,
  status          test_attempt_status NOT NULL DEFAULT 'in_progress',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX idx_tests_course ON tests (course_id, sort_order);
CREATE INDEX idx_tests_module ON tests (module_id) WHERE module_id IS NOT NULL;
CREATE INDEX idx_question_pool_module ON question_pool (module_id, sort_order);
CREATE INDEX idx_question_pool_course ON question_pool (course_id);
CREATE INDEX idx_test_attempts_test_user ON test_attempts (test_id, user_id, started_at DESC);
CREATE INDEX idx_test_attempts_user ON test_attempts (user_id);

-- ── Updated_at trigger ──────────────────────────────────────────────────────

CREATE TRIGGER set_tests_updated_at
  BEFORE UPDATE ON tests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── RLS Policies ────────────────────────────────────────────────────────────

ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_pool ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_attempts ENABLE ROW LEVEL SECURITY;

-- tests: creators can CRUD their own course tests
CREATE POLICY tests_creator_all ON tests
  FOR ALL USING (
    course_id IN (
      SELECT c.id FROM courses c
      JOIN creators cr ON c.creator_id = cr.id
      WHERE cr.user_id = auth.uid()
    )
  );

-- tests: learners can read published tests for courses they're enrolled in
CREATE POLICY tests_learner_read ON tests
  FOR SELECT USING (
    status = 'published' AND
    course_id IN (SELECT course_id FROM user_courses WHERE user_id = auth.uid())
  );

-- question_pool: creators can CRUD their own pool questions
CREATE POLICY question_pool_creator_all ON question_pool
  FOR ALL USING (
    course_id IN (
      SELECT c.id FROM courses c
      JOIN creators cr ON c.creator_id = cr.id
      WHERE cr.user_id = auth.uid()
    )
  );

-- test_attempts: users can manage their own attempts
CREATE POLICY test_attempts_user_all ON test_attempts
  FOR ALL USING (auth.uid() = user_id);

-- test_attempts: creators can read attempts for their courses (analytics)
CREATE POLICY test_attempts_creator_read ON test_attempts
  FOR SELECT USING (
    test_id IN (
      SELECT t.id FROM tests t
      JOIN courses c ON t.course_id = c.id
      JOIN creators cr ON c.creator_id = cr.id
      WHERE cr.user_id = auth.uid()
    )
  );
