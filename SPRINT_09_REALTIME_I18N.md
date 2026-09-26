# Sprint 9: Real-time Dashboard + i18n Storefront
**Duration:** 1.5 weeks (7-8 working days)  
**Goal:** Add Supabase Realtime for live dashboard updates and implement full i18n for public storefront.

---

## 1. User Stories

| ID | Story | Points |
|----|-------|--------|
| US-9.1 | As a merchant, I want my dashboard to update in real-time when new orders come in so I don't need to refresh | 5 |
| US-9.2 | As a merchant, I want to see live visitor count on my storefront | 3 |
| US-9.3 | As a customer, I want to browse the storefront in English so international buyers can understand | 5 |
| US-9.4 | As a merchant, I want to translate my product names/descriptions to English | 5 |
| US-9.5 | As a customer, I want prices shown in USD when browsing in English | 3 |
| US-9.6 | As a system, I want real-time subscriptions managed efficiently to control costs | 2 |

**Total: 23 points**

---

## 2. Real-time Dashboard (Supabase Realtime)

### 2.1 Enable Realtime on Tables
```sql
-- Run in Supabase Dashboard → Replication
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE pages;
-- Note: Only enable for tables that need real-time. Each table adds overhead.
```

### 2.2 Realtime Hook (`src/hooks/useRealtime.ts`)
```typescript
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeOptions<T> {
  table: string;
  filter?: string; // e.g., "website_id=eq.xxx"
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  onInsert?: (payload: T) => void;
  onUpdate?: (payload: T) => void;
  onDelete?: (payload: T) => void;
}

export function useRealtime<T = any>(options: RealtimeOptions<T>) {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  
  useEffect(() => {
    const newChannel = supabase
      .channel(`realtime:${options.table}:${options.filter || 'all'}`)
      .on(
        'postgres_changes',
        {
          event: options.event || '*',
          schema: 'public',
          table: options.table,
          filter: options.filter,
        },
        (payload) => {
          switch (payload.eventType) {
            case 'INSERT':
              options.onInsert?.(payload.new as T);
              break;
            case 'UPDATE':
              options.onUpdate?.(payload.new as T);
              break;
            case 'DELETE':
              options.onDelete?.(payload.old as T);
              break;
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });
    
    setChannel(newChannel);
    
    return () => {
      supabase.removeChannel(newChannel);
    };
  }, [options.table, options.filter, options.event, supabase]);
  
  return { isConnected, channel };
}
```

### 2.3 Dashboard Integration

#### Orders Page - Live Updates
```tsx
// app/dashboard/orders/page.tsx
import { useRealtime } from '@/hooks/useRealtime';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<DashboardStats>();
  
  // Initial load
  useEffect(() => { fetchOrders(); fetchStats(); }, []);
  
  // Realtime: new orders
  useRealtime<Order>({
    table: 'orders',
    filter: `website_id=eq.${activeWebsiteId}`,
    event: 'INSERT',
    onInsert: (newOrder) => {
      setOrders(prev => [newOrder, ...prev]);
      setStats(prev => ({ ...prev, total_orders: prev.total_orders + 1, today_orders: prev.today_orders + 1, pending_orders: prev.pending_orders + 1 }));
      // Play notification sound
      playNotificationSound();
    },
  });
  
  // Realtime: order updates
  useRealtime<Order>({
    table: 'orders',
    filter: `website_id=eq.${activeWebsiteId}`,
    event: 'UPDATE',
    onUpdate: (updatedOrder) => {
      setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
      // Update stats based on status change
      // ...
    },
  });
  
  // Connection indicator in header
  return (
    <div>
      <Header>
        <ConnectionIndicator connected={isConnected} />
      </Header>
      <OrdersTable orders={orders} />
    </div>
  );
}
```

#### Analytics Page - Live Visitors (Optional)
```typescript
// Track via Supabase Realtime presence or custom table
// For now: show "X pengunjung aktif" using Supabase Realtime Presence
```

### 2.4 Connection Indicator Component
```tsx
// src/components/dashboard/connection-indicator.tsx
export function ConnectionIndicator({ connected }: { connected: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
      <span className="text-xs text-gray-500">{connected ? 'Terhubung' : 'Terputus'}</span>
    </div>
  );
}
```

---

## 3. Public Storefront i18n

### 3.1 Language Detection & Routing
```
URL Structure:
- Indonesian (default): /p/slug, /produk, /tentang-kami
- English: /en/p/slug, /en/products, /en/about-us

Detection Priority:
1. URL prefix (/en/...)
2. Cookie (lang=en)
3. Accept-Language header
4. Default: 'id'
```

### 3.2 Middleware Update (`middleware.ts`)
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const LOCALES = ['id', 'en'];
const DEFAULT_LOCALE = 'id';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Check if pathname already has locale
  const pathnameHasLocale = LOCALES.some(locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`);
  
  if (pathnameHasLocale) return NextResponse.next();
  
  // Redirect to locale prefix
  const locale = getLocale(request);
  request.nextUrl.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

function getLocale(request: NextRequest): string {
  // 1. Cookie
  const cookie = request.cookies.get('NEXT_LOCALE')?.value;
  if (cookie && LOCALES.includes(cookie)) return cookie;
  
  // 2. Accept-Language
  const acceptLang = request.headers.get('accept-language');
  if (acceptLang) {
    const preferred = acceptLang.split(',')[0].split('-')[0];
    if (LOCALES.includes(preferred)) return preferred;
  }
  
  return DEFAULT_LOCALE;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
```

### 3.3 Storefront Translation System

#### 3.3.1 Translation Files Structure
```
src/lib/i18n/
├── locales/
│   ├── id.json          # Existing dashboard translations
│   ├── en.json          # Existing dashboard translations
│   ├── storefront/
│   │   ├── id.json      # Storefront UI strings (buttons, labels)
│   │   └── en.json      # Storefront UI strings
│   └── content/
│       ├── id.json      # Dynamic content keys (fallback)
│       └── en.json      # Dynamic content keys
```

#### 3.3.2 Storefront Translation Keys (`src/lib/i18n/locales/storefront/id.json`)
```json
{
  "nav": {
    "home": "Beranda",
    "products": "Produk",
    "about": "Tentang Kami",
    "contact": "Kontak",
    "cart": "Keranjang"
  },
  "product": {
    "add_to_cart": "Beli via WhatsApp",
    "out_of_stock": "Habis",
    "low_stock": "Sisa {{count}}",
    "price": "Harga",
    "description": "Deskripsi",
    "category": "Kategori"
  },
  "order": {
    "name": "Nama Lengkap",
    "phone": "Nomor WhatsApp",
    "email": "Email (opsional)",
    "address": "Alamat Pengiriman",
    "notes": "Catatan",
    "payment_method": "Metode Pembayaran",
    "submit": "Kirim Pesanan via WhatsApp",
    "success": "Terima kasih! Pesanan Anda telah dikirim ke WhatsApp kami.",
    "error": "Gagal mengirim pesanan. Coba lagi."
  },
  "footer": {
    "made_with": "Dibuat dengan UMKM SaaS",
    "contact_us": "Hubungi Kami"
  },
  "common": {
    "loading": "Memuat...",
    "error": "Terjadi kesalahan",
    "retry": "Coba Lagi"
  }
}
```

#### 3.3.3 English Version (`src/lib/i18n/locales/storefront/en.json`)
```json
{
  "nav": {
    "home": "Home",
    "products": "Products",
    "about": "About Us",
    "contact": "Contact",
    "cart": "Cart"
  },
  "product": {
    "add_to_cart": "Order via WhatsApp",
    "out_of_stock": "Out of Stock",
    "low_stock": "Only {{count}} left",
    "price": "Price",
    "description": "Description",
    "category": "Category"
  },
  "order": {
    "name": "Full Name",
    "phone": "WhatsApp Number",
    "email": "Email (optional)",
    "address": "Shipping Address",
    "notes": "Notes",
    "payment_method": "Payment Method",
    "submit": "Send Order via WhatsApp",
    "success": "Thank you! Your order has been sent to our WhatsApp.",
    "error": "Failed to send order. Please try again."
  },
  "footer": {
    "made_with": "Made with UMKM SaaS",
    "contact_us": "Contact Us"
  },
  "common": {
    "loading": "Loading...",
    "error": "An error occurred",
    "retry": "Try Again"
  }
}
```

### 3.4 Product Content Translation

#### Database: Add Translation Fields
```sql
-- 025_product_translations.sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS name_en VARCHAR(200);
ALTER TABLE products ADD COLUMN IF NOT EXISTS description_en TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_en VARCHAR(100);

ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS name_en VARCHAR(200);

-- For pages
ALTER TABLE pages ADD COLUMN IF NOT EXISTS title_en VARCHAR(200);
ALTER TABLE pages ADD COLUMN IF NOT EXISTS content_en JSONB;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS seo_title_en VARCHAR(60);
ALTER TABLE pages ADD COLUMN IF NOT EXISTS seo_description_en VARCHAR(160);
```

#### API: Return Translated Content
```typescript
// src/lib/builder/public.ts - Modified buildSite
export async function buildSite(user: PublicUserRow, locale: 'id' | 'en' = 'id'): Promise<PublicSiteData> {
  // ... existing code ...
  
  // Transform products with locale
  const products = await getProductsForWebsite(websiteId, locale);
  
  return {
    // ... existing fields
    products, // Include in site data for renderer
    locale,
  };
}

// In renderer, use locale-aware fields
const productName = locale === 'en' && product.name_en ? product.name_en : product.name;
const productDesc = locale === 'en' && product.description_en ? product.description_en : product.description;
```

### 3.5 Currency Formatting
```typescript
// src/lib/utils/currency.ts
export function formatCurrency(amount: number, locale: 'id' | 'en', currency: 'IDR' | 'USD' = 'IDR'): string {
  if (locale === 'en' && currency === 'USD') {
    // Static conversion rate (configurable)
    const rate = 15500; // 1 USD = 15,500 IDR
    const usdAmount = amount / rate;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(usdAmount);
  }
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}
```

---

## 4. Language Switcher Component
```tsx
// src/components/website/language-switcher.tsx
import { useRouter, usePathname } from 'next/navigation';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = pathname.split('/')[1] === 'en' ? 'en' : 'id';
  
  const switchLocale = (locale: 'id' | 'en') => {
    const newPath = pathname.replace(`/${currentLocale}/`, `/${locale}/`);
    router.push(newPath);
    // Set cookie for persistence
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`;
  };
  
  return (
    <div className="flex items-center gap-1">
      <Globe className="w-4 h-4 text-gray-500" />
      <select 
        value={currentLocale} 
        onChange={(e) => switchLocale(e.target.value as 'id' | 'en')}
        className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
      >
        <option value="id">🇮🇩 Indonesia</option>
        <option value="en">🇺🇸 English</option>
      </select>
    </div>
  );
}
```

---

## 5. Public Renderer Integration

### 5.1 Updated PublicWebsite Component
```tsx
// src/components/website/renderer.tsx
import { LanguageSwitcher } from './language-switcher';
import { useLang } from '@/lib/i18n'; // Client-side hook for storefront

export function PublicWebsite({ site }: { site: PublicSiteData }) {
  const { t } = useLang('storefront'); // Load storefront namespace
  const locale = site.locale || 'id';
  
  return (
    <div className="min-h-screen" lang={locale}>
      <header>
        {/* ... existing header ... */}
        <LanguageSwitcher />
      </header>
      
      <main>
        {/* Sections use t() for UI strings */}
        {site.sections.map(section => (
          <SectionRenderer 
            key={section.id} 
            section={section} 
            locale={locale}
            t={t}
          />
        ))}
      </main>
    </div>
  );
}
```

### 5.2 Section Renderer with i18n
```tsx
function ProductGridSection({ s, locale, t }: { s: MergedSection; locale: 'id' | 'en'; t: any }) {
  const products = s.content.items as Product[];
  
  return (
    <section>
      {products.map(p => (
        <ProductCard 
          key={p.id} 
          product={p} 
          locale={locale}
          t={t}
          formatCurrency={formatCurrency}
        />
      ))}
    </section>
  );
}

function ProductCard({ product, locale, t, formatCurrency }: { product: Product; locale: 'id' | 'en'; t: any; formatCurrency: Function }) {
  const name = locale === 'en' && product.name_en ? product.name_en : product.name;
  const desc = locale === 'en' && product.description_en ? product.description_en : product.description;
  const price = product.price;
  
  return (
    <div className="border rounded-xl overflow-hidden bg-white">
      {/* Image */}
      <div className="p-3">
        <h3 className="font-semibold">{name}</h3>
        <p className="font-bold text-green-600">{formatCurrency(price, locale)}</p>
        {desc && <p className="text-sm text-gray-500 line-clamp-2">{desc}</p>}
        {product.stock === 0 && <span className="badge bg-red-100 text-red-700">{t('product.out_of_stock')}</span>}
        {product.stock > 0 && product.stock <= 5 && <span className="badge bg-amber-100 text-amber-700">{t('product.low_stock', { count: product.stock })}</span>}
        <OrderForm 
          disabled={product.stock === 0}
          productName={name}
          productPrice={price}
          // ... pass translated labels to OrderForm
        />
      </div>
    </div>
  );
}
```

---

## 6. Merchant Translation UI

### 6.1 Product Form - Translation Tab
```
Product Form Tabs: [Umum] [Gambar] [Variasi] [Terjemahan]

Terjemahan Tab:
- Nama Produk (English): [Input]
- Deskripsi (English): [Textarea]
- Kategori (English): [Input]
- Variasi: Each variant has "Nama (English)" field
```

### 6.2 Page Form - Translation Tab
```
Page Form Tabs: [Konten] [SEO] [Terjemahan]

Terjemahan Tab:
- Judul (English): [Input]
- Konten (English): [Rich Text Editor]
- SEO Title (English): [Input]
- SEO Description (English): [Textarea]
```

---

## 7. Task Breakdown

| Task | File(s) | Estimate |
|------|---------|----------|
| 1. Enable Realtime on orders, products tables | Supabase Dashboard | 0.5h |
| 2. Create useRealtime hook | `src/hooks/useRealtime.ts` | 2h |
| 3. Integrate realtime in orders page | `app/dashboard/orders/page.tsx` | 2h |
| 4. Integrate realtime in analytics page | `app/dashboard/analytics/page.tsx` | 2h |
| 5. Connection indicator component | `src/components/dashboard/connection-indicator.tsx` | 1h |
| 6. Notification sound utility | `src/lib/utils/sound.ts` | 0.5h |
| 7. Update middleware for locale routing | `middleware.ts` | 1h |
| 8. Create storefront translation files | `src/lib/i18n/locales/storefront/*.json` | 2h |
| 9. Migration 025_product_translations.sql | `supabase/migrations/025_product_translations.sql` | 1h |
| 10. Update public site data for locale | `src/lib/builder/public.ts` | 2h |
| 11. Update renderer for i18n | `src/components/website/renderer.tsx` | 3h |
| 12. Create LanguageSwitcher component | `src/components/website/language-switcher.tsx` | 1h |
| 13. Currency formatting utility | `src/lib/utils/currency.ts` | 1h |
| 14. Product form translation tab | `app/dashboard/products/page.tsx` (form) | 2h |
| 15. Page form translation tab | `app/dashboard/pages/[id]/page.tsx` | 2h |
| 16. Update API to return translated fields | `app/api/user/products/route.ts`, `app/api/user/pages/route.ts` | 2h |
| 17. Integration testing (realtime + i18n) | Manual | 3h |
| 18. Update i18n loader for namespaces | `src/lib/i18n/index.ts` | 1h |

**Total: ~28 hours (~3.5 days)**

---

## 8. Acceptance Criteria

- [ ] Orders page: new orders appear without refresh (green pulse animation)
- [ ] Order status changes reflect instantly
- [ ] Connection indicator shows green/red status
- [ ] Notification sound plays on new order (optional, user preference)
- [ ] Storefront accessible at `/en/p/slug` with English UI
- [ ] Language switcher in header works, persists via cookie
- [ ] Product names/descriptions show English when available
- [ ] Prices shown in USD on English locale (static rate)
- [ ] Merchant can input English translations for products/pages
- [ ] SEO meta tags use translated content on English locale
- [ ] Realtime subscriptions cleaned up on unmount (no memory leaks)
- [ ] No TypeScript errors, ESLint clean

---

## 9. Realtime Cost Management

| Table | Events | Est. Monthly Events | Cost Consideration |
|-------|--------|---------------------|-------------------|
| orders | INSERT, UPDATE | 100k | Enable |
| products | UPDATE (stock) | 50k | Enable |
| pages | UPDATE | 1k | Enable |
| analytics_events | INSERT | 1M+ | **Disable** - use separate analytics |

**Monitoring:** Check Supabase Realtime usage in dashboard. Disable if approaching limits.

---

## 10. Rollback Plan

1. Disable Realtime: `ALTER PUBLICATION supabase_realtime DROP TABLE orders, products, pages;`
2. Remove `useRealtime` hook usage
3. Revert middleware to single-locale
4. Remove translation columns from products/pages
5. Remove LanguageSwitcher from header
6. Feature flags: `NEXT_PUBLIC_REALTIME=false`, `NEXT_PUBLIC_STOREFRONT_I18N=false`