import type { CatalogTemplate } from "../catalog";
import { NS } from "./shared";
import { HEADERS, FOOTERS } from "./chrome";
import { ALL_SECTIONS } from "./sections";
import { COLOR_SCHEMES } from "./schemes";
import { DATA } from "./data";

export const MARKETPLACE_HYBRID_TEMPLATE: CatalogTemplate = {
  id: NS,
  name: "Hybrid Shop",
  description: "Template toko online hybrid: bersih seperti katalog premium, tapi tetap punya search bar, category chips, bottom nav, dan mobile native-app feel.",
  category: "retail",
  tiers: ["free", "starter", "growth", "enterprise"],
  theme: {
    palette: {
      primary: "#2563eb",
      secondary: "#1d4ed8",
      accent: "#f97316",
      background: "#ffffff",
      surface: "#f8fafc",
      text: "#0f172a",
      textMuted: "#64748b",
      border: "#e2e8f0",
    },
    typography: {
      headingFont: "Plus Jakarta Sans",
      bodyFont: "Inter",
      accentFont: "Inter",
      baseSize: 16,
      scaleRatio: 1.25,
      headingWeight: 700,
      bodyWeight: 400,
    },
    components: {
      borderRadius: 8,
      buttonStyle: "solid",
      shadowStyle: "md",
      navStyle: "solid",
      footerStyle: "columns",
    },
    effects: {},
  },
  headers: HEADERS,
  footers: FOOTERS,
  sections: ALL_SECTIONS,
  colorSchemes: COLOR_SCHEMES,
  contrast: {
    pairs: [
      { fg: "text", bg: "background", role: "body" },
      { fg: "text", bg: "surface", role: "body" },
      { fg: "textMuted", bg: "background", role: "muted" },
      { fg: "textMuted", bg: "surface", role: "muted" },
      { fg: "primary", bg: "background", role: "body" },
      { fg: "primary", bg: "surface", role: "body" },
      { fg: "accent", bg: "background", role: "body" },
      { fg: "accent", bg: "surface", role: "body" },
      { fg: "text", bg: "primary", role: "body" },
      { fg: "text", bg: "accent", role: "body" },
    ],
  },
  data: DATA,
};

export default MARKETPLACE_HYBRID_TEMPLATE;
