-- Migration 010: Reconcile bld_user_templates to library schema (fix 500 on PUT website)
-- Root cause: 050 created a narrow schema (id, website_id, template_id, is_active,
-- applied_at) while app code (044/045 lineage) needs the wide library schema
-- (user_id, website_id, template_slug, base_slug, name, is_library, custom_config).
-- This restores the wide columns + UNIQUE(website_id, template_slug) required by
-- onConflict upserts in PUT /api/websites/[id]/website, and drops the dead
-- narrow-only columns nothing reads (template_id, is_active, applied_at).

-- 0. Drop compat view first (SELECT * views depend on every column and block DROPs).
--    Recreated in step 6 with the fresh column list.
DROP VIEW IF EXISTS user_templates;

-- 1. Add wide library columns (nullable first for existing rows)
ALTER TABLE bld_user_templates
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS template_slug TEXT,
  ADD COLUMN IF NOT EXISTS base_slug TEXT,
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS is_library BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS custom_config JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Backfill slug from narrow template_id before dropping it
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bld_user_templates' AND column_name = 'template_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bld_user_templates' AND column_name = 'template_slug') THEN
    UPDATE bld_user_templates SET template_slug = template_id WHERE template_slug IS NULL AND template_id IS NOT NULL;
  END IF;
END $$;

-- 3. Drop dead narrow-only columns (nothing in app code reads them)
ALTER TABLE bld_user_templates DROP COLUMN IF EXISTS template_id;
ALTER TABLE bld_user_templates DROP COLUMN IF EXISTS is_active;
ALTER TABLE bld_user_templates DROP COLUMN IF EXISTS applied_at;

-- 4. UNIQUE required by .upsert(..., { onConflict: "website_id,template_slug" })
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bld_user_templates_website_id_template_slug_key') THEN
    ALTER TABLE bld_user_templates ADD CONSTRAINT bld_user_templates_website_id_template_slug_key UNIQUE (website_id, template_slug);
  END IF;
END $$;

-- 5. Index from 045 (library queries filter user_id + is_library, order updated_at DESC)
CREATE INDEX IF NOT EXISTS idx_bld_user_templates_library ON bld_user_templates (user_id, is_library, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_bld_user_templates_template ON bld_user_templates (template_slug);

-- 6. Recreate compat view (SELECT * views do NOT pick up new columns automatically)
DROP VIEW IF EXISTS user_templates;
DO $$
BEGIN
  IF to_regclass('public.bld_user_templates') IS NOT NULL THEN
    CREATE VIEW user_templates AS SELECT * FROM bld_user_templates;
  END IF;
END $$;

-- 7. Refresh RLS policy (idempotent)
DROP POLICY IF EXISTS bld_user_templates_owner_all ON bld_user_templates;
CREATE POLICY bld_user_templates_owner_all ON bld_user_templates
  FOR ALL USING (
    website_id IN (SELECT id FROM ws_websites WHERE user_id = auth.uid())
  );