-- 019_increment_product_stock_fix.sql
-- Fix: increment_product_stock merusak sentinel unlimited (-1) menjadi -1 + qty.
-- Sekarang: stock = -1 tetap -1, dan p_quantity <= 0 ditolak eksplisit.
-- Idempotent: CREATE OR REPLACE FUNCTION.

CREATE OR REPLACE FUNCTION increment_product_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS VOID AS $$
BEGIN
    IF p_quantity IS NULL OR p_quantity <= 0 THEN
        RAISE EXCEPTION 'increment_product_stock: p_quantity harus > 0 (diberikan %)', p_quantity;
    END IF;

    UPDATE products
    SET stock = CASE WHEN stock = -1 THEN -1 ELSE stock + p_quantity END,
        updated_at = now()
    WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
