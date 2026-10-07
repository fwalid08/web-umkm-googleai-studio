-- Migration: Stock Tracking (prod_ tables)
-- Stock tracking extension for products

CREATE TABLE IF NOT EXISTS prod_stock_logs(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES prod_products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES prod_variants(id) ON DELETE SET NULL,
  change_qty INT NOT NULL,
  previous_qty INT NOT NULL,
  new_qty INT NOT NULL,
  reason TEXT NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prod_stock_logs_product ON prod_stock_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_prod_stock_logs_created ON prod_stock_logs(created_at);

ALTER TABLE prod_stock_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY prod_stock_logs_owner_read ON prod_stock_logs
  FOR SELECT USING (
    product_id IN (SELECT id FROM prod_products WHERE website_id IN (SELECT id FROM ws_websites WHERE user_id = auth.uid()))
  );