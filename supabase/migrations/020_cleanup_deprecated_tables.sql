-- Migration 020: Drop deprecated/orphaned tables
-- These features were stripped from the application but tables remained in schema

-- Drop assessment tables (assessments feature removed)
DROP TABLE IF EXISTS assessment_questions CASCADE;
DROP TABLE IF EXISTS assessment_attempts CASCADE;
DROP TABLE IF EXISTS assessments CASCADE;

-- Drop deprecated content blocks table (content now in lessons.body)
DROP TABLE IF EXISTS topic_content_blocks CASCADE;

-- Drop unused progress tables (replaced by user_lesson_progress)
DROP TABLE IF EXISTS user_topic_progress CASCADE;
DROP TABLE IF EXISTS user_topic_intros CASCADE;

-- Drop FSRS spaced repetition table (removed from primary path)
DROP TABLE IF EXISTS user_card_states CASCADE;
