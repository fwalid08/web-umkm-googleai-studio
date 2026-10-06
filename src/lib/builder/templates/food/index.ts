/**
 * Template kuliner: warung makan, cafe, catering, bakery.
 *
 * Fresh-authored di kode (bukan konversi baris DB lama). Katalog section
 * dibagikan dari registry; karakter niche ada di theme, seed, dan copy.
 */

import type { CatalogTemplate } from "../catalog";
import { registrySections } from "../compose";
import { HEADERS, FOOTERS } from "./chrome";
import { COLOR_SCHEMES } from "./schemes";
import { DATA } from "./data";

export const FOOD_TEMPLATE: CatalogTemplate = {
  id: "food",
  name: "Warung Makan",
  description:
    "Template kuliner untuk warung makan, cafe, catering, dan bakery — hero menggugah selera, papan menu, pemesanan meja, dan jam operasional.",
  category: "food",
  theme: {
    palette: {
      primary: "#c2410c",
      secondary: "#9a3412",
      accent: "#f59e0b",
      background: "#fffbeb",
      surface: "#fef3c7",
      text: "#1c1917",
      textMuted: "#57534e",
      border: "#fde68a",
    },
    typography: {
      headingFont: "Poppins",
      bodyFont: "Inter",
      baseSize: 16,
      scaleRatio: 1.25,
      headingWeight: 700,
      bodyWeight: 400,
    },
    components: {
      borderRadius: 16,
      buttonStyle: "solid",
      shadowStyle: "md",
      navStyle: "solid",
      footerStyle: "centered",
    },
    effects: {},
  },
  headers: HEADERS,
  footers: FOOTERS,
  sections: registrySections(),
  colorSchemes: COLOR_SCHEMES,
  data: DATA,
};

export default FOOD_TEMPLATE;
