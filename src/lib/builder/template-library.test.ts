import { describe, expect, it } from "vitest";
import {
  DEFAULT_LIBRARY_NAME,
  LIBRARY_SLUG_PREFIX,
  buildLibrarySlug,
  isLibrarySlug,
  normalizeLibraryName,
} from "./template-library";

describe("buildLibrarySlug", () => {
  it("membuat slug unik dengan prefix saved-", () => {
    const uuid = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
    expect(buildLibrarySlug(uuid)).toBe(`${LIBRARY_SLUG_PREFIX}${uuid}`);
  });

  it("dua template yang disimpan tidak pernah bentrok slug", () => {
    // Inilah alasan slug library harus memakai uuid, bukan slug katalog:
    // UNIQUE (website_id, template_slug) akan menimpa baris sebelumnya.
    const a = buildLibrarySlug("11111111-1111-1111-1111-111111111111");
    const b = buildLibrarySlug("22222222-2222-2222-2222-222222222222");
    expect(a).not.toBe(b);
  });
});

describe("isLibrarySlug", () => {
  it("mengenali slug library", () => {
    expect(isLibrarySlug("saved-abc")).toBe(true);
  });

  it("menolak slug katalog, null, dan undefined", () => {
    // Slug katalog harus TETAP terbaca sebagai katalog supaya validasi
    // BUILT_IN_CATALOG di API tidak tersesat.
    expect(isLibrarySlug("food")).toBe(false);
    expect(isLibrarySlug(null)).toBe(false);
    expect(isLibrarySlug(undefined)).toBe(false);
    expect(isLibrarySlug("")).toBe(false);
  });

  it("tidak salah tangkap prefix yang mirip di tengah string", () => {
    expect(isLibrarySlug("my-saved-template")).toBe(false);
  });
});

describe("normalizeLibraryName", () => {
  it("memakai label default saat nama kosong", () => {
    expect(normalizeLibraryName("")).toBe(DEFAULT_LIBRARY_NAME);
    expect(normalizeLibraryName("   ")).toBe(DEFAULT_LIBRARY_NAME);
  });

  it("merapikan spasi berlebih", () => {
    expect(normalizeLibraryName("  Toko   Kopi  ")).toBe("Toko Kopi");
  });

  it("memotong nama yang terlalu panjang", () => {
    expect(normalizeLibraryName("x".repeat(200)).length).toBe(120);
  });

  it("mempertahankan nama yang sudah benar", () => {
    expect(normalizeLibraryName(DEFAULT_LIBRARY_NAME)).toBe(DEFAULT_LIBRARY_NAME);
  });
});