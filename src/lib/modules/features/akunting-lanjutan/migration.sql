-- Migration: Akunting Lanjutan (acc_ tables)
-- Advanced accounting reports & tax calculations

CREATE TABLE IF NOT EXISTS acc_reports(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('profit_loss','balance_sheet','cash_flow','trial_balance')),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS acc_tax_calculations(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  tax_type TEXT NOT NULL CHECK (tax_type IN ('pph21','pph23','ppn','final')),
  taxable_income INT NOT NULL DEFAULT 0,
  tax_amount INT NOT NULL DEFAULT 0,
  calculation_detail JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_acc_reports_user ON acc_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_acc_reports_type ON acc_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_acc_reports_period ON acc_reports(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_acc_tax_user ON acc_tax_calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_acc_tax_period ON acc_tax_calculations(period_start, period_end);

ALTER TABLE acc_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE acc_tax_calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY acc_reports_owner_all ON acc_reports
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY acc_tax_calculations_owner_all ON acc_tax_calculations
  FOR ALL USING (user_id = auth.uid());