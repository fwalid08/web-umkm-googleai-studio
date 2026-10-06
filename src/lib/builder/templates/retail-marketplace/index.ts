import type { CatalogTemplate } from "../catalog";
import { HEADERS, FOOTERS } from "./chrome";
import { DATA } from "./data";
import { COLOR_SCHEMES } from "./schemes";
import { SECTIONS } from "./sections";

const PALETTE = COLOR_SCHEMES[0].palette;

export const RETAIL_MARKETPLACE_TEMPLATE: CatalogTemplate = {
  id: "retail-marketplace",
  name: "Pasar Modern",
  description: "Etalase retail multi-kategori dengan pengalaman marketplace yang praktis di desktop dan mobile.",
  category: "retail",
  tiers: ["free", "starter", "growth", "enterprise"],
  theme: {
    palette: {
      primary: PALETTE.primary,
      secondary: PALETTE.secondary ?? PALETTE.primary,
      accent: PALETTE.accent,
      background: PALETTE.background,
      surface: PALETTE.surface,
      text: PALETTE.text,
      textMuted: PALETTE.textMuted,
      border: PALETTE.border,
    },
    typography: {
      headingFont: "Manrope",
      bodyFont: "DM Sans",
      accentFont: "Playfair Display",
      baseSize: 16,
      scaleRatio: 1.22,
      headingWeight: 800,
      bodyWeight: 400,
    },
    components: {
      borderRadius: 12,
      buttonStyle: "solid",
      shadowStyle: "sm",
      navStyle: "solid",
      footerStyle: "columns",
    },
    effects: {},
  },
  headers: HEADERS,
  footers: FOOTERS,
  sections: SECTIONS,
  activeSections: DATA.activeSections,
  colorSchemes: COLOR_SCHEMES,
  contrast: {
    pairs: [
      { fg: "text", bg: "background", role: "body" },
      { fg: "text", bg: "surface", role: "body" },
      { fg: "textMuted", bg: "background", role: "muted" },
      { fg: "textMuted", bg: "surface", role: "muted" },
      { fg: "primary", bg: "background", role: "body" },
      { fg: "primary", bg: "surface", role: "body" },
      { fg: "text", bg: "accent", role: "body" },
      { fg: "accent", bg: "primary", role: "body" },
    ],
  },
  data: DATA,
};

export default RETAIL_MARKETPLACE_TEMPLATE;