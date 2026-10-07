-- Migration: Entitlements system (no new tables - logic only)
-- The entitlements engine uses existing tables:
-- - mod_features (feature catalog)
-- - mod_packs + mod_pack_features (pack definitions)
-- - mod_site_prices (pricing matrix)
-- - subscriptions (tier, site_type, pack_id)
-- - mod_sub_addons (website-scoped addons)
-- - mod_global_subs (global modules)
-- - mod_usage (metering)

-- This file documents the tables used by entitlements engine.
-- Actual tables created in mod_features, mod_packs, mod_subscriptions migrations.

-- Indexes for entitlement queries:
CREATE INDEX IF NOT EXISTS idx_mod_sub_addons_website_feature ON mod_sub_addons(website_id, feature_id);
CREATE INDEX IF NOT EXISTS idx_mod_global_subs_user_feature ON mod_global_subs(user_id, feature_id);
CREATE INDEX IF NOT EXISTS idx_mod_usage_website_feature_time ON mod_usage(website_id, feature_id, created_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_site_type ON subscriptions(user_id, site_type);

-- RLS policies for entitlement tables:
-- mod_features: public read (active features)
-- mod_packs: public read
-- mod_pack_features: public read
-- mod_site_prices: public read
-- mod_sub_addons: owner read/write (via subscription -> user)
-- mod_global_subs: owner read/write (user_id)
-- mod_usage: owner read/write (user_id)