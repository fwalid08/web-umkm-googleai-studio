# FIXING PLAN — Sprint 01 Products Management
**Created:** 2026-09-26 (Act mode) | **Source:** Sprint 01 review | **Scope:** `SPRINT_01_PRODUCTS.md` 25pts

## Status Legend
- [ ] TODO | [x] DONE | [~] IN PROGRESS

## Phase 0 — Unblock CI & Migrate (P0, ~2h)
- [x] F0-1: `013_product_limits.sql` — `plans.max_products`, `max_images_per_product` + backfill (fixes CI gap 012→014 + `checkProductLimit` crash)
- [x] F0-2: Rewrite `017_seed_demo_users.sql` — valid UUIDs, drop `trial_ends_at`/`current_template_id` string refs, dev-only guard, rupiah units
- [x] F0-3: Fix `decrement_product_stock()` boolean bug + `search_path` + idempotent triggers in `016`; least-privilege grants; `check_product_limit` tolerates pre-013

## Phase 1 — Runtime crashes (P0, ~1h)
- [x] F1-1: `pnpm add sharp` (missing dep) — installed sharp@0.35.4
- [x] F1-2: Single-`formData()` fix in `POST /api/user/products` + `validateImageFile` on create
- [x] F1-3: Storage providers — Supabase-only: factory throw untuk `aws-s3`/`cloudinary`, stub + tipe SDK dihapus

## Phase 2 — Data correctness (P1, ~4h)
- [x] F2-1: Order by `product_id` (include `id` in injected items, thread through `OrderForm`, server price lookup; name fallback for legacy JSON)
- [x] F2-2: Single `log_stock_movement` (remove pre-insert orphan)
- [x] F2-3: Rupiah-unit decision (drop "(sen)", fix seeds to plain IDR)
- [x] F2-4: Signed-URL-on-read + `018_storage_bucket.sql`
- [x] F2-5: Renderer `low_stock_threshold` + sanitize search
- [x] F2-6: Reorder single-website + UUID validation + `reorder_products` RPC + fallback

## Phase 3 — Hardening (P2, ~half day)
- [x] F3-1: Dedupe `PRODUCT_TIER_LIMITS` — single source di `src/types/products.ts`, re-export dari `src/lib/billing/limits.ts`
- [x] F3-2: Tighten RLS grants — hapus policy `stock_movements` INSERT (`WITH CHECK (true)`), hanya EXECUTE RPC yang di-grant
- [x] F3-3: REST unify / ProductForm adoption — `app/dashboard/products/page.tsx` pakai `ProductForm`; `GET /api/user/products` kirim `limits` (fix banner + tombol Tambah Produk yang selalu disabled)
- [x] F3-4: i18n + a11y — seluruh copy katalog via `t("products.*")`, 27 key baru di id/en, aria-label/role di kontrol ikon
- [x] F3-5: vitest — `billing/products.test.ts` (14) + `products/rls.test.ts` (12: RLS isolation & stock concurrency)
- [x] F3-6: Docs — `docs/STOCK.md` sinkron 016/018, `db:push`/`db:new` + README # Database Setup

## Fix F-fix — Migration idempotency (42710 trigger-exists, reported post-session)
- [x] F-fix-1: `015` triggers/policies guarded (`DO $$ IF NOT EXISTS pg_trigger`, `DROP POLICY IF EXISTS`); `016` 5 policies `DROP+CREATE`
- [x] F-fix-2: audit — `001` 8 policies + 2 triggers guarded; `004/005/006/008/011/014/018` already guarded; zero bare `^CREATE TRIGGER`, all `^CREATE POLICY` paired
- [x] F-fix-3: CI lint (POSIX `case` sliding window, no awk) rejects bare col-0 CREATE TRIGGER/POLICY
- [x] Verify: typecheck ✅, test 73 ✅

## Fix F-fix-4 — Edit via ProductForm (P0 regression, ditemukan saat review Sprint 01)
- [x] F-fix-4a: `PUT /api/user/products` terima `multipart/form-data` (ProductForm kirim FormData) — sebelumnya `req.json()` gagal → **setiap edit balik 400**; path JSON tetap untuk toggle/bulk
- [x] F-fix-4b: hapus gambar saat edit — field `remove_image_ids`, delete scoped (ownership → `.eq product_id`), bersihkan storage, upload baru lewat `checkProductImageLimit`
- [x] F-fix-4c: `ProductForm` — state tunggal `imageEntries` (`saved`|`new`); fix index mismatch (hapus preview gambar tersimpan ikut membuang file baru dari payload); file invalid difilter sebelum slice; `e.target.value` reset
- [x] F-fix-4d: halaman katalog menampilkan `warning` server (demo upload / batas gambar tier)
- [x] F-fix-4e: regression test `src/lib/products/update-api.test.ts` (7 static checks)
- [x] Known deviation (backlog): builder editor masih edit JSON `items` untuk `product_grid` (storefront publik sudah DB-driven via `builder/public.ts`) — US-1.5 editor-side ditunda

## Verification Gates
1. [x] `pnpm typecheck` 2. [x] `pnpm test` (98 passed) 3. [x] `pnpm build` 4. [ ] Migrations 001..018 sequential (staging re-run) 5. [ ] Free-5/6th-403 smoke 6. [ ] Image upload 7. [ ] Concurrent oversell test

