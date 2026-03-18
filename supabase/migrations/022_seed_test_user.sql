-- Test user: empty learner (no enrollments, no progress)

-- Auth user
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token)
VALUES ('a3333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'jane@opened.app', '$2a$10$PwLh7GQ5E.Jl0fVqFJK4fuVvG8GnMdWYaJsNqRbBfSBmH/0A1ZdOy', now(), now(), now(), '', '')
ON CONFLICT (id) DO NOTHING;

-- Profile
INSERT INTO profiles (id, display_name, role, onboarding_complete)
VALUES ('a3333333-3333-3333-3333-333333333333', 'Jane Smith', 'learner', true)
ON CONFLICT (id) DO NOTHING;
