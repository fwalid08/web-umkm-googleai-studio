# Template Guide — Page Builder

> **Target Audience**: Developer, Designer, AI Assistant
> **Version**: 1.1
> **Last Updated**: 2026-10-01

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
15. [Mobile Friendly Requirements](#15-mobile-friendly-requirements)

---

## 1. Gambaran Umum

Template adalah **self-contained package** yang berisi:
- **Theme** (palette warna, typography, components, effects)
- **Header Variants** (berbagai gaya header)
- **Footer Variants** (berbagai gaya footer)
- **Section Types** (berbagai jenis section dengan variants)

Template terintegrasi dengan page builder melalui:
- `template-store.ts` — state management
- `section-renderer-v3.tsx` — rendering sections
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
├── template-types.ts          # Schema definitions
├── template-store.ts          # State management
├── section-renderer-v3.tsx    # Section renderer
├── config-form.tsx            # Dynamic config form
├── mockup-preview.tsx         # Mockup visual per variant
├── migration.ts               # Config migration
├── templates/
│   ├── pangkas-rapi.ts        # Blueprint template
│   └── catalog.ts             # Template catalog
└── design-styles.ts           # Design style definitions
```

---

## 2. Template Schema

### Template Interface

```typescript
interface Template {
  id: string;                    // Unique identifier (kebab-case)
  name: string;                  // Display name (Title Case)
  description: string;           // Short description
  category: BusinessCategory;    // 'food' | 'fashion' | 'retail' | 'handicraft' | 'services'
  tiers?: Tier[];                // ['free', 'starter', 'growth', 'enterprise'] — optional
  theme: TemplateTheme;          // Theme configuration
  headers: HeaderVariant[];      // Header variants (min 1)
  footers: FooterVariant[];      // Footer variants (min 1)
  sections: SectionTypeDefinition[]; // Section types (min 1)
}
```

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
  layout: string;                // Layout identifier (must match renderer)
  configFields: ConfigField[];   // Form fields for header config
  defaultConfig: Record<string, unknown>; // Default values
  mockup: string;                // Mockup visual identifier
}
```

### Supported Layouts

| Layout | Description |
|--------|-------------|
| `standard` | Logo kiri, menu tengah, CTA kanan |
| `floating` | Bar mengambang rounded dengan blur & shadow |
| `minimal` | Logo + hamburger menu saja |
| `hero-overlay` | Transparan di atas hero, solid saat scroll |

### Default Config Keys

```typescript
{
  logoUrl: string;      // URL logo
  siteTitle: string;    // Nama toko
  tagline: string;      // Tagline
  navItems: Array<{     // Menu navigasi
    id: string;
    label: string;
    url: string;
    isExternal: boolean;
    enabled: boolean;
  }>;
  ctaText: string;      // Teks CTA button
  ctaLink: string;      // Link CTA
  showCta: boolean;     // Tampilkan CTA
  sticky: boolean;      // Header menempel
}
```

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

### Supported Layouts

| Layout | Description |
|--------|-------------|
| `simple` | Baris tunggal bersih |
| `columns` | Tiga kolom dengan aksen gradasi |
| `centered` | Inisial brand besar + ornamen |
| `minimal` | Super ringkas: hanya teks hak cipta |
| `newsletter` | Footer dengan newsletter signup |
| `social` | Footer dengan social links menonjol |

### Default Config Keys

```typescript
{
  text: string;         // Teks footer (support {year})
  navItems: Array<{     // Menu footer
    id: string;
    label: string;
    url: string;
    isExternal: boolean;
    enabled: boolean;
  }>;
  showSocial: boolean;  // Tampilkan ikon sosial
  address?: string;     // Alamat
  phone?: string;       // Telepon
  email?: string;       // Email
  newsletterTitle?: string;    // Judul newsletter
  newsletterPlaceholder?: string; // Placeholder input
  newsletterButton?: string;   // Teks tombol newsletter
}
```

---

## 5. Section Schema

### SectionTypeDefinition Interface

```typescript
interface SectionTypeDefinition {
  type: string;          // Section type identifier (kebab-case)
  name: string;          // Display name
  icon: string;          // Icon identifier
  variants: SectionVariant[]; // Variants (min 2)
}
```

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

### Responsive Visibility

```typescript
{
  responsive: {
    hideOnMobile: false,
    hideOnTablet: false,
    hideOnDesktop: false,
  }
}
```

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

## 9. Template Upload System

### Status: Fully Implemented (ZIP Import/Export + Animations + Behaviours)

### Import API

**Endpoint**: `POST /api/templates/library/import`

**Supported Formats**:
1. **JSON** — Format lama (backward compatible)
2. **ZIP** — Format baru dengan assets, animations, behaviours

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

// 3. Export template as ZIP
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

1. **Buat file template** di `src/lib/builder/templates/`
2. **Define template schema** sesuai dengan interface
3. **Register template** di `template-store.ts`
4. **Tambahkan mockup** di `mockup-preview.tsx`
5. **Tambahkan layout renderer** di `section-renderer-v3.tsx`
6. **Test template** di builder

### Cara Memvalidasi Template

```typescript
import { getTemplate } from '@/lib/builder/template-store';

function validateTemplate(templateId: string): string[] {
  const errors: string[] = [];
  const template = getTemplate(templateId);
  
  if (!template) {
    errors.push('Template not found');
    return errors;
  }
  
  // Validate headers
  if (template.headers.length === 0) {
    errors.push('Template must have at least 1 header variant');
  }
  
  // Validate footers
  if (template.footers.length === 0) {
    errors.push('Template must have at least 1 footer variant');
  }
  
  // Validate sections
  if (template.sections.length === 0) {
    errors.push('Template must have at least 1 section type');
  }
  
  // Validate each section
  template.sections.forEach(section => {
    if (section.variants.length < 2) {
      errors.push(`Section ${section.type} must have at least 2 variants`);
    }
    
    section.variants.forEach(variant => {
      if (!variant.mockup) {
        errors.push(`Variant ${variant.id} missing mockup`);
      }
      if (variant.configFields.length === 0) {
        errors.push(`Variant ${variant.id} has no config fields`);
      }
    });
  });
  
  return errors;
}
```

### Common Errors dan Solusi

| Error | Solusi |
|-------|--------|
| `Layout not found` | Pastikan `layout` identifier match dengan renderer |
| `Mockup not found` | Tambahkan mockup di `mockup-preview.tsx` |
| `Config field missing` | Lengkapi `configFields` untuk setiap variant |
| `Default config incomplete` | Pastikan `defaultConfig` cover semua `configFields` |
| `Theme color not resolving` | Gunakan format `theme:primary` bukan `#047857` |
| `Text contrast issue` | Gunakan `getOnColor(background)` untuk warna teks |

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

**Daftar mockup yang tersedia:**
- `hero-full`, `hero-split`, `hero-card`, `hero-video`
- `features-3col`, `features-list`, `features-stacked`, `features-masonry`
- `product-2col`, `product-3col`, `product-4col`, `product-carousel`
- `testimonials-single`, `testimonials-carousel`
- `faq-accordion`, `faq-list`
- `cta-banner`, `cta-card`
- `contact-form`, `contact-split`, `contact-form-map`
- `booking-split`, `booking-form`
- `about-left`, `about-right`, `about-centered`
- `gallery-grid`, `gallery-masonry`, `gallery-carousel`
- `video-default`, `video-centered`
- `team-grid`, `team-list`
- `pricing-2tier`, `pricing-3tier`
- `newsletter-inline`, `newsletter-card`
- `divider-line`, `divider-spacer`
- `marquee-default`
- `menu-classic`, `menu-tabs`
- `steps-default`
- `location-default`
- `header-standard`, `header-floating`, `header-minimal`, `header-hero-overlay`
- `footer-simple`, `footer-columns`, `footer-centered`, `footer-minimal`, `footer-newsletter`, `footer-social`

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
| `src/lib/builder/section-renderer-v3.tsx` | Section renderer |
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

## 15. Mobile Friendly Requirements

### 15.1 Wajib Mobile Friendly
- Semua template **wajib** responsive dan mobile-friendly
- Touch target minimal 44x44px
- Font size minimal 14px untuk body text
- Spacing antar elemen cukup untuk interaksi sentuh

### 15.2 Opsi Tampilkan / Sembunyikan di Mobile
- Setiap section bisa di-hide di mobile via `responsive.hideOnMobile`
- Tombol CTA di header bisa di-hide di mobile via `mobileMenu.showCta`
- Contoh: CTA header yang ramai di desktop boleh disembunyikan di HP agar header ringkas

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
