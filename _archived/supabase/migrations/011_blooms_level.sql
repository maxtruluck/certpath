-- Add Bloom's taxonomy level to questions
ALTER TABLE questions ADD COLUMN IF NOT EXISTS blooms_level TEXT DEFAULT 'remember';
