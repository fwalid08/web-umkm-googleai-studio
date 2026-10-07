-- Migration: Pages Extra (ws_ tables)
-- Extra pages quota extension

CREATE TABLE IF NOT EXISTS ws_pages_quota(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES ws_websites(id) ON DELETE CASCADE,
  extra_pages INT NOT NULL DEFAULT 0,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly','yearly')),
  price_charged INT NOT NULL DEFAULT 0,
  current_period_start TIMESTAMPTZ DEFAULT NOW(),
  current_period_end TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(website_id)
);

CREATE INDEX IF NOT EXISTS idx_ws_pages_quota_website ON ws_pages_quota(website_id);

ALTER TABLE ws_pages_quota ENABLE ROW LEVEL SECURITY;

CREATE POLICY ws_pages_quota_owner_all ON ws_pages_quota
  FOR ALL USING (
    website_id IN (SELECT id FROM ws_websites WHERE user_id = auth.uid())
  );