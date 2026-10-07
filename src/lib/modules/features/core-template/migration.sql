-- Migration: Core Template (bld_ tables)
-- Built-in templates & user template assignments

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

-- Drop and recreate bld_user_templates to ensure correct schema
-- (table may exist from older schema without template_id column)
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

CREATE INDEX IF NOT EXISTS idx_bld_templates_category ON bld_templates(category);
CREATE INDEX IF NOT EXISTS idx_bld_templates_site_types ON bld_templates USING GIN(site_types);
CREATE INDEX IF NOT EXISTS idx_bld_user_templates_website ON bld_user_templates(website_id);
CREATE INDEX IF NOT EXISTS idx_bld_user_templates_template ON bld_user_templates(template_id);

ALTER TABLE bld_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE bld_user_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY bld_templates_public_read ON bld_templates FOR SELECT USING (true);

CREATE POLICY bld_user_templates_owner_all ON bld_user_templates
  FOR ALL USING (
    website_id IN (SELECT id FROM ws_websites WHERE user_id = auth.uid())
  );