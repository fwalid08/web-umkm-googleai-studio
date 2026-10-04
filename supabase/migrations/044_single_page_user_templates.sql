-- 044_single_page_user_templates.sql
-- Penyederhanaan: website jadi SATU HALAMAN (homepage). Tabel `store_pages`
-- dihapus karena `033_page_builder_only.sql` sudah menjadikannya satu-satunya
-- sumber kebenaran homepage; sekarang posisinya diambil alih `user_templates`.
--
-- Model baru:
--   user_templates.custom_config = satu-satunya sumber isi halaman:
--     - sections (layout homepage, dahulunya store_pages.layout->'sections')
--     - is_published, meta_title, meta_description, og_image_url
--     - header/footer/design_style/palette/seo (sudah ada sebelumnya)
--   website_settings.user_template_id = baris user_templates yang aktif.
--
-- Kolom `homepage_page_id` (dari 022) menunjuk store_pages(id) dan sudah
-- MATI di kode aplikasi (tidak dibaca/tulis siapa pun) -- digantikan
-- user_template_id. Template yang disimpan user tetap di user_templates.
--
-- URUTAN PENTING: rename kolom + lepas FK store_pages HARUS lebih dulu,
-- sebelum DROP TABLE ... CASCADE -- kalau tidak, CASCADE ikut menghapus
-- user_template_id.
--
-- Idempotent: aman di-run ulang via Dashboard > SQL Editor.

-- ============================================================
-- 1. Backfill: pindahkan layout homepage ke user_templates.custom_config
--    (WAJIB sebelum tabel di-drop, kalau tidak semua live site jadi 404)
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'store_pages')
     AND EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'user_templates')
  THEN
    UPDATE user_templates ut
       SET custom_config = COALESCE(ut.custom_config, '{}'::jsonb) || jsonb_build_object(
             'sections',         COALESCE(p.layout -> 'sections', '[]'::jsonb),
             'is_published',     COALESCE(p.is_published, TRUE),
             'meta_title',       p.meta_title,
             'meta_description', p.meta_description,
             'og_image_url',     p.og_image_url
           ),
           updated_at = NOW()
      FROM store_pages p
     WHERE p.website_id = ut.website_id
       AND p.is_homepage = true
       -- Jangan timpa layout yang sudah ada di user_templates: baris itu
       -- bisa saja lebih baru (mis. disimpan builder setelah migrasi 033).
       AND COALESCE(jsonb_array_length(
             CASE WHEN jsonb_typeof(ut.custom_config -> 'sections') = 'array'
                  THEN ut.custom_config -> 'sections' ELSE '[]'::jsonb END), 0) = 0;
  END IF;
END $$;

-- 1b. Website tanpa baris user_templates sama sekali tetap perlu sections
--     homepage-nya, jadi seed baris minimal per website yang punya homepage.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'store_pages')
     AND EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'user_templates')
  THEN
    INSERT INTO user_templates (user_id, website_id, template_slug, custom_config, created_at, updated_at)
    SELECT w.user_id, p.website_id, COALESCE(w.template_slug, 'food'),
           jsonb_build_object(
             'sections',         COALESCE(p.layout -> 'sections', '[]'::jsonb),
             'is_published',     COALESCE(p.is_published, TRUE),
             'meta_title',       p.meta_title,
             'meta_description', p.meta_description,
             'og_image_url',     p.og_image_url
           ),
           NOW(), NOW()
      FROM store_pages p
      JOIN websites w ON w.id = p.website_id
     WHERE p.is_homepage = true
       AND NOT EXISTS (
         SELECT 1 FROM user_templates ut
          WHERE ut.website_id = p.website_id
            AND ut.template_slug = COALESCE(w.template_slug, 'food')
       )
    ON CONFLICT (website_id, template_slug) DO NOTHING;
  END IF;
END $$;

-- ============================================================
-- 2. website_settings.homepage_page_id -> user_template_id
--    (sebelum DROP TABLE, agar CASCADE tidak ikut menghapusnya)
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'website_settings'
               AND column_name = 'homepage_page_id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'website_settings'
               AND column_name = 'user_template_id')
  THEN
    EXECUTE 'ALTER TABLE website_settings RENAME COLUMN homepage_page_id TO user_template_id';
  END IF;
END $$;

-- Lepas FK lama ke store_pages (bila tabelnya masih ada / sudah dangling).
DO $$
DECLARE
  fk_name TEXT;
BEGIN
  FOR fk_name IN
    SELECT c.conname
      FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
     WHERE t.relname = 'website_settings'
       AND c.contype = 'f'
       AND pg_get_constraintdef(c.oid) LIKE '%store_pages%'
  LOOP
    EXECUTE format('ALTER TABLE website_settings DROP CONSTRAINT IF EXISTS %I', fk_name);
  END LOOP;
END $$;

-- 2a. Bersihkan nilai yatim. Kolom lama berisi store_pages(id); setelah
--     di-rename nilainya TIDAK valid lagi sebagai user_templates.id.
--     WAJIB sebelum FK dipasang, kalau tidak ADD CONSTRAINT gagal 23503.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'website_settings'
               AND column_name = 'user_template_id')
     AND EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'user_templates')
  THEN
    UPDATE website_settings ws
       SET user_template_id = NULL
      WHERE ws.user_template_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM user_templates ut WHERE ut.id = ws.user_template_id
        );
  END IF;
END $$;

-- 2b. Backfill penunjuk: website_settings.user_template_id = baris template aktif.
--     Dilakukan SEBELUM FK dipasang supaya nilainya pasti valid.
--     Slug dicocokkan dulu; bila tidak ketemu (mis. websites.template_slug
--     tak ada di user_templates), pakai baris terbaru website tsb agar
--     penunjuk tidak kosong selama baris config-nya memang ada.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'website_settings'
               AND column_name = 'user_template_id')
     AND EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'user_templates')
  THEN
    UPDATE website_settings ws
       SET user_template_id = COALESCE(
             (
               SELECT ut.id FROM websites w
               JOIN user_templates ut
                 ON ut.website_id = w.id
                AND ut.template_slug = COALESCE(w.template_slug, 'food')
               WHERE w.id = ws.website_id
               LIMIT 1
             ),
             (
               SELECT ut.id FROM user_templates ut
               WHERE ut.website_id = ws.website_id
               ORDER BY ut.updated_at DESC
               LIMIT 1
             )
           ),
           updated_at = NOW()
     WHERE EXISTS (
       SELECT 1 FROM user_templates ut WHERE ut.website_id = ws.website_id
     );
  END IF;
END $$;

-- 2c. Pasang FK ke user_templates (idempotent lewat pg_constraint).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'website_settings'
               AND column_name = 'user_template_id')
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint c
         JOIN pg_class t ON t.oid = c.conrelid
        WHERE t.relname = 'website_settings'
          AND c.contype = 'f'
          AND pg_get_constraintdef(c.oid) LIKE '%user_templates%'
     )
  THEN
    ALTER TABLE website_settings
      ADD CONSTRAINT website_settings_user_template_id_fkey
      FOREIGN KEY (user_template_id) REFERENCES user_templates(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================
-- 3. Halaman selain homepage dihapus (produk jadi satu halaman).
--    Dijalankan eksplisit supaya jejak data yang dibuang terlihat jelas.
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'store_pages') THEN
    DELETE FROM store_pages WHERE is_homepage IS DISTINCT FROM true;
  END IF;
END $$;

-- ============================================================
-- 4. Drop policy RLS lalu tabelnya (pola sama seperti 043_drop_bookings)
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'store_pages') THEN
    EXECUTE (
      SELECT coalesce(
        string_agg(format('DROP POLICY IF EXISTS %I ON store_pages;', policyname), ' '),
        'SELECT 1'
      )
      FROM pg_policies WHERE tablename = 'store_pages'
    );
  END IF;
END $$;

-- CASCADE ikut membawa index store_pages + FK website_settings.homepage_page_id
-- (yang di langkah 2 sudah dilepas).
DROP TABLE IF EXISTS store_pages CASCADE;

-- ============================================================
-- 5. Kolom sisa yang tak terpakai lagi.
--    homepage_type ditinggalkan 033_page_builder_only.sql dan tak dibaca kode.
-- ============================================================
ALTER TABLE website_settings DROP COLUMN IF EXISTS homepage_type;

-- Index sisa bila tabel pernah di-drop tanpa CASCADE.
DROP INDEX IF EXISTS idx_store_pages_website;
DROP INDEX IF EXISTS idx_store_pages_homepage;

-- ============================================================
-- Verifikasi (jalankan manual sesudah migrasi):
--   SELECT website_id, user_template_id FROM website_settings
--    WHERE user_template_id IS NULL;              -- expect 0 baris
--   SELECT count(*) FROM user_templates
--    WHERE jsonb_array_length(custom_config->'sections') > 0;  -- expect >= jumlah website
