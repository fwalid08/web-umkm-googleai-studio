-- Migration: Payment Online (pay_ tables)
-- Online payment transactions

CREATE TABLE IF NOT EXISTS pay_transactions(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES ord_orders(id) ON DELETE CASCADE,
  website_id UUID NOT NULL REFERENCES ws_websites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INT NOT NULL CHECK (amount > 0),
  provider TEXT NOT NULL CHECK (provider IN ('midtrans','xendit','manual')),
  provider_reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','refunded','expired')),
  payment_method TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pay_refunds(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES pay_transactions(id) ON DELETE CASCADE,
  amount INT NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','failed')),
  provider_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pay_transactions_order ON pay_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_pay_transactions_website ON pay_transactions(website_id);
CREATE INDEX IF NOT EXISTS idx_pay_transactions_user ON pay_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_pay_transactions_status ON pay_transactions(status);
CREATE INDEX IF NOT EXISTS idx_pay_refunds_transaction ON pay_refunds(transaction_id);

ALTER TABLE pay_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pay_refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY pay_transactions_owner_all ON pay_transactions
  FOR ALL USING (
    website_id IN (SELECT id FROM ws_websites WHERE user_id = auth.uid())
    OR user_id = auth.uid()
  );

CREATE POLICY pay_refunds_owner_all ON pay_refunds
  FOR ALL USING (
    transaction_id IN (SELECT id FROM pay_transactions WHERE user_id = auth.uid())
  );