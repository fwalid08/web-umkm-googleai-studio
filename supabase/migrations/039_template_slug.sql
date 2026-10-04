-- 039_template_slug.sql
-- Template statis di kode (slug) menggantikan referensi UUID ke tabel katalog.
-- Kolom UUID lama (websites.current_template_id, user_templates.template_id)
-- dipertahankan sementara untuk baca-kompatibel; di-drop di migrasi 040
-- bersama tabel templates_library.

-- ============================================================
-- 1. Kolom slug berdampingan
-- ============================================================
ALTER TABLE user_templates ADD COLUMN IF NOT EXISTS template_slug TEXT;
ALTER TABLE websites ADD COLUMN IF NOT EXISTS template_slug TEXT;

-- ============================================================
-- 2. Dedup user_templates: satu baris per website (pertahankan terbaru).
-- Tanpa ini constraint unik di bawah gagal pada data lama yang menumpuk
-- (upsert onConflict website_id,template_id tidak pernah conflict pada NULL).
-- ============================================================
DELETE FROM user_templates a USING user_templates b
WHERE a.website_id IS NOT DISTINCT FROM b.website_id
  AND (a.updated_at < b.updated_at
    OR (a.updated_at = b.updated_at AND a.ctid < b.ctid));

-- ============================================================
-- 3. Backfill slug: satu-satunya katalog adalah 'food'.
-- ============================================================
UPDATE user_templates SET template_slug = 'food' WHERE template_slug IS NULL;
UPDATE websites SET template_slug = 'food' WHERE template_slug IS NULL;

-- ============================================================
-- 4. Satu baris per (website, slug) ke depan + index
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_user_templates_website_slug') THEN
    ALTER TABLE user_templates
      ADD CONSTRAINT uq_user_templates_website_slug UNIQUE (website_id, template_slug);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_templates_slug ON user_templates (website_id, template_slug);
CREATE INDEX IF NOT EXISTS idx_websites_template_slug ON websites (template_slug);

-- ============================================================
-- 5. RPC ikut mengembalikan template_slug (daftar kolom eksplisit).
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_website_by_id(p_website_id UUID, p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  name VARCHAR,
  subdomain VARCHAR,
  business_type VARCHAR,
  current_template_id UUID,
  template_slug TEXT,
  design_style_id VARCHAR,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT w.id, w.user_id, w.name, w.subdomain, w.business_type,
         w.current_template_id, w.template_slug, w.design_style_id, w.created_at, w.updated_at
  FROM websites w
  WHERE w.id = p_website_id AND w.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_active_website(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  name VARCHAR,
  subdomain VARCHAR,
  business_type VARCHAR,
  current_template_id UUID,
  template_slug TEXT,
  design_style_id VARCHAR,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT w.id, w.user_id, w.name, w.subdomain, w.business_type,
         w.current_template_id, w.template_slug, w.design_style_id, w.created_at, w.updated_at
  FROM websites w
  WHERE w.user_id = p_user_id
  ORDER BY w.created_at ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.list_websites(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  name VARCHAR,
  subdomain VARCHAR,
  business_type VARCHAR,
  current_template_id UUID,
  template_slug TEXT,
  design_style_id VARCHAR,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT w.id, w.user_id, w.name, w.subdomain, w.business_type,
         w.current_template_id, w.template_slug, w.design_style_id, w.created_at, w.updated_at
  FROM websites w
  WHERE w.user_id = p_user_id
  ORDER BY w.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
