import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function repoFile(...parts: string[]): string {
  return readFileSync(join(process.cwd(), ...parts), "utf-8");
}

const MIGRATION_016 = repoFile("supabase", "migrations", "016_create_products.sql");
const PRODUCTS_API = repoFile("app", "api", "user", "products", "route.ts");
const IMAGES_API = repoFile("app", "api", "user", "products", "[id]", "images", "route.ts");
const ORDERS_API = repoFile("app", "api", "orders", "route.ts");

/**
 * F3-5b — RLS isolation & stock-concurrency (static check, tanpa koneksi live
 * Supabase). Model sama dengan `src/lib/websites/rls.test.ts`:
 * - assertion terhadap SQL migrasi (policy/definisi fungsi),
 * - assertion terhadap query builder & alur API (owner-scoping, atomic decrement).
 */

describe("products RLS isolation (016_create_products.sql)", () => {
  it("products: policy FOR ALL punya USING + WITH CHECK ke website milik auth.uid()", () => {
    const policy = MIGRATION_016.slice(
      MIGRATION_016.indexOf('CREATE POLICY "Products: user can manage own website products"')
    );
    expect(policy).toContain("ON products FOR ALL");
    expect(policy).toMatch(/USING \([\s\S]{0,200}SELECT id FROM websites WHERE user_id = auth\.uid\(\)/);
    expect(policy).toMatch(/WITH CHECK \([\s\S]{0,200}SELECT id FROM websites WHERE user_id = auth\.uid\(\)/);
  });

  it("product_images & product_variants diisolasi lewat join products -> websites", () => {
    expect(MIGRATION_016).toContain('CREATE POLICY "Product images: user can manage own"');
    expect(MIGRATION_016).toContain('CREATE POLICY "Product variants: user can manage own"');
    const joins = MIGRATION_016.match(/JOIN websites w ON w\.id = p\.website_id/g) ?? [];
    expect(joins.length).toBeGreaterThanOrEqual(5);
    expect(MIGRATION_016).toContain("WHERE w.user_id = auth.uid()");
  });

  it("stock_movements read-only untuk user: tanpa policy INSERT/UPDATE/DELETE (F3-2)", () => {
    expect(MIGRATION_016).toContain('CREATE POLICY "Stock movements: user can read own"');
    expect(MIGRATION_016).toContain("ON stock_movements FOR SELECT");
    expect(MIGRATION_016).not.toMatch(/ON stock_movements FOR (INSERT|UPDATE|DELETE|ALL)/);
    expect(MIGRATION_016).not.toContain('CREATE POLICY "Stock movements: system can insert"');
    expect(MIGRATION_016).not.toMatch(/^\s*WITH CHECK \(true\);$/m);
  });

  it("RLS aktif di semua tabel produk (products, product_images, product_variants, stock_movements)", () => {
    for (const table of ["products", "product_images", "product_variants", "stock_movements"]) {
      expect(MIGRATION_016).toContain(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`);
    }
  });

  it("least-privilege: hanya EXECUTE RPC yang di-grant, tidak ada GRANT tabel", () => {
    expect(MIGRATION_016).not.toMatch(
      /GRANT\s+(SELECT|INSERT|UPDATE|DELETE|ALL)[\s\S]{0,60}ON\s+(TABLE\s+)?(products|product_images|product_variants|stock_movements)\b/i
    );
    expect(MIGRATION_016).toContain(
      "GRANT EXECUTE ON FUNCTION decrement_product_stock(UUID, INTEGER) TO authenticated;"
    );
  });
});


describe("stock concurrency: decrement_product_stock (anti-oversell)", () => {
  it("atomic single-statement UPDATE + ROW_COUNT (tanpa SELECT-lalu-UPDATE / FOR UPDATE)", () => {
    const start = MIGRATION_016.indexOf("CREATE OR REPLACE FUNCTION decrement_product_stock");
    const end = MIGRATION_016.indexOf("CREATE OR REPLACE FUNCTION", start + 10);
    const fn = MIGRATION_016.slice(start, end);
    expect(fn).toContain("SET stock = CASE WHEN stock = -1 THEN -1 ELSE stock - p_quantity END");
    expect(fn).toContain("AND (stock = -1 OR stock >= p_quantity)");
    expect(fn).toContain("AND is_active = true;");
    expect(fn).toContain("GET DIAGNOSTICS v_count = ROW_COUNT;");
    expect(fn).toContain("RETURN v_count > 0;");
    // p_quantity tidak valid ditolak eksplisit (bukan diam-diam menambah stok)
    expect(fn).toContain("RAISE EXCEPTION 'decrement_product_stock: p_quantity harus > 0");
    // race window tertutup: tidak ada baca-lalu-tulis terpisah
    expect(fn).not.toContain("FOR UPDATE");
    expect(fn).not.toMatch(/SELECT[\s\S]{0,80}INTO[\s\S]{0,120}FROM products/);
  });

  it("semua fungsi helper SECURITY DEFINER + search_path terkunci", () => {
    const definer = "$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;";
    const occurrences = MIGRATION_016.split(definer).length - 1;
    expect(occurrences).toBeGreaterThanOrEqual(5); // check_product_limit, decrement, increment, log, reorder
    // decrement_product_stock sendiri: tepat satu definer, tanpa dynamic SQL
    const start = MIGRATION_016.indexOf("CREATE OR REPLACE FUNCTION decrement_product_stock");
    const end = MIGRATION_016.indexOf("CREATE OR REPLACE FUNCTION", start + 10);
    const decrement = MIGRATION_016.slice(start, end);
    expect(decrement.split(definer).length - 1).toBe(1);
    expect(decrement).not.toContain("EXECUTE format");
  });

  it("orders API: cek stok lewat RPC sebelum INSERT order dan balas 409 bila stok kurang", () => {
    expect(ORDERS_API).toContain(
      '.rpc("decrement_product_stock", { p_product_id: product.id, p_quantity: input.quantity })'
    );
    expect(ORDERS_API).toContain("{ status: 409 }");
    expect(ORDERS_API).toContain("Stok tidak mencukupi");
    const rpcIndex = ORDERS_API.indexOf('.rpc("decrement_product_stock"');
    const insertIndex = ORDERS_API.indexOf('.from("orders")');
    expect(rpcIndex).toBeGreaterThan(-1);
    expect(rpcIndex).toBeLessThan(insertIndex);
    // tidak ada penulisan kolom stock langsung dari API (selalu via RPC)
    expect(ORDERS_API).not.toMatch(/UPDATE products|stock:\s*product\.stock/);
  });

  it("orders API: rollback stok bila INSERT order gagal + satu log pergerakan stok (F2-2)", () => {
    expect(ORDERS_API).toContain(
      '.rpc("increment_product_stock", { p_product_id: product.id, p_quantity: input.quantity })'
    );
    const logCalls = ORDERS_API.match(/log_stock_movement/g) ?? [];
    expect(logCalls.length).toBe(2); // komentar + satu pemanggilan
    expect(ORDERS_API).not.toContain('.from("stock_movements")');
  });
});

describe("products API owner-scoping (static check)", () => {
  it("list produk memverifikasi kepemilikan website (id + user_id) sebelum query", () => {
    expect(PRODUCTS_API).toContain('.from("websites")');
    expect(PRODUCTS_API).toContain('.eq("user_id", userId)');
    expect(PRODUCTS_API).toContain('.eq("website_id", targetWebsiteId)');
  });

  it("upload/hapus gambar memverifikasi product -> website -> user_id", () => {
    expect(IMAGES_API).toContain('.from("websites")');
    expect(IMAGES_API).toContain('.eq("id", product.website_id)');
    expect(IMAGES_API).toContain('.eq("user_id", userId)');
    expect(IMAGES_API).toContain("product:products!inner(website_id)");
  });

  it("harga produk tidak pernah diambil dari body order (anti spoof)", () => {
    expect(ORDERS_API).toContain("const unitPrice = product ? product.price : input.product_price;");
    expect(ORDERS_API).toContain("const total = calcTotal(unitPrice, input.quantity);");
  });
});
