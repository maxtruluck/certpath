-- Add plot_point question type and correct_point column
ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'plot_point';

ALTER TABLE questions ADD COLUMN IF NOT EXISTS
  correct_point JSONB DEFAULT NULL;
