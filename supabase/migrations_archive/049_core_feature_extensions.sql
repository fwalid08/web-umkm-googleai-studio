-- Migration 049: Core feature extensions (add missing columns to renamed tables)
-- Consolidates: 069 (prod_products), 074 (ord_orders), 070 (custom_domain), 071 (pages_extra)

-- ===== prod_categories: created FIRST (prod_products.category_id references it) =====
-- Guarded: ws_websites must exist (from 047). Skip entirely on DBs without it.
DO $$
BEGIN
  IF to_regclass('public.ws_websites') IS NOT NULL THEN
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
  END IF;
END $$;

-- ===== prod_products: add missing columns (table renamed from products in 047) =====
-- Guarded: only runs when prod_products exists (fresh DBs get it from 049 CREATE below is N/A;
-- prod_products always comes from 047 rename or pre-existing, so guard is enough).
DO $$
BEGIN
  IF to_regclass('public.prod_products') IS NOT NULL THEN
    ALTER TABLE prod_products
      ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '',
      ADD COLUMN IF NOT EXISTS compare_at_price INT CHECK (compare_at_price >= 0),
      ADD COLUMN IF NOT EXISTS stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
      ADD COLUMN IF NOT EXISTS track_stock BOOLEAN NOT NULL DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
      ADD COLUMN IF NOT EXISTS category_id UUID,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- FK prod_products.category_id -> prod_categories(id), added separately once both exist
DO $$
BEGIN
  IF to_regclass('public.prod_products') IS NOT NULL
     AND to_regclass('public.prod_categories') IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'prod_products_category_id_fkey') THEN
    ALTER TABLE prod_products
      ADD CONSTRAINT prod_products_category_id_fkey
      FOREIGN KEY (category_id) REFERENCES prod_categories(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.prod_products') IS NOT NULL
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prod_products' AND column_name = 'status') THEN
    CREATE INDEX IF NOT EXISTS idx_prod_products_status ON prod_products(status);
  END IF;
END $$;

-- ===== prod_images: new table =====
CREATE TABLE IF NOT EXISTS prod_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES prod_products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_prod_images_product ON prod_images(product_id);

-- ===== prod_variants: new table =====
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
CREATE INDEX IF NOT EXISTS idx_prod_variants_product ON prod_variants(product_id);

-- ===== prod_stock_movements: new table (for stock_tracking) =====
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
CREATE INDEX IF NOT EXISTS idx_prod_stock_movements_product ON prod_stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_prod_stock_movements_created ON prod_stock_movements(created_at);

-- ===== prod_categories index (table created above) =====
DO $$
BEGIN
  IF to_regclass('public.prod_categories') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_prod_categories_website ON prod_categories(website_id);
  END IF;
END $$;

-- ===== prod_stock_logs: for stock_tracking feature =====
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

-- ===== ord_orders: add missing columns (table renamed from orders in 047) =====
DO $$
BEGIN
  IF to_regclass('public.ord_orders') IS NOT NULL THEN
    ALTER TABLE ord_orders
      ADD COLUMN IF NOT EXISTS items JSONB NOT NULL DEFAULT '[]',
      ADD COLUMN IF NOT EXISTS subtotal INT NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
      ADD COLUMN IF NOT EXISTS shipping_cost INT NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
      ADD COLUMN IF NOT EXISTS total INT NOT NULL DEFAULT 0 CHECK (total >= 0),
      ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'baru' CHECK (status IN ('baru', 'konfirmasi', 'dikirim', 'selesai', 'dibatalkan')),
      ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'cod' CHECK (payment_method IN ('cod', 'transfer', 'cash', 'qris')),
      ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
      ADD COLUMN IF NOT EXISTS payment_reference TEXT,
      ADD COLUMN IF NOT EXISTS notes TEXT,
      ADD COLUMN IF NOT EXISTS tracking_number TEXT,
      ADD COLUMN IF NOT EXISTS courier TEXT,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
  END IF;
END $$;
DO $$
BEGIN
  IF to_regclass('public.ord_orders') IS NOT NULL
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ord_orders' AND column_name = 'status') THEN
    CREATE INDEX IF NOT EXISTS idx_ord_orders_status ON ord_orders(status);
  END IF;
  IF to_regclass('public.ord_orders') IS NOT NULL
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ord_orders' AND column_name = 'customer_phone') THEN
    CREATE INDEX IF NOT EXISTS idx_ord_orders_customer_phone ON ord_orders(customer_phone);
  END IF;
END $$;

-- ===== ord_customers: for customer_list feature =====
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

-- ===== ws_websites: add custom_domain & pages quota columns =====
DO $$
BEGIN
  IF to_regclass('public.ws_websites') IS NOT NULL THEN
    ALTER TABLE ws_websites
      ADD COLUMN IF NOT EXISTS custom_domain TEXT,
      ADD COLUMN IF NOT EXISTS max_pages INT NOT NULL DEFAULT 10;
  END IF;
  IF to_regclass('public.ws_websites') IS NOT NULL
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ws_websites' AND column_name = 'custom_domain') THEN
    CREATE INDEX IF NOT EXISTS idx_ws_websites_custom_domain ON ws_websites(custom_domain);
  END IF;
END $$;

-- ===== ws_pages_quota: for pages_extra addon =====
CREATE TABLE IF NOT EXISTS ws_pages_quota(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES ws_websites(id) ON DELETE CASCADE,
  extra_pages INT NOT NULL DEFAULT 0,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly','yearly')),
  price_charged INT NOT NULL DEFAULT 0,
  current_period_start TIMESTAMPTZ DEFAULT NOW(),
  current_period_end TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(website_id)
);
CREATE INDEX IF NOT EXISTS idx_ws_pages_quota_website ON ws_pages_quota(website_id);

-- ===== dom_orders: add missing columns (table renamed from domain_orders in 047) =====
DO $$
BEGIN
  IF to_regclass('public.dom_orders') IS NOT NULL THEN
    ALTER TABLE dom_orders
      ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','expired','cancelled')),
      ADD COLUMN IF NOT EXISTS price INT NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS billing_cycle TEXT NOT NULL DEFAULT 'yearly' CHECK (billing_cycle IN ('monthly','yearly')),
      ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS payment_reference TEXT,
      ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
  IF to_regclass('public.dom_orders') IS NOT NULL
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dom_orders' AND column_name = 'status') THEN
    CREATE INDEX IF NOT EXISTS idx_dom_orders_status ON dom_orders(status);
  END IF;
  IF to_regclass('public.dom_orders') IS NOT NULL
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dom_orders' AND column_name = 'domain') THEN
    CREATE INDEX IF NOT EXISTS idx_dom_orders_domain ON dom_orders(domain);
  END IF;
END $$;

-- RLS for new tables
ALTER TABLE prod_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE prod_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE prod_stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE prod_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE prod_stock_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ord_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ws_pages_quota ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS prod_images_owner_all ON prod_images;
CREATE POLICY prod_images_owner_all ON prod_images
  FOR ALL USING (product_id IN (SELECT id FROM prod_products WHERE website_id IN (SELECT id FROM ws_websites WHERE user_id = auth.uid())));

DROP POLICY IF EXISTS prod_variants_owner_all ON prod_variants;
CREATE POLICY prod_variants_owner_all ON prod_variants
  FOR ALL USING (product_id IN (SELECT id FROM prod_products WHERE website_id IN (SELECT id FROM ws_websites WHERE user_id = auth.uid())));

DROP POLICY IF EXISTS prod_stock_movements_owner_read ON prod_stock_movements;
CREATE POLICY prod_stock_movements_owner_read ON prod_stock_movements
  FOR SELECT USING (product_id IN (SELECT id FROM prod_products WHERE website_id IN (SELECT id FROM ws_websites WHERE user_id = auth.uid())));

DROP POLICY IF EXISTS prod_stock_movements_system_write ON prod_stock_movements;
CREATE POLICY prod_stock_movements_system_write ON prod_stock_movements
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS prod_categories_owner_all ON prod_categories;
CREATE POLICY prod_categories_owner_all ON prod_categories
  FOR ALL USING (website_id IN (SELECT id FROM ws_websites WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS prod_stock_logs_owner_read ON prod_stock_logs;
CREATE POLICY prod_stock_logs_owner_read ON prod_stock_logs
  FOR SELECT USING (product_id IN (SELECT id FROM prod_products WHERE website_id IN (SELECT id FROM ws_websites WHERE user_id = auth.uid())));

DROP POLICY IF EXISTS ord_customers_owner_all ON ord_customers;
CREATE POLICY ord_customers_owner_all ON ord_customers
  FOR ALL USING (website_id IN (SELECT id FROM ws_websites WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS ws_pages_quota_owner_all ON ws_pages_quota;
CREATE POLICY ws_pages_quota_owner_all ON ws_pages_quota
  FOR ALL USING (website_id IN (SELECT id FROM ws_websites WHERE user_id = auth.uid()));