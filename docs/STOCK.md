# STOK — Dokumentasi & Keputusan Teknis Sprint 01

**Tanggal Diperbarui:** 2026-09-26  
**Status:** **Tabel `products` & `stock_movements` AKTIF (Migrasi 016 + bucket 018)**  
Sumber kebenaran: `supabase/migrations/016_create_products.sql` (tabel, RPC, RLS) dan
`018_storage_bucket.sql` (storage). Kepemilikan data **selalu via `websites.user_id`** —
`products` tidak punya kolom `user_id` sendiri.

---

## 1. Skema Aktual (016)

```sql
-- products  (kepemilikan = websites.user_id, bukan kolom sendiri)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price BIGINT NOT NULL CHECK (price >= 0),          -- IDR utuh, contoh 15000 = Rp 15.000
    category VARCHAR(100) DEFAULT 'Umum',
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= -1), -- -1 = unlimited
    low_stock_threshold INTEGER NOT NULL DEFAULT 5,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()      -- trigger products_updated_at
);

-- product_images
-- id, product_id -> products ON DELETE CASCADE, storage_path, public_url, alt_text,
-- sort_order, is_primary, width, height, file_size, mime_type, created_at

-- stock_movements (audit trail)
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID,                                    -- disiapkan untuk Sprint 07
    type VARCHAR(20) NOT NULL CHECK (type IN ('in','out','adjust')),
    quantity INTEGER NOT NULL,
    reference_id UUID,                                  -- mis. order_id
    reference_type VARCHAR(50),                         -- mis. 'order'
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- product_variants (disiapkan untuk Sprint 07; belum dipakai UI)
```

Index: `products(website_id)`, parsial `(website_id, is_active) WHERE is_active`,
`(website_id, category)`, `(website_id, sort_order)`; `product_images(product_id)`,
parsial `(product_id, is_primary) WHERE is_primary`; `stock_movements(product_id)`,
`stock_movements(created_at DESC)`.

---

## 2. Standardisasi Satuan Mata Uang (Plain IDR)

- Semua nilai harga (`products.price`, `orders.product_price`, `orders.total_amount`)
  disimpan dalam **Rupiah utuh** sebagai integer (`BIGINT` di `products`), **bukan** sen/koin.
- Contoh: `15000` merepresentasikan **Rp 15.000**.
- Seed demo (`017_seed_demo_users.sql`) memakai angka Rupiah murni tanpa pembagian/perkalian 100,
  dan `POST /api/orders` menghitung total dari harga DB (`calcTotal`), bukan dari payload client.

---

## 3. Atomic Stock Decrement & Concurrency

Untuk mencegah race condition / *overselling* saat checkout bersamaan
(`app/api/orders/route.ts`):

1. **RPC atomik** — `decrement_product_stock(p_product_id UUID, p_quantity INTEGER) RETURNS BOOLEAN`:
   ```sql
   UPDATE products
   SET stock = CASE WHEN stock = -1 THEN -1 ELSE stock - p_quantity END,
       updated_at = now()
   WHERE id = p_product_id
     AND (stock = -1 OR stock >= p_quantity)
     AND is_active = true;
   -- lalu: GET DIAGNOSTICS v_count = ROW_COUNT; RETURN v_count > 0;
   ```
   - Satu statement `UPDATE` tanpa `SELECT ... FOR UPDATE`, jadi tidak ada window baca-lalu-tulis.
   - `TRUE` = baris berhasil dikurangi; `FALSE` = stok kurang / produk tidak aktif / tidak ditemukan
     → API membalas **409 `Stok tidak mencukupi`**.
   - `stock = -1` (unlimited) tetap `-1` (sentinel tidak dikorupsi, `CHECK (stock >= -1)`).
   - `p_quantity <= 0` ditolak `RAISE EXCEPTION` (tidak pernah "menambah" stok tanpa sengaja).
   - API hanya memanggil RPC ini bila produk terlacak (`product.stock !== -1`).
2. **Kompensasi**: bila `INSERT orders` gagal setelah stok turun, API memanggil
   `increment_product_stock(...)` sebagai rollback (best-effort).
3. **Single-Movement Audit Logging (F2-2)**:
   - Audit ditulis **sekali** per order lewat RPC `log_stock_movement(product_id, 'out', qty,
     reference_id=order.id, reference_type='order', note)` **setelah** order berhasil dibuat.
   - Tidak ada trigger otomatis di tabel `products`, dan API tidak pernah `INSERT` langsung ke
     `stock_movements` → tidak ada entri ganda / orphan pre-log.
4. **Integritas harga (anti-spoof)**: `POST /api/orders` membaca `name`, `price`, `stock`,
   `is_active` dari tabel `products` berdasarkan `product_id` (fallback nama/`product_name` untuk
   order lama), lalu menghitung `total = calcTotal(unitPrice, quantity)`. Nilai dari client
   tidak pernah dipercaya.

---

## 4. Keamanan & Hak Akses (RLS — 016)

Nama policy di bawah ini **harus sama persis** dengan migrasi (dicek oleh
`src/lib/products/rls.test.ts`):

- **`products`** — policy `"Products: user can manage own website products"` (`FOR ALL`)
  dengan `USING` + `WITH CHECK`:
  `website_id IN (SELECT id FROM websites WHERE user_id = auth.uid())`.
- **`product_images`** — `"Product images: user can manage own"` (`FOR ALL`), diisolasi lewat
  join `products` → `websites` (`WHERE w.user_id = auth.uid()`), `USING` + `WITH CHECK`.
- **`product_variants`** — `"Product variants: user can manage own"` (pola sama).
- **`stock_movements`** — hanya `"Stock movements: user can read own"` (`FOR SELECT`).
  **Tidak ada** policy `INSERT`/`UPDATE`/`DELETE` (F3-2): tulisan hanya lewat fungsi
  `SECURITY DEFINER` atau service-role client. Semua tabel `ENABLE ROW LEVEL SECURITY`.
- **Grant least-privilege**: tidak ada `GRANT` tabel ke `anon`/`authenticated`; yang di-grant
  hanya `EXECUTE` untuk `check_product_limit`, `decrement_product_stock`,
  `increment_product_stock`, `log_stock_movement`, dan `reorder_products`. Semua fungsi
  memakai `SECURITY DEFINER SET search_path = public`.
- **Query API** selalu owner-scoped: list/CRUD produk memverifikasi
  `websites.id = websiteId AND user_id = userId` lebih dulu; endpoint gambar memverifikasi
  `product.website_id` → `websites.user_id`.

### Batas tier produk (F3-1)

`PRODUCT_TIER_LIMITS` di `src/types/products.ts` adalah **satu-satunya** sumber literal
(free 5/3, starter 50/5, growth 200/10, enterprise 9999/20 untuk produk/gambar) dan
disinkronkan dengan `013_product_limits.sql` (`plans.max_products`,
`plans.max_images_per_product`) serta tabel `tier_limits` (`015`). `check_product_limit()`
di `016` membaca `plans.max_products` dan fallback ke konstanta tier yang sama.
`GET /api/user/products` mengirim objek `limits` (tier, maxLimit, kuota gambar & ukuran file)
supaya klien tidak menghitung ulang batas.

---

## 5. Storage Gambar Produk

- Bucket Supabase Storage `product-images` dibuat oleh `018_storage_bucket.sql` —
  **private** (`public = false`), dan idempotent (`ON CONFLICT (id) DO UPDATE SET public = false`).
- Policy storage: `"Product images: service-role full access"` (`FOR ALL TO service_role`) dan
  `"Product images: authenticated read own website folder"` (`FOR SELECT TO authenticated`).
- Upload memakai service-role client di `src/lib/storage/*`; `sharp` me-resize & mengonversi
  gambar ke **WebP** (`src/lib/storage/products.ts`), dengan batas tipe
  JPG/PNG/WebP/GIF/AVIF dan ukuran per tier (`maxFileSizeMb`).
- Pembacaan memakai **signed URL** (`expiresIn` 7 hari = `604800`s):
  di-mint saat upload (`src/lib/storage/supabase.ts`) dan **di-refresh saat render publik**
  (`src/lib/builder/public.ts`) dari `storage_path`; `product_images.public_url` menyimpan
  URL hasil mint terakhir, `storage_path` menyimpan path asli (sumber kebenaran).
- Jalur `app/api/user/products/[id]/images/route.ts` memverifikasi kepemilikan produk
  (`product → website → user_id`) sebelum upload/hapus, dan menghapus objek storage
  bersamaan dengan baris `product_images`.

