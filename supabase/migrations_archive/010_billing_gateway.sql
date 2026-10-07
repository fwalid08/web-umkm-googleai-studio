-- 010_billing_gateway.sql
-- Billing gateway Midtrans (sandbox): kolom pendukung Snap + siklus billing.
-- Idempoten, aman di-run ulang via Dashboard > SQL Editor.
-- Catatan: payment_reference sudah ada sejak 001 (VARCHAR(100)); ADD IF NOT EXISTS
-- di bawah no-op bila kolom sudah ada.

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS payment_reference TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS snap_token TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly';

-- Index helper untuk lookup webhook by payment_reference & status per user.
-- Catatan: idx_subscriptions_user_id sudah ada sejak 001; idx_sub_user adalah
-- alias sesuai spec P0-1 (tidak duplikat secara fungsional, aman).
CREATE INDEX IF NOT EXISTS idx_sub_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_sub_payment_ref ON subscriptions(payment_reference);

-- Constraint ringan: billing_cycle hanya monthly/yearly bila terisi.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_billing_cycle_check') THEN
    ALTER TABLE subscriptions
      ADD CONSTRAINT subscriptions_billing_cycle_check
      CHECK (billing_cycle IS NULL OR billing_cycle IN ('monthly', 'yearly'));
  END IF;
END $$;

-- Down (destruktif, jalankan manual bila rollback):
-- ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_billing_cycle_check;
-- DROP INDEX IF EXISTS idx_sub_payment_ref;
-- DROP INDEX IF EXISTS idx_sub_user;
-- ALTER TABLE subscriptions DROP COLUMN IF EXISTS billing_cycle;
-- ALTER TABLE subscriptions DROP COLUMN IF EXISTS paid_at;
-- ALTER TABLE subscriptions DROP COLUMN IF EXISTS snap_token;
-- -- payment_reference dipertahankan (milik 001).
