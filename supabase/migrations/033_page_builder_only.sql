-- 033_page_builder_only.sql
-- Page Builder jadi satu-satunya sumber kebenaran homepage.
--
-- Builder Global (/dashboard/builder) dipensiunkan: homepage kini selalu
-- berasal dari baris store_pages dengan is_homepage = true, bukan lagi dari
-- custom_config.sections yang digerakkan mode 'builder'.
--
-- Kolom homepage_type SENGAJA tidak di-drop di migrasi ini supaya perubahan
-- reversible dan tidak merusak situs yang sudah ada. Penurunan kolom dilakukan
-- terpisah setelah perubahan stabil.
--
-- Asumsi: tidak ada pengguna lama Builder Global (semua lewat page-builder).

-- 1) Backfill homepage_page_id dari baris store_pages yang jadi homepage.
--    Idempotent: hanya mengisi yang NULL / belumsinkron.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_name = 'store_pages' AND table_schema = 'public')
  THEN
    UPDATE website_settings ws
       SET homepage_page_id = p.id,
           updated_at = NOW()
      FROM store_pages p
     WHERE p.website_id = ws.website_id
       AND p.is_homepage = true
       AND ws.homepage_page_id IS DISTINCT FROM p.id;
  END IF;
END $$;

-- 2) Normalisasi semua website ke mode 'page' supaya kedua mode lama
--    menghasilkan sumber render yang sama selama transisi.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_name = 'website_settings'
       AND column_name = 'homepage_type'
       AND table_schema = 'public'
  ) THEN
    UPDATE website_settings
       SET homepage_type = 'page',
           updated_at = NOW()
     WHERE homepage_type IS DISTINCT FROM 'page';
  END IF;
END $$;

-- Verifikasi (jalankan manual sebelum & sesudah migrasi):
--   SELECT ws.website_id, ws.homepage_type, ws.homepage_page_id
--     FROM website_settings ws
--    WHERE ws.homepage_type <> 'page' OR ws.homepage_page_id IS NULL;
-- Sisa baris = website tanpa halaman homepage di store_pages; buat manual
-- lewat daftar Halaman lalu jadikan homepage.
