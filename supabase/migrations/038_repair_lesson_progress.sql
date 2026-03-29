-- ==========================================================================
-- ONE-TIME DATA REPAIR: Backfill gapped step_completions
-- ==========================================================================
-- Safe to run on fresh databases (no-ops when no gapped rows exist).
--
-- Problem: Earlier AnswerStep key-prop bug caused remounts that prevented
-- markStepComplete from persisting certain step indices. This left gaps
-- in the step_completions JSONB array, so lessons that were fully played
-- through never reached status = 'completed'.
-- ==========================================================================

-- Backfill rows where user reached the last step but has missing entries
WITH gapped_rows AS (
  SELECT
    id,
    session_items_total,
    step_completions,
    current_step_index
  FROM user_lesson_progress
  WHERE status != 'completed'
    AND session_items_total > 0
    AND current_step_index >= session_items_total - 1
),
backfilled AS (
  SELECT
    gr.id,
    gr.session_items_total,
    (
      SELECT jsonb_agg(entry ORDER BY (entry->>'step_index')::int)
      FROM (
        -- Keep existing entries
        SELECT value AS entry
        FROM jsonb_array_elements(COALESCE(gr.step_completions, '[]'::jsonb))
        UNION ALL
        -- Add missing indices
        SELECT jsonb_build_object(
          'step_index', missing_idx,
          'is_correct', null,
          'completed_at', NOW()::text
        ) AS entry
        FROM generate_series(0, gr.session_items_total - 1) AS missing_idx
        WHERE NOT EXISTS (
          SELECT 1
          FROM jsonb_array_elements(COALESCE(gr.step_completions, '[]'::jsonb)) AS existing
          WHERE (existing.value->>'step_index')::int = missing_idx
        )
      ) AS all_entries
    ) AS new_step_completions
  FROM gapped_rows gr
)
UPDATE user_lesson_progress ulp
SET
  step_completions = b.new_step_completions,
  session_items_completed = b.session_items_total,
  status = 'completed',
  completed_at = NOW()
FROM backfilled b
WHERE ulp.id = b.id;
