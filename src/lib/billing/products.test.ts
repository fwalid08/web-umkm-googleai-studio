import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  getProductTierLimits,
  PRODUCT_TIER_LIMITS,
} from "@/lib/billing/limits";
import {
  productCreateSchema,
  productUpdateSchema,
} from "@/types/products";

describe("PRODUCT_TIER_LIMITS (F3-5)", () => {
  it("free tier: 5 products / 3 images / 0 variants", () => {
    expect(PRODUCT_TIER_LIMITS.free).toMatchObject({
      maxProducts: 5,
      maxImagesPerProduct: 3,
      maxVariantsPerProduct: 0,
    });
  });

  it("starter tier: 50 products / 5 images", () => {
    expect(PRODUCT_TIER_LIMITS.starter).toMatchObject({
      maxProducts: 50,
      maxImagesPerProduct: 5,
    });
  });

  it("unknown tier falls back to free", () => {
    expect(getProductTierLimits("unknown-tier")).toEqual(PRODUCT_TIER_LIMITS.free);
  });
});

describe("productCreateSchema (F3-5)", () => {
  it("accepts valid product", () => {
    const r = productCreateSchema.safeParse({ name: "Kopi", price: 18000 });
    expect(r.success).toBe(true);
  });

  it("rejects negative price", () => {
    const r = productCreateSchema.safeParse({ name: "Kopi", price: -1 });
    expect(r.success).toBe(false);
  });

  it("rejects empty name", () => {
    const r = productCreateSchema.safeParse({ name: "", price: 1000 });
    expect(r.success).toBe(false);
  });

  it("rejects stock below -1", () => {
    const r = productCreateSchema.safeParse({ name: "Kopi", price: 1000, stock: -2 });
    expect(r.success).toBe(false);
  });

  it("productUpdateSchema allows partial payload", () => {
    const r = productUpdateSchema.safeParse({ price: 20000 });
    expect(r.success).toBe(true);
  });
});

describe("Sprint 01 Products & Orders RLS & Security (F3-5 static checks)", () => {
  const root = path.resolve(import.meta.dirname, "../../..");

  it("016_create_products.sql enables RLS on products, product_images, stock_movements", () => {
    const sql = fs.readFileSync(path.join(root, "supabase/migrations/016_create_products.sql"), "utf8");
    expect(sql).toContain("ALTER TABLE products ENABLE ROW LEVEL SECURITY;");
    expect(sql).toContain("ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;");
    expect(sql).toContain("ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;");
  });

  it("016_create_products.sql enforces website ownership isolation for products", () => {
    const sql = fs.readFileSync(path.join(root, "supabase/migrations/016_create_products.sql"), "utf8");
    expect(sql).toContain('CREATE POLICY "Products: user can manage own website products"');
    expect(sql).toContain("WHERE user_id = auth.uid()");
  });

  it("016_create_products.sql isolates product_images and stock_movements via website owner", () => {
    const sql = fs.readFileSync(path.join(root, "supabase/migrations/016_create_products.sql"), "utf8");
    expect(sql).toContain('CREATE POLICY "Product images: user can manage own"');
    expect(sql).toContain('CREATE POLICY "Stock movements: user can read own"');
    expect(sql).toContain("WHERE w.user_id = auth.uid()");
  });

  it("decrement_product_stock RPC is concurrency-safe (uses atomic UPDATE with ROW_COUNT check)", () => {
    const sql = fs.readFileSync(path.join(root, "supabase/migrations/016_create_products.sql"), "utf8");
    expect(sql).toContain("CREATE OR REPLACE FUNCTION decrement_product_stock");
    expect(sql).toContain("UPDATE products");
    expect(sql).toContain("SET stock = CASE WHEN stock = -1 THEN -1 ELSE stock - p_quantity END");
    expect(sql).toContain("WHERE id = p_product_id");
    expect(sql).toContain("AND (stock = -1 OR stock >= p_quantity)");
    expect(sql).toContain("GET DIAGNOSTICS v_count = ROW_COUNT;");
  });

  it("app/api/orders/route.ts verifies product price and stock atomically via DB lookup", () => {
    const code = fs.readFileSync(path.join(root, "app/api/orders/route.ts"), "utf8");
    // Verifies product lookup by id / name
    expect(code).toContain('.from("products")');
    expect(code).toContain('.select("id, name, price, stock, is_active")');
    // Verifies server-side calculated price
    expect(code).toContain("calcTotal(unitPrice, input.quantity)");
    // Verifies atomic decrement RPC call
    expect(code).toContain('.rpc("decrement_product_stock"');
  });

  it("app/api/user/products/reorder/route.ts updates sort order atomically within user/website scope", () => {
    const code = fs.readFileSync(path.join(root, "app/api/user/products/reorder/route.ts"), "utf8");
    expect(code).toContain('.rpc("reorder_products"');
    expect(code).toContain(".eq(\"user_id\", userId)");
  });
});
