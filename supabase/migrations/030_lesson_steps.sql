-- ============================================================
-- Migration 030: Lesson Steps (Step Sequencer)
-- Converts lessons from single-content pages to ordered
-- sequences of typed steps (read, watch, answer, graph).
-- ============================================================

-- 1. Create step_type enum
CREATE TYPE step_type AS ENUM ('read', 'watch', 'answer', 'graph');

-- 2. Create lesson_steps table
CREATE TABLE lesson_steps (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id   UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  step_type   step_type NOT NULL,
  title       TEXT,
  content     JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Ensure unique ordering within a lesson
ALTER TABLE lesson_steps ADD CONSTRAINT uq_lesson_steps_order UNIQUE (lesson_id, sort_order) DEFERRABLE INITIALLY DEFERRED;

-- Index for fast ordered lookups
CREATE INDEX idx_lesson_steps_lesson ON lesson_steps(lesson_id, sort_order);

-- 3. RLS
ALTER TABLE lesson_steps ENABLE ROW LEVEL SECURITY;

-- Creators can manage steps for their own courses
CREATE POLICY "Creators can manage steps" ON lesson_steps
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM lessons l
      JOIN courses c ON c.id = l.course_id
      WHERE l.id = lesson_steps.lesson_id
      AND c.creator_id = (
        SELECT cr.id FROM creators cr WHERE cr.user_id = auth.uid()
      )
    )
  );

-- Enrolled learners can read steps
CREATE POLICY "Enrolled users can read steps" ON lesson_steps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lessons l
      JOIN user_courses uc ON uc.course_id = l.course_id
      WHERE l.id = lesson_steps.lesson_id
      AND uc.user_id = auth.uid()
      AND uc.status = 'active'
    )
  );

-- Auto-update updated_at
CREATE TRIGGER update_lesson_steps_updated_at
  BEFORE UPDATE ON lesson_steps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 4. Add step tracking columns to user_lesson_progress
ALTER TABLE user_lesson_progress
  ADD COLUMN IF NOT EXISTS current_step_index INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS step_completions JSONB DEFAULT '[]';

-- 5. Data migration: convert existing lesson content into steps
DO $$
DECLARE
  les RECORD;
  next_order INTEGER;
  q RECORD;
BEGIN
  FOR les IN
    SELECT id, body, video_url, course_id
    FROM lessons
    WHERE is_active = true
  LOOP
    next_order := 0;

    -- Watch step from video_url
    IF les.video_url IS NOT NULL AND les.video_url != '' THEN
      INSERT INTO lesson_steps (lesson_id, sort_order, step_type, content)
      VALUES (les.id, next_order, 'watch', jsonb_build_object('url', les.video_url));
      next_order := next_order + 1;
    END IF;

    -- Read step from body
    IF les.body IS NOT NULL AND TRIM(les.body) != '' THEN
      INSERT INTO lesson_steps (lesson_id, sort_order, step_type, content)
      VALUES (les.id, next_order, 'read', jsonb_build_object('markdown', les.body));
      next_order := next_order + 1;
    END IF;

    -- Answer steps from questions linked to this lesson
    FOR q IN
      SELECT id, question_text, question_type::text AS question_type,
             options, correct_option_ids, explanation, difficulty, tags,
             option_explanations, acceptable_answers, match_mode,
             correct_order, matching_pairs, diagram_data, correct_point
      FROM questions
      WHERE lesson_id = les.id AND is_active = true
      ORDER BY difficulty ASC, created_at ASC
    LOOP
      INSERT INTO lesson_steps (lesson_id, sort_order, step_type, content)
      VALUES (
        les.id,
        next_order,
        'answer',
        jsonb_build_object(
          'question_id', q.id,
          'question_text', q.question_text,
          'question_type', q.question_type,
          'options', COALESCE(q.options, '[]'::jsonb),
          'correct_ids', COALESCE(to_jsonb(q.correct_option_ids), '[]'::jsonb),
          'explanation', COALESCE(q.explanation, ''),
          'option_explanations', COALESCE(q.option_explanations, '{}'::jsonb),
          'difficulty', COALESCE(q.difficulty, 3),
          'tags', COALESCE(to_jsonb(q.tags), '[]'::jsonb),
          'acceptable_answers', COALESCE(to_jsonb(q.acceptable_answers), 'null'::jsonb),
          'match_mode', q.match_mode,
          'correct_order', COALESCE(to_jsonb(q.correct_order), 'null'::jsonb),
          'matching_pairs', COALESCE(q.matching_pairs, 'null'::jsonb),
          'diagram_data', COALESCE(q.diagram_data, 'null'::jsonb),
          'correct_point', COALESCE(q.correct_point, 'null'::jsonb)
        )
      );
      next_order := next_order + 1;
    END LOOP;

  END LOOP;
END;
$$;
