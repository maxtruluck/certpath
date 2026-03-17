-- Simple topic progress tracking (replaces FSRS-computed states for primary flow)
CREATE TABLE IF NOT EXISTS user_topic_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'in_progress', 'completed')),
  session_items_completed INTEGER DEFAULT 0,
  session_items_total INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, topic_id)
);

CREATE INDEX idx_user_topic_progress_user_course ON user_topic_progress(user_id, course_id);

ALTER TABLE user_topic_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own progress" ON user_topic_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON user_topic_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON user_topic_progress FOR UPDATE USING (auth.uid() = user_id);
