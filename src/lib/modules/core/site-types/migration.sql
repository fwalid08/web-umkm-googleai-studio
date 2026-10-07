-- Migration: Add site_type to ws_websites and bill_subscriptions
-- Part of Fase 0: Site type registry

-- Add site_type column to ws_websites table
ALTER TABLE ws_websites ADD COLUMN IF NOT EXISTS site_type TEXT DEFAULT 'online_shop' NOT NULL;
COMMENT ON COLUMN ws_websites.site_type IS 'Jenis website: online_shop, company, portfolio, blog, sekolah, booking';

-- Add index for site_type queries
CREATE INDEX IF NOT EXISTS idx_ws_websites_site_type ON ws_websites(site_type);

-- Add site_type and pack_id to bill_subscriptions table
ALTER TABLE bill_subscriptions ADD COLUMN IF NOT EXISTS site_type TEXT DEFAULT 'online_shop' NOT NULL;
ALTER TABLE bill_subscriptions ADD COLUMN IF NOT EXISTS pack_id TEXT NULL;
COMMENT ON COLUMN bill_subscriptions.site_type IS 'Jenis website untuk langganan ini';
COMMENT ON COLUMN bill_subscriptions.pack_id IS 'ID pack fitur (ref mod_packs.id)';

-- Add index for subscriptions by site_type
CREATE INDEX IF NOT EXISTS idx_bill_subscriptions_site_type ON bill_subscriptions(site_type);
CREATE INDEX IF NOT EXISTS idx_bill_subscriptions_pack_id ON bill_subscriptions(pack_id);

-- Backfill existing websites to online_shop
UPDATE ws_websites SET site_type = 'online_shop' WHERE site_type IS NULL;

-- Backfill existing subscriptions to online_shop
UPDATE bill_subscriptions SET site_type = 'online_shop' WHERE site_type IS NULL;