-- Source for core-template tables.
-- NOTE (2026-10-07): canonical schema is the WIDE library shape reconciled in
-- supabase/migrations/010_reconcile_bld_user_templates.sql (044/045 lineage:
-- user_id, template_slug, base_slug, name, is_library, custom_config).
-- The narrow shape below (template_id/is_active/applied_at) is kept only as a
-- creation fallback for brand-new databases; 010 converges both shapes.

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

CREATE TABLE IF NOT EXISTS bld_user_templates(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  website_id UUID NOT NULL REFERENCES ws_websites(id) ON DELETE CASCADE,
  template_slug TEXT,
  base_slug TEXT,
  name TEXT,
  is_library BOOLEAN NOT NULL DEFAULT FALSE,
  custom_config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(website_id, template_slug)
);

CREATE INDEX IF NOT EXISTS idx_bld_templates_category ON bld_templates(category);
CREATE INDEX IF NOT EXISTS idx_bld_templates_site_types ON bld_templates USING GIN(site_types);
CREATE INDEX IF NOT EXISTS idx_bld_user_templates_website ON bld_user_templates(website_id);
CREATE INDEX IF NOT EXISTS idx_bld_user_templates_library ON bld_user_templates (user_id, is_library, updated_at DESC);

ALTER TABLE bld_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE bld_user_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bld_templates_public_read ON bld_templates;
CREATE POLICY bld_templates_public_read ON bld_templates FOR SELECT USING (true);

DROP POLICY IF EXISTS bld_user_templates_owner_all ON bld_user_templates;
CREATE POLICY bld_user_templates_owner_all ON bld_user_templates
  FOR ALL USING (
    website_id IN (SELECT id FROM ws_websites WHERE user_id = auth.uid())
  );