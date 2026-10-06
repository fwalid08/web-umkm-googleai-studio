# Template Creation Guide — Developer Reference

> **Audience**: Internal developers
> **Scope**: Creating new built-in templates under the "unique template" contract (§18)
> **Related docs**: `TEMPLATE_GUIDE.md` (schema reference, partially superseded),
> `UNIQUE_TEMPLATE_SPEC.md` (normative spec for unique templates),
> `PLANNING_TEMPLATE_MODULE.md` (site types, modules, future roadmap)

---

## 1. Overview

A **template** is a self-contained design package that the page builder renders
as a complete storefront: theme (palette + typography + components), header
variants, footer variants, and section variants. Every template also ships a
**seed** (`data`) that populates a brand-new storefront with copy and layout
appropriate to its niche.

Since v18 (`UNIQUE_TEMPLATE_SPEC.md`), the old generic UI system is removed.
There is **no shared registry** of sections, no generic header/footer layouts,
and no fallback rendering branch. Every variant must render its own `html`.
This is enforced by tests, not by convention.

### 1.1 What you are NOT allowed to do

- Import `registrySections()` from `templates/compose.ts` — removed.
- Import anything from `sections/registry.ts` — removed.
- Use bare generic variant IDs (`hero-full`, `features-3col`, `hdr-klasik`,
  `ftr-columns`, `pricing-3tier`, …) — rejected by `unique-template.test.ts`.
- Use generic header/footer layouts as your `layout` value expecting the
  built-in renderer to draw them — only `variant.html` is dispatched.
- Hardcode colors (`#fff`, `rgb()`, `hsl()`), `font-family` literals, or the
  keywords `white`/`black` anywhere inside `html` or `customCss`.
- Declare a config toggle (`showNav`, `showSocial`, `showCta`) that the
  variant's `html` never reads via `{{#if …}}`.

### 1.2 What you MUST do

- Declare all variants yourself, in your own `templates/<niche>.ts` file.
- Give every header/footer/section variant a non-empty `html` string.
- Namespace every ID: `<templateId>:<slug>` (e.g. `fashion:hero-lookbook`).
- Use only CSS-variable tokens for colors and fonts inside `html`.
- Make every key in `defaultConfig` editable through a `configFields` entry,
  or mark it as an implicit key (`showCta`, `showNav`, `showSocial`,
  `contentWidth`, `isExternal`, `enabled`, `key`).
- Register the template once, in `BUILT_IN_CATALOG`.
- Keep `bun run test` green — the tests ARE the contract.

---

## 2. Prerequisites

| Tool | Check |
|---|---|
| Bun ≥ 1.1 | `bun --version` |
| Node ≥ 20 (for some scripts) | `node --version` |
| Dev server | `bun dev` (for manual preview + thumbnail capture) |

Install dependencies once:

```bash
bun install
```

Run the full test suite before and after your change:

```bash
bun run test
```

Targeted template contract tests:

```bash
bunx vitest run src/lib/builder/templates/catalog.test.ts
bunx vitest run src/lib/builder/templates/unique-template.test.ts
bunx vitest run src/lib/builder/templates/content-roundtrip.test.ts
```

Preview a template in the browser:

```
http://localhost:3000/preview/<templateId>
```

Capture a gallery thumbnail (requires dev server running):

```bash
bun /tmp/opencode/shot2.mjs   # writes public/thumbnails/<templateId>.jpg
```

---

## 3. Template Anatomy

A template is a `CatalogTemplate` (`src/lib/builder/templates/catalog.ts`):

```ts
interface CatalogTemplate extends Template {
  data: FullTemplateData;   // seed — REQUIRED
}

interface Template {
  id: string;                 // 'fashion' — kebab-case, unique
  name: string;               // 'Lookbook Fashion' — Title Case
  description: string;        // one-line marketing copy
  category: BusinessCategory; // 'food'|'fashion'|'retail'|'handicraft'|'services'
  tiers?: Tier[];             // default: all four tiers allowed
  theme: TemplateTheme;
  headers: HeaderVariant[];   // ≥ 5, all with html
  footers: FooterVariant[];   // ≥ 5, all with html
  sections: SectionTypeDefinition[]; // all 18 built-in types + custom types
  activeSections?: string[];  // subset of your sections used as default seed
  colorSchemes: ColorScheme[];        // ≥ 1, each must pass validateColorScheme()
  contrast?: ContrastContract;        // recommended for unique templates
  template_data?: unknown;            // legacy, ignore for new templates
  animations?: AnimationConfig[];     // optional
  behaviours?: BehaviourConfig[];     // optional
}
```

### 3.1 Theme

```ts
interface TemplateTheme {
  palette: DesignStylePalette;  // 8 keys: primary, secondary, accent,
                                // background, surface, text, textMuted, border
  typography: DesignStyleTypography;
  components: DesignStyleComponents;
  effects?: DesignStyleEffects;
}

interface DesignStyleTypography {
  headingFont: string;  // MUST exist in FONT_CATEGORIES
  bodyFont: string;     // MUST exist in FONT_CATEGORIES
  accentFont?: string;  // token ketiga resmi — MUST exist in FONT_CATEGORIES
                        // fallback: headingFont
  baseSize: number;     // px, typically 16
  scaleRatio: number;   // e.g. 1.25
  headingWeight: number; // 400–900
  bodyWeight: number;    // 400–900
}
```

Register new fonts in `src/lib/builder/font-categories.ts` before referencing
them — the test `font template terdaftar di FONT_CATEGORIES` will fail
otherwise.

### 3.1.1 ContrastContract (recommended for unique templates)

`contrast` is a v3.5 contract that declares which foreground/background token
pairs must meet WCAG ratios when the user switches color schemes. Without it,
`buildRenderTemplate()` still produces a template, but the test
`buildRenderTemplate(): live site & canvas WAJIB dapat field yang sama`
expects `live.contrast` to be defined — and `validateColorScheme()` skips
contract checks entirely.

```ts
interface ContrastContract {
  pairs: ContrastPair[];
}

interface ContrastPair {
  fg: ContrastTokenKey;   // e.g. 'text', 'primary', 'accent'
  bg: ContrastTokenKey;   // e.g. 'background', 'surface', 'primary'
  role: ContrastPairRole; // 'normal-text' | 'large-text' | 'ui-component'
  minRatio?: number;      // optional explicit override
  token?: string;         // optional token name override
  note?: string;          // diagnostics context
}
```

`auditContrastCoverage` compares this declaration against what your
`variant.html` actually uses and returns warnings — it never blocks, but a
missing pair means a scheme change can silently produce unreadable text.

### 3.1.2 ColorScheme

Each entry in `colorSchemes` must pass `validateColorScheme()`. A template
allows at most 20 schemes: 10 `light` + 10 `dark`. Each scheme overrides the
template palette and optionally the fonts.

```ts
interface ColorScheme {
  id: string;
  name: string;
  category: 'light' | 'dark';
  palette: DesignStylePalette;       // 8 keys
  headingFont?: string;              // optional font override
  bodyFont?: string;
  accentFont?: string;
}
```

---

### 3.2 Headers & Footers

Each variant follows the same shape:

```ts
interface HeaderVariant {
  id: string;            // 'fashion:hdr-lookbook' — REQUIRED namespaced
  name: string;
  description: string;
  layout: string;        // use your namespaced id, e.g. 'fashion:hdr-lookbook'
  configFields: ConfigField[];
  defaultConfig: Record<string, unknown>;
  mockup: string;        // identifier used in gallery preview
  mobileMenu?: MobileMenuConfig; // { style, showCta, ctaText, ctaLink }
  maxNavDepth?: 1 | 2;   // REQUIRED to be uniform across the template
  html?: string;         // REQUIRED — unique HTML, tokens only
}

interface FooterVariant { /* same minus mobileMenu/maxNavDepth */ }
```

**`maxNavDepth`**: `1` = flat nav only; `2` = may render one level of
dropdown submenu. The sidebar shows/hides the "Submenu" field based on this,
so a template must declare the same value in every header variant.

**`mobileMenu`**: configures the slide-out drawer used on mobile. Typical
value: `{ style: 'drawer-sidebar', showCta: true, ctaText: 'Pesan Sekarang',
ctaLink: 'https://wa.me/…' }`.

**Footer `text` MUST contain `{year}`** — the test
`setiap template punya nav header + seo + footer {year}` rejects otherwise.
At render time `{year}` is replaced by the current year via
`resolveYearToken()` in `behaviour-script.ts`. Never render `{year}`
literally to users (guarded by
`setiap varian footer TIDAK menampilkan {year} mentah ke pengguna`).

**Seed legacy fields**: `data.header.variant` and `data.footer.style` still
use the old generic layout names (`"standard"`, `"columns"`, …) and are
validated against `chrome.ts` by the old contract test. The actual runtime
resolution uses `headerVariantId` / `footerVariantId` (namespaced), which
default to `template.headers[0].id` / `template.footers[0].id`. Keep the
generic names in the seed for now — the unique-template guard checks the
declared variants, not the seed chrome keys.

### 3.3 Sections

```ts
interface SectionTypeDefinition {
  type: SectionType | string; // one of the 18 built-ins or a custom kebab-case id
  name: string;
  icon: string;
  variants: SectionVariant[]; // ≥ 3 per type (except 'marquee', which is single-DOM)
  mobileMenu?: MobileMenuConfig;
}

interface SectionVariant {
  id: string;            // 'fashion:hero-lookbook' — REQUIRED namespaced
  name: string;
  description: string;
  layout: string;        // your namespaced id
  configFields: ConfigField[];
  defaultConfig: Record<string, unknown>;
  defaultStyle?: Partial<SectionStyle>;
  mockup: string;
  html?: string;         // REQUIRED
}
```

The 18 built-in section types (your template must define ALL of them, even if
`activeSections` only seeds a subset):

```
hero · features · product_grid · pricing · testimonials · gallery
location · faq · contact · about · video · team · newsletter · divider
marquee · menu_board · steps · cta
```

Custom section types are allowed (`promo-gacor`, `jadwal-sholat`, …) but every
variant must have `html`, and the type id must match
`/^[a-z][a-z0-9-]{0,39}$/`.

### 3.4 Data (seed)

```ts
interface FullTemplateData {
  paletteOverride?: Partial<DesignStylePalette>; // effective palette =
                                                 // theme.palette + override
  activeSections?: string[];                     // subset of your types
  sections?: Array<{
    type: SectionType;
    variant: string;        // MUST exist in template.sections → that type
    config?: Record<string, unknown>;
    style?: Partial<SectionStyle>;
    anchorId?: string;
  }>;
  header?: Partial<HeaderConfig>;   // navItems & ctaText REQUIRED
  footer?: Partial<FooterConfig>;   // text REQUIRED to contain "{year}"
  seo?: { title?: string; description?: string };  // title REQUIRED
  core?: Partial<CoreConfig>;
  customCss?: string;       // template-wide CSS, tokens only
  bottomBar?: BottomBarConfig; // mobile bottom nav, ≤ 5 items
}
```

**Core-section seed requirement** (`catalog.test.ts`): the seed must contain
all 8 core types — `hero`, `features`, `pricing`, `testimonials`, `gallery`,
`location`, `faq`, `contact`.

Every `data.sections[].variant` MUST resolve through
`builderSectionToInstance()` to the same variant id (no silent fallback).
`anchorId` becomes the HTML `id` of the rendered section; duplicates are
deduplicated (`beranda`, `beranda-2`, …) and reserved slugs
(`RESERVED_SLUGS` in `src/lib/pages/slug.ts`) are rejected.

Optional seed blocks that should not be forgotten:

```ts
bottomBar?: {
  enabled?: boolean;
  items?: Array<{
    id: string;
    label: string;
    icon: string;
    url: string;
    isExternal?: boolean;
    enabled?: boolean;
    badge?: string;
  }>;
  // ≤ 5 items, every item needs an icon, CTA in the middle via a dedicated item,
  // hidden ≥ 1024 px, safe-area bottom padding (§17.3)
};
```

§17.5 also expects a `hero-carousel` section variant somewhere in the template
with `slides` config + autoplay (guarded by the mobile checklist, not a hard
test).

---

### 3.5 ConfigField

```ts
interface ConfigField {
  key: string;                 // camelCase, matches defaultConfig key
  label: string;               // user-facing, Indonesian OK
  type: ConfigFieldType;       // text|textarea|number|select|image|list|color|
                               // background|gallery|switch|html
  options?: { label: string; value: string }[];  // for select
  itemFields?: ConfigField[];  // for list (nested repeater)
  placeholder?: string;
  defaultValue?: unknown;
  maxItems?: number;
  rows?: number;               // for textarea
  hint?: string;
}
```

Every key in `defaultConfig` (except implicit keys) MUST appear in
`configFields` — otherwise the sidebar renders a dead switch and the test
`tiap key defaultConfig punya form field` fails.

For list fields, `itemFields` must be complete: every key used inside a list
item object needs a matching field, or the repeater renders raw values.

### 3.6 Template Expression Syntax

Inside `html`, placeholders are double-brace tokens processed by
`renderVariantHtml()`:

| Syntax | Meaning | Example |
|---|---|---|
| `{{key}}` | Escaped text replacement of `config[key]` | `{{headline}}` |
| `{{{key}}}` | Raw HTML insertion (sanitized, for `type: 'html'` fields) | `{{{aboutContent}}}` |
| `{{#if key}}…{{/if}}` | Render block only when `config[key]` is truthy | `{{#if showCta}}<a>…</a>{{/if}}` |
| `{{#if !key}}…{{/if}}` | Render block only when `config[key]` is falsy | `{{#if !logoUrl}}<span>E</span>{{/if}}` |
| `{{#items}}…{{/items}}` | Loop over a list field; inner `{{subKey}}` reads item keys | `{{#items}}<li>{{title}}</li>{{/items}}` |

Never write `{{items}}` for a list field — it stringifies to
`[object Object]`.

---

## 4. Step-by-Step: Creating a New Template

### Step 1 — Create the file

`src/lib/builder/templates/<niche>.ts`

Use `laundry-emerald.ts` as the reference. Do NOT copy `food.ts` — it still
relies on the removed registry system and will be rebuilt later.

Skeleton:

```ts
import type {
  ConfigField,
  FooterVariant,
  HeaderVariant,
  SectionTypeDefinition,
} from "../template-types";
import type { CatalogTemplate } from "./catalog";

const BRAND = "Nama Brand";
const NS = "<niche>";                 // template id
const vid = (name: string) => `${NS}:${name}`;

export const FASHION_TEMPLATE: CatalogTemplate = {
  id: NS,
  name: "Lookbook Fashion",
  description: "…",
  category: "fashion",
  theme: { /* palette 8 keys, typography 3 fonts, components, effects */ },
  headers: [ /* 5 variants, each vid("hdr-…"), all with html */ ],
  footers: [ /* 5 variants, each vid("ftr-…"), all with html */ ],
  sections: [ /* ALL 18 built-in types, each with ≥ 3 variants, all with html */ ],
  activeSections: [ /* subset used as default seed */ ],
  colorSchemes: [ /* at least one, passes validateColorScheme */ ],
  contrast: { /* ContrastContract — recommended */ },
  data: {
    paletteOverride: { /* same 8 keys */ },
    activeSections: [ /* same subset */ ],
    sections: [
      // 8 core sections + any niche-specific ones
      { type: "hero", variant: vid("hero-lookbook"), anchorId: "beranda", config: {…} },
      { type: "features", variant: vid("features-showcase"), anchorId: "keunggulan", config: {…} },
      { type: "pricing", variant: vid("pricing-tiers"), anchorId: "harga", config: {…} },
      { type: "testimonials", variant: vid("testimonials-wall"), anchorId: "testimoni", config: {…} },
      { type: "gallery", variant: vid("gallery-masonry"), anchorId: "galeri", config: {…} },
      { type: "location", variant: vid("location-hours"), anchorId: "lokasi", config: {…} },
      { type: "faq", variant: vid("faq-accordion"), anchorId: "faq", config: {…} },
      { type: "contact", variant: vid("contact-form"), anchorId: "kontak", config: {…} },
    ],
    header: { variant: "standard", navItems: […], ctaText: "…", /* … */ },
    footer: { style: "columns", text: `© {year} ${BRAND}. …`, /* … */ },
    seo: { title: `${BRAND} — …`, description: "…" },
    core: { site_title: BRAND, tagline: "…" },
    customCss: "/* tokens only, targets [data-tpl-type] / [data-tpl-variant] */",
  },
};
```

### Step 2 — Define the theme

- Pick 8 palette colors. Run them through `validateColorScheme()` mentally:
  `text` on `background` ≥ 4.5:1, `primary` on `background` ≥ 3:1 for large
  text, `border` visible on `surface`.
- Pick 3 fonts from `FONT_CATEGORIES` (`src/lib/builder/font-categories.ts`).
  If a font is missing, add it there first.
- Choose `buttonStyle`, `shadowStyle`, `navStyle`, `footerStyle`,
  `borderRadius` — these drive `buildThemeTokens()` and the sidebar preview.

### Step 3 — Author header variants (≥ 5)

Reference patterns from `laundry-emerald.ts`:

- `headerShellMobile(inner, opts)` — wraps your inner HTML in a `<header>`
  with token-driven bg/border/padding. **Do NOT put `position:sticky` inside
  the variant HTML** — the renderer applies it via the `sticky` prop.
- `brandBlock(bg, fg, size)` — logo `<img>` when `{{logoUrl}}` is set,
  fallback initial badge otherwise. Always wrap optional parts in
  `{{#if key}}…{{/if}}` so sidebar toggles actually change the render.
- `burgerBtn()` — MUST be present in every header variant (test
  `setiap varian header punya tombol hamburger in-flow`). It renders the
  hamburger the `MobileDrawer` listens to.
- `data-hdr-title` on the brand title element, `data-hdr-mark` on the logo
  element — both required so the mobile CSS can shrink them.
- `maxNavDepth` must be identical across all variants (typically `1`).
- `menuPosition` config field MUST be a `select` with options
  `center|left|right`, default `"center"` (test-enforced).
- `mockup` is used by `MockupPreview` in the section/sidebar picker. The
  helper recognizes prefixes like `hero-`, `features-`, `header-`, `footer-`.
  Because unique-template IDs are namespaced (`fashion:hero-lookbook`), they
  do NOT match those prefixes and fall back to `DefaultMockup` unless you add
  a matching branch in `renderMockup()` (`mockup-preview.tsx`). For the
  gallery card, drop a screenshot at `public/thumbnails/<templateId>.jpg` —
  the card reads that file directly.

### Step 4 — Author footer variants (≥ 5)

- Every toggle you declare (`showNav`, `showSocial`) MUST be read in the HTML
  via `{{#if showNav}}…{{/if}}`. Otherwise the test
  `tiap toggle footer benar-benar mengubah render` fails.
- Varian tanpa toggle must NOT render `{{navItems}}` at all.
- `{year}` inside `defaultConfig.text` must be substituted by the renderer —
  never leak the literal string (test-enforced).
- `mockup` follows the same rule as header variants.

### Step 5 — Author section variants (all 18 types, ≥ 3 variants each)

For each type, write 3+ visually distinct variants. Each variant is:

```ts
{
  id: vid("hero-lookbook"),
  name: "Hero Lookbook",
  description: "…",
  layout: vid("hero-lookbook"),
  configFields: inferFields(HERO_CONFIG),   // or hand-written
  defaultConfig: { …HERO_CONFIG },
  mockup: vid("hero-lookbook"),
  html: `<section data-tpl-type="hero" data-tpl-variant="${vid("hero-lookbook")}"
                  style="background:var(--color-primary);color:var(--color-on-primary);padding:72px 24px;">
           …
         </section>`,
}
```

Helpers worth copying from `laundry-emerald.ts`:

- `inferFields(config)` — derives `ConfigField[]` from `defaultConfig` so
  every key automatically has a form field. Override specific keys (e.g.
  `menuPosition` → `select`) afterwards. The generated labels come from
  `prettyLabel()`: a built-in Indonesian `LABELS` map for common keys, with
  camelCase → Title Case fallback.
- `sectionShell(inner, bg, pad)` — wraps inner HTML in
  `<section>…<div style="max-width:1152px;margin:0 auto;">…` so the section
  is boxed and centered.
- List fields use `{{#items}}…{{/items}}` loops — NOT `{{items}}` (which
  renders `[object Object]`).
- All remote images should use verified host IDs. Verify Pexels IDs before
  shipping: `bun scripts/verify-template-images.ts`. A dead image ID shows
  a broken image in the preview and the test for empty image fields in the
  seed catches empty strings, but not dead remote URLs.

### Step 6 — Register and test

1. Add `import { FASHION_TEMPLATE } from "./fashion";` and
   `FASHION_TEMPLATE,` to `BUILT_IN_CATALOG` in
   `src/lib/builder/templates/catalog.ts`. **This is the only place to
   register.** `BUILTIN_TEMPLATES` in `template-store.ts` is an alias.
2. Add `"fashion"` to `UNIQUE_TEMPLATES` in
   `src/lib/builder/templates/unique-template.test.ts` so the §18 guard runs
   against your template.
3. Add the template id to `MIGRATED_TEMPLATES` in `catalog.test.ts` only if
   you want the stricter migrated-template checks (≥5 header/footer, exactly
   the RENDERED_VARIANTS id list) to apply. New unique templates should rely
   on the §18 guard instead.
4. Add a thumbnail at `public/thumbnails/fashion.jpg` (the gallery card test
   requires it).
5. Run the targeted tests, then the full suite:

```bash
bunx vitest run src/lib/builder/templates/catalog.test.ts
bunx vitest run src/lib/builder/templates/unique-template.test.ts
bun run test
```

6. Manual QA: open `/preview/fashion` at 375 / 768 / 1024 px, with at least
   three different color schemes and three font pairings. There must be no
   horizontal scroll on mobile, no literal `{year}`, no `[object Object]`,
   and no unreadable text on any scheme.

---

## 5. Token & Style Rules (§18.4, normative)

Inside every `html` string and inside `customCss`:

| Allowed | Forbidden |
|---|---|
| `var(--color-primary)` `var(--color-secondary)` `var(--color-accent)` `var(--color-background)` `var(--color-surface)` `var(--color-text)` `var(--color-textMuted)` `var(--color-border)` | Hex colors `#fff`, `#0E7C66` |
| `var(--color-on-primary)` and other `--color-on-*` / `--color-*-on-*` tokens | `rgb()/rgba()/hsl()/hsla()`, `white`, `black` |
| `var(--font-heading)` `var(--font-body)` `var(--font-accent)` | Any `font-family:` literal |
| `currentColor` for decorative SVG/dividers | `<style>` blocks (stripped by sanitizer — use `customCss`) |
| `theme:<token>` references in `style.backgroundColor` | Hardcoded hex in `defaultStyle` |

Tokens are produced by `buildThemeTokens()` (`src/lib/builder/theme-tokens.ts`)
from `theme.palette` + `theme.typography` + `theme.components.borderRadius` +
`contrast`. Both the canvas and the live site consume the same builder, so a
token that exists in one exists in the other — the test
`setiap var(--x) yang dipakai tersedia di token kanvas & live` enforces this.

Mobile rules (§15, §17 — still enforced):

- Default single column; multi-column only via `repeat(auto-fit,minmax(min(100%,…),1fr))`
  or breakpoint-up media queries — never a fixed width > 480 px.
- `img{max-width:100%;height:auto}`.
- Tap targets ≥ 44 px; body text ≥ 14 px; input font-size ≥ 16 px.
- No hover-only interactions.
- Bottom bar config ≤ 5 items with icons, hidden ≥ 1024 px.

---

## 6. Validation & Testing

The contract is enforced by code; if the tests pass, the template is
structurally valid. Summary of the guards:

| Guard | File | What it rejects |
|---|---|---|
| Template contract | `templates/catalog.test.ts` | Missing core sections, seed variant mismatch (silent fallback), missing `{year}` in footer, missing `navItems`/`ctaText`/`seo.title`, invalid tiers, unknown fonts, dead config keys, broken thumbnail |
| Unique-template contract (§18) | `templates/unique-template.test.ts` | Missing `html`, non-namespaced IDs, bare generic IDs, hardcoded colors/fonts, unknown CSS vars, dead toggles, literal `{year}` leakage, generic-system imports |
| Schema (v3.0) | `src/lib/builder/template-schema.ts` | Missing theme/palette, unknown config-field types, custom section types without `html`, unsafe HTML/CSS patterns (`<script>`, `position:fixed`, `@import`, external `url()`) |
| Section rendering parity | `templates/content-roundtrip.test.ts` | Seed → instance → render drift |

Run the full suite with:

```bash
bun run test
```

If a test fails, read the message — it names the template id, variant, and
the exact rule that was violated.

---

## 7. Worked Example: Adding `fashion`

Goal: a new built-in template for fashion/hijab stores, registered, tested,
and previewable.

1. **File**: create `src/lib/builder/templates/fashion.ts`. Copy the
   structure of `laundry-emerald.ts`. Replace `BRAND`, `NS = "fashion"`,
   palette, fonts, and all section configs. Every variant id becomes
   `fashion:<slug>`.

2. **Copywriting**: seed `data.sections` with fashion-specific copy —
   lookbook gallery, size-guide FAQ, shipping/returns contact info. Core 8
   types must still be present.

3. **Catalog**: in `catalog.ts`,
   `export const BUILT_IN_CATALOG: CatalogTemplate[] = [FOOD_TEMPLATE, LAUNDRY_EMERALD_TEMPLATE, FASHION_TEMPLATE];`

4. **Guard**: in `unique-template.test.ts`, add `"fashion"` to
   `UNIQUE_TEMPLATES`.

5. **Thumbnail**: drop a screenshot at `public/thumbnails/fashion.jpg`.

6. **Test**:

   ```bash
   bunx vitest run src/lib/builder/templates/unique-template.test.ts
   bun run test
   ```

7. **Manual**: `bun dev`, open `http://localhost:3000/preview/fashion`,
   exercise the three viewports, three schemes, three font pairings, and the
   mobile drawer.

---

## 8. Common Pitfalls

| Symptom | Likely cause |
|---|---|
| Test: `tiap key defaultConfig punya form field` | A key like `showPowered` exists in config but has no matching `ConfigField` — derive fields with `inferFields()` or add the field manually. |
| Test: `memakai var(--color-x) yang tak disediakan token` | You used a token name that `buildThemeTokens()` does not emit (e.g. `--color-button` on the `variant.html` path). Use only the tokens listed in §5. |
| Test: `header tanpa [data-hdr-burger]` | Your header HTML forgot `burgerBtn()` — every header variant needs it in-flow. |
| Test: `footer … showNav tanpa {{#if}}` | You declared `showNav` in config but never read it in the HTML. Either render it conditionally or remove the toggle. |
| Test: `memakai id generik "hero-full"` | A variant id is bare — prefix it with `<templateId>:`. |
| Rendered footer shows `© {year} Brand` | The variant HTML renders `{{text}}` but the runtime substitution never runs on the `variant.html` path — make sure your seed `footer.text` is consumed by the generic substitute, or replace `{year}` in `defaultConfig` with the server-rendered year at build time. Current templates rely on the renderer substituting it; the test `setiap varian footer TIDAK menampilkan {year} mentah` will catch regressions. |
| Canvas looks fine, live site broken | You built the render template by spreading individual fields instead of `buildRenderTemplate(t)` — always use the helper (see the `live site wajib membangun template lewat SPREAD` test). |
| Horizontal scroll on 375 px | A fixed-width element > 480 px, an image without `max-width:100%`, or a grid without `minmax(min(100%,…),1fr)`. |
| Text unreadable on dark scheme | You used `var(--color-primary)` as text on a dark surface — use `var(--color-on-primary)`/`var(--color-text)` or the `-on-*` token paired with the actual background. |

---

## 9. Definition of Done

- [ ] File `src/lib/builder/templates/<niche>.ts` declares theme, 5+ headers,
      5+ footers, all 18 section types with 3+ variants each, all with `html`.
- [ ] Every variant id is `<templateId>:<slug>`; no bare generic ids.
- [ ] `html` and `customCss` contain zero hardcoded colors/fonts; only tokens.
- [ ] Every config key has a form field (or is an implicit key).
- [ ] Every toggle is read in the HTML (`{{#if …}}`).
- [ ] Footer `text` contains `{year}`; seed `header.navItems` non-empty;
      `header.ctaText` set; `seo.title` set.
- [ ] Seed contains the 8 core section types; every seed variant resolves
      without fallback.
- [ ] Template added to `BUILT_IN_CATALOG` and `UNIQUE_TEMPLATES`.
- [ ] Thumbnail at `public/thumbnails/<id>.jpg`.
- [ ] `bun run test` green.
- [ ] Manual QA at 375/768/1024 × 3 schemes × 3 fonts, mobile drawer, no
      horizontal scroll, no literal `{year}`, no `[object Object]`.
