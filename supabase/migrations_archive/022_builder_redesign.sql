-- 022_builder_redesign.sql
-- Full-page row/column builder: layout_nodes, store_pages, templates_library

-- 1. Layout Nodes table (nested row/column/widget structure)
CREATE TABLE IF NOT EXISTS layout_nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID REFERENCES layout_nodes(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('row', 'column', 'widget')),
  column_width INTEGER CHECK (column_width BETWEEN 1 AND 12),
  column_offset INTEGER CHECK (column_offset BETWEEN 0 AND 11),
  widget_type VARCHAR(50),
  widget_config JSONB DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_layout_nodes_parent ON layout_nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_layout_nodes_sort ON layout_nodes(parent_id, sort_order);

-- 2. Store Pages table (upgrade dari localStorage ke DB)
CREATE TABLE IF NOT EXISTS store_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL,
  type VARCHAR(20) DEFAULT 'custom' CHECK (type IN ('custom', 'about', 'contact', 'faq', 'terms', 'privacy')),
  is_published BOOLEAN DEFAULT TRUE,
  is_homepage BOOLEAN DEFAULT FALSE,
  layout JSONB DEFAULT '{}',
  meta_title VARCHAR(100),
  meta_description VARCHAR(300),
  og_image_url VARCHAR(500),
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_store_pages_website_slug UNIQUE (website_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_store_pages_website ON store_pages(website_id);
CREATE INDEX IF NOT EXISTS idx_store_pages_homepage ON store_pages(website_id) WHERE is_homepage = TRUE;

-- 3. Templates Library table (save/export/import)
CREATE TABLE IF NOT EXISTS templates_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  website_id UUID REFERENCES websites(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  thumbnail_url VARCHAR(500),
  template_data JSONB NOT NULL,
  scope VARCHAR(10) DEFAULT 'user' CHECK (scope IN ('user', 'public')),
  imported_from UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_templates_library_user ON templates_library(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_library_website ON templates_library(website_id);

-- 4. Add homepage settings to website_settings
ALTER TABLE website_settings ADD COLUMN IF NOT EXISTS homepage_type VARCHAR(20) DEFAULT 'builder' CHECK (homepage_type IN ('builder', 'page'));
ALTER TABLE website_settings ADD COLUMN IF NOT EXISTS homepage_page_id UUID REFERENCES store_pages(id) ON DELETE SET NULL;

-- 5. RLS Policies

-- layout_nodes: no direct user access, managed via API with service role
ALTER TABLE layout_nodes ENABLE ROW LEVEL SECURITY;

-- store_pages: users manage own website pages
ALTER TABLE store_pages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='store_pages' AND policyname='Users manage own store pages') THEN
    CREATE POLICY "Users manage own store pages" ON store_pages
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM websites w
          WHERE w.id = store_pages.website_id
          AND w.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- templates_library: users manage own templates
ALTER TABLE templates_library ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='templates_library' AND policyname='Users manage own templates') THEN
    CREATE POLICY "Users manage own templates" ON templates_library
      FOR ALL USING (
        user_id = auth.uid() OR scope = 'public'
      );
  END IF;
END $$;

-- 6. Triggers for updated_at
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_layout_nodes_updated_at') THEN
    CREATE TRIGGER update_layout_nodes_updated_at BEFORE UPDATE ON layout_nodes
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_store_pages_updated_at') THEN
    CREATE TRIGGER update_store_pages_updated_at BEFORE UPDATE ON store_pages
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_templates_library_updated_at') THEN
    CREATE TRIGGER update_templates_library_updated_at BEFORE UPDATE ON templates_library
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- 7. Backfill: Create default store pages for existing websites
INSERT INTO store_pages (website_id, title, slug, type, is_published, is_homepage, content)
SELECT
  w.id,
  'Halaman Utama',
  'home',
  'custom',
  TRUE,
  TRUE,
  ''
FROM websites w
WHERE NOT EXISTS (SELECT 1 FROM store_pages sp WHERE sp.website_id = w.id AND sp.slug = 'home');

-- 8. Set homepage_page_id for existing websites
UPDATE website_settings ws
SET homepage_page_id = sp.id
FROM store_pages sp
WHERE sp.website_id = ws.website_id
AND sp.is_homepage = TRUE
AND ws.homepage_page_id IS NULL;
