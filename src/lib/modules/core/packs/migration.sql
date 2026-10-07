-- Migration: Core Packs (mod_ tables)
-- Pack definitions per site_type

CREATE TABLE IF NOT EXISTS mod_pack_tiers(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id TEXT NOT NULL REFERENCES mod_packs(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('free','starter','growth','enterprise')),
  price_monthly INT NOT NULL DEFAULT 0,
  price_yearly INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pack_id, tier)
);

CREATE INDEX IF NOT EXISTS idx_mod_pack_tiers_pack ON mod_pack_tiers(pack_id);

ALTER TABLE mod_pack_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY mod_pack_tiers_public_read ON mod_pack_tiers FOR SELECT USING (true);