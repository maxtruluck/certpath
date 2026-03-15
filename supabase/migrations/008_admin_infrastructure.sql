-- Admin Infrastructure: audit log, admin seed user, rejected status
-- ============================================================

-- TABLE: admin_audit_log
-- ============================================================
CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,        -- 'creator.approve', 'creator.reject', 'course.approve', etc.
  target_type TEXT NOT NULL,   -- 'creator', 'course'
  target_id UUID NOT NULL,
  metadata JSONB DEFAULT '{}', -- { reason, previous_status, new_status }
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_audit_admin_user ON admin_audit_log(admin_user_id);
CREATE INDEX idx_audit_target ON admin_audit_log(target_type, target_id);
CREATE INDEX idx_audit_created_at ON admin_audit_log(created_at DESC);

-- RLS: admin-only SELECT, service client handles inserts
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view audit log" ON admin_audit_log FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Add 'rejected' to creator_status enum
ALTER TYPE creator_status ADD VALUE IF NOT EXISTS 'rejected';

-- Seed admin user (UUID: a2222222-2222-2222-2222-222222222222)
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token)
VALUES ('a2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@opened.app', '$2a$10$admin', now(), now(), now(), '', '')
ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, display_name, role, onboarding_complete)
VALUES ('a2222222-2222-2222-2222-222222222222', 'Platform Admin', 'admin', true)
ON CONFLICT (id) DO NOTHING;
