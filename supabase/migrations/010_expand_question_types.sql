-- Course Builder Expansion: New question types, per-option explanations,
-- rich content blocks, hybrid learning model

-- ============================================================
-- 1. Expand question_type enum
-- ============================================================
-- Note: fill_blank and ordering were already added in 007_expand_question_types.sql
-- Only matching is new
ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'matching';

-- ============================================================
-- 2. Expand questions table
-- ============================================================

-- Per-option wrong-answer explanations
-- Format: { "a": "Why A is wrong...", "c": "Why C is wrong..." }
ALTER TABLE questions ADD COLUMN IF NOT EXISTS
  option_explanations JSONB DEFAULT NULL;

-- Fill-in-the-blank: acceptable answers (case-insensitive matching)
ALTER TABLE questions ADD COLUMN IF NOT EXISTS
  acceptable_answers TEXT[] DEFAULT NULL;

-- Fill-in-the-blank: match mode ('exact' or 'contains')
ALTER TABLE questions ADD COLUMN IF NOT EXISTS
  match_mode TEXT DEFAULT 'exact';

-- Ordering: correct sequence of option IDs
ALTER TABLE questions ADD COLUMN IF NOT EXISTS
  correct_order TEXT[] DEFAULT NULL;

-- Matching: pairs of left-right items
-- Format: [{"left": "AES", "right": "Symmetric"}, {"left": "RSA", "right": "Asymmetric"}]
ALTER TABLE questions ADD COLUMN IF NOT EXISTS
  matching_pairs JSONB DEFAULT NULL;

-- Link question to a content block (context-on-failure pattern)
ALTER TABLE questions ADD COLUMN IF NOT EXISTS
  content_block_id UUID REFERENCES topic_content_blocks(id) ON DELETE SET NULL;

-- ============================================================
-- 3. Create user_topic_intros table (first-encounter lesson gate)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_topic_intros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, topic_id)
);

ALTER TABLE user_topic_intros ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_topic_intros_own ON user_topic_intros
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 4. Expand content block support (media + new types)
-- ============================================================

-- Add media support to content blocks
ALTER TABLE topic_content_blocks ADD COLUMN IF NOT EXISTS
  media_url TEXT DEFAULT NULL;

ALTER TABLE topic_content_blocks ADD COLUMN IF NOT EXISTS
  media_type TEXT DEFAULT NULL;

-- Add new content block types
ALTER TYPE content_block_type ADD VALUE IF NOT EXISTS 'image';
ALTER TYPE content_block_type ADD VALUE IF NOT EXISTS 'video';
ALTER TYPE content_block_type ADD VALUE IF NOT EXISTS 'code';
