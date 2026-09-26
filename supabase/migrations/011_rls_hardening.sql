-- 011_rls_hardening.sql
-- P0-4 RLS hardening (defense-in-depth).
-- Prinsip: RLS default-deny. App memakai service-role (bypass RLS) + filter
-- user_id/website_id eksplisit di server. Policy di bawah melindungi jika
-- ada kode yang tak sengaja memakai anon/authenticated client.
-- Public storefront (subdomain/custom_domain) TIDAK via anon SELECT langsung,
-- melainkan via service-role di app yang hanya SELECT kolom public-safe
-- (lihat src/lib/builder/public.ts, src/lib/orders/tenant.ts).
-- Idempoten: aman di-run ulang. Jalankan 001..011 berurutan via Dashboard > SQL Editor.
-- Down (bila perlu rollback): DROP POLICY ... (lihat nama policy di bawah).

-- Pastikan RLS aktif di semua tabel user-data.
ALTER TABLE websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- ============ websites: owner ALL (authenticated), tanpa anon read ============
-- 006 hanya membuat USING tanpa WITH CHECK -> INSERT via client gagal/tidak konsisten.
-- Samakan USING + WITH CHECK agar INSERT/UPDATE konsisten.
DROP POLICY IF EXISTS "Users manage own websites" ON websites;
DROP POLICY IF EXISTS websites_owner_all ON websites;
CREATE POLICY websites_owner_all ON websites
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
-- Sengaja TIDAK ada policy TO anon: anon tidak bisa SELECT/INSERT langsung.
-- Public read dilayani service-role di app (kolom public-safe saja).

-- ============ orders: owner SELECT/UPDATE/DELETE, TANPA insert langsung ============
-- Guest checkout (POST /api/orders publik) insert via service-role setelah
-- resolveTenantId server-side. Anon/authenticated client dilarang INSERT langsung.
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
DROP POLICY IF EXISTS "Users can update own orders" ON orders;
DROP POLICY IF EXISTS "Users can delete own orders" ON orders;

-- DROP tepat di atas CREATE masing-masing: CI lint idempotency memakai sliding
-- window 5 baris untuk memastikan setiap CREATE POLICY punya DROP pasangannya.
DROP POLICY IF EXISTS orders_owner_select ON orders;
CREATE POLICY orders_owner_select ON orders
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
DROP POLICY IF EXISTS orders_owner_update ON orders;
CREATE POLICY orders_owner_update ON orders
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS orders_owner_delete ON orders;
CREATE POLICY orders_owner_delete ON orders
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
-- TIDAK ada policy FOR INSERT: semua INSERT harus via service-role di API.

-- ============ user_templates: owner ALL ============
DROP POLICY IF EXISTS "Users can manage own template configs" ON user_templates;
DROP POLICY IF EXISTS user_templates_owner_all ON user_templates;
CREATE POLICY user_templates_owner_all ON user_templates
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============ subscriptions: owner SELECT saja ============
-- Trial/paid creation via service-role (webhook/stripe). Client tidak INSERT langsung.
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS subscriptions_owner_select ON subscriptions;
CREATE POLICY subscriptions_owner_select ON subscriptions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
-- TIDAK ada policy INSERT/UPDATE/DELETE untuk client.

-- Checklist verifikasi manual (SQL Editor):
-- 1. Sebagai authenticated user A: SELECT * FROM websites -> hanya baris user_id = A.
-- 2. Sebagai anon: SELECT * FROM websites -> 0 rows (permission denied/empty).
-- 3. Sebagai authenticated: INSERT INTO orders (...) -> ditolak (no INSERT policy).
-- 4. Service-role: semua operasi tetap lolos (bypass RLS otomatis).
