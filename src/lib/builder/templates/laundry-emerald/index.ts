/**
 * Emerald Laundry — template laundry unik bergaya luxury emerald.
 *
 * Kontrak §18 (UNIQUE_TEMPLATE_SPEC.md):
 * - TIDAK mewarisi `registrySections()` / `compose.ts` — semua varian
 * * dideklarasikan di folder ini (chrome/sections/data) dengan `html` kustom + ID namespaced.
 * - Nol warna hardcoded (hanya `var(--color-*)`), nol font hardcoded
 *   (hanya `var(--font-heading/body/accent)`).
 * - List dinamis memakai blok loop `{{#items}}…{{/items}}` yang diekspan
 *   `renderVariantHtml` (lihat `behaviour-script.ts`) — bukan `{{items}}`
 *   mentah yang dulu jadi "[object Object]".
 */


import type { CatalogTemplate } from "../catalog";
import { HEADERS, FOOTERS } from "./chrome";
import { SECTIONS } from "./sections";
import { COLOR_SCHEMES } from "./schemes";
import { DATA } from "./data";

export const LAUNDRY_EMERALD_TEMPLATE: CatalogTemplate = {
  id: "laundry-emerald",
  name: "Emerald Laundry",
  description:
    "Template laundry premium bergaya luxury emerald: hero arch emas, kartu layanan, band statistik, FAQ accordion, testimoni foto, dan panduan booking. Isi tetap jasa laundry (kiloan, express, antar-jemput).",
  category: "services",
  tiers: ["free", "starter", "growth", "enterprise"],
  theme: {
    palette: {
      primary: "#0C3B2E",
      secondary: "#1E4D3B",
      accent: "#C6A15B",
      background: "#F5F1E8",
      surface: "#FDFBF6",
      text: "#1E2A26",
      textMuted: "#4E5E57",
      border: "#E5DCC8",
    },
    typography: {
      headingFont: "Playfair Display",
      bodyFont: "Manrope",
      accentFont: "Great Vibes",
      baseSize: 16,
      scaleRatio: 1.25,
      headingWeight: 700,
      bodyWeight: 400,
    },
    components: {
      borderRadius: 20,
      buttonStyle: "solid",
      shadowStyle: "md",
      navStyle: "solid",
      footerStyle: "columns",
    },
    effects: {},
  },
  headers: HEADERS,
  footers: FOOTERS,
  sections: SECTIONS,
  colorSchemes: COLOR_SCHEMES,
  /**
   * Kontrak kontras template (§19).
   *
   * Setiap pasangan = "warna teks X aman di atas latar Y dengan rasio
   * minimal Z". Pasangan yang paling rawan justru yang DUA ARAH:
   * `accent` di atas `primary` (eyebrow emas di band hijau tua) dan
   * `primary` di atas `accent` (tombol WhatsApp emas) — satu nilai palet
   * dipakai sebagai teks DAN sebagai latar, jadi tidak boleh "diperbaiki"
   * di satu tempat dan merusak yang lain.
   *
   * `on-primary` sengaja ikut meski bukan kunci palet: `brandMark()` memakai
   * `--color-on-<bg>` supaya teks lencana mengikuti latar lencana itu
   * sendiri (lihat `buildOnColorTokens`).
   */
  contrast: {
    pairs: [
      // Permukaan terang — teks utama & redup.
      { fg: "text", bg: "background", role: "body" },
      { fg: "text", bg: "surface", role: "body" },
      { fg: "textMuted", bg: "background", role: "muted" },
      { fg: "textMuted", bg: "surface", role: "muted" },
      { fg: "secondary", bg: "background", role: "body", note: "strapline footer" },
      { fg: "secondary", bg: "surface", role: "body" },
      { fg: "primary", bg: "surface", role: "body" },
      // Emas `#C6A15B` di atas krem hanya ~2.3:1, jadi yang dipakai di latar
      // terang adalah token TURUNAN, bukan `accent` langsung. Kontrak ini
      // yang menghitungkannya (`buildThemeTokens` menerapkannya).
      { fg: "accent", bg: "surface", role: "body", note: "tagline header (regresi emas di krem)" },
      { fg: "accent", bg: "background", role: "body" },
      // Band hijau tua — emas di sini justru aman, teks lewat on-primary.
      { fg: "text", bg: "primary", role: "body", note: "footer band + panel lokasi" },
      { fg: "accent", bg: "primary", role: "body", note: "eyebrow emas di band hijau" },
      // Emas jadi LAYAR (tombol/lencana) → teks gelap di atasnya.
      { fg: "primary", bg: "accent", role: "body", note: "tombol WhatsApp emas" },
    ],
  },
  data: DATA,
};

export default LAUNDRY_EMERALD_TEMPLATE;
