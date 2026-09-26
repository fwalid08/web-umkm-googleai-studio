-- 012_pricing_unify.sql
-- P2-1 Unifikasi pricing: UI billing-panel.tsx adalah kebenaran bisnis terbaru
-- (lebih murah untuk konversi; hemat 20% untuk yearly).
-- Sebelumnya 007: growth 299000 / enterprise 999000 tanpa kolom yearly.
-- Target: free 0/0/1, starter 99000/79000/3, growth 249000/199000/10, enterprise 599000/479000/999.
-- Idempoten, aman di-run ulang via Dashboard > SQL Editor.

ALTER TABLE plans ADD COLUMN IF NOT EXISTS price_yearly_monthly INTEGER NOT NULL DEFAULT 0;

UPDATE plans SET
  price_monthly = CASE slug
    WHEN 'free' THEN 0
    WHEN 'starter' THEN 99000
    WHEN 'growth' THEN 249000
    WHEN 'enterprise' THEN 599000
    ELSE price_monthly
  END,
  price_yearly_monthly = CASE slug
    WHEN 'free' THEN 0
    WHEN 'starter' THEN 79000
    WHEN 'growth' THEN 199000
    WHEN 'enterprise' THEN 479000
    ELSE price_yearly_monthly
  END,
  max_websites = CASE slug
    WHEN 'free' THEN 1
    WHEN 'starter' THEN 3
    WHEN 'growth' THEN 10
    WHEN 'enterprise' THEN 999
    ELSE max_websites
  END
WHERE slug IN ('free', 'starter', 'growth', 'enterprise');

INSERT INTO plans (slug, name, price_monthly, price_yearly_monthly, max_websites) VALUES
  ('free', 'Free', 0, 0, 1),
  ('starter', 'Starter', 99000, 79000, 3),
  ('growth', 'Growth', 249000, 199000, 10),
  ('enterprise', 'Enterprise', 599000, 479000, 999)
ON CONFLICT (slug) DO UPDATE SET
  price_monthly = EXCLUDED.price_monthly,
  price_yearly_monthly = EXCLUDED.price_yearly_monthly,
  max_websites = EXCLUDED.max_websites;

-- Down (rollback ke pricing 007, kolom yearly dipertahankan agar non-destruktif):
-- UPDATE plans SET price_monthly = 0 WHERE slug = 'free';
-- UPDATE plans SET price_monthly = 99000 WHERE slug = 'starter';
-- UPDATE plans SET price_monthly = 299000 WHERE slug = 'growth';
-- UPDATE plans SET price_monthly = 999000 WHERE slug = 'enterprise';
