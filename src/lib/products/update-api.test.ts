import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function repoFile(...parts: string[]): string {
  return readFileSync(join(process.cwd(), ...parts), "utf-8");
}

const PRODUCTS_API = repoFile("app", "api", "user", "products", "route.ts");
const PRODUCT_FORM = repoFile("src", "components", "dashboard", "product-form.tsx");

/**
 * F3-3 regression guard (static check, model sama dengan rls.test.ts):
 * - PUT dulalu hanya baca JSON → edit via ProductForm (FormData) selalu 400.
 * - removeImage() dulu memakai index gabungan preview → gambar tersimpan tak pernah
 *   terhapus di server dan file baru bisa ikut terpotong.
 */
const PUT = PRODUCTS_API.slice(
  PRODUCTS_API.indexOf("export async function PUT"),
  PRODUCTS_API.indexOf("export async function DELETE")
);

describe("PUT /api/user/products — multipart contract (fix edit 400)", () => {
  it("PUT menerima multipart/form-data (ProductForm) DAN JSON (toggle/bulk)", () => {
    expect(PUT).toContain('contentType.includes("multipart/form-data")');
    expect(PUT).toContain("await req.formData()");
    expect(PUT).toContain("await req.json().catch(() => null)");
  });

  it("payload multipart dinormalisasi (number/boolean) sebelum productUpdateSchema", () => {
    expect(PUT).toContain("body.price = Number(body.price)");
    expect(PUT).toContain('body.is_active === "true"');
    expect(PUT).toContain("productUpdateSchema.safeParse(body)");
  });

  it("validasi file gambar dilakukan sebelum ada perubahan data", () => {
    const validateIdx = PUT.indexOf("validateImageFile");
    const ownershipIdx = PUT.indexOf('eq("user_id", userId)');
    const buildIdx = PUT.indexOf("// Build update object");
    expect(validateIdx).toBeGreaterThan(-1);
    expect(ownershipIdx).toBeGreaterThan(-1);
    expect(buildIdx).toBeGreaterThan(-1);
    expect(validateIdx).toBeLessThan(ownershipIdx);
    expect(validateIdx).toBeLessThan(buildIdx);
  });

  it("penghapusan gambar: setelah cek ownership & scoped ke product (in .eq product_id)", () => {
    const ownershipIdx = PUT.indexOf('eq("user_id", userId)');
    const removeIdx = PUT.indexOf("removeImageIds.length > 0");
    expect(removeIdx).toBeGreaterThan(ownershipIdx);
    expect(PUT).toMatch(
      /from\("product_images"\)\s*\.select\("id, storage_path"\)\s*\.eq\("product_id", productId\)\s*\.in\("id", removeImageIds\)/
    );
    // Hapus dari storage + DB (bukan hanya disembunyikan di client)
    expect(PUT).toContain("deleteProductImages(");
    expect(PUT).toMatch(/\.from\("product_images"\)\s*\.delete\(\)\s*\.eq\("product_id", productId\)/);
  });

  it("upload gambar baru melewati checkProductImageLimit dan insert row product_images", () => {
    expect(PUT).toContain("checkProductImageLimit(userId, productId, pendingImageFiles.length)");
    expect(PUT).toContain('from("product_images")');
    expect(PUT).toContain("uploadProductImages(website.id, productId");
  });
});

describe("ProductForm — payload edit & preview entries (fix index mismatch)", () => {
  it("mengirim id (mode edit) + remove_image_ids untuk gambar tersimpan yang dihapus", () => {
    expect(PRODUCT_FORM).toContain('formData.append("id", initialData.id)');
    expect(PRODUCT_FORM).toContain('formData.append("remove_image_ids", imageId)');
    expect(PRODUCT_FORM).toContain('formData.append("images", entry.file)');
  });

  it("preview tunggal imageEntries — tidak ada lagi formImages/imagePreviews paralel", () => {
    expect(PRODUCT_FORM).toContain("imageEntries");
    expect(PRODUCT_FORM).not.toContain("imagePreviews");
    expect(PRODUCT_FORM).not.toContain("formImages");
  });
});
