-- ============================================================
-- Migration 031: Add embed and callout step types
-- Cannot use new enum values in same transaction, so we
-- just add them here. Graph->embed migration in 032.
-- ============================================================

ALTER TYPE step_type ADD VALUE IF NOT EXISTS 'embed';
ALTER TYPE step_type ADD VALUE IF NOT EXISTS 'callout';
