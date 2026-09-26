-- 016_create_products.sql
-- Sprint 1: Products Management System
-- Creates products table, product_images table, RLS policies, indexes, and storage bucket

-- ============================================
-- PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price BIGINT NOT NULL CHECK (price >= 0), -- IDR utuh (tanpa sen) — keputusan F2-3
    category VARCHAR(100) DEFAULT 'Umum',
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= -1), -- -1 = unlimited
    low_stock_threshold INTEGER NOT NULL DEFAULT 5,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_website_id ON products(website_id);
CREATE INDEX IF NOT EXISTS idx_products_website_active ON products(website_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_category ON products(website_id, category);
CREATE INDEX IF NOT EXISTS idx_products_sort_order ON products(website_id, sort_order);

-- RLS Policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policy: User can manage products for their own websites (idempotent: DROP + CREATE, pola 011)
DROP POLICY IF EXISTS "Products: user can manage own website products" ON products;
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

-- Trigger for updated_at (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'products_updated_at') THEN
    CREATE TRIGGER products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================
-- PRODUCT IMAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL, -- e.g., product-images/{website_id}/{product_id}/{uuid}.webp
    public_url TEXT NOT NULL,   -- signed URL or CDN URL
    alt_text VARCHAR(200),
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    width INTEGER,
    height INTEGER,
    file_size BIGINT,
    mime_type VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_primary ON product_images(product_id, is_primary) WHERE is_primary = true;

-- RLS Policies
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Product images: user can manage own" ON product_images;
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

-- ============================================
-- STORAGE BUCKET (run via Supabase Dashboard or CLI)
-- ============================================
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--     'product-images',
--     'product-images',
--     false, -- private bucket, use signed URLs
--     2097152, -- 2MB limit
--     ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
-- );

-- Storage Policies (run via Supabase Dashboard or CLI)
-- CREATE POLICY "Product images: authenticated upload"
-- ON storage.objects FOR INSERT TO authenticated
-- WITH CHECK (
--     bucket_id = 'product-images' AND
--     auth.uid()::text = (storage.foldername(name))[1]
-- );

-- CREATE POLICY "Product images: owner read"
-- ON storage.objects FOR SELECT TO authenticated
-- USING (
--     bucket_id = 'product-images' AND
--     auth.uid()::text = (storage.foldername(name))[1]
-- );

-- CREATE POLICY "Product images: owner update"
-- ON storage.objects FOR UPDATE TO authenticated
-- USING (
--     bucket_id = 'product-images' AND
--     auth.uid()::text = (storage.foldername(name))[1]
-- );

-- CREATE POLICY "Product images: owner delete"
-- ON storage.objects FOR DELETE TO authenticated
-- USING (
--     bucket_id = 'product-images' AND
--     auth.uid()::text = (storage.foldername(name))[1]
-- );

-- ============================================
-- STOCK MOVEMENTS TABLE (for Sprint 7 - Inventory)
-- ============================================
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID, -- nullable, for future product_variants table
    type VARCHAR(20) NOT NULL CHECK (type IN ('in', 'out', 'adjust')),
    quantity INTEGER NOT NULL,
    reference_id UUID, -- order_id, adjustment_id, etc.
    reference_type VARCHAR(50), -- 'order', 'adjustment', 'restock', etc.
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at DESC);

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Stock movements: user can read own" ON stock_movements;
CREATE POLICY "Stock movements: user can read own"
ON stock_movements FOR SELECT
USING (
    product_id IN (
        SELECT p.id FROM products p
        JOIN websites w ON w.id = p.website_id
        WHERE w.user_id = auth.uid()
    )
);

-- F3-2: sengaja TIDAK ada policy INSERT/UPDATE/DELETE untuk anon/authenticated.
-- Audit pergerakan stok hanya ditulis lewat fungsi SECURITY DEFINER
-- (log_stock_movement) atau service-role client; keduanya bypass RLS dan
-- memeriksa kepemilikan di level API. Policy `WITH CHECK (true)` dihapus karena
-- footgun: kalau suatu saat GRANT tabel ditambahkan, siapa pun bisa menulis baris
-- stock_movements untuk produk milik tenant lain.

-- ============================================
-- PRODUCT VARIANTS TABLE (for Sprint 7 - Inventory)
-- ============================================
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL, -- e.g., "Size M / Red"
    sku VARCHAR(100),
    price_adjustment BIGINT NOT NULL DEFAULT 0, -- bisa negatif atau positif
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= -1),
    low_stock_threshold INTEGER NOT NULL DEFAULT 5,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku) WHERE sku IS NOT NULL;

ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Product variants: user can manage own" ON product_variants;
CREATE POLICY "Product variants: user can manage own"
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

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'product_variants_updated_at') THEN
    CREATE TRIGGER product_variants_updated_at
    BEFORE UPDATE ON product_variants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check product limit for tier
-- Reads plans.max_products when the 013 migration has run; falls back to tier constants otherwise.
CREATE OR REPLACE FUNCTION check_product_limit(p_user_id UUID, p_website_id UUID)
RETURNS TABLE(ok BOOLEAN, current_count INTEGER, max_limit INTEGER) AS $$
DECLARE
    v_tier TEXT;
    v_plan_max INTEGER;
    v_count INTEGER;
    v_max INTEGER;
BEGIN
    -- Get user tier and plan max (tolerates pre-013 DBs without the column)
    BEGIN
        SELECT u.tier, COALESCE(p.max_products, 0)
        INTO v_tier, v_plan_max
        FROM users u
        LEFT JOIN plans p ON p.id = u.plan_id
        WHERE u.id = p_user_id;
    EXCEPTION WHEN undefined_column THEN
        SELECT u.tier, 0 INTO v_tier, v_plan_max
        FROM users u
        WHERE u.id = p_user_id;
    END;

    -- Fallback tier limits
    v_max := CASE
        WHEN v_plan_max > 0 THEN v_plan_max
        WHEN v_tier = 'free' THEN 5
        WHEN v_tier = 'starter' THEN 50
        WHEN v_tier = 'growth' THEN 200
        WHEN v_tier = 'enterprise' THEN 9999
        ELSE 5
    END;

    -- Count current products for website
    SELECT COUNT(*) INTO v_count
    FROM products
    WHERE website_id = p_website_id;

    ok := v_count < v_max;
    current_count := v_count;
    max_limit := v_max;
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to decrement stock atomically
-- Returns TRUE when exactly one row was decremented (stock sufficient), FALSE otherwise.
-- Unlimited stock (-1) tetap -1 (sentinel tidak dikorupsi menjadi -1 - qty, yang akan
-- melanggar CHECK stock >= -1).
CREATE OR REPLACE FUNCTION decrement_product_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    v_count INTEGER;
BEGIN
    IF p_quantity IS NULL OR p_quantity <= 0 THEN
        RAISE EXCEPTION 'decrement_product_stock: p_quantity harus > 0 (diberikan %)', p_quantity;
    END IF;

    UPDATE products
    SET stock = CASE WHEN stock = -1 THEN -1 ELSE stock - p_quantity END,
        updated_at = now()
    WHERE id = p_product_id
      AND (stock = -1 OR stock >= p_quantity)
      AND is_active = true;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to increment stock
CREATE OR REPLACE FUNCTION increment_product_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE products
    SET stock = stock + p_quantity,
        updated_at = now()
    WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to log stock movement
CREATE OR REPLACE FUNCTION log_stock_movement(
    p_product_id UUID,
    p_type TEXT,
    p_quantity INTEGER,
    p_reference_id UUID DEFAULT NULL,
    p_reference_type TEXT DEFAULT NULL,
    p_note TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO stock_movements (product_id, type, quantity, reference_id, reference_type, note)
    VALUES (p_product_id, p_type, p_quantity, p_reference_id, p_reference_type, p_note);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Atomic product reorder (single CASE-based UPDATE, F2-6).
-- Caller must verify ownership before invoking.
CREATE OR REPLACE FUNCTION reorder_products(p_product_ids UUID[], p_orders INTEGER[])
RETURNS VOID AS $$
BEGIN
    IF array_length(p_product_ids, 1) IS DISTINCT FROM array_length(p_orders, 1) THEN
        RAISE EXCEPTION 'reorder_products: arrays must have equal length';
    END IF;
    UPDATE products AS p
    SET sort_order = v.ord,
        updated_at = now()
    FROM (
        SELECT unnest(p_product_ids) AS pid, unnest(p_orders) AS ord
    ) AS v
    WHERE p.id = v.pid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- GRANTS (least-privilege: app uses service-role + explicit user_id/website_id
-- filters, mirroring 011_rls_hardening.sql default-deny; direct anon/authenticated
-- writes stay blocked by RLS policies above)
-- ============================================
-- No GRANTs to anon/authenticated here on purpose: all reads/writes go through
-- API routes with the service-role client. EXECUTE on helpers is granted to
-- authenticated for RPC use from server-side code paths that assume a user context.
GRANT EXECUTE ON FUNCTION check_product_limit(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_product_stock(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_product_stock(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION log_stock_movement(UUID, TEXT, INTEGER, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION reorder_products(UUID[], INTEGER[]) TO authenticated;