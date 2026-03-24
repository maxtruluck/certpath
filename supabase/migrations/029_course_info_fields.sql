-- Add new course info fields for the redesigned Step 1 form
ALTER TABLE courses ADD COLUMN IF NOT EXISTS estimated_duration TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS prerequisites TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS learning_objectives TEXT[] DEFAULT '{}';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS card_color TEXT DEFAULT '#3b82f6';
