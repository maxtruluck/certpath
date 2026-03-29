-- Drop unused test/quiz infrastructure
-- Tests, test_questions, and test_attempts are not used in MVP.
-- Quiz-like behavior is achieved by creating lessons with all answer steps.

DROP TABLE IF EXISTS test_attempts CASCADE;
DROP TABLE IF EXISTS test_questions CASCADE;
DROP TABLE IF EXISTS tests CASCADE;
