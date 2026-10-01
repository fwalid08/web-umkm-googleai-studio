-- Template assets, animations, and behaviours support
ALTER TABLE templates_library ADD COLUMN IF NOT EXISTS assets JSONB DEFAULT '[]'::jsonb;
ALTER TABLE templates_library ADD COLUMN IF NOT EXISTS animations JSONB DEFAULT '[]'::jsonb;
ALTER TABLE templates_library ADD COLUMN IF NOT EXISTS behaviours JSONB DEFAULT '[]'::jsonb;

-- Index for asset lookups
CREATE INDEX IF NOT EXISTS idx_templates_library_assets ON templates_library USING GIN (assets);
CREATE INDEX IF NOT EXISTS idx_templates_library_animations ON templates_library USING GIN (animations);
CREATE INDEX IF NOT EXISTS idx_templates_library_behaviours ON templates_library USING GIN (behaviours);
