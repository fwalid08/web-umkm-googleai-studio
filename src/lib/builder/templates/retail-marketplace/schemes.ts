import type { ColorScheme } from "../../color-schemes";

export const COLOR_SCHEMES: ColorScheme[] = [
  {
    id: "pasar-pagi",
    name: "Pasar Pagi",
    category: "light",
    palette: {
      primary: "#145D55",
      secondary: "#234C44",
      accent: "#E6A92D",
      background: "#F6F8F4",
      surface: "#FFFFFF",
      text: "#18312D",
      textMuted: "#526963",
      border: "#D9E4DF",
    },
    headingFont: "Manrope",
    bodyFont: "DM Sans",
    accentFont: "Playfair Display",
  },
  {
    id: "pasar-malam",
    name: "Pasar Malam",
    category: "dark",
    palette: {
      primary: "#69C7A1",
      secondary: "#A5DCC2",
      accent: "#F2B84B",
      background: "#142923",
      surface: "#1D3830",
      text: "#F0F5F1",
      textMuted: "#B8C9C1",
      border: "#36564B",
    },
    headingFont: "Manrope",
    bodyFont: "DM Sans",
    accentFont: "Playfair Display",
  },
];