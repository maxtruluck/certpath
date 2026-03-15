-- Add new question type enum values
ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'fill_blank';
ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'ordering';
