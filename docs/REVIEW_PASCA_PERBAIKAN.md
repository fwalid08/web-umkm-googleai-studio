# Dokumentasi Review Pasca-Perbaikan — UMKM SaaS
Tanggal: 2026-09-26 | Skor: 8.5/10 demo, 7/10 production | Tree: bersih | Typecheck: 0 error | Test: 12 files, 51 passed

## 1. Ringkasan Eksekutif

| Aspek | Sebelum | Sesudah | Bukti |
|---|---|---|---|
| Upgrade bayar | Tombol selalu 403 | Checkout Midtrans + webhook aktifkan tier | `app/api/billing/checkout`, `webhook`, `status` |
| Trial expired | Cuma banner | Block 402 tulis/buat | `trialBlockResponse` di 2 route |
| Subdomain | 3 generator (`tenant-uuid`, `toko-rand`, `tenant-uuid`) | 1 `generateSubdomain()` + retry 3x | `src/lib/tenant/index.ts` |
| Onboarding | Template bisa masuk toko salah | Activate eksplisit + PUT per-ID | `app/onboarding/page.tsx:91-92` |
| Checklist | Deteksi produk & domain salah, share copy origin | `countProductItems`, cek `custom_verified`, share `tenantUrl` | `activation-checklist.tsx:62,68,113` |
| Session | JWT basi 30 hari | Refresh 10 mnt dari `active_website_id` | `auth.ts:176 lastRefresh` |
| Lupa password | Tidak ada | `/forgot` + `/reset-password` + rate-limit | `api/auth/forgot`, `(auth)/reset-password` |
| Pricing | DB vs UI beda (growth 299k vs 249k) | Seragam ke UI via `012` + `lib/billing/pricing.ts` | `012_pricing_unify.sql` |
| RLS | Tanpa WITH CHECK, 1 query tanpa filter user | Hardening + `rls.test` 10 test | `011_rls_hardening.sql` |
| CI/ops | Tanpa validasi migrasi, tanpa cron doc | Job validate + `vercel.json` cron + `docs/CRON_DOMAIN.md` | `ci-cd.yml`, `vercel.json` |

## 2. Workflow End-to-End

| # | Workflow | Route / File | Auth | Status | Catatan |
|---|---|---|---|---|---|
| W1 | Daftar credentials | `POST /api/auth/register` | Publik | ✅ Baik | Auto `users+websites+subscriptions(trialing)`, clash retry |
| W2 | Daftar Google | NextAuth `signIn` callback | Publik | ✅ Baik | Auto-create + website, tolak email unverified |
| W3 | Login | `POST /api/auth/[...nextauth]` Credentials | Publik | ✅ Baik | JWT + refresh 10 mnt |
| W4 | Lupa password | `POST /api/auth/forgot` | Publik, rate-limit 5/email 20/IP per jam | ✅ Baik | Anti-enumerasi, kirim via SMTP Supabase |
| W5 | Reset password | `/reset-password?code=` exchangeCode + updateUser | Publik (token) | ✅ Baik | Perlu Redirect URL di Supabase Dashboard |
| W6 | Onboarding 3-step | `/onboarding` → activate + PUT website | Login | ✅ Baik | Eksplisit per-website |
| W7 | Kelola website | `GET/POST /api/websites`, `PATCH/DELETE /api/websites/[id]`, `POST .../activate` | Login, limit plan + block trial 402 | ✅ Baik | Max: free 1, starter 3, growth 10, enterprise 999 |
| W8 | Builder simpan | `GET/PUT /api/user/website`, `PUT /api/websites/[id]/website` | Login, whitelist section + tier gating + 402 | ✅ Baik | Free max 5 produk, template lock 403 + upgrade_url |
| W9 | Toko publik | `/` via `proxy.ts` + `getTenantSite()` | Publik | ✅ Baik | Subdomain + custom domain verified, SEO dinamis |
| W10 | Guest checkout | `POST /api/orders` | Publik, rate-limit IP | ✅ Baik | `calcTotal` server-side, resolve tenant server-side |
| W11 | Kelola order | `GET /api/orders`, `PATCH /api/orders/[id]/status` | Login, isolasi website aktif | ⚠️ Cukup | Notifikasi owner masih `console.log`, tanpa stok decrement |
| W12 | Dashboard | `/dashboard` + `/api/user/dashboard` | Login | ✅ Baik | Trial banner, checklist, metrik, WA share |
| W13 | Checkout bayar | `POST /api/billing/checkout` | Login | ⚠️ Teori | Mock tanpa key; Snap asli perlu key + migrasi prod |
| W14 | Webhook bayar | `POST /api/billing/webhook` | Publik (signature sha512) | ⚠️ Teori | Idempoten, belum ada transaksi nyata |
| W15 | Custom domain | `PUT /api/user/custom-domain`, `POST /api/domains/verify` (cron 5 mnt) | Login / CRON_SECRET | ✅ Baik | TXT `_saas-verify`, CNAME `dnsTarget()`, terima `?secret=` |
| W16 | Beli domain | `GET /api/domains/search`, `POST /api/domains/order` | Login | ⚠️ Simulasi | Katalog mock, bukan registrar beneran |

## 3. Kontrak API (27 routes)

| Method & Path | Auth | Fungsi | Gagal → |
|---|---|---|---|
| `POST /api/auth/register` | — | Buat auth user + profile + website + subscription trialing | 400 validasi, 409 email ada, 500 + cleanup |
| `POST /api/auth/[...nextauth]` | — | Login credentials/Google → JWT | redirect `/signin` |
| `POST /api/auth/forgot` | RL | Kirim email recovery | 400 email, 429 over-limit, else selalu 200 generik |
| `POST /api/auth/demo-login` | dev only | Login akun demo instan | 403 di prod |
| `POST /api/auth/demo-logout` | — | Hapus cookie demo | 200 |
| `GET /api/websites` | JWT | List + active + count/max | 401 |
| `POST /api/websites` | JWT | Buat website (limit + 402 trial) | 400 zod, 402 trial, 403 limit |
| `PATCH /api/websites/[websiteId]` | JWT owner | Rename/biz type | 403 bukan owner, 404 |
| `DELETE /api/websites/[websiteId]` | JWT owner | Hapus (cascade) | 403/404 |
| `POST /api/websites/[websiteId]/activate` | JWT owner | Set aktif | 403/404 |
| `GET /api/websites/[websiteId]/website` | JWT owner | Config merged website tsb | 404 template |
| `PUT /api/websites/[websiteId]/website` | JWT owner | Simpan config (dipakai onboarding) | 400/402/403/404 |
| `GET /api/user/website` | JWT | Config website aktif | 404 belum ada |
| `PUT /api/user/website` | JWT | Simpan config aktif (402 trial) | 400/402/403/404 |
| `GET /api/user/plan` | JWT | Tier + max + trial | 401 |
| `POST /api/user/plan` | JWT | Downgrade free / demo mock (bayar ditolak 403) | 403 upgrade via payment |
| `GET /api/user/dashboard` | JWT | Metrik + recent orders website aktif | 401/404 |
| `GET /api/user/domain-status` | JWT | Subdomain + custom + status | 401 |
| `PUT /api/user/subdomain` | JWT | Ganti subdomain (valid + unik) | 400/409 clash |
| `PUT /api/user/custom-domain` | JWT | Simpan domain + keluarkan TXT/CNAME | 400 format, 403 tier free |
| `GET /api/user/products` | JWT | List produk (paginasi) | 401 |
| `POST /api/orders` | — RL | Guest checkout → order `baru` | 400/404 toko/429 |
| `GET /api/orders` | JWT | List + filter + search + pagination per website | 401/404 |
| `PATCH /api/orders/[id]/status` | JWT owner | `baru→konfirmasi→dikirim→selesai` | 400 transisi, 403/404 |
| `GET /api/templates`, `GET /api/templates/[id]` | JWT/publik | Katalog + `locked` per tier | 404 |
| `POST /api/billing/checkout` | JWT | Buat transaksi (mock/snap) | 400 tier free, 401 |
| `POST /api/billing/webhook` | signature | Aktifkan tier (idempoten) | 403 signature, 200 deduped |
| `GET /api/billing/status` | JWT | Tier + status + periode | 401 |
| `POST /api/domains/verify` | CRON_SECRET | Cek TXT Cloudflare DoH, tandai verified | 401 |
| `GET /api/domains/search`, `POST /api/domains/order` | JWT | Simulasi cari/beli domain | 400 |

RL = rate-limit. JWT = NextAuth session.

## 4. Migrasi DB (001..012, berurutan via SQL Editor)

| File | Isi | Idempoten |
|---|---|---|
| `001_initial_schema` | users, templates, orders, subscriptions, user_templates + RLS + index + trigger | Ya |
| `002_seed_templates` | 5 template (food, fashion, handicraft, retail, services) | Ya |
| `003_google_auth` | `auth_provider, google_id, avatar_url` | Ya |
| `004_fix_rls_insert` | Policy INSERT users/subscriptions + trigger orders | Ya |
| `005_orders_hardening` | Index + constraint orders | Ya |
| `006_multi_website` | `plans`, `websites`, `website_id` di orders/templates, backfill | Ya |
| `007_pricing_revision` | Starter max 2→3 (harga lama) | Ya |
| `008_domain_orders` | Tabel order domain | Ya |
| `009_domain_verification_token` | Kolom token verifikasi | Ya |
| `010_billing_gateway` | `subscriptions.snap_token, paid_at, billing_cycle` + index | Ya |
| `011_rls_hardening` | WITH CHECK + owner-only orders/templates/websites | Ya |
| `012_pricing_unify` | Harga final + `plans.price_yearly_monthly` | Ya |

## 5. Pricing Final (sumber: `012` = `billing-panel` = `lib/billing`)

| Tier | Bulanan | Tahunan/bln (hemat 20%) | Website | Produk | Template | Domain sendiri |
|---|---|---|---|---|---|---|
| Free | Rp 0 | Rp 0 | 1 | 5 | 3 (food, fashion, retail) | Tidak |
| Starter | Rp 99.000 | Rp 79.000 | 3 | Unlimited | 5 semua | Ya |
| Growth | Rp 249.000 | Rp 199.000 | 10 | Unlimited | 5 semua | Ya |
| Enterprise | Rp 599.000 | Rp 479.000 | 999 | Unlimited | 5 + custom | Ya |

Komisi transaksi 0% semua tier. Trial 14 hari tanpa kartu.

## 6. Log Defect → Fix → Commit

| Defect | Fix | Commit | Test |
|---|---|---|---|
| Upgrade 403 permanen | checkout + webhook + status | `2424dfc` | manual mock/snap |
| Harga 3 versi | `012` + `pricing.ts` | `2424dfc` + P2-1 | `pricing.test` 5 |
| RLS tanpa CHECK | `011` + filter ganda | `23a8ae4` | `rls.test` 10 |
| Trial tanpa block | `isTrialExpired` + 402 | `23a8ae4` | `trial.test` 4 |
| Subdomain 3 format | `generateSubdomain` | `7ea2489` | `tenant.test` 4 |
| Clash single-shot | `ensureUniqueSubdomain` 3x | P2-2 | `unique.test` 4 |
| Onboarding salah toko | activate + PUT per-ID | `7ea2489` | manual 2 toko |
| Checklist salah | `countProductItems` + verified + tenantUrl | `7ea2489` | manual |
| JWT basi | refresh 10 mnt | `7ea2489` | manual ubah DB |
| DNS hardcode | `dnsTarget()` dinamis | `7ea2489` | manual |
| Tanpa forgot/reset | route + 2 halaman + RL | `30ecff2`, `8ead5b4` | manual inbox |
| Tanpa cron doc | `vercel.json` + `CRON_DOMAIN.md` + `?secret=` | `30ecff2` | curl 401/200 |
| Tanpa legal | `/terms` `/privacy` ID | `30ecff2` | klik signup |
| Tanpa validasi migrasi | CI job `validate-migrations` | `30ecff2` | CI |
| Secret terkomit | hapus `cookies.txt`, ignore `.opencode/` | `30ecff2`, `8ead5b4` | `git status` bersih |

## 7. Cakupan Test (51 passed, 12 files)

| File | Jumlah | Area |
|---|---|---|
| `rls.test` | 10 | resolve limit + owner-scoping statis + migrasi 011 |
| `validation.test` (orders) | 7 | calcTotal + rate-limit |
| `pricing.test` | 5 | mapping harga + yearly x12 + limit |
| `trial.test` | 4 | aktif/expired/null/berbayar |
| `unique.test` | 4 | retry clash + fail-open |
| `tenant.test` | 4 | validasi + host parsing |
| `validation.test` (builder) | 4 | merge whitelist + required |
| `urls.test` | 4 | tenantUrl + protocol |
| `limits.test` | 3 | resolveMaxWebsites |
| `catalog.test` | 3 | domain mock |
| `status.test` | 2 | website status |
| `parity.test` | 1 | i18n id/en |

Belum ada: E2E Playwright, test webhook signature live, test SMTP.

## 8. Sisa Gap + Prioritas

| # | Gap | Dampak | Prioritas | Estimasi |
|---|---|---|---|---|
| G1 | Transaksi nyata belum pernah sukses di prod | Revenue unproven | P0 | 2-4 jam |
| G2 | Notifikasi owner cuma log | Telat respon | P1 | 2-4 hari |
| G3 | Rate-limit in-memory | Hilang saat restart | P1 | 1-2 hari (Redis) |
| G4 | Race subdomain TOCTOU | 500 sesekali | P2 | 4-8 jam |
| G5 | `plans` tanpa RLS | Bocor strategi harga | P2 | 2-4 jam |
| G6 | `TIER_*` duplikat 2 file | Drift | P2 | 2 jam |
| G7 | Analytics/customers mock | Overpromise | P2 | 3-5 hari |

## 9. Runbook Operasional

| Tugas | Perintah / Lokasi |
|---|---|
| Migrasi prod | Supabase Dashboard → SQL Editor → run `009..012` berurutan → `SELECT slug,price_monthly,price_yearly_monthly FROM plans` |
| Env Vercel | `MIDTRANS_SERVER_KEY`, `CRON_SECRET`, `NEXT_PUBLIC_ROOT_DOMAIN`, `ALLOW_DEMO_AUTH=false`, SMTP Supabase |
| Redirect Auth | Supabase Auth → URL Configuration → Redirect: `<APP_URL>/reset-password`, `<APP_URL>/signin` |
| Test billing mock | Kosongkan key → `/billing` → Starter → sukses + row `trialing` |
| Test webhook | `POST /api/billing/webhook` payload valid → tier active; replay → deduped |
| Test trial | `UPDATE users SET tier='free', trial_ends_at=now()-interval'1 day'` → PUT expect 402 |
| Test cron | `curl -X POST .../verify` → 401; + header/`?secret=` → 200 |
| CI | Push → Actions: validate-migrations → lint → typecheck → test → build → Vercel |

## 10. Next Action

- [ ] Run migrasi prod + isi env (manual, di luar git)
- [ ] 1 transaksi sandbox sukses (garis lulus production)
- [ ] Must-2 notifikasi WA owner
