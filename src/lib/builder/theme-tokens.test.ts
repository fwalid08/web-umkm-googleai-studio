import { describe, expect, it } from "vitest";
import { buildThemeTokens, extractUsedCssVars } from "./theme-tokens";

const PALETTE = {
  primary: "#0C3B2E",
  secondary: "#1E4D3B",
  accent: "#C6A15B",
  background: "#F5F1E8",
  surface: "#FDFBF6",
  text: "#1E2A26",
  textMuted: "#4E5E57",
  border: "#E5DCC8",
};

const TYPO = {
  headingFont: "Playfair Display",
  bodyFont: "Manrope",
  accentFont: "Great Vibes",
  baseSize: 16,
  scaleRatio: 1.25,
  headingWeight: 700,
  bodyWeight: 400,
};

describe("buildThemeTokens", () => {
  it("mengeluarkan semua token yang dipakai variant.html", () => {
    const tokens = buildThemeTokens(PALETTE, TYPO, 20);
    for (const key of [
      "--color-primary", "--color-secondary", "--color-accent",
      "--color-background", "--color-surface", "--color-text",
      "--color-text-muted", "--color-border", "--color-on-primary",
      "--font-heading", "--font-body", "--font-accent", "--radius",
    ]) {
      expect(tokens[key], `token ${key} hilang`).toBeTruthy();
    }
    expect(tokens["--font-heading"]).toBe("Playfair Display");
    expect(tokens["--radius"]).toBe("20px");
  });

  it("accent fallback ke heading bila kosong + on-primary dihitung", () => {
    const tokens = buildThemeTokens(PALETTE, { ...TYPO, accentFont: "" }, 8);
    expect(tokens["--font-accent"]).toBe("Playfair Display");
    expect(tokens["--color-on-primary"]).toBeTruthy();
  });

  it("extractUsedCssVars menemukan semua var(--x)", () => {
    expect(
      extractUsedCssVars("color:var(--color-text);background:var(--color-primary);color:var(--color-text);"),
    ).toEqual(["--color-text", "--color-primary"]);
    expect(extractUsedCssVars("tanpa token")).toEqual([]);
  });
});
