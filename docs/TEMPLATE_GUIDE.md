# Template Guide — Page Builder

> **Target Audience**: Developer, Designer
> **Version**: 1.5
> **Last Updated**: 2026-10-05
>
> v1.5: Kontrak **template unik saja** (spesifikasi penuh: `UNIQUE_TEMPLATE_SPEC.md`
> §18) — sistem UI/UX generik dihapus bertahap: tidak ada lagi warisan
> `SECTION_REGISTRY` / `registrySections()` / `compose.ts`, tidak ada lagi 7+7
> layout header/footer generik (`chrome.ts`), setiap varian **wajib `html`**
> dengan ID namespaced per template, nol warna/font hardcoded (token adaptif
> + `accentFont` ketiga). Bagian dokumen yang masih merujuk sistem generik
> ditandai `SUPERSEDED → §18`.
>
> v1.4: Sinkronisasi penuh ke kode saat ini — katalog tunggal (`food.ts` via
> `registrySections()` + `compose.ts`), penghapusan `DESIGN_STYLES`
> (migrasi 046: palet/tipografi hidup langsung di `theme` template),
> pengarsipan sistem ZIP import/export (migrasi 040), koreksi 8 section inti
> dan 7 layout footer bawaan, serta penghapusan seluruh referensi dokumen
> AI eksternal (tidak ada file `AI_TEMPLATE_PROMPT.md` — template hanya
> dibuat via kode statis di repository ini).
>
> v1.3: §15 menjadi spek mobile-first penuh — breakpoint, kontrak
> `responsive`, aturan `variant.html` responsif, dan prosedur uji tiga viewport.

---

## Table of Contents

1. [Gambaran Umum](#1-gambaran-umum)
2. [Template Schema](#2-template-schema)
3. [Header Schema](#3-header-schema)
4. [Footer Schema](#4-footer-schema)
5. [Section Schema](#5-section-schema)
6. [Config Fields System](#6-config-fields-system)
7. [Section Style System](#7-section-style-system)
8. [Best Practices](#8-best-practices)
9. [Template Upload System](#9-template-upload-system)
10. [Contoh Implementasi](#10-contoh-implementasi)
11. [Checklist Validasi](#11-checklist-validasi)
12. [Panduan Developer](#12-panduan-developer)
13. [Template Preview System](#13-template-preview-system)
14. [Single Page Navigation](#14-single-page-navigation)
15. [Mobile-First Requirements (Spek v3.1)](#15-mobile-first-requirements-spek-v31)
16. [Creative Layer](#16-creative-layer-customcss-hook-dan-themeeffects)
17. [Mobile App-like Requirements](#17-mobile-app-like-requirements)
18. [Template Unik Saja — Pengganti Sistem Generik](#18-template-unik-saja-pengganti-sistem-generik)

---

## 1. Gambaran Umum

Template adalah **self-contained package** yang berisi:
- **Theme** (palette warna, typography, components, effects)
- **Header Variants** (berbagai gaya header)
- **Footer Variants** (berbagai gaya footer)
- **Section Types** (berbagai jenis section dengan variants)

Template terintegrasi dengan page builder melalui:
- `template-store.ts` — state management
- `src/components/builder/section-renderer.tsx` — rendering sections
- `builder-canvas.tsx` — canvas preview
- `template-gallery.tsx` — template picker

### Page Builder (satu-satunya editor)

Builder Global (`/dashboard/builder`) **sudah dipensiunkan** (lihat `033_page_builder_only.sql`).
Semua editing layout kini lewat Page Builder:

| Aspek | Nilai |
|---|---|
| Route | `/dashboard/websites/page-builder/[pageId]` |
| Layout per-halaman | `store_pages.layout` |
| Chrome global | `user_templates.custom_config` (header, footer, style, SEO) |
| Penyimpanan | `PUT …/website` (chrome global) + `PATCH …/pages/{pageId}` (layout halaman) |
| Publish | `is_published` per halaman; homepage yang draft → 404 |

**Aturan kunci (jangan diubah tanpa test):**
1. **Homepage = baris `store_pages` dengan `is_homepage = true`.** Tidak ada lagi
   percabangan `homepage_type` (`builder` | `page`) di kode render — kolomnya masih
   ada di DB tapi tidak menentukan apa pun.
2. `custom_config.sections` **tidak lagi dipakai sebagai sumber render**. Homepage
   selalu membaca `store_pages.layout` miliknya sendiri.
3. Halaman tanpa layout (mis. baru dibuat) di-seed dari **sections template**, bukan
   dari sections global — supaya halaman baru tidak mewarisi isi homepage.
4. Slug halaman tervalidasi terpusat di `src/lib/pages/slug.ts` (`RESERVED_SLUGS`, `normalizeSlug`, `slugError`).
4. `store_pages.content` (TEXT) **deprecated** — renderer hanya membaca `layout.sections`.

### Struktur Folder

```
src/lib/builder/
├── template-types.ts          # Schema definitions (Template, HeaderVariant, …)
├── template-schema.ts         # Kontrak validasi v3 (validateTemplateV3, ALL_SECTION_TYPES_V3)
├── chrome.ts                  # Utilitas chrome (konstanta generik DIHAPUS bertahap → §18)
├── template-store.ts          # State zustand; BUILTIN_TEMPLATES = alias BUILT_IN_CATALOG
├── behaviour-script.ts        # Denylist script & CSS (server + client)
├── migration.ts               # Normalisasi section & identitas anchor
├── templates/
│   ├── food.ts                # Template kuliner ("Warung Makan", id `food`) —
│   │                           # sedang dibangun ulang mengikuti kontrak unik §18
│   ├── catalog.ts             # BUILT_IN_CATALOG + tier gating (TIER_RANK, kumulatif)
├── config-form.tsx            # Dynamic config form
├── mockup-preview.tsx         # Mockup visual per variant + TemplatePreview
└── design-styles.ts           # Helper palet/gradasi (katalog DESIGN_STYLES dihapus di migrasi 046)
src/components/builder/
├── section-renderer.tsx       # Section renderer (dispatcher variant.html, §18)
├── variant-html-renderer.tsx  # Renderer `html` kustom per varian
├── behaviour-runtime.tsx      # Runner animations[] & behaviours[] + customCss
├── builder-canvas.tsx         # Builder canvas
└── template-gallery.tsx       # Template picker + tombol Pratinjau
```

> **SUPERSEDED → §18.** `sections/registry.ts` (`SECTION_REGISTRY`),
> `templates/compose.ts` (`registrySections()`), dan konstanta generik
> `chrome.ts` (`HEADER_VARIANTS` / `FOOTER_VARIANTS`) **dihapus bertahap** dan
> tidak boleh dipakai template baru. Setiap template mendeklarasikan
> variannya sendiri (semua bervarian `html`, ID namespaced).

> **Catatan soal `sections/registry.ts` vs `template.sections`.** Alur lama
> `SECTION_REGISTRY` → `registrySections()` (`compose.ts`) → `template.sections`
> hanya berlaku untuk kode existing selama migrasi data (§18.7) dan **dilarang
> untuk template baru**. Sumber kebenaran untuk validasi adalah
> `template.sections` (yang dibaca renderer, kanvas, sidebar, dan
> `catalog.test.ts`) — jangan memvalidasi seed section terhadap
> `SECTION_REGISTRY` secara langsung.

---

## 2. Template Schema

### Template Interface

```typescript
interface Template {
  id: string;                    // Unique identifier (kebab-case)
  name: string;                  // Display name (Title Case)
  description: string;           // Short description
  category: BusinessCategory;    // 'food' | 'fashion' | 'retail' | 'handicraft' | 'services'
  tiers?: Tier[];                // ['free', 'starter', 'growth', 'enterprise']
  theme: TemplateTheme;          // Theme configuration
  headers: HeaderVariant[];      // Header variants (min 1)
  footers: FooterVariant[];      // Footer variants (min 1)
  sections: SectionTypeDefinition[]; // Section types (min 1)
}
```

### Bentuk yang WAJIB dipakai katalog: `CatalogTemplate`

```typescript
// src/lib/builder/templates/catalog.ts
export interface CatalogTemplate extends Template {
  data: FullTemplateData;        // WAJIB — seed siap-tayang
}
```

`Template` saja **tidak cukup**. Tanpa `data`, test kontrak gagal. Isi
`FullTemplateData` minimum (lihat `FOOD_TEMPLATE.data` di `templates/food.ts`):

```typescript
interface FullTemplateData {
  paletteOverride?: Partial<DesignStylePalette>; // palet efektif = theme.palette + override ini
  activeSections?: string[];       // subset tipe yang aktif sebagai seed niche ini
  sections?: Array<{               // Seed section
    type: SectionType;
    variant: string;               // WAJIB ada di template.sections → tipe tsb
    config?: Record<string, unknown>;
    style?: Partial<SectionStyle>;
    anchorId?: string;
  }>;
  header?: Partial<HeaderConfig>;   // navItems & ctaText WAJIB
  footer?: Partial<FooterConfig>;   // text WAJIB memuat "{year}"
  seo?: { title?: string; description?: string };
  core?: Partial<CoreConfig>;
  /** CSS bebas template — lihat §16. */
  customCss?: string;
}
```

> **Catatan migrasi 046.** Field lama `data.designStyleId` (merujuk katalog
> `DESIGN_STYLES`) sudah dihapus. Palet/template style kini hidup langsung di
> `theme` template + `paletteOverride` miliknya. Jangan memakai
> `validateStyleContrast()` / `DESIGN_STYLES` — keduanya tidak ada lagi.
> Kontras dijaga via `resolvePalette()` + `validateColorScheme()`.

### Kontrak test (sumber kebenaran)

`templates/catalog.test.ts` adalah penentu — bukan daftar di dokumen ini.
Template baru **wajib** memenuhi:

1. `theme.palette` (8 kunci) + `theme.typography` terisi; font heading/body/accent
   terdaftar di `FONT_CATEGORIES` (lihat §18.4 — `accentFont` token ketiga resmi).
2. Setiap `data.sections[].type` ada di `template.sections`.
3. Setiap `data.sections[].variant` ada di varian tipe tersebut **dan**
   `builderSectionToInstance()` resolve ke varian yang sama (tanpa fallback diam-diam).
4. **Delapan section inti ada di seed**: `hero`, `features`, `pricing`,
   `testimonials`, `gallery`, `location`, `faq`, `contact`.
5. `data.header.navItems` non-kosong; `data.header.ctaText` terisi.
6. `data.seo.title` terisi; `data.footer.text` memuat `{year}`.
7. `tiers` hanya berisi tier yang dikenal; kontrak saat ini = semua template
   terbuka untuk keempat tier (`free`, `starter`, `growth`, `enterprise`,
   gating kumulatif via `TIER_RANK`).
8. **SUPERSEDED → §18.** Poin lama "`data.header.variant` terdaftar di
   `HEADER_VARIANTS`; `data.footer.style` di `FOOTER_VARIANTS`" tidak berlaku
   untuk template baru — chrome generik dihapus; header/footer wajib `html`
   kustom unik dengan ID namespaced.
9. Palet efektif (`theme.palette` + `paletteOverride`) lolos
   `validateColorScheme()`.
10. **(Baru, §18)** Setiap varian/header/footer punya `html`; ID namespaced
    per template; nol warna/font hardcoded (dijaga guard §18.6).

### Registrasi TUNGGAL (satu tempat saja)

```typescript
// src/lib/builder/templates/catalog.ts  → dipakai sidebar, customize,
// migration, renderer publik, page-builder, dan API website
export const BUILT_IN_CATALOG: CatalogTemplate[] = [
  FOOD_TEMPLATE,
  FASHION_TEMPLATE as CatalogTemplate,   // ← tambahkan di sini
  /* … */
];
```

`BUILTIN_TEMPLATES` di `template-store.ts` hanyalah **alias**
(`export const BUILTIN_TEMPLATES: Template[] = BUILT_IN_CATALOG`) untuk
`template-gallery.tsx` dan route `/preview/[templateId]` — tidak ada list
kedua yang perlu diedit. (Versi lama dokumen ini menyebut "registrasi ganda";
itu sudah tidak berlaku.)

Menambah thumbnail galeri butuh satu case tambahan di `TemplatePreview`
(`mockup-preview.tsx`). Tanpa itu thumbnail jatuh ke `DefaultMockup`.

### TemplateTheme Interface

```typescript
interface TemplateTheme {
  palette: DesignStylePalette;
  typography: DesignStyleTypography;
  components: DesignStyleComponents;
  effects?: DesignStyleEffects;
}
```

### DesignStylePalette

```typescript
interface DesignStylePalette {
  primary: string;      // Warna utama (tombol, aksen)
  secondary: string;    // Warna pendamping
  accent: string;       // Sorotan kecil
  background: string;   // Latar halaman
  surface: string;      // Latar kartu/header/footer
  text: string;         // Warna tulisan utama
  textMuted: string;    // Deskripsi & info sekunder
  border: string;       // Warna pembatas
}
```

### DesignStyleTypography

```typescript
interface DesignStyleTypography {
  headingFont: string;   // Font untuk heading (Google Fonts, --font-heading)
  bodyFont: string;      // Font untuk body text (--font-body)
  accentFont?: string;   // Font aksen/script untuk eyebrow (Google Fonts, --font-accent).
                         // Token ketiga resmi (§18.4); fallback = headingFont.
                         // DILARANG font-family literal di html/css — hanya var(--font-*).
  baseSize: number;      // Ukuran dasar (px)
  scaleRatio: number;    // Rasio skala heading
  headingWeight: number; // Font weight heading (400-900)
  bodyWeight: number;    // Font weight body (400-900)
}
```

### DesignStyleComponents

```typescript
interface DesignStyleComponents {
  borderRadius: number;  // Radius sudut (px)
  buttonStyle: 'solid' | 'outline' | 'ghost' | 'gradient';
  shadowStyle: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  navStyle: 'solid' | 'transparent' | 'glass' | 'bordered';
  footerStyle: 'simple' | 'columns' | 'centered' | 'minimal';
}
```

### DesignStyleEffects

```typescript
interface DesignStyleEffects {
  glassmorphism?: boolean;
  gradientBackgrounds?: boolean;
  borderWidth?: number;
  uppercaseHeadings?: boolean;
}
```

---

## 3. Header Schema

### HeaderVariant Interface

```typescript
interface HeaderVariant {
  id: string;                    // Unique identifier — WAJIB namespaced per template
                                 // (e.g. `laundry-emerald:hdr-arch`), lihat §18.3
  name: string;                  // Display name
  description: string;           // Short description
  layout: string;                // SUPERSEDED → §18: bebas unik per template
                                 // (dulu WAJIB salah satu 7 layout generik)
  configFields: ConfigField[];   // Form fields for header config
  defaultConfig: Record<string, unknown>;
  mockup: string;                // Mockup visual identifier
  mobileMenu?: MobileMenuConfig;
  html?: string;                 // WAJIB diisi (§18) — chrome generik dihapus,
                                 // renderer hanya dispatch variant.html
  /**
   * Kedalaman menu: 1 (default, datar) atau 2 (boleh dropdown 1 tingkat).
   * WAJIB konsisten di seluruh varian header satu template — kalau satu varian
   * 1 dan tiga varian lain 2, form sidebar berubah-ubah saat user ganti gaya.
   * Dijaga `templates/catalog.test.ts` (keseragaman `maxNavDepth` per template).
   */
  maxNavDepth?: 1 | 2;
}
```

### Supported Layouts — SUPERSEDED → §18

> Tabel 7 layout generik di bawah **arsip migrasi saja**. `site-header-shared.tsx`
> dan `chrome.ts` (`HEADER_VARIANTS`) dihapus bertahap; template baru **dilarang**
> memakai layout generik — setiap varian header wajib `html` kustom unik dengan
> ID namespaced. `data.header.variant` berisi id varian milik template
> (e.g. `laundry-emerald:hdr-arch`), bukan id layout generik.

| Layout (kunci renderer) | Contoh id di `food.ts` | Description |
|--------|-----------|-------------|
| `standard` | `hdr-klasik` | Logo kiri, menu tengah, CTA kanan |
| `floating` | `hdr-melayang` | Bar mengambang rounded dengan shadow |
| `hero-overlay` | `hdr-hero` | Transparan di atas hero, solid saat scroll |
| `split-nav` | `hdr-split` | Blok brand besar di kiri, menu + CTA di kanan |
| `with-topbar` | `hdr-topbar` | Bar kontak/promo di atas bar utama |
| `glass` | *(belum dipakai `food.ts`)* | frosted, konten di belakang tetap terlihat |
| `minimal` | *(belum dipakai `food.ts`)* | Logo + hamburger saja |

> `data.header.variant` berisi **id layout** (`standard`, `floating`, … —
> nilai yang dibandingkan `catalog.test.ts` ke `HEADER_VARIANTS`), bukan id
> varian header (`hdr-klasik`). **Arsip migrasi** — tidak berlaku untuk template
> baru (§18).

### Default Config Keys

```typescript
{
  logoUrl: string;        // URL logo (boleh 'assets/logo.png' di template ZIP)
  siteTitle: string;      // Nama toko
  tagline: string;        // Tagline
  navItems: Array<{       // Menu navigasi; `children` opsional (1 tingkat)
    id: string;
    label: string;
    url: string;          // '#anchor' untuk section, URL penuh bila isExternal
    isExternal: boolean;
    enabled: boolean;
    children?: NavItem[];
  }>;
  ctaText: string;
  ctaLink: string;
  showCta: boolean;
  sticky: boolean;        // Header menempel (default: true)
  contentWidth: 'full' | '6xl' | '5xl' | '4xl';   // default '6xl'
  topbarText?: string;    // hanya untuk layout with-topbar
  topbarPhone?: string;
  topbarEmail?: string;
}
```

### `contentWidth` — lebar isi header

Isi header (nama web, menu, CTA) dibox dengan `max-width` + centering supaya
tidak terdistribusi ke tepi layar pada monitor lebar. Default `6xl` (1152px)
sebaris dengan footer dan section hero/produk.

| Nilai | Kelas | Lebar |
|---|---|---|
| `full` | `w-full` | Mengikuti lebar layar (perilaku lama) |
| `6xl` | `max-w-6xl` | 1152px — default |
| `5xl` | `max-w-5xl` | 1024px |
| `4xl` | `max-w-4xl` | 896px |

> **Aturan alignment saat mengubah layout header:** padding horizontal
> (`px-4 sm:px-6`) tetap di elemen **luar** (`<header>`), yang di-box hanya
> baris isinya. Kalau padding ikut masuk ke dalam wrapper, konten bergeser
> 24px ke kanan dan tidak rata dengan section/footer.

---

## 4. Footer Schema

### FooterVariant Interface

```typescript
interface FooterVariant {
  id: string;                    // Unique identifier — WAJIB namespaced per template (§18.3)
  name: string;                  // Display name
  description: string;           // Short description
  layout: string;                // SUPERSEDED → §18: bebas unik per template
  configFields: ConfigField[];   // Form fields for footer config
  defaultConfig: Record<string, unknown>; // Default values
  mockup: string;                // Mockup visual identifier
  html?: string;                 // WAJIB diisi (§18)
}
```

### Supported Layouts — SUPERSEDED → §18 (arsip migrasi)

> Tabel 7 layout generik di bawah **arsip migrasi saja**. `FOOTER_VARIANTS`
> (`chrome.ts`) dihapus bertahap; template baru **dilarang** memakai layout
> generik — setiap varian footer wajib `html` kustom unik. Contoh id varian
> dari `templates/food.ts`:

| Layout (kunci renderer) | Contoh id di `food.ts` | Description |
|--------|-----------|-------------|
| `simple` | `ftr-inline` | Baris tunggal: brand, menu datar, sosmed, copyright |
| `columns` | `ftr-kolom` | Tiga kolom dengan aksen gradasi |
| `centered` | `ftr-tengah` | Inisial brand besar + ornamen, bertumpuk tengah |
| `minimal` | `ftr-mini` | Super ringkas: hanya teks hak cipta |
| `newsletter` | `ftr-news` | Pita info/promo lebar di atas baris copyright |
| `social` | *(belum dipakai `food.ts`)* | Blok sosial besar di tengah, navigasi rapat di bawah |
| `cta-overlap` | *(belum dipakai `food.ts`)* | Blok CTA dengan tombol besar, penuh lebar |

> `data.footer.style` berisi **id layout** (`simple`, `columns`, … — nilai yang
> dibandingkan `catalog.test.ts` ke `FOOTER_VARIANTS`). **Arsip migrasi** —
> tidak berlaku untuk template baru (§18).

### Default Config Keys

```typescript
{
  text: string;           // WAJIB memuat "{year}"
  navItems: NavItem[];    // Navigasi datar (layout inline)
  navGroups?: NavGroup[]; // Navigasi terkelompok (layout columns)
  showSocial: boolean;
  showNav?: boolean;
  address?: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  showWhatsApp?: boolean;
}
```

---

## 5. Section Schema

### SectionTypeDefinition Interface

```typescript
interface SectionTypeDefinition {
  type: SectionType;      // BUKAN string bebas — union 18 nilai, lihat daftar di bawah
  name: string;
  icon: string;
  variants: SectionVariant[];
  mobileMenu?: MobileMenuConfig;
}
```

`SectionType` adalah union tertutup berisi **18 nilai** (sama persis dengan
`ALL_SECTION_TYPES_V3` di `template-schema.ts` dan `ALL_SECTION_TYPES` di
`templates/catalog.test.ts`):

```
hero · features · product_grid · pricing · testimonials · gallery
location · faq · contact · about · video · team · newsletter · divider
marquee · menu_board · steps · cta
```

Menambah tipe predefined baru berarti menambah ke union ini. **SUPERSEDED → §18:**
kalimat lama "dan ke `SECTION_REGISTRY` (`sections/registry.ts`) — seluruh
template turunan mewarisi lewat `registrySections()` (`templates/compose.ts`)"
**tidak berlaku lagi** — registry dihapus, tiap template mendeklarasikan
variannya sendiri (semua bervarian `html`). Tipe di luar daftar ini adalah tipe
**kustom** milik template (wajib `html` di tiap varian — dan setelah §18,
tipe predefined pun wajib `html`, lihat `validateCustomSectionType` di
`template-schema.ts`).

### SectionVariant Interface

```typescript
interface SectionVariant {
  id: string;                    // Unique identifier — WAJIB namespaced per template
                                 // (e.g. `laundry-emerald:service-cards-luxe`), §18.3.
                                 // ID telanjang generik (hero-full, features-3col, …) DITOLAK test.
  name: string;                  // Display name
  description: string;           // Short description
  layout: string;                // Layout identifier (must match renderer)
  configFields: ConfigField[];   // Form fields for section config
  defaultConfig: Record<string, unknown>; // Default values
  defaultStyle?: {               // Optional default style
    padding?: { top?: number; right?: number; bottom?: number; left?: number };
    background?: 'color' | 'image' | 'gradient' | 'transparent';
    backgroundColor?: string;
    backgroundImage?: string;
    backgroundGradient?: string;
  };
  mockup: string;                // Mockup visual identifier
  html?: string;                 // WAJIB diisi (§18.3) — renderer hanya dispatch variant.html
}
```

### SectionStyle Interface

```typescript
interface SectionStyle {
  padding: { top: number; right: number; bottom: number; left: number };
  background: 'color' | 'image' | 'gradient' | 'transparent';
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundGradient?: string;
  backgroundBlur?: number;       // 0-16px
  backgroundSize?: 'cover' | 'contain' | 'auto';
  backgroundOverlay?: 'none' | 'light' | 'dark' | 'primary';
}
```

### Supported Section Types

| Type | Name | Description |
|------|------|-------------|
| `hero` | Hero | Full width hero dengan headline & CTA |
| `features` | Fitur | Grid fitur dengan icon |
| `product_grid` | Produk | Grid produk |
| `testimonials` | Testimoni | Testimoni pelanggan |
| `faq` | FAQ | Pertanyaan umum |
| `cta` | CTA | Call to action banner |
| `contact` | Kontak | Form kontak |
| `about` | Tentang | Tentang bisnis |
| `gallery` | Galeri | Galeri gambar |
| `video` | Video | Video embed |
| `team` | Tim | Profil tim |
| `pricing` | Harga | Tabel harga/paket |
| `newsletter` | Newsletter | Form newsletter |
| `divider` | Divider | Pemisah section |
| `marquee` | Teks Berjalan | Pita teks berjalan |
| `menu_board` | Menu/Harga | Daftar menu dengan harga |
| `steps` | Langkah | Langkah proses |
| `location` | Lokasi | Lokasi & jam buka |

---

## 6. Config Fields System

### ConfigField Interface

```typescript
interface ConfigField {
  key: string;              // Config key (camelCase)
  label: string;            // Display label
  type: ConfigFieldType;    // Field type
  options?: ConfigFieldOption[]; // For select type
  itemFields?: ConfigField[];    // For list type (nested fields)
  placeholder?: string;     // Input placeholder
  defaultValue?: unknown;   // Default value
  maxItems?: number;        // Max items for list type
  rows?: number;            // Rows for textarea
}
```

### ConfigFieldType

| Type | Description | UI Component |
|------|-------------|--------------|
| `text` | Single-line text | Input |
| `textarea` | Multi-line text | Textarea |
| `number` | Numeric input | Input type=number |
| `select` | Dropdown selection | Select |
| `image` | Image URL with preview | Input + preview |
| `list` | Repeater with nested fields | Repeater (add/remove/reorder) |
| `color` | Color picker | Color input + hex input |
| `background` | Background type selector | Select + conditional fields |
| `gallery` | Image list | Image grid with add/remove |
| `switch` | Toggle on/off | Switch |

### ConfigFieldOption

```typescript
interface ConfigFieldOption {
  label: string;  // Display label
  value: string;  // Option value
}
```

### List Field Example

```typescript
{
  key: 'items',
  label: 'Items',
  type: 'list',
  itemFields: [
    { key: 'icon', label: 'Icon', type: 'text' },
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea' },
  ],
  maxItems: 10,
}
```

---

## 7. Section Style System

### Background Types

| Type | Description |
|------|-------------|
| `transparent` | Mengikuti background template |
| `color` | Warna solid (bisa theme reference) |
| `image` | Gambar background dengan opsi blur & overlay |
| `gradient` | Gradasi warna (start, end, angle) |

### Theme Color References

Gunakan format `theme:{key}` untuk reference warna dari theme (pada
`defaultStyle` / `style` per-section):

| Reference | Description |
|-----------|-------------|
| `theme:primary` | Warna primer |
| `theme:secondary` | Warna sekunder |
| `theme:accent` | Warna aksen |
| `theme:background` | Warna background |
| `theme:surface` | Warna permukaan |

**Penting**: Saat user mengganti skema warna, section yang menggunakan theme reference akan otomatis mengikuti.

### Token Adaptif di `variant.html` (normatif, §18.4)

Di dalam `html` kustom **dilarang** hex / `rgb()` / `font-family` literal.
Satu-satunya warna & font yang boleh muncul adalah token — disediakan
`buildThemeTokens()` di kanvas + live site (sumber tunggal):

| Token | Untuk |
|---|---|
| `var(--color-primary/secondary/accent/background/surface/text/textMuted/border)` | Semua latar, teks, garis, dekorasi |
| `var(--color-on-primary)` | Teks di atas latar primary |
| Tombol di atas latar TERANG: `background: var(--color-primary)` + `color: var(--color-on-primary)` | CTA/kartu terang |
| Tombol di atas latar GELAP/primary: `background: var(--color-accent)` + `color: var(--color-primary)` | CTA/kartu gelap |
| `var(--font-heading)` / `var(--font-body)` / `var(--font-accent)` | Headline / body / eyebrow script |

Ornamen (lengkung, daun, divider, badge) memakai `currentColor` atau
`var(--color-*)`. Detail + contoh sebelum/sesudah: §18.4.

### Background Image Options

```typescript
{
  backgroundImage: 'https://...',  // URL gambar
  backgroundBlur: 0,               // 0-16 px (slider). Hanya memblur GAMBAR, bukan konten
  backgroundSize: 'cover',         // 'cover' | 'contain' | 'auto'
  backgroundOverlay: 'none',       // 'none' | 'light' | 'dark' | 'primary'
  backgroundOverlayOpacity: 50,    // 0-100% (slider). Kosong = default per jenis
}
```

**Overlay hanya berlaku untuk `background: 'image'`.** Nilai `backgroundOverlay: 'none'`
tetap dijaga overlay gelap otomatis oleh renderer agar teks terang di atas foto apa pun
tetap terbaca — jadi slider kekuatan nonaktif pada opsi tersebut (lihat
`textBackgroundFor` di `section-contrast.ts`).

Default opasitas per jenis: `light` 30%, `dark` 50%, `primary` 60%.

### Gradient Format

Dua format diterima; renderer menyusunnya otomatis menjadi CSS `linear-gradient()`:

```typescript
// Format singkat (dipakai panel Gaya Blok):
{ backgroundGradient: '#047857, #065f46, 135deg' }   // start, end, angle

// CSS penuh (boleh dipakai template hasil AI) — diteruskan apa adanya:
{ backgroundGradient: 'linear-gradient(135deg, #8B5A2B 0%, #D4A574 100%)' }
```

Sudut boleh `deg` / `grad` / `rad` / `turn`; tanpa sudut memakai `135deg`. Nilai kosong
jatuh ke gradasi palet tema (`palette.primary` → `palette.secondary`).
Token `theme:*` tetap didukung di kedua format.

Gunakan `parseGradientSpec()` / `composeGradientCss()` dari
`src/lib/builder/design-styles.ts` bila perlu membaca/menulis nilai ini — jangan
`split(',')` manual, karena kedua format punya jumlah bagian berbeda.

### Padding System

```typescript
{
  padding: { top: 48, right: 24, bottom: 48, left: 24 }
}
```

### Lebar Konten Section (boxed, bukan full-width)

Isi section wajib dibox mengikuti renderer bawaan (`max-w-6xl`/`max-w-4xl` +
`mx-auto`), sejajar dengan `contentWidth` header (default `6xl` = 1152px).
Aturan ringkasnya untuk developer:

| Lebar | Nilai | Untuk |
|---|---|---|
| `4xl` | 896px | Teks panjang (FAQ, testimoni tunggal) |
| `5xl` | 1024px | Sedang (pricing 2-tier, kontak split) |
| `6xl` | 1152px — default | Umum (hero, features, galeri) |
| `full` | Mengikuti layar | Hanya lapisan latar (foto hero, marquee) — isinya tetap dibox |

`VariantHtmlRenderer` (`variant.html` kustom) TIDAK membungkus padding/latar
section — penulis `html` wajib menyertakan wadahnya sendiri
(`max-width` + `margin:auto` + padding 24px), kalau tidak section tampil
full-width mentah. Ini sumber umum "desain tidak sesuai" pada template hasil
import: periksa `html` variannya bila section melebar satu layar.

### Responsive Visibility

```typescript
{
  responsive: {
    hideOnMobile: false,    // sembunyikan di < 640px
    hideOnTablet: false,     // sembunyikan di 640–1023px
    hideOnDesktop: false,   // sembunyikan di ≥ 1024px
  }
}
```

Breakpoint mengikuti konvensi renderer (container queries `@sm:`/`@md:` +
prop `compact` header/footer di `< 640px`, viewport switcher builder
375 / 768 / 1024). Detail kontrak per-template ada di
[§15.7](#157-kontrak-responsive-flags).

---

## 8. Best Practices

### Penamaan

- **ID template**: kebab-case unik (e.g., `laundry-emerald`)
- **ID varian/header/footer**: WAJIB namespaced per template —
  `<template>-<nama-unik>` (e.g., `laundry-emerald:hero-arch`,
  `laundry-emerald:hdr-arch`), lihat §18.3. ID telanjang generik
  (`hero-full`, `features-3col`, `hdr-klasik`, …) DITOLAK test.
- **Name**: Title Case, user-friendly (e.g., `Full Width`, `Klasik`)
- **Layout**: string bebas unik per template (dulu wajib match renderer
  generik — SUPERSEDED → §18; renderer hanya dispatch `variant.html`)

### Kontras Warna

- **WAJIB**: Gunakan `getOnColor(background)` untuk menentukan warna teks
- **WAJIB**: Background gelap → teks terang (`var(--color-on-primary)`)
- **WAJIB**: Background terang → teks gelap (`var(--color-text)`)
- **WAJIB**: Deteksi kontras berdasarkan parent langsung dari text, bukan section background

### Teks vs Latar Section (Anti Tumpang-Tindih)

- Aturan user: warna teks tidak boleh nabrak background parent-nya; bila parent transparan, telusuri parent berikutnya terus sampai latar section (`getSectionEffectiveBackground()` sudah melakukan ini)
- Semua teks yang duduk langsung di atas latar section **WAJIB** memakai token autofix: `--color-on-section` / `--color-on-section-muted`
- Aksen primer sebagai teks (mis. harga menu) pada branch generik **WAJIB** memakai `--color-primary-on-section` — JANGAN `var(--color-primary)` langsung. Pada `variant.html` (token itu tak tersedia) pakai `var(--color-primary)` di atas latar terang.
- Input form wajib punya latar sendiri (`surface`) + warna teks (`text`) agar ketikan terbaca di section gelap

### Tombol vs Latar Section (Anti Tumpang-Tindih)

- **WAJIB**: Background tombol pada branch generik memakai token `var(--color-button)` + teks `var(--color-on-button)` — JANGAN `var(--color-primary)` langsung. Pada `variant.html` pakai pasangan konteks §18.4 (terang: primary+on-primary; gelap: accent+primary).
- Token dihitung per section oleh `resolveButtonColors()` (`section-contrast.ts`): latar efektif section di-traverse (style → parent → halaman), bila primary tabrakan (hex sama atau kontras < 1,5) fallback berurutan `secondary → accent → surface → text`
- Latar gradient: tabrakan bila cocok salah satu stop; latar foto: primary dipertahankan (overlay gelap dipaksa)
- **WAJIB**: Setiap varian dalam satu tipe harus me-render markup berbeda (dijaga test `section-variants.test.ts`)

### Section ID

- Setiap section yang ter-render wajib punya atribut `id` dari `anchorId` (untuk link anchor `#...`)
- `anchorId` kosong diisi otomatis dari default template + dedup (`beranda`, `layanan-2`, …) — aturan sama di seed kanvas & render publik
- Section ID tampil di badge kanvas & panel Section Config (klik untuk salin)

### Theme Color References

- **WAJIB**: Gunakan `theme:primary`, `theme:secondary`, dll untuk warna yang harus mengikuti skema (pada `defaultStyle`/`style` per-section)
- **WAJIB**: Di dalam `variant.html` hanya token `var(--color-*)` /
  `var(--color-on-*)` / `var(--color-button)` / `var(--font-*)` (tabel §7) —
  **HINDARI**: hex (`#fff`, `#0E7C66`), `rgb()/rgba()/hsl()`, `white`/`black`,
  dan `font-family:` literal dalam bentuk apa pun (dijaga test §18.6)
- **CONTOH**: `backgroundColor: 'theme:primary'` bukan `backgroundColor: '#047857'`

### Config Fields

- **WAJIB**: Semua konten (gambar, background, list) harus konfigurable
- **HINDARI**: Hardcoded values di config fields
- **WAJIB**: Setiap config field punya `label` dan `placeholder`
- **WAJIB**: List fields punya `itemFields` yang lengkap

### Mockup

- **WAJIB**: Setiap variant punya `mockup` identifier
- **WAJIB**: Mockup harus jelas membedakan varian
- **WAJIB**: Mockup digunakan di SectionPicker untuk preview visual

### Struktur Config

- **WAJIB**: Default config lengkap untuk setiap variant
- **WAJIB**: Default style optional tapi recommended
- **WAJIB**: Config fields harus user-friendly dan mudah dipahami

---

## 9. Template Upload System (ZIP import/export) — ARSIP

> ⚠️ **DEPRECATED — sistem import/export ZIP dihapus dan tidak dipakai lagi.**
> Route `POST /api/templates/library/import`, `GET .../export`, dan tabel
> `templates_library` sudah dihapus (migrasi 040). Template kini **hanya kode
> statis** di `src/lib/builder/templates/` (`food.ts`, `catalog.ts` pendaftar;
> `compose.ts` komposer dari registry — DIHAPUS bertahap, §18.7).
> Menambah template = tambah file `<niche>.ts` → daftarkan di
> `BUILT_IN_CATALOG` → `bunx vitest run src/lib/builder/templates/catalog.test.ts`
> (cara membuat template baru yang berlaku: §12 + kontrak unik §18).
> `scripts/create-template.ts` hanya menghasilkan **kerangka draf JSON v3.0**
> untuk diisi developer dan divalidasi via `validateTemplateV3` — bukan ZIP
> dan bukan jalur import ke database.
> Seluruh isi §9 di bawah garis ini dipertahankan murni sebagai **arsip
> historis** (format v2.0) dan bukan instruksi yang berlaku.

### Status: aktif, end-to-end

`import` → `library` → `apply` → `preview` sudah terhubung. Perbaikan berikut
baru masuk di versi dokumen ini:

- Template hasil import **tidak lagi menghasilkan halaman kosong**. Dulu
  `template-gallery.tsx` memakai baris DB utuh sebagai `data`, sehingga
  `data.sections/header/footer` selalu `undefined`. Sekarang `template_data`
  dibongkar lebih dulu.
- Apply template library tidak lagi **404**. ID library bukan baris tabel
  `templates`, jadi route memakai `template_source: "saved"` dan meminjam
  anchor FK dari template aktif website.
- `ensureSectionIdentities()` tidak lagi diam-diam mengubah semua section jadi
  `hero-full` untuk template library.
- `/preview/[templateId]` sekarang bisa preview template library.
- `animations[]` dan `behaviours[]` **benar-benar dijalankan** lewat
  `behaviour-runtime.tsx` (sebelumnya hanya disimpan).

### Import API

**Endpoint**: `POST /api/templates/library/import`

**Supported Formats**:
1. **ZIP** (multipart) — `file` + `name`
2. **JSON** (backward compatible) — `name` + `template_data`

**Request (ZIP - multipart/form-data)**:
```
file: <template.zip> (multipart/form-data)
name: "Template Name"
```

**Request (JSON - backward compatible)**:
```json
{
  "name": "Template Name",
  "description": "Template Description",
  "template_data": { /* Template data */ }
}
```

**Response**:
```json
{
  "success": true,
  "data": { /* Created template */ },
  "message": "Template berhasil diimpor"
}
```

### Export API

**Endpoint**: `GET /api/templates/library/[id]/export`

**Response**: 
- **Simple JSON** — untuk template tanpa assets/animations/behaviours
- **ZIP** — untuk template dengan assets/animations/behaviours (format baru)

**ZIP Structure**:
```
template.zip
├── template.json          # Template data (v2.0)
├── thumbnail.png          # Thumbnail (optional)
├── assets/                # Assets folder (optional)
│   ├── logo.png
│   └── hero-bg.jpg
└── behaviours/           # JavaScript behaviours (optional)
    ├── scroll-animation.js
    └── form-handler.js
```

**template.json Format (v2.0)**:
```json
{
  "version": "2.0",
  "name": "Template Name",
  "description": "Template Description",
  "category": "services",
  "theme": { /* TemplateTheme */ },
  "headers": [ /* HeaderVariant[] */ ],
  "footers": [ /* FooterVariant[] */ ],
  "sections": [ /* SectionTypeDefinition[] */ ],
  "animations": [ /* AnimationConfig[] */ ],
  "behaviours": [ /* BehaviourConfig[] */ ]
}
```

### ZIP Import Flow

1. **Client uploads ZIP file** via multipart/form-data
2. **Server extracts** ZIP using `fflate` (server-side)
3. **Validates** `template.json` schema
4. **Extracts assets** from `assets/` folder
5. **Uploads assets** to Supabase Storage (`template-assets/{userId}/{templateId}/`)
6. **Replaces** local paths in template JSON with Supabase URLs
7. **Sanitizes** behaviour scripts (removes dangerous patterns)
8. **Saves** to database with assets, animations, behaviours metadata

### Export Flow

1. **Server fetches** template data from database
2. **Checks** for assets/animations/behaviours
3. **If no extras**: Returns simple JSON
4. **If has extras**: Creates ZIP with:
   - `template.json` (v2.0 format)
   - `assets/meta.json` (asset metadata)
   - `behaviours/meta.json` (behaviour metadata)
   - `animations/meta.json` (animation metadata)
5. **Returns** ZIP file for download

### Template Structure (v2.0)

```typescript
interface Template {
  id: string;
  name: string;
  description: string;
  category: BusinessCategory;
  tiers?: Tier[];
  theme: TemplateTheme;
  headers: HeaderVariant[];
  footers: FooterVariant[];
  sections: SectionTypeDefinition[];
  animations?: AnimationConfig[];    // NEW
  behaviours?: BehaviourConfig[];    // NEW
  assets?: AssetMetadata[];          // NEW
}
```

### AnimationConfig

```typescript
interface AnimationConfig {
  id: string;
  name: string;
  type: 'fade' | 'slide' | 'zoom' | 'bounce' | 'custom';
  duration: number;        // ms
  delay: number;           // ms
  easing: string;          // CSS easing function
  trigger: 'onLoad' | 'onScroll' | 'onClick' | 'onHover';
  keyframes?: string;      // CSS keyframes for custom animation
  target?: string;         // CSS selector
}
```

### BehaviourConfig

```typescript
interface BehaviourConfig {
  id: string;
  name: string;
  script: string;          // JavaScript code
  trigger: 'onLoad' | 'onScroll' | 'onClick' | 'onHover' | 'onSubmit';
  target: string;          // CSS selector
}
```

### AssetMetadata

```typescript
interface AssetMetadata {
  id: string;
  name: string;
  path: string;
  url: string;             // Supabase Storage URL
  type: 'image' | 'script' | 'style';
  size: number;
}
```

### Template Upload Flow (ZIP)

```typescript
// 1. User uploads ZIP file
const file = input.files[0];

// 2. Import to server
const formData = new FormData();
formData.append('file', file);
formData.append('name', 'My Template');

const res = await fetch('/api/templates/library/import', {
  method: 'POST',
  body: formData,
});

const result = await res.json();
if (result.success) {
  console.log('Template imported:', result.data);
}

// 3. Export template as ZIP (selalu ZIP, import-compatible — lihat
//    src/lib/builder/template-export.ts: template.json apa adanya +
//    assets/ + thumbnail.* + meta.json referensi; behaviours/animations
//    tetap inline agar re-import tidak duplikat)
async function exportTemplate(templateId: string) {
  const res = await fetch(`/api/templates/library/${templateId}/export`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `template-${templateId}.zip`;
  a.click();
}
```

### Admin endpoints (system templates)

- `GET /api/admin/templates` — list semua template (filter scope/category/tier).
- `POST /api/admin/templates` — buat system template dari JSON.
- `GET/PATCH/DELETE /api/admin/templates/[id]` — kelola satu template.
- `POST /api/admin/templates/import` — import ZIP sebagai system template
  (`scope=public`, `is_system_template=true`). Batas SAMA dengan user route
  (25MB/100MB/200 entri/5MB/50 aset/10MB/50 behaviour). Form fields
  `category` (5 kanonis) + `tier_requirement` (4 paket, hierarki kumulatif:
  paket atas bisa memakai milik bawahnya) — nilai tak dikenal ditolak 400.
- `GET /api/admin/templates/[id]/export` — export ZIP template apa pun
  (termasuk system) dengan builder yang sama.
```
```

---

## 10. Contoh Implementasi

> **Catatan §18.** Contoh di bawah memakai ID namespaced + `html` wajib.
> Contoh lama ber-ID telanjang generik (`hero-full`, `layout: standard/simple`)
> adalah arsip — jangan ditiru untuk template baru.

### Contoh Section Type Lengkap (unik, adaptif)

```typescript
{
  type: 'hero',
  name: 'Hero',
  icon: 'Layout',
  variants: [
    {
      id: 'laundry-emerald:hero-arch',
      name: 'Hero Arch Emerald',
      description: 'Band hijau tua + lengkung emas + foto arch',
      layout: 'laundry-emerald:hero-arch',
      mockup: 'laundry-emerald:hero-arch',
      // ...configFields seperti biasa (headline, subheadline, cta_text, cta_link, image)...
      defaultConfig: {
        eyebrow: 'Antar-Jemput Gratis',
        headline: 'Cuci Bersih, Wangi, Siap Pakai',
        subheadline: '...',
        cta_text: 'Pesan Sekarang',
        cta_link: '#layanan',
        image: 'https://...',
      },
      defaultStyle: {
        padding: { top: 48, right: 24, bottom: 48, left: 24 },
      },
      // WAJIB: html adaptif — hanya token var(--color-*) / var(--font-*),
      // tanpa hex dan tanpa font-family literal. Lihat §18.4.
      html: `<section data-tpl-type="hero" data-tpl-variant="laundry-emerald:hero-arch" style="background: var(--color-primary); ...">...</section>`,
    },
  ],
}
```

### Contoh Header Variant (unik, adaptif)

```typescript
{
  id: 'laundry-emerald:hdr-arch',
  name: 'Emerald Arch',
  description: 'Bar hijau tua + lengkung emas + CTA pill',
  layout: 'laundry-emerald:hdr-arch',
  mockup: 'laundry-emerald:hdr-arch',
  // WAJIB: html kustom unik bertoken (var(--color-*) / var(--font-*)).
  configFields: [
    { key: 'logoUrl', label: 'Logo URL', type: 'image', placeholder: 'https://...' },
    { key: 'siteTitle', label: 'Nama Toko', type: 'text', placeholder: 'Toko Saya' },
    { key: 'tagline', label: 'Tagline', type: 'text', placeholder: 'Produk berkualitas' },
    {
      key: 'navItems',
      label: 'Menu Navigasi',
      type: 'list',
      itemFields: [
        { key: 'label', label: 'Label', type: 'text' },
        { key: 'url', label: 'URL', type: 'text' },
      ],
    },
    { key: 'ctaText', label: 'Teks CTA', type: 'text', placeholder: 'Hubungi Kami' },
    { key: 'ctaLink', label: 'Link CTA', type: 'text', placeholder: '/kontak' },
    { key: 'showCta', label: 'Tampilkan CTA', type: 'switch' },
    { key: 'sticky', label: 'Header menempel', type: 'switch' },
  ],
  defaultConfig: {
    logoUrl: '',
    siteTitle: 'Toko Saya',
    tagline: 'Produk berkualitas',
    navItems: [
      { id: 'nav-1', label: 'Beranda', url: '/', isExternal: false, enabled: true },
      { id: 'nav-2', label: 'Produk', url: '/produk', isExternal: false, enabled: true },
    ],
    ctaText: 'Hubungi Kami',
    ctaLink: '/kontak',
    showCta: true,
    sticky: true,
  },
}
```

### Contoh Footer Variant (unik, adaptif)

```typescript
{
  id: 'laundry-emerald:ftr-gold-rule',
  name: 'Kolom Emerald',
  description: 'Tiga kolom + garis aksen emas',
  layout: 'laundry-emerald:ftr-gold-rule',
  mockup: 'laundry-emerald:ftr-gold-rule',
  // WAJIB: html kustom unik bertoken (var(--color-*) / var(--font-*)).
  configFields: [
    { key: 'text', label: 'Teks Footer', type: 'text', placeholder: '© {year} Toko Saya' },
    {
      key: 'navItems',
      label: 'Menu Footer',
      type: 'list',
      itemFields: [
        { key: 'label', label: 'Label', type: 'text' },
        { key: 'url', label: 'URL', type: 'text' },
      ],
    },
    { key: 'showSocial', label: 'Tampilkan ikon sosial', type: 'switch' },
  ],
  defaultConfig: {
    text: '© {year} Toko Saya. Hak Cipta Dilindungi.',
    navItems: [
      { id: 'footer-1', label: 'Beranda', url: '/', isExternal: false, enabled: true },
      { id: 'footer-2', label: 'Kontak', url: '/kontak', isExternal: false, enabled: true },
    ],
    showSocial: true,
  },
}
```

---

## 11. Checklist Validasi

### Template Level

- [ ] Template punya `id` unik (kebab-case)
- [ ] Template punya `name` (Title Case)
- [ ] Template punya `description`
- [ ] Template punya `category` yang valid
- [ ] Template punya `theme` lengkap (palette 8 kunci, typography heading/body/accent)
- [ ] Ketiga font terdaftar di `FONT_CATEGORIES` (§18.4)
- [ ] Semua varian section + header + footer punya `html` (§18.3)
- [ ] Semua ID varian namespaced per template; nol ID telanjang generik (§18.3, §18.6)
- [ ] Template punya minimal 1 `header` variant
- [ ] Template punya minimal 1 `footer` variant
- [ ] Template punya minimal 1 `section` type

### Header/Footer Level

- [ ] Setiap variant punya `id` unik namespaced per template (§18.3)
- [ ] Setiap variant punya `name` dan `description`
- [ ] Setiap variant punya `layout` unik (bukan layout generik — SUPERSEDED → §18)
- [ ] Setiap variant punya `mockup` identifier
- [ ] Setiap variant punya `configFields` lengkap
- [ ] Setiap variant punya `defaultConfig` lengkap
- [ ] Setiap variant punya `html` kustom unik bertoken (§18.4)
- [ ] Semua konten (logo, nav, CTA) konfigurable

### Section Level

- [ ] Setiap section type punya `type` unik
- [ ] Setiap variant punya `id` namespaced (bukan `hero-full`/`features-3col`/… — ditolak test §18.6)
- [ ] Setiap variant punya `html` kustom unik (wajib, §18.3)
- [ ] Setiap variant punya `layout` unik per template
- [ ] Setiap variant punya `mockup` identifier
- [ ] Setiap variant punya `configFields` lengkap
- [ ] Setiap variant punya `defaultConfig` lengkap
- [ ] Semua konten (gambar, background, list) konfigurable
- [ ] Tidak ada hardcoded values di config

### Style Level

- [ ] Background menggunakan theme color references (bukan hardcoded)
- [ ] `html` hanya memakai token `var(--color-*)` / `var(--font-*)` — nol hex,
      nol `rgb()/rgba()`, nol `font-family:` literal (dijaga test §18.6)
- [ ] Padding reasonable (tidak terlalu besar/kecil)
- [ ] Kontras warna teks vs background sudah benar
- [ ] Background image options lengkap (blur, size, overlay)

### Mobile Level (Spek v3.1 — lihat §15; App-like — lihat §17)

- [ ] Lolos uji tiga viewport: 375 / 768 / 1024 (tanpa scroll horizontal di HP)
- [ ] Isi section dibox (default `6xl`, rata tengah); `variant.html` membawa
  wadahnya sendiri; verifikasi tepi rata di 1440px
- [ ] Grid 1 kolom default → multi-kolom via `@md:`; tanpa width fixed > 480px
- [ ] Gambar `max-width:100%;height:auto`; target sentuh ≥ 44px; body ≥ 14px
- [ ] Nav jadi hamburger + drawer (`drawer-top`/`drawer-sidebar`) di HP;
  form 1 kolom full-width di HP
- [ ] Flag `responsive` (bila dipakai) hanya menyembunyikan hiasan/varian
  pengganti — bukan konten inti
- [ ] Bottom bar: config `data.bottomBar` terisi (maks 5 item, semua berikon),
  mati di ≥ 1024px (kontrak §17.3)
- [ ] Native-like: `100dvh`, safe-area bottom/top, tap-highlight transparan,
  input ≥ 16px, tanpa interaksi hover-only (§17.4)
- [ ] Varian `hero-carousel` tersedia dengan config slides + autoplay (§17.5)
- [ ] Popup welcome/promo: config `data.popup` tersedia, default nonaktif,
  sekali per pengunjung (§17.6)

### Config Fields Level

- [ ] Setiap field punya `key` (camelCase)
- [ ] Setiap field punya `label` (user-friendly)
- [ ] Setiap field punya `type` yang valid
- [ ] Select fields punya `options`
- [ ] List fields punya `itemFields`
- [ ] Setiap field punya `placeholder` (optional tapi recommended)

---

## 12. Panduan Developer

> Tidak ada dokumen prompt AI eksternal — template hanya dibuat dan
> divalidasi langsung di repository ini mengikuti kontrak §2 dan test di bawah.

### Cara Membaca Template Schema

```typescript
import { BUILT_IN_CATALOG } from '@/lib/builder/templates/catalog';
import { getTemplate } from '@/lib/builder/template-store';

// Get template by ID
const template = getTemplate('food');

// Get section variant (ID namespaced per template, §18.3)
const def = template!.sections.find((s) => s.type === 'hero');
const variant = def?.variants.find((v) => v.id === 'food:hero-arang');

// Access config fields
variant?.configFields.forEach(field => {
  console.log(field.key, field.type, field.label);
});
```

### Cara Membuat Template Baru

1. **Buat file baru** `src/lib/builder/templates/<niche>.ts` (contoh:
   `laundry-emerald.ts`) — **JANGAN duplikat-tempel template lain lalu hanya
   mengganti warna** (§18.2). Deklarasikan sendiri: `id`, `name`, `description`,
   `category`, `theme` (palet 8 kunci + 3 font), `headers` (≥5, semua `html`),
   `footers` (≥5, semua `html`), `sections` (semua varian `html`,
   ID namespaced), dan `data` (seed + copywriting niche).
   DILARANG memakai `registrySections()` dari `compose.ts` (dihapus, §18.7).
2. **Isi `theme` + `headers` + `footers` + `sections` + `data`** sesuai kontrak §2
   (8 section inti di seed, `navItems` + `ctaText`, footer `{year}`, `seo.title`)
   + kontrak unik §18 (html wajib, token adaptif, kreativitas minimal).
3. **Registrasi tunggal**: tambahkan ke `BUILT_IN_CATALOG` di
   `templates/catalog.ts`. `BUILTIN_TEMPLATES` (`template-store.ts`) adalah
   alias otomatis — tidak perlu edit file kedua.
4. **Thumbnail**: pakai `mockup` dengan prefix yang sudah dikenal
   `renderMockup()` (`lib/builder/mockup-preview.tsx`), atau tambah
   case baru di `TemplatePreview` untuk thumbnail galeri.
5. **Jalankan `bun run test`** — guard kontrak: `templates/catalog.test.ts` +
   guard unik §18.6 + `section-contrast.test.ts` adalah penjaga kontrak.
6. **Uji manual** di `/preview/<id-template>` (contoh: `/preview/food`) pada
   tiga viewport (375/768/1024) × tiga skema warna × tiga font (§18.7).

> Untuk tipe section **baru**, cukup deklarasikan di file template itu sendiri
> (tipe + varian `html`, ID namespaced, §18.3). Arus lama — tambah ke union
> `SectionType` (`types.ts`) + definisi di `sections/registry.ts` + branch
> renderer di `components/builder/section-renderer.tsx` + mockup — **tidak
> berlaku lagi** (registry + branch generik dihapus, §18.7).

### Cara Memvalidasi Template

Tidak ada fungsi `validateTemplate()` di codebase — versi lama dokumen ini
menyebutnya, padahal tidak pernah ada. Yang nyata:

```bash
bun run test     # templates/catalog.test.ts + guard unik §18.6 + section-contrast
bun run typecheck
bun run lint
```

Tambahan untuk draf JSON (kerangka dari `scripts/create-template.ts`):

```bash
bun scripts/create-template.ts --validate template.json   # validateTemplateV3
```

Test yang berlaku:

| File | Yang dijaga |
|---|---|
| `templates/catalog.test.ts` | Kontrak template katalog (8 section inti, seed resolve tanpa fallback, `{year}`, tier, palet, font) |
| guard unik §18.6 | `html` wajib, ID namespaced, nol hardcoded, nol impor generik, fingerprint unik |
| `section-contrast.test.ts` | Skema warna tidak merusak kontras |
| `template-schema-custom-type.test.ts` | Aturan tipe section kustom (`html` wajib, `activeSections`) |
| `template-coverage.test.ts` | Cakupan aset (`findAssetCoverageIssues`: aset tak dirujuk, field gambar kosong, varian mati) |

Untuk pengecekan cepat di console:

```typescript
import { BUILT_IN_CATALOG } from '@/lib/builder/templates/catalog';
import { resolvePalette } from '@/lib/builder/design-styles';
import { validateColorScheme } from '@/lib/builder/color-schemes';

for (const t of BUILT_IN_CATALOG) {
  const effective = resolvePalette(
    { ...t.theme, id: t.id, name: t.name, description: t.description, effects: t.theme.effects ?? {}, thumbnailUrl: '' },
    (t.data.paletteOverride ?? {}) as Record<string, string>,
  );
  console.log(t.id, validateColorScheme({ id: t.id, name: t.name, category: 'light', palette: effective }));
}
```

### Common Errors dan Solusi

| Error | Solusi |
|-------|--------|
| `section inti "<type>" wajib ada` | Tambahkan tipe itu ke `data.sections` |
| `varian <v> tak ada di template` | Samakan `variant` dengan id di `template.sections` |
| `resolve jadi <v2> (fallback)` | Id varian salah ketik — akan ditulis ulang diam-diam |
| `kontras gagal` | Gelapkan `textMuted`, atau sesuaikan `paletteOverride` (tidak ada lagi `designStyleId`) |
| `Layout not found` | `layout` lama tak dikenal — template baru memakai ID unik + `html` sendiri (§18); jangan tambah layout generik |
| `ID generik ditolak` | ID varian telanjang (`hero-full`, …) — ganti namespaced `<template>-<nama>` (§18.3) |
| `html wajib` | Varian/header/footer tanpa `html` — isi `html` adaptif bertoken (§18.4) |
| `hardcoded ditolak` | hex/`rgb()`/`font-family` literal di `html` — ganti token `var(--color-*)` / `var(--font-*)` (§18.4) |
| `Mockup not found` | Pakai id dengan prefix yang terdaftar di `renderMockup()`, atau tambah case baru |
| `tidak konsisten antar varian header` | Samakan `maxNavDepth` di seluruh varian header |
| `Template tidak ditemukan` (saat apply) | Website belum punya template dasar — pilih template bawaan dulu |
| `Field "contentWidth" tidak ada` | Tambahkan field `contentWidth` ke `configFields` varian itu |

### Template Upload Flow (arsip — tidak berlaku)

Alur import/export via `/api/templates/library/*` sudah dihapus (lihat §9).
Satu-satunya alur yang berlaku: edit kode template → daftarkan di
`BUILT_IN_CATALOG` → validasi via `vitest` → preview di `/preview/<id>`.
```

---

## 13. Template Preview System

### 13.1 Cara Kerja Preview

Template preview memungkinkan user melihat tampilan template sebelum menerapkannya ke website.

**Alur Preview:**
1. User klik tombol **"Pratinjau"** di template gallery
2. Handler `onPreview` membuka route `/preview/[templateId]` di **new tab**
3. Halaman preview load template dari `BUILT_IN_CATALOG` (via `getTemplate()` di
   `template-store.ts` — alias katalog yang sama)
4. Template di-render menggunakan `PublicWebsiteV3` component
5. User melihat preview full-page dengan semua sections

**Komponen yang Terlibat:**

| Komponen | Lokasi | Fungsi |
|----------|--------|--------|
| `TemplateGallery` | `src/components/builder/template-gallery.tsx` | Menampilkan tombol "Pratinjau" |
| `PreviewPage` | `app/preview/[templateId]/page.tsx` | Halaman preview full-page |
| `PublicWebsiteV3` | `src/components/website/renderer-v3.tsx` | Renderer untuk preview |
| `TemplatePreview` | `src/lib/builder/mockup-preview.tsx` | Thumbnail statis untuk gallery cards |

### 13.2 Route Preview

| Route | Method | Deskripsi |
|-------|--------|-----------|
| `/preview/[templateId]` | GET | Menampilkan preview template di new tab |

**Parameter:**
- `templateId` — ID template di `BUILT_IN_CATALOG` (contoh: `food`)

**Contoh URL:**
- `/preview/food`

### 13.3 Persyaratan Preview untuk Template

Agar template mendukung preview dengan baik, pastikan:

| Persyaratan | Keterangan | Wajib |
|-------------|------------|-------|
| Minimal 1 header variant | Header akan di-render di bagian atas | Ya |
| Minimal 1 footer variant | Footer akan di-render di bagian bawah | Ya |
| Minimal 1 section type | Section akan di-render di tengah | Ya |
| Setiap variant punya mockup | Mockup harus terdaftar di `mockup-preview.tsx` | Ya |
| defaultConfig lengkap | Semua configFields harus punya defaultValue | Ya |
| Layout match dengan renderer | `layout` identifier harus dikenali section-renderer | Ya |

### 13.4 Menambah Preview untuk Template Baru

#### Opsi 1: Gunakan Mockup Existing (Recommended)

Gunakan mockup yang sudah tersedia di `mockup-preview.tsx`:

```typescript
// Di template definition
variants: [
  {
    id: 'hero-full',
    name: 'Hero Full Width',
    layout: 'hero-full',
    mockup: 'hero-full',  // Gunakan mockup existing
    // ...
  },
]
```

**Cara kerja `renderMockup()` (`mockup-preview.tsx`)** — ia mencocokkan
**prefix**, bukan nama persis:

```typescript
if (mockup.startsWith('hero-')) return <HeroMockup variant={mockup} />;
// … dan seterusnya untuk: features- product- testimonials- faq- cta-
// contact- about- gallery- video- team- pricing- newsletter-
// divider- marquee- menu- steps- location- header- footer-
```

Artinya: **varian baru dengan prefix yang sudah terdaftar otomatis dapat
mockup**, tanpa tambah kode. Yang salah prefix jatuh ke `DefaultMockup`.

> **SUPERSEDED → §18.** Tabel prefix generik di bawah **arsip migrasi saja**.
> Template baru memakai ID namespaced (`<template>-<nama>`) + `html` wajib;
> prefix generik (`hero-`, `features-`, …) tidak boleh dipakai untuk varian baru.

| Prefix | Id yang dipakai |
|---|---|
| `hero-` | `hero-full`, `hero-split`, `hero-card`, `hero-video-bg`, `hero-carousel` (wajib, §17.5) |
| `features-` | `features-3col`, `features-list`, `features-stacked`, `features-masonry` |
| `product-` | `product-2col`, `product-3col`, `product-4col`, `product-carousel` |
| `pricing-` | `pricing-2tier`, `pricing-3tier` |
| `testimonials-` | `testimonials-grid`, `testimonials-carousel`, `testimonials-single` |
| `gallery-` | `gallery-grid`, `gallery-masonry`, `gallery-carousel` |
| `contact-` | `contact-form`, `contact-form-map`, `contact-split` |
| `about-` | `about-left`, `about-right`, `about-centered` |
| `faq-` | `faq-accordion`, `faq-list`, `faq-grid` |
| `cta-` | `cta-banner`, `cta-card`, `cta-split` |
| `video-` | `video-full`, `video-centered` |
| `team-` | `team-grid`, `team-list` |
| `menu-` | `menu-tabs`, `menu-list` |
| `newsletter-` | `newsletter-inline`, `newsletter-card` |
| `divider-` | `divider-line`, `divider-spacer` |
| `marquee-` | `marquee-band` |
| `steps-` | `steps-3col` |
| `location-` | `location-hours` |
| `header-` | `header-standard`, `header-floating`, `header-hero-overlay`, `header-split`, `header-with-topbar`, `header-glass`, `header-minimal` |
| `footer-` | `footer-simple`, `footer-columns`, `footer-centered`, `footer-minimal` |

> Id yang lebih dulu tertulis di versi dokumen ini — `video-default`,
> `marquee-default`, `steps-default`, `location-default`,
> `menu-classic` — **tidak pernah ada**. Gunakan id pada tabel.

#### Opsi 2: Buat Mockup Custom

Tambahkan mockup baru di `src/lib/builder/mockup-preview.tsx`:

```typescript
// 1. Tambahkan di renderMockup function
if (mockup.startsWith('custom-')) return <CustomMockup variant={mockup} />;

// 2. Buat component mockup
function CustomMockup({ variant }: { variant: string }) {
  return (
    <div className="w-full h-full bg-gradient-to-br from-[#8B5A2B] to-[#D4A574] p-3 flex flex-col justify-center items-center gap-1.5">
      <div className="h-2.5 w-3/4 rounded-full bg-white/30" />
      <div className="h-2.5 w-1/2 rounded-full bg-white/20" />
      <div className="h-4 w-16 rounded-full bg-white mt-1" />
    </div>
  );
}
```

#### Opsi 3: Tambahkan TemplatePreview Case

Untuk thumbnail di template gallery, tambahkan case di `TemplatePreview`:

```typescript
export function TemplatePreview({ templateId }: { templateId: string }) {
  switch (templateId) {
    case 'kedai-kopi':
      return <KedaiKopiPreview />;
    // ... existing cases
    default:
      return <DefaultMockup />;
  }
}
```

### 13.5 Preview Handler di Parent Components

Handler `onPreview` di parent components membuka preview di new tab:

```typescript
// builder-sidebar.tsx dan templates-tab.tsx
onPreview={(template: any) => {
  if (!template?.id) return;
  window.open(`/preview/${template.id}`, '_blank');
}}
```

**Catatan:** Route `/preview/[templateId]` sudah tersedia dan berfungsi. Tidak perlu menambahkan route baru.

### 13.6 Testing Preview

Untuk memastikan preview bekerja:

1. Jalankan `npm run dev`
2. Buka builder atau template gallery
3. Klik tombol **"Pratinjau"** pada template manapun
4. Verifikasi halaman preview terbuka di new tab
5. Pastikan semua sections render dengan benar
6. Test di berbagai ukuran layar (desktop, tablet, mobile)

---

## Appendix: Quick Reference

### File Locations

| File | Purpose |
|------|---------|
| `src/lib/builder/template-types.ts` | Schema definitions |
| `src/lib/builder/template-schema.ts` | Kontrak validasi v3 (`validateTemplateV3`) |
| `src/lib/builder/template-store.ts` | State management (zustand) |
| `src/lib/builder/templates/catalog.ts` | `BUILT_IN_CATALOG` + tier gating |
| `src/lib/builder/templates/food.ts` | Template kuliner (dibangun ulang mengikuti §18) |
| `src/lib/builder/templates/compose.ts` | DIHAPUS bertahap (§18.7) — `registrySections()` registry → template |
| `src/lib/builder/chrome.ts` | Utilitas chrome (konstanta generik `HEADER_VARIANTS` / `FOOTER_VARIANTS` DIHAPUS bertahap, §18.7) |
| `src/lib/builder/sections/registry.ts` | DIHAPUS bertahap (§18.7) — katalog section generik |
| `src/lib/builder/config-form.tsx` | Dynamic config form |
| `src/lib/builder/mockup-preview.tsx` | Mockup visual + `TemplatePreview` |
| `src/lib/builder/behaviour-script.ts` | Sanitasi script & CSS |
| `src/lib/builder/design-styles.ts` | Helper palet/kontras (katalog dihapus 046) |
| `src/lib/builder/color-schemes.ts` | `validateColorScheme()` |
| `src/components/builder/section-renderer.tsx` | Section renderer |
| `src/components/builder/variant-html-renderer.tsx` | Renderer `html` kustom |
| `src/components/builder/behaviour-runtime.tsx` | Runner animations/behaviours/customCss |
| `src/components/builder/section-picker.tsx` | Section picker UI |
| `src/components/builder/section-config.tsx` | Section config UI |
| `src/components/builder/builder-canvas.tsx` | Builder canvas |
| `src/components/builder/template-gallery.tsx` | Template picker + Pratinjau |
| `src/components/website/renderer-v3.tsx` | Public renderer |
| `app/preview/[templateId]/page.tsx` | Halaman preview template |

### API Endpoints (terkait template)

> Endpoint library (`/api/templates/library/*` — import/export/delete)
> sudah dihapus (migrasi 040). Yang berlaku:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/templates` | GET | List template katalog (+`locked` per tier) |
| `/preview/[templateId]` | GET | Preview full-page template (bukan API, halaman) |

### Theme Color References

| Reference | Description |
|-----------|-------------|
| `theme:primary` | Warna primer |
| `theme:secondary` | Warna sekunder |
| `theme:accent` | Warna aksen |
| `theme:background` | Warna background |
| `theme:surface` | Warna permukaan |

### Background Types

| Type | Description |
|------|-------------|
| `transparent` | Mengikuti background template |
| `color` | Warna solid |
| `image` | Gambar background |
| `gradient` | Gradasi warna |

### Config Field Types (11 — lihat `ConfigFieldType` di `template-types.ts`)

| Type | Description | UI Component |
|------|-------------|--------------|
| `text` | Single-line text | Input |
| `textarea` | Multi-line text | Textarea |
| `number` | Numeric input | Input type=number |
| `select` | Dropdown selection | Select |
| `image` | Image URL with preview | Input + preview |
| `list` | Repeater with nested fields | Repeater (add/remove/reorder) |
| `color` | Color picker | Color input + hex input |
| `background` | Background type selector | Select + conditional fields |
| `gallery` | Image list | Image grid with add/remove |
| `switch` | Toggle on/off | Switch |
| `html` | Rich HTML content | HTML editor (disanitasi) |

---

## 14. Single Page Navigation

### 14.1 Anchor Links
- Nav items harus menggunakan anchor links untuk single page navigation
- Format: `#section-id` (mis. `#tarif`, `#layanan`, `#kontak`)
- Setiap section harus punya `anchorId` yang match dengan nav URL

### 14.2 Smooth Scroll
- CSS `scroll-behavior: smooth` harus di-set di html element
- `scroll-padding-top` harus di-set untuk offset fixed header (76px)
- Smooth scroll harus bekerja di builder canvas dan live site

### 14.3 Section IDs
- Setiap section harus render `id` attribute sesuai `anchorId`
- `anchorId` harus unique per halaman
- Default `anchorId` harus di-set di template sections
- Sections tanpa `anchorId` (divider, marquee) tidak perlu ID

### 14.4 Mobile Menu
- Mobile menu harus tertutup setelah nav item di-klik
- Mobile menu harus scroll ke section setelah tertutup
- Sub-menu harus tetap visible setelah parent item di-klik
- Gunakan `scrollIntoView({ behavior: 'smooth' })` untuk animasi

### 14.5 Builder Canvas
- Nav items di builder canvas harus clickable (bukan span)
- Header dan footer nav items harus menggunakan `<a>` tags
- Nav items harus bekerja sama seperti di live site

---

## 15. Mobile-First Requirements (Spek v3.1)

> Bagian ini **normatif untuk template**: setiap template (baru maupun
> bawaan) wajib memenuhi §15.1–§15.9. Status implementasi renderer ditandai
> ✅ (jalan) / 🔜 (kontrak, wiring menyusul).

### 15.1 Wajib Mobile-First (bukan sekadar responsive)
- Template dirancang **dari 375px ke atas**: satu kolom sebagai default,
  multi-kolom hanya di breakpoint naik. Menulis gaya desktop lalu menimpanya
  dengan `max-width` = pola terbalik, dilarang.
- Breakpoint acuan: HP < 640px · Tablet 640–1023px · Desktop ≥ 1024px.
- Semua template **wajib** lolos uji tiga viewport: 375 / 768 / 1024.
- Touch target minimal 44x44px.
- Font size minimal 14px untuk body text; headline hero proporsional di HP
  (turunkan via `@md:` atau `clamp()`, line-height paragraf ≥ 1.5).
- Spacing antar elemen cukup untuk interaksi sentuh; tidak boleh ada scroll
  horizontal di 375px.

### 15.2 Opsi Tampilkan / Sembunyikan per Perangkat
- Setiap section bisa di-hide per perangkat via `responsive.hideOnMobile` /
  `hideOnTablet` / `hideOnDesktop` (lihat kontrak §15.7).
- Tombol CTA di header bisa di-hide di mobile via `mobileMenu.showCta`.
- Contoh: CTA header yang ramai di desktop boleh disembunyikan di HP agar header ringkas.
- Jangan menyembunyikan konten inti (hero, kontak, CTA) di perangkat
  mana pun — hide hanya untuk hiasan atau varian ringkas pengganti.

### 15.3 Menu Mobile: Dua Opsi Drawer (Bukan Dropdown)
Menu mobile **harus** salah satu dari dua opsi berikut — **dilarang memakai dropdown**:
- **Drawer dari atas (`drawer-top`)**: menu meluncur dari atas layar
- **Drawer dari sidebar (`drawer-sidebar`)**: menu meluncur dari kiri/kanan layar
- Keduanya memakai animasi sederhana slide-down / slide-in + overlay gelap di background
- Konfigurasi di `mobileMenu.style` (`HeaderVariant` / `SectionTypeDefinition`)

### 15.4 Dukungan Sub-Menu
- Mobile menu wajib mendukung sub-menu (1 level)
- Gunakan pola expand/collapse (accordion) dengan ikon indikator
- Sub-menu di-indentasi agar hierarki jelas

### 15.5 Color Schemes & Kontras
- **Setiap template menyediakan color schemes sendiri (max 20: 10 light + 10 dark)** didefinisikan di `template.colorSchemes`
- Semua scheme WAJIB lolos kontras WCAG AA (≥ 4.5:1) — dicek otomatis via `validateColorScheme()` dengan kontrak template (`template.contrast`) dan palet dasar (`template.theme.palette`)
- Warna teks di atas background berwarna wajib memakai `getOnColor()` agar tidak "tenggelam"
- Header transparan di atas hero wajib memakai text-shadow agar teks tetap terbaca
- Builtin font dari `FONT_CATEGORIES` dipertahankan; skema boleh override `headingFont`/`bodyFont`/`accentFont` opsional
- **Builtin global `COLOR_SCHEMES` dihapus** — gunakan `template.colorSchemes` di Style Selector

### 15.6 Font Categories
- 5 kategori font, semuanya dari Google Fonts (`src/lib/builder/font-categories.ts`):
  Modern, Tech, Luxury / Elegant, Creative, Handwritten

### 15.7 Kontrak `responsive` Flags

```typescript
// Per section instance (kanvas, seed ZIP, live site):
responsive: {
  hideOnMobile?: boolean;    // ✅ schema+store+migration | 🔜 penerapan renderer
  hideOnTablet?: boolean;    // ✅ schema+store+migration | 🔜 penerapan renderer
  hideOnDesktop?: boolean;   // ✅ schema+store+migration | 🔜 penerapan renderer
}
```

Aturan kontrak (berlaku walau wiring renderer menyusul):

1. Flag adalah **data template**, bukan gaya inline: template ZIP boleh
   mem-preset-nya lewat seed `data.sections[].responsive`; sidebar menulisnya
   lewat kontrol "Tampil di" (HP/Tablet/Desktop).
2. Semantik hide bersifat **eksklusif per breakpoint** di atas — section dengan
   `hideOnMobile: true` tidak dirender di < 640px di kanvas, preview, maupun
   live site (satu helper `isSectionHiddenAt()`, satu perilaku di semua
   permukaan render termasuk `VariantHtmlRenderer`).
3. Seed tanpa `responsive` = tampil di semua perangkat (default terbuka).
4. Test penjaga: unit `isSectionHiddenAt` + passthrough seed
   (`resolveTemplateSections` / `seedTemplateSections` meneruskan `responsive`
   tanpa mengubahnya).

### 15.8 Aturan Responsif untuk `variant.html`

Karena `variant.html` melewati branch renderer bawaan, tanggung jawab
responsif ada pada penulis template — bukan renderer:

| Aturan | Status |
|---|---|
| Dilarang `width` / `min-width` fixed di atas 480px | Wajib (cek manual saat review) |
| Gambar `max-width:100%;height:auto` | Wajib |
| Grid 1 kolom default → multi-kolom via `@md:` | Wajib |
| Tanpa scroll horizontal di 375px | Wajib (uji manual) |
| Target sentuh ≥ 44px, body ≥ 14px | Wajib |
| `position:fixed` hanya header sticky / progress bar | Wajib |

> Catatan: `validateTemplateV3()` / `validateHtmlSafety()` hanya memperingatkan
> pola `position:fixed`, `z-index` raksasa, `overflow:visible`, dan tag
> `<style>` — pola non-responsif (`width` fixed, grid desktop-first) **tidak**
> terdeteksi otomatis dan wajib diperiksa manual. Versi lama dokumen ini
> mengklaim ada warning import untuk pola tersebut; itu tidak benar.

### 15.9 Prosedur Uji Tiga Viewport (Developer)

1. Buka preview `/preview/[templateId]` (atau kanvas builder).
2. Set viewport **375px** (HP): pastikan tanpa scroll horizontal, hero terbaca
   tanpa zoom, CTA terjangkau, nav jadi hamburger, form 1 kolom.
3. Set viewport **768px** (tablet): pastikan 2 kolom tidak pecah, gambar tidak
   meluap, drawer/tablet nav benar.
4. Set viewport **1024px** (desktop): pastikan konten ter-box (`contentWidth`),
   multi-kolom tampil penuh.
5. Ulangi untuk varian palet terang/gelap bila perubahan menyentuh `customCss`
   (efek CSS bisa berbeda perilaku per latar terang/gelap).
6. Catat temuan sebagai checklist di PR (format: viewport → masalah → perbaikannya).

---

## 16. Creative Layer — `variant.html` (utama), `customCss`/hook/`theme.effects` (opsional)

> **Reframing §18.** Cara utama membuat desain unik adalah **`variant.html`
> per varian** (dispatcher murni, §18.3) — bukan menambal branch generik.
> `customCss`, hook `data-tpl-*`, dan `theme.effects` di bawah adalah lever
> **opsional** untuk efek lanjutan (shadow, filter, clip-path, animasi) di atas
> `html` milik template. Keduanya (html maupun css) **wajib bertoken**
> (`var(--color-*)` / `var(--font-*)`, §18.4).

### 16.1 Kenapa lever ini ada

> **Catatan §18.** Fakta ukur di bawah berasal dari era branch generik
> (dihapus). Setelah penghapusan, `variant.html` adalah cara utama desain unik;
> `customCss` tetap berguna untuk efek lanjutan (shadow, filter, clip-path,
> animasi) yang tidak praktis ditulis inline.

Fakta yang terukur di `section-renderer.tsx` (era generik, arsip):

```
grep -cE "boxShadow|border:" section-renderer.tsx   →  0
grep    "effects."        section-renderer.tsx     →  (kosong, dulu)
```

Artinya renderer **tidak pernah** menghasilkan border, shadow, `backdrop-filter`,
`clip-path`, `mask-image`, atau `filter` pada kartu section. Glassmorphism,
neo-brutalism, neumorphism, claymorphism, bento grid, wave divider — semuanya
mustahil lewat `theme` atau `style` per-section.

### 16.2 Hook styling

Wrapper setiap section membawa:

```html
<div id="keunggulan"
     data-tpl-type="features"
     data-tpl-variant="features-3col"
     data-tpl-fx="uppercase border"
     style="--tpl-border-width: 2px">
```

| Atribut | Isi |
|---|---|
| `data-tpl-type` | `section.type` |
| `data-tpl-variant` | `section.variant` |
| `data-tpl-fx` | Flag `theme.effects` yang aktif: `uppercase`, `border` |

**Selalu menyasar `data-tpl-*`.** Class Tailwind (`@md:grid-cols-3`, `rounded-lg`)
bisa berubah tiap build — CSS yang menyasarnya berhenti jalan tanpa error.

Struktur dalam yang dipakai `customCss`:

| Menuju | Selector |
|---|---|
| Judul section | `[data-tpl-type="X"] > div > h2` |
| Kartu ke-N | `[data-tpl-type="X"] > div > div > div:nth-child(N)` |

### 16.3 `customCss` — rantai lengkap

```
template.data.customCss (kode template, mis. food.ts)
  → apply-template.ts  (buildTemplateCustomConfig saat apply)
  → PUT …/website      (simpan ke custom_config.customCss)
  → public.ts          (baca → templateCustomCss)
  → renderer-v3.tsx    (live site via BehaviourRuntime)
  → builder-canvas.tsx (kanvas preview via BehaviourRuntime)
  → behaviour-runtime.tsx → <style>
```

Rantainya sama persis dengan `behaviours[]`.

Batas & sanitasi (`sanitizeTemplateCss()` di `behaviour-script.ts`):

| Aturan | Nilai |
|---|---|
| Ukuran maks | 200.000 karakter |
| Diblokir | `</style>`, `<style`, `@import`, `url()` non-`data:`, `expression(`, `-moz-binding`, `behavior:` |
| Diizinkan | `position: fixed`, `box-shadow`, `filter`, `backdrop-filter`, `clip-path`, animasi |

> **Keamanan.** Ini **bukan sandbox**. CSS bisa dipakai untuk UI-redressing
> (overlay palsu/phishing). Aman selama template hanya masuk lewat akun
> pemiliknya sendiri — sama seperti `behaviours[].script` yang sudah tersedia.
> Kalau nanti ada template yang dibagikan antar-user, CSS **wajib** dipindah
> ke iframe terisolasi.

### 16.4 `theme.effects` — mana yang benar-benar jalan

| Kunci | Status |
|---|---|
| `uppercaseHeadings` | ✅ — flag `uppercase` → `text-transform` pada `h1`–`h4` |
| `borderWidth` | ✅ — flag `border` + `--tpl-border-width` → border kartu |
| `glassmorphism` | ❌ **tidak diimplementasikan** |
| `gradientBackgrounds` | ❌ **tidak diimplementasikan** |

Aturan CSS-nya ada di `app/globals.css`:

```css
[data-tpl-fx~="uppercase"] :is(h1,h2,h3,h4){ text-transform:uppercase; letter-spacing:.02em }
[data-tpl-fx~="border"] div[style*="--color-surface"]{ border:var(--tpl-border-width,1px) solid var(--color-border) }
```

Selector kartu menyasar inline style `background: var(--color-surface)` yang
dipakai semua kartu — jauh lebih tahan perubahan daripada menyasar class.

> Enam template bawaan versi lama menyet keempat kunci `theme.effects`; yang
> mati tidak terlihat efeknya. Sekarang hanya 2 kunci yang punya perilaku
> (lihat tabel di atas), sisanya **jangan diset**.

### 16.5 Cookbook gaya modern

Resep siap pakai (selalu sasar `data-tpl-*`, pakai `var(--color-*)` agar
mengikuti skema warna aktif). Contoh minimal:

```css
/* Neo-Brutalism */
[data-tpl-type="features"] > div > div > div {
  border: 3px solid var(--color-text);
  border-radius: 0;
  box-shadow: 8px 8px 0 var(--color-accent);
}

/* Wave divider */
[data-tpl-type="hero"] {
  clip-path: ellipse(78% 88% at 50% 0%);
  margin-bottom: -58px;
}
```

### 16.6 Bukti bahwa lever ini bekerja

Test yang memverifikasi creative layer lewat kode nyata (bukan klaim):

- `behaviour-script.test.ts` — `renderVariantHtml` mengekspansi placeholder
  `{{key}}` / `{{{key}}` dan render `navItems` tanpa `[object Object]`.
- `behaviour-script.ts:60-85` — `sanitizeTemplateCss()` mengganti pola
  berbahaya (`</style>`, `<style`, `@import`, `url()` non-`data:`,
  `expression(`, `-moz-binding`, `behavior:`) dengan `/* BLOCKED */` dan
  memotong di 200.000 karakter; properti kreatif (`box-shadow`, `filter`,
  `backdrop-filter`, `clip-path`, animasi) dilewatkan apa adanya.
- `apply-template.test.ts` + `website-config.test.ts` — `customCss` ikut
  payload apply dan round-trip simpan → baca tanpa hilang.
- `section-renderer.tsx:203-210` — wrapper setiap section benar-benar membawa
  `data-tpl-type` / `data-tpl-variant` / `data-tpl-fx` + `--tpl-border-width`.

> Versi lama dokumen ini merujuk `bengkel-creative.test.ts` (15 test) — file
> itu tidak ada di repository. Daftar di atas adalah penggantinya yang
> terverifikasi.

---

## 17. Mobile App-like Requirements

> Bagian ini **normatif untuk template**: setiap template baru wajib memenuhi
> §17.1–§17.6. Status implementasi renderer ditandai ✅ (jalan) / 🔜 (kontrak,
> wiring menyusul — template menyediakan data/config sesuai skema, renderer
> mengikuti kemudian tanpa mengubah kontrak).

### 17.1 Wajib Mobile-First

- Template dirancang **dari 375px ke atas** (satu kolom default, multi-kolom
  hanya via breakpoint naik) — melengkapi §15.1, bukan menggantikannya.
- Tidak ada scroll horizontal di 375px; tidak ada `width`/`min-width` fixed
  di atas 480px; gambar `max-width:100%;height:auto`.
- Semua konten primer (hero, produk/menu, harga, kontak/CTA) wajib tercapai
  dalam ≤ 3 tap dari halaman pertama di HP.

### 17.2 Hamburger + Sidebar Slide di Mobile ✅

- Di layar sempit (< 640px) navigasi header **wajib** menciut menjadi tombol
  **hamburger** (ikon `Menu` ↔ `X`, target sentuh ≥ 44px, `aria-label` jelas,
  `aria-expanded` mengikuti status buka/tutup).
- Menu mobile **wajib** salah satu dari dua drawer (`mobileMenu.style`,
  dirender `mobile-menu.tsx`) — **dilarang dropdown**: `drawer-top`
  (meluncur dari atas) atau `drawer-sidebar` (meluncur dari sisi + overlay
  gelap). Pilihan drawer ditentukan template via `mobileMenu.style`.
- Sub-menu 1 tingkat memakai pola expand/collapse (accordion) dengan ikon
  indikator; menu tertutup otomatis setelah item diklik lalu scroll ke section
  (`scrollIntoView({ behavior: 'smooth' })`).
- Status: ✅ jalan (`site-header-shared.tsx` + `mobile-menu.tsx`).

### 17.3 Bottom Bar di Mobile 🔜

- Setiap template **wajib** menyediakan konfigurasi bottom bar (navigasi bawah
  ala aplikasi native) khusus mobile:

```typescript
// FullTemplateData (kontrak — wiring renderer menyusul)
bottomBar?: {
  enabled?: boolean;   // default true di < 1024px, selalu mati di ≥ 1024px
  items?: Array<{      // MAKS 5 item
    id: string;
    label: string;     // pendek, maks ~12 karakter
    icon: string;      // nama ikon (wajib — bottom bar tanpa ikon dilarang)
    url: string;       // '#anchor' section atau URL
    isExternal?: boolean;
    enabled?: boolean;
    badge?: string;    // teks badge kecil, mis. "Promo"
  }>;
}
```

- Aturan: maks 5 item; tiap item ikon + label; item aktif ditandai warna
  primer; bar `position: sticky/fixed` bawah dengan padding
  `env(safe-area-inset-bottom)`; tidak menutupi CTA/konten (tambah padding
  bawah halaman setinggi bar); disembunyikan di desktop dan saat popup
  (§17.6) sedang terbuka.
- Status: 🔜 kontrak (skema di atas dikunci; renderer + seed + sidebar
  menyusul tanpa mengubah kontrak).

### 17.4 Tampilan Mobile Menyerupai Aplikasi Native

- Pola navigasi app-like: hamburger + drawer (§17.2) dan/atau bottom bar
  (§17.3) — tidak ada menu teks horizontal yang meluap di HP.
- Detail yang membuat terasa native (wajib di `variant.html` maupun varian
  bawaan bila menyentuh area ini):
  - `min-height: 100dvh` untuk kanvas halaman (bukan `100vh` yang melompat
    saat address bar muncul/hilang).
  - Hormati notch/gesture bar: `padding-bottom: env(safe-area-inset-bottom)`
    pada bar bawah; `env(safe-area-inset-top)` bila header fixed di paling atas.
  - `-webkit-tap-highlight-color: transparent` pada elemen interaktif;
    `overscroll-behavior-y: contain` pada drawer/popup agar scroll dalam
    tidak menarik halaman belakang.
  - Input form `font-size` ≥ 16px (mencegah auto-zoom iOS); tombol/input
    setinggi ≥ 44px; tanpa interaksi yang **hanya** bisa hover.
  - Feedback sentuh instan: status `:active` terlihat pada tombol, item
    bottom bar, dan item drawer; transisi ≤ 200ms.
  - Skeleton/spinner untuk gambar agar layout tidak melompat saat gambar
    dimuat (tetapkan `width`/`height` atau rasio aspek).

### 17.5 Varian Hero Carousel (wajib ada) 🔜

> **Catatan §18.** ID wajib namespaced per template
> (e.g. `laundry-emerald:hero-carousel`, bukan `hero-carousel` telanjang) dan
> diimplementasikan sebagai `html` kustom — bukan branch renderer baru, bukan
> entri registry (keduanya dihapus).

- Setiap template **wajib** menyediakan varian hero carousel dengan id
  **`hero-carousel`** (tipe `hero`), sehingga tiap niche punya hero geser
  untuk promo/produk unggulan.
- Kontrak config (`defaultConfig` + `configFields` lengkap, bisa diedit sidebar):

```typescript
{
  slides: [  // 2–5 slide
    { image: string; headline: string; subheadline?: string;
      cta_text?: string; cta_link?: string; }  // cta_link default '#kontak'
  ],
  autoplayMs?: number;   // 0 = mati; default 5000
  showDots?: boolean;    // default true
  showArrows?: boolean;  // default false di mobile, true di desktop
}
```

- Perilaku: swipe sentuh + dots + (opsional) panah; autoplay berhenti saat
  disentuh/hover; gambar tiap slide `max-width:100%`; teks di atas foto wajib
  memakai overlay + token kontras (§8); tinggi slide proporsional di 375px
  (jangan full-viewport bila menenggelamkan konten di bawahnya).
- Jalur implementasi: varian `html` kustom + `customCss`/`behaviours[]` untuk
  autoplay — langsung jalan tanpa ubah renderer (jalur branch renderer baru
  tidak berlaku lagi, §18).
- Status: 🔜 — kontrak id (namespaced, §18.3) + config di atas dikunci agar
  template yang membuatnya duluan tetap kompatibel.

### 17.6 Popup Welcome / Promo 🔜

- Setiap template **wajib** mendukung popup selamat datang/promosi yang
  dikonfigurasi dari data template (bukan hardcoded di renderer):

```typescript
// FullTemplateData (kontrak — wiring renderer menyusul)
popup?: {
  enabled?: boolean;       // default false (opt-in per template/merchant)
  kind?: 'welcome' | 'promo';
  title?: string;
  text?: string;
  image?: string;
  ctaText?: string;
  ctaLink?: string;
  dismissText?: string;    // default "Tutup"
  delayMs?: number;        // default 1500; 0 = langsung
  showOnce?: boolean;      // default true (sekali per pengunjung via localStorage)
};
```

- Aturan perilaku (berlaku saat wiring tiba, template tidak perlu berbuat
  apa-apa selain mengisi config): muncul setelah `delayMs`; `showOnce`
  memakai `localStorage` (pengunjung yang menutup tidak diganggu lagi);
  tombol tutup ≥ 44px + tutup via klik overlay dan `Esc`; fokus masuk ke
  dialog saat terbuka dan kembali saat ditutup; scroll halaman belakang
  dikunci selama popup terbuka; tidak tampil bersamaan dengan bottom bar
  interaksi (§17.3 disembunyikan sementara); tidak pernah tampil di dalam
  kanvas builder (hanya live site + preview).
- Status: 🔜 kontrak (skema di atas dikunci; komponen dialog + trigger +
  panel merchant menyusul tanpa mengubah kontrak).

---

## 18. Template Unik Saja — Pengganti Sistem Generik

> **Normatif untuk semua template baru.** Spesifikasi penuh:
> `docs/UNIQUE_TEMPLATE_SPEC.md` (v1.0). Bagian ini adalah ringkasan
> operasionalnya di dalam Guide. Template `laundry-fresh` dihapus dan diganti
> template baru yang unik; `food.ts` dibangun ulang menyusul dengan kontrak
> yang sama.

### 18.1 Keputusan

1. Setiap template punya UI/UX **unik miliknya sendiri** — dilarang tampil
   sebagai "template lama yang hanya diganti warna + border-radius".
2. Sumber UI generik dihapus dari kode agar keunikan **dipaksa arsitektur**,
   bukan imbauan.
3. Semua template tetap **adaptif penuh** terhadap skema warna dan font bawaan:
   nol warna hardcoded, nol font hardcoded, di header + section + footer.

### 18.2 Yang dilarang (pengganti sistem generik)

| Dilarang | Pengganti |
|---|---|
| Impor `sections/registry.ts` / `templates/compose.ts` (`registrySections()`) | Deklarasikan varian sendiri di file template |
| ID telanjang generik (`hero-full`, `features-3col`, `pricing-3tier`, `testimonials-grid`, `gallery-grid`, `contact-form`, `faq-accordion`, `steps-3col`, `location-hours`, `hdr-klasik`, …) | ID namespaced `<template>-<nama-unik>` |
| Varian tanpa `html` (mengandalkan branch renderer) | Setiap varian/header/footer wajib `html` |
| Layout header/footer generik (`standard`, `floating`, `columns`, …) | `html` kustom unik per varian |
| Duplikat-tempel varian template lain + ganti warna | Karya baru: minimal 3 pembeda (bentuk/komposisi/dekorasi) |
| hex / `rgb()` / `font-family:` literal di `html`/`customCss` | Token §18.4 |

### 18.3 Kontrak varian unik

1. **Setiap varian wajib punya `html`.** Renderer hanya dispatch
   `variant.html` (`VariantHtmlRenderer`); tidak ada branch generik untuk
   jatuh kembali. Varian tanpa `html` ditolak test.
2. **ID namespaced per template.** Format `<template>-<nama-unik>`, contoh
   `laundry-emerald:hero-arch`. ID telanjang generik ditolak test.
3. **Header/footer wajib `html` kustom dan unik** (≥5 varian tiap chrome,
   mengikuti `MIN_HEADER_VARIANTS_V3`/`MIN_FOOTER_VARIANTS_V3` di
   `template-schema.ts`). UX boleh sama (navigasi, CTA, copyright), gaya
   visual harus beda.
4. **Kreativitas minimal.** Setiap varian berbeda markup-nya dari varian lain
   dalam tipe yang sama **dan** dari template lain (uji fingerprint HTML
   setelah strip warna+font+teks, di bawah ambang kemiripan).
5. **Referensi desain diterjemahkan, bukan ditempel** — lihat §18.5.

### 18.4 Kontrak adaptif (nol hardcoded)

**Warna — hanya token** (disediakan `buildThemeTokens()` di kanvas +
live site — sumber tunggal, lihat guard parity §18.6):

| Token | Untuk |
|---|---|
| `var(--color-primary/secondary/accent/background/surface/text/textMuted/border)` | Latar, teks, garis, dekorasi |
| `var(--color-on-primary)` | Teks di atas latar primary |
| Tombol di atas latar TERANG: `background: var(--color-primary)` + `color: var(--color-on-primary)` | CTA/kartu terang |
| Tombol di atas latar GELAP/primary: `background: var(--color-accent)` + `color: var(--color-primary)` | CTA/kartu gelap |

> Token `--color-button` / `--color-on-button` / `--color-on-section` /
> `--color-primary-on-section` HANYA ada di dalam `SectionRenderer` generik
> (dihapus) — **tidak tersedia** di jalur `variant.html` (kanvas + live).
> Jangan memakainya di `html` template (ditolak guard parity §18.6).

Pada `defaultStyle`/`style` per-section gunakan `theme:<token>`
(e.g. `backgroundColor: 'theme:primary'`).

**Font — hanya token:** `var(--font-heading)` headline,
`var(--font-body)` body, `var(--font-accent)` eyebrow script/aksen.
`accentFont` adalah token ketiga resmi (`DesignStyleTypography.accentFont?`,
fallback = `headingFont`; plumbing `--font-accent` di `section-renderer.tsx`,
`renderer-v3.tsx`, `builder-canvas.tsx`, loader `GoogleFonts`,
persist `public.ts` + `store.ts`). Ketiga font wajib terdaftar di
`FONT_CATEGORIES`. Ornamen memakai `currentColor` / `var(--color-*)`.

Contoh — salah vs benar:

```html
<!-- SALAH: mati saat ganti skema/font -->
<h1 style="color: #fff; font-family: 'Cormorant Garamond', serif;">Judul</h1>
<a style="background: var(--color-primary); color: #fff;">Pesan</a>

<!-- BENAR: adaptif (pasangan token sesuai konteks latar) -->
<h1 style="color: var(--color-text); font-family: var(--font-heading);">Judul</h1>
<a style="background: var(--color-primary); color: var(--color-on-primary);">Pesan</a>
<div style="font-family: var(--font-accent); color: var(--color-accent);">Eyebrow script</div>
```

### 18.5 Workflow referensi → template

Diberi gambar/foto desain web:

1. **Ekstrak palet → petakan ke 8 token** (`primary/secondary/accent/
   background/surface/text/textMuted/border`). Jangan bawa hex referensi
   mentah ke `html` — hanya token.
2. **Ekstrak tipografi → petakan ke 3 font builtin** (display →
   `headingFont`, sans → `bodyFont`, script/italic → `accentFont`, semua dari
   `FONT_CATEGORIES`).
3. **Bedah komposisi per section** (susunan, bentuk khas seperti arch/oval/
   inset `rounded-2xl`, dekorasi, hierarki tombol).
4. **Bangun `html` baru per section** dengan komposisi + dekorasi tersebut
   memakai token §18.4 (ornamen = inline SVG/div bertoken; `<style>`
   diblokir sanitizer, responsif via inline style + kelas breakpoint).
5. **Header/footer unik** — UX boleh meniru referensi, komposisi visual +
   dekorasi harus karya baru.
6. **Isi tetap niche template** (struktur boleh meniru referensi, copywriting
   + gambar milik niche — e.g. laundry: kiloan/express/antar-jemput).

### 18.6 Guard otomatis

| Guard | Menolak |
|---|---|
| `no-hardcoded-template-style` | `#[0-9a-fA-F]{3,8}`, `rgba?\(`, `hsla?\(`, `:\s*white\b`, `:\s*black\b`, `font-family:` yang nilainya bukan `var(--font-*)` di `html`/`customCss` |
| `unique-variant-id` | ID telanjang generik |
| `template-uniqueness` | Fingerprint HTML mirip antar template/varian |
| `no-generic-import` | Impor `sections/registry` / `templates/compose` |
| `variant-html-required` | Varian/header/footer tanpa `html` |
| `accentFont-registered` | `accentFont` tak ada di `FONT_CATEGORIES` |

Guard lama yang diganti: whitelist `RENDERED_VARIANTS`, guard
`isKnownHeader/FooterVariant`, "minimal 3 varian per tipe". Guard yang
dipertahankan: 8 section inti, seed resolve tanpa fallback, `{year}`, tier,
palet+font, `maxNavDepth` seragam (`catalog.test.ts`).

### 18.7 Penghapusan bertahap + migrasi data

Urutan wajib: **renderer fail-closed dulu → template baru jadi → registry
generik dihapus fisik → (dokumen ini) selesai**. Dilarang menghapus branch
generik sebelum migrasi data selesai — situs existing yang menyimpan
`hero-full`/`features-3col`/… akan blank.

1. Audit DB: `store_pages.layout` + `custom_config` yang memakai varian/chrome
   generik.
2. Skrip migrasi tiap varian generik → varian unik padanan; tanpa padanan =
   read-only + pemberitahuan.
3. Kriteria hapus fisik: nol rujukan ID generik + semua guard §18.6 hijau +
   uji 375/768/1024 × tiga skema × tiga font.

File yang dihapus saat waktunya tiba: `sections/registry.ts(+test)`,
`templates/compose.ts`, konstanta generik `chrome.ts` (kecuali
`resolveContentWidthClass`), subkomponen generik `section-renderer.tsx`,
layout generik `site-header/footer-shared.tsx`, renderer legacy
`website/renderer.tsx` (bila tak dipakai), scaffold generik
`scripts/create-template.ts`, acuan generik `template-reference-v3.json`.

### 18.8 Template Color Schemes (max 20 per template)

Setiap template **wajib** mendefinisikan `colorSchemes: ColorScheme[]` (max 20: 10 light + 10 dark) yang:

1. **Desain spesifik template** — Skema warna dirancang untuk identitas visual template tersebut (food: warm terracotta/orange; laundry: emerald/gold), bukan generik
2. **Lolos validasi kontras** — Setiap skema WAJIB lolos `validateColorScheme(scheme, template.contrast, template.theme.palette)` dengan `valid: true`
3. **Override font opsional** — Skema boleh mendefinisikan `headingFont`, `bodyFont`, `accentFont` untuk pairing font spesifik skema (harus terdaftar di `FONT_CATEGORIES`)
4. **Tidak ada fallback global** — Builtin `COLOR_SCHEMES` dihapus; Style Selector hanya menampilkan `template.colorSchemes`

**Struktur ColorScheme:**
```typescript
interface ColorScheme {
  id: string;                    // kebab-case, e.g. 'terracotta-classic'
  name: string;                  // Display name, e.g. 'Terracotta Classic'
  category: 'light' | 'dark';    // Kategori untuk grouping UI
  palette: ColorSchemePalette;   // 8 token: primary, secondary, accent, background, surface, text, textMuted, border
  headingFont?: string;          // Optional override (dari FONT_CATEGORIES)
  bodyFont?: string;             // Optional override (dari FONT_CATEGORIES)
  accentFont?: string;           // Optional override (dari FONT_CATEGORIES)
}
```

**Prosedur membuat skema template baru:**
1. Ambil palet dasar template (`theme.palette`) sebagai referensi
2. Buat 10 variasi light + 10 variasi dark yang menjaga "rasa" template
3. Setiap skema harus lolos `validateColorScheme()` dengan kontrak template
4. Uji cross-scheme: semua section HTML template harus terbaca di semua 20 skema
5. Definisikan font pairing opsional per skema untuk variasi estetika

**Contoh (Food template):**
- Light: `terracotta-classic`, `rust-warmth`, `amber-glow`, `clay-pottery`, `sunset-kitchen`, `spice-market`, `harvest-gold`, `cream-soup`, `ginger-zest`, `paprika-rich`
- Dark: `ember-hearth`, `charcoal-grill`, `midnight-feast`, `copper-pot`, `bronze-kitchen`, `obsidian-broth`, `smoked-paprika`, `cinder-oven`, `volcanic-ash`, `coal-ember`

**Contoh (Laundry Emerald template):**
- Light: `emerald-luxury`, `teal-fresh`, `sage-calm`, `mint-sterile`, `forest-premium`, `jade-clean`, `seafoam-pure`, `olive-organic`, `pine-fresh`, `eucalyptus-spa`
- Dark: `midnight-emerald`, `deep-teal`, `shadow-sage`, `noir-mint`, `obsidian-forest`, `onyx-jade`, `coal-seafoam`, `graphite-olive`, `raven-pine`, `abyss-green`

---

## 19. Kontras Warna — Token Pasangan, Bukan Warna Mentah

> **Status (2026-10-05): wajib.** Suite `contrast-contract.test.ts` menguji
> setiap varian terhadap **seluruh** skema warna di `template.colorSchemes`. Template
> yang hanya aman di paletnya sendiri akan gagal test.

### 19.1 Masalah yang diselesaikan

Template menulis `color: var(--color-accent)` di atas
`background: var(--color-primary)`. Itu aman di palet bawaan template
(emas `#C6A15B` di hijau tua = 5.15:1) tapi **hancur** begitu user memilih
skema lain. Pada skema `emerald-fresh` aksen jadi hijau muda di atas hijau
terang → **1.32:1**: eyebrow nyaris tak terlihat, tombol CTA pucat.

Guard yang hanya mengukur palet template sendiri tidak akan pernah menangkap
ini. Karena itu pengujiannya wajib **lintas skema**.

### 19.2 Aturan wajib

| Aturan | Contoh |
|---|---|
| Warna teks di atas latar berwarna **WAJIB** pakai token pasangan | `color: var(--color-accent-on-primary)` |
| Warna **latar** boleh tetap warna mentah | `background: var(--color-primary)` |
| Token yang dikoreksi otomatis hanya berlaku bila rasionya gagal | — |
| Warna dekoratif (border, shape, garis) boleh warna mentah | `border: 3px solid var(--color-accent)` |

**Larang keras:** `color: var(--color-accent)` (atau `primary`/`secondary`)
di mana pun latar-nya juga berwarna. Ini termasuk string di dalam helper
template seperti `eyebrow("Teks", "var(--color-secondary)")`.

### 19.3 Nama token

```
--color-<fg>-on-<bg>     teks <fg> di atas <bg>, dijamin ≥ 4.5:1
--color-on-<bg>          teks otomatis (putih/hitam terbaik) di atas <bg>
```

`<fg>` ∈ `primary, secondary, accent, text, textMuted`
`<bg>` ∈ `primary, secondary, accent, background, surface`

Semua kombinasi tersedia otomatis — **author tidak perlu mendeklarasikan
apapun**. Token bernilai warna asli bila sudah lolos, warna terkoreksi bila
belum. Ini yang menjaga identitas visual: emas tetap emas di latar yang
mendukungnya, dan hanya berubah di latar yang memang tak sempat.

### 19.4 Contoh benar vs salah

```html
<!-- SALAH: ganti skema warna lain akan rusak -->
<div style="background:var(--color-primary);">
  <span style="color:var(--color-accent);">Eyebrow</span>
</div>

<!-- BENAR -->
<div style="background:var(--color-primary);">
  <span style="color:var(--color-accent-on-primary);">Eyebrow</span>
</div>

<!-- BENAR: dekorasi boleh warna mentah -->
<div style="background:var(--color-primary);">
  <span style="border:1px solid var(--color-accent);">Lencana</span>
</div>
```

### 19.5 `contrast.pairs` — opsional, untuk dokumentasi

```ts
contrast: {
  pairs: [
    { fg: 'accent', bg: 'primary', role: 'body', note: 'eyebrow di band' },
    { fg: 'primary', bg: 'accent', role: 'body', note: 'tombol WhatsApp' },
  ],
}
```

- `role` menentukan ambang: `body`/`muted` = 4.5, `heading`/`non-text` = 3.0
- `minRatio` manual menang atas `role`
- `note` hanya untuk pesan diagnostik

**Wajib diisi?** Tidak. Nilainya selalu berasal dari matriks. Kontrak berguna
untuk (a) menurunkan ambang pasangan non-teks tertentu, (b) mengaudit cakupan.
Pasangan `on-*` tak perlu dideklarasikan — `getOnColor` sudah menjamin
≥ 4.5:1 untuk setiap warna sRGB.

### 19.6 Cara menguji

```ts
import { COLOR_SCHEMES, mergeSchemePalette } from '@/lib/builder/color-schemes';
import { findContrastViolations } from '@/lib/builder/contrast-contract';

for (const scheme of COLOR_SCHEMES) {
  const palette = mergeSchemePalette(scheme, template.theme.palette);
  expect(findContrastViolations(variantHtml, palette, template.contrast))
    .toEqual([]);
}
```

`findContrastViolations()` menerjemahkan token pasangan ke warna efektifnya
lalu mengukur HTML yang benar-benar dirender — bukan menebak dari palet.

