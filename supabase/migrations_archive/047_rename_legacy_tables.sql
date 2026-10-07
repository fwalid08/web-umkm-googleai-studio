-- Migration 047: Rename legacy tables to prefixed names + add compat views (idempotent)
-- Consolidates: 047-061 rename migrations
-- Safe to run multiple times. Uses to_regclass() so views are never mistaken for tables,
-- and compat views / indexes are only created when the target TABLE actually exists.

-- Helper: rename old -> new only when old is a real TABLE and new does not exist yet.
-- websites → ws_websites
DO $$
BEGIN
  IF to_regclass('public.websites') IS NOT NULL
     AND (SELECT relkind FROM pg_class WHERE oid = to_regclass('public.websites')) = 'r'
     AND to_regclass('public.ws_websites') IS NULL THEN
    ALTER TABLE websites RENAME TO ws_websites;
  END IF;
  IF to_regclass('public.ws_websites') IS NOT NULL THEN
    CREATE OR REPLACE VIEW websites AS SELECT * FROM ws_websites;
  END IF;
END $$;

-- website_settings → ws_settings
DO $$
BEGIN
  IF to_regclass('public.website_settings') IS NOT NULL
     AND (SELECT relkind FROM pg_class WHERE oid = to_regclass('public.website_settings')) = 'r'
     AND to_regclass('public.ws_settings') IS NULL THEN
    ALTER TABLE website_settings RENAME TO ws_settings;
  END IF;
  IF to_regclass('public.ws_settings') IS NOT NULL THEN
    CREATE OR REPLACE VIEW website_settings AS SELECT * FROM ws_settings;
  END IF;
END $$;

-- products → prod_products
DO $$
BEGIN
  IF to_regclass('public.products') IS NOT NULL
     AND (SELECT relkind FROM pg_class WHERE oid = to_regclass('public.products')) = 'r'
     AND to_regclass('public.prod_products') IS NULL THEN
    ALTER TABLE products RENAME TO prod_products;
  END IF;
  IF to_regclass('public.prod_products') IS NOT NULL THEN
    CREATE OR REPLACE VIEW products AS SELECT * FROM prod_products;
  END IF;
END $$;

-- product_images → prod_images
DO $$
BEGIN
  IF to_regclass('public.product_images') IS NOT NULL
     AND (SELECT relkind FROM pg_class WHERE oid = to_regclass('public.product_images')) = 'r'
     AND to_regclass('public.prod_images') IS NULL THEN
    ALTER TABLE product_images RENAME TO prod_images;
  END IF;
  IF to_regclass('public.prod_images') IS NOT NULL THEN
    CREATE OR REPLACE VIEW product_images AS SELECT * FROM prod_images;
  END IF;
END $$;

-- product_variants → prod_variants
DO $$
BEGIN
  IF to_regclass('public.product_variants') IS NOT NULL
     AND (SELECT relkind FROM pg_class WHERE oid = to_regclass('public.product_variants')) = 'r'
     AND to_regclass('public.prod_variants') IS NULL THEN
    ALTER TABLE product_variants RENAME TO prod_variants;
  END IF;
  IF to_regclass('public.prod_variants') IS NOT NULL THEN
    CREATE OR REPLACE VIEW product_variants AS SELECT * FROM prod_variants;
  END IF;
END $$;

-- stock_movements → prod_stock_movements
DO $$
BEGIN
  IF to_regclass('public.stock_movements') IS NOT NULL
     AND (SELECT relkind FROM pg_class WHERE oid = to_regclass('public.stock_movements')) = 'r'
     AND to_regclass('public.prod_stock_movements') IS NULL THEN
    ALTER TABLE stock_movements RENAME TO prod_stock_movements;
  END IF;
  IF to_regclass('public.prod_stock_movements') IS NOT NULL THEN
    CREATE OR REPLACE VIEW stock_movements AS SELECT * FROM prod_stock_movements;
  END IF;
END $$;

-- orders → ord_orders
DO $$
BEGIN
  IF to_regclass('public.orders') IS NOT NULL
     AND (SELECT relkind FROM pg_class WHERE oid = to_regclass('public.orders')) = 'r'
     AND to_regclass('public.ord_orders') IS NULL THEN
    ALTER TABLE orders RENAME TO ord_orders;
  END IF;
  IF to_regclass('public.ord_orders') IS NOT NULL THEN
    CREATE OR REPLACE VIEW orders AS SELECT * FROM ord_orders;
  END IF;
END $$;

-- domain_orders → dom_orders
DO $$
BEGIN
  IF to_regclass('public.domain_orders') IS NOT NULL
     AND (SELECT relkind FROM pg_class WHERE oid = to_regclass('public.domain_orders')) = 'r'
     AND to_regclass('public.dom_orders') IS NULL THEN
    ALTER TABLE domain_orders RENAME TO dom_orders;
  END IF;
  IF to_regclass('public.dom_orders') IS NOT NULL THEN
    CREATE OR REPLACE VIEW domain_orders AS SELECT * FROM dom_orders;
  END IF;
END $$;

-- templates → bld_templates (target created in 050; view only if target exists)
DO $$
BEGIN
  IF to_regclass('public.templates') IS NOT NULL
     AND (SELECT relkind FROM pg_class WHERE oid = to_regclass('public.templates')) = 'r'
     AND to_regclass('public.bld_templates') IS NULL THEN
    ALTER TABLE templates RENAME TO bld_templates;
  END IF;
  IF to_regclass('public.bld_templates') IS NOT NULL THEN
    CREATE OR REPLACE VIEW templates AS SELECT * FROM bld_templates;
  END IF;
END $$;

-- user_templates → bld_user_templates (target reconciled in 050; view only if target exists)
DO $$
BEGIN
  IF to_regclass('public.user_templates') IS NOT NULL
     AND (SELECT relkind FROM pg_class WHERE oid = to_regclass('public.user_templates')) = 'r'
     AND to_regclass('public.bld_user_templates') IS NULL THEN
    ALTER TABLE user_templates RENAME TO bld_user_templates;
  END IF;
  IF to_regclass('public.bld_user_templates') IS NOT NULL THEN
    CREATE OR REPLACE VIEW user_templates AS SELECT * FROM bld_user_templates;
  END IF;
END $$;

-- user_template_library → bld_user_template_library (view only if target exists)
DO $$
BEGIN
  IF to_regclass('public.user_template_library') IS NOT NULL
     AND (SELECT relkind FROM pg_class WHERE oid = to_regclass('public.user_template_library')) = 'r'
     AND to_regclass('public.bld_user_template_library') IS NULL THEN
    ALTER TABLE user_template_library RENAME TO bld_user_template_library;
  END IF;
  IF to_regclass('public.bld_user_template_library') IS NOT NULL THEN
    CREATE OR REPLACE VIEW user_template_library AS SELECT * FROM bld_user_template_library;
  END IF;
END $$;

-- plans → bill_plans
DO $$
BEGIN
  IF to_regclass('public.plans') IS NOT NULL
     AND (SELECT relkind FROM pg_class WHERE oid = to_regclass('public.plans')) = 'r'
     AND to_regclass('public.bill_plans') IS NULL THEN
    ALTER TABLE plans RENAME TO bill_plans;
  END IF;
  IF to_regclass('public.bill_plans') IS NOT NULL THEN
    CREATE OR REPLACE VIEW plans AS SELECT * FROM bill_plans;
  END IF;
END $$;

-- tier_limits → bill_tier_limits
DO $$
BEGIN
  IF to_regclass('public.tier_limits') IS NOT NULL
     AND (SELECT relkind FROM pg_class WHERE oid = to_regclass('public.tier_limits')) = 'r'
     AND to_regclass('public.bill_tier_limits') IS NULL THEN
    ALTER TABLE tier_limits RENAME TO bill_tier_limits;
  END IF;
  IF to_regclass('public.bill_tier_limits') IS NOT NULL THEN
    CREATE OR REPLACE VIEW tier_limits AS SELECT * FROM bill_tier_limits;
  END IF;
END $$;

-- subscriptions → bill_subscriptions
DO $$
BEGIN
  IF to_regclass('public.subscriptions') IS NOT NULL
     AND (SELECT relkind FROM pg_class WHERE oid = to_regclass('public.subscriptions')) = 'r'
     AND to_regclass('public.bill_subscriptions') IS NULL THEN
    ALTER TABLE subscriptions RENAME TO bill_subscriptions;
  END IF;
  IF to_regclass('public.bill_subscriptions') IS NOT NULL THEN
    CREATE OR REPLACE VIEW subscriptions AS SELECT * FROM bill_subscriptions;
  END IF;
END $$;

-- store_pages → bld_pages (bld_pages may not exist yet; view only if target exists)
DO $$
BEGIN
  IF to_regclass('public.store_pages') IS NOT NULL
     AND (SELECT relkind FROM pg_class WHERE oid = to_regclass('public.store_pages')) = 'r'
     AND to_regclass('public.bld_pages') IS NULL THEN
    ALTER TABLE store_pages RENAME TO bld_pages;
  END IF;
  IF to_regclass('public.bld_pages') IS NOT NULL THEN
    CREATE OR REPLACE VIEW store_pages AS SELECT * FROM bld_pages;
  END IF;
END $$;

-- Indexes: only when table AND column both exist (fully re-runnable)
DO $$
BEGIN
  IF to_regclass('public.ws_websites') IS NOT NULL
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ws_websites' AND column_name = 'user_id') THEN
    CREATE INDEX IF NOT EXISTS idx_ws_websites_user_id ON ws_websites(user_id);
  END IF;
  IF to_regclass('public.prod_products') IS NOT NULL
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prod_products' AND column_name = 'website_id') THEN
    CREATE INDEX IF NOT EXISTS idx_prod_products_website_id ON prod_products(website_id);
  END IF;
  IF to_regclass('public.ord_orders') IS NOT NULL
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ord_orders' AND column_name = 'website_id') THEN
    CREATE INDEX IF NOT EXISTS idx_ord_orders_website_id ON ord_orders(website_id);
  END IF;
  IF to_regclass('public.dom_orders') IS NOT NULL
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dom_orders' AND column_name = 'website_id') THEN
    CREATE INDEX IF NOT EXISTS idx_dom_orders_website_id ON dom_orders(website_id);
  END IF;
  IF to_regclass('public.bld_user_templates') IS NOT NULL
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bld_user_templates' AND column_name = 'website_id') THEN
    CREATE INDEX IF NOT EXISTS idx_bld_user_templates_website_id ON bld_user_templates(website_id);
  END IF;
  IF to_regclass('public.bld_pages') IS NOT NULL
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bld_pages' AND column_name = 'website_id') THEN
    CREATE INDEX IF NOT EXISTS idx_bld_pages_website_id ON bld_pages(website_id);
  END IF;
END $$;
