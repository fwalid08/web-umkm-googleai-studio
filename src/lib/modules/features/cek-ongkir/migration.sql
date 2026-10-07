-- Migration: Cek Ongkir (ong_ tables)
-- Part of Fase 1: POC Add-on W

-- Cached rates table
CREATE TABLE IF NOT EXISTS ong_rates_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  weight INT NOT NULL CHECK (weight > 0),
  courier TEXT NOT NULL,
  rates JSONB NOT NULL DEFAULT '[]', -- Array of ShippingRate
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (origin, destination, weight, courier)
);

-- Usage log for metering (mod_usage is separate, this is feature-specific detail)
CREATE TABLE IF NOT EXISTS ong_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES ws_websites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  weight INT NOT NULL CHECK (weight > 0),
  courier TEXT,
  results_count INT NOT NULL DEFAULT 0,
  cached BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ong_rates_cache_lookup ON ong_rates_cache(origin, destination, weight, courier);
CREATE INDEX IF NOT EXISTS idx_ong_rates_cache_expires ON ong_rates_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_ong_usage_log_website ON ong_usage_log(website_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ong_usage_log_user ON ong_usage_log(user_id, created_at);

-- RLS Policies
ALTER TABLE ong_rates_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE ong_usage_log ENABLE ROW LEVEL SECURITY;

-- Cache: public read (rates are not sensitive), system write
CREATE POLICY ong_rates_cache_public_read ON ong_rates_cache
  FOR SELECT USING (true);

CREATE POLICY ong_rates_cache_system_write ON ong_rates_cache
  FOR ALL WITH CHECK (true); -- Service role

-- Usage log: owner read, system write
CREATE POLICY ong_usage_log_owner_read ON ong_usage_log
  FOR SELECT USING (
    website_id IN (SELECT id FROM ws_websites WHERE user_id = auth.uid())
    OR user_id = auth.uid()
  );

CREATE POLICY ong_usage_log_system_write ON ong_usage_log
  FOR INSERT WITH CHECK (true); -- Service role