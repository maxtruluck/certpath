-- Migration 019: Seed lessons under modules (one per topic) and backfill question lesson_ids
-- This bridges the old Module>Topic>Question hierarchy to Module>Lesson>Question

-- Create one lesson per topic, inheriting the topic's content
INSERT INTO lessons (id, topic_id, module_id, course_id, title, body, display_order, is_active)
SELECT
  gen_random_uuid(),
  t.id,
  t.module_id,
  t.course_id,
  t.title,
  COALESCE(t.guidebook_content, ''),
  t.display_order,
  true
FROM topics t
WHERE NOT EXISTS (
  SELECT 1 FROM lessons l WHERE l.topic_id = t.id
)
ON CONFLICT DO NOTHING;

-- Backfill lesson_id on questions: match via topic_id
UPDATE questions q
SET lesson_id = l.id
FROM lessons l
WHERE q.topic_id = l.topic_id
  AND q.lesson_id IS NULL;

-- Backfill module_id on questions where missing
UPDATE questions q
SET module_id = l.module_id
FROM lessons l
WHERE q.lesson_id = l.id
  AND q.module_id IS NULL;
