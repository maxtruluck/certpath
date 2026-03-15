-- XP System, Streaks, Achievements & Processing Tables
-- Migration 005

-- ============================================================
-- ALTER: Add total_xp to profiles
-- ============================================================
ALTER TABLE profiles ADD COLUMN total_xp INTEGER NOT NULL DEFAULT 0;

-- ============================================================
-- TABLE: xp_events
-- ============================================================
CREATE TABLE xp_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  session_id UUID,
  event_type TEXT NOT NULL, -- 'correct_answer', 'incorrect_answer', 'session_complete', 'perfect_session', 'streak_bonus', 'achievement'
  xp_amount INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: user_streaks
-- ============================================================
CREATE TABLE user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: achievements
-- ============================================================
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT DEFAULT '🏆',
  category TEXT NOT NULL, -- 'session', 'streak', 'mastery', 'milestone'
  criteria JSONB NOT NULL, -- e.g. {"type": "perfect_session", "count": 1}
  xp_reward INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: user_achievements
-- ============================================================
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- ============================================================
-- TABLE: processing_jobs
-- ============================================================
CREATE TABLE processing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'complete', 'failed'
  progress INTEGER NOT NULL DEFAULT 0, -- 0-100
  current_step TEXT,
  steps JSONB DEFAULT '[]',
  result JSONB,
  error TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: course_files
-- ============================================================
CREATE TABLE course_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'uploaded', -- 'uploaded', 'processing', 'processed', 'error'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TRIGGERS (updated_at)
-- ============================================================
CREATE TRIGGER user_streaks_updated_at BEFORE UPDATE ON user_streaks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER processing_jobs_updated_at BEFORE UPDATE ON processing_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_xp_events_user_id ON xp_events(user_id);
CREATE INDEX idx_xp_events_course_id ON xp_events(course_id);
CREATE INDEX idx_xp_events_created_at ON xp_events(created_at);
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_processing_jobs_course_id ON processing_jobs(course_id);
CREATE INDEX idx_processing_jobs_creator_id ON processing_jobs(creator_id);
CREATE INDEX idx_processing_jobs_status ON processing_jobs(status);
CREATE INDEX idx_course_files_course_id ON course_files(course_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE xp_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_files ENABLE ROW LEVEL SECURITY;

-- xp_events: users can view/insert own
CREATE POLICY "Users can view own xp events" ON xp_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own xp events" ON xp_events FOR INSERT WITH CHECK (auth.uid() = user_id);

-- user_streaks: users can view/insert/update own
CREATE POLICY "Users can view own streak" ON user_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own streak" ON user_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own streak" ON user_streaks FOR UPDATE USING (auth.uid() = user_id);

-- achievements: public read (definitions are global)
CREATE POLICY "Anyone can view achievements" ON achievements FOR SELECT USING (true);

-- user_achievements: users can view/insert own
CREATE POLICY "Users can view own achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own achievements" ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- processing_jobs: creators can view/manage own
CREATE POLICY "Creators can view own processing jobs" ON processing_jobs FOR SELECT USING (
  creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
);
CREATE POLICY "Creators can insert own processing jobs" ON processing_jobs FOR INSERT WITH CHECK (
  creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
);
CREATE POLICY "Creators can update own processing jobs" ON processing_jobs FOR UPDATE USING (
  creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
);

-- course_files: creators can view/manage own
CREATE POLICY "Creators can view own course files" ON course_files FOR SELECT USING (
  creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
);
CREATE POLICY "Creators can insert own course files" ON course_files FOR INSERT WITH CHECK (
  creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
);
CREATE POLICY "Creators can delete own course files" ON course_files FOR DELETE USING (
  creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
);

-- ============================================================
-- SEED: Achievement Definitions
-- ============================================================
INSERT INTO achievements (slug, title, description, icon, category, criteria, xp_reward) VALUES
  ('first_session',    'First Steps',         'Complete your first practice session',                    '🎯', 'session',   '{"type": "sessions_completed", "count": 1}',                    50),
  ('perfect_session',  'Flawless',            'Get every question right in a session',                   '💎', 'session',   '{"type": "perfect_session", "count": 1}',                        100),
  ('ten_sessions',     'Getting Serious',     'Complete 10 practice sessions',                           '📚', 'session',   '{"type": "sessions_completed", "count": 10}',                    150),
  ('fifty_sessions',   'Dedicated Learner',   'Complete 50 practice sessions',                           '🎓', 'session',   '{"type": "sessions_completed", "count": 50}',                    500),
  ('streak_3',         'Hat Trick',           'Maintain a 3-day practice streak',                        '🔥', 'streak',    '{"type": "streak_days", "count": 3}',                            75),
  ('streak_7',         'Week Warrior',        'Maintain a 7-day practice streak',                        '⚡', 'streak',    '{"type": "streak_days", "count": 7}',                            200),
  ('streak_30',        'Monthly Master',      'Maintain a 30-day practice streak',                       '👑', 'streak',    '{"type": "streak_days", "count": 30}',                           1000),
  ('questions_100',    'Century Club',        'Answer 100 questions',                                    '💯', 'milestone', '{"type": "questions_answered", "count": 100}',                    100),
  ('questions_500',    'Knowledge Seeker',    'Answer 500 questions',                                    '🧠', 'milestone', '{"type": "questions_answered", "count": 500}',                    300),
  ('questions_1000',   'Quiz Master',         'Answer 1,000 questions',                                  '🏅', 'milestone', '{"type": "questions_answered", "count": 1000}',                   750),
  ('course_complete',  'Course Conqueror',    'Complete all topics in a course',                         '🏆', 'mastery',   '{"type": "course_complete", "count": 1}',                        500),
  ('mastery_80',       'Proficient',          'Reach 80% readiness score on any course',                 '📈', 'mastery',   '{"type": "readiness_score", "threshold": 80}',                   250),
  ('mastery_90',       'Expert Level',        'Reach 90% readiness score on any course',                 '🌟', 'mastery',   '{"type": "readiness_score", "threshold": 90}',                   500),
  ('speed_demon',      'Speed Demon',         'Complete a session in under 3 minutes',                   '⏱️', 'session',   '{"type": "session_duration_under", "seconds": 180}',             150),
  ('night_owl',        'Night Owl',           'Complete a session after 10 PM',                          '🦉', 'session',   '{"type": "session_time_after", "hour": 22}',                     75),
  ('early_bird',       'Early Bird',          'Complete a session before 7 AM',                          '🐦', 'session',   '{"type": "session_time_before", "hour": 7}',                     75),
  ('comeback',         'The Comeback',        'Complete a session after a 7+ day break',                 '🔄', 'session',   '{"type": "comeback_after_days", "days": 7}',                     100);
