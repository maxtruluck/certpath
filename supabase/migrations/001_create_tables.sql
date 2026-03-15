-- OpenED MVP Database Schema (v4 spec)
-- 9 MVP tables + triggers + auto-create profile

-- ============================================================
-- ENUM TYPES
-- ============================================================
CREATE TYPE user_role AS ENUM ('learner', 'creator', 'admin');
CREATE TYPE creator_status AS ENUM ('pending', 'approved', 'suspended');
CREATE TYPE course_category AS ENUM ('certification', 'academic', 'professional', 'general_knowledge', 'institutional');
CREATE TYPE course_difficulty AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE course_status AS ENUM ('draft', 'in_review', 'published', 'archived');
CREATE TYPE question_type AS ENUM ('multiple_choice', 'multiple_select', 'true_false');
CREATE TYPE question_source AS ENUM ('creator_original', 'ai_generated', 'ai_enhanced');
CREATE TYPE enrollment_status AS ENUM ('active', 'paused', 'completed');
CREATE TYPE card_state AS ENUM ('new', 'learning', 'review', 'relearning');

-- ============================================================
-- TABLE 1: profiles (extends auth.users)
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'learner',
  timezone TEXT NOT NULL DEFAULT 'America/Los_Angeles',
  onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE 2: creators
-- ============================================================
CREATE TABLE creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  creator_name TEXT NOT NULL,
  bio TEXT,
  expertise_areas TEXT[] NOT NULL DEFAULT '{}',
  credentials TEXT,
  status creator_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE 3: courses
-- ============================================================
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  guidebook_content TEXT,
  category course_category NOT NULL DEFAULT 'general_knowledge',
  difficulty course_difficulty NOT NULL DEFAULT 'beginner',
  thumbnail_url TEXT,
  is_free BOOLEAN NOT NULL DEFAULT true,
  price_cents INTEGER NOT NULL DEFAULT 0,
  exam_fee_cents INTEGER,
  passing_score INTEGER,
  max_score INTEGER,
  exam_duration_minutes INTEGER,
  total_questions_on_exam INTEGER,
  provider_name TEXT,
  provider_url TEXT,
  status course_status NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE 4: modules
-- ============================================================
CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  guidebook_content TEXT,
  weight_percent INTEGER,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE 5: topics
-- ============================================================
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  guidebook_content TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE 6: questions
-- ============================================================
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type question_type NOT NULL DEFAULT 'multiple_choice',
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_option_ids TEXT[] NOT NULL DEFAULT '{}',
  explanation TEXT NOT NULL DEFAULT '',
  difficulty INTEGER NOT NULL DEFAULT 3 CHECK (difficulty >= 1 AND difficulty <= 5),
  tags TEXT[] NOT NULL DEFAULT '{}',
  source question_source NOT NULL DEFAULT 'creator_original',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE 7: user_courses (enrollment)
-- ============================================================
CREATE TABLE user_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  status enrollment_status NOT NULL DEFAULT 'active',
  readiness_score FLOAT NOT NULL DEFAULT 0.0,
  current_topic_id UUID REFERENCES topics(id),
  questions_seen INTEGER NOT NULL DEFAULT 0,
  questions_correct INTEGER NOT NULL DEFAULT 0,
  sessions_completed INTEGER NOT NULL DEFAULT 0,
  last_session_at TIMESTAMPTZ,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, course_id)
);

-- ============================================================
-- TABLE 8: user_card_states (FSRS engine)
-- ============================================================
CREATE TABLE user_card_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  state card_state NOT NULL DEFAULT 'new',
  difficulty FLOAT NOT NULL DEFAULT 5.0 CHECK (difficulty >= 1.0 AND difficulty <= 10.0),
  stability FLOAT NOT NULL DEFAULT 0.0,
  due_date DATE NOT NULL DEFAULT CURRENT_DATE,
  last_review_date TIMESTAMPTZ,
  reps INTEGER NOT NULL DEFAULT 0,
  lapses INTEGER NOT NULL DEFAULT 0,
  last_rating INTEGER CHECK (last_rating IN (1, 3, 4)),
  elapsed_days INTEGER NOT NULL DEFAULT 0,
  scheduled_days INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_id)
);

-- ============================================================
-- TABLE 9: review_log (append-only)
-- ============================================================
CREATE TABLE review_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating IN (1, 3, 4)),
  is_correct BOOLEAN NOT NULL,
  selected_option_ids TEXT[] NOT NULL DEFAULT '{}',
  time_spent_ms INTEGER NOT NULL DEFAULT 0,
  state_before card_state NOT NULL,
  state_after card_state NOT NULL,
  difficulty_before FLOAT NOT NULL,
  difficulty_after FLOAT NOT NULL,
  stability_before FLOAT NOT NULL,
  stability_after FLOAT NOT NULL,
  due_date_before DATE NOT NULL,
  due_date_after DATE NOT NULL,
  elapsed_days INTEGER NOT NULL DEFAULT 0,
  scheduled_days INTEGER NOT NULL DEFAULT 0,
  session_id UUID NOT NULL,
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER questions_updated_at BEFORE UPDATE ON questions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER user_card_states_updated_at BEFORE UPDATE ON user_card_states FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
