-- 028_insert_design_style_senja.sql
-- Daftarkan design style "Senja Dusk" (adaptasi landing Kopi Senja) ke DB.
-- Dipakai template bawaan kopi-senja (designStyleId 'senja-dusk').
--
-- Memakai UPSERT (bukan DO NOTHING seperti 024) agar migrasi self-healing:
-- dijalankan ulang pun palet ikut tersinkron dengan kode.
--
-- Cara jalan: paste ke Supabase Dashboard > SQL Editor (lihat README # Database Setup).
-- Idempotent: ON CONFLICT DO UPDATE → aman diulang.

INSERT INTO design_styles (id, name, description, palette, typography, components, effects, thumbnail_url)
VALUES (
  'senja-dusk',
  'Senja Dusk',
  'Hangat senja kopi: dusk plum, aksen amber, serif Fraunces',
  '{"primary":"#E9805A","secondary":"#B4506A","accent":"#F2A65A","background":"#24121B","surface":"#4A2233","text":"#FFF1DC","textMuted":"#D9BBA9","border":"rgba(255,241,220,0.2)"}',
  '{"headingFont":"Fraunces","bodyFont":"Manrope","baseSize":16,"scaleRatio":1.25,"headingWeight":500,"bodyWeight":400}',
  '{"borderRadius":16,"buttonStyle":"solid","shadowStyle":"lg","navStyle":"transparent","footerStyle":"simple"}',
  '{}',
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  palette = EXCLUDED.palette,
  typography = EXCLUDED.typography,
  components = EXCLUDED.components,
  effects = EXCLUDED.effects;

-- RLS mengikuti 027 (tabel referensi publik, baca untuk authenticated aktif).
ALTER TABLE design_styles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS design_styles_read_active ON design_styles;
CREATE POLICY design_styles_read_active ON design_styles
  FOR SELECT TO authenticated
  USING (is_active = true);
