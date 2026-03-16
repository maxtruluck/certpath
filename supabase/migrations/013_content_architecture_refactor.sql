-- Phase 8: Content Architecture Refactor
-- Removes content_block_id from questions and deprecates topic_content_blocks.
-- Content now lives in lessons.body (markdown).

-- Drop the content_block_id column from questions
ALTER TABLE questions DROP COLUMN IF EXISTS content_block_id;
DROP INDEX IF EXISTS idx_questions_content_block;

-- Mark the old table as deprecated (kept as archived backup)
COMMENT ON TABLE topic_content_blocks IS 'DEPRECATED: Content now lives in lessons.body. Retained as archived backup.';
