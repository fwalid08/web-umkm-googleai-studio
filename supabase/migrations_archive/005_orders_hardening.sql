-- 005_orders_hardening.sql
-- Sprint 02 Sesi A: guard idempoten untuk trigger updated_at orders.
-- Catatan: 004_fix_rls_insert_policies.sql SUDAH membuat trigger ini.
-- File ini aman dijalankan baik 004 sudah maupun belum dijalankan
-- (IF NOT EXISTS — tidak error/duplikat). Jalankan 001..005 berurutan.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_orders_updated_at') THEN
    CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
