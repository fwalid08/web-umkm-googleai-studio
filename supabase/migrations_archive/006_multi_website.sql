-- 006_multi_website.sql
-- Sprint 03: panel website vs panel bisnis. Satu user bisa punya banyak website,
-- data operasional terisolasi per website_id. Idempoten (aman di-run ulang).

-- 1. Plans (limit max_websites configurable saas admin; UI admin = backlog)
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  price_monthly INTEGER NOT NULL DEFAULT 0,
  max_websites INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO plans (slug, name, price_monthly, max_websites) VALUES
  ('free', 'Free', 0, 1),
  ('starter', 'Starter', 99000, 2),
  ('growth', 'Growth', 299000, 5),
  ('enterprise', 'Enterprise', 999000, 999)
ON CONFLICT (slug) DO NOTHING;

-- 2. Users: plan + website aktif
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES plans(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS active_website_id UUID;
UPDATE users SET plan_id = (SELECT id FROM plans WHERE slug = users.tier)
  WHERE plan_id IS NULL;

-- 3. Websites
CREATE TABLE IF NOT EXISTS websites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL DEFAULT 'Website Utama',
  business_type VARCHAR(20),
  subdomain VARCHAR(50) UNIQUE,
  custom_domain VARCHAR(255),
  custom_domain_verified BOOLEAN DEFAULT FALSE,
  custom_domain_verified_at TIMESTAMPTZ,
  current_template_id UUID REFERENCES templates(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_websites_user_id ON websites(user_id);
CREATE INDEX IF NOT EXISTS idx_websites_subdomain ON websites(subdomain);
CREATE INDEX IF NOT EXISTS idx_websites_custom_domain ON websites(custom_domain);
ALTER TABLE websites ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='websites' AND policyname='Users manage own websites') THEN
    CREATE POLICY "Users manage own websites" ON websites
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_websites_updated_at') THEN
    CREATE TRIGGER update_websites_updated_at BEFORE UPDATE ON websites
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Backfill: 1 website per user existing (nama ikut nama user agar publik tetap tampil benar)
INSERT INTO websites (user_id, name, business_type, subdomain, custom_domain, custom_domain_verified, custom_domain_verified_at, current_template_id)
SELECT id, COALESCE(name, 'Website Utama'), business_type, subdomain, custom_domain, custom_domain_verified, custom_domain_verified_at, current_template_id
FROM users
WHERE NOT EXISTS (SELECT 1 FROM websites w WHERE w.user_id = users.id);

UPDATE users SET active_website_id = (
  SELECT id FROM websites WHERE websites.user_id = users.id ORDER BY created_at LIMIT 1
) WHERE active_website_id IS NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fk_users_active_website') THEN
    ALTER TABLE users ADD CONSTRAINT fk_users_active_website
      FOREIGN KEY (active_website_id) REFERENCES websites(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 4. Orders -> website_id (isolasi per website)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS website_id UUID REFERENCES websites(id) ON DELETE CASCADE;
UPDATE orders SET website_id = (
  SELECT id FROM websites WHERE websites.user_id = orders.user_id ORDER BY created_at LIMIT 1
) WHERE website_id IS NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM orders WHERE website_id IS NULL) THEN
    ALTER TABLE orders ALTER COLUMN website_id SET NOT NULL;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_orders_website_id ON orders(website_id);

-- 5. user_templates -> website_id (konfigurasi per website)
ALTER TABLE user_templates ADD COLUMN IF NOT EXISTS website_id UUID REFERENCES websites(id) ON DELETE CASCADE;
UPDATE user_templates SET website_id = (
  SELECT id FROM websites WHERE websites.user_id = user_templates.user_id ORDER BY created_at LIMIT 1
) WHERE website_id IS NULL;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname='user_templates_user_id_template_id_key') THEN
    ALTER TABLE user_templates DROP CONSTRAINT user_templates_user_id_template_id_key;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='uq_user_templates_website_template') THEN
    ALTER TABLE user_templates ADD CONSTRAINT uq_user_templates_website_template
      UNIQUE (website_id, template_id);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_user_templates_website_id ON user_templates(website_id);
