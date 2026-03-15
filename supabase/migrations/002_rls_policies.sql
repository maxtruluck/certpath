-- OpenED Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_card_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_log ENABLE ROW LEVEL SECURITY;

-- profiles: users can read/update own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- creators: public read for approved, users manage own
CREATE POLICY "Anyone can view approved creators" ON creators FOR SELECT USING (status = 'approved');
CREATE POLICY "Users can insert own creator application" ON creators FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own creator record" ON creators FOR SELECT USING (auth.uid() = user_id);

-- courses: public read for published, creators manage own
CREATE POLICY "Anyone can view published courses" ON courses FOR SELECT USING (status = 'published');
CREATE POLICY "Creators can manage own courses" ON courses FOR ALL USING (
  creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
);

-- modules: public read for published courses
CREATE POLICY "Anyone can view modules of published courses" ON modules FOR SELECT USING (
  course_id IN (SELECT id FROM courses WHERE status = 'published')
);
CREATE POLICY "Creators can manage own modules" ON modules FOR ALL USING (
  course_id IN (SELECT id FROM courses WHERE creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid()))
);

-- topics: public read for published courses
CREATE POLICY "Anyone can view topics of published courses" ON topics FOR SELECT USING (
  course_id IN (SELECT id FROM courses WHERE status = 'published')
);
CREATE POLICY "Creators can manage own topics" ON topics FOR ALL USING (
  course_id IN (SELECT id FROM courses WHERE creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid()))
);

-- questions: public read active questions of published courses
CREATE POLICY "Anyone can view active questions of published courses" ON questions FOR SELECT USING (
  is_active = true AND course_id IN (SELECT id FROM courses WHERE status = 'published')
);
CREATE POLICY "Creators can manage own questions" ON questions FOR ALL USING (
  creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
);

-- user_courses: users manage own enrollments
CREATE POLICY "Users can view own enrollments" ON user_courses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own enrollments" ON user_courses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own enrollments" ON user_courses FOR UPDATE USING (auth.uid() = user_id);

-- user_card_states: users manage own card states
CREATE POLICY "Users can view own card states" ON user_card_states FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own card states" ON user_card_states FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own card states" ON user_card_states FOR UPDATE USING (auth.uid() = user_id);

-- review_log: users can view/insert own reviews
CREATE POLICY "Users can view own reviews" ON review_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reviews" ON review_log FOR INSERT WITH CHECK (auth.uid() = user_id);
