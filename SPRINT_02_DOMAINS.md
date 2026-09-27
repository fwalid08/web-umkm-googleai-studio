# Sprint 2: Custom Domain Real Registrar Integration
**Duration:** 2 weeks (10 working days)  
**Goal:** Replace simulated domain purchase with real registrar integration via switchable driver (Porkbun default, DomainNameAPI alternative), payment driver (Midtrans default, Xendit alternative), Vercel provisioning, and DNS verification.

> **Status dokumen:** direvisi pasca-review kesiapan (Sep 2026). Perubahan utama:
> driver registrar switchable (§2, §5), driver payment Midtrans+Xendit (§4.2),
> migrasi `020` (bukan 024) dengan backfill (§3), order_id + idempotency (§4.2),
> notifier port tanpa dependensi Sprint 3 (§7), cron UTC + secret (§8).

---

## 1. User Stories

| ID | Story | Points |
|----|-------|--------|
| US-2.1 | As a merchant, I want to search domain availability in real-time with real prices so I know what I can buy | 5 |
| US-2.2 | As a merchant, I want to purchase a domain via Midtrans (VA/QRIS/CC) and have it registered automatically | 8 |
| US-2.3 | As a merchant, I want my domain auto-connected to Vercel with correct DNS so my store works immediately | 5 |
| US-2.4 | As a merchant, I want DNS verification to happen automatically via cron so I don't need manual steps | 3 |
| US-2.5 | As a merchant, I want to see my domain orders, status, and renewal dates in dashboard | 3 |
| US-2.6 | As a system, I want to handle registrar webhooks/polling for domain lifecycle events | 5 |
| US-2.7 | As a merchant, I want renewal reminders (30/14/7/1 days) via WA/email so I don't lose my domain | 3 |

**Total: 32 points**

---

## 2. Registrar Driver (Switchable Provider)

Semua kode domain memakai interface `RegistrarProvider` (`src/lib/registrar/types.ts`).
Ganti provider **tanpa mengubah caller** — cukup env + kredensial:

```
REGISTRAR_PROVIDER=porkbun|domainnameapi|mock   (default: mock di dev, porkbun di prod)
```

| Provider | Kapan dipakai | Kredensial env |
|----------|---------------|----------------|
| **porkbun** (default) | Produksi umum; API JSON sederhana, `.com` murah | `PORKBUN_API_KEY`, `PORKBUN_API_SECRET` (+ `PORKBUN_API_URL` opsional) |
| **domainnameapi** | Butuh TLD `.id` native (`.co.id`, `.web.id`, `.biz.id`) + tier grosir reseller | `DOMAINNAMEAPI_*_RESELLER_ID` + `*_API_KEY` (varian `_OTE_` untuk sandbox; `DOMAINNAMEAPI_SANDBOX=false` untuk produksi) |
| **mock** | Dev/test tanpa kredensial; simulasi deterministik (konsisten dengan katalog UI). **Ditolak di production** | — |

Implementasi (sudah ada, jangan tulis ulang):

- `src/lib/registrar/types.ts` — interface `RegistrarProvider` + `REGISTRAR_PROVIDERS`
- `src/lib/registrar/porkbun.ts` — `PorkbunProvider` (harga USD → IDR via `domains/pricing`)
- `src/lib/registrar/domainnameapi.ts` — `DomainNameAPIProvider` (auth `resellerId+apiKey` di body; base prod `api.domainresellerapi.com/v1`, OT&E `ote.domainresellerapi.com/v1`)
- `src/lib/registrar/mock.ts` — `MockRegistrarProvider` (dev/test)
- `src/lib/registrar/factory.ts` — `getRegistrarProvider()` (singleton), `setRegistrarProvider()` (injeksi test), `resetRegistrarProvider()`, `createRegistrarProvider(config)`
- Test: `factory.test.ts`, `domainnameapi.test.ts`

Aturan driver:

1. Provider baru = implement `RegistrarProvider` + 1 case di `createRegistrarProvider()` (contoh: Niagahoster/IDCloudHost backlog).
2. Harga grosir USD **selalu** lewat `src/lib/domains/pricing.ts` (`wholesaleUsdToIdr`, `calcDomainPrice`) — jangan konversi manual di provider.
3. Semua method yang bisa gagal network return `{ success: false, error }` — **jangan throw** (kecuali kredensial hilang / `getDomainInfo`).

### Required DNS Records for Vercel

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 76.76.21.21 | 3600 |
| CNAME | www | cname.vercel-dns.com. | 3600 |
| TXT | _saas-verify | {verification_token} | 300 |

> Nilai ini didefinisikan sekali di `src/lib/domains/register.ts`
> (`VERCEL_DNS_A_VALUE`, `VERCEL_DNS_CNAME_VALUE`, `standardVercelDnsRecords()`) —
> dashboard dan orchestrator wajib pakai helper itu, bukan literal.

---

## 3. Database Migration (020_domain_orders_reconcile.sql)

> Nomor file = `020` (migrasi terakhir repo = `019`). Spec lama menulis `024` — salah, jangan dipakai.
> File sudah dibuat: `supabase/migrations/020_domain_orders_reconcile.sql` (idempoten, ada blok Down).

Poin penting (detail SQL lihat file migrasi):

1. **Backfill dulu, baru ganti constraint:** `pending_dokumen → registering` (`failed` dipertahankan).
2. **Enum baru:** `pending_payment, registering, active, failed, expired, deleted, transfer_in`.
3. **Kolom baru:** `registrar`, `registrar_domain_id`, `nameservers`, `dns_records`,
   `verification_token`, `auto_renew`, `renewal_reminder_sent_at`, `reseller_tier`,
   **`payment_reference` (UNIQUE partial — kunci idempotency webhook)**,
   `payment_provider`, `paid_at`.
4. **Index:** `expires_at` (partial active, untuk cron), `verification_token` (partial not null),
   `uq_domain_orders_payment_ref` (UNIQUE partial), `status`.
5. **RLS pola 011:** `domain_orders_owner_all` (`authenticated`, USING + WITH CHECK `user_id = auth.uid()`); tanpa policy anon.

```sql
-- Ringkasan (lihat file migrasi untuk versi lengkap + Down):
UPDATE domain_orders SET status = 'registering' WHERE status = 'pending_dokumen';
ALTER TABLE domain_orders DROP CONSTRAINT IF EXISTS domain_orders_status_check;
ALTER TABLE domain_orders ADD CONSTRAINT domain_orders_status_check CHECK (status IN (
  'pending_payment','registering','active','failed','expired','deleted','transfer_in'));
-- + ADD COLUMN IF NOT EXISTS ... + index + RLS (lihat file)
```

**Matriks transisi status (siapa boleh mengubah):**

| Dari → Ke | Pemicu |
|---|---|
| (baru) → `pending_payment` | `POST /api/domains/checkout` |
| `pending_payment` → `registering` | webhook `paid` |
| `pending_payment` → `expired` | webhook `canceled`/`failed` |
| `registering` → `active` | orchestrator sukses |
| `registering` → `failed` | orchestrator gagal 3x retry (kredit/manual, BUKAN auto-refund) |
| `active` → `expired` | cron melewati `expires_at` |
| `active` → `transfer_in` | transfer masuk dimulai |

---

## 4. API Contracts

### 4.1 Types (`src/types/domains.ts` — sudah dibuat)

`DomainSearchResult`, `DomainOrder`, `DomainStatus`, `DnsRecordEntry`,
`DomainCheckoutResponse`, plus zod boundary `domainCheckoutSchema` / `domainRenewSchema`.
Harga dalam **IDR utuh** (konsisten `docs/STOCK.md` F2-3).

```typescript
export interface DomainCheckoutResponse {
  provider: 'midtrans' | 'xendit' | 'mock'; // bukan snap-only
  order_id: string;      // prefix "domain-" (beda dari "umkm-" subscription)
  redirect_url: string;  // Snap redirect ATAU Xendit invoice URL
  token?: string;        // Snap token (midtrans) / invoice id (xendit)
  gross_amount: number;  // IDR utuh
  mock: boolean;
}
```

### 4.2 Endpoints

> **Payment driver** (`src/lib/payments/`): `PAYMENT_PROVIDER=midtrans|xendit|mock`
> (default midtrans). Route checkout/webhook **wajib** lewat driver
> (`getPaymentProvider()`), bukan fetch Midtrans langsung — lihat
> `src/lib/payments/{types,midtrans,xendit,factory}.ts` + test.
> Aturan keras: webhook **selalu** `verifyWebhook()` + cek idempotency
> (`paid_at`/status) sebelum update DB; `payment_reference` UNIQUE (§3).

#### GET `/api/domains/search?q=tokoku`
```
Response: { success: true, data: { results: DomainSearchResult[], sandbox: boolean } }
- Real-time via registrar driver (getRegistrarProvider().checkAvailability)
- Cache hasil 5 menit (Upstash bila ada, fallback in-memory — tiru src/lib/rate/limit.ts)
- Fallback harga katalog bila API down + flag warning "estimasi"
- Harga jual via calcDomainPrice() (USD wholesale → IDR kurs env + margin % + fee flat)
- Rate limit: 30 req/menit/user (checkRateLimit)
```

#### POST `/api/domains/checkout`
```
Body: { domain: "tokoku.com", cycle: "yearly" }  (domainCheckoutSchema)
Response: { success: true, data: DomainCheckoutResponse }
Flow:
1. Auth + checkCustomDomainLimit(userId, tier) → 403 + upgrade_url bila Free
2. Re-check availability via registrar driver (tolak bila sudah laku)
3. Hitung harga via calcDomainPrice()
4. order_id = buildDomainOrderId(userId)  // prefix "domain-", unik, terpisah dari "umkm-"
5. Insert domain_orders: status=pending_payment, payment_reference=order_id,
   payment_provider, registrar=provider aktif, sandbox=isTest
6. paymentProvider.createTransaction({ orderId, grossAmount, itemName }) → Midtrans Snap / Xendit invoice
7. Return provider + redirect_url + token
```

#### POST `/api/domains/webhook` (callback Midtrans/Xendit)
```
Verifikasi: midtrans → sha512(order_id+status_code+gross_amount+SERVER_KEY);
            xendit → header x-callback-token === XENDIT_CALLBACK_TOKEN (fail-closed).
Flow:
1. verifyWebhook() → 403 bila signature/token invalid (jangan proses)
2. parseNotification() → status ternormalisasi (paid/pending/challenged/failed/canceled)
3. Lookup domain_orders by payment_reference; bila tidak ada → 200 + log (agar gateway tidak retry)
4. Idempotency: bila status=active && paid_at → return deduped:true
5. paid → update status=registering, paid_at=now → panggil processDomainRegistration(orderId)
   (orchestrator yang mengubah ke active; webhook JANGAN langsung active)
6. challenged (CC) → biarkan pending_payment, tandai untuk review
7. canceled/failed → status=expired (tidak ada aksi registrar)
8. unknown → log + 200, jangan ubah status
KEBIJAKAN REFUND: tidak ada auto-refund. Bila paid tapi register gagal 3x
(1m, 5m, 15m) → status=failed + notifikasi support + kredit manual.
```

#### GET `/api/domains/orders`
```
Response: { success: true, data: { orders: DomainOrder[] } }
```

#### POST `/api/domains/renew/:id`
```
Body: { cycle: "yearly" }  (domainRenewSchema)
Flow: gate limit → buat payment baru (order_id domain baru) → webhook paid →
      registrar.renewDomain() → expires_at += 1 tahun
```

---

## 5. Registrar Client — Pakai Driver (§2), Jangan Duplikasi

Contoh pemakaian di route (jangan tulis client baru):

```typescript
import { getRegistrarProvider } from '@/lib/registrar/factory';
import { calcDomainPrice } from '@/lib/domains/pricing';

// Search: availability + harga jual
const registrar = getRegistrarProvider(); // porkbun | domainnameapi | mock via env
const check = await registrar.checkAvailability('tokoku.com');
const price = calcDomainPrice(check.wholesaleUsd ?? 0); // bila provider kirim USD

// Webhook paid → orchestrator (src/lib/domains/register.ts) yang memanggil
// registrar.registerDomain() + setDnsRecords() — route JANGAN panggil langsung.
```

> Spec lama memuat dump class `DomainNameAPIClient` ~100 baris — **dihapus**,
> sudah diimplementasikan sebagai `DomainNameAPIProvider`
> (`src/lib/registrar/domainnameapi.ts`) dengan test (`domainnameapi.test.ts`).

---

## 6. Vercel Integration (`src/lib/vercel/domains.ts` — sudah dibuat)

`addDomainToVercel()` (409 = ok/idempoten), `verifyDomainOnVercel()`,
`removeDomainFromVercel()` — typed result `{ ok, error? }`, tidak throw untuk
error API. Auth `VERCEL_TOKEN` (+ `VERCEL_TEAM_ID` opsional). Test: `domains.test.ts`.

### Required Env Vars (lihat `.env.example` untuk daftar lengkap)
```
# Registrar driver
REGISTRAR_PROVIDER=porkbun|domainnameapi|mock
PORKBUN_API_KEY= / PORKBUN_API_SECRET= / PORKBUN_API_URL= (opsional)
DOMAINNAMEAPI_SANDBOX=true|false
DOMAINNAMEAPI_RESELLER_ID= / DOMAINNAMEAPI_API_KEY=
DOMAINNAMEAPI_OTE_RESELLER_ID= / DOMAINNAMEAPI_OTE_API_KEY=
DEFAULT_NAMESERVERS= (opsional, koma-separated)
# Vercel
VERCEL_TOKEN=vercel_xxx
VERCEL_TEAM_ID=team_xxx
# Payment driver
PAYMENT_PROVIDER=midtrans|xendit|mock
MIDTRANS_SERVER_KEY=SB-Mid-server-xxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxx
MIDTRANS_IS_PRODUCTION=false
XENDIT_SECRET_KEY=xnd_production_xxx
XENDIT_CALLBACK_TOKEN=callback_xxx
# Harga domain (lihat src/lib/domains/pricing.ts)
USD_TO_IDR_RATE=15500
DOMAIN_PRICE_MARGIN_PERCENT=20
DOMAIN_GATEWAY_FEE_FLAT=4000
```

---

## 7. Domain Registration Orchestrator (`src/lib/domains/register.ts` — sudah dibuat)

`processDomainRegistration(orderId, deps?)` — dipakai webhook setelah `paid`.
Idempoten (order `active` → return langsung, aman untuk retry webhook).
Dependensi di-inject (`registrar`, `addToVercel`, `notifier`, `verificationToken`)
sehingga bisa di-test tanpa network/DB.

> **Tidak ada** import `@/lib/notify/dispatcher` (Sprint 3). Notifikasi lewat
> port `DomainNotifier` (default `logDomainNotifier`: log server). Sprint 3
> mengganti implementasi port tanpa mengubah orchestrator ini.

Alur: ambil order (harus `registering`) → `registrar.registerDomain()` →
`setDnsRecords()` (A/CNAME/TXT via `standardVercelDnsRecords()`) → update
`domain_orders` → `active` → Vercel add (best-effort, gagal → warn + cron retry) →
set `websites.custom_domain` + token (`verified=false`; cron verify yang
mengaktifkan) → `notifier.domainRegistered()`. Gagal → `notifier.domainFailed()`
+ throw (caller retry 1m/5m/15m; 3x → `failed`).

---

## 8. Cron Jobs (jadwal UTC di `vercel.json`; WIB = UTC+7)

Auth semua cron: header `x-cron-secret: CRON_SECRET` atau `?secret=CRON_SECRET`
(Vercel Cron tidak support custom header — pola yang sama dengan `/api/domains/verify`).

### 8.1 DNS Verification Cron (Enhanced, sudah ada — tingkatkan)
**Schedule:** Every 5 minutes (`*/5 * * * *`)
**Endpoint:** `POST /api/domains/verify`
**Tambahan Sprint 2:**
1. Setelah TXT cocok → panggil `verifyDomainOnVercel()` (sekarang masih comment)
2. Update `domain_orders`: `verification_token=null` bila website terverifikasi
3. Retry Vercel add untuk order `active` yang belum terdaftar (best-effort)

### 8.2 Renewal Reminder Cron (baru)
**Schedule:** Daily 09:00 WIB = **02:00 UTC** (`0 2 * * *`)
**Endpoint:** `POST /api/domains/renewal-reminders`
**Logic:**
1. Fetch order `active` expiring dalam 30/14/7/1 hari
2. Cek `renewal_reminder_sent_at` per interval (jangan spam tiap hari)
3. Kirim via `DomainNotifier` port (log dulu; WA/email penuh di Sprint 3)
4. Update `renewal_reminder_sent_at`

### 8.3 Auto-Renewal Cron (baru)
**Schedule:** Daily 02:00 WIB = **19:00 UTC** (`0 19 * * *`)
**Endpoint:** `POST /api/domains/auto-renew`
**Logic:**
1. Fetch order `active` + `auto_renew=true` expiring ≤ 14 hari
2. Cek saldo reseller via registrar (bila provider support; bila tidak → skip + alert)
3. Buat payment via **payment driver** (bukan Midtrans langsung)
4. Webhook `paid` → `registrar.renewDomain()` → `expires_at` += 1 tahun

---

## 9. UI Specification (update dari versi simulasi)

Halaman existing `app/dashboard/domain/page.tsx` (simulasi: `POST /api/domains/order`
langsung aktif) **wajib direfactor**:

### 9.1 Domain Search Page (`/dashboard/domain/page.tsx`)
```
- Search input: debounce 300ms → GET /api/domains/search (tambah skeleton + badge premium)
- Kolom hasil: Domain | TLD | Status | Harga/Tahun (formatIdr) | [Beli]
- "Tidak tersedia" greyed out; premium badge; warning "estimasi" bila fallback katalog
- Rate-limit 429 → toast "Terlalu sering, coba lagi"
```

### 9.2 Domain Checkout Flow (baru — ganti buyDomain langsung)
```
1. Klik "Beli" → POST /api/domains/checkout → redirect ke redirect_url
   (Midtrans Snap ATAU Xendit invoice — jangan hardcode Snap)
2. Sukses bayar → redirect /billing/domain-success?order_id=domain-... (polling /api/domains/orders)
3. status=registering → "Domain sedang didaftarkan..."
4. status=active → "Domain aktif & tersambung!" + DNS dari standardVercelDnsRecords()
5. status=failed → "Pendaftaran gagal, tim support dihubungi" (tanpa janji refund otomatis)
```

### 9.3 Domain Orders Page (`/dashboard/settings/domains` atau tab di /dashboard/domain)
```
Table: Domain | Status | Harga/Tahun | Berlaku Hingga | Auto-renew | Aksi
Actions: Perpanjang, Matikan Auto-renew, Lihat DNS, Hapus (jika expired)
Free tier: banner "Custom domain tersedia di Starter+" (checkCustomDomainLimit)
```

---

## 10. Task Breakdown (revisi — driver + payment + sunset simulasi)

| Task | File(s) | Estimate | Status |
|------|---------|----------|--------|
| 0. DONE: registrar driver + DomainNameAPI + mock + factory + test | `src/lib/registrar/*` | — | ✅ Selesai |
| 0. DONE: payment driver Midtrans+Xendit+mock + test | `src/lib/payments/*` | — | ✅ Selesai |
| 0. DONE: migrasi 020 + RLS + index | `supabase/migrations/020_domain_orders_reconcile.sql` | — | ✅ Selesai |
| 0. DONE: hapus `trialing` (checkout/register/status/webhook/type) | `app/api/...`, `src/types/index.ts` | — | ✅ Selesai |
| 0. DONE: `checkCustomDomainLimit` + `getTierLimits` | `src/lib/billing/limits.ts` | — | ✅ Selesai |
| 0. DONE: Vercel client + test | `src/lib/vercel/domains.ts` | — | ✅ Selesai |
| 0. DONE: orchestrator + notifier port | `src/lib/domains/register.ts` | — | ✅ Selesai |
| 0. DONE: pricing + types + env + vercel.json cron | `src/lib/domains/pricing.ts`, `src/types/domains.ts`, `.env.example` | — | ✅ Selesai |
| 1. Jalankan migrasi 020 staging + verifikasi checklist | Supabase Dashboard > SQL Editor | 1h | TODO |
| 2. Domain search API (driver + cache 5m + rate limit + zod) | `app/api/domains/search/route.ts` (refactor) | 3h | TODO |
| 3. Domain checkout API (gate limit + driver payment) | `app/api/domains/checkout/route.ts` (baru) | 4h | TODO |
| 4. Domain webhook (verify + idempotency + orchestrator) | `app/api/domains/webhook/route.ts` (baru) | 5h | TODO |
| 5. Domain orders + renew API | `app/api/domains/orders/route.ts`, `renew/[id]/route.ts` (baru) | 3h | TODO |
| 6. DNS verify cron: Vercel verify + token null + retry add | `app/api/domains/verify/route.ts` (refactor) | 2h | TODO |
| 7. Renewal reminder cron | `app/api/domains/renewal-reminders/route.ts` (baru) | 3h | TODO |
| 8. Auto-renewal cron | `app/api/domains/auto-renew/route.ts` (baru) | 4h | TODO |
| 9. Refactor domain UI → Snap/invoice flow + polling | `app/dashboard/domain/page.tsx` | 4h | TODO |
| 10. Domain orders UI + success page | `app/dashboard/settings/domains/page.tsx`, `app/billing/domain-success/page.tsx` | 4h | TODO |
| 11. Sunset `/api/domains/order` simulasi (hapus setelah UI pindah) | `app/api/domains/order/route.ts` | 1h | TODO |
| 12. Integration testing (sandbox registrar → staging) | Manual + script | 4h | TODO |
| 13. RLS test checklist (user A vs B) + rate limit test | Manual | 2h | TODO |

**Sisa: ~40 jam (~5–6 hari + buffer).**

Entry criteria (jangan mulai Task 1–13 sebelum ini):
- [ ] Migrasi 001..020 jalan berurutan di staging (termasuk **015 hapus trial** — checkout Sprint 2 menulis `incomplete` yang hanya valid pasca-015; forward-fix login di `src/lib/auth/auth.ts` sudah masuk)
- [ ] Keputusan provider awal: Porkbun atau DomainNameAPI (env staging diset)
- [ ] Kredensial sandbox staging terisi + saldo test cukup
- [ ] `pnpm typecheck && pnpm lint && pnpm test` hijau di main

---

## 11. Acceptance Criteria

- [ ] Domain search returns real availability + price in < 2s (cached) via driver aktif
- [ ] Ganti `REGISTRAR_PROVIDER` porkbun↔domainnameapi↔mock tanpa ubah route (smoke search)
- [ ] Ganti `PAYMENT_PROVIDER` midtrans↔xendit tanpa ubah route (checkout sandbox keduanya)
- [ ] Purchase flow: payment paid → `registering` → register → Vercel add → DNS → `active` in < 60s
- [ ] Webhook retry (kirim ulang notifikasi sama) → `deduped:true`, tidak ada double-register
- [ ] Webhook signature/token invalid → 403, tidak ada perubahan DB
- [ ] DNS verification cron works: TXT record checked, website updated, Vercel verified
- [ ] Renewal reminders sent at T-30, T-14, T-7, T-1 (cek `renewal_reminder_sent_at`, anti-spam)
- [ ] Auto-renewal processes payment + extends domain via registrar driver
- [ ] Dashboard shows correct status, DNS records, expiry
- [ ] Free tier users blocked from custom domain checkout (403 + upgrade prompt)
- [ ] Sandbox mode works (mock tanpa kredensial; OT&E/sandbox provider dengan kredensial test)
- [ ] All API endpoints have RLS + rate limiting + zod boundary
- [ ] Registrar fails after payment → retry 3x → `failed` + support notified (TANPA janji auto-refund; kredit manual)
- [ ] .id TLDs: `requirement` tampil di UI sebelum checkout; TLD `buyable=false` tidak bisa checkout (422)
- [ ] Pricing IDR via `calcDomainPrice()` (kurs env + margin + fee), dibulatkan ke 500

---

## 12. Error Handling & Edge Cases

| Scenario | Handling |
|----------|----------|
| Registrar API down | Cache harga/avail terakhir 5m; UI warning "estimasi"; checkout diblokir bila re-check gagal |
| Payment paid tapi register gagal | Retry 3x (1m, 5m, 15m); gagal → `failed` + notifikasi support + kredit manual. **Tidak ada auto-refund** (Snap/Xendit refund manual via dashboard) |
| Vercel domain add fails | Best-effort + warn log; verify cron retry; domain tetap jalan via DNS |
| DNS verification never passes | Setelah 7 hari → email support; intervensi manual |
| Domain transfer in | EPP code → `transferDomain()` driver → DNS sama; status `transfer_in` |
| Premium domain pricing | Tampilkan `premium_price`; konfirmasi sebelum checkout |
| Insufficient reseller balance | Cek saldo sebelum register (bila provider support); alert "Top up reseller account" |
| .id TLD requirements (KTP/SIUP) | Tampilkan `requirement` di UI; `buyable=false` → 422 (validasi dokumen manual, bukan via API) |
| Webhook dobel / replay attack | `verifyWebhook()` + UNIQUE `payment_reference` + cek `paid_at` (deduped) |
| Provider switch tengah jalan | Order lama tetap pakai `registrar`/`payment_provider` yang tercatat di barisnya |

---

## 13. Testing Checklist

- [ ] Search `example.com` → available, harga = `calcDomainPrice()` (cek breakdown)
- [ ] Search `google.com` → unavailable
- [ ] `REGISTRAR_PROVIDER` switch porkbun/domainnameapi/mock tanpa ubah kode
- [ ] `PAYMENT_PROVIDER` switch midtrans/xendit/mock (sandbox) tanpa ubah kode
- [ ] Purchase `.com` via payment sandbox → terdaftar di registrar sandbox
- [ ] Webhook retry → `deduped:true`, tidak double-register
- [ ] Webhook signature/token salah → 403, DB tidak berubah
- [ ] DNS records created: A, CNAME, TXT (via `standardVercelDnsRecords()`)
- [ ] Vercel domain added + verified
- [ ] Public site accessible via custom domain
- [ ] Renewal reminder tercatat (`renewal_reminder_sent_at`), tidak spam harian
- [ ] Auto-renew extends expiry date via registrar driver
- [ ] Expired domain → status=expired, website falls back to subdomain
- [ ] RLS: user A tidak bisa baca/ubah `domain_orders` user B (manual SQL checklist §020)
- [ ] `.co.id` / `.web.id`: requirement tampil, `buyable=false` → 422 bila dipaksa

---

## 14. Rollback Plan

1. Provider switch instan: `REGISTRAR_PROVIDER=mock` → search/order kembali simulasi
   (tanpa revert kode). Sama untuk payment: `PAYMENT_PROVIDER=mock`.
2. Revert migrasi 020 → jalankan blok Down di file migrasi (kembalikan enum 008).
3. Route simulasi lama `/api/domains/order` dipertahankan sampai Task 11 selesai.
4. DNS verification cron tetap jalan untuk domain existing (independen dari provider).

---

## 15. Provider Account Setup Checklist

### Porkbun
- [ ] Buat akun + dapatkan API key/secret (Account → API Access)
- [ ] (Opsional) `PORKBUN_API_URL` override untuk test
- [ ] Set `DEFAULT_NAMESERVERS` bila tidak pakai default Vercel
- [ ] Test staging: search → checkout mock payment → register → DNS → Vercel

### DomainNameAPI
- [ ] Register reseller di `https://dm.apiname.com/Account/Register`, verifikasi email
- [ ] Ambil **Production** Reseller ID + API Key (bagian Integration)
- [ ] Ambil **OT&E** Reseller ID + API Key untuk testing
- [ ] Tambah kredit/deposit untuk registrasi domain
- [ ] Test OT&E: search → register → DNS → renew (`DOMAINNAMEAPI_SANDBOX=true`)
- [ ] Produksi: `DOMAINNAMEAPI_SANDBOX=false` + kredensial produksi

### Payment (Midtrans + Xendit)
- [ ] Midtrans: server/client key sandbox → test Snap → webhook `paid` terverifikasi
- [ ] Xendit: secret key + callback token → test invoice → callback terverifikasi
- [ ] Produksi: `MIDTRANS_IS_PRODUCTION=true` / Xendit live key; callback URL terdaftar di dashboard masing-masing