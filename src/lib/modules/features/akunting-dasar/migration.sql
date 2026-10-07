-- Migration: Akunting Dasar (acc_ tables)
-- Basic accounting journals & ledgers

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

CREATE TABLE IF NOT EXISTS acc_ledgers(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id UUID NOT NULL REFERENCES acc_journals(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES acc_accounts(id) ON DELETE CASCADE,
  debit INT NOT NULL DEFAULT 0,
  credit INT NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_acc_accounts_user ON acc_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_acc_accounts_type ON acc_accounts(type);
CREATE INDEX IF NOT EXISTS idx_acc_journals_user ON acc_journals(user_id);
CREATE INDEX IF NOT EXISTS idx_acc_journals_date ON acc_journals(date);
CREATE INDEX IF NOT EXISTS idx_acc_journals_reference ON acc_journals(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_acc_ledgers_journal ON acc_ledgers(journal_id);
CREATE INDEX IF NOT EXISTS idx_acc_ledgers_account ON acc_ledgers(account_id);

ALTER TABLE acc_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE acc_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE acc_ledgers ENABLE ROW LEVEL SECURITY;

CREATE POLICY acc_accounts_owner_all ON acc_accounts
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY acc_journals_owner_all ON acc_journals
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY acc_ledgers_owner_all ON acc_ledgers
  FOR ALL USING (
    journal_id IN (SELECT id FROM acc_journals WHERE user_id = auth.uid())
  );