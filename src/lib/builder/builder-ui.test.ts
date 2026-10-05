import { describe, expect, it } from "vitest";
import {
  BUILDER_SHORTCUTS,
  MIN_SEO_TITLE,
  SIDEBAR_DEFAULT_WIDTH,
  SIDEBAR_MAX_WIDTH,
  SIDEBAR_MIN_WIDTH,
  SIDEBAR_TITLES,
  clampSidebarWidth,
  loadSidebarWidth,
  persistSidebarWidth,
  viewportModeOf,
  VIEWPORT_WIDTHS,
} from "./builder-ui";

/**
 * Helper UI builder murni (judul sidebar, lebar panel, checklist, mode viewport).
 * Semua diuji tanpa DOM karena `vitest.config.ts` memakai `environment: "node"`.
 */

describe("clampSidebarWidth", () => {
  it("menahan lebar di dalam rentang min/maks", () => {
    expect(clampSidebarWidth(100)).toBe(SIDEBAR_MIN_WIDTH);
    expect(clampSidebarWidth(9999)).toBe(SIDEBAR_MAX_WIDTH);
    expect(clampSidebarWidth(400)).toBe(400);
  });

  it("membulatkan lebar pecahan", () => {
    expect(clampSidebarWidth(400.4)).toBe(400);
    expect(clampSidebarWidth(400.6)).toBe(401);
  });

  it("fallback ke default untuk nilai rusak (NaN/Infinity)", () => {
    // Nilai rusak biasanya berasal dari localStorage yang diedit manual atau
    // dari drag yang menghasilkan lebar negatif.
    expect(clampSidebarWidth(Number.NaN)).toBe(SIDEBAR_DEFAULT_WIDTH);
    expect(clampSidebarWidth(Number.POSITIVE_INFINITY)).toBe(SIDEBAR_DEFAULT_WIDTH);
  });
});

describe("persistSidebarWidth / loadSidebarWidth", () => {
  // localStorage tidak ada di environment "node" — kedua fungsi harus tetap
  // aman dan mengembalikan nilai default, tidak melemparkan error.
  it("aman dipanggil tanpa window (SSR / storage diblokir)", () => {
    expect(() => persistSidebarWidth(400)).not.toThrow();
    expect(loadSidebarWidth()).toBe(SIDEBAR_DEFAULT_WIDTH);
  });
});

describe("viewportModeOf", () => {
  it("memetakan lebar preset ke mode yang sesuai", () => {
    expect(viewportModeOf(VIEWPORT_WIDTHS.mobile)).toBe("mobile");
    expect(viewportModeOf(VIEWPORT_WIDTHS.tablet)).toBe("tablet");
    expect(viewportModeOf(VIEWPORT_WIDTHS.desktop)).toBe("desktop");
  });

  it("memetakan lebar di antara preset ke mode terdekat", () => {
    // 900px bukan salah satu preset. Versi lama membandingkan kesamaan nilai,
    // sehingga tidak ada tombol pun yang aktif di bottom bar.
    expect(viewportModeOf(900)).toBe("tablet");
    expect(viewportModeOf(500)).toBe("tablet");
    expect(viewportModeOf(1440)).toBe("desktop");
  });
});

describe("SIDEBAR_TITLES", () => {
  it("tidak memuat teks Inggris (konsistensi bahasa builder)", () => {
    // Dulu: 'Builder', 'Sections', 'Section Config' — campur dengan teks
    // Indonesia di panel lain.
    expect(SIDEBAR_TITLES.main).toBe("Editor Website");
    expect(SIDEBAR_TITLES.sections).toBe("Daftar Blok");
    expect(SIDEBAR_TITLES["section-config"]).toBe("Edit Blok");
  });

  it("punya judul untuk setiap level sidebar", () => {
    for (const level of [
      "main",
      "sections",
      "section-config",
      "header",
      "footer",
      "style",
      "template-info",
    ] as const) {
      expect(SIDEBAR_TITLES[level]).toBeTruthy();
    }
  });
});

describe("MIN_SEO_TITLE", () => {
  it("diekspor supaya panel SEO memakai angka yang sama", () => {
    // Dulu angka 10 ditulis inline di beberapa tempat; sekarang satu sumber.
    expect(MIN_SEO_TITLE).toBe(10);
  });
});

describe("BUILDER_SHORTCUTS", () => {
  it("mencakup Ctrl+S yang promised di UI", () => {
    const keys = BUILDER_SHORTCUTS.map((s) => s.keys);
    expect(keys).toContain("Ctrl+S");
  });

  it("setiap pintasan punya label", () => {
    expect(BUILDER_SHORTCUTS.every((s) => s.label.trim().length > 0)).toBe(true);
  });
});