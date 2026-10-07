-- 013_product_limits.sql
-- Sprint 1 (F0-1): product/image limits per plan + fills 012->014 numbering gap
-- (CI validate-migrations requires sequential NNN_*.sql).
-- Idempotent: safe to re-run via Dashboard > SQL Editor.

ALTER TABLE plans ADD COLUMN IF NOT EXISTS max_products INTEGER NOT NULL DEFAULT 5;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS max_images_per_product INTEGER NOT NULL DEFAULT 3;

UPDATE plans SET
  max_products = CASE slug
    WHEN 'free' THEN 5
    WHEN 'starter' THEN 50
    WHEN 'growth' THEN 200
    WHEN 'enterprise' THEN 9999
    ELSE max_products
  END,
  max_images_per_product = CASE slug
    WHEN 'free' THEN 3
    WHEN 'starter' THEN 5
    WHEN 'growth' THEN 10
    WHEN 'enterprise' THEN 20
    ELSE max_images_per_product
  END
WHERE slug IN ('free', 'starter', 'growth', 'enterprise');

INSERT INTO plans (slug, name, price_monthly, max_websites, max_products, max_images_per_product) VALUES
  ('free', 'Free', 0, 1, 5, 3),
  ('starter', 'Starter', 99000, 3, 50, 5),
  ('growth', 'Growth', 249000, 10, 200, 10),
  ('enterprise', 'Enterprise', 599000, 999, 9999, 20)
ON CONFLICT (slug) DO UPDATE SET
  max_products = EXCLUDED.max_products,
  max_images_per_product = EXCLUDED.max_images_per_product;
