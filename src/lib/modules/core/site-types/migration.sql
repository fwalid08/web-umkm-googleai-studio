-- Migration: Add site_type to websites and subscriptions
-- Part of Fase 0: Site type registry

-- Add site_type column to websites table
ALTER TABLE websites ADD COLUMN IF NOT EXISTS site_type TEXT DEFAULT 'online_shop' NOT NULL;
COMMENT ON COLUMN websites.site_type IS 'Jenis website: online_shop, company, portfolio, blog, sekolah, booking';

-- Add index for site_type queries
CREATE INDEX IF NOT EXISTS idx_ws_websites_site_type ON websites(site_type);

-- Add site_type and pack_id to subscriptions table
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS site_type TEXT DEFAULT 'online_shop' NOT NULL;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS pack_id TEXT NULL;
COMMENT ON COLUMN subscriptions.site_type IS 'Jenis website untuk langganan ini';
COMMENT ON COLUMN subscriptions.pack_id IS 'ID pack fitur (ref mod_packs.id)';

-- Add index for subscriptions by site_type
CREATE INDEX IF NOT EXISTS idx_subscriptions_site_type ON subscriptions(site_type);
CREATE INDEX IF NOT EXISTS idx_subscriptions_pack_id ON subscriptions(pack_id);

-- Backfill existing websites to online_shop
UPDATE websites SET site_type = 'online_shop' WHERE site_type IS NULL;

-- Backfill existing subscriptions to online_shop
UPDATE subscriptions SET site_type = 'online_shop' WHERE site_type IS NULL;

-- Add RLS policies for site_type (read access for owners)
-- websites: owner can read site_type
-- subscriptions: owner can read site_type and pack_id