-- 045_user_template_library.sql
-- Library template user: "Simpan sebagai Template" dari builder.
--
-- Latar belakang
-- --------------
-- Builder single-page (lihat 044) menyimpan hasil edit ke `user_templates`,
-- TAPI selalu menimpa SATU baris per website dengan `onConflict:
-- (website_id, template_slug)`. Artinya tidak ada cara menyimpan desain
-- sebagai aset yang bisa dipilih ulang — user hanya punya "desain sekarang".
--
-- Sebaliknya `TemplateGallery` hanya menampilkan `BUILT_IN_CATALOG` (katalog
-- statis di kode); tabel `templates_library` sudah di-drop di 040. Jadi
-- "template saya" tidak pernah tampil sebagai daftar.
--
-- Model baru
-- ----------
-- `user_templates` tetap satu tabel, dipisah lewat kolom `is_library`:
--
--   is_library = false  → template AKTIF website (baris "hot", satu per
--                          website per slug). Perilaku lama, tidak berubah.
--   is_library = true   → salinan desain yang disimpan user lewat
--                          "Simpan sebagai Template". Boleh banyak.
--
-- KEPUTUSAN PENTING: template_slug
-- -------------------------------
-- Baris library memakai slug sintetis `saved-<uuid>`, BUKAN slug katalog
-- ('food' dst). Alasannya constraint `uq_user_templates_website_slug`
-- UNIQUE (website_id, template_slug) yang dibuat di 039. Kalau baris library
-- memakai slug katalog yang sama, setiap "Simpan sebagai Template" berikutnya
-- akan bentrok dengan baris sebelumnya dan menimpa-nya.
--
-- Dengan slug `saved-<uuid>`:
--   - constraint yang ada tetap berlaku tanpa perlu dibongkar/diubah,
--   - keunikan dijamin oleh uuid (tidak perlu kolom/constraint tambahan),
--   - slug katalog tetap berarti "template katalog", sehingga lookup
--     `resolveTemplateId()` / validasi BUILT_IN_CATALOG tidak pernah tersesat
--     oleh baris library.
--
-- Kolom `base_slug` menyimpan slug katalog asal, dipakai saat apply supaya
-- variant/header/footer/base theme tetap bisa diambil dari katalog.
--
-- RLS
-- ---
-- TIDAK menambah policy baru. `026_fix_rls_nextauth.sql` sudah menjalankan
-- `ALTER TABLE user_templates DISABLE ROW LEVEL SECURITY`, jadi seluruh
-- pembatasan akses dilakukan di aplikasi (`.eq("user_id", sessionUser.id)`).
-- Menambah policy di sini tidak akan berefek — dan menyalakan RLS kembali
-- tanpa policy lengkap berisiko memutus alur yang sekarang jalan.
--
-- Idempotent: aman di-run ulang via Dashboard > SQL Editor.

-- ============================================================
-- 1. Kolom baru
-- ============================================================
-- `name`      : label yang tampil di daftar library.
-- `is_library : penanda baris library vs baris template aktif.
-- `base_slug` : slug katalog asal (untuk apply nanti).
ALTER TABLE user_templates
  ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE user_templates
  ADD COLUMN IF NOT EXISTS is_library BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE user_templates
  ADD COLUMN IF NOT EXISTS base_slug TEXT;

-- ============================================================
-- 2. Backfill baris lama
-- ============================================================
-- Baris yang sudah ada adalah template aktif website (is_library default
-- FALSE, jadi tidak perlu diubah). `base_slug` diisi dari template_slug
-- bila slug itu memang slug katalog — saat ini semua slug aktif 'food'.
-- NULL base_slug aman: apply akan jatuh ke template katalog pertama.
UPDATE user_templates
   SET base_slug = template_slug
 WHERE is_library = FALSE
   AND base_slug IS NULL
   AND template_slug IS NOT NULL
   AND template_slug NOT LIKE 'saved-%';

-- ============================================================
-- 3. Index untuk daftar library
-- ============================================================
-- Query library: filter user_id + is_library, urut updated_at DESC.
CREATE INDEX IF NOT EXISTS idx_user_templates_library
  ON user_templates (user_id, is_library, updated_at DESC);

-- ============================================================
-- Verifikasi (jalankan manual sesudah migrasi):
--   SELECT column_name, data_type FROM information_schema.columns
--    WHERE table_name = 'user_templates'
--      AND column_name IN ('name', 'is_library', 'base_slug');
--   -- expect 3 baris
--
--   SELECT count(*) FROM user_templates WHERE is_library;
--   -- expect 0 (belum ada yang disimpan lewat "Simpan sebagai Template")
--
--   -- setelah user menyimpan template pertama:
--   SELECT name, template_slug, base_slug FROM user_templates
--    WHERE is_library ORDER BY updated_at DESC;