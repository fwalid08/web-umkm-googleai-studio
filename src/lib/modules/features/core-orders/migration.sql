-- Migration: Core Orders (ord_ tables)
-- Part of Fase 0b: Core feature folders

-- Orders table
CREATE TABLE IF NOT EXISTS ord_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES ws_websites(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  customer_address TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]', -- Array of OrderItem
  subtotal INT NOT NULL CHECK (subtotal >= 0),
  shipping_cost INT NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
  total INT NOT NULL CHECK (total >= 0),
  status TEXT NOT NULL DEFAULT 'baru' CHECK (status IN ('baru', 'konfirmasi', 'dikirim', 'selesai', 'dibatalkan')),
  payment_method TEXT NOT NULL DEFAULT 'cod' CHECK (payment_method IN ('cod', 'transfer', 'cash', 'qris')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
  payment_reference TEXT,
  notes TEXT,
  tracking_number TEXT,
  courier TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ord_orders_website ON ord_orders(website_id);
CREATE INDEX IF NOT EXISTS idx_ord_orders_status ON ord_orders(status);
CREATE INDEX IF NOT EXISTS idx_ord_orders_created ON ord_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_ord_orders_customer_phone ON ord_orders(customer_phone);

-- RLS Policies
ALTER TABLE ord_orders ENABLE ROW LEVEL SECURITY;

-- Orders: owner can CRUD
CREATE POLICY ord_orders_owner_all ON ord_orders
  FOR ALL USING (
    website_id IN (SELECT id FROM ws_websites WHERE user_id = auth.uid())
  );

-- Customers (public) can create orders
CREATE POLICY ord_orders_public_insert ON ord_orders
  FOR INSERT WITH CHECK (true);

-- Customers can read their own orders (by phone)
CREATE POLICY ord_orders_customer_read ON ord_orders
  FOR SELECT USING (
    customer_phone = current_setting('request.jwt.claims', true)::json->>'phone'
    OR website_id IN (SELECT id FROM ws_websites WHERE user_id = auth.uid())
  );