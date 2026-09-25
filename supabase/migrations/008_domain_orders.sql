-- 008_domain_orders.sql
-- Sprint 05 Tahap 1: beli domain (SIMULASI, belum tersambung registrar).
-- Order tersimpan + auto-connect ke website (custom_domain langsung verified,
-- karena domain "lahir" di sistem kita). Idempoten.

CREATE TABLE IF NOT EXISTS domain_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  domain VARCHAR(255) NOT NULL,
  tld VARCHAR(20) NOT NULL,
  price_monthly INTEGER NOT NULL DEFAULT 0,
  price_yearly INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('pending_payment','registering','pending_dokumen','active','failed')),
  sandbox BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_domain_orders_user_id ON domain_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_domain_orders_website_id ON domain_orders(website_id);
CREATE INDEX IF NOT EXISTS idx_domain_orders_domain ON domain_orders(domain);
ALTER TABLE domain_orders ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='domain_orders' AND policyname='Users manage own domain orders') THEN
    CREATE POLICY "Users manage own domain orders" ON domain_orders
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_domain_orders_updated_at') THEN
    CREATE TRIGGER update_domain_orders_updated_at BEFORE UPDATE ON domain_orders
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
