-- 027_sync_design_style_contrast.sql
-- Sinkronkan seed 024_design_styles dengan palet yang sudah diperbaiki
-- kontrasnya di kode (src/lib/builder/design-styles.ts, WCAG AA ≥ 4.5:1).
--
-- Latar: INSERT 024 memakai ON CONFLICT (id) DO NOTHING, sehingga database
-- yang sudah menjalankan 024 tetap menyimpan warna lama yang tidak terbaca
-- (retro muted 1.57:1, organic muted 2.35:1, dst). Migrasi ini menambalnya
-- via UPDATE + sekalian mengaktifkan RLS read-only untuk tabel publik ini.
--
-- Cara jalan: paste ke Supabase Dashboard > SQL Editor (lihat README # Database Setup).
-- Idempotent: UPDATE murni + guard IF EXISTS / DROP IF EXISTS → aman diulang.
--
-- Rollback (destruktif: kembalikan warna lama — hanya bila perlu):
--   UPDATE design_styles SET palette = palette || '{"textMuted":"#7f8c8d"}'::jsonb WHERE id = 'flat';
--   UPDATE design_styles SET palette = palette || '{"textMuted":"#52b788"}'::jsonb WHERE id = 'organic';
--   UPDATE design_styles SET palette = palette || '{"textMuted":"#81b29a"}'::jsonb WHERE id = 'retro';
--   UPDATE design_styles SET palette = palette || '{"background":"linear-gradient(135deg, #667eea 0%, #764ba2 100%)","textMuted":"rgba(255,255,255,0.7)"}'::jsonb WHERE id = 'glassmorphism';
--   UPDATE design_styles SET palette = palette || '{"background":"linear-gradient(180deg, #667eea 0%, #764ba2 100%)","textMuted":"rgba(255,255,255,0.8)"}'::jsonb WHERE id = 'parallax';

-- ============ 1. Perbaiki textMuted yang terlalu terang (hampir sama dengan background) ============
-- flat: #7f8c8d (3.48:1) → #5d6d7e (5.31:1 di atas putih)
UPDATE design_styles
SET palette = palette || '{"textMuted":"#5d6d7e"}'::jsonb
WHERE id = 'flat';

-- organic: #52b788 (2.35:1) → #2f7d4f (4.78:1)
UPDATE design_styles
SET palette = palette || '{"textMuted":"#2f7d4f"}'::jsonb
WHERE id = 'organic';

-- retro: #81b29a (2.11:1 di bg, 1.57:1 di surface) → #4a5d4e (6.23:1 / 4.65:1)
UPDATE design_styles
SET palette = palette || '{"textMuted":"#4a5d4e"}'::jsonb
WHERE id = 'retro';

-- ============ 2. Gelapkan gradient + naikkan opacity muted (gaya kaca) ============
-- glassmorphism: teks putih ~2.6:1 → ~6.9:1 (nuansa ungu tetap terjaga)
UPDATE design_styles
SET palette = palette || '{"background":"linear-gradient(135deg, #4653a3 0%, #553c9a 100%)","textMuted":"rgba(255,255,255,0.9)"}'::jsonb
WHERE id = 'glassmorphism';

-- parallax: teks putih ~2.6:1 → ~8.1:1
UPDATE design_styles
SET palette = palette || '{"background":"linear-gradient(180deg, #3d3a8c 0%, #6b46c1 100%)","textMuted":"rgba(255,255,255,0.9)"}'::jsonb
WHERE id = 'parallax';

-- ============ 3. RLS read-only (tabel referensi publik, mengikuti gaya 011) ============
ALTER TABLE design_styles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS design_styles_read_active ON design_styles;
CREATE POLICY design_styles_read_active ON design_styles
  FOR SELECT TO authenticated
  USING (is_active = true);
