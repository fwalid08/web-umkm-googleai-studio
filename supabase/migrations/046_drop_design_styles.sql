-- 046_drop_design_styles.sql
-- Hapus total konsep design style. Yang DIGANTI (bukan dihapus):
--   - palet warna -> COLOR_SCHEMES di src/lib/builder/color-schemes.ts (20 skema)
--   - font        -> FONT_CATEGORIES di src/lib/builder/font-categories.ts (56 font)
-- Style selector builder memakai kedua hal itu (StyleSelector.tsx) dan keduanya
-- murni di kode. Yang hilang hanya katalog `DESIGN_STYLES` (10 preset) yang
-- sudah tidak pernah dipakai UI.
-- PRASYARAT: migrasi 039 & 040 sudah diterapkan.
--
-- Idempotent: aman di-run ulang via Dashboard > SQL Editor.

-- ============================================================
-- 1. Drop policy RLS (027 + 028 membuat design_styles_read_active)
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'design_styles') THEN
    EXECUTE (
      SELECT coalesce(
        string_agg(format('DROP POLICY IF EXISTS %I ON design_styles;', policyname), ' '),
        'SELECT 1'
      )
      FROM pg_policies WHERE tablename = 'design_styles'
    );
  END IF;
END $$;

-- ============================================================
-- 2. Drop tabel design_styles
--    Tidak ada FK yang mengarah ke tabel ini (verified: `grep
--    "REFERENCES design_styles"` kosong di seluruh migrasi), jadi
--    CASCADE aman dan hanya menjatuhkan trigger/index miliknya sendiri.
--    Row `senja-dusk` (migrasi 028) hilang bersama tabel.
-- ============================================================
DROP TABLE IF EXISTS design_styles CASCADE;

-- ============================================================
-- 3. Drop RPC legacy yang SELECT w.design_style_id
--
--    PENTING — dilakukan SEBELUM kolom di-drop.
--    fungsi `get_website_by_id`, `get_active_website`, `list_websites`
--    dibuat di 026 & 039 masih membaca `w.design_style_id`. Postgres
--    tidak re-validasi body plpgsql sampai dipanggil, sehingga kalau
--    kolom di-drop duluan, fungsi `SECURITY DEFINER` akan tertinggal di
--    DB yang tidak bisa dipanggil (landmine, bukan crash).
--
--    Ketiganya sudah rusak sejak 040 (`current_template_id` di-drop
--    sementara body-nya masih SELECT kolom itu) dan tidak dipanggil
--    kode mana pun — jadi menghapusnya murni pembersihan.
--
--    Loop `pg_proc` + `pg_get_function_identity_arguments` dipakai agar
--    aman terhadap overload: 026 & 039 sama-sama membuat versi
--    2-argumen, dan `DROP FUNCTION x` tanpa argumen akan error
--    "function name is not unique".
-- ============================================================
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT n.nspname AS schema_name,
           p.proname AS fn_name,
           pg_get_function_identity_arguments(p.oid) AS fn_args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('get_website_by_id', 'get_active_website', 'list_websites')
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE;',
                   r.schema_name, r.fn_name, r.fn_args);
  END LOOP;
END $$;

-- ============================================================
-- 4. Drop kolom design_style_id
--    Kolom VARCHAR biasa (tanpa FK ke design_styles), jadi DROP ini
--    tidak menyentuh tabel lain.
-- ============================================================
ALTER TABLE websites DROP COLUMN IF EXISTS design_style_id;
ALTER TABLE user_templates DROP COLUMN IF EXISTS design_style_id;

-- ============================================================
-- 5. Bersihkan key JSON `design_style_id` dari custom_config
--
--    KUNCI DATA PENTING — jangan diperlebar tanpa proxy.
--    `hasStoredCustomConfig()` (src/lib/builder/website-config.ts)
--    memakai keberadaan key ini sebagai sentinel "website ini sudah
--    dikustomisasi". Menghapus key dari baris yang TIDAK punya sinyal
--    lain akan membuat website itu terbaca "default" dan kanvasnya
--    ter-reset — pratinjau user berubah tanpa diminta.
--
--    Karena itu baris hanya dibersihkan bila `catalog_template_id`
--    terisi: itu selalu ditulis `buildStoredCustomConfig()` (slug
--    katalog non-kosong) sehingga sinyal pengganti sudah pasti ada.
--    Baris lama tanpa `catalog_template_id` sengaja MEMBAWA key
--    legacy-nya sebagai fallback sentinel.
-- ============================================================
UPDATE user_templates
SET custom_config = custom_config - 'design_style_id'
WHERE custom_config ? 'design_style_id'
  AND NULLIF(BTRIM(custom_config ->> 'catalog_template_id'), '') IS NOT NULL;

-- ============================================================
-- 6. Sweep index sisa bila tabel/kolom pernah di-drop tanpa CASCADE
-- ============================================================
DROP INDEX IF EXISTS idx_design_styles_category;