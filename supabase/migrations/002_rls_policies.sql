-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_question_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_domain_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_xp_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_path_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_career_paths ENABLE ROW LEVEL SECURITY;

-- Users: own data only
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Certifications: public read
CREATE POLICY "Anyone can view certifications" ON certifications FOR SELECT USING (true);

-- Domains: public read
CREATE POLICY "Anyone can view domains" ON domains FOR SELECT USING (true);

-- Questions: public read (active only)
CREATE POLICY "Anyone can view active questions" ON questions FOR SELECT USING (is_active = true);

-- User Certifications: own data
CREATE POLICY "Users can view own certs" ON user_certifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own certs" ON user_certifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own certs" ON user_certifications FOR UPDATE USING (auth.uid() = user_id);

-- User Question History: own data
CREATE POLICY "Users can view own history" ON user_question_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own history" ON user_question_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Domain Scores: own data
CREATE POLICY "Users can view own scores" ON user_domain_scores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scores" ON user_domain_scores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own scores" ON user_domain_scores FOR UPDATE USING (auth.uid() = user_id);

-- User Streaks: own data
CREATE POLICY "Users can view own streak" ON user_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own streak" ON user_streaks FOR UPDATE USING (auth.uid() = user_id);

-- User XP Log: own data
CREATE POLICY "Users can view own xp" ON user_xp_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own xp" ON user_xp_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Achievements: public read
CREATE POLICY "Anyone can view achievements" ON achievements FOR SELECT USING (true);

-- User Achievements: own data
CREATE POLICY "Users can view own achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own achievements" ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Career Paths: public read
CREATE POLICY "Anyone can view career paths" ON career_paths FOR SELECT USING (true);

-- Career Path Milestones: public read
CREATE POLICY "Anyone can view milestones" ON career_path_milestones FOR SELECT USING (true);

-- User Career Paths: own data
CREATE POLICY "Users can view own career paths" ON user_career_paths FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own career paths" ON user_career_paths FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own career paths" ON user_career_paths FOR UPDATE USING (auth.uid() = user_id);
