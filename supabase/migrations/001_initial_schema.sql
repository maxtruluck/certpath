-- ============================================================================
-- CertPath: Complete Database Schema
-- Single migration — run on an empty Supabase project to bootstrap everything.
-- ============================================================================

-- --------------------------------------------------------------------------
-- ENUMS
-- --------------------------------------------------------------------------

CREATE TYPE user_role AS ENUM ('learner', 'creator', 'admin');
CREATE TYPE creator_status AS ENUM ('pending', 'approved', 'suspended', 'rejected');
CREATE TYPE course_difficulty AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE course_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE question_type AS ENUM ('multiple_choice', 'multiple_select', 'true_false', 'fill_blank', 'ordering', 'matching');
CREATE TYPE step_type AS ENUM ('read', 'watch', 'answer', 'embed', 'callout');
CREATE TYPE enrollment_status AS ENUM ('active', 'paused', 'completed');
CREATE TYPE test_attempt_status AS ENUM ('in_progress', 'completed', 'abandoned');

-- --------------------------------------------------------------------------
-- FUNCTIONS
-- --------------------------------------------------------------------------

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data ->> 'display_name',
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'name',
      split_part(NEW.email, '@', 1)
    )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --------------------------------------------------------------------------
-- TABLE 1: profiles
-- --------------------------------------------------------------------------

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT NULL,
  role user_role NOT NULL DEFAULT 'learner',
  timezone TEXT NOT NULL DEFAULT 'America/Los_Angeles',
  onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- --------------------------------------------------------------------------
-- TABLE 2: creators
-- --------------------------------------------------------------------------

CREATE TABLE creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  creator_name TEXT NOT NULL,
  bio TEXT NULL,
  expertise_areas TEXT[] NOT NULL DEFAULT '{}',
  credentials TEXT NULL,
  website_url TEXT NULL,
  status creator_status NOT NULL DEFAULT 'approved',
  revenue_share_percent INTEGER NULL DEFAULT 80,
  stripe_account_id TEXT NULL,
  avatar_url TEXT NULL,
  onboarding_checklist_dismissed BOOLEAN NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE creators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read approved creators" ON creators
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Users insert own creator" ON creators
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own creator" ON creators
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users update own creator" ON creators
  FOR UPDATE USING (auth.uid() = user_id);

-- --------------------------------------------------------------------------
-- TABLE 3: courses
-- --------------------------------------------------------------------------

CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'General',
  difficulty course_difficulty NOT NULL DEFAULT 'beginner',
  is_free BOOLEAN NOT NULL DEFAULT true,
  price_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NULL DEFAULT 'usd',
  status course_status NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ NULL,
  tags TEXT[] NULL DEFAULT '{}',
  learning_objectives TEXT[] NULL DEFAULT '{}',
  card_color TEXT NULL DEFAULT '#3b82f6',
  estimated_duration_minutes INTEGER NULL,
  last_wizard_step INTEGER NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read published courses" ON courses
  FOR SELECT USING (status = 'published');

CREATE POLICY "Creators manage own courses" ON courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM creators
      WHERE creators.id = courses.creator_id
      AND creators.user_id = auth.uid()
    )
  );

-- --------------------------------------------------------------------------
-- TABLE 4: modules
-- --------------------------------------------------------------------------

CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read modules of published courses" ON modules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = modules.course_id
      AND courses.status = 'published'
    )
  );

CREATE POLICY "Creators manage own modules" ON modules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM courses
      JOIN creators ON courses.creator_id = creators.id
      WHERE courses.id = modules.course_id
      AND creators.user_id = auth.uid()
    )
  );

-- --------------------------------------------------------------------------
-- TABLE 5: lessons
-- --------------------------------------------------------------------------

CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NULL DEFAULT now()
);

CREATE TRIGGER lessons_updated_at
  BEFORE UPDATE ON lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators manage own lessons" ON lessons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM courses
      JOIN creators ON courses.creator_id = creators.id
      WHERE courses.id = lessons.course_id
      AND creators.user_id = auth.uid()
    )
  );

CREATE POLICY "Enrolled learners read lessons" ON lessons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_courses
      WHERE user_courses.course_id = lessons.course_id
      AND user_courses.user_id = auth.uid()
    )
  );

-- --------------------------------------------------------------------------
-- TABLE 6: lesson_steps
-- --------------------------------------------------------------------------

CREATE TABLE lesson_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  step_type step_type NOT NULL,
  title TEXT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NULL DEFAULT now(),
  UNIQUE(lesson_id, sort_order) DEFERRABLE INITIALLY DEFERRED
);

CREATE TRIGGER update_lesson_steps_updated_at
  BEFORE UPDATE ON lesson_steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE lesson_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators manage own lesson steps" ON lesson_steps
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN courses ON lessons.course_id = courses.id
      JOIN creators ON courses.creator_id = creators.id
      WHERE lessons.id = lesson_steps.lesson_id
      AND creators.user_id = auth.uid()
    )
  );

CREATE POLICY "Enrolled learners read lesson steps" ON lesson_steps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN user_courses ON user_courses.course_id = lessons.course_id
      WHERE lessons.id = lesson_steps.lesson_id
      AND user_courses.user_id = auth.uid()
    )
  );

-- --------------------------------------------------------------------------
-- TABLE 7: tests
-- --------------------------------------------------------------------------

CREATE TABLE tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  passing_score INTEGER NULL,
  time_limit_minutes INTEGER NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_tests_updated_at
  BEFORE UPDATE ON tests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators manage own tests" ON tests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM courses
      JOIN creators ON courses.creator_id = creators.id
      WHERE courses.id = tests.course_id
      AND creators.user_id = auth.uid()
    )
  );

CREATE POLICY "Enrolled learners read published tests" ON tests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courses
      JOIN user_courses ON user_courses.course_id = courses.id
      WHERE courses.id = tests.course_id
      AND user_courses.user_id = auth.uid()
      AND courses.status = 'published'
    )
  );

-- --------------------------------------------------------------------------
-- TABLE 8: test_questions
-- --------------------------------------------------------------------------

CREATE TABLE test_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  question_text TEXT NOT NULL,
  question_type question_type NOT NULL DEFAULT 'multiple_choice',
  options JSONB NOT NULL DEFAULT '[]',
  correct_option_ids TEXT[] NOT NULL DEFAULT '{}',
  explanation TEXT NOT NULL DEFAULT '',
  option_explanations JSONB NULL,
  acceptable_answers TEXT[] NULL,
  correct_order TEXT[] NULL,
  matching_pairs JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_test_questions_updated_at
  BEFORE UPDATE ON test_questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE test_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators manage own test questions" ON test_questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tests
      JOIN courses ON tests.course_id = courses.id
      JOIN creators ON courses.creator_id = creators.id
      WHERE tests.id = test_questions.test_id
      AND creators.user_id = auth.uid()
    )
  );

CREATE POLICY "Enrolled learners read test questions" ON test_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tests
      JOIN courses ON tests.course_id = courses.id
      JOIN user_courses ON user_courses.course_id = courses.id
      WHERE tests.id = test_questions.test_id
      AND user_courses.user_id = auth.uid()
      AND courses.status = 'published'
    )
  );

-- --------------------------------------------------------------------------
-- TABLE 9: test_attempts
-- --------------------------------------------------------------------------

CREATE TABLE test_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ NULL,
  time_spent_seconds INTEGER NULL,
  questions JSONB NOT NULL DEFAULT '[]',
  score INTEGER NULL,
  score_percent INTEGER NULL,
  passed BOOLEAN NULL,
  status test_attempt_status NOT NULL DEFAULT 'in_progress',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE test_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own test attempts" ON test_attempts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Creators read attempts on own tests" ON test_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tests
      JOIN courses ON tests.course_id = courses.id
      JOIN creators ON courses.creator_id = creators.id
      WHERE tests.id = test_attempts.test_id
      AND creators.user_id = auth.uid()
    )
  );

-- --------------------------------------------------------------------------
-- TABLE 10: user_courses
-- --------------------------------------------------------------------------

CREATE TABLE user_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  status enrollment_status NOT NULL DEFAULT 'active',
  current_lesson_id UUID NULL REFERENCES lessons(id),
  questions_seen INTEGER NOT NULL DEFAULT 0,
  questions_correct INTEGER NOT NULL DEFAULT 0,
  sessions_completed INTEGER NOT NULL DEFAULT 0,
  last_session_at TIMESTAMPTZ NULL,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ NULL,
  UNIQUE(user_id, course_id)
);

ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own enrollments" ON user_courses
  FOR ALL USING (auth.uid() = user_id);

-- --------------------------------------------------------------------------
-- TABLE 11: user_lesson_progress
-- --------------------------------------------------------------------------

CREATE TABLE user_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'in_progress', 'completed')),
  session_items_completed INTEGER NULL DEFAULT 0,
  session_items_total INTEGER NULL DEFAULT 0,
  current_step_index INTEGER NULL DEFAULT 0,
  step_completions JSONB NULL DEFAULT '[]',
  started_at TIMESTAMPTZ NULL,
  completed_at TIMESTAMPTZ NULL,
  UNIQUE(user_id, lesson_id)
);

ALTER TABLE user_lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own lesson progress" ON user_lesson_progress
  FOR ALL USING (auth.uid() = user_id);

-- --------------------------------------------------------------------------
-- TABLE 12: transactions
-- --------------------------------------------------------------------------

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  stripe_checkout_session_id TEXT NOT NULL UNIQUE,
  stripe_payment_intent_id TEXT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  platform_fee_cents INTEGER NOT NULL,
  creator_earnings_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'refunded', 'disputed')),
  created_at TIMESTAMPTZ NULL DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Creators read own earnings" ON transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM creators
      WHERE creators.id = transactions.creator_id
      AND creators.user_id = auth.uid()
    )
  );

-- --------------------------------------------------------------------------
-- INDEXES
-- --------------------------------------------------------------------------

CREATE INDEX idx_courses_creator ON courses(creator_id);
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_courses_category ON courses(category);
CREATE INDEX idx_modules_course ON modules(course_id);
CREATE INDEX idx_modules_order ON modules(course_id, display_order);
CREATE INDEX idx_lessons_module ON lessons(module_id);
CREATE INDEX idx_lessons_course ON lessons(course_id);
CREATE INDEX idx_lessons_order ON lessons(module_id, display_order);
CREATE INDEX idx_lesson_steps_lesson ON lesson_steps(lesson_id);
CREATE INDEX idx_lesson_steps_order ON lesson_steps(lesson_id, sort_order);
CREATE INDEX idx_tests_course ON tests(course_id);
CREATE INDEX idx_test_questions_test ON test_questions(test_id);
CREATE INDEX idx_test_questions_order ON test_questions(test_id, sort_order);
CREATE INDEX idx_test_attempts_test ON test_attempts(test_id);
CREATE INDEX idx_test_attempts_user ON test_attempts(user_id);
CREATE INDEX idx_user_courses_user ON user_courses(user_id);
CREATE INDEX idx_user_courses_course ON user_courses(course_id);
CREATE INDEX idx_user_lesson_progress_user ON user_lesson_progress(user_id);
CREATE INDEX idx_user_lesson_progress_lesson ON user_lesson_progress(lesson_id);
CREATE INDEX idx_user_lesson_progress_course ON user_lesson_progress(course_id);
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_course ON transactions(course_id);
CREATE INDEX idx_transactions_creator ON transactions(creator_id);
