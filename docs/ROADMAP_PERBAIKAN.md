# List Perbaikan & Pengembangan Selanjutnya — UMKM SaaS
Tanggal: 2026-09-26 | Basis: 6 commit (`2424dfc`..`cda57e6`) | Test: 51 passed | Dokumen induk: `docs/REVIEW_PASCA_PERBAIKAN.md`

## A. Sudah Diperbaiki (Done, terverifikasi di kode)

| ID | Perbaikan | Commit | File disentuh | Verifikasi |
|---|---|---|---|---|
| F1 | Billing Midtrans: checkout + webhook + status | `2424dfc` | `app/api/billing/{checkout,webhook,status}/route.ts`, `billing-panel.tsx`, `010_billing_gateway.sql` | Mock sukses tanpa key; snap asli perlu key prod |
| F2 | Pricing seragam DB=UI | `2424dfc` + P2-1 | `012_pricing_unify.sql`, `src/lib/billing/pricing.ts` | `pricing.test` 5 passed |
| F3 | RLS defense-in-depth | `23a8ae4` | `011_rls_hardening.sql`, `api/user/website/route.ts` filter ganda | `rls.test` 10 passed |
| F4 | Trial block 402 | `23a8ae4` | `limits.ts:isTrialExpired`, `trial-response.ts`, 2 route | `trial.test` 4 passed |
| F5 | Subdomain 1 generator + retry 3x | `7ea2489` + P2-2 | `lib/tenant/index.ts`, register, websites POST, auth Google | `tenant.test` 4 + `unique.test` 4 |
| F6 | Onboarding eksplisit per-website | `7ea2489` | `app/onboarding/page.tsx` via activate + PUT `[id]/website` | Manual 2 toko |
| F7 | Checklist benar | `7ea2489` | `activation-checklist.tsx` (`countProductItems`, verified, tenantUrl) | Manual |
| F8 | JWT refresh 10 mnt | `7ea2489` | `lib/auth/auth.ts` service-role via `active_website_id` | Manual ubah DB |
| F9 | DNS dinamis | `7ea2489` | `domain/page.tsx` pakai `dnsTarget()` | Manual |
| F10 | Forgot + reset end-to-end + RL | `30ecff2`, `8ead5b4` | `api/auth/forgot`, `(auth)/forgot`, `(auth)/reset-password` | Manual inbox |
| F11 | Cron domain 5 mnt | `30ecff2` | `vercel.json`, `domains/verify?secret=`, `CRON_DOMAIN.md` | curl 401/200 |
| F12 | Legal ID | `30ecff2` | `app/terms`, `app/privacy` | Klik signup |
| F13 | CI validate migrasi | `30ecff2` | `ci-cd.yml` job baru | CI hijau |
| F14 | Hygiene secret | `30ecff2`, `8ead5b4` | hapus `cookies.txt`, ignore `.opencode/`, kunci `pnpm-lock` | `git status` bersih |

## B. Phase 1 — Buktikan Uang (Must, 1–2 minggu, blokir iklan massal)

| ID | Pengembangan | Kenapa dulu | File disentuh | AC testable | Estimasi |
|---|---|---|---|---|---|
| N1 | Transaksi sandbox E2E + runbook prod | Tanpa ini semua teori | Supabase SQL Editor (`009..012`), Vercel env | Given key sandbox terisi, When bayar QRIS growth yearly, Then `GET /billing/status`=active + gross 2.388.000 | 2-4 jam |
| N2 | Notifikasi owner WA + email saat order | Owner buta = churn; janji 24 jam kosong | Baru `supabase/functions/notify-order/` atau `app/api/orders/notify/route.ts`, edit `app/api/orders/route.ts` POST, tambah `NOTIF_*` env | Given order baru, When insert sukses, Then owner terima WA <2 mnt (log + delivery id) | 2-4 hari |
| N3 | Decrement stok transaksional | Oversell tanpa ini | `app/api/orders/route.ts`, `app/api/user/products/route.ts`, migrasi `013_stock_rpc.sql` (function `decrement_stock`) | Given stok 5, When order 2, Then stok 3; stok 0 → tolak 409 | 1-2 hari |
| N4 | Halaman pembayaran gagal/sukses + retry | User bingung setelah bayar | Baru `app/billing/success/page.tsx`, `failed/page.tsx`, edit `billing-panel` redirect | Given webhook pending >15 mnt, When buka status, Then tombol retry muncul | 4-8 jam |

Alternatif ditolak: bangun payment gateway sendiri / QRIS manual — ditolak, cost PCI + rekonsiliasi 2-3 bulan vs Midtrans 3-5 hari.

## C. Phase 2 — Retensi & Operasional (Should, 2-4 minggu)

| ID | Pengembangan | File disentuh | AC | Estimasi |
|---|---|---|---|---|
| N5 | Rate-limit Redis (forgot + orders + checkout) | `api/auth/forgot`, `api/orders`, `api/billing/checkout`, baru `src/lib/rate/limit.ts` (Upstash) | Restart server → limit tetap; 6x forgot → 429 | 1-2 hari |
| N6 | RLS `plans` read-only + gabung `TIER_*` | `013_plans_rls.sql`, `src/types/index.ts`, `src/lib/billing/pricing.ts` | Anon SELECT plans langsung → 0 row; 1 konstanta harga | 2-4 jam |
| N7 | Retry-then-insert subdomain (tutup race TOCTOU) | `lib/tenant/index.ts`, 3 caller | 2 request bareng → 1 sukses 201, 1 retry suffix 201 (tanpa 500) | 4-8 jam |
| N8 | Export CSV/XLSX pesanan (janji Starter) | `app/api/orders/export/route.ts`, tombol di `dashboard/orders/page.tsx` | 1000 order → file <5 detik | 1-2 hari |
| N9 | Analytics real (omset + terlaris) ganti mock | `api/user/dashboard/route.ts` agregasi, `dashboard/analytics/page.tsx` | Angka = SUM orders DB, bukan mock | 2-3 hari |
| N10 | Customers real dari orders distinct | `dashboard/customers/page.tsx`, `api/customers/route.ts` baru | List = distinct customer per website | 1-2 hari |
| N11 | Kirim email SMTP verifikasi + template ID | Supabase Auth email template, `docs/EMAIL.md` | Email recovery masuk inbox <1 mnt, bukan spam | 4-8 jam |

## D. Phase 3 — Skala & Moat (Later, 1-3 bulan)

| ID | Pengembangan | Nilai | Estimasi |
|---|---|---|---|
| N12 | E2E Playwright (signup→bayar→order→status) di CI | Cegah regresi fencing 403/402 | 3-5 hari |
| N13 | Multi-staf RBAC (Growth 3 seat) — invitation + role owner/staff | Upsell Growth | 1-2 minggu |
| N14 | Payment gateway untuk buyer (bukan cuma owner): Midtrans Snap di storefront + `payment_status` paid | Naikkan konversi, komisi opsional | 1-2 minggu |
| N15 | Domain registrar API (bukan simulasi) via ResellerClub/ Rumahweb | Revenue baru | 2-4 minggu |
| N16 | Template custom Enterprise + API/webhook pesanan (`api-docs`) | Moat enterprise | 3-6 minggu |
| N17 | PWA toko + SEO lanjutan (sitemap per tenant, OG image) | Akuisisi organik | 1-2 minggu |

## E. Icebox (jangan sentuh sebelum N1 hijau)

| Ide | Alasan tunda |
|---|---|
| AI copywriting deskripsi produk | Cost LLM tanpa bukti willingness-to-pay |
| Mobile app native | PWA + WA cukup untuk UMKM |
| Bahasa Inggris penuh | Fokus ID dulu, `en` setengah malah bug |
| Marketplace template publik | Supply-side dingin |

## F. Ringkasan Estimasi

| Fase | Scope | Estimasi total |
|---|---|---|
| Phase 1 | N1–N4 | 1-2 minggu |
| Phase 2 | N5–N11 | 2-4 minggu |
| Phase 3 | N12–N17 | 1-3 bulan |

Estimasi range untuk tim 1-2 dev, belum termasuk QA prod + CS.

## G. Next Action (berurutan, masing-masing <4 jam)

- [ ] N1a: run `009..012` di Supabase prod — 30 mnt
- [ ] N1b: isi `MIDTRANS_SERVER_KEY`, `CRON_SECRET`, SMTP di Vercel — 30 mnt
- [ ] N1c: 1 transaksi sandbox → screenshot bukti — 1-2 jam
- [ ] N2a: daftar Fonnte/Wablas, isi `NOTIF_*` — 2 jam
- [ ] N2b: implement notify hook di `POST /orders` — 2-3 hari
