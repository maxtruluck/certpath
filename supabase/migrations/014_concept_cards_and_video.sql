-- Phase 9: Concept Cards, Video Support & Assessment Enhancements
-- Adds concept_cards JSONB and video fields to lessons.
-- Adds course_id to assessment_attempts for efficient querying.
-- Adds missing RLS policies and indexes per learner experience spec.

-- ============================================================
-- 9.1 ADD CONCEPT CARDS TO LESSONS
-- ============================================================
-- concept_cards: AI-extracted teaching moments from lesson body,
-- interleaved into learn sessions as card_type: "concept".
-- Format: [{ "title": "...", "content": "..." }, ...]
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS
  concept_cards JSONB DEFAULT '[]';

-- ============================================================
-- 9.2 ADD VIDEO FIELDS TO LESSONS
-- ============================================================
-- For video-first courses: stores a reference to the relevant
-- video segment. Rendered as an embed in the guidebook, NOT
-- played during practice sessions.
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS
  video_url TEXT;

ALTER TABLE lessons ADD COLUMN IF NOT EXISTS
  video_start_seconds INTEGER;

ALTER TABLE lessons ADD COLUMN IF NOT EXISTS
  video_end_seconds INTEGER;

-- ============================================================
-- 9.3 ADD COURSE_ID TO ASSESSMENT_ATTEMPTS
-- ============================================================
-- Enables efficient per-course queries without joining through assessments.
ALTER TABLE assessment_attempts ADD COLUMN IF NOT EXISTS
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE;

-- ============================================================
-- 9.4 MISSING INDEXES
-- ============================================================
-- Partial indexes on assessments for module-level and topic-level lookups
CREATE INDEX IF NOT EXISTS idx_assessments_module_partial
  ON assessments(module_id) WHERE module_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_assessments_topic_partial
  ON assessments(topic_id) WHERE topic_id IS NOT NULL;

-- Assessment attempts by user+course for dashboard queries
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_course
  ON assessment_attempts(user_id, course_id);

-- ============================================================
-- 9.5 MISSING RLS POLICIES
-- ============================================================
-- assessments: public read for active assessments (learners don't
-- need enrollment check just to see assessment metadata)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'assessments_public_read'
  ) THEN
    CREATE POLICY assessments_public_read ON assessments
      FOR SELECT USING (is_active = true);
  END IF;
END $$;

-- assessment_questions: read access for anyone (questions are
-- fetched when starting an assessment attempt)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'aq_read_all'
  ) THEN
    CREATE POLICY aq_read_all ON assessment_questions
      FOR SELECT USING (true);
  END IF;
END $$;
