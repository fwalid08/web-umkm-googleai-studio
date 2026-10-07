-- Migration 051: Accounting, HR & Payroll features
-- akunting_dasar, akunting_lanjutan, hrm_core, payroll

-- ===== acc_accounts: chart of accounts =====
CREATE TABLE IF NOT EXISTS acc_accounts(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('asset','liability','equity','revenue','expense')),
  parent_id UUID REFERENCES acc_accounts(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, code)
);
CREATE INDEX IF NOT EXISTS idx_acc_accounts_user ON acc_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_acc_accounts_type ON acc_accounts(type);

-- ===== acc_journals: journal entries =====
CREATE TABLE IF NOT EXISTS acc_journals(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  website_id UUID REFERENCES ws_websites(id) ON DELETE SET NULL,
  date TIMESTAMPTZ NOT NULL,
  reference_type TEXT CHECK (reference_type IN ('order','manual','adjustment','payroll')),
  reference_id UUID,
  description TEXT NOT NULL,
  total_debit INT NOT NULL DEFAULT 0,
  total_credit INT NOT NULL DEFAULT 0,
  is_posted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_acc_journals_user ON acc_journals(user_id);
CREATE INDEX IF NOT EXISTS idx_acc_journals_date ON acc_journals(date);
CREATE INDEX IF NOT EXISTS idx_acc_journals_reference ON acc_journals(reference_type, reference_id);

-- ===== acc_ledgers: ledger lines =====
CREATE TABLE IF NOT EXISTS acc_ledgers(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id UUID NOT NULL REFERENCES acc_journals(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES acc_accounts(id) ON DELETE CASCADE,
  debit INT NOT NULL DEFAULT 0,
  credit INT NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_acc_ledgers_journal ON acc_ledgers(journal_id);
CREATE INDEX IF NOT EXISTS idx_acc_ledgers_account ON acc_ledgers(account_id);

-- ===== acc_reports: financial reports =====
CREATE TABLE IF NOT EXISTS acc_reports(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('profit_loss','balance_sheet','cash_flow','trial_balance')),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_acc_reports_user ON acc_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_acc_reports_type ON acc_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_acc_reports_period ON acc_reports(period_start, period_end);

-- ===== acc_tax_calculations: tax calculations =====
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
CREATE INDEX IF NOT EXISTS idx_acc_tax_user ON acc_tax_calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_acc_tax_period ON acc_tax_calculations(period_start, period_end);

-- ===== hrm_employees: employee directory =====
CREATE TABLE IF NOT EXISTS hrm_employees(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  position TEXT,
  department TEXT,
  salary INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','terminated')),
  hired_at TIMESTAMPTZ,
  terminated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hrm_employees_user ON hrm_employees(user_id);
CREATE INDEX IF NOT EXISTS idx_hrm_employees_status ON hrm_employees(status);

-- ===== hrm_shifts: shift definitions =====
CREATE TABLE IF NOT EXISTS hrm_shifts(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  days TEXT[] NOT NULL DEFAULT '{monday,tuesday,wednesday,thursday,friday}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hrm_shifts_user ON hrm_shifts(user_id);

-- ===== hrm_attendance: attendance records =====
CREATE TABLE IF NOT EXISTS hrm_attendance(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES hrm_employees(id) ON DELETE CASCADE,
  shift_id UUID REFERENCES hrm_shifts(id) ON DELETE SET NULL,
  date TIMESTAMPTZ NOT NULL,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present','absent','late','leave','half_day')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hrm_attendance_employee ON hrm_attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_hrm_attendance_date ON hrm_attendance(date);
CREATE INDEX IF NOT EXISTS idx_hrm_attendance_status ON hrm_attendance(status);

-- ===== pay_payslips: payroll payslips =====
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
CREATE INDEX IF NOT EXISTS idx_pay_payslips_employee ON pay_payslips(employee_id);
CREATE INDEX IF NOT EXISTS idx_pay_payslips_period ON pay_payslips(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_pay_payslips_status ON pay_payslips(status);

-- ===== pay_thr: THR (Tunjangan Hari Raya) =====
CREATE TABLE IF NOT EXISTS pay_thr(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES hrm_employees(id) ON DELETE CASCADE,
  year INT NOT NULL,
  amount INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pay_thr_employee ON pay_thr(employee_id);
CREATE INDEX IF NOT EXISTS idx_pay_thr_year ON pay_thr(year);

-- ===== pay_tax: payroll tax calculations (PPh21) =====
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
CREATE INDEX IF NOT EXISTS idx_pay_tax_employee ON pay_tax(employee_id);
CREATE INDEX IF NOT EXISTS idx_pay_tax_period ON pay_tax(period_start, period_end);

-- RLS
ALTER TABLE acc_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE acc_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE acc_ledgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE acc_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE acc_tax_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrm_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrm_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrm_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE pay_payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE pay_thr ENABLE ROW LEVEL SECURITY;
ALTER TABLE pay_tax ENABLE ROW LEVEL SECURITY;

-- Acc tables: user-scoped
DROP POLICY IF EXISTS acc_accounts_owner_all ON acc_accounts;
CREATE POLICY acc_accounts_owner_all ON acc_accounts FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS acc_journals_owner_all ON acc_journals;
CREATE POLICY acc_journals_owner_all ON acc_journals FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS acc_ledgers_owner_all ON acc_ledgers;
CREATE POLICY acc_ledgers_owner_all ON acc_ledgers
  FOR ALL USING (journal_id IN (SELECT id FROM acc_journals WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS acc_reports_owner_all ON acc_reports;
CREATE POLICY acc_reports_owner_all ON acc_reports FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS acc_tax_calculations_owner_all ON acc_tax_calculations;
CREATE POLICY acc_tax_calculations_owner_all ON acc_tax_calculations FOR ALL USING (user_id = auth.uid());

-- HRM tables: user-scoped
DROP POLICY IF EXISTS hrm_employees_owner_all ON hrm_employees;
CREATE POLICY hrm_employees_owner_all ON hrm_employees FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS hrm_shifts_owner_all ON hrm_shifts;
CREATE POLICY hrm_shifts_owner_all ON hrm_shifts FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS hrm_attendance_owner_all ON hrm_attendance;
CREATE POLICY hrm_attendance_owner_all ON hrm_attendance
  FOR ALL USING (employee_id IN (SELECT id FROM hrm_employees WHERE user_id = auth.uid()));

-- Payroll tables: user-scoped via employee
DROP POLICY IF EXISTS pay_payslips_owner_all ON pay_payslips;
CREATE POLICY pay_payslips_owner_all ON pay_payslips
  FOR ALL USING (employee_id IN (SELECT id FROM hrm_employees WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS pay_thr_owner_all ON pay_thr;
CREATE POLICY pay_thr_owner_all ON pay_thr
  FOR ALL USING (employee_id IN (SELECT id FROM hrm_employees WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS pay_tax_owner_all ON pay_tax;
CREATE POLICY pay_tax_owner_all ON pay_tax
  FOR ALL USING (employee_id IN (SELECT id FROM hrm_employees WHERE user_id = auth.uid()));