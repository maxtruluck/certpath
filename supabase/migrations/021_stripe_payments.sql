-- Add price columns to courses if they don't exist
ALTER TABLE courses ADD COLUMN IF NOT EXISTS price_cents INTEGER DEFAULT 0;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'usd';

-- Transactions table — records every purchase
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  stripe_checkout_session_id TEXT NOT NULL UNIQUE,
  stripe_payment_intent_id TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  platform_fee_cents INTEGER NOT NULL,
  creator_earnings_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'refunded', 'disputed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_creator ON transactions(creator_id);
CREATE INDEX idx_transactions_course ON transactions(course_id);
CREATE INDEX idx_transactions_stripe ON transactions(stripe_checkout_session_id);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Users can see their own purchases
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Creators can see transactions for their courses
CREATE POLICY "Creators can view their earnings"
  ON transactions FOR SELECT
  USING (creator_id IN (
    SELECT id FROM creators WHERE user_id = auth.uid()
  ));

-- Only service role can insert (webhook handler)
-- No INSERT policy for regular users — inserts happen via service role in webhook
