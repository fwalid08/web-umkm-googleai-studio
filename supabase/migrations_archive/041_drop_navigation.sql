-- 041_drop_navigation.sql
-- Hapus total fitur navigasi DB: navigation_groups + navigation_items
-- (dikelola via POST/GET/PATCH/DELETE /api/websites/[id]/navigation).
-- Navigasi situs live kini hanya dari custom_config header/footer
-- (navItems/navGroups di builder store) — tabel DB tidak lagi dipakai.
--
-- Idempotent: aman di-run ulang via Dashboard > SQL Editor.

-- ============================================================
-- 1. Drop policy eksplisit (dibuat di 029, RLS dimatikan di 030)
-- ============================================================
DROP POLICY IF EXISTS "Users manage own navigation groups" ON navigation_groups;
DROP POLICY IF EXISTS "Users manage own navigation items" ON navigation_items;

-- ============================================================
-- 2. Drop tabel anak dulu, lalu induk (CASCADE gugurkan FK self-parent,
--    trigger updated_at, dan index sisa)
-- ============================================================
DROP TABLE IF EXISTS navigation_items CASCADE;
DROP TABLE IF EXISTS navigation_groups CASCADE;

-- ============================================================
-- 3. Bersihkan index sisa bila tabel pernah di-drop tanpa CASCADE
-- ============================================================
DROP INDEX IF EXISTS uq_nav_groups_singleton;
DROP INDEX IF EXISTS idx_nav_groups_website;
DROP INDEX IF EXISTS idx_nav_items_group;
DROP INDEX IF EXISTS idx_nav_items_parent;
