-- Phase 9.5: Computed difficulty via pass rates
-- Adds attempt_count and pass_rate to questions for data-driven difficulty labels.
-- pass_rate is a running average updated on every answer submission.
-- When attempt_count >= 10, pass_rate overrides creator-set difficulty for labels.

ALTER TABLE questions ADD COLUMN IF NOT EXISTS attempt_count INTEGER DEFAULT 0;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS pass_rate FLOAT;

CREATE INDEX IF NOT EXISTS idx_questions_pass_rate
  ON questions(pass_rate) WHERE attempt_count >= 10;
