import { describe, expect, it } from "vitest";
import {
  DEFAULT_COMPONENTS,
  DEFAULT_TYPOGRAPHY,
  MIN_CONTRAST_NORMAL_TEXT,
  blendOnTop,
  getContrastRatio,
  getOnColor,
  resolvePalette,
} from "./design-styles";
import { validateColorScheme } from "./color-schemes";
import type { DesignStyle, DesignStylePalette } from "./types";
import { FOOD_TEMPLATE } from "./templates/food";
import { LAUNDRY_EMERALD_TEMPLATE } from "./templates/laundry-emerald";

const BASE_PALETTE: DesignStylePalette = {
  primary: "#333333",
  secondary: "#666666",
  accent: "#333333",
  background: "#ffffff",
  surface: "#f5f5f5",
  text: "#333333",
  textMuted: "#666666",
  border: "#e5e5e5",
};

/** Kerangka DesignStyle seadanya — utilitas warna hanya butuh paletnya. */
const BASE_STYLE = { id: "base", name: "Base", palette: BASE_PALETTE } as DesignStyle;

/** Skema warna tidak punya `secondary`; palet lengkap mewajibkannya. */
function withSecondary(p: Record<string, string>): DesignStylePalette {
  return { ...BASE_PALETTE, ...p, secondary: p.secondary ?? p.primary };
}

/**
 * Guard keterbacaan: setiap skema warna siap pakai WAJIB punya kontras teks
 * vs latar memenuhi WCAG AA (≥ 4.5:1) agar font tidak "tenggelam".
 *
 * Setiap template menyediakan colorSchemes sendiri (max 20).
 * Test ini memvalidasi skema dari food.ts dan laundry-emerald.ts.
 */
describe("kontras skema warna siap pakai (WCAG AA)", () => {
  const templates = [FOOD_TEMPLATE, LAUNDRY_EMERALD_TEMPLATE];

  it("semua template.colorSchemes lolos validateColorScheme (generic pairs)", () => {
    for (const template of templates) {
      expect(template.colorSchemes.length).toBeGreaterThan(0);
      for (const scheme of template.colorSchemes) {
        // Validasi hanya 4 pasangan generik (text/background, text/surface, textMuted/background, textMuted/surface)
        // Kontrak template (dual-role pairs) ditangani via derived tokens saat render, bukan validasi palet mentah
        const v = validateColorScheme(
          { ...scheme, palette: withSecondary(scheme.palette) },
          null, // tanpa kontrak template
          template.theme.palette,
        );
        expect(
          v.issues,
          `${template.id}:${scheme.id} bermasalah: ${v.issues.join("; ")}`,
        ).toEqual([]);
        expect(v.valid).toBe(true);
      }
    }
  });

  it("warna tombol otomatis (getOnColor) selalu ≥ 4.5 di atas primary", () => {
    for (const template of templates) {
      for (const scheme of template.colorSchemes) {
        const on = getOnColor(scheme.palette.primary);
        const ratio = getContrastRatio(on, scheme.palette.primary);
        expect(
          ratio,
          `${template.id}:${scheme.id}: onPrimary ${on} vs ${scheme.palette.primary} = ${ratio.toFixed(2)}:1`,
        ).toBeGreaterThanOrEqual(MIN_CONTRAST_NORMAL_TEXT);
      }
    }
  });

  it("subtitle CTA (onPrimary 85%) tetap terbaca di atas primary", () => {
    for (const template of templates) {
      for (const scheme of template.colorSchemes) {
        const on = getOnColor(scheme.palette.primary);
        const eff = blendOnTop(
          on === "#ffffff" ? "rgba(255,255,255,0.85)" : "rgba(17,17,17,0.85)",
          scheme.palette.primary,
        );
        expect(eff).not.toBeNull();
        const ratio = getContrastRatio(eff!, scheme.palette.primary);
        // Subtitle CTA berukuran besar (text-lg/2xl) → ambang teks besar 3.0
        expect(
          ratio,
          `${template.id}:${scheme.id}: subtitle vs primary = ${ratio.toFixed(2)}:1`,
        ).toBeGreaterThanOrEqual(3.0);
      }
    }
  });
});

describe("resolvePalette (override warna tema)", () => {
  const base = BASE_STYLE;

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

describe("default tipografi & komponen", () => {
  it("memakai Inter — satu-satunya font yang di-bundle via next/font", () => {
    expect(DEFAULT_TYPOGRAPHY.headingFont).toBe("Inter");
    expect(DEFAULT_TYPOGRAPHY.bodyFont).toBe("Inter");
  });

  it("bentuknya utuh supaya renderer tak pernah dapat undefined", () => {
    expect(DEFAULT_TYPOGRAPHY.baseSize).toBeGreaterThan(0);
    expect(DEFAULT_TYPOGRAPHY.scaleRatio).toBeGreaterThan(0);
    expect(DEFAULT_COMPONENTS.borderRadius).toBeGreaterThanOrEqual(0);
  });
});
