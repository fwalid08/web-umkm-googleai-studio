# AI Template Creation Prompt

> **Target**: AI Assistant (Claude, GPT, dll.)
> **Purpose**: Instruksi lengkap untuk membuat template yang kompatibel dengan page builder
> **Version**: 1.0
> **Last Updated**: 2026-10-01

---

## System Prompt untuk AI Assistant

```
Kamu adalah AI Assistant yang ahli membuat template untuk Page Builder UMKM.
Tugas kamu adalah membuat template website yang kompatibel dengan sistem page builder.

ATURAN WAJIB:
1. Template harus mengikuti schema yang telah ditentukan (lihat Schema Reference)
2. Setiap section type harus punya minimal 2 variants
3. Setiap variant harus punya mockup identifier yang terdaftar di mockup-preview.tsx
4. Warna teks harus kontras dengan background (gunakan getOnColor())
5. Gunakan theme color references (theme:primary, theme:secondary, dll.) bukan hardcoded hex
6. Config fields harus lengkap dengan defaultValue
7. Template harus mendukung preview di /preview/[templateId]

BACA DULU SEBELUM MEMBUAT:
- docs/TEMPLATE_GUIDE.md — dokumentasi lengkap schema dan best practices
- src/lib/builder/template-types.ts — TypeScript interfaces
- src/lib/builder/mockup-preview.tsx — daftar mockup yang tersedia
- src/lib/builder/design-styles.ts — design style definitions
- src/lib/builder/templates/*.ts — contoh template existing
```

---

## 1. Template Creation Workflow

### Step 1: Buat File Template

Buat file baru di `src/lib/builder/templates/` dengan nama kebab-case:

```
src/lib/builder/templates/[template-id].ts
```

**Contoh**: `src/lib/builder/templates/kedai-kopi.ts`

### Step 2: Define Template Schema

```typescript
import type { Template } from '@/lib/builder/template-types';

export const kedaiKopi: Template = {
  id: 'kedai-kopi',
  name: 'Kedai Kopi',
  description: 'Template untuk kedai kopi dan minuman',
  category: 'food',
  tiers: ['free', 'starter'],
  theme: {
    palette: {
      primary: '#8B5A2B',
      secondary: '#D4A574',
      accent: '#F5E6D3',
      background: '#FFF8F0',
      surface: '#FFFFFF',
      text: '#2C1810',
      textMuted: '#6B5B4F',
      border: '#E8D5C4',
    },
    typography: {
      headingFont: 'Playfair Display',
      bodyFont: 'Inter',
      baseSize: 16,
      scaleRatio: 1.25,
      headingWeight: 700,
      bodyWeight: 400,
    },
    components: {
      borderRadius: 12,
      buttonStyle: 'solid',
      shadowStyle: 'md',
      navStyle: 'solid',
      footerStyle: 'columns',
    },
    effects: {
      glassmorphism: false,
      gradientBackgrounds: true,
      borderWidth: 1,
      uppercaseHeadings: false,
    },
  },
  headers: [...],
  footers: [...],
  sections: [...],
};
```

### Step 3: Register Template

Daftarkan template di `src/lib/builder/template-store.ts`:

```typescript
import { kedaiKopi } from './templates/kedai-kopi';

export const BUILTIN_TEMPLATES: Template[] = [
  // ... existing templates
  kedaiKopi,
];
```

### Step 4: Tambahkan Mockup

Daftarkan mockup di `src/lib/builder/mockup-preview.tsx`:

```typescript
// Tambahkan di renderMockup function
if (mockup.startsWith('kedai-')) return <KedaiMockup variant={mockup} />;

// Atau gunakan mockup yang sudah ada jika sesuai
// Contoh: 'hero-full', 'features-3col', 'product-3col', dll.
```

### Step 5: Tambahkan Layout Renderer (jika perlu)

Jika section type baru belum ada di `section-renderer.tsx`, tambahkan case:

```typescript
case 'new-section-type':
  return <NewSectionType section={section} tokens={tokens} />;
```

**Catatan**: Kebanyakan section type sudah didukung. Cek daftar yang tersedia sebelum membuat baru.

### Step 6: Test Template

1. Jalankan `npm run dev`
2. Buka builder
3. Pilih template dari gallery
4. Verifikasi semua section render dengan benar
5. Test preview di `/preview/[templateId]`

---

## 2. Schema Reference

### Template Interface

```typescript
interface Template {
  id: string;                    // kebab-case, unique
  name: string;                  // Title Case
  description: string;           // Deskripsi singkat
  category: BusinessCategory;    // 'food' | 'fashion' | 'retail' | 'handicraft' | 'services'
  tiers?: Tier[];                // ['free', 'starter', 'growth', 'enterprise']
  theme: TemplateTheme;
  headers: HeaderVariant[];      // min 1
  footers: FooterVariant[];      // min 1
  sections: SectionTypeDefinition[]; // min 1
  animations?: AnimationConfig[];
  behaviours?: BehaviourConfig[];
  assets?: AssetMetadata[];
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

interface DesignStylePalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
}

interface DesignStyleTypography {
  headingFont: string;
  bodyFont: string;
  baseSize: number;
  scaleRatio: number;
  headingWeight: number;
  bodyWeight: number;
}

interface DesignStyleComponents {
  borderRadius: number;
  buttonStyle: 'solid' | 'outline' | 'ghost' | 'gradient';
  shadowStyle: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  navStyle: 'solid' | 'transparent' | 'glass' | 'bordered';
  footerStyle: 'simple' | 'columns' | 'centered' | 'minimal';
}

interface DesignStyleEffects {
  glassmorphism?: boolean;
  gradientBackgrounds?: boolean;
  borderWidth?: number;
  uppercaseHeadings?: boolean;
}
```

### HeaderVariant Interface

```typescript
interface HeaderVariant {
  id: string;                    // kebab-case
  name: string;                  // Title Case
  description: string;
  layout: string;                // 'standard' | 'floating' | 'minimal' | 'hero-overlay'
  configFields: ConfigField[];
  defaultConfig: Record<string, unknown>;
  mockup: string;                // harus terdaftar di mockup-preview.tsx
  mobileMenu?: MobileMenuConfig;
}
```

### FooterVariant Interface

```typescript
interface FooterVariant {
  id: string;
  name: string;
  description: string;
  layout: string;                // 'simple' | 'columns' | 'centered' | 'minimal' | 'newsletter' | 'social'
  configFields: ConfigField[];
  defaultConfig: Record<string, unknown>;
  mockup: string;
}
```

### SectionTypeDefinition Interface

```typescript
interface SectionTypeDefinition {
  type: string;                  // kebab-case
  name: string;                  // Title Case
  icon: string;                  // lucide-react icon name
  variants: SectionVariant[];    // min 2
  mobileMenu?: MobileMenuConfig;
}
```

### SectionVariant Interface

```typescript
interface SectionVariant {
  id: string;                    // kebab-case
  name: string;
  description: string;
  layout: string;                // harus match dengan renderer
  configFields: ConfigField[];
  defaultConfig: Record<string, unknown>;
  defaultStyle?: {
    padding?: { top?: number; right?: number; bottom?: number; left?: number };
    background?: 'color' | 'image' | 'gradient' | 'transparent';
    backgroundColor?: string;
    backgroundImage?: string;
    backgroundGradient?: string;
    backgroundBlur?: number;
    backgroundSize?: 'cover' | 'contain' | 'auto';
    backgroundOverlay?: 'none' | 'light' | 'dark' | 'primary';
  };
  mockup: string;                // wajib, harus terdaftar di mockup-preview.tsx
}
```

### ConfigField Interface

```typescript
interface ConfigField {
  key: string;                   // camelCase
  label: string;                 // Title Case
  type: ConfigFieldType;
  options?: ConfigFieldOption[]; // untuk type 'select'
  itemFields?: ConfigField[];    // untuk type 'list' (nested repeater)
  placeholder?: string;
  defaultValue?: unknown;
  maxItems?: number;             // untuk type 'list'
  rows?: number;                 // untuk type 'textarea'
}

type ConfigFieldType =
  | 'text' | 'textarea' | 'number' | 'select' | 'image'
  | 'list' | 'color' | 'background' | 'gallery' | 'switch';
```

---

## 3. Preview Requirements

### 3.1 Cara Kerja Preview

- Route `/preview/[templateId]` menampilkan preview full-page
- Preview render menggunakan `PublicWebsiteV3` component
- Handler `onPreview` di template gallery membuka preview di new tab

### 3.2 Persyaratan Preview

Template harus memenuhi persyaratan berikut agar preview bekerja:

| Persyaratan | Keterangan |
|-------------|------------|
| Minimal 1 header variant | Header akan di-render di bagian atas |
| Minimal 1 footer variant | Footer akan di-render di bagian bawah |
| Minimal 1 section type | Section akan di-render di tengah |
| Setiap variant punya mockup | Mockup harus terdaftar di `mockup-preview.tsx` |
| defaultConfig lengkap | Semua configFields harus punya defaultValue |

### 3.3 Menambah Preview untuk Template Baru

1. **Gunakan mockup existing** jika sesuai:
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

2. **Atau buat mockup baru** di `mockup-preview.tsx`:
   ```typescript
   if (mockup.startsWith('custom-')) return <CustomMockup variant={mockup} />;
   ```

3. **Atau gunakan DefaultMockup** sebagai fallback (tidak disarankan)

### 3.4 TemplatePreview Component

Untuk menampilkan thumbnail di template gallery, tambahkan case di `TemplatePreview`:

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

---

## 4. Validation Checklist

Sebelum template dianggap selesai, pastikan:

### Template Level
- [ ] `id` unique dan kebab-case
- [ ] `name` Title Case
- [ ] `description` jelas dan informatif
- [ ] `category` valid ('food' | 'fashion' | 'retail' | 'handicraft' | 'services')
- [ ] `theme.palette` lengkap (8 warna)
- [ ] `theme.typography` lengkap
- [ ] `theme.components` lengkap
- [ ] Minimal 1 header variant
- [ ] Minimal 1 footer variant
- [ ] Minimal 1 section type

### Header/Footer Level
- [ ] `id` unique dan kebab-case
- [ ] `layout` valid (header: standard/floating/minimal/hero-overlay, footer: simple/columns/centered/minimal/newsletter/social)
- [ ] `mockup` terdaftar di mockup-preview.tsx
- [ ] `configFields` minimal 1 field
- [ ] `defaultConfig` cover semua configFields

### Section Level
- [ ] `type` unique dan kebab-case
- [ ] Minimal 2 variants
- [ ] Setiap variant punya `mockup` yang terdaftar
- [ ] Setiap variant punya `configFields` minimal 1
- [ ] Setiap variant punya `defaultConfig` yang lengkap
- [ ] `layout` match dengan renderer

### Config Fields Level
- [ ] `key` camelCase
- [ ] `label` Title Case
- [ ] `type` valid
- [ ] `options` ada untuk type 'select'
- [ ] `itemFields` ada untuk type 'list'
- [ ] `defaultValue` ada untuk semua field

### Style Level
- [ ] Warna teks kontras dengan background
- [ ] Gunakan `theme:primary` bukan `#hex` untuk warna theme
- [ ] `background` valid ('transparent' | 'color' | 'image' | 'gradient')
- [ ] `padding` reasonable (tidak terlalu besar/kecil)

---

## 5. Common Errors & Solutions

| Error | Penyebab | Solusi |
|-------|----------|--------|
| `Layout not found` | `layout` identifier tidak match dengan renderer | Cek daftar layout yang didukung di section-renderer.tsx |
| `Mockup not found` | `mockup` tidak terdaftar di mockup-preview.tsx | Tambahkan mockup atau gunakan yang sudah ada |
| `Config field missing` | Variant tidak punya configFields | Tambahkan minimal 1 configField |
| `Default config incomplete` | defaultConfig tidak cover semua configFields | Lengkapi defaultConfig |
| `Theme color not resolving` | Menggunakan `#hex` bukan `theme:primary` | Gunakan format `theme:primary` |
| `Text contrast issue` | Warna teks tidak kontras dengan background | Gunakan `getOnColor(background)` |
| `Section not rendering` | `type` tidak dikenali oleh renderer | Cek section-renderer.tsx untuk daftar type yang didukung |
| `Preview 404` | Template tidak terdaftar di BUILTIN_TEMPLATES | Daftarkan di template-store.ts |

---

## 6. Best Practices

### Naming Conventions

| Element | Convention | Contoh |
|---------|------------|--------|
| Template ID | kebab-case | `kedai-kopi` |
| Template Name | Title Case | `Kedai Kopi` |
| Variant ID | kebab-case | `hero-full` |
| Variant Name | Title Case | `Hero Full Width` |
| Config Key | camelCase | `buttonText` |
| Config Label | Title Case | `Button Text` |
| Layout | snake_case | `hero_overlay` |

### Color & Contrast

- **WAJIB**: Gunakan `getOnColor(background)` untuk warna teks di atas colored background
- **WAJIB**: Gunakan theme color references (`theme:primary`, `theme:secondary`, dll.) bukan hardcoded hex
- **HINDARI**: Warna teks putih hardcoded di atas primary terang
- **HINDARI**: Warna teks gelap di atas background gelap

### Theme Color References

| Reference | Description |
|-----------|-------------|
| `theme:primary` | Warna primer |
| `theme:secondary` | Warna sekunder |
| `theme:accent` | Warna aksen |
| `theme:background` | Warna background |
| `theme:surface` | Warna permukaan |
| `theme:text` | Warna teks |
| `theme:textMuted` | Warna teks muted |
| `theme:border` | Warna border |

### Config Fields

- **WAJIB**: Setiap field punya `defaultValue`
- **WAJIB**: Select fields punya `options`
- **WAJIB**: List fields punya `itemFields`
- **RECOMMENDED**: Setiap field punya `placeholder`
- **HINDARI**: Config field tanpa label

### Mockup

- **WAJIB**: Setiap variant punya `mockup` identifier
- **WAJIB**: Mockup terdaftar di `mockup-preview.tsx`
- **RECOMMENDED**: Buat mockup custom untuk template baru
- **HINDARI**: Menggunakan `DefaultMockup` untuk semua variant

---

## 7. Section Type Reference

### 18 Section Types yang Didukung

| Type | Name | Icon | Layouts |
|------|------|------|---------|
| `hero` | Hero | LayoutTemplate | hero-full, hero-split, hero-card, hero-video |
| `features` | Features | Grid3x3 | features-3col, features-list, features-stacked, features-masonry |
| `product_grid` | Product Grid | ShoppingBag | product-2col, product-3col, product-4col, product-carousel |
| `testimonials` | Testimonials | MessageSquare | testimonials-single, testimonials-carousel |
| `faq` | FAQ | HelpCircle | faq-accordion, faq-list |
| `cta` | CTA | Megaphone | cta-banner, cta-card |
| `contact` | Contact | Mail | contact-form, contact-split, contact-form-map |
| `booking` | Booking | Calendar | booking-split, booking-form |
| `about` | About | Info | about-left, about-right, about-centered |
| `gallery` | Gallery | Image | gallery-grid, gallery-masonry, gallery-carousel |
| `video` | Video | Play | video-default, video-centered |
| `team` | Team | Users | team-grid, team-list |
| `pricing` | Pricing | DollarSign | pricing-2tier, pricing-3tier |
| `newsletter` | Newsletter | Mail | newsletter-inline, newsletter-card |
| `divider` | Divider | Minus | divider-line, divider-spacer |
| `marquee` | Marquee | Zap | marquee-default |
| `menu_board` | Menu Board | BookOpen | menu-classic, menu-tabs |
| `steps` | Steps | ListOrdered | steps-default |
| `location` | Location | MapPin | location-default |

### Header Layouts (4)

| Layout | Description |
|--------|-------------|
| `standard` | Header biasa dengan logo kiri, nav kanan |
| `floating` | Header mengambang dengan shadow |
| `minimal` | Header minimalis tanpa background |
| `hero-overlay` | Header overlay di atas hero section |

### Footer Layouts (6)

| Layout | Description |
|--------|-------------|
| `simple` | Footer sederhana dengan copyright |
| `columns` | Footer dengan kolom links |
| `centered` | Footer terpusat dengan logo |
| `minimal` | Footer minimalis |
| `newsletter` | Footer dengan newsletter signup |
| `social` | Footer dengan social media links |

---

## 8. Contoh Implementasi Lengkap

### Contoh: Template Kedai Kopi

```typescript
// src/lib/builder/templates/kedai-kopi.ts
import type { Template } from '@/lib/builder/template-types';

export const kedaiKopi: Template = {
  id: 'kedai-kopi',
  name: 'Kedai Kopi',
  description: 'Template untuk kedai kopi dan minuman',
  category: 'food',
  tiers: ['free', 'starter'],
  theme: {
    palette: {
      primary: '#8B5A2B',
      secondary: '#D4A574',
      accent: '#F5E6D3',
      background: '#FFF8F0',
      surface: '#FFFFFF',
      text: '#2C1810',
      textMuted: '#6B5B4F',
      border: '#E8D5C4',
    },
    typography: {
      headingFont: 'Playfair Display',
      bodyFont: 'Inter',
      baseSize: 16,
      scaleRatio: 1.25,
      headingWeight: 700,
      bodyWeight: 400,
    },
    components: {
      borderRadius: 12,
      buttonStyle: 'solid',
      shadowStyle: 'md',
      navStyle: 'solid',
      footerStyle: 'columns',
    },
    effects: {
      glassmorphism: false,
      gradientBackgrounds: true,
      borderWidth: 1,
      uppercaseHeadings: false,
    },
  },
  headers: [
    {
      id: 'header-standard',
      name: 'Standard Header',
      description: 'Header biasa dengan logo dan navigasi',
      layout: 'standard',
      configFields: [
        { key: 'logoUrl', label: 'Logo URL', type: 'image', placeholder: 'https://...' },
        { key: 'siteTitle', label: 'Site Title', type: 'text', defaultValue: 'Kedai Kopi' },
        { key: 'tagline', label: 'Tagline', type: 'text', defaultValue: 'Kopi Terbaik' },
        { key: 'ctaText', label: 'CTA Text', type: 'text', defaultValue: 'Pesan Sekarang' },
        { key: 'ctaLink', label: 'CTA Link', type: 'text', defaultValue: '#menu' },
      ],
      defaultConfig: {
        logoUrl: '',
        siteTitle: 'Kedai Kopi',
        tagline: 'Kopi Terbaik',
        ctaText: 'Pesan Sekarang',
        ctaLink: '#menu',
      },
      mockup: 'header-standard',
    },
  ],
  footers: [
    {
      id: 'footer-columns',
      name: 'Columns Footer',
      description: 'Footer dengan kolom links',
      layout: 'columns',
      configFields: [
        { key: 'copyright', label: 'Copyright', type: 'text', defaultValue: '© 2026 Kedai Kopi' },
      ],
      defaultConfig: {
        copyright: '© 2026 Kedai Kopi',
      },
      mockup: 'footer-columns',
    },
  ],
  sections: [
    {
      type: 'hero',
      name: 'Hero',
      icon: 'LayoutTemplate',
      variants: [
        {
          id: 'hero-full',
          name: 'Hero Full Width',
          description: 'Hero dengan background full width',
          layout: 'hero-full',
          configFields: [
            { key: 'title', label: 'Title', type: 'text', defaultValue: 'Selamat Datang' },
            { key: 'subtitle', label: 'Subtitle', type: 'textarea', defaultValue: 'Kopi terbaik untuk hari Anda' },
            { key: 'buttonText', label: 'Button Text', type: 'text', defaultValue: 'Lihat Menu' },
            { key: 'buttonLink', label: 'Button Link', type: 'text', defaultValue: '#menu' },
          ],
          defaultConfig: {
            title: 'Selamat Datang',
            subtitle: 'Kopi terbaik untuk hari Anda',
            buttonText: 'Lihat Menu',
            buttonLink: '#menu',
          },
          defaultStyle: {
            padding: { top: 120, right: 24, bottom: 120, left: 24 },
            background: 'gradient',
            backgroundGradient: 'linear-gradient(135deg, #8B5A2B 0%, #D4A574 100%)',
          },
          mockup: 'hero-full',
        },
        {
          id: 'hero-split',
          name: 'Hero Split',
          description: 'Hero dengan layout split',
          layout: 'hero-split',
          configFields: [
            { key: 'title', label: 'Title', type: 'text', defaultValue: 'Kedai Kopi' },
            { key: 'subtitle', label: 'Subtitle', type: 'textarea', defaultValue: 'Kopi terbaik' },
          ],
          defaultConfig: {
            title: 'Kedai Kopi',
            subtitle: 'Kopi terbaik',
          },
          mockup: 'hero-split',
        },
      ],
    },
    {
      type: 'menu_board',
      name: 'Menu Board',
      icon: 'BookOpen',
      variants: [
        {
          id: 'menu-classic',
          name: 'Menu Classic',
          description: 'Menu dengan layout classic',
          layout: 'menu-classic',
          configFields: [
            { key: 'title', label: 'Title', type: 'text', defaultValue: 'Menu Kami' },
          ],
          defaultConfig: {
            title: 'Menu Kami',
          },
          mockup: 'menu-classic',
        },
      ],
    },
  ],
};
```

---

## 9. File Locations

| File | Purpose |
|------|---------|
| `src/lib/builder/template-types.ts` | Schema definitions |
| `src/lib/builder/template-store.ts` | State management + BUILTIN_TEMPLATES |
| `src/lib/builder/section-renderer.tsx` | Section renderer |
| `src/lib/builder/config-form.tsx` | Dynamic config form |
| `src/lib/builder/mockup-preview.tsx` | Mockup visual per variant |
| `src/lib/builder/design-styles.ts` | Design style definitions |
| `src/lib/builder/validation.ts` | Template validation |
| `src/lib/builder/templates/*.ts` | Template definitions |
| `src/components/builder/builder-canvas.tsx` | Builder canvas |
| `src/components/builder/template-gallery.tsx` | Template picker |
| `app/preview/[templateId]/page.tsx` | Preview page |

---

## 10. Quick Reference

### Business Categories

| Category | Label |
|----------|-------|
| `food` | Kuliner |
| `fashion` | Fashion |
| `retail` | Ritel |
| `handicraft` | Kerajinan |
| `services` | Jasa |

### Tiers

| Tier | Description |
|------|-------------|
| `free` | Free tier |
| `starter` | Starter tier |
| `growth` | Growth tier |
| `enterprise` | Enterprise tier |

### Background Types

| Type | Description |
|------|-------------|
| `transparent` | Mengikuti background template |
| `color` | Warna solid |
| `image` | Gambar background |
| `gradient` | Gradasi warna |

### Button Styles

| Style | Description |
|-------|-------------|
| `solid` | Tombol solid |
| `outline` | Tombol outline |
| `ghost` | Tombol ghost |
| `gradient` | Tombol gradient |

### Shadow Styles

| Style | Description |
|-------|-------------|
| `none` | Tanpa shadow |
| `sm` | Shadow kecil |
| `md` | Shadow medium |
| `lg` | Shadow besar |
| `xl` | Shadow extra besar |

---

## 11. Checklist Final Sebelum Submit

- [ ] Template terdaftar di `BUILTIN_TEMPLATES`
- [ ] Semua mockup terdaftar di `mockup-preview.tsx`
- [ ] Semua configFields punya `defaultValue`
- [ ] Semua variant punya minimal 2 configFields
- [ ] Warna teks kontras dengan background
- [ ] Menggunakan theme color references (bukan hardcoded hex)
- [ ] Template sudah di-test di builder
- [ ] Preview `/preview/[templateId]` bekerja dengan benar
- [ ] Template sudah di-validate dengan `validateTemplate()`

---

## 12. Referensi

- [TEMPLATE_GUIDE.md](./TEMPLATE_GUIDE.md) — Dokumentasi lengkap template guide
- [template-types.ts](../../src/lib/builder/template-types.ts) — TypeScript interfaces
- [template-store.ts](../../src/lib/builder/template-store.ts) — State management
- [mockup-preview.tsx](../../src/lib/builder/mockup-preview.tsx) — Mockup visual
- [design-styles.ts](../../src/lib/builder/design-styles.ts) — Design styles
- [section-renderer.tsx](../../src/components/builder/section-renderer.tsx) — Section renderer
