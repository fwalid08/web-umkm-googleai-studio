-- 029_customize_foundation.sql
-- Fondasi /dashboard/websites/customize: homepage unik, grup navigasi + submenu, kategori template builtin.
-- Idempotent: aman di-run ulang via Dashboard > SQL Editor.

-- 1. Homepage unik per website (satu homepage saja)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'uq_store_pages_homepage_unique') THEN
    -- Bersihkan duplikat dulu: sisakan 1 homepage per website (yang paling lama)
    WITH ranked AS (
      SELECT id, website_id,
             ROW_NUMBER() OVER (PARTITION BY website_id ORDER BY created_at ASC) AS rn
      FROM store_pages WHERE is_homepage = TRUE
    )
    UPDATE store_pages sp
    SET is_homepage = FALSE
    FROM ranked r
    WHERE sp.id = r.id AND r.rn > 1;

    CREATE UNIQUE INDEX uq_store_pages_homepage_unique
      ON store_pages (website_id) WHERE is_homepage = TRUE;
  END IF;
END $$;

-- 2. Grup navigasi (topnav / footer / custom)
CREATE TABLE IF NOT EXISTS navigation_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  key VARCHAR(30) NOT NULL DEFAULT 'custom' CHECK (key IN ('topnav', 'footer', 'custom')),
  title VARCHAR(100) NOT NULL DEFAULT 'Menu',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_nav_groups_website_key UNIQUE (website_id, key)
);

CREATE INDEX IF NOT EXISTS idx_nav_groups_website ON navigation_groups(website_id);

-- 3. Item navigasi (mendukung submenu 1 level via parent_id)
CREATE TABLE IF NOT EXISTS navigation_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES navigation_groups(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES navigation_items(id) ON DELETE CASCADE,
  label VARCHAR(100) NOT NULL,
  url VARCHAR(500) NOT NULL DEFAULT '/',
  page_id UUID REFERENCES store_pages(id) ON DELETE SET NULL,
  open_in_new_tab BOOLEAN NOT NULL DEFAULT FALSE,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Submenu tidak boleh punya cucu: dicek di API (max depth 1). DB cegah self-parent.
  CONSTRAINT chk_nav_no_self_parent CHECK (parent_id IS NULL OR parent_id <> id)
);

CREATE INDEX IF NOT EXISTS idx_nav_items_group ON navigation_items(group_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_nav_items_parent ON navigation_items(parent_id, sort_order);

-- 4. RLS
ALTER TABLE navigation_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='navigation_groups' AND policyname='Users manage own navigation groups') THEN
    CREATE POLICY "Users manage own navigation groups" ON navigation_groups
      FOR ALL USING (
        EXISTS (SELECT 1 FROM websites w WHERE w.id = navigation_groups.website_id AND w.user_id = auth.uid())
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='navigation_items' AND policyname='Users manage own navigation items') THEN
    CREATE POLICY "Users manage own navigation items" ON navigation_items
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM navigation_groups g
          JOIN websites w ON w.id = g.website_id
          WHERE g.id = navigation_items.group_id AND w.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- 5. Trigger updated_at
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_navigation_groups_updated_at') THEN
    CREATE TRIGGER update_navigation_groups_updated_at BEFORE UPDATE ON navigation_groups
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_navigation_items_updated_at') THEN
    CREATE TRIGGER update_navigation_items_updated_at BEFORE UPDATE ON navigation_items
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- 6. Kategori template builtin (kolom baru di templates lama; data builtin tetap di kode src/lib/builder/templates/*)
ALTER TABLE templates ADD COLUMN IF NOT EXISTS category VARCHAR(20) DEFAULT 'retail' CHECK (category IN ('food','fashion','retail','handicraft','services'));
ALTER TABLE templates ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR(500);
ALTER TABLE templates ADD COLUMN IF NOT EXISTS template_data JSONB DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category) WHERE is_active = TRUE;

-- 7. Backfill: grup topnav + footer untuk website yang sudah ada
INSERT INTO navigation_groups (website_id, key, title, sort_order)
SELECT w.id, 'topnav', 'Menu Utama (Topnav)', 0
FROM websites w
WHERE NOT EXISTS (SELECT 1 FROM navigation_groups g WHERE g.website_id = w.id AND g.key = 'topnav');

INSERT INTO navigation_groups (website_id, key, title, sort_order)
SELECT w.id, 'footer', 'Footer', 1
FROM websites w
WHERE NOT EXISTS (SELECT 1 FROM navigation_groups g WHERE g.website_id = w.id AND g.key = 'footer');

-- Down (komentar saja, destruktif — jalankan manual bila rollback):
-- DROP TABLE IF EXISTS navigation_items;
-- DROP TABLE IF EXISTS navigation_groups;
-- DROP INDEX IF EXISTS uq_store_pages_homepage_unique;
-- ALTER TABLE templates DROP COLUMN IF EXISTS template_data;
-- ALTER TABLE templates DROP COLUMN IF EXISTS thumbnail_url;
-- ALTER TABLE templates DROP COLUMN IF EXISTS category;
