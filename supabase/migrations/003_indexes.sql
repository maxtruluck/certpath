-- OpenED Performance Indexes

-- Critical: FSRS session generation query
CREATE INDEX idx_card_states_user_course_due ON user_card_states (user_id, course_id, due_date, state);
CREATE INDEX idx_card_states_user_question ON user_card_states (user_id, question_id);

-- Review log queries
CREATE INDEX idx_review_log_user_course ON review_log (user_id, course_id, reviewed_at DESC);
CREATE INDEX idx_review_log_session ON review_log (session_id);

-- Course browsing
CREATE INDEX idx_courses_status_category ON courses (status, category);
CREATE INDEX idx_courses_slug ON courses (slug);
CREATE INDEX idx_courses_creator ON courses (creator_id);

-- Content hierarchy
CREATE INDEX idx_modules_course ON modules (course_id, display_order);
CREATE INDEX idx_topics_module ON topics (module_id, display_order);
CREATE INDEX idx_topics_course ON topics (course_id);
CREATE INDEX idx_questions_topic ON questions (topic_id, is_active);
CREATE INDEX idx_questions_course ON questions (course_id, is_active);

-- User enrollments
CREATE INDEX idx_user_courses_user ON user_courses (user_id, status);
CREATE INDEX idx_user_courses_course ON user_courses (course_id);

-- Creator lookup
CREATE INDEX idx_creators_user ON creators (user_id);
CREATE INDEX idx_creators_status ON creators (status);
