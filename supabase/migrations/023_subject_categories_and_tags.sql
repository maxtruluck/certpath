-- Add tags column
ALTER TABLE courses ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Remove the enum default so we can change the column type
ALTER TABLE courses ALTER COLUMN category DROP DEFAULT;

-- Convert category from enum to TEXT for flexibility
ALTER TABLE courses ALTER COLUMN category TYPE TEXT USING category::TEXT;

-- Set a new TEXT default
ALTER TABLE courses ALTER COLUMN category SET DEFAULT 'General';

-- Drop the old enum type
DROP TYPE IF EXISTS course_category CASCADE;

-- Update existing courses to use new subject-based categories
UPDATE courses SET category = 'Cybersecurity' WHERE LOWER(category) IN ('certification', 'cybersecurity', 'security');
UPDATE courses SET category = 'Cloud Computing' WHERE LOWER(category) IN ('cloud', 'devops', 'infrastructure');
UPDATE courses SET category = 'Networking' WHERE LOWER(category) IN ('networking');
UPDATE courses SET category = 'Computer Science' WHERE LOWER(category) IN ('coding', 'software', 'programming', 'systems');
UPDATE courses SET category = 'General' WHERE LOWER(category) IN ('general', 'general_knowledge', 'skills', 'institutional');
UPDATE courses SET category = 'Science' WHERE LOWER(category) IN ('academic', 'science');
UPDATE courses SET category = 'Mathematics' WHERE LOWER(category) IN ('math', 'mathematics');
UPDATE courses SET category = 'Business' WHERE LOWER(category) IN ('professional');

-- For existing certification-adjacent courses, add the tag
UPDATE courses SET tags = array_append(tags, 'Certification Prep')
WHERE category IN ('Cybersecurity', 'Cloud Computing', 'Networking')
AND NOT ('Certification Prep' = ANY(tags));
