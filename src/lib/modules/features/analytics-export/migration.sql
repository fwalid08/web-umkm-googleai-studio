-- Migration: Analytics Export (anl_ tables)
-- Analytics export tables

CREATE TABLE IF NOT EXISTS anl_exports(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  website_id UUID REFERENCES ws_websites(id) ON DELETE CASCADE,
  export_type TEXT NOT NULL CHECK (export_type IN ('orders','products','customers','full')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  file_url TEXT,
  file_size INT,
  row_count INT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS anl_reports(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  website_id UUID REFERENCES ws_websites(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('daily','weekly','monthly','custom')),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anl_exports_user ON anl_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_anl_exports_website ON anl_exports(website_id);
CREATE INDEX IF NOT EXISTS idx_anl_exports_status ON anl_exports(status);
CREATE INDEX IF NOT EXISTS idx_anl_reports_user ON anl_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_anl_reports_website ON anl_reports(website_id);
CREATE INDEX IF NOT EXISTS idx_anl_reports_period ON anl_reports(period_start, period_end);

ALTER TABLE anl_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE anl_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY anl_exports_owner_all ON anl_exports
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY anl_reports_owner_all ON anl_reports
  FOR ALL USING (user_id = auth.uid());