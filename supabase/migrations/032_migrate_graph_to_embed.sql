-- ============================================================
-- Migration 032: Migrate existing graph steps to embed
-- ============================================================

UPDATE lesson_steps
SET step_type = 'embed',
    content = content || '{"sub_type": "math_graph"}'::jsonb
WHERE step_type = 'graph';
