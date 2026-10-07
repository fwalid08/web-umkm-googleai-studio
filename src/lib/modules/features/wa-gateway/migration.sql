-- Migration: WA Gateway (wgt_ tables)
-- WhatsApp gateway templates & broadcasts

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

CREATE INDEX IF NOT EXISTS idx_wgt_templates_user ON wgt_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_wgt_templates_category ON wgt_templates(category);
CREATE INDEX IF NOT EXISTS idx_wgt_broadcasts_user ON wgt_broadcasts(user_id);
CREATE INDEX IF NOT EXISTS idx_wgt_broadcasts_status ON wgt_broadcasts(status);
CREATE INDEX IF NOT EXISTS idx_wgt_deliveries_broadcast ON wgt_deliveries(broadcast_id);
CREATE INDEX IF NOT EXISTS idx_wgt_deliveries_status ON wgt_deliveries(status);

ALTER TABLE wgt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE wgt_broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE wgt_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY wgt_templates_owner_all ON wgt_templates
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY wgt_broadcasts_owner_all ON wgt_broadcasts
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY wgt_deliveries_owner_all ON wgt_deliveries
  FOR ALL USING (
    broadcast_id IN (SELECT id FROM wgt_broadcasts WHERE user_id = auth.uid())
  );