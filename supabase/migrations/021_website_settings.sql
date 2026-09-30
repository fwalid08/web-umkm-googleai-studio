-- 021_website_settings.sql
-- Sprint 04: Isolasi setting per website (currency, payment methods, notifications, language, profile)

-- 1. Website Settings table
CREATE TABLE IF NOT EXISTS website_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  
  -- Currency & Localization
  currency VARCHAR(3) NOT NULL DEFAULT 'IDR',
  language VARCHAR(5) NOT NULL DEFAULT 'id',
  timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Jakarta',
  
  -- Payment Methods (JSON array of enabled payment methods)
  payment_methods JSONB NOT NULL DEFAULT '["whatsapp"]'::jsonb,
  
  -- Notifications
  notify_whatsapp_new_order BOOLEAN NOT NULL DEFAULT TRUE,
  notify_email_daily_summary BOOLEAN NOT NULL DEFAULT FALSE,
  notify_email_low_stock BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Store Profile
  store_name VARCHAR(100),
  store_description TEXT,
  store_phone VARCHAR(20),
  store_email VARCHAR(100),
  store_address TEXT,
  operational_hours JSONB, -- { "monday": {"open": "08:00", "close": "22:00", "closed": false}, ... }
  
  -- SEO / Social
  meta_title VARCHAR(100),
  meta_description VARCHAR(300),
  og_image_url VARCHAR(500),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT uq_website_settings_website_id UNIQUE (website_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_website_settings_website_id ON website_settings(website_id);

-- RLS
ALTER TABLE website_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='website_settings' AND policyname='Users manage own website settings') THEN
    CREATE POLICY "Users manage own website settings" ON website_settings
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM websites w 
          WHERE w.id = website_settings.website_id 
          AND w.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Trigger for updated_at
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_website_settings_updated_at') THEN
    CREATE TRIGGER update_website_settings_updated_at BEFORE UPDATE ON website_settings
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- 2. Backfill: Create default settings for existing websites
INSERT INTO website_settings (website_id, currency, language, timezone, payment_methods, notify_whatsapp_new_order, notify_email_daily_summary, notify_email_low_stock)
SELECT 
  id, 
  'IDR', 
  'id', 
  'Asia/Jakarta', 
  '["whatsapp"]'::jsonb, 
  TRUE, 
  FALSE, 
  TRUE
FROM websites w
WHERE NOT EXISTS (SELECT 1 FROM website_settings ws WHERE ws.website_id = w.id);

-- 3. Add foreign key from users to website_settings (optional, for quick access)
-- Not needed since we can join through websites table