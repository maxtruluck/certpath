-- Performance indexes
CREATE INDEX idx_uqh_user_cert_review ON user_question_history (user_id, certification_id, next_review_date);
CREATE INDEX idx_uqh_user_question ON user_question_history (user_id, question_id);
CREATE INDEX idx_questions_cert_domain ON questions (certification_id, domain_id, is_active);
CREATE INDEX idx_user_certs_user ON user_certifications (user_id, status);
CREATE INDEX idx_user_domain_scores ON user_domain_scores (user_id, certification_id);
CREATE INDEX idx_user_xp_log_user ON user_xp_log (user_id, earned_at DESC);
CREATE INDEX idx_user_achievements_user ON user_achievements (user_id);
