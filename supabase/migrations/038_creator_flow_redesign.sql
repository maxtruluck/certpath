-- Creator Flow Redesign: new columns for courses, creators, and questions
-- Supports 4-step wizard, founding creator program, and section-based question grouping

-- ============================================================
-- COURSES: cover image, progression, auto-calculated duration, wizard state
-- ============================================================
ALTER TABLE courses ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS progression_type TEXT DEFAULT 'linear';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS estimated_duration_minutes INTEGER;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS last_wizard_step INTEGER DEFAULT 1;

-- ============================================================
-- CREATORS: founding creator program, Stripe Connect, onboarding
-- ============================================================
ALTER TABLE creators ADD COLUMN IF NOT EXISTS is_founding_creator BOOLEAN DEFAULT false;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS founding_creator_expires_at TIMESTAMPTZ;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS revenue_share_percent INTEGER DEFAULT 70;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS onboarding_checklist_dismissed BOOLEAN DEFAULT false;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- ============================================================
-- QUESTIONS: section_index maps each question to a ## heading in the lesson markdown
-- ============================================================
ALTER TABLE questions ADD COLUMN IF NOT EXISTS section_index INTEGER DEFAULT 0;
