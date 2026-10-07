-- 040_drop_templates_library.sql
-- Hapus total katalog template di DB. PRASYARAT:
-- - migrasi 039 sudah diterapkan (kolom template_slug + backfill 'food'),
-- - kode sudah membaca katalog statis (BUILT_IN_CATALOG) dan menulis
--   template_slug (tidak lagi menyentuh templates_library).
--
-- Setelah ini tidak ada lagi tabel template di database:
-- `templates` di-drop di 036, `templates_library` di-drop di sini.

-- ============================================================
-- 1. Drop policy eksplisit (trigger + index ikut CASCADE)
-- ============================================================
DROP POLICY IF EXISTS "Templates library access" ON templates_library;
DROP POLICY IF EXISTS "Users manage own templates" ON templates_library;

-- ============================================================
-- 2. Drop tabel (menggugurkan FK user_templates.template_library_id)
-- ============================================================
DROP TABLE IF EXISTS templates_library CASCADE;

-- ============================================================
-- 3. Drop kolom UUID lama (digantikan template_slug di 039)
-- ============================================================
ALTER TABLE user_templates DROP COLUMN IF EXISTS template_library_id;
ALTER TABLE user_templates DROP COLUMN IF EXISTS template_id;
ALTER TABLE websites DROP COLUMN IF EXISTS current_template_id;

-- ============================================================
-- 4. Drop RPC template berbasis UUID yang tak lagi dipakai kode.
-- (get_website_by_id/get_active_website/list_websites dipertahankan —
--  diperbarui di 039 untuk mengembalikan template_slug.)
-- ============================================================
DROP FUNCTION IF EXISTS public.upsert_user_template(UUID, UUID, UUID, JSONB);
DROP FUNCTION IF EXISTS public.get_user_template(UUID, UUID);
DROP FUNCTION IF EXISTS public.update_website_template(UUID, UUID, UUID);
