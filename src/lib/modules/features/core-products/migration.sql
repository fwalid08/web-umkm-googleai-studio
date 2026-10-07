-- Migration: Core Products (prod_ tables)
-- Part of Fase 0b: Core feature folders

-- Products table - add missing columns to existing table (renamed from products in 049)
ALTER TABLE prod_products 
  ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS compare_at_price INT CHECK (compare_at_price >= 0),
  ADD COLUMN IF NOT EXISTS stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  ADD COLUMN IF NOT EXISTS track_stock BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES prod_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Product images
CREATE TABLE IF NOT EXISTS prod_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES prod_products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product variants
CREATE TABLE IF NOT EXISTS prod_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES prod_products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  price INT NOT NULL CHECK (price >= 0),
  compare_at_price INT CHECK (compare_at_price >= 0),
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  attributes JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock movements (for stock_tracking feature)
CREATE TABLE IF NOT EXISTS prod_stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES prod_products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES prod_variants(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('in', 'out', 'adjustment', 'return')),
  quantity INT NOT NULL,
  reference_type TEXT, -- 'order', 'manual', 'adjustment'
  reference_id UUID,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product categories
CREATE TABLE IF NOT EXISTS prod_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES ws_websites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (website_id, slug)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_prod_products_website ON prod_products(website_id);
CREATE INDEX IF NOT EXISTS idx_prod_products_status ON prod_products(status);
CREATE INDEX IF NOT EXISTS idx_prod_images_product ON prod_images(product_id);
CREATE INDEX IF NOT EXISTS idx_prod_variants_product ON prod_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_prod_stock_movements_product ON prod_stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_prod_stock_movements_created ON prod_stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_prod_categories_website ON prod_categories(website_id);

-- RLS Policies
ALTER TABLE prod_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE prod_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE prod_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE prod_stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE prod_categories ENABLE ROW LEVEL SECURITY;

-- Products: owner can CRUD
CREATE POLICY prod_products_owner_all ON prod_products
  FOR ALL USING (
    website_id IN (SELECT id FROM ws_websites WHERE user_id = auth.uid())
  );

-- Images: owner can CRUD via product
CREATE POLICY prod_images_owner_all ON prod_images
  FOR ALL USING (
    product_id IN (SELECT id FROM prod_products WHERE website_id IN (SELECT id FROM ws_websites WHERE user_id = auth.uid()))
  );

-- Variants: owner can CRUD via product
CREATE POLICY prod_variants_owner_all ON prod_variants
  FOR ALL USING (
    product_id IN (SELECT id FROM prod_products WHERE website_id IN (SELECT id FROM ws_websites WHERE user_id = auth.uid()))
  );

-- Stock movements: owner can read, system can write
CREATE POLICY prod_stock_movements_owner_read ON prod_stock_movements
  FOR SELECT USING (
    product_id IN (SELECT id FROM prod_products WHERE website_id IN (SELECT id FROM ws_websites WHERE user_id = auth.uid()))
  );

CREATE POLICY prod_stock_movements_system_write ON prod_stock_movements
  FOR INSERT WITH CHECK (true); -- Service role

-- Categories: owner can CRUD
CREATE POLICY prod_categories_owner_all ON prod_categories
  FOR ALL USING (
    website_id IN (SELECT id FROM ws_websites WHERE user_id = auth.uid())
  );