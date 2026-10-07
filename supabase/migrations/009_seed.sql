-- Migration 053: Seed module system (features, packs, pricing for online_shop)
-- Run after 048_core_modules

-- ===== Seed mod_features (22 features) =====
INSERT INTO mod_features (id, name, category, description, scope, is_paid, site_types, requires, conflicts, is_active) VALUES
-- Core W gratis (semua tier)
('products_dasar', 'Produk Dasar', 'operasional', 'Kelola katalog produk', 'website', false, '{online_shop}', '{}', '{}', true),
('orders_wa', 'Order via WhatsApp', 'operasional', 'Terima pesanan via WhatsApp', 'website', false, '{online_shop}', '{products_dasar}', '{}', true),
('subdomain', 'Subdomain Gratis', 'operasional', 'Subdomain *.umkm.co.id', 'website', false, '{online_shop}', '{}', '{}', true),
('template_dasar', 'Template Dasar', 'operasional', 'Akses template gratis', 'website', false, '{online_shop}', '{}', '{}', true),
('dashboard_dasar', 'Dashboard Dasar', 'operasional', 'Dashboard penjualan & pesanan', 'website', false, '{online_shop}', '{}', '{}', true),

-- Pack features (included Starter+)
('stock_tracking', 'Stok Otomatis', 'operasional', 'Tracking stok real-time', 'website', true, '{online_shop}', '{products_dasar}', '{}', true),
('customer_list', 'Daftar Pelanggan', 'operasional', 'Kelola data pelanggan', 'website', true, '{online_shop}', '{orders_wa}', '{}', true),
('custom_domain', 'Custom Domain', 'operasional', 'Domain sendiri (TLD)', 'website', true, '{online_shop}', '{}', '{}', true),
('template_premium', 'Template Premium', 'operasional', 'Akses template premium', 'website', true, '{online_shop}', '{}', '{}', true),
('analytics_export', 'Ekspor Analitik', 'analitik', 'Ekspor data CSV/Excel', 'global', true, '{online_shop}', '{}', '{}', true),

-- Add-on W (scope website, paid separate)
('cek_ongkir', 'Cek Ongkir', 'logistik', 'Real-time tarif pengiriman', 'website', true, '{online_shop}', '{products_dasar,orders_wa}', '{}', true),
('payment_online', 'Pembayaran Online', 'pembayaran', 'Midtrans/Xendit', 'website', true, '{online_shop}', '{orders_wa,products_dasar}', '{}', true),
('pages_extra', 'Halaman Tambahan', 'operasional', 'Kuota halaman > tier', 'website', true, '{online_shop}', '{}', '{}', true),

-- Modul G (scope global, subscription mandiri)
('akunting_dasar', 'Akunting Dasar', 'keuangan', 'Jurnal & buku besar', 'global', true, NULL, '{orders_wa}', '{}', true),
('akunting_lanjutan', 'Akunting Lanjutan', 'keuangan', 'Laba-rugi, neraca, pajak', 'global', true, NULL, '{akunting_dasar}', '{}', true),
('hrm_core', 'HRM Core', 'sdm', 'Karyawan, absensi, shift', 'global', true, NULL, '{}', '{}', true),
('payroll', 'Payroll', 'sdm', 'Slip gaji, THR, PPh21', 'global', true, NULL, '{hrm_core,akunting_dasar}', '{}', true),
('wa_gateway', 'WA Gateway', 'komunikasi', 'Broadcast & template WA', 'global', true, NULL, '{}', '{}', true)

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  scope = EXCLUDED.scope,
  is_paid = EXCLUDED.is_paid,
  site_types = EXCLUDED.site_types,
  requires = EXCLUDED.requires,
  conflicts = EXCLUDED.conflicts,
  is_active = EXCLUDED.is_active;

-- ===== Seed mod_packs =====
INSERT INTO mod_packs (id, site_type, name) VALUES
  ('online_shop_pack', 'online_shop', 'Online Shop Feature Pack')
ON CONFLICT (id) DO UPDATE SET
  site_type = EXCLUDED.site_type,
  name = EXCLUDED.name;

-- ===== Seed mod_pack_features (online_shop_pack) =====
-- Core W gratis: included in all tiers (empty included_tiers = all)
INSERT INTO mod_pack_features (pack_id, feature_id, quota, included_tiers) VALUES
  ('online_shop_pack', 'products_dasar', NULL, '{free,starter,growth,enterprise}'),
  ('online_shop_pack', 'orders_wa', NULL, '{free,starter,growth,enterprise}'),
  ('online_shop_pack', 'subdomain', NULL, '{free,starter,growth,enterprise}'),
  ('online_shop_pack', 'template_dasar', NULL, '{free,starter,growth,enterprise}'),
  ('online_shop_pack', 'dashboard_dasar', NULL, '{free,starter,growth,enterprise}')
ON CONFLICT (pack_id, feature_id) DO UPDATE SET
  quota = EXCLUDED.quota,
  included_tiers = EXCLUDED.included_tiers;

-- Pack features (included Starter+)
INSERT INTO mod_pack_features (pack_id, feature_id, quota, included_tiers) VALUES
  ('online_shop_pack', 'stock_tracking', NULL, '{starter,growth,enterprise}'),
  ('online_shop_pack', 'customer_list', NULL, '{starter,growth,enterprise}'),
  ('online_shop_pack', 'custom_domain', 1, '{starter,growth,enterprise}'),
  ('online_shop_pack', 'template_premium', NULL, '{starter,growth,enterprise}'),
  ('online_shop_pack', 'analytics_export', NULL, '{growth,enterprise}')
ON CONFLICT (pack_id, feature_id) DO UPDATE SET
  quota = EXCLUDED.quota,
  included_tiers = EXCLUDED.included_tiers;

-- ===== Seed mod_site_prices (online_shop) =====
INSERT INTO mod_site_prices (site_type, tier, cycle, price) VALUES
  ('online_shop', 'free', 'monthly', 0),
  ('online_shop', 'starter', 'monthly', 99000),
  ('online_shop', 'growth', 'monthly', 249000),
  ('online_shop', 'enterprise', 'monthly', 599000),
  ('online_shop', 'free', 'yearly', 0),
  ('online_shop', 'starter', 'yearly', 950400),  -- 20% off
  ('online_shop', 'growth', 'yearly', 2390400), -- 20% off
  ('online_shop', 'enterprise', 'yearly', 5750400) -- 20% off
ON CONFLICT (site_type, tier, cycle) DO UPDATE SET
  price = EXCLUDED.price;