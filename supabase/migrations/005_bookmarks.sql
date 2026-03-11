-- Question bookmarks
CREATE TABLE IF NOT EXISTS user_question_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_id)
);

ALTER TABLE user_question_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own bookmarks" ON user_question_bookmarks
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_bookmarks_user ON user_question_bookmarks(user_id);
