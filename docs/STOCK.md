# STOK — Keputusan N3 (order flow)

**Tanggal:** 2026-09-26
**Keputusan: decrement stok DILEWATI DENGAN AMAN (no-op). TIDAK ada tabel/migrasi baru.**

## Temuan investigasi

- Tidak ada tabel `products` di seluruh migrasi `001`–`012` (cek via grep
  `CREATE TABLE.*products` → nol hasil, hanya `product_grid`/`product_name`).
- Produk disimpan di **`user_templates.custom_config` JSONB**:
  `sections[]` dengan `type: "product_grid"` (id `menu`/`products`/`categories`/`bestseller`),
  `content.items[] = { name, price, description, category, available }`
  — **tanpa field kuantitas stok** (lihat `src/lib/mock/store.ts`
  `getDemoProducts`/`addDemoProduct`, dan `app/api/user/products/route.ts`).
- `productSchema` di `src/types/index.ts` memang punya field `stock`, tetapi
  CRUD non-demo me-return `501` ("Manajemen produk non-demo belum tersedia") —
  field tersebut belum punya storage persisten.
- `app/api/user/products/route.ts` tidak punya kolom `stock` apa pun.

## Mengapa tidak decrement JSON

Decrement aman butuh operasi atomik (`UPDATE ... WHERE stock >= qty`) agar dua
order bersamaan tidak oversell. JSONB di dalam `user_templates` tidak bisa
di-decrement atomik per item tanpa read-modify-write → race condition.
Membuat tabel baru sekarang = over-engineering di luar scope N2+N3.

## Validasi yang sudah melindungi order (tanpa tabel)

- `calcTotal` menolak `quantity` di luar `1–99` → order raksasa tertolak 400.
- Rate-limit 10 order/menit/IP di `POST /api/orders`.
- Titik future-hook sudah ditandai di `app/api/orders/route.ts` (komentar N3).

## Usulan skema saat migrasi produk ke tabel (nanti)

```sql
-- 01X_products.sql (DRAFT — belum dijalankan)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  price INTEGER NOT NULL DEFAULT 0 CHECK (price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_products_website_id ON products(website_id);
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- policy: owner ALL via auth.uid() = user_id (lihat 011_rls_hardening.sql)

-- Decrement atomik; return NULL bila stok kurang → API balas 409.
CREATE OR REPLACE FUNCTION decrement_stock(p_product_id UUID, p_qty INTEGER)
RETURNS INTEGER AS $$
DECLARE v_stock INTEGER;
BEGIN
  UPDATE products SET stock = stock - p_qty
  WHERE id = p_product_id AND stock >= p_qty
  RETURNING stock INTO v_stock;
  RETURN v_stock; -- NULL = stok kurang / produk tidak ada
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Alur saat tabel sudah ada: `POST /api/orders` → `rpc("decrement_stock")` via
service-role setelah validasi → `NULL` → `409 "Stok tidak mencukupi"`.

## Checklist RLS saat tabel dibuat

- [ ] `products_owner_all` (`auth.uid() = user_id`), default-deny.
- [ ] Test: user A tidak bisa baca/update produk user B.
- [ ] Guest checkout tetap via service-role + `website_id` eksplisit (pola orders).
