# Planning Template & Module — Website Builder SaaS UMKM

> **Status:** Fase 0 SELESAI (2026-10-07) — Struktur module terisolasi, DAG resolver, site-type registry, entitlements engine implemented.
> **Tanggal:** 2026-10-05 (dimutakhirkan 2026-10-07: struktur module folder-based §13 dikunci).
> **Ruang lingkup sesi:** online_shop dulu; blog/booking/sekolah ditunda; payment buyer manual dulu.
> **Keputusan kunci:** template terikat `site_type`; fitur dijual sebagai **Feature Pack per tipe website + Add-on Website (ikut tier) + Modul Global (subscription mandiri)**; pricing table wajib pilih jenis website dulu; **tiap modul wajib prefix unik (§5.6)**; **setiap feature/module di folder terisolasi dengan prefix & migration sendiri (§13)**.

---

## 1. Ringkasan Eksekutif

1. Platform saat ini bias ke **online shop** (produk + order WA + checkout manual).
2. Ke depan platform mendukung banyak jenis website, tetapi **fase ini hanya `online_shop`**. Fondasi harus sudah siap multi-type tanpa refactor besar.
3. **Template tidak kompatibel lintas tipe website.** Maka 1 website = 1 `site_type` permanen; ganti tipe = buat website baru.
4. **Tidak ada sistem modul berbayar di repo saat ini.** Yang ada hanya tier gating vertikal (`free/starter/growth/enterprise`). Dokumen ini merancang sistem barunya.
5. Model billing final:
   - Fitur = unit atom (gratis/berbayar).
   - Pack = bundel fitur per `site_type`.
   - Add-on Website (scope W) = fitur berbayar di luar pack, ditempel ke langganan tier website itu.
   - Modul Global (scope G) = modul berbayar terpisah, subscription mandiri, non-disruptive.
   - Harga = matriks `site_type × tier × cycle`.
6. POC pertama: **`cek_ongkir`** (add-on website).

---

## 2. Kondisi Existing (Temuan Kode)

### 2.1 Template & Builder

| Aspek | Kondisi | Referensi |
|---|---|---|
| Kategori bisnis | `BusinessCategory = food \| fashion \| retail \| handicraft \| services` — ini **niche dalam online_shop, bukan tipe website** | `src/lib/builder/template-types.ts:6`, `src/lib/builder/templates/catalog.ts:6` |
| Katalog built-in | `BUILT_IN_CATALOG = [FOOD_TEMPLATE, LAUNDRY_EMERALD_TEMPLATE, MARKETPLACE_HYBRID_TEMPLATE]` — 3 template real di folder `src/lib/builder/templates/<id>/` | `src/lib/builder/templates/catalog.ts:23` |
| Field template | `Template.category: BusinessCategory`, `tiers?: Tier[]`, `tier_requirement?`, `activeSections?`, `sections`, `headers`, `footers` | `src/lib/builder/template-types.ts:167-202` |
| Section registry | 18 tipe: `hero, features, product_grid, testimonials, faq, cta, contact, about, gallery, video, team, pricing, newsletter, divider, marquee, menu_board, steps, location` | `src/lib/builder/sections/registry.ts`, `src/lib/builder/types.ts:186-204` |
| Apply template | Satu implementasi: `applyTemplateToWebsite`, `resolveTemplateSections`, `buildTemplateCustomConfig`; validasi `template_id in BUILT_IN_CATALOG`; tier gate kumulatif | `src/lib/builder/apply-template.ts`, `src/lib/builder/templates/catalog.ts:43-61` |
| Config website | `catalog_template_id` disimpan; `buildStoredCustomConfig` / `buildActiveCustomConfig` / `resolveNextIsPublished` | `src/lib/builder/website-config.ts:180-237` |
| Onboarding | 3 langkah: nama toko → jenis bisnis → template → live; `PUT /websites/[id]/website {template_id, custom_config}` | `app/onboarding/page.tsx:15,133-163` |
| Tier gate template | `TIER_RANK free(0)<starter(1)<growth(2)<enterprise(3)`; kosong = terbuka; tier asing = tolak | `src/lib/builder/templates/catalog.ts:30-68` |

**Implikasi:** belum ada cek kompatibilitas tipe website. Config lama bisa bocor saat switch template lintas tipe. Ini yang harus dikunci.

### 2.2 Billing & Limit Existing

| Aspek | Kondisi | Referensi |
|---|---|---|
| Harga tier | `TIER_PRICE_FALLBACK`: free 0, starter 99k/79k, growth 249k/199k, enterprise 599k/479k; DB `plans` diutamakan | `src/lib/billing/pricing.ts:9-25`, `supabase/migrations/012_pricing_unify.sql` |
| Limit tier | `TIER_LIMITS_DEFAULTS`: `maxWebsites, maxProducts, maxOrdersMonthly, allowCustomDomain, includedDomains, allowAnalyticsExport, allowCustomerList, allowStockTracking, maxPages` | `src/lib/billing/limits.ts:258-263` |
| Limit produk | `PRODUCT_TIER_LIMITS`: free 5/3/0/2MB, starter 50/5/10/2MB, dst. | `src/types/products.ts:129-134` |
| Tabel plans | `plans(slug, name, price_monthly, price_yearly_monthly, max_websites, max_products, max_images_per_product, ...)` | `006_multi_website.sql`, `012_pricing_unify.sql`, `013_product_limits.sql` |
| Tabel tier_limits | `tier_limits(tier PK, max_*, allow_*, included_domains, max_pages)` + RLS read untuk authenticated | `015_remove_trial_system.sql:42-86` |
| Checkout tier | `POST /api/billing/checkout {tier, billing_cycle, website_id?}` → `orderId umkm-...` → baris `subscriptions(incomplete)` → Midtrans Snap / mock | `app/api/billing/checkout/route.ts:63-248` |
| Webhook | Verifikasi `sha512(order_id+status_code+gross_amount+SERVER_KEY)`; idempoten `active+paid_at`; `settlement/capture→active`, `deny→past_due`, `expire/cancel→canceled` | `app/api/billing/webhook/route.ts:12-108` |
| Self-upgrade lock | Tier berbayar hanya via pembayaran resmi / admin; dev bypass `ALLOW_MANUAL_PLAN_UPGRADE=true`; demo bebas | `app/api/user/plan/route.ts:85-94` |
| UI billing | `BillingPanel` dengan `PLANS` hardcoded 4 kartu + matriks perbandingan + modal upgrade + mock flow | `src/components/billing/billing-panel.tsx:43-309` |
| Domain upsell | Kuota `includedDomains` habis → tetap boleh beli per-domain + pesan upsell (satu-satunya pola mirip add-on) | `src/lib/billing/limits.ts:308-343` |

**Implikasi:** harga dan limit masih global per tier, belum per `site_type`. Kolom `allowX` adalah fitur yang dikode-keras — ke depan harus jadi baris katalog, bukan kolom baru.

### 2.3 Data Operasional

* `websites(id, user_id, name, business_type, subdomain, custom_domain, ..., current_template_id)` + RLS owner (`006_multi_website.sql:30-60`).
* `orders` terisolasi `website_id`; `user_templates` unik `(website_id, template_id)` (`006_multi_website.sql:79-105`).
* `subscriptions(id, user_id, tier, status, period_start/end, payment_gateway, payment_reference, snap_token, billing_cycle, paid_at)` (`001_initial_schema.sql:58-70`, `010_billing_gateway.sql`).
* `bookings` pernah ada (`031_bookings.sql`) lalu **di-drop total** (`043_drop_bookings.sql`) — pelajaran: fitur menempel langsung ke core tanpa isolasi registry/gate akan mahal dicabut. Modul baru wajib terisolasi.

---

## 3. Keputusan Desain (Dikunci Sesi Ini)

| # | Keputusan | Detail |
|---|---|---|
| D1 | Fokus `online_shop` dulu | 1 tipe aktif; tipe lain stub "segera hadir"; blog ditunda; payment manual dulu |
| D2 | Template terikat `site_type` | 1 website = 1 `site_type` permanen; lintas tipe = buat website baru, bukan switch template |
| D3 | Semua modul dasar = scope website | Default `scope='website'`, terikat `website_id` |
| D4 | Modul global = berbayar terpisah | Terikat `user_id` (`website_id=NULL`); subscription mandiri; non-disruptive (ada/tidak ada proses inti tetap jalan) |
| D5 | Add-on website ikut tier | 1 transaksi dengan tier; `disable` = scheduled untuk renewal berikutnya (`cancel_at_period_end`); `enable` mid-cycle = prorata |
| D6 | Harga beda per `site_type` | Matriks `site_type × tier × cycle`; `plans` global jadi fallback online_shop |
| D7 | POC pertama `cek_ongkir` | Add-on website; butuh `products+orders`; jadi contoh meteran (`module_usage`) |

---

## 4. Konsep Template Terikat Tipe Website

### 4.1 `site_type` vs `business_category`

```
site_type (stabil, jarang berubah, menentukan pack + template yang boleh dipakai):
  online_shop (aktif) | company | portfolio | blog | sekolah | booking | ... (stub)

business_category / niche (varian DALAM satu site_type, menentukan tema/seed konten):
  online_shop → food | fashion | retail | handicraft | services
```

`BusinessCategory` existing dipertahankan apa adanya untuk kompatibilitas; `site_type` adalah lapisan baru di atasnya.

### 4.2 Aturan Kompatibilitas

1. Setiap template deklarasi `site_types: string[]` (mis. `['online_shop']`). Kosong/undefined = dianggap `['online_shop']` (backward compat).
2. Setiap website punya `site_type` (default `'online_shop'` via migrasi).
3. `isTemplateCompatibleWithSite(template, site_type)` = `template.site_types` memuat `site_type`.
4. Pelanggaran = `400 { error: 'Template tidak kompatibel untuk tipe website ini' }` di `PUT /api/websites/[id]/website`.
5. Daftar template difilter server-side: `GET /api/templates?site_type=online_shop`.
6. Switch template hanya boleh dalam 1 `site_type` (preservasi config seperti sekarang). Lintas tipe wajib buat website baru.

### 4.3 Registry Tipe Website (Single Source of Truth, kode saja — Fase 0)

```ts
// src/lib/site-types/registry.ts (rencana, belum diimplementasi)
SITE_TYPES = ['online_shop'] as const;
SITE_TYPE_REGISTRY = {
  online_shop: {
    label: 'Online Shop',
    niches: ['food','fashion','retail','handicraft','services'],
    allowedSections: ['hero','features','product_grid','menu_board','pricing',
      'testimonials','gallery','location','faq','contact','cta','steps',
      'newsletter','video','about','team','divider','marquee'],
    requiredSections: ['hero','contact'],           // product_grid|menu_board salah satu
    requiresModules: ['products','orders-manual'],  // core operasional
    futureModules: ['payments-online','blog-posts'],// stub, belum aktif
  },
};
```

### 4.4 Defisit Template Online Shop

Sudah ada 3 template real di struktur folder-based:
- `food/` — kuliner (hero menggugah selera, `menu_board`, catering pricing, location-hours)
- `laundry-emerald/` — laundry premium (hero arch, service cards, comfort band, FAQ accordion, testimonials, booking band)
- `marketplace-hybrid/` — toko online hybrid (search bar, category chips, bottom nav, mobile native-app feel)

Satu niche lagi wajib dibuat mengikuti kontrak unik §18 (template folder dengan `index.ts` + `html` kustom per varian, ID namespaced, nol hardcoded warna/font):

| Folder rencana | `activeSections` usulan | Ciri niche |
|---|---|---|
| `fashion/` | hero, product_grid, gallery, testimonials, faq (panduan ukuran), contact | Lookbook masonry, varian, filter kategori |
| `retail/` | hero, product_grid, pricing, location, newsletter, faq, contact | Kelontong/multi-kategori, jam toko |
| `handicraft/` | hero, gallery-masonry, video, about-centered, testimonials, contact | Cerita pengrajin, proses buat, custom order |
| `services/` | hero, features, menu_board (pricelist jasa), pricing, steps, contact-form-map | Booking survei (manual WA dulu), portofolio kerja |

Tidak perlu section baru untuk online_shop pada fase ini.

| File rencana | `activeSections` usulan | Ciri niche |
|---|---|---|
| `fashion.ts` | hero, product_grid, gallery, testimonials, faq (panduan ukuran), contact | Lookbook masonry, varian, filter kategori |
| `retail.ts` | hero, product_grid, pricing, location, newsletter, faq, contact | Kelontong/multi-kategori, jam toko |
| `handicraft.ts` | hero, gallery-masonry, video, about-centered, testimonials, contact | Cerita pengrajin, proses buat, custom order |
| `services.ts` | hero, features, menu_board (pricelist jasa), pricing, steps, contact-form-map | Booking survei (manual WA dulu), portofolio kerja |

Tidak perlu section baru untuk online_shop pada fase ini.

### 4.5 Payment Manual vs Online

* Sekarang: pertahankan `payment_method: cash|cod|transfer` + WA checkout; status order `baru→konfirmasi→dikirim→selesai` tidak berubah.
* Disiapkan (tanpa implementasi): interface `PaymentProvider` (`src/lib/payments/types.ts` existing untuk Midtrans/Xendit tetap dipakai nanti untuk buyer), kolom `orders.payment_provider DEFAULT 'manual'` + `payment_reference NULL` agar webhook buyer nanti non-breaking.
* Modul `payment_online` dirancang sebagai add-on website (lihat §5), bukan bagian pack inti.

---

## 5. Konsep Feature / Pack / Add-on / Modul Global

### 5.1 Definisi

* **Feature (atom):** kapabilitas terkecil yang bisa di-gate. Punya `is_paid` (berbayar bila di luar pack), `scope` (`website|global`), `site_types` (NULL = semua), `requires[]`, `conflicts[]`.
* **Feature Pack:** bundel fitur per `site_type` (mis. `online_shop_pack`). Isi pack per tier diatur di `pack_features.pack ... included_tiers`.
* **Add-on Website (scope W):** fitur `is_paid=true, scope=website` yang TIDAK termasuk di tier user → bisa ditempel ke langganan tier website itu dengan biaya tambahan.
* **Modul Global (scope G):** fitur `scope=global`, subscription mandiri, tidak mengganggu proses inti bila mati.
* **Tier:** paket langganan pack (`free/starter/growth/enterprise`) per `site_type`. Fitur berbayar bisa di-include gratis ke tier atas (mis. `stock_tracking` gratis di Starter+).

### 5.2 Kriteria W vs G

* Menulis/membaca alur transaksi website itu (`orders/products/stock/ongkir/payment`) → **W**.
* Agregat lintas website / pendukung operasional (`jurnal keuangan, gaji, blast WA, analitik`) → **G**.

### 5.3 Katalog Awal (Seed Online Shop)

**Core W gratis (semua tier):**
`products_dasar, orders_wa, subdomain, template_dasar, dashboard_dasar`

**Fitur berbayar yang di-include ke tier (bawaan pack):**

| Feature | Starter | Growth | Enterprise |
|---|---|---|---|
| `stock_tracking` | ON | ON | ON |
| `customer_list` | ON | ON | ON |
| `custom_domain` | ON | ON | ON |
| `template_premium` | ON | ON | ON |
| `analytics_export` (G, dibonuskan) | — | ON | ON |

**Add-on W tersedia (di luar pack, bisa ditempel):**

| `feature_id` | Harga usulan | `requires` | Keterangan |
|---|---|---|---|
| `cek_ongkir` | 25k/bln + usage | `products, orders` | RajaOngkir/Ongkir API + cache tarif + `module_usage` per-hit (POC) |
| `payment_online` | fee/transaksi | `orders, products` | Midtrans/Xendit buyer (nanti; manual tetap jalan) |
| `pages_extra` | kuota add-on | `pages` | Melebihi `maxPages` tier |

**Modul G mandiri:**

| `feature_id` | Harga usulan | `requires` | Keterangan |
|---|---|---|---|
| `akunting_dasar` | 39k/bln | `orders` (soft) | Kas, jurnal otomatis dari order `selesai/paid` |
| `akunting_lanjutan` | 49k/bln | `akunting_dasar` (hard) | Laba-rugi, neraca, pajak |
| `hrm_core` | 29k/bln | — | Karyawan, absensi, shift |
| `payroll` | 35k/bln | `hrm_core` (hard), `akunting_dasar` (soft) | Slip gaji, THR, PPh21 |
| `wa_gateway` | 20k/bln / kuota | — | Fonnte + template approve |

### 5.4 Dependensi (DAG)

```ts
CEK_ONGKIR        requires: ['products','orders']
AKUNTING_LANJUTAN requires: ['akunting_dasar']            // hard, sesama G
PAYROLL           requires: ['hrm_core']                   // hard
                  recommends: ['akunting_dasar']           // soft
AKUNTING_DASAR(G) requires: ['orders'(W)]                 // soft lintas scope: "any website punya orders"
```

Aturan:
1. `resolveDependencies(requested[])` = closure transitif + topological sort (pure function).
2. Circular = ditolak saat seed/CI, bukan saat runtime.
3. Checkout W: belum memenuhi hard-dep → auto-include keduanya di keranjang (UX) + API tetap validasi strict.
4. Disable diblokir bila masih ada dependen aktif (cth. tidak bisa matikan `hrm_core` selama `payroll` aktif).
5. `conflicts[]` disediakan untuk eksklusivitas one-time di masa depan; untuk online_shop fase ini tidak ada konflik (COD + QRIS boleh jalan bareng).

### 5.6 Konvensi Prefix Modul (Dikunci 2026-10-05)

Setiap modul **wajib** memakai prefix unik yang pendek di nama tabel, view, index, RLS policy, dan konstanta/type/enum yang di-export. Tidak berlaku untuk nama kolom.

1. Prefix 2–5 huruf + underscore (`^[a-z]{2,5}_$`), turunan nama folder `src/lib/*`.
2. Didaftarkan sekali di `src/lib/modules/prefixes.ts` (`MODULE_PREFIXES`); prefix baru wajib tambah baris di registry — tidak boleh dikarang bebas.
3. `mod_` = khusus inti sistem modul (features/packs/addons/usage), **bukan** prefix global. Tabel non-modul dilarang pakai `mod_`.
4. Tabel lama di-retrofit via `RENAME` + view compat 1 rilis, lalu view di-drop (Fase B→D, lihat §6 catatan kompatibilitas).

| Modul (`src/lib/*`) | Prefix | Contoh tabel |
|---|---|---|
| billing | `bill_` | `bill_plans`, `bill_tier_limits`, `bill_subscriptions` |
| websites | `ws_` | `ws_websites`, `ws_settings` |
| products | `prod_` | `prod_products`, `prod_images`, `prod_variants`, `prod_stock_movements` |
| orders | `ord_` | `ord_orders` |
| domains | `dom_` | `dom_orders` |
| builder | `bld_` | `bld_templates`, `bld_user_templates` |
| users | `usr_` | `usr_api_keys` (tabel `users` dikecualikan, tetap `users`) |
| modules (inti baru) | `mod_` | `mod_features`, `mod_packs`, `mod_pack_features`, `mod_site_prices`, `mod_sub_addons`, `mod_global_subs`, `mod_usage` |

Pola nama policy: `<prefix>_<tabel>_<aksi>` (cth. `ws_websites_owner_all`).
Pola nama index: `idx_<tabel>_<kolom>` (cth. `idx_ws_websites_user_id`).
Konstanta: `TIER_PRICE_FALLBACK`→`BILL_TIER_PRICE_FALLBACK`, `PRODUCT_TIER_LIMITS`→`PROD_TIER_LIMITS`, `TIER_RANK`→`BLD_TIER_RANK` (alias deprecated 1 rilis).
Enforcement: `src/lib/modules/prefixes.test.ts` + `scripts/lint-prefix.mjs` di CI (gagal bila ada tabel/konstanta tanpa prefix atau klaim prefix ganda).

---

## 6. Desain Data (Rencana Migrasi `047-049`)

```sql
-- 047_mod_features: katalog atom (prefix mod_ = inti sistem modul, lihat §5.6)
CREATE TABLE mod_features(
  id TEXT PRIMARY KEY,                 -- 'cek_ongkir'
  name TEXT NOT NULL,
  category TEXT NOT NULL,              -- 'logistik','keuangan','sdm','operasional',...
  description TEXT DEFAULT '',
  scope TEXT NOT NULL CHECK (scope IN ('website','global')),
  is_paid BOOLEAN NOT NULL DEFAULT FALSE,
  site_types TEXT[] NULL,              -- NULL = semua site_type
  requires TEXT[] NOT NULL DEFAULT '{}',
  conflicts TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 048_mod_packs: pack per site_type + harga matriks
CREATE TABLE mod_packs(
  id TEXT PRIMARY KEY,                 -- 'online_shop_pack'
  site_type TEXT NOT NULL,             -- 'online_shop'
  name TEXT NOT NULL
);
CREATE TABLE mod_pack_features(
  pack_id TEXT REFERENCES mod_packs(id) ON DELETE CASCADE,
  feature_id TEXT REFERENCES mod_features(id) ON DELETE CASCADE,
  quota INT NULL,                      -- cth. products:5 ; NULL = boolean ON
  included_tiers TEXT[] NOT NULL DEFAULT '{}', -- '{starter,growth,enterprise}'
  PRIMARY KEY(pack_id, feature_id)
);
CREATE TABLE mod_site_prices(
  site_type TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('free','starter','growth','enterprise')),
  cycle TEXT NOT NULL CHECK (cycle IN ('monthly','yearly')),
  price INT NOT NULL CHECK (price >= 0),
  PRIMARY KEY(site_type, tier, cycle)
);

-- 049_subscriptions: perluasan + add-on W + modul G + usage
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS site_type TEXT DEFAULT 'online_shop';
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS pack_id TEXT NULL;

CREATE TABLE mod_sub_addons(
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  feature_id TEXT NOT NULL REFERENCES mod_features(id),
  status TEXT NOT NULL DEFAULT 'incomplete'
    CHECK (status IN ('active','past_due','canceled','incomplete','incomplete_expired')),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly','yearly','once')),
  price_charged INT NOT NULL DEFAULT 0,
  current_period_start TIMESTAMPTZ DEFAULT NOW(),
  current_period_end TIMESTAMPTZ DEFAULT NOW(),
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  payment_reference TEXT UNIQUE,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subscription_id, website_id, feature_id)
);
CREATE INDEX idx_mod_sub_addons_website ON mod_sub_addons(website_id);
CREATE INDEX idx_mod_sub_addons_sub ON mod_sub_addons(subscription_id);

CREATE TABLE mod_global_subs(
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feature_id TEXT NOT NULL REFERENCES mod_features(id),
  status TEXT NOT NULL DEFAULT 'incomplete'
    CHECK (status IN ('active','past_due','canceled','incomplete','incomplete_expired')),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly','yearly','once')),
  price_charged INT NOT NULL DEFAULT 0,
  current_period_start TIMESTAMPTZ DEFAULT NOW(),
  current_period_end TIMESTAMPTZ DEFAULT NOW(),
  payment_reference TEXT UNIQUE,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, feature_id)
);

CREATE TABLE mod_usage(
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  website_id UUID REFERENCES websites(id) ON DELETE CASCADE,
  feature_id TEXT NOT NULL REFERENCES mod_features(id),
  qty INT NOT NULL DEFAULT 1,
  reference_id TEXT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_mod_usage_lookup ON mod_usage(user_id, website_id, feature_id, created_at);
```

Catatan kompatibilitas:
* `plans` dan `tier_limits` lama **dipertahankan** sebagai fallback khusus `online_shop` selama migrasi, lalu di-retrofit menjadi `bill_plans` / `bill_tier_limits` (plus `subscriptions`→`bill_subscriptions`) via `RENAME` + view compat 1 rilis (lihat §5.6). Referensi `subscriptions`/`websites` di SQL rencana mengikuti nama baru setelah retrofit.
* `subscriptions.payment_reference UNIQUE` + `paid_at` tetap jadi kunci idempoten webhook.

---

## 7. Kontrak API (Rencana)

```
GET /api/plans?site_type=online_shop
→ {
    site_type, tiers: [{tier, monthly, yearly}],
    pack_features: [{feature_id, quota, included_tiers}],
    addons_w: [{feature_id, price_monthly, requires}],
    modules_g: [{feature_id, price_monthly, requires}]
  }

POST /api/billing/checkout
  body: { site_type, tier: starter|growth|enterprise, billing_cycle: monthly|yearly,
          website_id?: uuid, addon_w_ids?: string[] }
→ gross = site_plan_prices(site_type,tier,cycle) + Σ addon_w
→ orderId 'umkm-...' → subscriptions(incomplete) + mod_sub_addons(incomplete)

POST /api/modules/global/checkout
  body: { feature_id, billing_cycle }
→ gross = flat price → orderId 'modg-...' → mod_global_subs(incomplete)

POST /api/subscription/addons/disable
  body: { website_id, feature_id }
→ set cancel_at_period_end=TRUE (tetap aktif sampai period end)

Webhook (perluas webhook billing existing):
→ tier paid ⇒ subscriptions.active + paid_at (+ update users.tier bila tier != free)
→ addon_w paid ⇒ mod_sub_addons.active + paid_at
→ modg paid ⇒ mod_global_subs.active + paid_at
→ deny ⇒ past_due ; expire/cancel ⇒ canceled (per baris masing-masing)
```

Aturan keamanan mengikuti pola existing: self-upgrade/add-on berbayar hanya via pembayaran resmi; `POST /api/user/plan` tetap untuk downgrade ke free.

---

## 8. Alur Pricing UI (Wajib Pilih Jenis Website Dulu)

```
Step 1 — Pilih jenis website:
  [Online Shop] (aktif) | [Company, Portfolio, ...] ("Segera hadir", non-klik di fase ini)

Step 2 — Pilih tier KHUSUS site_type itu:
  4 kartu (Free/Starter/Growth/Enterprise) dengan:
  - harga dari site_plan_prices (bukan konstanta global)
  - daftar fitur pack (centang dari pack_features) + label Termasuk
  - add-on W tersedia + harga + tombol [+ Tambah]
  - modul G terkait + harga + link checkout mandiri

Step 3 — Ringkasan & checkout:
  Pack (site_type × tier × cycle) + add-on W + total → POST /api/billing/checkout
```

`BillingPanel` (`PLANS` hardcoded) diubah menjadi fetch `GET /api/plans?site_type=` dengan fallback konstanta bila API gagal.

---

## 9. Enforcement Satu Pintu (Rencana)

```ts
// src/lib/modules/entitlements.ts (rencana)
hasFeature(userId, websiteId, featureId): Promise<boolean>
// website scope:
//   packIncludes(site_type, tier, feature)
//   OR addonWActive(subscription_id, websiteId, feature, now < period_end [termasuk cancel_at_period_end])
// global scope:
//   globalActive(userId, feature)
//   OR packIncludes (bonus tier, cth. analytics_export di Growth+)
// + cek requires rekursif + fail-closed bila DB error (pola checkProductLimit)
// + legacy fallback: TIER_LIMITS_DEFAULTS.allowX / PRODUCT_TIER_LIMITS selama migrasi
```

Dipakai di: semua API fitur (`/api/ongkir/*`, `/api/akunting/*`, ...), builder (filter section per `site_type`), dashboard nav (sembunyikan menu + upsell `/dashboard/billing?site_type=X&addon=Y`).

---

## 10. Fase Eksekusi

| Fase | Isi | Keluaran |
|---|---|---|
| Fase 0 | Registry kode saja: `site-types/registry.ts`, `modules/{features,packs,dependencies,entitlements}.ts` + test DAG (closure, topo-sort, circular-reject, auto-include, block-disable) | Tanpa migrasi; tanpa ubah billing |
| Fase 1 | Migrasi `047-049` + seed **online_shop saja**; `plans/tier_limits` jadi fallback | Fondasi DB siap; existing tidak rusak |
| Fase 2 | `GET /api/plans?site_type`, checkout W+addon, webhook perluasan, UI billing site_type-first, implementasi `cek_ongkir` end-to-end | POC billing + 1 add-on nyata |
| Fase 3 | 4 template niche (`fashion, retail, handicraft, services`) + guard kompatibilitas template | Katalog online_shop lengkap |
| Fase 4 | Modul G (`akunting_dasar → akunting_lanjutan`, `hrm_core → payroll`) + `module_usage` + enforcement penuh | Sistem modul lengkap |

---

## 11. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Divergensi harga DB vs konstanta (pernah terjadi `012` vs `pricing.ts`) | `site_plan_prices` = kebenaran; konstanta hanya fallback display-safe + test matriks |
| Config lintas tipe bocor saat switch template | Guard `site_types` di API + filter galeri + `catalog_template_id` sebagai audit |
| Add-on yatim saat tier dicancel | Cancel tier ⇒ add-on W ikut `canceled` di akhir periode; G tidak terdampak |
| Dependensi circular | Validasi seed/CI, bukan runtime |
| Cross-scope requires ambigu (G butuh data W) | Soft-check "any website" + warning, bukan hard block |

---

## 12. Pertanyaan Terbuka (Untuk Sprint Berikutnya)

1. Kunci klasifikasi final: `analytics_export` dan `wa_gateway` tetap di G (seperti usulan §5.3)?
2. Prorata enable mid-cycle W add-on: harian penuh atau dibulatkan ke atas?
3. Grace period bila tier expired tapi add-on W masih periode: read-only 7 hari atau blokir tulis langsung?
4. Harga `site_plan_prices` awal untuk tipe selain online_shop: ikut online_shop atau ditetapkan saat tipe itu diaktifkan?

---

## 13. Struktur Module Terisolasi (Folder-Based, Implementasi 2026-10-07)

Mengikuti pola template `src/lib/builder/templates/<niche>/`, setiap feature/module sekarang berada di folder sendiri di `src/lib/modules/` dengan prefix, migration, API, dan logika terisolasi.

### 13.1 Arsitektur Folder

```
src/lib/modules/
├── core/                          # Infrastructure modules (mod_ tables)
│   ├── features/                  # Feature catalog & registry
│   ├── packs/                     # Pack definitions per site_type
│   ├── subscriptions/             # Subscription tables & logic
│   ├── entitlements/              # Single enforcement gate (hasFeature)
│   └── site-types/                # Site type registry (Fase 0)
│
├── features/                      # Business feature modules (isolated folders)
│   ├── core-products/             # Core W gratis: products_dasar (prod_)
│   ├── core-orders/               # Core W gratis: orders_wa (ord_)
│   ├── core-subdomain/            # Core W gratis: subdomain (ws_)
│   ├── core-template/             # Core W gratis: template_dasar (bld_)
│   ├── core-dashboard/            # Core W gratis: dashboard_dasar (ws_)
│   ├── stock-tracking/            # Pack feature (prod_)
│   ├── customer-list/             # Pack feature (ord_)
│   ├── custom-domain/             # Pack feature (dom_)
│   ├── template-premium/          # Pack feature (bld_)
│   ├── analytics-export/          # Pack bonus Growth+ (anl_)
│   ├── cek-ongkir/                # Add-on W POC (ong_)
│   ├── payment-online/            # Add-on W future (pay_)
│   ├── pages-extra/               # Add-on W (ws_)
│   ├── akunting-dasar/            # Modul G (acc_)
│   ├── akunting-lanjutan/         # Modul G (acc_)
│   ├── hrm-core/                  # Modul G (hrm_)
│   ├── payroll/                   # Modul G (pay_)
│   └── wa-gateway/                # Modul G (wgt_)
│
├── dependencies/                  # DAG resolution
│   ├── graph.ts                   # Topological sort, transitive closure
│   ├── validation.ts              # Circular detection, seed validation
│   └── test.ts                    # Unit tests
│
├── scripts/                       # Generation & linting
│   ├── gen-module-catalog.mjs     # Auto-discover features/*/index.ts
│   └── lint-module-prefix.mjs     # Extended prefix linter
│
├── prefixes.ts                    # MODULE_PREFIXES registry (19 prefixes)
├── prefixes.test.ts               # Prefix validation tests
├── types.ts                       # Shared types (Feature, Pack, Subscription)
├── index.ts                       # Barrel export
└── catalog.generated.ts           # AUTO-GENERATED
```

### 13.2 Kontrak Per Feature Folder

Setiap folder `features/<feature-id>/` **wajib** berisi:

| File | Deskripsi |
|------|-----------|
| `index.ts` | Export `XXX_FEATURE: Feature` + `XXX_PREFIX` |
| `types.ts` | TypeScript types (config, entities, limits) |
| `prefix.ts` | `export const PREFIX = 'xxx_'` |
| `migration.sql` | `CREATE TABLE` dengan prefix yang benar |
| `api.ts` | Route handlers di `/api/modules/<feature-id>/` |
| `hooks.ts` | Business logic, validasi, limit checks |
| `pricing.ts` | (jika berbayar) Kalkulasi harga, prorata, usage |
| `internal-api.ts` | (jika dikonsumsi feature lain) Internal API |

### 13.3 Prefix Registry (MODULE_PREFIXES)

| Module | Prefix | Tables |
|--------|--------|--------|
| core features/packs/subscriptions | `mod_` | `mod_features`, `mod_packs`, `mod_pack_features`, `mod_site_prices`, `mod_sub_addons`, `mod_global_subs`, `mod_usage` |
| core site-types | `ws_` | `ws_websites.site_type`, `subscriptions.site_type` |
| core-products | `prod_` | `prod_products`, `prod_images`, `prod_variants`, `prod_stock_movements` |
| core-orders | `ord_` | `ord_orders` |
| core-template | `bld_` | `bld_templates`, `bld_user_templates` |
| cek-ongkir | `ong_` | `ong_rates_cache`, `ong_usage_log` |
| akunting-dasar/lanjutan | `acc_` | `acc_journals`, `acc_accounts`, `acc_ledgers`, `acc_reports` |
| hrm-core | `hrm_` | `hrm_employees`, `hrm_attendance`, `hrm_shifts` |
| payroll | `pay_` | `pay_payslips`, `pay_thr`, `pay_tax` |
| wa-gateway | `wgt_` | `wgt_templates`, `wgt_broadcasts`, `wgt_deliveries` |

> Beberapa feature berbagi prefix (e.g., `prod_` untuk products + stock). Ini diperbolehkan — prefix = namespace tabel, bukan 1:1 feature.

### 13.4 Auto-Discovery & Catalog Generation

`scripts/gen-module-catalog.mjs` scan `features/*/index.ts` + `core/*/index.ts` → generate `catalog.generated.ts`:

```ts
// AUTO-GENERATED
export const GENERATED_FEATURE_FOLDERS = ['core-products', 'core-orders', 'cek-ongkir', ...];
export const GENERATED_FEATURE_CATALOG = [PRODUCTS_DASAR_FEATURE, ORDERS_WA_FEATURE, CEK_ONGOIR_FEATURE, ...];
export const GENERATED_CORE_FOLDERS = ['features', 'packs', 'subscriptions', 'entitlements', 'site-types'];
export const GENERATED_CORE_CATALOG = [...];
```

Jalan otomatis via npm prehooks: `predev`, `prebuild`, `pretest`, `pretypecheck`.

### 13.5 Linting Prefix

`scripts/lint-module-prefix.mjs` memperluas `lint-prefix.mjs`:
- Validasi `CREATE TABLE` di migrasi pakai prefix terdaftar
- Validasi setiap `features/*/prefix.ts` exists & prefix terdaftar
- Validasi `migration.sql` exists per feature

### 13.6 DAG Resolver (dependencies/)

Pure TS implementation:
- `buildGraph()` → `DependencyGraph`
- `topologicalSort()` → Kahn's algorithm
- `detectCircular()` → DFS cycle detection
- `resolveDependencies(requested[], active[])` → `{resolved, autoIncluded, warnings, errors}`
- `validateSeed()` → CI gate untuk circular/missing deps

### 13.7 Site-Type Registry (core/site-types/)

`SITE_TYPE_REGISTRY` — single source of truth:
```ts
online_shop: {
  label: 'Online Shop',
  niches: ['food','fashion','retail','handicraft','services'],
  allowedSections: [...],
  requiredSections: ['hero','contact'],
  requiresModules: ['products_dasar','orders_wa','subdomain','template_dasar','dashboard_dasar'],
  packId: 'online_shop_pack',
  isActive: true,
}
```
Template compatibility via `TEMPLATE_COMPATIBILITY[]` mapping templateId → siteTypes[].

### 13.8 Entitlements Engine (core/entitlements/)

Single enforcement gate `hasFeature(context, featureId)`:
1. Pack inclusion (tier-based via `mod_pack_features.included_tiers`)
2. Addon W active (`mod_sub_addons` website-scoped)
3. Global module active (`mod_global_subs` user-scoped)
4. Pack bonus for global (e.g., `analytics_export` in Growth+)
5. Legacy fallback (TIER_LIMITS_DEFAULTS during migration) → deny

Helpers: `canEnableAddon()`, `canDisableAddon()`, `getActiveFeaturesForWebsite()`.

### 13.9 API Convention

Feature owns routes: `/api/modules/<feature-id>/`
- `GET /api/modules/cek-ongkir/rates`
- `POST /api/modules/akunting-dasar/journals`
- Internal API: `/api/internal/<feature-id>/...` (service role key)

Cross-feature via HTTP, **no direct imports** across feature folders.

### 13.10 Migration Strategy

Per-feature migration files di `features/<id>/migration.sql` → applied centrally as sequential migrations (047, 048, 049, 050...).

| Phase | Migrations |
|-------|------------|
| Fase 0a | 047 (mod_features), 048 (mod_packs), 049 (mod_subscriptions), 050 (site_types) |
| Fase 0b | 051-060 (core features: products, orders, template, stock, domain, analytics) |
| Fase 1 | 056 (cek_ongkir), 057 (analytics), 058-062 (akunting, hrm, payroll, wa) |

---

*Dokumen planning updated 2026-10-07. Implementasi Fase 0 selesai. Eksekusi lanjut Fase 1 (migrasi + seed).*
