-- 004_fix_rls_insert_policies.sql
-- Hotfix Sprint 00: tambah policy INSERT yang hilang + trigger updated_at orders

-- Users: allow insert own profile (needed for Google OAuth manual insert)
-- Service role bypasses RLS anyway, tapi untuk completeness & kalau pakai anon:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='users' AND policyname='Users can insert own data'
  ) THEN
    CREATE POLICY "Users can insert own data" ON users
      FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Subscriptions: allow insert own subscription (trial creation)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='subscriptions' AND policyname='Users can insert own subscriptions'
  ) THEN
    CREATE POLICY "Users can insert own subscriptions" ON subscriptions
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Orders: tambah delete policy (opsional, untuk kelengkapan)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='orders' AND policyname='Users can delete own orders'
  ) THEN
    CREATE POLICY "Users can delete own orders" ON orders
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Trigger updated_at untuk orders (sebelumnya cuma users & user_templates)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_orders_updated_at') THEN
    CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_subscriptions_updated_at') THEN
    -- subscriptions tidak punya updated_at column, skip trigger
    NULL;
  END IF;
END $$;

-- Tambah comment untuk service_role bypass note
COMMENT ON TABLE users IS 'RLS enabled. Service role (SUPABASE_SERVICE_ROLE_KEY) bypasses RLS for admin ops. Anon users need auth.uid() match.';

