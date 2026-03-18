-- Migration 018: Flatten hierarchy from Module > Topic > Lesson to Module > Lesson
-- Topics table is preserved (not dropped). No data is deleted.

-- 1. Make topic_id nullable on lessons (lessons already have module_id NOT NULL)
ALTER TABLE lessons ALTER COLUMN topic_id DROP NOT NULL;

-- 2. Make topic_id nullable on questions
ALTER TABLE questions ALTER COLUMN topic_id DROP NOT NULL;

-- 3. Create user_lesson_progress table
CREATE TABLE IF NOT EXISTS user_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'in_progress', 'completed')),
  session_items_completed INTEGER DEFAULT 0,
  session_items_total INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, lesson_id)
);

ALTER TABLE user_lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own lesson progress" ON user_lesson_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own lesson progress" ON user_lesson_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own lesson progress" ON user_lesson_progress FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user_course ON user_lesson_progress(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_module ON lessons(module_id, display_order);

-- 4. Add current_lesson_id to user_courses
ALTER TABLE user_courses ADD COLUMN IF NOT EXISTS current_lesson_id UUID REFERENCES lessons(id);

-- 5. Document the migration
COMMENT ON TABLE user_lesson_progress IS 'Tracks per-lesson linear progress (replaces user_topic_progress for flattened hierarchy)';
