-- 020_domain_orders_reconcile.sql
-- Sprint 02: rekonsiliasi domain_orders (008, simulasi) ke alur registrar betulan.
-- - Backfill status legacy: pending_dokumen -> registering (failed dipertahankan).
-- - Tambah kolom registrar/payment/idempotency/DNS/auto-renew.
-- - Index partial untuk cron (expiry, verification) + UNIQUE payment_reference.
-- - RLS: owner ALL (authenticated) + WITH CHECK, pola 011 (default-deny, tanpa anon).
-- Idempoten, aman di-run ulang via Dashboard > SQL Editor. Jalankan 001..020 berurutan.

-- 1. Backfill status lama yang tidak ada di enum baru.
UPDATE domain_orders SET status = 'registering', updated_at = NOW()
WHERE status = 'pending_dokumen';

-- 2. Ganti constraint status (legacy 008 -> Sprint 02).
ALTER TABLE domain_orders DROP CONSTRAINT IF EXISTS domain_orders_status_check;
ALTER TABLE domain_orders ADD CONSTRAINT domain_orders_status_check
CHECK (status IN (
  'pending_payment',  -- checkout payment gateway dibuat, menunggu bayar
  'registering',      -- lunas, sedang register ke registrar
  'active',           -- terdaftar + DNS terverifikasi + terhubung
  'failed',           -- register gagal setelah retry (perlu kredit/manual)
  'expired',          -- lewat expiry, belum renew
  'deleted',          -- dilepas/dihapus
  'transfer_in'       -- transfer masuk berjalan
));

-- 3. Kolom registrar & lifecycle.
ALTER TABLE domain_orders ADD COLUMN IF NOT EXISTS registrar VARCHAR(50) DEFAULT 'mock';
ALTER TABLE domain_orders ADD COLUMN IF NOT EXISTS registrar_domain_id VARCHAR(100);
ALTER TABLE domain_orders ADD COLUMN IF NOT EXISTS nameservers JSONB DEFAULT '[]';
ALTER TABLE domain_orders ADD COLUMN IF NOT EXISTS dns_records JSONB DEFAULT '[]';
ALTER TABLE domain_orders ADD COLUMN IF NOT EXISTS verification_token VARCHAR(100);
ALTER TABLE domain_orders ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE domain_orders ADD COLUMN IF NOT EXISTS renewal_reminder_sent_at TIMESTAMPTZ;
ALTER TABLE domain_orders ADD COLUMN IF NOT EXISTS reseller_tier VARCHAR(20) DEFAULT 'reseller';
-- Referensi payment gateway (order_id Midtrans/Xendit). Kunci idempotency webhook:
-- satu payment_reference hanya boleh diproses lunas satu kali.
ALTER TABLE domain_orders ADD COLUMN IF NOT EXISTS payment_reference TEXT;
ALTER TABLE domain_orders ADD COLUMN IF NOT EXISTS payment_provider VARCHAR(20) DEFAULT 'midtrans';
ALTER TABLE domain_orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- 4. Index cron + lookup webhook (partial agar kecil & cepat).
CREATE INDEX IF NOT EXISTS idx_domain_orders_expires_at
  ON domain_orders(expires_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_domain_orders_verification
  ON domain_orders(verification_token) WHERE verification_token IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_domain_orders_payment_ref
  ON domain_orders(payment_reference) WHERE payment_reference IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_domain_orders_status
  ON domain_orders(status);

-- 5. RLS hardening (pola 011): owner ALL untuk authenticated, tanpa anon.
DROP POLICY IF EXISTS "Users manage own domain orders" ON domain_orders;
DROP POLICY IF EXISTS domain_orders_owner_all ON domain_orders;
CREATE POLICY domain_orders_owner_all ON domain_orders
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
-- Sengaja TIDAK ada policy TO anon: write/read langsung client dilarang;
-- API memakai service-role + filter user_id eksplisit di server.

-- Checklist verifikasi manual (SQL Editor):
-- 1. SELECT DISTINCT status FROM domain_orders; -> tanpa 'pending_dokumen'.
-- 2. Sebagai authenticated user A: SELECT * FROM domain_orders -> hanya user_id = A.
-- 3. Sebagai anon: SELECT * FROM domain_orders -> 0 rows.
-- 4. INSERT dua baris dengan payment_reference sama -> baris kedua ditolak (unique).

-- Down (destruktif, jalankan manual bila rollback Sprint 02):
-- ALTER TABLE domain_orders DROP CONSTRAINT IF EXISTS domain_orders_status_check;
-- ALTER TABLE domain_orders ADD CONSTRAINT domain_orders_status_check
-- CHECK (status IN ('pending_payment','registering','pending_dokumen','active','failed'));
-- DROP INDEX IF EXISTS uq_domain_orders_payment_ref;
-- DROP INDEX IF EXISTS idx_domain_orders_status;
-- DROP INDEX IF EXISTS idx_domain_orders_verification;
-- DROP INDEX IF EXISTS idx_domain_orders_expires_at;
-- ALTER TABLE domain_orders DROP COLUMN IF EXISTS paid_at;
-- ALTER TABLE domain_orders DROP COLUMN IF EXISTS payment_provider;
-- ALTER TABLE domain_orders DROP COLUMN IF EXISTS payment_reference;
-- ALTER TABLE domain_orders DROP COLUMN IF EXISTS reseller_tier;
-- ALTER TABLE domain_orders DROP COLUMN IF EXISTS renewal_reminder_sent_at;
-- ALTER TABLE domain_orders DROP COLUMN IF EXISTS auto_renew;
-- ALTER TABLE domain_orders DROP COLUMN IF EXISTS verification_token;
-- ALTER TABLE domain_orders DROP COLUMN IF EXISTS dns_records;
-- ALTER TABLE domain_orders DROP COLUMN IF EXISTS nameservers;
-- ALTER TABLE domain_orders DROP COLUMN IF EXISTS registrar_domain_id;
-- ALTER TABLE domain_orders DROP COLUMN IF EXISTS registrar;
