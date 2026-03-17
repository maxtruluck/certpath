-- Phase 10: User Topic Reads — tracks which topics a learner has read the guidebook for.
-- Used by the "read first" flow: new topics direct to guidebook before practice.

CREATE TABLE IF NOT EXISTS user_topic_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, topic_id)
);

CREATE INDEX idx_user_topic_reads_user_course ON user_topic_reads(user_id, course_id);

ALTER TABLE user_topic_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reads" ON user_topic_reads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reads" ON user_topic_reads
  FOR INSERT WITH CHECK (auth.uid() = user_id);
