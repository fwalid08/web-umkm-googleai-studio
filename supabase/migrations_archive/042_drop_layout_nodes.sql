-- 042_drop_layout_nodes.sql
-- Hapus total tabel layout_nodes (row/column/widget builder dari 022).
-- Alasan: tidak pernah dipakai kode mana pun — grep src/ dan app/api/
-- untuk layout_nodes|widget_config|column_width = 0 hasil. Layout berjalan
-- memakai kolom JSONB store_pages.layout ({ sections: Section[] }),
-- dirender via src/lib/builder/public.ts.
--
-- Tabel ini hanya punya FK self-ref parent_id, jadi CASCADE aman dan tidak
-- menyentuh tabel lain. Idempotent: aman di-run ulang via Dashboard > SQL Editor.

-- ============================================================
-- 1. Drop policy eksplisit bila ada (022 hanya ENABLE RLS tanpa policy)
-- ============================================================
-- Tidak ada policy bernama untuk layout_nodes di 022 maupun migrasi lain,
-- jadi langsung ke DROP TABLE. Baris berikut menjaga idempotensi bila
-- policy sempat dibuat manual di environment tertentu:
-- (dibungkus DO agar tidak error bila tabel sudah hilang)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'layout_nodes') THEN
    -- Drop semua policy yang menempel di tabel ini secara dinamis
    -- (alternatif aman dari DROP POLICY satu-per-satu tanpa nama pasti).
    EXECUTE (
      SELECT coalesce(
        string_agg(format('DROP POLICY IF EXISTS %I ON layout_nodes;', policyname), ' '),
        'SELECT 1'
      )
      FROM pg_policies WHERE tablename = 'layout_nodes'
    );
  END IF;
END $$;

-- ============================================================
-- 2. Drop tabel (CASCADE gugurkan FK self-ref parent_id,
--    trigger update_layout_nodes_updated_at, dan index sisa)
-- ============================================================
DROP TABLE IF EXISTS layout_nodes CASCADE;

-- ============================================================
-- 3. Bersihkan index sisa bila tabel pernah di-drop tanpa CASCADE
-- ============================================================
DROP INDEX IF EXISTS idx_layout_nodes_parent;
DROP INDEX IF EXISTS idx_layout_nodes_sort;
