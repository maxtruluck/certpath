-- Phase 7: Lessons & Assessments
-- Adds lesson model (atomic teaching unit within topics) and assessment tables
-- (topic quizzes, module tests, practice exams)

-- ============================================================
-- 7.1 CREATE LESSONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER lessons_updated_at
  BEFORE UPDATE ON lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Creators can manage lessons on their own courses
CREATE POLICY lessons_creator_all ON lessons FOR ALL USING (
  course_id IN (SELECT id FROM courses WHERE creator_id IN (
    SELECT id FROM creators WHERE user_id = auth.uid()
  ))
);

-- Learners can read lessons on courses they're enrolled in
CREATE POLICY lessons_learner_read ON lessons FOR SELECT USING (
  course_id IN (SELECT course_id FROM user_courses WHERE user_id = auth.uid())
);

CREATE INDEX idx_lessons_topic ON lessons (topic_id, display_order);
CREATE INDEX idx_lessons_course ON lessons (course_id);

-- ============================================================
-- 7.2 ADD lesson_id TO QUESTIONS
-- ============================================================
ALTER TABLE questions ADD COLUMN IF NOT EXISTS
  lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL;

CREATE INDEX idx_questions_lesson ON questions (lesson_id);

-- ============================================================
-- 7.3 CREATE ASSESSMENTS TABLE
-- ============================================================
CREATE TYPE assessment_type AS ENUM ('topic_quiz', 'module_test', 'practice_exam');

CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  assessment_type assessment_type NOT NULL,
  description TEXT DEFAULT '',
  question_count INTEGER NOT NULL DEFAULT 10,
  time_limit_minutes INTEGER DEFAULT NULL,
  passing_score_percent INTEGER DEFAULT 70,
  shuffle_questions BOOLEAN DEFAULT true,
  show_explanations BOOLEAN DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER assessments_updated_at
  BEFORE UPDATE ON assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY assessments_creator_all ON assessments FOR ALL USING (
  course_id IN (SELECT id FROM courses WHERE creator_id IN (
    SELECT id FROM creators WHERE user_id = auth.uid()
  ))
);

CREATE POLICY assessments_learner_read ON assessments FOR SELECT USING (
  course_id IN (SELECT course_id FROM user_courses WHERE user_id = auth.uid())
);

CREATE INDEX idx_assessments_course ON assessments (course_id, assessment_type);
CREATE INDEX idx_assessments_module ON assessments (module_id);
CREATE INDEX idx_assessments_topic ON assessments (topic_id);

-- ============================================================
-- 7.4 CREATE ASSESSMENT_QUESTIONS JUNCTION TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS assessment_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE(assessment_id, question_id)
);

ALTER TABLE assessment_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY aq_creator_all ON assessment_questions FOR ALL USING (
  assessment_id IN (SELECT id FROM assessments WHERE course_id IN (
    SELECT id FROM courses WHERE creator_id IN (
      SELECT id FROM creators WHERE user_id = auth.uid()
    )
  ))
);

CREATE INDEX idx_aq_assessment ON assessment_questions (assessment_id, display_order);

-- ============================================================
-- 7.5 CREATE ASSESSMENT_ATTEMPTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS assessment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  score_percent INTEGER,
  correct_count INTEGER DEFAULT 0,
  total_count INTEGER DEFAULT 0,
  passed BOOLEAN,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  time_spent_seconds INTEGER,
  answers JSONB DEFAULT '[]'
);

ALTER TABLE assessment_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY attempts_own ON assessment_attempts FOR ALL USING (
  auth.uid() = user_id
);

CREATE INDEX idx_attempts_user ON assessment_attempts (user_id, assessment_id, completed_at DESC);
