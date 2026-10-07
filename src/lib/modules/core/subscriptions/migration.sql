-- Migration: Core Subscriptions (mod_ tables)
-- Website addons, global subscriptions, usage metering

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

CREATE TABLE IF NOT EXISTS mod_usage(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  website_id UUID REFERENCES ws_websites(id) ON DELETE CASCADE,
  feature_id TEXT NOT NULL REFERENCES mod_features(id),
  qty INT NOT NULL DEFAULT 1,
  reference_id TEXT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mod_sub_addons_website ON mod_sub_addons(website_id);
CREATE INDEX IF NOT EXISTS idx_mod_sub_addons_sub ON mod_sub_addons(subscription_id);
CREATE INDEX IF NOT EXISTS idx_mod_sub_addons_feature ON mod_sub_addons(feature_id);
CREATE INDEX IF NOT EXISTS idx_mod_global_subs_user ON mod_global_subs(user_id);
CREATE INDEX IF NOT EXISTS idx_mod_global_subs_feature ON mod_global_subs(feature_id);
CREATE INDEX IF NOT EXISTS idx_mod_usage_lookup ON mod_usage(user_id, website_id, feature_id, created_at);

ALTER TABLE mod_sub_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_global_subs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY mod_sub_addons_owner_all ON mod_sub_addons
  FOR ALL USING (
    subscription_id IN (SELECT id FROM bill_subscriptions WHERE user_id = auth.uid())
  );

CREATE POLICY mod_global_subs_owner_all ON mod_global_subs
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY mod_usage_owner_all ON mod_usage
  FOR ALL USING (user_id = auth.uid());