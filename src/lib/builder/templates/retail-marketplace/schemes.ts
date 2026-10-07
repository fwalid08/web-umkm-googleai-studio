import type { ColorScheme } from "../../color-schemes";

/** Palet warna "Pasar Modern" — emulasi marketplace modern. 5 skema:
 *  1. Pasar Pagi      — warm terracotta (oranye)
 *  2. Pasar Malam     — gelap monokrom + aksen amber
 *  3. Pasar Senja     — emerald teal (premium)
 *  4. Pasar Hati      — terracotta hangat (natural)
 *  5. Pasar Nikel     — slate indigo (corporate/minimal)
 */
export const COLOR_SCHEMES: ColorScheme[] = [{
  id: "pasar-pagi",
  name: "Pasar Pagi",
  category: "light",
  palette: {
    primary: "#C2410C", // terracotta / orange-700
    secondary: "#DB2777", // pink-600
    accent: "#F97316", // orange-500
    background: "#FFFFFF",
    surface: "#FFF7ED", // orange-50
    text: "#1F2937", // gray-800
    textMuted: "#6B7280", // gray-500
    border: "#FED7AA", // orange-200
    onPrimary: "#FFFFFF",
    onAccent: "#FFFFFF",
  },
  headingFont: "Manrope",
  bodyFont: "DM Sans",
  accentFont: "Playfair Display",
}, {
  id: "pasar-malam",
  name: "Pasar Malam",
  category: "dark",
  palette: {
    primary: "#FF6B35", // amber-500
    secondary: "#FF8C4A", // orange-300
    accent: "#FFB347", // orange-300
    background: "#141414", // neutral-black
    surface: "#1E1E1E", // neutral-900
    text: "#F5F5F5", // neutral-white
    textMuted: "#A0A0A0", // neutral-400
    border: "#2E2E2E", // neutral-800
    onPrimary: "#FFFFFF",
    onAccent: "#141414",
  },
  headingFont: "Manrope",
  bodyFont: "DM Sans",
  accentFont: "Playfair Display",
}, {
  id: "pasar-senja",
  name: "Pasar Senja",
  category: "dark",
  palette: {
    primary: "#0D9488", // emerald-600
    secondary: "#0F766E", // emerald-700
    accent: "#14B8A6", // emerald-400
    background: "#0F172A", // slate-900
    surface: "#1E293B", // slate-800
    text: "#F1F5F9", // slate-100
    textMuted: "#94A3B8", // slate-500
    border: "#334155", // slate-700
    onPrimary: "#FFFFFF",
    onAccent: "#0F172A",
  },
  headingFont: "Manrope",
  bodyFont: "DM Sans",
  accentFont: "Playfair Display",
}, {
  id: "pasar-hati",
  name: "Pasar Hati",
  category: "light",
  palette: {
    primary: "#B91C1C", // red-700
    secondary: "#E11D48", // pink-600
    accent: "#FB923C", // amber-500
    background: "#FFFFFF",
    surface: "#FFF1F2", // pink-50
    text: "#374151", // gray-700
    textMuted: "#6B7280", // gray-500
    border: "#FECDD3", // pink-200
    onPrimary: "#FFFFFF",
    onAccent: "#FFFFFF",
  },
  headingFont: "Manrope",
  bodyFont: "DM Sans",
  accentFont: "Playfair Display",
}, {
  id: "pasar-nikel",
  name: "Pasar Nikel",
  category: "light",
  palette: {
    primary: "#4F46E5", // indigo-600
    secondary: "#4338CA", // indigo-700
    accent: "#818CF8", // indigo-400
    background: "#FFFFFF",
    surface: "#F5F3FF", // indigo-50
    text: "#111827", // gray-900
    textMuted: "#6B7280", // gray-500
    border: "#E9D5FF", // indigo-100
    onPrimary: "#FFFFFF",
    onAccent: "#111827",
  },
  headingFont: "Manrope",
  bodyFont: "DM Sans",
  accentFont: "Playfair Display",
}, {
  id: "pasar-murni",
  name: "Pasar Murni",
  category: "neutral",
  palette: {
    primary: "#1F2937", // gray-800
    secondary: "#374151", // gray-700
    accent: "#6B7280", // gray-500
    background: "#FFFFFF",
    surface: "#F9FAFB", // gray-50
    text: "#111827", // gray-900
    textMuted: "#6B7280", // gray-500
    border: "#E5E7EB", // gray-200
    onPrimary: "#FFFFFF",
    onAccent: "#111827",
  },
  headingFont: "Inter",
  bodyFont: "Inter",
  accentFont: "Playfair Display",
}];