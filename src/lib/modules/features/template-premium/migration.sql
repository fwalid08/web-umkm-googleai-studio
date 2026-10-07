-- Migration: Template Premium (bld_ tables)
-- Premium template tier gating

CREATE TABLE IF NOT EXISTS bld_template_tiers(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id TEXT NOT NULL REFERENCES bld_templates(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('free','starter','growth','enterprise')),
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(template_id, tier)
);

CREATE INDEX IF NOT EXISTS idx_bld_template_tiers_template ON bld_template_tiers(template_id);

ALTER TABLE bld_template_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY bld_template_tiers_public_read ON bld_template_tiers FOR SELECT USING (true);