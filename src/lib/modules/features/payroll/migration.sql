-- Migration: Payroll (pay_ tables)
-- Payroll: payslips, THR, PPh21

CREATE TABLE IF NOT EXISTS pay_payslips(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES hrm_employees(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  base_salary INT NOT NULL DEFAULT 0,
  allowances INT NOT NULL DEFAULT 0,
  deductions INT NOT NULL DEFAULT 0,
  gross_salary INT NOT NULL DEFAULT 0,
  net_salary INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','paid')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pay_thr(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES hrm_employees(id) ON DELETE CASCADE,
  year INT NOT NULL,
  amount INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pay_tax(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES hrm_employees(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  tax_type TEXT NOT NULL CHECK (tax_type IN ('pph21','pph23')),
  taxable_income INT NOT NULL DEFAULT 0,
  tax_amount INT NOT NULL DEFAULT 0,
  calculation_detail JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pay_payslips_employee ON pay_payslips(employee_id);
CREATE INDEX IF NOT EXISTS idx_pay_payslips_period ON pay_payslips(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_pay_payslips_status ON pay_payslips(status);
CREATE INDEX IF NOT EXISTS idx_pay_thr_employee ON pay_thr(employee_id);
CREATE INDEX IF NOT EXISTS idx_pay_thr_year ON pay_thr(year);
CREATE INDEX IF NOT EXISTS idx_pay_tax_employee ON pay_tax(employee_id);
CREATE INDEX IF NOT EXISTS idx_pay_tax_period ON pay_tax(period_start, period_end);

ALTER TABLE pay_payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE pay_thr ENABLE ROW LEVEL SECURITY;
ALTER TABLE pay_tax ENABLE ROW LEVEL SECURITY;

CREATE POLICY pay_payslips_owner_all ON pay_payslips
  FOR ALL USING (
    employee_id IN (SELECT id FROM hrm_employees WHERE user_id = auth.uid())
  );

CREATE POLICY pay_thr_owner_all ON pay_thr
  FOR ALL USING (
    employee_id IN (SELECT id FROM hrm_employees WHERE user_id = auth.uid())
  );

CREATE POLICY pay_tax_owner_all ON pay_tax
  FOR ALL USING (
    employee_id IN (SELECT id FROM hrm_employees WHERE user_id = auth.uid())
  );