-- Migration 012: Restore compat views (INCIDENT REMEDIATION)
-- Production still runs pre-rename code (origin/main); 011 dropped the views
-- it depends on. Recreate all 12 compat views so old code works again.
-- DO NOT drop these until new prefix-native code is deployed to production.

DO $$
BEGIN
  IF to_regclass('public.ws_websites') IS NOT NULL THEN
    CREATE OR REPLACE VIEW websites AS SELECT * FROM ws_websites;
  END IF;
  IF to_regclass('public.ws_settings') IS NOT NULL THEN
    CREATE OR REPLACE VIEW website_settings AS SELECT * FROM ws_settings;
  END IF;
  IF to_regclass('public.prod_products') IS NOT NULL THEN
    CREATE OR REPLACE VIEW products AS SELECT * FROM prod_products;
  END IF;
  IF to_regclass('public.prod_images') IS NOT NULL THEN
    CREATE OR REPLACE VIEW product_images AS SELECT * FROM prod_images;
  END IF;
  IF to_regclass('public.prod_variants') IS NOT NULL THEN
    CREATE OR REPLACE VIEW product_variants AS SELECT * FROM prod_variants;
  END IF;
  IF to_regclass('public.prod_stock_movements') IS NOT NULL THEN
    CREATE OR REPLACE VIEW stock_movements AS SELECT * FROM prod_stock_movements;
  END IF;
  IF to_regclass('public.ord_orders') IS NOT NULL THEN
    CREATE OR REPLACE VIEW orders AS SELECT * FROM ord_orders;
  END IF;
  IF to_regclass('public.dom_orders') IS NOT NULL THEN
    CREATE OR REPLACE VIEW domain_orders AS SELECT * FROM dom_orders;
  END IF;
  IF to_regclass('public.bill_plans') IS NOT NULL THEN
    CREATE OR REPLACE VIEW plans AS SELECT * FROM bill_plans;
  END IF;
  IF to_regclass('public.bill_tier_limits') IS NOT NULL THEN
    CREATE OR REPLACE VIEW tier_limits AS SELECT * FROM bill_tier_limits;
  END IF;
  IF to_regclass('public.bill_subscriptions') IS NOT NULL THEN
    CREATE OR REPLACE VIEW subscriptions AS SELECT * FROM bill_subscriptions;
  END IF;
  IF to_regclass('public.bld_user_templates') IS NOT NULL THEN
    CREATE OR REPLACE VIEW user_templates AS SELECT * FROM bld_user_templates;
  END IF;
END $$;