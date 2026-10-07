-- 014_plans_rls.sql
-- N6: RLS untuk tabel plans (katalog read-only publik).
-- Sebelumnya 006 membuat plans TANPA RLS (default-deny belum aktif).
-- Prinsip: katalog harga boleh dibaca anon + authenticated (SELECT saja).
-- TANPA policy INSERT/UPDATE/DELETE -> tulis hanya via service-role di server.
-- Idempoten: aman di-run ulang via Dashboard > SQL Editor.
-- Prasyarat: jalankan 001..012 berurutan sebelum file ini di prod.

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS plans_catalog_read ON plans;
CREATE POLICY plans_catalog_read ON plans
  FOR SELECT TO anon, authenticated
  USING (true);
-- Sengaja TIDAK ada policy FOR INSERT/UPDATE/DELETE:
-- perubahan plans hanya via service-role (migration / admin server-side).

-- Checklist verifikasi manual (SQL Editor):
-- 1. Sebagai anon: SELECT slug, price_monthly FROM plans -> 4 baris (free/starter/growth/enterprise).
-- 2. Sebagai authenticated: SELECT * FROM plans -> sama, read-only.
-- 3. Sebagai authenticated: INSERT INTO plans (slug, name) VALUES ('x','X') -> ditolak (no INSERT policy).
-- 4. Service-role: semua operasi tetap lolos (bypass RLS otomatis).

-- Down (rollback ke pre-014, katalog kembali tanpa RLS):
-- DROP POLICY IF EXISTS plans_catalog_read ON plans;
-- ALTER TABLE plans DISABLE ROW LEVEL SECURITY;
