-- Topic Content Blocks: structured educational content for topics
-- Replaces single guidebook_content TEXT blob with typed, orderable blocks

-- ============================================================
-- ENUM TYPE
-- ============================================================
CREATE TYPE content_block_type AS ENUM (
  'concept',
  'definition',
  'example',
  'exam_tip',
  'key_takeaway',
  'code_block',
  'summary',
  'note'
);

-- ============================================================
-- TABLE: topic_content_blocks
-- ============================================================
CREATE TABLE topic_content_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  block_type content_block_type NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TRIGGER: auto-update updated_at
-- ============================================================
CREATE TRIGGER topic_content_blocks_updated_at
  BEFORE UPDATE ON topic_content_blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE topic_content_blocks ENABLE ROW LEVEL SECURITY;

-- Creators can manage their own content blocks
CREATE POLICY "Creators can manage own content blocks" ON topic_content_blocks
  FOR ALL USING (
    creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
  );

-- Anyone can view content blocks of published courses
CREATE POLICY "Anyone can view content blocks of published courses" ON topic_content_blocks
  FOR SELECT USING (
    course_id IN (SELECT id FROM courses WHERE status = 'published')
  );

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_topic_content_blocks_topic_id ON topic_content_blocks(topic_id);
CREATE INDEX idx_topic_content_blocks_course_id ON topic_content_blocks(course_id);
CREATE INDEX idx_topic_content_blocks_topic_order ON topic_content_blocks(topic_id, display_order);
