# Template Guide — Page Builder

> **Target Audience**: Developer, Designer, AI Assistant
> **Version**: 1.3
> **Last Updated**: 2026-10-02
>
> v1.3: §15 menjadi spek mobile-first penuh (selaras AI prompt v3.1 §5.8) —
> breakpoint, kontrak `responsive`, aturan `variant.html` responsif, dan
> prosedur uji tiga viewport.
> Selaras juga dengan AI prompt v3.2 §5.4 (aturan keras varian kustom).
>
> **Untuk AI eksternal yang hanya bisa menghasilkan file ZIP**, pakai
> [`AI_TEMPLATE_PROMPT.md`](./AI_TEMPLATE_PROMPT.md) — dokumen itu berdiri sendiri
> dan tidak mengharuskan pengetahuan codebase. Dokumen ini untuk developer yang
> bekerja langsung di repository.

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
12. [AI Assistant Guide](#12-ai-assistant-guide)
13. [Template Preview System](#13-template-preview-system)
14. [Single Page Navigation](#14-single-page-navigation)
15. [Mobile-First Requirements (Spek v3.1)](#15-mobile-first-requirements-spek-v31)

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
├── chrome.ts                  # Registry varian header/footer + lebar konten
├── template-store.ts          # State zustand + BUILTIN_TEMPLATES
├── section-renderer.tsx       # Section renderer   (di components/builder/)
├── config-form.tsx            # Dynamic config form
├── mockup-preview.tsx         # Mockup visual per variant
├── behaviour-runtime.tsx      # Runner animations[] & behaviours[] + customCss
├── behaviour-script.ts        # Denylist script & CSS (server + client)
├── migration.ts               # Normalisasi section & identitas anchor
├── templates/
│   ├── pangkas-rapi.ts        # Blueprint template (sumber semua varian)
│   ├── bengkel.ts             # Contoh turunan terbaru
│   └── catalog.ts             # BUILT_IN_CATALOG
├── sections/registry.ts       # Registry section LAMA (lihat catatan di bawah)
└── design-styles.ts           # Design style definitions
```

> **Catatan penting soal `sections/registry.ts`.** Registry ini **legacy** dan
> daftar variannya **tidak sama** dengan katalog varian di `template.sections`.
> Yang dipakai renderer, kanvas, sidebar, dan test kontrak adalah
> `template.sections`. Jangan memvalidasi seed section terhadap registry lama.

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

`Template` saja **tidak cukup**. Tanpa `data`, enam test kontrak gagal. Isi
`FullTemplateData` minimum:

```typescript
interface FullTemplateData {
  designStyleId?: string;        // WAJIB — id di DESIGN_STYLES, lolos kontras
  paletteOverride?: Partial<DesignStylePalette>;
  sections?: Array<{             // Seed section
    type: SectionType;
    variant: string;             // WAJIB ada di template.sections → tipe tsb
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

### Kontrak test (sumber kebenaran)

`templates/catalog.test.ts` adalah penentu — bukan daftar signup di dokumen ini.
Template baru **wajib** memenuhi:

1. `data.designStyleId` terdaftar di `DESIGN_STYLES` **dan** lolos
   `validateStyleContrast()`.
2. Setiap `data.sections[].type` ada di `template.sections`.
3. Setiap `data.sections[].variant` ada di varian tipe tersebut **dan**
   `builderSectionToInstance()` resolve ke varian yang sama (tanpa fallback diam-diam).
4. **Sembilan section inti ada**: `hero`, `features`, `pricing`, `booking`,
   `testimonials`, `gallery`, `location`, `faq`, `contact`.
5. `data.header.navItems` non-kosong; `data.header.ctaText` terisi.
6. `data.seo.title` terisi; `data.footer.text` memuat `{year}`.
7. Config `booking`: `title` string, `services` array non-kosong (tiap item punya
   `name`), `success_message` string.
8. `tiers` hanya berisi tier yang dikenal **dan** terbuka untuk keempat tier.
9. `data.header.variant` terdaftar di `HEADER_VARIANTS`;
   `data.footer.style` di `FOOTER_VARIANTS`.
10. Palet hasil override + design style-nya lolos kontras.

### Registrasi GANDA (lupa salah satu = template tidak jalan)

```typescript
// 1) src/lib/builder/templates/catalog.ts  → dipakai sidebar, customize,
//    migration, renderer publik, page-builder, dan API website
export const BUILT_IN_CATALOG: CatalogTemplate[] = [
  PANGKAS_RAPI_TEMPLATE as CatalogTemplate,
  BENGKEL_TEMPLATE as CatalogTemplate,     // ← tambahkan di sini
  /* … */
];

// 2) src/lib/builder/template-store.ts  → dipakai template-gallery.tsx
//    dan route /preview/[templateId]
export const BUILTIN_TEMPLATES: Template[] = [
  PANGKAS_RAPI_TEMPLATE,
  BENGKEL_TEMPLATE,                        // ← dan di sini
  /* … */
];
```

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
  headingFont: string;   // Font untuk heading (Google Fonts)
  bodyFont: string;      // Font untuk body text
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
  id: string;                    // Unique identifier (kebab-case)
  name: string;                  // Display name
  description: string;           // Short description
  layout: string;                // WAJIB salah satu dari 7 layout di bawah
  configFields: ConfigField[];   // Form fields for header config
  defaultConfig: Record<string, unknown>;
  mockup: string;                // Mockup visual identifier
  mobileMenu?: MobileMenuConfig;
  /**
   * Kedalaman menu: 1 (default, datar) atau 2 (boleh dropdown 1 tingkat).
   * WAJIB konsisten di seluruh varian header satu template — kalau satu varian
   * 1 dan tiga varian lain 2, form sidebar berubah-ubah saat user ganti gaya.
   * Dijaga `template.test.ts`.
   */
  maxNavDepth?: 1 | 2;
}
```

### Supported Layouts — TEPAT 7

Semuanya diimplementasikan `site-header-shared.tsx` dan didaftarkan di
`HEADER_VARIANTS` (`chrome.ts`):

| Layout | Id varian | Description |
|--------|-----------|-------------|
| `standard` | `header-klasik` | Logo kiri, menu tengah, CTA kanan |
| `floating` | `header-melayang` | Bar mengambang rounded dengan shadow |
| `hero-overlay` | `header-hero` | Transparan di atas hero, solid saat scroll |
| `split-nav` | `header-split` | Blok brand besar di kiri, menu + CTA di kanan |
| `with-topbar` | `header-topbar` | Bar kontak/promo di atas bar utama |
| `glass` | `header-kaca` | frosted, konten di belakang tetap terlihat |
| `minimal` | `header-minimal` | Logo + hamburger saja |

> Test `template.test.ts` memblokir daftar ini: panjang dan isi `HEADER_VARIANTS`
> harus persis cocok. Menambah layout = isi juga `site-header-shared.tsx` dan
> `chrome.ts`.

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
  id: string;                    // Unique identifier (kebab-case)
  name: string;                  // Display name
  description: string;           // Short description
  layout: string;                // Layout identifier (must match renderer)
  configFields: ConfigField[];   // Form fields for footer config
  defaultConfig: Record<string, unknown>; // Default values
  mockup: string;                // Mockup visual identifier
}
```

### Supported Layouts — TEPAT 4

| Layout | Id varian | Description |
|--------|-----------|-------------|
| `simple` | `footer-satu-baris` | Baris tunggal: brand, menu datar, sosmed, copyright |
| `columns` | `footer-kolom-aksen` | Tiga kolom dengan aksen gradasi |
| `centered` | `footer-brand-tengah` | Inisial brand besar + ornamen, bertumpuk tengah |
| `minimal` | `footer-mini` | Super ringkas: hanya teks hak cipta |

> **Peringatan kompatibilitas.** `pangkas-rapi.ts` masih mendeklarasikan varian
> `footer-newsletter` (layout `newsletter`) dan `footer-social` (layout `social`).
> Keduanya **tidak terdaftar** di `FOOTER_VARIANTS` (`chrome.ts`) dan
> `site-footer-shared.tsx` hanya punya percabangan khusus untuk `columns` —
> sisanya jatuh ke render default yang identik dengan `simple`.
>
> Artinya: `newsletter`/`social` saat ini **dead config**. Jangan dipakai di
> template baru. Mengaktifkannya berarti menambah layout di
> `site-footer-shared.tsx` + `FOOTER_VARIANTS` + test.

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
  type: SectionType;      // BUKAN string bebas — union 19 nilai, lihat Tabel 2
  name: string;
  icon: string;
  variants: SectionVariant[];
  mobileMenu?: MobileMenuConfig;
}
```

`SectionType` adalah union tertutup berisi **19 nilai**:

```
hero · features · product_grid · pricing · booking · testimonials · gallery
location · faq · contact · about · video · team · newsletter · divider
marquee · menu_board · steps
```

Menambah tipe baru berarti menambah ke union ini **dan** ke
`PANGKAS_RAPI_TEMPLATE.sections` (blueprint) — seluruh template turunan
mewarisi lewat `.map()`.

### SectionVariant Interface

```typescript
interface SectionVariant {
  id: string;                    // Unique identifier (kebab-case)
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
| `booking` | Booking | Form booking layanan |
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

Gunakan format `theme:{key}` untuk reference warna dari theme:

| Reference | Description |
|-----------|-------------|
| `theme:primary` | Warna primer |
| `theme:secondary` | Warna sekunder |
| `theme:accent` | Warna aksen |
| `theme:background` | Warna background |
| `theme:surface` | Warna permukaan |

**Penting**: Saat user mengganti skema warna, section yang menggunakan theme reference akan otomatis mengikuti.

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
Aturan penuh untuk penulis template (AI) ada di AI prompt §5.9; ringkasnya
untuk developer:

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

- **ID**: kebab-case, unik per template (e.g., `hero-full`, `header-klasik`)
- **Name**: Title Case, user-friendly (e.g., `Full Width`, `Klasik`)
- **Layout**: snake_case, harus match dengan renderer (e.g., `hero-full`, `features-grid-3col`)

### Kontras Warna

- **WAJIB**: Gunakan `getOnColor(background)` untuk menentukan warna teks
- **WAJIB**: Background gelap → teks terang (`var(--color-on-primary)`)
- **WAJIB**: Background terang → teks gelap (`var(--color-text)`)
- **WAJIB**: Deteksi kontras berdasarkan parent langsung dari text, bukan section background

### Teks vs Latar Section (Anti Tumpang-Tindih)

- Aturan user: warna teks tidak boleh nabrak background parent-nya; bila parent transparan, telusuri parent berikutnya terus sampai latar section (`getSectionEffectiveBackground()` sudah melakukan ini)
- Semua teks yang duduk langsung di atas latar section **WAJIB** memakai token autofix: `--color-on-section` / `--color-on-section-muted`
- Aksen primer sebagai teks (mis. harga menu) **WAJIB** memakai `--color-primary-on-section` (primer dipertahankan bila lolos ≥4.5, di-autofix bila nabrak) — JANGAN `var(--color-primary)` langsung
- Input form wajib punya latar sendiri (`surface`) + warna teks (`text`) agar ketikan terbaca di section gelap

### Tombol vs Latar Section (Anti Tumpang-Tindih)

- **WAJIB**: Semua background tombol memakai token `var(--color-button)` + teks `var(--color-on-button)` — JANGAN `var(--color-primary)` langsung
- Token dihitung per section oleh `resolveButtonColors()` (`section-contrast.ts`): latar efektif section di-traverse (style → parent → halaman), bila primary tabrakan (hex sama atau kontras < 1,5) fallback berurutan `secondary → accent → surface → text`
- Latar gradient: tabrakan bila cocok salah satu stop; latar foto: primary dipertahankan (overlay gelap dipaksa)
- **WAJIB**: Setiap varian dalam satu tipe harus me-render markup berbeda (dijaga test `section-variants.test.ts`)

### Section ID

- Setiap section yang ter-render wajib punya atribut `id` dari `anchorId` (untuk link anchor `#...`)
- `anchorId` kosong diisi otomatis dari default template + dedup (`beranda`, `layanan-2`, …) — aturan sama di seed kanvas & render publik
- Section ID tampil di badge kanvas & panel Section Config (klik untuk salin)

### Theme Color References

- **WAJIB**: Gunakan `theme:primary`, `theme:secondary`, dll untuk warna yang harus mengikuti skema
- **HINDARI**: Hardcoded hex colors untuk warna yang harus mengikuti skema
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

## 9. Template Upload System (ZIP import/export)

> ⚠️ **DEPRECATED — sistem import/export ZIP dihapus.**
> Route `POST /api/templates/library/import`, `GET .../export`, dan
> `src/lib/builder/template-*.ts` sudah dihapus. Tabel `templates_library`
> di-drop (migrasi 040). Template kini **hanya kode statis** di
> `src/lib/builder/templates/` (`food.ts` pertama, `catalog.ts` pendaftar).
> Menambah template = tambah file `<niche>.ts` → daftarkan di
> `BUILT_IN_CATALOG` → `bun scripts/create-template.ts --validate` (bila
> memakai draf JSON) → `bunx vitest run src/lib/builder/templates/catalog.test.ts`.
> Isi lama di bawah dipertahankan sebagai arsip.

> Ringkas untuk AI eksternal: lihat
> [`AI_TEMPLATE_PROMPT.md`](./AI_TEMPLATE_PROMPT.md) — dokumen itu berdiri
> sendiri dan memuat seluruh kontrak ZIP.

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

### Contoh Section Type Lengkap

```typescript
{
  type: 'hero',
  name: 'Hero',
  icon: 'Layout',
  variants: [
    {
      id: 'hero-full',
      name: 'Full Width',
      description: 'Background full width dengan konten terpusat',
      layout: 'hero-full',
      mockup: 'hero-full',
      configFields: [
        { key: 'headline', label: 'Headline', type: 'text', placeholder: 'Selamat Datang' },
        { key: 'subheadline', label: 'Subheadline', type: 'textarea', placeholder: 'Deskripsi singkat' },
        { key: 'cta_text', label: 'Teks CTA', type: 'text', placeholder: 'Belanja Sekarang' },
        { key: 'cta_link', label: 'Link CTA', type: 'text', placeholder: '/produk' },
        {
          key: 'background_type',
          label: 'Tipe Background',
          type: 'select',
          options: [
            { label: 'Warna', value: 'color' },
            { label: 'Gambar', value: 'image' },
            { label: 'Gradient', value: 'gradient' },
          ],
        },
        { key: 'background_color', label: 'Warna Background', type: 'color' },
        { key: 'background_image', label: 'Background Gambar', type: 'image' },
      ],
      defaultConfig: {
        headline: 'Selamat Datang di Toko Kami',
        subheadline: 'Produk berkualitas untuk kebutuhan Anda',
        cta_text: 'Belanja Sekarang',
        cta_link: '/produk',
        background_type: 'color',
        background_color: 'theme:primary',
        background_image: '',
      },
      defaultStyle: {
        padding: { top: 48, right: 24, bottom: 48, left: 24 },
      },
    },
  ],
}
```

### Contoh Header Variant

```typescript
{
  id: 'header-klasik',
  name: 'Klasik',
  description: 'Logo kiri, menu tengah, tombol CTA kanan',
  layout: 'standard',
  mockup: 'header-standard',
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

### Contoh Footer Variant

```typescript
{
  id: 'footer-satu-baris',
  name: 'Satu Baris',
  description: 'Baris tunggal bersih: teks, menu, ikon sosial',
  layout: 'simple',
  mockup: 'footer-simple',
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
- [ ] Template punya `theme` lengkap (palette, typography, components)
- [ ] Template punya minimal 1 `header` variant
- [ ] Template punya minimal 1 `footer` variant
- [ ] Template punya minimal 1 `section` type

### Header/Footer Level

- [ ] Setiap variant punya `id` unik
- [ ] Setiap variant punya `name` dan `description`
- [ ] Setiap variant punya `layout` yang valid
- [ ] Setiap variant punya `mockup` identifier
- [ ] Setiap variant punya `configFields` lengkap
- [ ] Setiap variant punya `defaultConfig` lengkap
- [ ] Semua konten (logo, nav, CTA) konfigurable

### Section Level

- [ ] Setiap section type punya `type` unik
- [ ] Setiap section type punya minimal 2 variants
- [ ] Setiap variant punya `id` unik
- [ ] Setiap variant punya `layout` yang valid
- [ ] Setiap variant punya `mockup` identifier
- [ ] Setiap variant punya `configFields` lengkap
- [ ] Setiap variant punya `defaultConfig` lengkap
- [ ] Semua konten (gambar, background, list) konfigurable
- [ ] Tidak ada hardcoded values di config

### Style Level

- [ ] Background menggunakan theme color references (bukan hardcoded)
- [ ] Padding reasonable (tidak terlalu besar/kecil)
- [ ] Kontras warna teks vs background sudah benar
- [ ] Background image options lengkap (blur, size, overlay)

### Mobile Level (Spek v3.1 — lihat §15)

- [ ] Lolos uji tiga viewport: 375 / 768 / 1024 (tanpa scroll horizontal di HP)
- [ ] Isi section dibox (default `6xl`, rata tengah); `variant.html` membawa
  wadahnya sendiri; verifikasi tepi rata di 1440px
- [ ] Grid 1 kolom default → multi-kolom via `@md:`; tanpa width fixed > 480px
- [ ] Gambar `max-width:100%;height:auto`; target sentuh ≥ 44px; body ≥ 14px
- [ ] Nav jadi hamburger/drawer di HP; form 1 kolom full-width di HP
- [ ] Flag `responsive` (bila dipakai) hanya menyembunyikan hiasan/varian
  pengganti — bukan konten inti

### Config Fields Level

- [ ] Setiap field punya `key` (camelCase)
- [ ] Setiap field punya `label` (user-friendly)
- [ ] Setiap field punya `type` yang valid
- [ ] Select fields punya `options`
- [ ] List fields punya `itemFields`
- [ ] Setiap field punya `placeholder` (optional tapi recommended)

---

## 12. AI Assistant Guide

> **Instruksi lengkap untuk AI Assistant tersedia di [`docs/AI_TEMPLATE_PROMPT.md`](./AI_TEMPLATE_PROMPT.md)**
> File tersebut berisi system prompt, workflow, schema reference, validation checklist, dan contoh implementasi lengkap.

### Cara Membaca Template Schema

```typescript
import { BUILTIN_TEMPLATES } from '@/lib/builder/template-store';
import { getTemplate, getSectionVariant } from '@/lib/builder/template-store';

// Get template by ID
const template = getTemplate('pangkas-rapi');

// Get section variant
const variant = getSectionVariant(template, 'hero', 'hero-full');

// Access config fields
variant.configFields.forEach(field => {
  console.log(field.key, field.type, field.label);
});
```

### Cara Membuat Template Baru

1. **Buat file** di `src/lib/builder/templates/` (turunkan dari
   `PANGKAS_RAPI_TEMPLATE` — lihat `bengkel.ts` sebagai contoh terbaru).
2. **Isi `theme` + `headers` + `footers` + `sections` + `data`** sesuai kontrak §2.
3. **Registrasi ganda**: `templates/catalog.ts` **dan** `template-store.ts`.
4. **Thumbnail**: tambah case di `TemplatePreview` (`mockup-preview.tsx`).
5. **Jalankan `bun run test`** — `catalog.test.ts` + `template.test.ts` +
   `section-variants.test.ts` adalah penjaga kontrak.
6. **Uji manual** di `/preview/bengkel` (atau id template kamu).

> Untuk tipe/variant section **baru** (bukan mewarisi blueprint), perlu
> tambahan: union `SectionType`, renderer di `section-renderer.tsx`, dan mockup.

### Cara Memvalidasi Template

Tidak ada fungsi `validateTemplate()` di codebase — versi lama dokumen ini
menyebutnya, padahal tidak pernah ada. Yang nyata:

```bash
bun run test     # catalog.test.ts + template.test.ts + section-variants.test.ts
bun run typecheck
bun run lint
```

Test yang berlaku:

| File | Yang dijaga |
|---|---|
| `templates/catalog.test.ts` | Kontrak template katalog (9 section inti, kontras, booking, `{year}`, tier, chrome terdaftar) |
| `template.test.ts` | 7 varian header, `maxNavDepth` konsisten, `contentWidth` lengkap, jumlah tipe section, configFields |
| `section-variants.test.ts` | Tiap varian me-render markup berbeda (282 varian dicek) |
| `section-contrast.test.ts` | Skema warna tidak merusak kontras |

Untuk pengecekan cepat di console:

```typescript
import { BUILT_IN_CATALOG } from '@/lib/builder/templates/catalog';
import { validateStyleContrast, DESIGN_STYLES } from '@/lib/builder/design-styles';

for (const t of BUILT_IN_CATALOG) {
  const style = DESIGN_STYLES.find(s => s.id === (t.data.designStyleId ?? t.data.design_style_id))!;
  console.log(t.id, validateStyleContrast(style));
}
```

### Common Errors dan Solusi

| Error | Solusi |
|-------|--------|
| `section inti "<type>" wajib ada` | Tambahkan tipe itu ke `data.sections` |
| `varian <v> tak ada di template` | Samakan `variant` dengan id di `template.sections` |
| `resolve jadi <v2> (fallback)` | Id varian salah ketik — akan ditulis ulang diam-diam |
| `designStyleId tak terdaftar` | Pakai id dari `DESIGN_STYLES` |
| `kontras gagal` | Gelapkan `textMuted` (abu-abu 500–700) |
| `Layout not found` | `layout` harus salah satu dari 7 header / 4 footer |
| `Mockup not found` | Pakai id dengan prefix yang terdaftar, atau tambah case baru |
| `tidak konsisten antar varian header` | Samakan `maxNavDepth` di seluruh varian header |
| `Template tidak ditemukan` (saat apply) | Website belum punya template dasar — pilih template bawaan dulu |
| `Field "contentWidth" tidak ada` | Tambahkan `CONTENT_WIDTH_FIELD` ke `configFields` varian itu |

### Template Upload Flow

```typescript
// 1. Validate template data
function validateTemplateData(data: any): boolean {
  return (
    data.id &&
    data.name &&
    data.theme &&
    data.headers?.length > 0 &&
    data.footers?.length > 0 &&
    data.sections?.length > 0
  );
}

// 2. Import template
async function importTemplate(file: File) {
  const text = await file.text();
  const data = JSON.parse(text);
  
  if (!validateTemplateData(data)) {
    throw new Error('Invalid template format');
  }
  
  const res = await fetch('/api/templates/library/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: data.name,
      template_data: data.data,
    }),
  });
  
  return res.json();
}

// 3. Export template
async function exportTemplate(templateId: string) {
  const res = await fetch(`/api/templates/library/${templateId}/export`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `template-${templateId}.json`;
  a.click();
}
```

---

## 13. Template Preview System

### 13.1 Cara Kerja Preview

Template preview memungkinkan user melihat tampilan template sebelum menerapkannya ke website.

**Alur Preview:**
1. User klik tombol **"Pratinjau"** di template gallery
2. Handler `onPreview` membuka route `/preview/[templateId]` di **new tab**
3. Halaman preview load template dari `BUILTIN_TEMPLATES`
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
- `templateId` — ID template (bisa dengan prefix `builtin-` atau tanpa)

**Contoh URL:**
- `/preview/pangkas-rapi`
- `/preview/builtin-warung-makan`

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
if (mockup.startsWith('booking-')) return <BookingMockup variant={mockup} />;
// … dan seterusnya untuk: features- product- testimonials- faq- cta-
// contact- booking- about- gallery- video- team- pricing- newsletter-
// divider- marquee- menu- steps- location- header- footer-
```

Artinya: **varian baru dengan prefix yang sudah terdaftar otomatis dapat
mockup**, tanpa tambah kode. Yang salah prefix jatuh ke `DefaultMockup`.

**Mockup yang benar-benar dipakai template bawaan** (hasil aktual dari
`pangkas-rapi.ts`):

| Prefix | Id yang dipakai |
|---|---|
| `hero-` | `hero-full`, `hero-split`, `hero-card`, `hero-video-bg` |
| `features-` | `features-3col`, `features-list`, `features-stacked`, `features-masonry` |
| `product-` | `product-2col`, `product-3col`, `product-4col`, `product-carousel` |
| `pricing-` | `pricing-2tier`, `pricing-3tier` |
| `booking-` | `booking-single`, `booking-split` |
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
> `booking-form`, `marquee-default`, `steps-default`, `location-default`,
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
| `src/lib/builder/template-store.ts` | State management |
| `src/components/builder/section-renderer.tsx` | Section renderer |
| `src/lib/builder/config-form.tsx` | Dynamic config form |
| `src/lib/builder/mockup-preview.tsx` | Mockup visual |
| `src/lib/builder/templates/*.ts` | Template definitions |
| `src/lib/builder/design-styles.ts` | Design styles |
| `src/components/builder/section-picker.tsx` | Section picker UI |
| `src/components/builder/section-config.tsx` | Section config UI |
| `src/components/builder/builder-canvas.tsx` | Builder canvas |
| `src/components/website/renderer-v3.tsx` | Public renderer |

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/templates/library` | GET | List saved templates |
| `/api/templates/library/import` | POST | Import template |
| `/api/templates/library/[id]/export` | GET | Export template |
| `/api/templates/library/[id]` | DELETE | Delete template |

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

### Config Field Types

| Type | Description |
|------|-------------|
| `text` | Single-line text |
| `textarea` | Multi-line text |
| `number` | Numeric input |
| `select` | Dropdown selection |
| `image` | Image URL |

---

## 14. Single Page Navigation

### 14.1 Anchor Links
- Nav items harus menggunakan anchor links untuk single page navigation
- Format: `#section-id` (mis. `#tarif`, `#layanan`, `#booking`)
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

> Selaras dengan AI prompt v3.1 §5.8. Bagian ini **normatif untuk template**:
> setiap template (buatan AI maupun bawaan) wajib memenuhi §15.1–§15.9.
> Status implementasi renderer ditandai ✅ (jalan) / 🔜 (kontrak, wiring menyusul).

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
- Jangan menyembunyikan konten inti (hero, kontak, CTA booking) di perangkat
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
- Template memakai 20 color schemes terkurasi (`src/lib/builder/color-schemes.ts`: 10 light + 10 dark)
- Semua scheme harus lolos kontras WCAG AA (≥ 4.5:1) — dicek otomatis via `validateColorScheme()`
- Warna teks di atas background berwarna wajib memakai `getOnColor()` agar tidak "tenggelam"
- Header transparan di atas hero wajib memakai text-shadow agar teks tetap terbaca

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

### 15.8 Aturan Responsif untuk `variant.html` (Template Buatan AI)

Karena `variant.html` melewati branch renderer bawaan, tanggung jawab
responsif ada pada penulis template — bukan renderer:

| Aturan | Status |
|---|---|
| Dilarang `width` / `min-width` fixed di atas 480px | Wajib, dicek saat import (warning) |
| Gambar `max-width:100%;height:auto` | Wajib |
| Grid 1 kolom default → multi-kolom via `@md:` | Wajib |
| Tanpa scroll horizontal di 375px | Wajib (uji manual) |
| Target sentuh ≥ 44px, body ≥ 14px | Wajib |
| `position:fixed` hanya header sticky / progress bar | Wajib |

Pola non-responsif berat (`width:\s*\d{4,}px`, `min-width:\s*\d{4,}`) dilaporkan
sebagai **warning** saat import (tidak menggagalkan — agar template lama tetap
masuk), via `validateTemplateV3()`.

### 15.9 Prosedur Uji Tiga Viewport (Developer)

1. Buka preview `/preview/[templateId]` (atau kanvas builder).
2. Set viewport **375px** (HP): pastikan tanpa scroll horizontal, hero terbaca
   tanpa zoom, CTA terjangkau, nav jadi hamburger, form 1 kolom.
3. Set viewport **768px** (tablet): pastikan 2 kolom tidak pecah, gambar tidak
   meluap, drawer/tablet nav benar.
4. Set viewport **1024px** (desktop): pastikan konten ter-box (`contentWidth`),
   multi-kolom tampil penuh.
5. Ulangi untuk tiap `designType` yang disentuh perubahan (efek `customCss`
   bisa berbeda perilaku per palet terang/gelap).
6. Catat temuan sebagai checklist di PR (format: viewport → masalah → perbaikannya).

---

## 16. Creative Layer — `customCss`, hook, dan `theme.effects`

Bagian ini yang membuat desain template **tidak monoton**. Tanpa ini, seluruh
variasi visual hanya sebatas palet + font + 47 layout bawaan.

### 16.1 Kenapa lever ini ada

Fakta yang terukur di `section-renderer.tsx`:

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
template.json (data.customCss)
  → templates-tab.tsx  (kirim saat apply)
  → PUT …/website      (simpan ke custom_config.customCss)
  → public.ts          (baca → templateCustomCss)
  → renderer-v3.tsx    (live site)
  → builder-canvas.tsx (kanvas preview)
  → behaviour-runtime.tsx → <style>
```

Rantainya sama persis dengan `behaviours[]`, yang sudah end-to-end.

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

> Enam template bawaan dulu menyet keempat kunci itu; yang mati tidak terlihat
> efeknya. Sekarang hanya 2 yang punya perilaku, sisanya **jangan diset**.

### 16.5 Cookbook gaya modern

Resep lengkap per gaya (Glassmorphism, Neo-Brutalism, Minimalist, Claymorphism,
Outline/Skeletal, Bento Grid, Dark Mode/Cyberpunk, Neomorphism) ada di
[`AI_TEMPLATE_PROMPT.md` §8](./AI_TEMPLATE_PROMPT.md). Contoh minimal:

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

`src/lib/builder/bengkel-creative.test.ts` (15 test) memverifikasi lewat
`renderToStaticMarkup`:

- `data-tpl-type` / `data-tpl-variant` benar-benar muncul di wrapper
- `effects.uppercaseHeadings` + `borderWidth` → `data-tpl-fx="uppercase border"`
  dan `--tpl-border-width:2px`
- Gradasi, `url(gambar)`, `rgba(0,0,0,0.700)`, `blur(3px)` benar-benar keluar
- Selector stagger cocok dengan DOM nyata `#keunggulan .grid > div:nth-child(N)`
- `sanitizeTemplateCss()` memblokir pola berbahaya dan **tidak merusak**
  `backdrop-filter` / `clip-path` / `box-shadow` / `url(data:…)`

