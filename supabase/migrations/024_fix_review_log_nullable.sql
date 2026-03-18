-- Make legacy columns nullable in review_log
-- topic_id is no longer used (lessons replaced topics)
-- due_date fields were from FSRS which has been removed
ALTER TABLE review_log ALTER COLUMN topic_id DROP NOT NULL;
ALTER TABLE review_log ALTER COLUMN due_date_before DROP NOT NULL;
ALTER TABLE review_log ALTER COLUMN due_date_after DROP NOT NULL;
