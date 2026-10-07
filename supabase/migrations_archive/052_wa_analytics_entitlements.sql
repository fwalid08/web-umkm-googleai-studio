-- Migration 052: WA Gateway & Analytics features
-- wa_gateway, analytics_export, entitlements indexes

-- ===== wgt_templates: WhatsApp templates =====
CREATE TABLE IF NOT EXISTS wgt_templates(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('order','promo','reminder','general')),
  content TEXT NOT NULL,
  variables TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wgt_templates_user ON wgt_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_wgt_templates_category ON wgt_templates(category);

-- ===== wgt_broadcasts: broadcast campaigns =====
CREATE TABLE IF NOT EXISTS wgt_broadcasts(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES wgt_templates(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  target_count INT NOT NULL DEFAULT 0,
  sent_count INT NOT NULL DEFAULT 0,
  failed_count INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sending','completed','cancelled')),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wgt_broadcasts_user ON wgt_broadcasts(user_id);
CREATE INDEX IF NOT EXISTS idx_wgt_broadcasts_status ON wgt_broadcasts(status);

-- ===== wgt_deliveries: individual message deliveries =====
CREATE TABLE IF NOT EXISTS wgt_deliveries(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id UUID NOT NULL REFERENCES wgt_broadcasts(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed','delivered')),
  provider_reference TEXT,
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wgt_deliveries_broadcast ON wgt_deliveries(broadcast_id);
CREATE INDEX IF NOT EXISTS idx_wgt_deliveries_status ON wgt_deliveries(status);

-- ===== anl_exports: analytics exports =====
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
CREATE INDEX IF NOT EXISTS idx_anl_exports_user ON anl_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_anl_exports_website ON anl_exports(website_id);
CREATE INDEX IF NOT EXISTS idx_anl_exports_status ON anl_exports(status);

-- ===== anl_reports: analytics reports =====
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
CREATE INDEX IF NOT EXISTS idx_anl_reports_user ON anl_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_anl_reports_website ON anl_reports(website_id);
CREATE INDEX IF NOT EXISTS idx_anl_reports_period ON anl_reports(period_start, period_end);

-- ===== Entitlements indexes & RLS policies =====
-- Indexes for entitlement queries
CREATE INDEX IF NOT EXISTS idx_mod_sub_addons_website_feature ON mod_sub_addons(website_id, feature_id);
CREATE INDEX IF NOT EXISTS idx_mod_global_subs_user_feature ON mod_global_subs(user_id, feature_id);
CREATE INDEX IF NOT EXISTS idx_mod_usage_website_feature_time ON mod_usage(website_id, feature_id, created_at);
CREATE INDEX IF NOT EXISTS idx_bill_subscriptions_user_site_type ON bill_subscriptions(user_id, site_type);

-- RLS for new tables
ALTER TABLE wgt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE wgt_broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE wgt_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE anl_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE anl_reports ENABLE ROW LEVEL SECURITY;

-- WA Gateway: user-scoped
DROP POLICY IF EXISTS wgt_templates_owner_all ON wgt_templates;
CREATE POLICY wgt_templates_owner_all ON wgt_templates FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS wgt_broadcasts_owner_all ON wgt_broadcasts;
CREATE POLICY wgt_broadcasts_owner_all ON wgt_broadcasts FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS wgt_deliveries_owner_all ON wgt_deliveries;
CREATE POLICY wgt_deliveries_owner_all ON wgt_deliveries
  FOR ALL USING (broadcast_id IN (SELECT id FROM wgt_broadcasts WHERE user_id = auth.uid()));

-- Analytics: user-scoped
DROP POLICY IF EXISTS anl_exports_owner_all ON anl_exports;
CREATE POLICY anl_exports_owner_all ON anl_exports FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS anl_reports_owner_all ON anl_reports;
CREATE POLICY anl_reports_owner_all ON anl_reports FOR ALL USING (user_id = auth.uid());