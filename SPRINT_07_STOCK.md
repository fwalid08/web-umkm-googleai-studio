# Sprint 7: Stock/Inventory System
**Duration:** 1.5 weeks (7-8 working days)  
**Goal:** Enable stock tracking per product/variant, atomic decrement on order, low stock alerts, and stock movement history.

---

## 1. User Stories

| ID | Story | Points |
|----|-------|--------|
| US-7.1 | As a merchant, I want to set stock quantity per product so I know inventory levels | 3 |
| US-7.2 | As a merchant, I want product variants (size, color) with separate stock so I can track accurately | 5 |
| US-7.3 | As a system, I want stock decremented atomically when order is placed so no overselling | 5 |
| US-7.4 | As a merchant, I want low stock alerts via WA/email so I can restock in time | 3 |
| US-7.5 | As a merchant, I want to see stock movement history (in/out/adjust) for audit | 3 |
| US-7.6 | As a merchant, I want bulk stock update via CSV so I can sync with offline counts | 2 |
| US-7.7 | As a customer, I want to see real-time stock on storefront ("Sisa 3", "Habis") | 2 |

**Total: 23 points**

---

## 2. Database Migrations

### 2.1 Migration 023: Add Stock Fields to Products
```sql
-- 023_add_stock_to_products.sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= -1); -- -1 = unlimited
ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER NOT NULL DEFAULT 5;
ALTER TABLE products ADD COLUMN IF NOT EXISTS track_stock BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(100); -- Merchant SKU

-- Index for low stock queries
CREATE INDEX idx_products_low_stock ON products(website_id, stock, low_stock_threshold) 
WHERE track_stock = true AND stock >= 0 AND stock <= low_stock_threshold;
```

### 2.2 Migration 021: Product Variants
```sql
-- 021_create_product_variants.sql
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL, -- e.g., "Size M / Merah", "1kg"
    sku VARCHAR(100), -- Merchant SKU for variant
    price_adjustment BIGINT NOT NULL DEFAULT 0, -- Additional price (can be negative)
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= -1),
    low_stock_threshold INTEGER NOT NULL DEFAULT 5,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE (product_id, name)
);

CREATE INDEX idx_product_variants_product ON product_variants(product_id, is_active, sort_order);

ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Variants: user can manage own product variants"
ON product_variants FOR ALL
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

CREATE TRIGGER product_variants_updated_at
BEFORE UPDATE ON product_variants
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2.3 Migration 022: Stock Movements
```sql
-- 022_create_stock_movements.sql
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('in', 'out', 'adjustment', 'return', 'waste')),
    quantity INTEGER NOT NULL, -- Positive for in, negative for out
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    reference_type VARCHAR(30), -- 'order', 'purchase', 'adjustment', 'return'
    reference_id UUID, -- Order ID, Purchase ID, etc.
    note TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stock_movements_product ON stock_movements(product_id, created_at DESC);
CREATE INDEX idx_stock_movements_variant ON stock_movements(variant_id, created_at DESC);
CREATE INDEX idx_stock_movements_reference ON stock_movements(reference_type, reference_id);

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stock movements: user can view own"
ON stock_movements FOR SELECT
USING (
    product_id IN (
        SELECT p.id FROM products p
        JOIN websites w ON w.id = p.website_id
        WHERE w.user_id = auth.uid()
    )
);

-- Server-side insert only (service-role)
```

---

## 3. API Contracts

### 3.1 Types (`src/types/stock.ts`)
```typescript
export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  sku: string | null;
  price_adjustment: number;
  stock: number;
  low_stock_threshold: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  variant_id: string | null;
  type: 'in' | 'out' | 'adjustment' | 'return' | 'waste';
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reference_type: string | null;
  reference_id: string | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
}

export interface StockAdjustmentInput {
  product_id: string;
  variant_id?: string;
  type: 'in' | 'out' | 'adjustment' | 'return' | 'waste';
  quantity: number; // Absolute quantity to add/subtract
  note?: string;
  reference_type?: string;
  reference_id?: string;
}

export interface BulkStockUpdateInput {
  updates: Array<{
    product_id: string;
    variant_id?: string;
    stock: number;
  }>;
}

export interface LowStockAlert {
  product_id: string;
  product_name: string;
  variant_id: string | null;
  variant_name: string | null;
  current_stock: number;
  threshold: number;
  website_id: string;
  website_name: string;
}
```

### 3.2 Endpoints

#### GET `/api/user/products/:id/variants`
```
Response: { success: true, data: { variants: ProductVariant[] } }
```

#### POST `/api/user/products/:id/variants`
```
Body: { name, sku?, price_adjustment?, stock?, low_stock_threshold? }
Response: { success: true, data: { variant: ProductVariant } }
```

#### PUT `/api/user/products/:id/variants/:variantId`
```
Body: Partial<VariantCreateInput>
Response: { success: true, data: { variant: ProductVariant } }
```

#### DELETE `/api/user/products/:id/variants/:variantId`
```
Response: { success: true }
```

#### POST `/api/user/stock/adjust`
```
Body: StockAdjustmentInput
- Atomic update: product/variant stock + create movement record
Response: { success: true, data: { new_stock: number, movement: StockMovement } }
```

#### POST `/api/user/stock/bulk-update`
```
Body: BulkStockUpdateInput
- Transaction: update multiple products/variants
Response: { success: true, data: { updated: number } }
```

#### GET `/api/user/stock/movements`
```
Query: product_id?, variant_id?, type?, page=1, limit=50, date_from?, date_to?
Response: { success: true, data: { movements: StockMovement[], total, page, limit, total_pages } }
```

#### GET `/api/user/stock/low-stock`
```
Response: { success: true, data: { alerts: LowStockAlert[] } }
```

#### POST `/api/user/stock/import`
```
Content-Type: multipart/form-data
Field: file (CSV with columns: product_id, variant_id, stock)
Response: { success: true, data: { processed: number, errors: string[] } }
```

---

## 4. Atomic Stock Decrement on Order

### 4.1 Order Creation with Stock Check (`app/api/orders/route.ts`)
```typescript
import { decrementStock } from '@/lib/stock/decrement';

export async function POST(request: NextRequest) {
  // ... existing validation ...
  
  // Check stock if product has variants or track_stock
  const { data: product } = await supabase
    .from('products')
    .select('id, track_stock, stock, low_stock_threshold')
    .eq('id', productId) // Need to map product_name to product_id
    .single();
  
  if (product?.track_stock && product.stock >= 0) {
    // Try atomic decrement
    const result = await decrementStock({
      productId: product.id,
      variantId: null, // TODO: support variant selection
      quantity: input.quantity,
      referenceType: 'order',
      referenceId: order.id, // Will be set after insert
      note: `Order #${order.id}`,
    });
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Stok tidak mencukupi' },
        { status: 409 }
      );
    }
  }
  
  // ... create order ...
}
```

### 4.2 Stock Decrement Library (`src/lib/stock/decrement.ts`)
```typescript
import { createServiceSupabaseClient } from '@/lib/supabase/service';

export interface DecrementStockInput {
  productId: string;
  variantId?: string;
  quantity: number;
  referenceType: string;
  referenceId: string;
  note?: string;
}

export interface DecrementResult {
  success: boolean;
  newStock?: number;
  error?: string;
}

export async function decrementStock(input: DecrementStockInput): Promise<DecrementResult> {
  const supabase = createServiceSupabaseClient();
  const { productId, variantId, quantity, referenceType, referenceId, note } = input;
  
  if (quantity <= 0) return { success: false, error: 'Quantity must be positive' };
  
  // Use advisory lock to prevent race conditions
  const lockKey = variantId ? `variant:${variantId}` : `product:${productId}`;
  await supabase.rpc('pg_advisory_xact_lock', { key: hashString(lockKey) });
  
  try {
    if (variantId) {
      // Decrement variant stock
      const { data: variant, error } = await supabase
        .from('product_variants')
        .select('stock, low_stock_threshold')
        .eq('id', variantId)
        .single();
      
      if (error || !variant) return { success: false, error: 'Variant not found' };
      if (variant.stock === -1) return { success: true, newStock: -1 }; // Unlimited
      if (variant.stock < quantity) return { success: false, error: 'Stok tidak mencukupi' };
      
      const newStock = variant.stock - quantity;
      
      // Update variant + create movement in transaction
      const { error: updateError } = await supabase.rpc('decrement_variant_stock', {
        p_variant_id: variantId,
        p_quantity: quantity,
        p_reference_type: referenceType,
        p_reference_id: referenceId,
        p_note: note,
        p_new_stock: newStock,
      });
      
      if (updateError) throw updateError;
      
      // Check low stock alert
      if (newStock <= variant.low_stock_threshold && newStock >= 0) {
        await triggerLowStockAlert(productId, variantId, newStock, variant.low_stock_threshold);
      }
      
      return { success: true, newStock };
    } else {
      // Decrement product stock (no variants)
      const { data: product, error } = await supabase
        .from('products')
        .select('stock, low_stock_threshold, track_stock')
        .eq('id', productId)
        .single();
      
      if (error || !product) return { success: false, error: 'Product not found' };
      if (!product.track_stock) return { success: true, newStock: product.stock };
      if (product.stock === -1) return { success: true, newStock: -1 };
      if (product.stock < quantity) return { success: false, error: 'Stok tidak mencukupi' };
      
      const newStock = product.stock - quantity;
      
      const { error: updateError } = await supabase.rpc('decrement_product_stock', {
        p_product_id: productId,
        p_quantity: quantity,
        p_reference_type: referenceType,
        p_reference_id: referenceId,
        p_note: note,
        p_new_stock: newStock,
      });
      
      if (updateError) throw updateError;
      
      if (newStock <= product.low_stock_threshold && newStock >= 0) {
        await triggerLowStockAlert(productId, null, newStock, product.low_stock_threshold);
      }
      
      return { success: true, newStock };
    }
  } finally {
    await supabase.rpc('pg_advisory_xact_unlock', { key: hashString(lockKey) });
  }
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

async function triggerLowStockAlert(
  productId: string, 
  variantId: string | null, 
  currentStock: number, 
  threshold: number
): Promise<void> {
  const supabase = createServiceSupabaseClient();
  
  // Get product + website + user for notification
  const { data: product } = await supabase
    .from('products')
    .select('name, website_id, websites!inner(user_id, name)')
    .eq('id', productId)
    .single();
  
  if (!product) return;
  
  const variantName = variantId ? 
    (await supabase.from('product_variants').select('name').eq('id', variantId).single()).data?.name 
    : null;
  
  // Dispatch notification (reuse Sprint 3 dispatcher)
  const { dispatchNotification } = await import('@/lib/notify/dispatcher');
  await dispatchNotification({
    event: {
      type: 'stock.low',
      website_id: product.website_id,
      payload: {
        product_id: productId,
        product_name: product.name,
        variant_id: variantId,
        variant_name: variantName,
        current_stock: currentStock,
        threshold,
      },
    },
  });
}
```

### 4.3 Postgres RPC Functions (Run via Migration)
```sql
-- 023b_stock_rpc_functions.sql
CREATE OR REPLACE FUNCTION decrement_product_stock(
    p_product_id UUID,
    p_quantity INT,
    p_reference_type TEXT,
    p_reference_id UUID,
    p_note TEXT,
    p_new_stock INT
) RETURNS VOID AS $$
BEGIN
    UPDATE products 
    SET stock = p_new_stock, updated_at = now()
    WHERE id = p_product_id;
    
    INSERT INTO stock_movements (product_id, type, quantity, previous_stock, new_stock, reference_type, reference_id, note)
    VALUES (p_product_id, 'out', -p_quantity, p_new_stock + p_quantity, p_new_stock, p_reference_type, p_reference_id, p_note);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_variant_stock(
    p_variant_id UUID,
    p_quantity INT,
    p_reference_type TEXT,
    p_reference_id UUID,
    p_note TEXT,
    p_new_stock INT
) RETURNS VOID AS $$
DECLARE
    v_product_id UUID;
BEGIN
    SELECT product_id INTO v_product_id FROM product_variants WHERE id = p_variant_id;
    
    UPDATE product_variants 
    SET stock = p_new_stock, updated_at = now()
    WHERE id = p_variant_id;
    
    INSERT INTO stock_movements (product_id, variant_id, type, quantity, previous_stock, new_stock, reference_type, reference_id, note)
    VALUES (v_product_id, p_variant_id, 'out', -p_quantity, p_new_stock + p_quantity, p_new_stock, p_reference_type, p_reference_id, p_note);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION adjust_stock(
    p_product_id UUID,
    p_variant_id UUID DEFAULT NULL,
    p_type TEXT,
    p_quantity INT,
    p_reference_type TEXT DEFAULT NULL,
    p_reference_id UUID DEFAULT NULL,
    p_note TEXT DEFAULT NULL
) RETURNS TABLE(new_stock INT) AS $$
DECLARE
    v_current_stock INT;
    v_product_id UUID;
BEGIN
    IF p_variant_id IS NOT NULL THEN
        SELECT product_id, stock INTO v_product_id, v_current_stock FROM product_variants WHERE id = p_variant_id;
        IF v_current_stock = -1 THEN RETURN QUERY SELECT -1; END IF;
        
        UPDATE product_variants SET stock = stock + p_quantity, updated_at = now() WHERE id = p_variant_id;
        INSERT INTO stock_movements (product_id, variant_id, type, quantity, previous_stock, new_stock, reference_type, reference_id, note)
        VALUES (v_product_id, p_variant_id, p_type, p_quantity, v_current_stock, v_current_stock + p_quantity, p_reference_type, p_reference_id, p_note);
        RETURN QUERY SELECT v_current_stock + p_quantity;
    ELSE
        SELECT stock INTO v_current_stock FROM products WHERE id = p_product_id;
        IF v_current_stock = -1 THEN RETURN QUERY SELECT -1; END IF;
        
        UPDATE products SET stock = stock + p_quantity, updated_at = now() WHERE id = p_product_id;
        INSERT INTO stock_movements (product_id, type, quantity, previous_stock, new_stock, reference_type, reference_id, note)
        VALUES (p_product_id, p_type, p_quantity, v_current_stock, v_current_stock + p_quantity, p_reference_type, p_reference_id, p_note);
        RETURN QUERY SELECT v_current_stock + p_quantity;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 5. UI Specification

### 5.1 Product Form - Stock Fields
```
Fields added to product form:
- Track Stok: [Toggle] (default: on)
- Stok: [Number Input] (-1 untuk unlimited)
- Ambang Stok Rendah: [Number Input] (default: 5)
- SKU: [Text Input]

Variants Section (collapsible):
- [Tambah Variasi] button
- Table: Nama | SKU | Harga Tambahan | Stok | Ambang Rendah | Aktif | Aksi
- Inline add/edit/delete
```

### 5.2 Stock Report Page (`/dashboard/stock/page.tsx`)
```
Tabs: Ringkasan | Pergerakan | Stok Rendah | Import

Ringkasan:
- Cards: Total Produk, Total Variasi, Nilai Stok (estimasi), Produk Stok Rendah
- Table: Produk | Variasi | Stok | Ambang | Status | Nilai | Aksi
- Status badges: Normal (hijau), Rendah (kuning), Habis (merah), Unlimited (biru)

Pergerakan:
- Table: Tanggal | Produk | Variasi | Tipe | Qty | Stok Sebelum | Stok Sesudah | Referensi | Catatan
- Filters: Tipe, Produk, Rentang Tanggal
- Export CSV

Stok Rendah:
- List of products/variants where stock <= threshold
- Quick actions: Tambah Stok, Lihat Detail

Import:
- Download template CSV
- Upload CSV → preview → confirm
- Columns: product_id, variant_id (optional), stock
```

### 5.3 Public Storefront Stock Display
```typescript
// In ProductGridSection (renderer.tsx)
const stockDisplay = (stock: number, threshold: number) => {
  if (stock === -1) return null; // Unlimited
  if (stock === 0) return <Badge className="bg-red-100 text-red-700">Habis</Badge>;
  if (stock <= threshold) return <Badge className="bg-amber-100 text-amber-700">Sisa {stock}</Badge>;
  return null;
};

// Disable order button if stock === 0
<OrderForm disabled={stock === 0} />
```

---

## 6. Tier Limits

| Feature | Free | Starter | Growth | Enterprise |
|---------|------|---------|--------|------------|
| Stock Tracking | ❌ | ✅ | ✅ | ✅ |
| Variants | ❌ | ✅ (max 3/product) | ✅ (max 10/product) | ✅ (unlimited) |
| Low Stock Alerts | ❌ | ✅ | ✅ | ✅ |
| Stock History | ❌ | ✅ (30 days) | ✅ (1 year) | ✅ (unlimited) |
| Bulk Import | ❌ | ✅ | ✅ | ✅ |

**Enforcement:**
- API checks `allowStockTracking` from tier limits (Sprint 4)
- UI hides stock fields on Free tier
- Variants API returns 403 on Free tier

---

## 7. Task Breakdown

| Task | File(s) | Estimate |
|------|---------|----------|
| 1. Migration 023_add_stock_to_products.sql | `supabase/migrations/023_add_stock_to_products.sql` | 1h |
| 2. Migration 021_create_product_variants.sql | `supabase/migrations/021_create_product_variants.sql` | 1h |
| 3. Migration 022_create_stock_movements.sql | `supabase/migrations/022_create_stock_movements.sql` | 1h |
| 4. Migration 023b_stock_rpc_functions.sql | `supabase/migrations/023b_stock_rpc_functions.sql` | 1h |
| 5. Run migrations + verify | Supabase CLI | 1h |
| 6. Update Product types + API for stock fields | `src/types/products.ts`, `app/api/user/products/route.ts` | 2h |
| 7. Create variants API | `app/api/user/products/[id]/variants/route.ts` | 3h |
| 8. Create stock adjustment API | `app/api/user/stock/adjust/route.ts` | 2h |
| 9. Create bulk update API | `app/api/user/stock/bulk-update/route.ts` | 2h |
| 10. Create stock movements API | `app/api/user/stock/movements/route.ts` | 2h |
| 11. Create low stock API | `app/api/user/stock/low-stock/route.ts` | 1h |
| 12. Create CSV import API | `app/api/user/stock/import/route.ts` | 2h |
| 13. Stock decrement library + RPC integration | `src/lib/stock/decrement.ts` | 3h |
| 14. Integrate stock check in order API | `app/api/orders/route.ts` | 2h |
| 15. Product form UI - stock fields + variants | `app/dashboard/products/page.tsx` (form) | 4h |
| 16. Stock report page UI | `app/dashboard/stock/page.tsx` | 4h |
| 17. Public storefront stock badges | `src/components/website/renderer.tsx` | 1h |
| 18. Tier limit integration | Use `checkStockTrackingLimit` from Sprint 4 | 1h |
| 19. Integration testing | Manual | 3h |
| 20. Update i18n | `src/lib/i18n/locales/*.json` | 1h |

**Total: ~38 hours (~5 days)**

---

## 8. Acceptance Criteria

- [ ] Product has stock field (-1 = unlimited), low_stock_threshold, track_stock toggle
- [ ] Product variants with separate stock, price adjustment, SKU
- [ ] Order creation atomically decrements stock (product or variant)
- [ ] Race condition handled: concurrent orders don't oversell (advisory lock + RPC)
- [ ] Low stock alert sent via WA when stock <= threshold after decrement
- [ ] Stock movements logged: in/out/adjustment/return/waste with reference
- [ ] Stock report page: summary, movements, low stock list, CSV import
- [ ] Public storefront shows "Sisa X", "Habis" badges, disables order when stock=0
- [ ] Free tier: stock tracking disabled (UI hidden, API 403)
- [ ] Starter: variants max 3/product, stock tracking enabled
- [ ] All APIs have RLS protection
- [ ] No TypeScript errors, ESLint clean

---

## 9. CSV Import Format

```csv
product_id,variant_id,stock
"uuid-product-1",,100
"uuid-product-2","uuid-variant-1",50
"uuid-product-2","uuid-variant-2",30
```

- `variant_id` optional (empty = update product base stock)
- Validates product/variant ownership
- Transaction: all or nothing
- Returns errors per row

---

## 10. Rollback Plan

1. Drop `product_variants`, `stock_movements` tables
2. Remove `stock`, `low_stock_threshold`, `track_stock`, `sku` from `products`
3. Drop RPC functions
4. Revert order API to skip stock check
5. Feature flag: `NEXT_PUBLIC_ENABLE_STOCK=false`