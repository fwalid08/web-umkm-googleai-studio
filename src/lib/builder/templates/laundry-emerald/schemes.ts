import type { ColorScheme } from "../../color-schemes";

export const COLOR_SCHEMES: ColorScheme[] = [
    // Light schemes (10) — BRAND GOLD accent preserved (#C6A15B)
    // Varian hue: hijau (emerald/teal/mint/forest/olive/pine) + biru (sapphire)
    // + ungu (violet) + pink (rose) + coral (sunset). Teks di atas primary
    // memakai token turunan (--color-accent-on-primary) agar terbaca.
    // Accent used as BACKGROUND (buttons, badges, bands); text on it uses --color-on-accent
    {
      id: 'emerald-luxury',
      name: 'Emerald Luxury',
      category: 'light',
      palette: { background: '#f0fdf4', surface: '#ffffff', primary: '#064e3b', accent: '#c6a15b', text: '#064e3b', textMuted: '#4b5563', border: '#a7f3d0' },
      headingFont: 'Playfair Display',
      bodyFont: 'Inter',
    },
    {
      id: 'teal-fresh',
      name: 'Teal Fresh',
      category: 'light',
      palette: { background: '#f0fdfa', surface: '#ffffff', primary: '#0f766e', accent: '#c6a15b', text: '#134e4a', textMuted: '#4b5563', border: '#99f6e4' },
      headingFont: 'Syne',
      bodyFont: 'Inter',
    },
    {
      id: 'sapphire-royal',
      name: 'Sapphire Royal',
      category: 'light',
      palette: { background: '#eff6ff', surface: '#ffffff', primary: '#1e3a8a', accent: '#c6a15b', text: '#172554', textMuted: '#475569', border: '#bfdbfe' },
      headingFont: 'Cormorant Garamond',
      bodyFont: 'Inter',
    },
    {
      id: 'mint-sterile',
      name: 'Mint Sterile',
      category: 'light',
      palette: { background: '#ecfdf5', surface: '#ffffff', primary: '#059669', accent: '#c6a15b', text: '#064e3b', textMuted: '#4b5563', border: '#a7f3d0' },
      headingFont: 'Montserrat',
      bodyFont: 'Lato',
    },
    {
      id: 'forest-premium',
      name: 'Forest Premium',
      category: 'light',
      palette: { background: '#f0fdf4', surface: '#ecfdf5', primary: '#064e3b', accent: '#c6a15b', text: '#064e3b', textMuted: '#4b5563', border: '#a7f3d0' },
      headingFont: 'DM Serif Display',
      bodyFont: 'Inter',
    },
    {
      id: 'violet-luxe',
      name: 'Violet Luxe',
      category: 'light',
      palette: { background: '#faf5ff', surface: '#ffffff', primary: '#581c87', accent: '#c6a15b', text: '#3b0764', textMuted: '#52525b', border: '#ddd6fe' },
      headingFont: 'Raleway',
      bodyFont: 'Inter',
    },
    {
      id: 'rose-bloom',
      name: 'Rose Bloom',
      category: 'light',
      palette: { background: '#fdf2f8', surface: '#ffffff', primary: '#831843', accent: '#c6a15b', text: '#500f28', textMuted: '#57534e', border: '#fbcfe8' },
      headingFont: 'Outfit',
      bodyFont: 'Inter',
    },
    {
      id: 'olive-organic',
      name: 'Olive Organic',
      category: 'light',
      palette: { background: '#f7fee7', surface: '#ffffff', primary: '#65a30d', accent: '#c6a15b', text: '#1a2e05', textMuted: '#4b5563', border: '#d9f99d' },
      headingFont: 'Plus Jakarta Sans',
      bodyFont: 'Inter',
    },
    {
      id: 'pine-fresh',
      name: 'Pine Fresh',
      category: 'light',
      palette: { background: '#f1f5f2', surface: '#ffffff', primary: '#166534', accent: '#c6a15b', text: '#172a1f', textMuted: '#4b5563', border: '#bbf7d0' },
      headingFont: 'Space Grotesk',
      bodyFont: 'Inter',
    },
    {
      id: 'sunset-coral',
      name: 'Sunset Coral',
      category: 'light',
      palette: { background: '#fff7ed', surface: '#ffffff', primary: '#9a3412', accent: '#c6a15b', text: '#431407', textMuted: '#57534e', border: '#fed7aa' },
      headingFont: 'Figtree',
      bodyFont: 'Inter',
    },
    // Dark schemes (10) — BRIGHT GOLD accent for dark backgrounds
    // Varian hue: hijau (midnight/noir/obsidian/graphite/raven/abyss)
    // + biru (sapphire) + ungu (violet) + pink (rose) + sky (ocean).
    // Brand gold #c6a15b works on very dark; #fde047 (bright gold) for less dark
    // Text on accent uses --color-on-accent (auto dark text)
    {
      id: 'midnight-emerald',
      name: 'Midnight Emerald',
      category: 'dark',
      palette: { background: '#020617', surface: '#0f172a', primary: '#34d399', accent: '#fde047', text: '#ecfdf5', textMuted: '#6ee7b7', border: '#064e3b' },
      headingFont: 'Playfair Display',
      bodyFont: 'Inter',
    },
    {
      id: 'midnight-sapphire',
      name: 'Midnight Sapphire',
      category: 'dark',
      palette: { background: '#020617', surface: '#0f172a', primary: '#60a5fa', accent: '#fde047', text: '#eff6ff', textMuted: '#93c5fd', border: '#1e3a8a' },
      headingFont: 'Syne',
      bodyFont: 'Inter',
    },
    {
      id: 'ocean-glow',
      name: 'Ocean Glow',
      category: 'dark',
      palette: { background: '#020d14', surface: '#0a1620', primary: '#38bdf8', accent: '#fde047', text: '#f0f9ff', textMuted: '#7dd3fc', border: '#0c4a6e' },
      headingFont: 'Cormorant Garamond',
      bodyFont: 'Inter',
    },
    {
      id: 'noir-mint',
      name: 'Noir Mint',
      category: 'dark',
      palette: { background: '#0a0f0a', surface: '#141210', primary: '#10b981', accent: '#fde047', text: '#ecfdf5', textMuted: '#6ee7b7', border: '#064e3b' },
      headingFont: 'Montserrat',
      bodyFont: 'Lato',
    },
    {
      id: 'obsidian-forest',
      name: 'Obsidian Forest',
      category: 'dark',
      palette: { background: '#040806', surface: '#0c0a09', primary: '#059669', accent: '#c6a15b', text: '#ecfdf5', textMuted: '#6ee7b7', border: '#064e3b' },
      headingFont: 'DM Serif Display',
      bodyFont: 'Inter',
    },
    {
      id: 'neon-violet',
      name: 'Neon Violet',
      category: 'dark',
      palette: { background: '#0f0a1f', surface: '#1e1b2e', primary: '#a78bfa', accent: '#fde047', text: '#f5f3ff', textMuted: '#c4b5fd', border: '#4c1d95' },
      headingFont: 'Raleway',
      bodyFont: 'Inter',
    },
    {
      id: 'rose-neon',
      name: 'Rose Neon',
      category: 'dark',
      palette: { background: '#14060f', surface: '#1f1018', primary: '#f472b6', accent: '#fde047', text: '#fdf2f8', textMuted: '#f9a8d4', border: '#831843' },
      headingFont: 'Outfit',
      bodyFont: 'Inter',
    },
    {
      id: 'graphite-olive',
      name: 'Graphite Olive',
      category: 'dark',
      palette: { background: '#0c0a09', surface: '#1c1917', primary: '#65a30d', accent: '#fde047', text: '#f4f4f5', textMuted: '#a1a1aa', border: '#27272a' },
      headingFont: 'Plus Jakarta Sans',
      bodyFont: 'Inter',
    },
    {
      id: 'raven-pine',
      name: 'Raven Pine',
      category: 'dark',
      palette: { background: '#0a0f0a', surface: '#141210', primary: '#166534', accent: '#c6a15b', text: '#ecfdf5', textMuted: '#6ee7b7', border: '#166534' },
      headingFont: 'Space Grotesk',
      bodyFont: 'Inter',
    },
    {
      id: 'abyss-green',
      name: 'Abyss Green',
      category: 'dark',
      palette: { background: '#030805', surface: '#0c0a09', primary: '#047857', accent: '#fde047', text: '#ecfdf5', textMuted: '#6ee7b7', border: '#064e3b' },
      headingFont: 'Figtree',
      bodyFont: 'Inter',
    },
];
