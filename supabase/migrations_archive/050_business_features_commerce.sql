-- Migration 050: Commerce & Logistics features
-- cek_ongkir, custom_domain (dom_orders), template system

-- ===== ong_rates_cache: cek_ongkir rate caching =====
CREATE TABLE IF NOT EXISTS ong_rates_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  weight INT NOT NULL CHECK (weight > 0),
  courier TEXT NOT NULL,
  rates JSONB NOT NULL DEFAULT '[]',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (origin, destination, weight, courier)
);
CREATE INDEX IF NOT EXISTS idx_ong_rates_cache_lookup ON ong_rates_cache(origin, destination, weight, courier);
CREATE INDEX IF NOT EXISTS idx_ong_rates_cache_expires ON ong_rates_cache(expires_at);

-- ===== ong_usage_log: cek_ongkir metering =====
CREATE TABLE IF NOT EXISTS ong_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES ws_websites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  weight INT NOT NULL CHECK (weight > 0),
  courier TEXT,
  results_count INT NOT NULL DEFAULT 0,
  cached BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ong_usage_log_website ON ong_usage_log(website_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ong_usage_log_user ON ong_usage_log(user_id, created_at);

-- ===== dom_orders: already created in 049, add RLS =====
-- (dom_orders table created in 049_core_feature_extensions.sql)

-- ===== bld_templates & bld_user_templates =====
CREATE TABLE IF NOT EXISTS bld_templates(
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT NOT NULL,
  site_types TEXT[] NOT NULL DEFAULT '{online_shop}',
  tiers TEXT[] NOT NULL DEFAULT '{free,starter,growth,enterprise}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reconcile bld_user_templates schema.
-- Legacy user_templates.template_id was UUID; new bld_templates.id is TEXT,
-- so a renamed table carries the wrong type. Dev DB: drop + recreate is safe.
DROP TABLE IF EXISTS bld_user_templates CASCADE;

CREATE TABLE bld_user_templates(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES ws_websites(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL REFERENCES bld_templates(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(website_id, template_id)
);

-- Re-create compat view dropped by CASCADE above
DO $$
BEGIN
  IF to_regclass('public.bld_user_templates') IS NOT NULL THEN
    CREATE OR REPLACE VIEW user_templates AS SELECT * FROM bld_user_templates;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_bld_templates_category ON bld_templates(category);
CREATE INDEX IF NOT EXISTS idx_bld_templates_site_types ON bld_templates USING GIN(site_types);
CREATE INDEX IF NOT EXISTS idx_bld_user_templates_website ON bld_user_templates(website_id);
CREATE INDEX IF NOT EXISTS idx_bld_user_templates_template ON bld_user_templates(template_id);

-- ===== bld_template_tiers: for template_premium =====
CREATE TABLE IF NOT EXISTS bld_template_tiers(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id TEXT NOT NULL REFERENCES bld_templates(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('free','starter','growth','enterprise')),
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(template_id, tier)
);
CREATE INDEX IF NOT EXISTS idx_bld_template_tiers_template ON bld_template_tiers(template_id);

-- ===== pay_transactions & pay_refunds: for payment_online =====
CREATE TABLE IF NOT EXISTS pay_transactions(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES ord_orders(id) ON DELETE CASCADE,
  website_id UUID NOT NULL REFERENCES ws_websites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INT NOT NULL CHECK (amount > 0),
  provider TEXT NOT NULL CHECK (provider IN ('midtrans','xendit','manual')),
  provider_reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','refunded','expired')),
  payment_method TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pay_transactions_order ON pay_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_pay_transactions_website ON pay_transactions(website_id);
CREATE INDEX IF NOT EXISTS idx_pay_transactions_user ON pay_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_pay_transactions_status ON pay_transactions(status);

CREATE TABLE IF NOT EXISTS pay_refunds(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES pay_transactions(id) ON DELETE CASCADE,
  amount INT NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','failed')),
  provider_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_pay_refunds_transaction ON pay_refunds(transaction_id);

-- RLS
ALTER TABLE ong_rates_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE ong_usage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE bld_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE bld_user_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE bld_template_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pay_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pay_refunds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ong_rates_cache_public_read ON ong_rates_cache;
CREATE POLICY ong_rates_cache_public_read ON ong_rates_cache FOR SELECT USING (true);
DROP POLICY IF EXISTS ong_rates_cache_system_write ON ong_rates_cache;
CREATE POLICY ong_rates_cache_system_write ON ong_rates_cache FOR ALL WITH CHECK (true);

DROP POLICY IF EXISTS ong_usage_log_owner_read ON ong_usage_log;
CREATE POLICY ong_usage_log_owner_read ON ong_usage_log
  FOR SELECT USING (website_id IN (SELECT id FROM ws_websites WHERE user_id = auth.uid()) OR user_id = auth.uid());
DROP POLICY IF EXISTS ong_usage_log_system_write ON ong_usage_log;
CREATE POLICY ong_usage_log_system_write ON ong_usage_log FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS bld_templates_public_read ON bld_templates;
CREATE POLICY bld_templates_public_read ON bld_templates FOR SELECT USING (true);
DROP POLICY IF EXISTS bld_template_tiers_public_read ON bld_template_tiers;
CREATE POLICY bld_template_tiers_public_read ON bld_template_tiers FOR SELECT USING (true);

DROP POLICY IF EXISTS bld_user_templates_owner_all ON bld_user_templates;
CREATE POLICY bld_user_templates_owner_all ON bld_user_templates
  FOR ALL USING (website_id IN (SELECT id FROM ws_websites WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS pay_transactions_owner_all ON pay_transactions;
CREATE POLICY pay_transactions_owner_all ON pay_transactions
  FOR ALL USING (website_id IN (SELECT id FROM ws_websites WHERE user_id = auth.uid()) OR user_id = auth.uid());

DROP POLICY IF EXISTS pay_refunds_owner_all ON pay_refunds;
CREATE POLICY pay_refunds_owner_all ON pay_refunds
  FOR ALL USING (transaction_id IN (SELECT id FROM pay_transactions WHERE user_id = auth.uid()));