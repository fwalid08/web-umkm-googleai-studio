/**
 * Varian header & footer — diperlakukan sama seperti varian section:
 * template mendeklarasikan varian, style visual diwarisi template,
 * yang beda antar varian adalah DESAIN KREATIF-nya (komposisi, bentuk,
 * dekorasi) — bukan sekadar rata kiri/tengah/kanan.
 *
 * Varian chrome bersifat global seperti tipe section: setiap template
 * memilih varian yang cocok, tampilannya mengikuti palet template.
 *
 * - Header: `HeaderConfig.variant` berisi ID LAYOUT yang diimplementasikan
 *   renderer (lihat `site-header-shared.tsx`):
 *   'standard' | 'floating' | 'hero-overlay' |
 *   'split-nav' | 'with-topbar' | 'glass' | 'minimal'.
 * - Footer: `FooterConfig.style` adalah ID varian
 *   ('simple' | 'columns' | 'centered' | 'minimal').
 */

export interface ChromeVariant {
  id: string;
  name: string;
  description: string;
}

/**
 * ID di sini WAJIB sama dengan nilai `layout` di `HeaderVariant`
 * (src/lib/builder/template-types.ts) karena keduanya dibandingkan langsung
 * oleh `catalog.test.ts` terhadap `data.header.variant` tiap template.
 */
export const HEADER_VARIANTS: ChromeVariant[] = [
  {
    id: "standard",
    name: "Klasik",
    description: "Bar penuh: logo kiri, menu tengah, tombol CTA kanan",
  },
  {
    id: "floating",
    name: "Melayang",
    description: "Bar mengambang rounded dengan menu navigasi & CTA",
  },
  {
    id: "hero-overlay",
    name: "Hero",
    description: "Transparan di atas hero, solid saat scroll",
  },
  {
    id: "split-nav",
    name: "Nav Kiri",
    description: "Blok brand besar di kiri, daftar menu & CTA di kanan",
  },
  {
    id: "with-topbar",
    name: "Promo Topbar",
    description: "Baris kontak/promo di atas header utama",
  },
  {
    id: "glass",
    name: "Kaca",
    description: "Header semi transparan dengan efek blur",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Logo + hamburger menu saja, bersih dan simpel",
  },
];

export const FOOTER_VARIANTS: ChromeVariant[] = [
  {
    id: "simple",
    name: "Satu Baris",
    description: "Baris tunggal bersih: teks, menu, ikon sosial",
  },
  {
    id: "columns",
    name: "Kolom Aksen",
    description: "Tiga kolom dengan aksen gradasi di atas",
  },
  {
    id: "centered",
    name: "Brand Tengah",
    description: "Inisial brand besar + ornamen, bertumpuk tengah",
  },
  {
    id: "minimal",
    name: "Mini",
    description: "Super ringkas: hanya teks hak cipta",
  },
];

export const DEFAULT_HEADER_VARIANT = "standard";
export const DEFAULT_FOOTER_VARIANT = "simple";

export function getHeaderVariant(id: string | undefined): ChromeVariant {
  return HEADER_VARIANTS.find((v) => v.id === id) ?? HEADER_VARIANTS[0];
}

export function getFooterVariant(id: string | undefined): ChromeVariant {
  return FOOTER_VARIANTS.find((v) => v.id === id) ?? FOOTER_VARIANTS[0];
}

export function isKnownHeaderVariant(id: string | undefined): boolean {
  return HEADER_VARIANTS.some((v) => v.id === id);
}

export function isKnownFooterVariant(id: string | undefined): boolean {
  return FOOTER_VARIANTS.some((v) => v.id === id);
}
