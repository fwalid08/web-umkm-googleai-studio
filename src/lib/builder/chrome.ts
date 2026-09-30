/**
 * Varian header & footer — diperlakukan sama seperti varian section:
 * template mendeklarasikan varian, style visual diwarisi template,
 * yang beda antar varian adalah DESAIN KREATIF-nya (komposisi, bentuk,
 * dekorasi) — bukan sekadar rata kiri/tengah/kanan.
 *
 * Varian chrome bersifat global seperti tipe section: setiap template
 * memilih varian yang cocok, tampilannya mengikuti palet template.
 *
 * - Header: `HeaderConfig.variant` ('standard' | 'centered' | 'minimal').
 * - Footer: `FooterConfig.style` adalah ID varian
 *   ('simple' | 'columns' | 'centered' | 'minimal').
 */

export interface ChromeVariant {
  id: string;
  name: string;
  description: string;
}

export const HEADER_VARIANTS: ChromeVariant[] = [
  {
    id: "standard",
    name: "Klasik",
    description: "Bar penuh: logo kiri, menu tengah, tombol CTA kanan",
  },
  {
    id: "centered",
    name: "Pill Tengah",
    description: "Brand besar di tengah, menu berbentuk pil, CTA menonjol",
  },
  {
    id: "minimal",
    name: "Melayang",
    description: "Bar mengambang rounded dengan blur & bayangan",
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
