-- 043_drop_bookings.sql
-- Hapus total tabel bookings (reservasi terjadwal dari section `booking`).
-- Alasan: fitur booking dihapus dari produk — section builder, API
-- /api/bookings, halaman /dashboard/bookings, dan notif WA sudah dihapus.
--
-- Tabel ini punya FK website_id → websites(id) ON DELETE CASCADE, jadi
-- DROP TABLE aman dan tidak menyentuh tabel lain. Idempotent: aman di-run
-- ulang via Dashboard > SQL Editor.

-- ============================================================
-- 1. Drop policy RLS (031 membuat 3 policy owner-only)
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'bookings') THEN
    EXECUTE (
      SELECT coalesce(
        string_agg(format('DROP POLICY IF EXISTS %I ON bookings;', policyname), ' '),
        'SELECT 1'
      )
      FROM pg_policies WHERE tablename = 'bookings'
    );
  END IF;
END $$;

-- ============================================================
-- 2. Drop tabel (CASCADE gugurkan trigger update_bookings_updated_at
--    dan index idx_bookings_website_id / idx_bookings_website_date)
-- ============================================================
DROP TABLE IF EXISTS bookings CASCADE;

-- ============================================================
-- 3. Bersihkan index sisa bila tabel pernah di-drop tanpa CASCADE
-- ============================================================
DROP INDEX IF EXISTS idx_bookings_website_id;
DROP INDEX IF EXISTS idx_bookings_website_date;
