-- Migration: Custom Domain (dom_ tables)
-- Custom domain orders & website field

CREATE TABLE IF NOT EXISTS dom_orders(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES ws_websites(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','expired','cancelled')),
  price INT NOT NULL DEFAULT 0,
  billing_cycle TEXT NOT NULL DEFAULT 'yearly' CHECK (billing_cycle IN ('monthly','yearly')),
  current_period_start TIMESTAMPTZ DEFAULT NOW(),
  current_period_end TIMESTAMPTZ DEFAULT NOW(),
  payment_reference TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dom_orders_website ON dom_orders(website_id);
CREATE INDEX IF NOT EXISTS idx_dom_orders_domain ON dom_orders(domain);
CREATE INDEX IF NOT EXISTS idx_dom_orders_status ON dom_orders(status);

ALTER TABLE dom_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY dom_orders_owner_all ON dom_orders
  FOR ALL USING (
    website_id IN (SELECT id FROM ws_websites WHERE user_id = auth.uid())
  );