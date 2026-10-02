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
  {
    id: "newsletter",
    name: "Pita Newsletter",
    description: "Pita signup email lebar di atas baris info",
  },
  {
    id: "social",
    name: "Fokus Sosial",
    description: "Blok sosial besar di tengah, navigasi rapat di bawah",
  },
  {
    id: "cta-overlap",
    name: "CTA Besar",
    description: "Blok panggilan bertindak dengan tombol besar, penuh lebar",
  },
];

export const DEFAULT_HEADER_VARIANT = "standard";
export const DEFAULT_FOOTER_VARIANT = "simple";

/**
 * Opsi "Lebar Konten" untuk header — memetakan nilai config `contentWidth`
 * ke kelas Tailwind.
 *
 * Isi header (nama web, menu, CTA) dibox supaya tidak terdistribusi ke tepi
 * layar pada monitor lebar, dan tetap sebaris dengan isi section + footer.
 * `full` mengembalikan perilaku lama (mengikuti lebar layar).
 *
 * Default `6xl` (1152px) sengaja — sama dengan lebar footer (`site-footer-shared.tsx`)
 * dan section hero/produk.
 *
 * Kelas WAJIB ditulis literal: Tailwind memindai string sumber, jadi
 * `max-w-${n}` tidak akan pernah ter-generate.
 */
export const DEFAULT_CONTENT_WIDTH = "6xl";

export const CONTENT_WIDTH_CLASSES: Record<string, string> = {
  full: "w-full",
  "6xl": "max-w-6xl",
  "5xl": "max-w-5xl",
  "4xl": "max-w-4xl",
};

/**
 * Resolve config user → kelas wrapper. Nilai tak dikenal / belum tersimpan
 * (mis. situs lama yang menyimpan config sebelum field ini ada) jatuh ke
 * lebar default, bukan ikut melebar layar.
 */
export function resolveContentWidthClass(value: unknown): string {
  const key = typeof value === "string" ? value : DEFAULT_CONTENT_WIDTH;
  return CONTENT_WIDTH_CLASSES[key] ?? CONTENT_WIDTH_CLASSES[DEFAULT_CONTENT_WIDTH];
}

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
