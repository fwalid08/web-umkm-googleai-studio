import { describe, expect, it } from "vitest";
import {
  DESIGN_STYLES,
  MIN_CONTRAST_NORMAL_TEXT,
  COLOR_SCHEMES,
  blendOnTop,
  getContrastRatio,
  getOnColor,
  resolvePalette,
  validateStyleContrast,
} from "./design-styles";

/**
 * Guard keterbacaan font: setiap design style bawaan WAJIB punya
 * kontras teks vs latar yang memenuhi WCAG AA (≥ 4.5:1) agar font
 * tidak "tenggelam" (kasus: retro muted 1.57:1, organic muted 2.35:1).
 */
describe("kontras design styles (WCAG AA)", () => {
  it("semua style lolos validateStyleContrast", () => {
    for (const style of DESIGN_STYLES) {
      const v = validateStyleContrast(style);
      expect(
        v.issues,
        `${style.id} bermasalah: ${v.issues.join("; ")}`,
      ).toEqual([]);
      expect(v.valid).toBe(true);
    }
  });

  it("warna tombol otomatis (getOnColor) selalu ≥ 4.5 di atas primary", () => {
    for (const s of DESIGN_STYLES) {
      const on = getOnColor(s.palette.primary);
      const ratio = getContrastRatio(on, s.palette.primary);
      expect(
        ratio,
        `${s.id}: onPrimary ${on} vs ${s.palette.primary} = ${ratio.toFixed(2)}:1`,
      ).toBeGreaterThanOrEqual(MIN_CONTRAST_NORMAL_TEXT);
    }
  });

  it("subtitle CTA (onPrimary 85%) tetap terbaca di atas primary", () => {
    for (const s of DESIGN_STYLES) {
      const on = getOnColor(s.palette.primary);
      const eff = blendOnTop(
        on === "#ffffff" ? "rgba(255,255,255,0.85)" : "rgba(17,17,17,0.85)",
        s.palette.primary,
      );
      expect(eff).not.toBeNull();
      const ratio = getContrastRatio(eff!, s.palette.primary);
      // Subtitle CTA berukuran besar (text-lg/2xl) → ambang teks besar 3.0
      expect(
        ratio,
        `${s.id}: subtitle vs primary = ${ratio.toFixed(2)}:1`,
      ).toBeGreaterThanOrEqual(3.0);
    }
  });
});

describe("resolvePalette (override warna tema)", () => {  const base = DESIGN_STYLES.find((s) => s.id === "minimalist")!;

  it("tanpa override mengembalikan palet bawaan", () => {
    expect(resolvePalette(base)).toEqual(base.palette);
    expect(resolvePalette(base, {})).toEqual(base.palette);
  });

  it("override menimpa kunci yang diubah saja", () => {
    const eff = resolvePalette(base, { primary: "#16a34a", background: "#f0fdf4" });
    expect(eff.primary).toBe("#16a34a");
    expect(eff.background).toBe("#f0fdf4");
    expect(eff.text).toBe(base.palette.text);
  });

  it("nilai kosong diabaikan (= kembali ke bawaan)", () => {
    const eff = resolvePalette(base, { primary: "  " });
    expect(eff.primary).toBe(base.palette.primary);
  });

  it("palet hasil override hijau tetap lolos kontras tombol", () => {
    const eff = resolvePalette(base, { primary: "#16a34a" });
    const ratio = getContrastRatio(getOnColor(eff.primary), eff.primary);
    expect(ratio).toBeGreaterThanOrEqual(MIN_CONTRAST_NORMAL_TEXT);
  });
});

describe("skema warna siap pakai (COLOR_SCHEMES)", () => {
  it("semua preset lolos kontras di atas shell netral", () => {
    const shell = DESIGN_STYLES.find((s) => s.id === "minimalist")!;
    expect(COLOR_SCHEMES.length).toBeGreaterThan(0);
    for (const scheme of COLOR_SCHEMES) {
      const v = validateStyleContrast({ ...shell, palette: scheme.palette });
      expect(v.valid, `skema ${scheme.id} bermasalah: ${v.issues.join("; ")}`).toBe(true);
    }
  });

  it("preset berisi 8 kunci palet valid", () => {
    const keys = ["primary", "secondary", "accent", "background", "surface", "text", "textMuted", "border"];
    for (const scheme of COLOR_SCHEMES) {
      for (const k of keys) {
        expect(typeof (scheme.palette as unknown as Record<string, unknown>)[k], `${scheme.id}.${k}`).toBe("string");
      }
    }
  });
});
