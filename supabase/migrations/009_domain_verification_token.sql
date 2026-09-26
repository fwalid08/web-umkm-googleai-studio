-- 009_domain_verification_token.sql
-- Simpan token verifikasi custom domain per website agar verify bisa
-- mencocokkan isi TXT record secara eksak (bukan sekadar prefix).

ALTER TABLE websites ADD COLUMN IF NOT EXISTS custom_domain_verification_token TEXT;
CREATE INDEX IF NOT EXISTS idx_websites_verification_token ON websites(custom_domain_verification_token);
