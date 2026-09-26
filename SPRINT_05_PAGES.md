# Sprint 5: Multi-page Support (DB-backed)
**Duration:** 2 weeks (10 working days)  
**Goal:** Enable merchants to create and manage static pages (FAQ, Contact, Legal, Custom) stored in database, rendered on public storefront with SEO.

---

## 1. User Stories

| ID | Story | Points |
|----|-------|--------|
| US-5.1 | As a merchant, I want to create FAQ, Contact, Terms, and custom pages so my store looks complete | 5 |
| US-5.2 | As a merchant, I want a rich text editor for page content so I can format without HTML | 5 |
| US-5.3 | As a merchant, I want to publish/unpublish pages and set SEO meta per page | 3 |
| US-5.4 | As a customer, I want to access pages at `/{subdomain}/p/{slug}` so I can read policies | 3 |
| US-5.5 | As a merchant, I want default pages (About, Contact, Terms, FAQ) created automatically | 2 |
| US-5.6 | As a system, I want pages scoped to website with RLS and tier-gated limits | 3 |
| US-5.7 | As a merchant, I want pages linked in footer/header automatically | 3 |

**Total: 24 points**

---

## 2. Database Migration (018_create_pages.sql)

```sql
-- 018_create_pages.sql
CREATE TABLE IF NOT EXISTS pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL, -- URL-friendly, unique per website
    type VARCHAR(20) NOT NULL DEFAULT 'standard' CHECK (type IN ('standard', 'legal', 'contact', 'faq')),
    content JSONB NOT NULL DEFAULT '{}', -- TipTap/ProseMirror JSON or simple { html: string }
    content_html TEXT, -- Pre-rendered HTML for fast public serving
    is_published BOOLEAN NOT NULL DEFAULT false,
    seo_title VARCHAR(60),
    seo_description VARCHAR(160),
    seo_og_image TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE (website_id, slug)
);

-- Indexes
CREATE INDEX idx_pages_website ON pages(website_id, is_published, sort_order);
CREATE INDEX idx_pages_slug ON pages(website_id, slug);

-- RLS
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pages: user can manage own website pages"
ON pages FOR ALL
USING (
    website_id IN (
        SELECT id FROM websites WHERE user_id = auth.uid()
    )
)
WITH CHECK (
    website_id IN (
        SELECT id FROM websites WHERE user_id = auth.uid()
    )
);

-- Public read policy for published pages (via service-role in API)
-- No direct public policy; API handles public access

-- Trigger for updated_at
CREATE TRIGGER pages_updated_at
BEFORE UPDATE ON pages
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION generate_slug(title TEXT) RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    counter INT := 0;
    final_slug TEXT;
BEGIN
    base_slug := lower(regexp_replace(title, '[^a-z0-9]+', '-', 'g'));
    base_slug := trim(both '-' from base_slug);
    final_slug := base_slug;
    
    WHILE EXISTS (SELECT 1 FROM pages WHERE slug = final_slug AND website_id = (SELECT id FROM websites WHERE user_id = auth.uid() LIMIT 1)) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 3. Default Pages Seed (Run on Website Create)

```sql
-- Function to create default pages for new website
CREATE OR REPLACE FUNCTION create_default_pages(p_website_id UUID, p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_pages JSONB[] := ARRAY[
        jsonb_build_object(
            'title', 'Tentang Kami',
            'slug', 'tentang-kami',
            'type', 'standard',
            'content', jsonb_build_object('html', '<p>Selamat datang di toko kami. Kami menyediakan produk berkualitas dengan harga terjangkau.</p>'),
            'is_published', true,
            'sort_order', 1
        ),
        jsonb_build_object(
            'title', 'Kontak Kami',
            'slug', 'kontak-kami',
            'type', 'contact',
            'content', jsonb_build_object('html', '<p>Email: info@tokoku.com<br>WhatsApp: 08123456789<br>Alamat: Jl. Contoh No. 123, Jakarta</p>'),
            'is_published', true,
            'sort_order', 2
        ),
        jsonb_build_object(
            'title', 'Syarat & Ketentuan',
            'slug', 'syarat-ketentuan',
            'type', 'legal',
            'content', jsonb_build_object('html', '<p>1. Pembelian final tidak bisa dikembalikan kecuali produk rusak.<br>2. Pengiriman 1-3 hari kerja.<br>3. Garansi 7 hari untuk kerusakan pabrik.</p>'),
            'is_published', false, -- Draft by default
            'sort_order', 3
        ),
        jsonb_build_object(
            'title', 'Pertanyaan Umum (FAQ)',
            'slug', 'faq',
            'type', 'faq',
            'content', jsonb_build_object('html', '<h3>Bagaimana cara order?</h3><p>Pilih produk, klik Beli via WhatsApp, isi formulir.</p><h3>Metode pembayaran?</h3><p>Transfer bank, QRIS, COD.</p>'),
            'is_published', false,
            'sort_order', 4
        )
    ];
BEGIN
    INSERT INTO pages (website_id, title, slug, type, content, content_html, is_published, sort_order)
    SELECT p_website_id, 
           (p->>'title')::VARCHAR,
           (p->>'slug')::VARCHAR,
           (p->>'type')::VARCHAR,
           p->'content',
           (p->'content'->>'html')::TEXT,
           (p->>'is_published')::BOOLEAN,
           (p->>'sort_order')::INT
    FROM unnest(v_pages) AS p;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 4. API Contracts

### 4.1 Types (`src/types/pages.ts`)
```typescript
export type PageType = 'standard' | 'legal' | 'contact' | 'faq';

export interface Page {
  id: string;
  website_id: string;
  title: string;
  slug: string;
  type: PageType;
  content: { html: string }; // TipTap JSON can be extended later
  content_html: string;
  is_published: boolean;
  seo_title: string | null;
  seo_description: string | null;
  seo_og_image: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PageListResponse {
  pages: Page[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface PageCreateInput {
  title: string;
  slug?: string; // auto-generated if not provided
  type?: PageType;
  content?: { html: string };
  is_published?: boolean;
  seo_title?: string;
  seo_description?: string;
  seo_og_image?: string;
}

export interface PageUpdateInput {
  title?: string;
  slug?: string;
  type?: PageType;
  content?: { html: string };
  is_published?: boolean;
  seo_title?: string;
  seo_description?: string;
  seo_og_image?: string;
  sort_order?: number;
}

export interface PageReorderInput {
  pageIds: string[]; // Ordered array of page IDs
}
```

### 4.2 Endpoints

#### GET `/api/user/pages`
```
Query: page=1, limit=20, type?, is_published?, search?
Response: PageListResponse
```

#### POST `/api/user/pages`
```
Body: PageCreateInput
- Auto-generate slug from title if not provided
- Validate slug unique per website
- Render content_html from content.html (sanitize)
Response: { success: true, data: { page: Page } }
```

#### PUT `/api/user/pages/:id`
```
Body: PageUpdateInput
- If slug changed: validate unique
- Re-render content_html
Response: { success: true, data: { page: Page } }
```

#### DELETE `/api/user/pages/:id`
```
Response: { success: true, message: "Halaman dihapus" }
```

#### PUT `/api/user/pages/reorder`
```
Body: PageReorderInput
- Update sort_order for each page in array order
Response: { success: true, message: "Urutan diperbarui" }
```

#### GET `/api/public/pages/:slug` (Public - no auth)
```
- Resolve website from subdomain/custom domain (via headers)
- Fetch published page by slug
- Return: { success: true, data: { page: Page } }
- 404 if not found or not published
```

---

## 5. Public Page Rendering

### 5.1 New Route: `app/[lang]/p/[slug]/page.tsx`
```typescript
// Server Component
import { getPublicPage } from '@/lib/pages/public';
import { PageRenderer } from '@/components/website/page-renderer';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  return []; // Dynamic
}

export default async function PublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPublicPage(slug);
  
  if (!page) notFound();
  
  return (
    <PageRenderer page={page} />
  );
}
```

### 5.2 Page Renderer Component (`src/components/website/page-renderer.tsx`)
```typescript
import { Metadata } from 'next';
import { getTenantSite } from '@/lib/builder/public';
import { PublicWebsite } from './renderer'; // Reuse header/footer

interface PageRendererProps {
  page: PublicPageData;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublicPage(slug);
  if (!page) return { title: 'Halaman tidak ditemukan' };
  
  return {
    title: page.seo_title || `${page.title} — ${page.site_name}`,
    description: page.seo_description || page.site_description,
    openGraph: {
      title: page.seo_title || page.title,
      description: page.seo_description || page.site_description,
      images: page.seo_og_image ? [page.seo_og_image] : [],
    },
  };
}

export default function PageRenderer({ page }: PageRendererProps) {
  const { site } = await getTenantSite(); // Get tenant context for header/footer
  
  return (
    <div className="min-h-screen" style={{ fontFamily: site?.typography?.body_font }}>
      {/* Header - reuse from PublicWebsite */}
      <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="font-bold text-xl">{site?.name}</span>
          {site?.whatsapp && (
            <a href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noopener" className="text-green-600 hover:underline">
              Hubungi via WhatsApp
            </a>
          )}
        </div>
      </header>
      
      <main className="max-w-3xl mx-auto px-4 py-12">
        <article>
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">{page.title}</h1>
            {page.seo_description && <p className="mt-2 text-gray-600">{page.seo_description}</p>}
          </header>
          
          <div 
            className="prose prose-gray max-w-none"
            dangerouslySetInnerHTML={{ __html: page.content_html }}
          />
        </article>
      </main>
      
      {/* Footer - reuse */}
      <footer className="border-t px-4 py-8 text-center text-sm text-gray-500">
        <p className="font-semibold">{site?.name}</p>
        <p>{site?.subdomain ? `tenant.${site.subdomain}` : ''} • Dibuat dengan UMKM SaaS</p>
      </footer>
    </div>
  );
}
```

### 5.3 Public Page Lookup (`src/lib/pages/public.ts`)
```typescript
import { createServiceSupabaseClient } from '@/lib/supabase/service';
import { getTenantSite } from '@/lib/builder/public';

export interface PublicPageData {
  id: string;
  title: string;
  slug: string;
  type: string;
  content_html: string;
  seo_title: string | null;
  seo_description: string | null;
  seo_og_image: string | null;
  site_name: string;
  site_description: string;
}

export async function getPublicPage(slug: string): Promise<PublicPageData | null> {
  const { site } = await getTenantSite();
  if (!site) return null;
  
  const supabase = createServiceSupabaseClient();
  const { data } = await supabase
    .from('pages')
    .select('id, title, slug, type, content_html, seo_title, seo_description, seo_og_image')
    .eq('website_id', site.id) // Need website_id from tenant context
    .eq('slug', slug)
    .eq('is_published', true)
    .single();
  
  if (!data) return null;
  
  return {
    ...data,
    site_name: site.name,
    site_description: site.seo?.description || '',
  };
}
```

---

## 6. UI Specification

### 6.1 Pages Manager (`/dashboard/pages/page.tsx`) - **Replace localStorage version**
```
Layout:
- Header: "Halaman Info Toko" + "Tambah Halaman" button
- Limit banner (Free tier): "Free: 0/0 halaman. Upgrade ke Starter untuk 5 halaman."
- Table: Judul | Tipe | Slug | Status | Diperbarui | Aksi
- Row actions: Edit, Toggle Publish, Duplicate, Delete
- Bulk: Publish, Unpublish, Delete
- Drag-drop reorder (sort_order)
- Pagination, Search, Filter by type

Empty state: "Belum ada halaman. Tambah halaman pertama Anda."
```

### 6.2 Page Editor (`/dashboard/pages/[id]/page.tsx` or modal)
```
Tabs: Konten | SEO | Pengaturan

Konten:
- Rich text editor (TipTap or simple textarea with markdown toolbar)
- Live preview toggle
- Auto-save draft (localStorage + debounced API)

SEO:
- Judul SEO (max 60 char) - preview Google snippet
- Deskripsi SEO (max 160 char)
- OG Image URL

Pengaturan:
- Tipe: Standard / Legal / Kontak / FAQ
- Slug (editable, unique validation)
- Status: Draft / Dipublikasikan
- Urutan (drag-drop in list view)
```

### 6.3 Rich Text Editor
- Use **TipTap** (headless, extensible) or **@uiw/react-md-editor** for markdown
- Features: Headings, Bold/Italic, Lists, Links, Images (upload to Storage), Blockquote, Code block
- Output: JSON (TipTap) + HTML (sanitized with DOMPurify)

---

## 7. Builder Integration

### 7.1 Navigation Section Type
```typescript
// New section type: "navigation"
{
  id: 'nav-pages',
  type: 'navigation',
  label: 'Navigasi Halaman',
  required: false,
  order: 0, // Header position
  default_props: {
    show_home: true,
    show_pages: true, // Auto-link published pages
    page_types: ['standard', 'contact', 'faq', 'legal'],
    position: 'header', // or 'footer'
  }
}
```

### 7.2 Footer Auto-links
- Published pages of type `legal`, `contact`, `faq` → auto-add to footer
- Configurable in builder: "Tampilkan halaman legal di footer"

---

## 8. Tier Limits Enforcement

| Tier | Max Pages |
|------|-----------|
| Free | 0 (disabled) |
| Starter | 5 |
| Growth | Unlimited |
| Enterprise | Unlimited |

**Enforcement:**
- API: `POST /api/user/pages` → check `checkPagesLimit()` from Sprint 4
- UI: Disable "Tambah Halaman" on Free tier with upgrade prompt
- Builder: Navigation section hidden on Free tier

---

## 9. Task Breakdown

| Task | File(s) | Estimate |
|------|---------|----------|
| 1. Create migration 018_create_pages.sql | `supabase/migrations/018_create_pages.sql` | 2h |
| 2. Run migration + verify RLS | Supabase CLI | 1h |
| 3. Create pages types | `src/types/pages.ts` | 1h |
| 4. Create pages API (GET, POST, PUT, DELETE, REORDER) | `app/api/user/pages/route.ts` | 4h |
| 5. Create public page API | `app/api/public/pages/[slug]/route.ts` | 2h |
| 6. Create public page route | `app/[lang]/p/[slug]/page.tsx` | 2h |
| 7. Create page renderer component | `src/components/website/page-renderer.tsx` | 3h |
| 8. Create public page lookup lib | `src/lib/pages/public.ts` | 1h |
| 9. Pages manager UI (replace localStorage) | `app/dashboard/pages/page.tsx` | 5h |
| 10. Page editor UI (rich text + SEO) | `app/dashboard/pages/[id]/page.tsx` | 6h |
| 11. Rich text editor component (TipTap) | `src/components/dashboard/rich-text-editor.tsx` | 4h |
| 12. Image upload for editor | `src/lib/storage/page-images.ts` | 2h |
| 13. Builder navigation section type | `src/lib/builder/sections.ts`, renderer | 3h |
| 14. Default pages on website create | `app/api/websites/route.ts` (POST) | 1h |
| 15. Tier limit integration | Use `checkPagesLimit` from Sprint 4 | 1h |
| 16. Integration testing | Manual | 3h |
| 17. Update i18n | `src/lib/i18n/locales/*.json` | 1h |

**Total: ~42 hours (~5.5 days)**

---

## 10. Acceptance Criteria

- [ ] Migration 018 applied, RLS working
- [ ] Merchant creates page → accessible at `tenant-xxx.umkm.id/p/slug`
- [ ] Rich text editor works: headings, lists, links, images
- [ ] SEO meta tags rendered correctly on public page
- [ ] Default pages created on new website (About, Contact, Terms, FAQ)
- [ ] Free tier: cannot create pages (upgrade prompt)
- [ ] Starter: max 5 pages
- [ ] Growth/Enterprise: unlimited
- [ ] Navigation section in builder auto-links published pages
- [ ] Footer shows legal/contact/faq links automatically
- [ ] Drag-drop reorder updates sort_order
- [ ] Sanitization: no XSS via page content (DOMPurify)
- [ ] All API endpoints have RLS protection

---

## 11. Rich Text Editor Choice: TipTap

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link
```

```typescript
// src/components/dashboard/rich-text-editor.tsx
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';

const editor = useEditor({
  extensions: [
    StarterKit,
    Image.configure({ HTMLAttributes: { class: 'rounded-lg max-w-full' } }),
    Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-green-600 underline', target: '_blank', rel: 'noopener noreferrer' } }),
  ],
  content: initialContent,
  onUpdate: ({ editor }) => {
    const html = editor.getHTML();
    const json = editor.getJSON();
    onChange({ html, json });
  },
  editorProps: {
    attributes: { class: 'prose prose-gray max-w-none focus:outline-none min-h-[300px] p-4' },
  },
});
```

---

## 12. Rollback Plan

1. Drop `pages` table
2. Revert `app/dashboard/pages/page.tsx` to localStorage version
3. Remove public page route `app/[lang]/p/[slug]/page.tsx`
4. Remove navigation section type from builder
5. Feature flag: `NEXT_PUBLIC_ENABLE_PAGES=false`