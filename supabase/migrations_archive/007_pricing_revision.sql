-- 007_pricing_revision.sql
-- Revisi pricing pasca-review strategi: Starter 2 → 3 website (sweet spot konversi).
-- Growth/Enterprise ikut ditegaskan. Idempoten, aman di-run ulang.
-- Cara ubah di saas admin: UPDATE plans SET max_websites = N WHERE slug = 'starter';

UPDATE plans SET max_websites = 1, price_monthly = 0 WHERE slug = 'free';
UPDATE plans SET max_websites = 3, price_monthly = 99000 WHERE slug = 'starter';
UPDATE plans SET max_websites = 10, price_monthly = 299000 WHERE slug = 'growth';
UPDATE plans SET max_websites = 999, price_monthly = 999000 WHERE slug = 'enterprise';
