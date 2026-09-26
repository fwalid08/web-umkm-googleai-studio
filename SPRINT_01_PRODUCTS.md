# Sprint 1: Products Management System
**Duration:** 2 weeks (10 working days)  
**Goal:** Enable merchants to manage product catalog (CRUD, images, categories) with tier-gated limits, fully integrated with builder and public storefront.

---

## 1. User Stories

| ID | Story | Points |
|----|-------|--------|
| US-1.1 | As a merchant, I want to add a product with name, price, description, category, and images so customers can see it in my store | 5 |
| US-1.2 | As a merchant, I want to edit/delete my products so I can keep catalog updated | 3 |
| US-1.3 | As a merchant, I want to upload product images (max 5, 2MB each) with auto WebP conversion so my store looks professional | 5 |
| US-1.4 | As a Free tier user, I want to see my limit (5 products) and upgrade prompt when exceeded so I know my constraints | 2 |
| US-1.5 | As a merchant, I want the Product Grid section in builder to show real products from DB (not JSON) so changes reflect instantly | 5 |
| US-1.6 | As a customer, I want to see real-time stock and "Habis" badge on public storefront so I know availability | 3 |
| US-1.7 | As a system, I want all product operations scoped to active website with RLS so multi-tenancy is secure | 2 |

**Total: 25 points**

---

## 2. Database Migration (016_create_products.sql)

```sql
-- 016_create_products.sql
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price BIGINT NOT NULL CHECK (price >= 0), -- stored in IDR (sen)
    category VARCHAR(100) DEFAULT 'Umum',
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= -1), -- -1 = unlimited
    low_stock_threshold INTEGER NOT NULL DEFAULT 5,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_products_website_id ON products(website_id);
CREATE INDEX idx_products_website_active ON products(website_id, is_active) WHERE is_active = true;
CREATE INDEX idx_products_category ON products(website_id, category);

-- RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products: user can manage own website products"
ON products FOR ALL
USING (
    website_id IN (
        SELECT id FROM websites WHERE user_id = auth.uid()
    )
)
WITH CHECK (
    website_id IN (
        SELECT id FROM websites WHERE user_id = auth.uid()
    )
);

-- Trigger for updated_at
CREATE TRIGGER products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Product images table
CREATE TABLE IF NOT EXISTS product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL, -- e.g., product-images/{website_id}/{product_id}/{uuid}.webp
    public_url TEXT NOT NULL,   -- signed URL or CDN URL
    alt_text VARCHAR(200),
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_images_product_id ON product_images(product_id);

ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Product images: user can manage own"
ON product_images FOR ALL
USING (
    product_id IN (
        SELECT p.id FROM products p
        JOIN websites w ON w.id = p.website_id
        WHERE w.user_id = auth.uid()
    )
)
WITH CHECK (
    product_id IN (
        SELECT p.id FROM products p
        JOIN websites w ON w.id = p.website_id
        WHERE w.user_id = auth.uid()
    )
);

-- Storage bucket (run via Supabase dashboard or CLI)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', false);
-- CREATE POLICY "Product images: authenticated upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Product images: owner read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## 3. API Contracts

### 3.1 Types (`src/types/products.ts`)
```typescript
export interface Product {
  id: string;
  website_id: string;
  name: string;
  description: string | null;
  price: number;           // IDR (sen)
  category: string;
  stock: number;           // -1 = unlimited
  low_stock_threshold: number;
  is_active: boolean;
  sort_order: number;
  images: ProductImage[];
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  public_url: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
}

export interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ProductCreateInput {
  name: string;
  price: number;
  description?: string;
  category?: string;
  stock?: number;
  low_stock_threshold?: number;
  images?: File[]; // handled via multipart
}

export interface ProductUpdateInput {
  name?: string;
  price?: number;
  description?: string;
  category?: string;
  stock?: number;
  low_stock_threshold?: number;
  is_active?: boolean;
  sort_order?: number;
}
```

### 3.2 Endpoints

#### GET `/api/user/products`
```
Query: page=1, limit=20, search?, category?, is_active?
Response: ProductListResponse
```

#### POST `/api/user/products`
```
Content-Type: multipart/form-data
Fields: name, price, description, category, stock, low_stock_threshold, images[] (max 5)
Response: { success: true, data: { product: Product } }
Errors: 400 validation, 403 limit exceeded, 413 file too large
```

#### PUT `/api/user/products/:id`
```
Content-Type: application/json
Body: ProductUpdateInput
Response: { success: true, data: { product: Product } }
```

#### DELETE `/api/user/products/:id`
```
Response: { success: true, message: "Produk dihapus" }
```

#### POST `/api/user/products/:id/images`
```
Content-Type: multipart/form-data
Field: images[] (max 5 - current_count)
Response: { success: true, data: { images: ProductImage[] } }
```

#### DELETE `/api/user/products/:id/images/:imageId`
```
Response: { success: true }
```

---

## 4. Tier Limits Enforcement

| Tier | Max Products | Max Images/Product |
|------|--------------|-------------------|
| Free | 5 | 3 |
| Starter | 50 | 5 |
| Growth | 200 | 10 |
| Enterprise | 9999 | 20 |

**Enforcement Points:**
1. API: `POST /api/user/products` → check count before insert
2. API: `POST /api/user/products/:id/images` → check per-product limit
3. UI: Disable "Tambah Produk" button + show upgrade banner
4. Builder: Product Grid section respects `is_active` + limit

---

## 5. UI Specification

### 5.1 Product Manager Page (`/dashboard/products/page.tsx`)
```
Layout:
- Header: Title + "Tambah Produk" button (disabled if limit reached)
- Limit banner (if Free tier): "Free tier: 3/5 produk. Upgrade untuk menambah lebih banyak."
- Table columns: Gambar | Nama | Kategori | Harga | Stok | Status | Aksi
- Row actions: Edit (inline), Toggle Active, Hapus
- Bulk actions (checkbox): Aktifkan, Nonaktifkan, Hapus
- Pagination: 20 per page
- Search: by name, category
- Filter: Status (Aktif/Nonaktif), Kategori
```

### 5.2 Inline Edit Form
```
Fields:
- Nama Produk* (text, max 200)
- Harga* (number, IDR, min 0)
- Kategori (select: Umum, Makanan, Minuman, Fashion, Aksesoris, Kerajinan, Lainnya)
- Deskripsi (textarea, max 2000)
- Stok (number, -1 untuk unlimited)
- Ambang Stok Rendah (number, default 5)
- Status (toggle: Aktif/Nonaktif)
- Gambar: drag-drop zone (max 5, preview, reorder, delete)
```

### 5.3 Builder Integration
- Product Grid section: reads from `products` table via new API
- Section config: `source: "database"` (default) vs `source: "manual"` (legacy JSON)
- Auto-sync: when product added/edited/deleted → builder preview refreshes

---

## 6. Public Storefront Changes

### 6.1 Renderer (`src/components/website/renderer.tsx`)
```typescript
// ProductGridSection: fetch products via API or pass from server component
// Show stock badge:
{stock === 0 ? <Badge className="bg-red-100 text-red-700">Habis</Badge> : 
 stock > 0 && stock < 10 ? <Badge className="bg-amber-100 text-amber-700">Sisa {stock}</Badge> : null}

// Disable order button if stock === 0
<OrderForm disabled={stock === 0} />
```

### 6.2 Order Validation
- `POST /api/orders` → check product stock (if tracked) before creating order
- Atomic decrement: `UPDATE products SET stock = stock - $1 WHERE id = $2 AND stock >= $1`
- If stock insufficient → return 409 "Stok tidak mencukupi"

---

## 7. Task Breakdown (Ready for Coding)

| Task | File(s) | Estimate |
|------|---------|----------|
| 1. Create migration 016_products.sql | `supabase/migrations/016_create_products.sql` | 2h |
| 2. Run migration + verify RLS | Supabase CLI | 1h |
| 3. Create Storage bucket + policies | Supabase Dashboard / SQL | 1h |
| 4. Add Product types | `src/types/products.ts` | 1h |
| 5. Create product API route (GET, POST, PUT, DELETE) | `app/api/user/products/route.ts` | 4h |
| 6. Create product images API route | `app/api/user/products/[id]/images/route.ts` | 3h |
| 7. Image upload utility (resize, WebP, signed URL) | `src/lib/storage/products.ts` | 3h |
| 8. Product manager page (table, inline edit, bulk actions) | `app/dashboard/products/page.tsx` | 6h |
| 9. Product form component (reusable) | `src/components/dashboard/product-form.tsx` | 3h |
| 10. Update builder Product Grid to use DB products | `src/components/website/renderer.tsx`, `app/dashboard/[websiteId]/builder/[id]/page.tsx` | 4h |
| 11. Update public renderer for stock badges | `src/components/website/renderer.tsx` | 2h |
| 12. Add tier limit check helper | `src/lib/billing/limits.ts` | 1h |
| 13. Update order API for stock validation | `app/api/orders/route.ts` | 2h |
| 14. Integration testing (Free/Starter limits, images, stock) | Manual + script | 3h |
| 15. Update i18n (id/en) for new strings | `src/lib/i18n/locales/*.json` | 1h |

**Total: ~37 hours (~5 days)**

---

## 8. Acceptance Criteria (Definition of Done)

- [ ] Migration 016 applied successfully on staging + production
- [ ] Free user can create 5 products; 6th returns 403 with upgrade URL
- [ ] Starter user can create 50 products
- [ ] Image upload: max 5 files, 2MB each, auto WebP, signed URLs work
- [ ] Product manager page: CRUD works, inline edit, bulk actions, pagination, search
- [ ] Builder Product Grid shows live DB products (not JSON)
- [ ] Public storefront shows stock badges, disables order when stock=0
- [ ] Order creation decrements stock atomically (if enabled)
- [ ] All API endpoints have RLS protection (tested with 2 users)
- [ ] i18n strings added for id/en
- [ ] No TypeScript errors, ESLint clean
- [ ] Deployed to staging, smoke tested

---

## 9. Dependencies

- **Supabase Storage** enabled for project
- **Sharp** or **image-resizer** for image processing (Edge Runtime compatible)
- **Tier limits helper** from Sprint 4 (can be stubbed initially)

---

## 10. Rollback Plan

If critical issues:
1. Revert migration 016: `DROP TABLE products, product_images;`
2. Revert API routes to return 501
3. Builder falls back to JSON config (existing behavior)
4. Feature flag: `NEXT_PUBLIC_ENABLE_PRODUCTS_DB=false`