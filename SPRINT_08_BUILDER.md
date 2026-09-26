# Sprint 8: Builder Enhancements
**Duration:** 2 weeks (10 working days)  
**Goal:** Improve website builder with drag-drop section reorder, header/footer editor, template preview, and undo/redo.

---

## 1. User Stories

| ID | Story | Points |
|----|-------|--------|
| US-8.1 | As a merchant, I want to drag-drop sections to reorder them so my page layout fits my needs | 8 |
| US-8.2 | As a merchant, I want to edit header (logo, navigation) and footer (links, social) globally | 5 |
| US-8.3 | As a merchant, I want to preview other templates before switching so I don't lose work | 5 |
| US-8.4 | As a merchant, I want undo/redo in editor so I can experiment safely | 3 |
| US-8.5 | As a merchant, I want to add custom HTML/embed sections for flexibility | 3 |
| US-8.6 | As a merchant, I want section visibility per device (mobile/desktop) | 3 |

**Total: 27 points**

---

## 2. Data Model Changes

### 2.1 Website Config Schema Update
```typescript
// src/types/builder.ts
export interface WebsiteConfig {
  theme: {
    palette: ColorPalette;
    typography: TypographyConfig;
  };
  sections: MergedSection[]; // Now includes order from drag-drop
  seo: { title?: string; description?: string };
  header?: HeaderConfig;
  footer?: FooterConfig;
}

export interface HeaderConfig {
  logo_url?: string;
  logo_alt?: string;
  show_logo: boolean;
  navigation: NavItem[];
  cta_button?: { text: string; link: string; style: 'primary' | 'outline' };
  sticky: boolean;
  background: 'transparent' | 'solid' | 'blur';
}

export interface FooterConfig {
  show_default: boolean; // "Dibuat dengan UMKM SaaS"
  copyright_text?: string;
  navigation: NavItem[];
  social_links: SocialLink[];
  newsletter_signup: boolean;
  background: string;
}

export interface NavItem {
  id: string;
  label: string;
  url: string; // Internal: /p/slug, External: https://...
  open_in_new_tab: boolean;
  children?: NavItem[]; // Dropdown support
}

export interface SocialLink {
  platform: 'instagram' | 'facebook' | 'twitter' | 'tiktok' | 'youtube' | 'whatsapp' | 'email';
  url: string;
}
```

### 2.2 Section Config Update
```typescript
export interface SectionConfig {
  id: string;
  type: string;
  label: string;
  required: boolean;
  order: number; // Now user-controlled via drag-drop
  enabled: boolean;
  style: Record<string, unknown>;
  content: Record<string, unknown>;
  visibility?: 'all' | 'mobile' | 'desktop'; // New: device visibility
}
```

---

## 3. API Contracts

### 3.1 Website Config API (Enhanced)
```
PUT /api/websites/:websiteId/website
Body: {
  template_id?: string,
  custom_config: WebsiteConfig, // Full config including header/footer, section order
}
```

### 3.2 Template Preview API
```
GET /api/templates/:id/preview?websiteId=xxx
- Returns rendered HTML of template with current website's content merged
- Used for "Preview Template" modal
```

### 3.3 Section Reorder API (Optional - can be part of config save)
```
POST /api/websites/:websiteId/sections/reorder
Body: { sectionIds: string[] } // New order
Response: { success: true }
```

---

## 4. UI Specification

### 4.1 Builder Editor - Drag Drop Reorder (`app/dashboard/[websiteId]/builder/[id]/page.tsx`)

```
Left Panel (Config):
- Sections list now draggable (using @dnd-kit)
- Each section row: drag handle | toggle | label | type badge | device visibility icon
- Drag to reorder → updates order field immediately (optimistic UI)
- Save button persists new order

Right Panel (Preview):
- Iframe preview updates live as sections reordered
- Mobile/Desktop toggle still works
```

#### Drag-Drop Implementation (@dnd-kit)
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

```tsx
// src/components/builder/section-list.tsx
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
);

<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
  <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
    {sections.map(section => (
      <SortableSectionItem key={section.id} section={section} />
    ))}
  </SortableContext>
</DndContext>
```

### 4.2 Header/Footer Editor (New Tab in Builder)

```
Builder Tabs: [Sections] [Header] [Footer] [Theme] [SEO]

Header Tab:
- Logo upload (drag-drop, auto-resize to 200px max width)
- Logo alt text
- Show/hide logo toggle
- Navigation builder:
  - Add link: Label + URL (internal page picker / external)
  - Drag-drop reorder
  - Dropdown support (nesting)
  - CTA button config
- Sticky header toggle
- Background: Transparent / Solid / Blur

Footer Tab:
- Show default credit toggle
- Custom copyright text
- Navigation links (same builder as header)
- Social icons: Platform picker + URL
- Newsletter signup toggle (connects to future email capture)
- Background color picker
```

### 4.3 Template Preview Modal

```
Trigger: "Pratinjau Template" button in template gallery
Modal:
- Large iframe (desktop view)
- Mobile/desktop toggle
- "Gunakan Template Ini" button → confirms switch
- Warning: "Beralih template akan mereset konten section yang tidak cocok. Lanjutkan?"
```

### 4.4 Undo/Redo (Local History)

```
- Toolbar buttons: Undo (Ctrl+Z) | Redo (Ctrl+Y)
- History stack: 20 steps
- Tracked: section enable/disable, content changes, style changes, reorder
- Not tracked: preview iframe, tab switching
- Persisted in localStorage per website+template (survives refresh)
```

### 4.5 Custom Section Types

```
New section types (add to template configs):
1. custom_html: { html: string } - Raw HTML/embed
2. embed: { url: string, aspect_ratio: '16:9' | '4:3' | '1:1' } - iframe embed
3. button_group: { buttons: [{ label, url, style, icon }] } - Multiple CTAs
4. spacer: { height: number } - Vertical spacing
```

---

## 5. Public Renderer Updates

### 5.1 Header Rendering (`src/components/website/header.tsx`)
```tsx
export function WebsiteHeader({ config, site }: { config: HeaderConfig; site: PublicSiteData }) {
  const navItems = config.navigation || [];
  const logo = config.logo_url;
  
  return (
    <header className={`sticky top-0 z-40 ${config.sticky ? 'shadow-sm' : ''} ${config.background === 'blur' ? 'backdrop-blur bg-white/80' : config.background === 'solid' ? 'bg-white' : 'bg-transparent'}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {config.show_logo && logo && (
          <a href="/" className="flex items-center gap-2" aria-label={config.logo_alt || site.name}>
            <Image src={logo} alt={config.logo_alt || site.name} width={120} height={40} className="h-10 w-auto" />
          </a>
        )}
        
        <nav className="hidden md:flex items-center gap-6" aria-label="Navigasi utama">
          {navItems.map(item => (
            <NavItem key={item.id} item={item} />
          ))}
          {config.cta_button && (
            <a href={config.cta_button.link} className={`px-4 py-2 rounded-lg text-sm font-medium ${config.cta_button.style === 'primary' ? 'bg-green-600 text-white' : 'border border-green-600 text-green-600'}`}>
              {config.cta_button.text}
            </a>
          )}
        </nav>
        
        {/* Mobile menu button */}
      </div>
    </header>
  );
}
```

### 5.2 Footer Rendering (`src/components/website/footer.tsx`)
```tsx
export function WebsiteFooter({ config, site }: { config: FooterConfig; site: PublicSiteData }) {
  return (
    <footer className="border-t" style={{ backgroundColor: config.background, borderColor: site.palette.border }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div>
            <p className="font-bold text-lg">{site.name}</p>
            {config.copyright_text && <p className="mt-2 text-sm text-gray-500">{config.copyright_text}</p>}
            {config.show_default && <p className="mt-2 text-xs text-gray-400">Dibuat dengan UMKM SaaS</p>}
          </div>
          
          {/* Navigation columns */}
          {config.navigation.length > 0 && (
            <div className="md:col-span-2">
              <h4 className="font-semibold mb-4">Menu</h4>
              <ul className="grid gap-2 sm:grid-cols-2">
                {config.navigation.map(item => (
                  <li key={item.id}>
                    <a href={item.url} className="text-sm text-gray-600 hover:text-green-600" target={item.open_in_new_tab ? '_blank' : undefined} rel={item.open_in_new_tab ? 'noopener noreferrer' : undefined}>
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Social */}
          {config.social_links.length > 0 && (
            <div>
              <h4 className="font-semibold mb-4">Ikuti Kami</h4>
              <div className="flex gap-3">
                {config.social_links.map(link => (
                  <a key={link.platform} href={link.url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-green-600">
                    <SocialIcon platform={link.platform} className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
```

---

## 6. Database Migration (Optional - Config stored in JSONB)

No new tables needed. `user_templates.custom_config` JSONB already stores full config. Just ensure header/footer fields are included.

---

## 7. Task Breakdown

| Task | File(s) | Estimate |
|------|---------|----------|
| 1. Install @dnd-kit packages | `package.json` | 0.5h |
| 2. Update builder types | `src/types/builder.ts` | 1h |
| 3. Create draggable section list component | `src/components/builder/section-list.tsx` | 4h |
| 4. Integrate drag-drop in builder editor | `app/dashboard/[websiteId]/builder/[id]/page.tsx` | 4h |
| 5. Create header config UI | `src/components/builder/header-editor.tsx` | 4h |
| 6. Create footer config UI | `src/components/builder/footer-editor.tsx` | 4h |
| 7. Add header/footer tabs to builder | `app/dashboard/[websiteId]/builder/[id]/page.tsx` | 2h |
| 8. Create header renderer component | `src/components/website/header.tsx` | 2h |
| 9. Create footer renderer component | `src/components/website/footer.tsx` | 2h |
| 10. Update public renderer to use header/footer | `src/components/website/renderer.tsx` | 2h |
| 11. Template preview modal | `src/components/builder/template-preview-modal.tsx` | 3h |
| 12. Template preview API | `app/api/templates/[id]/preview/route.ts` | 2h |
| 13. Undo/redo history hook | `src/hooks/use-editor-history.ts` | 3h |
| 14. Add custom section types | `src/lib/builder/sections.ts`, template configs | 2h |
| 15. Device visibility per section | Update SectionConfig + renderer | 2h |
| 16. Integration testing | Manual | 3h |
| 17. Update i18n | `src/lib/i18n/locales/*.json` | 1h |

**Total: ~41.5 hours (~5.5 days)**

---

## 8. Acceptance Criteria

- [ ] Sections can be drag-drop reordered in builder left panel
- [ ] Order persists after save + refresh
- [ ] Preview iframe updates live during drag
- [ ] Header editor: logo upload, navigation builder, CTA, sticky, background
- [ ] Footer editor: copyright, navigation, social links, newsletter, background
- [ ] Public site renders custom header/footer correctly
- [ ] Template preview modal shows live preview before switch
- [ ] Undo/redo works for content/style/reorder changes (20 steps)
- [ ] Custom section types available: HTML, Embed, Button Group, Spacer
- [ ] Section visibility: all/mobile/desktop toggle works
- [ ] Mobile responsive header (hamburger menu)
- [ ] No TypeScript errors, ESLint clean

---

## 9. Migration Strategy for Existing Websites

```sql
-- Backfill header/footer config for existing websites
UPDATE user_templates
SET custom_config = jsonb_set(
  custom_config,
  '{header}',
  '{"show_logo": true, "navigation": [], "sticky": true, "background": "solid"}'::jsonb,
  true
)
WHERE custom_config->>'header' IS NULL;

UPDATE user_templates
SET custom_config = jsonb_set(
  custom_config,
  '{footer}',
  '{"show_default": true, "navigation": [], "social_links": [], "newsletter_signup": false, "background": "#f9fafb"}'::jsonb,
  true
)
WHERE custom_config->>'footer' IS NULL;
```

---

## 10. Rollback Plan

1. Remove @dnd-kit dependencies
2. Revert builder editor to non-draggable section list
3. Remove header/footer tabs and components
4. Revert public renderer to old header/footer
5. Feature flags: `NEXT_PUBLIC_BUILDER_DND=false`, `NEXT_PUBLIC_CUSTOM_HEADER_FOOTER=false`