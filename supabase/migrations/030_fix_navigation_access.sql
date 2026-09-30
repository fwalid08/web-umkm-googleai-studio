-- 030_fix_navigation_access.sql
-- Perbaiki 500 "Gagal membuat grup" pada POST /api/websites/[id]/navigation.
--
-- Akar masalah 1 (penyebab 500): migrasi 029 mengaktifkan RLS di
-- navigation_groups/navigation_items dengan policy berbasis auth.uid().
-- Aplikasi memakai NextAuth (bukan Supabase Auth), sehingga anon client
-- server selalu punya auth.uid() = NULL dan SEMUA insert/select ditolak RLS.
-- Pola baku proyek (migrasi 026): matikan RLS, otorisasi di API via session
-- NextAuth + fungsi SECURITY DEFINER (requireSite/getActiveWebsite).
--
-- Akar masalah 2 (laten): CONSTRAINT uq_nav_groups_website_key UNIQUE
-- (website_id, key) + semua grup custom di-insert dengan key='custom'
-- berarti maksimal 1 grup custom per website, padahal API mengizinkan 10.
-- Diganti partial unique index agar hanya topnav/footer yang singleton.
--
-- Idempotent: aman di-run ulang via Dashboard > SQL Editor.

-- 1. Matikan RLS (otorisasi ditangani di API route via NextAuth session)
ALTER TABLE navigation_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_items DISABLE ROW LEVEL SECURITY;

-- 2. Longgarkan unique constraint agar banyak grup 'custom' boleh ada,
--    tapi topnav/footer tetap maksimal 1 per website.
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_nav_groups_website_key'
  ) THEN
    ALTER TABLE navigation_groups DROP CONSTRAINT uq_nav_groups_website_key;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'uq_nav_groups_singleton'
  ) THEN
    CREATE UNIQUE INDEX uq_nav_groups_singleton
      ON navigation_groups (website_id, key)
      WHERE key IN ('topnav', 'footer');
  END IF;
END $$;

-- Down (manual bila rollback):
-- ALTER TABLE navigation_groups ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE navigation_items ENABLE ROW LEVEL SECURITY;
-- DROP INDEX IF EXISTS uq_nav_groups_singleton;
-- ALTER TABLE navigation_groups ADD CONSTRAINT uq_nav_groups_website_key UNIQUE (website_id, key);
