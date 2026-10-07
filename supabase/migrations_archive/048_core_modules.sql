-- Migration 048: Core module tables (features, packs, subscriptions, site_types)
-- Consolidates: 062, 063, 066

-- mod_features: feature catalog
CREATE TABLE IF NOT EXISTS mod_features(
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT DEFAULT '',
  scope TEXT NOT NULL CHECK (scope IN ('website','global')),
  is_paid BOOLEAN NOT NULL DEFAULT FALSE,
  site_types TEXT[] NULL,
  requires TEXT[] NOT NULL DEFAULT '{}',
  conflicts TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- mod_packs: feature packs per site_type
CREATE TABLE IF NOT EXISTS mod_packs(
  id TEXT PRIMARY KEY,
  site_type TEXT NOT NULL,
  name TEXT NOT NULL
);

-- mod_pack_features: pack feature inclusions with quotas
CREATE TABLE IF NOT EXISTS mod_pack_features(
  pack_id TEXT REFERENCES mod_packs(id) ON DELETE CASCADE,
  feature_id TEXT REFERENCES mod_features(id) ON DELETE CASCADE,
  quota INT NULL,
  included_tiers TEXT[] NOT NULL DEFAULT '{}',
  PRIMARY KEY(pack_id, feature_id)
);

-- mod_site_prices: pricing matrix per site_type × tier × cycle
CREATE TABLE IF NOT EXISTS mod_site_prices(
  site_type TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('free','starter','growth','enterprise')),
  cycle TEXT NOT NULL CHECK (cycle IN ('monthly','yearly')),
  price INT NOT NULL CHECK (price >= 0),
  PRIMARY KEY(site_type, tier, cycle)
);

-- mod_sub_addons: website-scoped add-on subscriptions
CREATE TABLE IF NOT EXISTS mod_sub_addons(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES bill_subscriptions(id) ON DELETE CASCADE,
  website_id UUID NOT NULL REFERENCES ws_websites(id) ON DELETE CASCADE,
  feature_id TEXT NOT NULL REFERENCES mod_features(id),
  status TEXT NOT NULL DEFAULT 'incomplete'
    CHECK (status IN ('active','past_due','canceled','incomplete','incomplete_expired')),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly','yearly','once')),
  price_charged INT NOT NULL DEFAULT 0,
  current_period_start TIMESTAMPTZ DEFAULT NOW(),
  current_period_end TIMESTAMPTZ DEFAULT NOW(),
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  payment_reference TEXT UNIQUE,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subscription_id, website_id, feature_id)
);

-- mod_global_subs: global module subscriptions (user-scoped)
CREATE TABLE IF NOT EXISTS mod_global_subs(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feature_id TEXT NOT NULL REFERENCES mod_features(id),
  status TEXT NOT NULL DEFAULT 'incomplete'
    CHECK (status IN ('active','past_due','canceled','incomplete','incomplete_expired')),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly','yearly','once')),
  price_charged INT NOT NULL DEFAULT 0,
  current_period_start TIMESTAMPTZ DEFAULT NOW(),
  current_period_end TIMESTAMPTZ DEFAULT NOW(),
  payment_reference TEXT UNIQUE,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, feature_id)
);

-- mod_usage: metered usage tracking
CREATE TABLE IF NOT EXISTS mod_usage(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  website_id UUID REFERENCES ws_websites(id) ON DELETE CASCADE,
  feature_id TEXT NOT NULL REFERENCES mod_features(id),
  qty INT NOT NULL DEFAULT 1,
  reference_id TEXT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add site_type to ws_websites and bill_subscriptions (guarded: tables come from 047 renames)
DO $$
BEGIN
  IF to_regclass('public.ws_websites') IS NOT NULL THEN
    ALTER TABLE ws_websites ADD COLUMN IF NOT EXISTS site_type TEXT DEFAULT 'online_shop' NOT NULL;
  END IF;
  IF to_regclass('public.bill_subscriptions') IS NOT NULL THEN
    ALTER TABLE bill_subscriptions ADD COLUMN IF NOT EXISTS site_type TEXT DEFAULT 'online_shop' NOT NULL;
    ALTER TABLE bill_subscriptions ADD COLUMN IF NOT EXISTS pack_id TEXT NULL;
  END IF;
END $$;

-- Backfill existing records (guarded)
DO $$
BEGIN
  IF to_regclass('public.ws_websites') IS NOT NULL THEN
    UPDATE ws_websites SET site_type = 'online_shop' WHERE site_type IS NULL;
  END IF;
  IF to_regclass('public.bill_subscriptions') IS NOT NULL THEN
    UPDATE bill_subscriptions SET site_type = 'online_shop' WHERE site_type IS NULL;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mod_features_scope ON mod_features(scope);
CREATE INDEX IF NOT EXISTS idx_mod_features_site_types ON mod_features USING GIN(site_types);
CREATE INDEX IF NOT EXISTS idx_mod_packs_site_type ON mod_packs(site_type);
CREATE INDEX IF NOT EXISTS idx_mod_pack_features_pack ON mod_pack_features(pack_id);
CREATE INDEX IF NOT EXISTS idx_mod_pack_features_feature ON mod_pack_features(feature_id);
CREATE INDEX IF NOT EXISTS idx_mod_sub_addons_website ON mod_sub_addons(website_id);
CREATE INDEX IF NOT EXISTS idx_mod_sub_addons_sub ON mod_sub_addons(subscription_id);
CREATE INDEX IF NOT EXISTS idx_mod_global_subs_user ON mod_global_subs(user_id);
CREATE INDEX IF NOT EXISTS idx_mod_global_subs_feature ON mod_global_subs(feature_id);
CREATE INDEX IF NOT EXISTS idx_mod_usage_lookup ON mod_usage(user_id, website_id, feature_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ws_websites_site_type ON ws_websites(site_type);
CREATE INDEX IF NOT EXISTS idx_bill_subscriptions_site_type ON bill_subscriptions(site_type);
CREATE INDEX IF NOT EXISTS idx_bill_subscriptions_pack_id ON bill_subscriptions(pack_id);

-- RLS
ALTER TABLE mod_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_pack_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_site_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_sub_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_global_subs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mod_features_public_read ON mod_features;
CREATE POLICY mod_features_public_read ON mod_features FOR SELECT USING (true);
DROP POLICY IF EXISTS mod_packs_public_read ON mod_packs;
CREATE POLICY mod_packs_public_read ON mod_packs FOR SELECT USING (true);
DROP POLICY IF EXISTS mod_pack_features_public_read ON mod_pack_features;
CREATE POLICY mod_pack_features_public_read ON mod_pack_features FOR SELECT USING (true);
DROP POLICY IF EXISTS mod_site_prices_public_read ON mod_site_prices;
CREATE POLICY mod_site_prices_public_read ON mod_site_prices FOR SELECT USING (true);

DROP POLICY IF EXISTS mod_sub_addons_owner_all ON mod_sub_addons;
CREATE POLICY mod_sub_addons_owner_all ON mod_sub_addons
  FOR ALL USING (subscription_id IN (SELECT id FROM bill_subscriptions WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS mod_global_subs_owner_all ON mod_global_subs;
CREATE POLICY mod_global_subs_owner_all ON mod_global_subs FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS mod_usage_owner_all ON mod_usage;
CREATE POLICY mod_usage_owner_all ON mod_usage FOR ALL USING (user_id = auth.uid());