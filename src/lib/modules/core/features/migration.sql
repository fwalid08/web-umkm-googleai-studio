-- Migration: Core Features (mod_ tables)
-- Feature catalog, packs, pack features, site pricing matrix

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

CREATE TABLE IF NOT EXISTS mod_packs(
  id TEXT PRIMARY KEY,
  site_type TEXT NOT NULL,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS mod_pack_features(
  pack_id TEXT REFERENCES mod_packs(id) ON DELETE CASCADE,
  feature_id TEXT REFERENCES mod_features(id) ON DELETE CASCADE,
  quota INT NULL,
  included_tiers TEXT[] NOT NULL DEFAULT '{}',
  PRIMARY KEY(pack_id, feature_id)
);

CREATE TABLE IF NOT EXISTS mod_site_prices(
  site_type TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('free','starter','growth','enterprise')),
  cycle TEXT NOT NULL CHECK (cycle IN ('monthly','yearly')),
  price INT NOT NULL CHECK (price >= 0),
  PRIMARY KEY(site_type, tier, cycle)
);

CREATE INDEX IF NOT EXISTS idx_mod_features_scope ON mod_features(scope);
CREATE INDEX IF NOT EXISTS idx_mod_features_site_types ON mod_features USING GIN(site_types);
CREATE INDEX IF NOT EXISTS idx_mod_packs_site_type ON mod_packs(site_type);
CREATE INDEX IF NOT EXISTS idx_mod_pack_features_pack ON mod_pack_features(pack_id);
CREATE INDEX IF NOT EXISTS idx_mod_pack_features_feature ON mod_pack_features(feature_id);

ALTER TABLE mod_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_pack_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_site_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY mod_features_public_read ON mod_features FOR SELECT USING (true);
CREATE POLICY mod_packs_public_read ON mod_packs FOR SELECT USING (true);
CREATE POLICY mod_pack_features_public_read ON mod_pack_features FOR SELECT USING (true);
CREATE POLICY mod_site_prices_public_read ON mod_site_prices FOR SELECT USING (true);