import { describe, expect, it } from "vitest";
import {
  RESERVED_SLUGS,
  SLUG_MAX_LENGTH,
  isReservedSlug,
  isReservedSlugPath,
  normalizeSlug,
  slugError,
} from "./slug";

describe("normalizeSlug", () => {
  it("lowercase + ganti spasi/karakter non-alnum jadi '-'", () => {
    expect(normalizeSlug("Tentang Kami")).toBe("tentang-kami");
    expect(normalizeSlug("Kontak & CS!!")).toBe("kontak-cs");
  });

  it("rapatkan '-' ganda dan potong '-' di ujung", () => {
    expect(normalizeSlug("--promo---ramadan--")).toBe("promo-ramadan");
    expect(normalizeSlug("a   b")).toBe("a-b");
  });

  it("buang aksen (NFD)", () => {
    expect(normalizeSlug("Café Résumé")).toBe("cafe-resume");
  });

  it("kembalikan string kosong bila tak ada karakter valid", () => {
    expect(normalizeSlug("***")).toBe("");
    expect(normalizeSlug("")).toBe("");
  });

  it("pertahankan angka & huruf", () => {
    expect(normalizeSlug("Promo 2026")).toBe("promo-2026");
  });
});

describe("slugError", () => {
  it("menolak slug kosong", () => {
    expect(slugError("")).toMatch(/wajib/i);
  });

  it("menolak slug > panjang maks", () => {
    expect(slugError("a".repeat(SLUG_MAX_LENGTH + 1))).toMatch(/maksimal/i);
  });

  it("menolak format tidak valid", () => {
    expect(slugError("Tentang-Kami")).not.toBeNull(); // huruf besar
    expect(slugError("-tentang")).not.toBeNull();
    expect(slugError("tentang--kami")).not.toBeNull();
    expect(slugError("tentang_kami")).not.toBeNull();
  });

  it("menolak slug reserved (termasuk 'home')", () => {
    for (const s of ["home", "dashboard", "api", "p", "page-builder"]) {
      expect(slugError(s)).toMatch(/dilindungi/i);
    }
  });

  it("menerima slug normal", () => {
    expect(slugError("tentang-kami")).toBeNull();
    expect(slugError("promo-2026")).toBeNull();
  });
});

describe("isReservedSlug / RESERVED_SLUGS", () => {
  it("mengenali slug sistem", () => {
    expect(isReservedSlug("dashboard")).toBe(true);
    expect(isReservedSlug("produk")).toBe(true);
    expect(isReservedSlug("tentang-kami")).toBe(false);
  });

  it("tidak kosong & tak mengandung duplikat implisit penting", () => {
    expect(RESERVED_SLUGS.size).toBeGreaterThan(15);
    expect(RESERVED_SLUGS.has("home")).toBe(true);
    expect(RESERVED_SLUGS.has("page-builder")).toBe(true);
  });
});

describe("isReservedSlugPath", () => {
  it("root & reserved pertamasegmen dianggap dilindungi", () => {
    expect(isReservedSlugPath("")).toBe(true);
    expect(isReservedSlugPath("dashboard")).toBe(true);
    expect(isReservedSlugPath("p")).toBe(true);
  });

  it("path multi-segmen dinilai dari segmen pertama", () => {
    // 'p/tentang-kami' → segmen pertama 'p' = reserved
    expect(isReservedSlugPath("p/tentang-kami")).toBe(true);
    expect(isReservedSlugPath("tentang-kami")).toBe(false);
    expect(isReservedSlugPath("tentang-kami/sejarah")).toBe(false);
  });
});
