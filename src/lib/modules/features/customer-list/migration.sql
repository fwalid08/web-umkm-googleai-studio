-- Migration: Customer List (ord_ tables)
-- Customer list derived from orders

CREATE TABLE IF NOT EXISTS ord_customers(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES ws_websites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  total_orders INT NOT NULL DEFAULT 0,
  total_spent INT NOT NULL DEFAULT 0,
  last_order_at TIMESTAMPTZ,
  first_order_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(website_id, phone)
);

CREATE INDEX IF NOT EXISTS idx_ord_customers_website ON ord_customers(website_id);
CREATE INDEX IF NOT EXISTS idx_ord_customers_phone ON ord_customers(phone);

ALTER TABLE ord_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY ord_customers_owner_all ON ord_customers
  FOR ALL USING (
    website_id IN (SELECT id FROM ws_websites WHERE user_id = auth.uid())
  );