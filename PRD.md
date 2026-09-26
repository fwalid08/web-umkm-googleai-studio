# PRD: UMKM SaaS Platform — Production Hardening & Feature Completion

**Version:** 1.0  
**Date:** September 2026  
**Author:** Senior SaaS Product Architect  
**Stack:** Next.js 16 App Router + React 19 + Supabase (Postgres, Auth, Storage) + Tailwind v4 + NextAuth v5

---

## 1. Executive Summary

### 1.1 Current State
The codebase implements a **multi-tenant website builder for Indonesian UMKM** with:
- ✅ Subdomain routing (`tenant-xxx.umkm.id`) + custom domain support
- ✅ 5 templates (food, fashion, retail, handicraft, services) with fixed-section editor
- ✅ Guest checkout via WhatsApp (order → WA redirect)
- ✅ Midtrans billing (checkout + webhook) with 4 tiers
- ✅ Dashboard: orders, analytics, customers, domains, settings
- ✅ Demo mode with 2 accounts (Free 1 site, Starter 2 sites) using in-memory mock store

### 1.2 Critical Gaps (Blocking Production)
| Area | Gap | Impact |
|------|-----|--------|
| **Products** | No DB table; CRUD only works for demo users (in-memory) | **Core feature broken** — real users cannot manage catalog |
| **Custom Domains** | Simulated purchase only (no registrar, no Midtrans, auto-verified) | **Revenue feature fake** — cannot sell domains |
| **Notifications** | WA gateway not configured; logs only | **No order alerts** to merchants |
| **Trial System** | 14-day trial auto-confirmed; no expiry cron | **Revenue leakage** — users stay on trial forever |
| **Multi-page** | Pages stored in localStorage only; not rendered on public site | **Incomplete CMS** — FAQ, Contact, Legal pages don't work |
| **Invoices** | No generation, no email, no history | **Compliance gap** |

### 1.3 Strategic Decision: **Remove Trial System**
- **No more 14-day trial**. Free tier is permanent with hard limits.
- Free tier limits: **1 website, 5 products, 50 orders/month, subdomain only, no custom domain, no analytics export**.
- Upgrade to Starter (Rp 79k/mo yearly) unlocks: 3 websites, 50 products, unlimited orders, custom domain, full analytics.

---

## 2. Product Requirements (Functional)

### 2.1 Products Management (P0)
**JTBD:** "As a merchant, I want to manage my product catalog (CRUD, images, categories, stock) so customers can browse and order via WhatsApp."

#### Requirements
| ID | Requirement | Priority |
|----|-------------|----------|
| PRD-1.1 | Create `products` table with: `id, website_id, name, description, price, category, images[], stock, is_active, sort_order, created_at, updated_at` | P0 |
| PRD-1.2 | API: `GET/POST/PUT/DELETE /api/user/products` — scoped to active website, tier-gated limits | P0 |
| PRD-1.3 | UI: Product manager page (`/dashboard/products`) — table with inline edit, image upload, bulk actions | P0 |
| PRD-1.4 | Builder: Product Grid section reads from `products` table (not JSON) | P0 |
| PRD-1.5 | Public storefront: Product cards show real-time stock, "Habis" badge when stock=0 | P0 |
| PRD-1.6 | Tier limits enforced at API + DB: Free=5, Starter=50, Growth=200, Enterprise=9999 | P0 |
| PRD-1.7 | Image upload to Supabase Storage (`product-images/{website_id}/{product_id}/`) with signed URLs | P0 |
| PRD-1.8 | Stock decrement on order creation (configurable: auto/manual) | P1 |

#### Acceptance Criteria
- [ ] Merchant can add 5 products on Free tier; 6th shows upgrade prompt
- [ ] Product images upload < 2MB, auto-resize to 800px max, WebP conversion
- [ ] Product Grid section in builder shows live data from DB
- [ ] Order creation decrements stock (if enabled) and prevents oversell
- [ ] All operations respect RLS: `website_id` must match user's active website

---

### 2.2 Custom Domain Real Integration (P0)
**JTBD:** "As a merchant, I want to buy and connect a custom domain (e.g., `tokoku.com`) so my brand looks professional."

#### Requirements
| ID | Requirement | Priority |
|----|-------------|----------|
| PRD-2.1 | Integrate real registrar API (recommend: **Porkbun API** — simple, cheap, supports .id via partner) | P0 |
| PRD-2.2 | Domain search: real-time availability check via registrar API (not simulation) | P0 |
| PRD-2.3 | Domain purchase: Midtrans checkout → webhook → registrar register → set nameservers → DNS verification | P0 |
| PRD-2.4 | Auto-provision on Vercel: `vercel domains add {domain} --scope={team}` via Vercel API | P0 |
| PRD-2.5 | DNS records managed: A `@ 76.76.21.21`, CNAME `www cname.vercel-dns.com`, TXT `_saas-verify` for verification | P0 |
| PRD-2.6 | Domain lifecycle: `pending_payment → registering → active → expired → deleted` | P0 |
| PRD-2.7 | Auto-renewal: cron 30/14/7/1 days before expiry → Midtrans recurring → registrar renew | P1 |
| PRD-2.8 | Transfer-in support (EPP code) | P2 |

#### Registrar Choice: **Porkbun API**
- REST API, JSON, API key + secret
- Supports .com, .net, .org, .id (via partner), .co.id
- Price: ~$8.50/.com/yr, ~Rp 150k/.co.id/yr
- Webhook for domain events (optional, we poll)

#### Acceptance Criteria
- [ ] Search `tokoku.com` → real availability + real price in < 2s
- [ ] Purchase flow: Midtrans VA/QRIS → success → domain registered in < 60s
- [ ] Domain auto-connected to website (Vercel + DNS verified)
- [ ] Renewal reminder emails sent at T-30, T-14, T-7, T-1
- [ ] Failed renewal → grace period 30 days → release

---

### 2.3 WhatsApp Gateway + Notifications (P0)
**JTBD:** "As a merchant, I want to receive instant WhatsApp notifications for new orders so I can respond fast."

#### Requirements
| ID | Requirement | Priority |
|----|-------------|----------|
| PRD-3.1 | Configure **Fonnte** (Indonesian WA gateway) as default provider — cheaper, local support | P0 |
| PRD-3.2 | Env vars: `NOTIF_PROVIDER=fonnte`, `NOTIF_API_KEY`, `NOTIF_SENDER_ID` | P0 |
| PRD-3.3 | Event: `order.created` → send WA to merchant phone (from website settings) | P0 |
| PRD-3.4 | Event: `order.status_changed` → send WA to customer (template approved) | P1 |
| PRD-3.5 | Event: `payment.paid` → send WA to merchant + customer | P1 |
| PRD-3.6 | Event: `domain.expiring` → send WA/email to merchant | P1 |
| PRD-3.7 | Notification log table: `notification_logs(id, user_id, website_id, event, recipient, status, payload, created_at)` | P0 |
| PRD-3.8 | Retry logic: exponential backoff (1m, 5m, 15m, 1h) max 3 retries | P1 |
| PRD-3.9 | Dashboard: Notification history page with delivery status | P1 |

#### Fonnte Integration Spec
```
POST https://api.fonnte.com/send
Headers: Authorization: {API_KEY}
Body: { target: "628123456789", message: "Order baru #ORD-123...", countryCode: "62" }
Response: { status: true, message: "Sent" }
```

#### Acceptance Criteria
- [ ] New order → merchant receives WA in < 5s
- [ ] Failed delivery logged, retry works, max 3 attempts
- [ ] Merchant can test WA connection from Settings page
- [ ] Customer notifications use approved template (Meta Business API requirement)

---

### 2.4 Remove Trial System + Free Tier Limits (P0)
**JTBD:** "As a product owner, I want a simple permanent Free tier so users don't game trials and conversion is clearer."

#### Requirements
| ID | Requirement | Priority |
|----|-------------|----------|
| PRD-4.1 | Remove `trial_ends_at` from `users` table (migration) | P0 |
| PRD-4.2 | Remove `status: 'trialing'` from `subscriptions` — Free tier = `status: 'active', tier: 'free'` | P0 |
| PRD-4.3 | Free tier limits (enforced at API + DB + UI): | P0 |
| | - 1 website | |
| | - 5 products | |
| | - 50 orders/month (rolling 30 days) | |
| | - Subdomain only (no custom domain) | |
| | - Basic analytics (no CSV export, no customer list) | |
| | - No priority support | |
| PRD-4.4 | Starter tier (Rp 79k/mo yearly / Rp 99k monthly): 3 websites, 50 products, unlimited orders, custom domain, full analytics | P0 |
| PRD-4.5 | Growth tier (Rp 199k/mo yearly / Rp 249k monthly): 10 websites, 200 products, priority support | P0 |
| PRD-4.6 | Enterprise tier (Rp 479k/mo yearly / Rp 599k monthly): 999 websites, 9999 products, dedicated support, SLA | P0 |
| PRD-4.7 | Upgrade/downgrade: immediate effect, prorated credit on downgrade | P1 |
| PRD-4.8 | Hard limit enforcement: API returns 403 with `upgrade_url` when limit exceeded | P0 |

#### Migration Plan
```sql
-- 015_remove_trial_system.sql
ALTER TABLE users DROP COLUMN IF EXISTS trial_ends_at;
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_status_check 
  CHECK (status IN ('active', 'past_due', 'canceled', 'incomplete', 'incomplete_expired'));
UPDATE subscriptions SET status = 'active' WHERE status = 'trialing';
```

#### Acceptance Criteria
- [ ] New user registers → immediately on Free tier (no trial)
- [ ] Free user hits 5 products → "Upgrade to add more" with link to billing
- [ ] Free user tries to add custom domain → 403 + upgrade prompt
- [ ] Existing trial users migrated to Free (active) on deploy

---

### 2.5 Multi-page Support (DB-backed) (P1)
**JTBD:** "As a merchant, I want to create FAQ, Contact, Legal, and custom pages so my store looks complete and trustworthy."

#### Requirements
| ID | Requirement | Priority |
|----|-------------|----------|
| PRD-5.1 | Create `pages` table: `id, website_id, title, slug, type (standard|legal|contact|faq), content (JSON), is_published, seo_title, seo_description, sort_order, created_at, updated_at` | P1 |
| PRD-5.2 | API: `GET/POST/PUT/DELETE /api/user/pages` — scoped to website | P1 |
| PRD-5.3 | UI: `/dashboard/pages` — list + editor (rich text / markdown) | P1 |
| PRD-5.4 | Public routes: `/{subdomain}/p/{slug}` → renders page content | P1 |
| PRD-5.5 | Builder: "Pages" section type — auto-links to published pages in footer/header | P1 |
| PRD-5.6 | Default pages on website create: About, Contact, Terms, FAQ (draft) | P1 |
| PRD-5.7 | SEO per page: meta title, description, OG tags | P1 |
| PRD-5.8 | Navigation editor: drag-drop reorder pages in header/footer | P2 |

#### Acceptance Criteria
- [ ] Merchant creates "Syarat & Ketentuan" page → accessible at `tenant-xxx.umkm.id/p/syarat-ketentuan`
- [ ] Page content supports rich text (headings, lists, links, images)
- [ ] Footer auto-shows links to published legal/contact pages
- [ ] SEO meta tags rendered correctly on public page

---

### 2.6 Invoice Generation + Email (P1)
**JTBD:** "As a merchant, I want professional invoices for my orders so I can comply with tax regulations and look professional."

#### Requirements
| ID | Requirement | Priority |
|----|-------------|----------|
| PRD-6.1 | Create `invoices` table: `id, order_id, user_id, website_id, invoice_number (INV-YYYYMMDD-XXXX), status (draft|sent|paid|void), pdf_url, subtotal, tax, total, issued_at, due_at, paid_at` | P1 |
| PRD-6.2 | Auto-generate invoice PDF on order `status = 'selesai'` (or `payment_status = 'paid'`) | P1 |
| PRD-6.3 | PDF template: merchant info, customer info, line items, tax (PPN 11%), total, QRIS code for payment | P1 |
| PRD-6.4 | Store PDF in Supabase Storage (`invoices/{user_id}/{invoice_number}.pdf`) — signed URL 7 days | P1 |
| PRD-6.5 | Email invoice to customer (SendGrid/Resend) + WA notification with PDF link | P1 |
| PRD-6.6 | Dashboard: Invoice list with download, resend, void actions | P1 |
| PRD-6.7 | Monthly invoice summary report (PDF) for accounting | P2 |

#### Acceptance Criteria
- [ ] Order completed → invoice generated in < 10s
- [ ] PDF downloads correctly, contains all required tax fields (NPWP optional for UMKM)
- [ ] Customer receives email + WA with invoice link
- [ ] Merchant can void/reissue invoice

---

### 2.7 Stock/Inventory System (P1)
**JTBD:** "As a merchant, I want to track stock so I don't oversell and know when to restock."

#### Requirements
| ID | Requirement | Priority |
|----|-------------|----------|
| PRD-7.1 | `products.stock` (integer, default 0, -1 = unlimited) | P1 |
| PRD-7.2 | `product_variants` table (optional): `id, product_id, name (e.g., "Size M / Red"), sku, price_adjustment, stock` | P1 |
| PRD-7.3 | Order creation: check stock, decrement atomically (DB transaction) | P1 |
| PRD-7.4 | Low stock threshold (configurable, default 5) → WA/email alert | P1 |
| PRD-7.5 | Stock history log: `stock_movements(id, product_id, variant_id, type (in|out|adjust), qty, reference_id, note, created_at)` | P1 |
| PRD-7.6 | Dashboard: Stock report page (filter low stock, value) | P1 |
| PRD-7.7 | Bulk stock update via CSV upload | P2 |

#### Acceptance Criteria
- [ ] Product with stock=3, order qty=4 → rejected with "Stok tidak mencukupi"
- [ ] Stock decrement happens in same transaction as order insert
- [ ] Low stock alert sent when stock ≤ threshold after decrement
- [ ] Stock history shows all movements with reference

---

### 2.8 Builder Enhancements (P1-P2)
**JTBD:** "As a merchant, I want more control over my website layout without complexity."

#### Requirements
| ID | Requirement | Priority |
|----|-------------|----------|
| PRD-8.1 | Section reorder: drag-drop to change `order` field (within template constraints) | P1 |
| PRD-8.2 | Add custom section: "Custom HTML", "Embed", "Button Group" | P2 |
| PRD-8.3 | Section visibility by device (mobile/desktop) | P2 |
| PRD-8.4 | Global header/footer editor (logo, nav links, social icons) | P1 |
| PRD-8.5 | Template switcher: preview other templates before applying | P1 |
| PRD-8.6 | Undo/redo in editor (local history, 20 steps) | P2 |

#### Acceptance Criteria
- [ ] Merchant drags "Testimonials" above "Contact" → order updates live
- [ ] Switch template → content preserved where section types match
- [ ] Header editor: upload logo, edit nav links, social icons

---

### 2.9 Real-time Dashboard + i18n Storefront (P2-P3)
**JTBD:** "As a merchant, I want live updates on my dashboard and my store to support English for foreign buyers."

#### Requirements
| ID | Requirement | Priority |
|----|-------------|----------|
| PRD-9.1 | Supabase Realtime: subscribe to `orders` + `products` changes → live dashboard updates | P2 |
| PRD-9.2 | Public storefront i18n: `?lang=en` or `/en/` prefix → all UI strings translated | P2 |
| PRD-9.3 | Merchant can add translations for product names/descriptions per language | P3 |
| PRD-9.4 | Currency formatting: IDR for ID, USD for EN (static conversion rate) | P3 |

---

## 3. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Performance** | API p95 < 300ms; Public storefront LCP < 2.5s; Builder save < 1s |
| **Scalability** | Support 10k websites, 1M products, 10M orders/month on Supabase Pro |
| **Security** | RLS on all tenant tables; Rate limit 100 req/min/user; CSP headers; Input sanitization (DOMPurify) |
| **Reliability** | 99.9% uptime; Webhook retry with dead-letter queue; DB backups daily + PITR |
| **Compliance** | PDPA Indonesia ready: data export, deletion, consent log; Tax invoice compliant |
| **Observability** | Structured logging (pino); Error tracking (Sentry); Metrics (Vercel Analytics + custom) |

---

## 4. Database Migrations Required

| Migration | Description | Sprint |
|-----------|-------------|--------|
| 015 | Remove trial system (`trial_ends_at`, `status: trialing`) | Sprint 4 |
| 016 | Create `products` table + indexes + RLS | Sprint 1 |
| 017 | Create `product_images` table + Storage bucket | Sprint 1 |
| 018 | Create `pages` table + RLS | Sprint 5 |
| PRD-19 | Create `invoices` table + RLS | Sprint 6 |
| 020 | Create `notification_logs` table + RLS | Sprint 3 |
| 021 | Create `stock_movements` table + RLS | Sprint 7 |
| 022 | Create `product_variants` table + RLS | Sprint 7 |
| 023 | Add `stock`, `low_stock_threshold` to `products` | Sprint 7 |
| 024 | Update `domain_orders` for real registrar flow (status enum, registrar_id, nameservers) | Sprint 2 |

---

## 5. API Contracts (Key Endpoints)

### 5.1 Products API
```
GET    /api/user/products?page=1&limit=20&search=&category=
POST   /api/user/products                    { name, price, description, category, stock, images[] }
PUT    /api/user/products/:id                { name?, price?, description?, category?, stock?, is_active? }
DELETE /api/user/products/:id
POST   /api/user/products/:id/images         multipart/form-data (max 5, 2MB each)
DELETE /api/user/products/:id/images/:imageId
```

### 5.2 Domains API (Real)
```
GET    /api/domains/search?q=tokoku          → real registrar check
POST   /api/domains/checkout                 { domain, cycle } → Midtrans Snap token
POST   /api/domains/webhook                  ← Midtrans callback
GET    /api/domains/orders                   → user's domain orders
POST   /api/domains/renew/:id                → manual renew
```

### 5.3 Pages API
```
GET    /api/user/pages
POST   /api/user/pages                       { title, slug, type, content, is_published, seo }
PUT    /api/user/pages/:id
DELETE /api/user/pages/:id
PUT    /api/user/pages/reorder               { pageIds: string[] }
```

### 5.4 Notifications API
```
GET    /api/user/notifications               → history with filters
POST   /api/user/notifications/test          { provider, phone } → test WA
```

---

## 6. UI/UX Specifications

### 6.1 Product Manager Page (`/dashboard/products`)
- Table: Image | Name | Category | Price | Stock | Status | Actions
- Inline edit: click row → expand form
- Bulk actions: activate/deactivate/delete
- Empty state: "Belum ada produk. Tambah produk pertama Anda." + CTA
- Limit banner: "Free tier: 5/5 produk. Upgrade untuk menambah lebih banyak."

### 6.2 Domain Purchase Flow
1. Search → real-time results with price
2. Select → Midtrans checkout (VA/QRIS/CC)
3. Success page → "Domain sedang didaftarkan..." (polling)
4. Done → "Domain aktif & tersambung" + DNS records shown

### 6.3 Notification Settings Page
- Provider status: Connected/Disconnected
- Test button: "Kirim WA test ke nomor saya"
- Event toggles: New order, Status change, Payment, Domain expiry
- History table: Date | Event | Recipient | Status | Retry count

---

## 7. Sprint Plan Overview

| Sprint | Theme | Duration | Key Deliverables |
|--------|-------|----------|------------------|
| **Sprint 1** | Products Management | 2 weeks | DB, API, UI, Builder integration, Image upload |
| **Sprint 2** | Custom Domain Real Integration | 2 weeks | Porkbun API, Midtrans flow, Vercel provisioning, DNS |
| **Sprint 3** | WA Notifications + Notification Center | 1 week | Fonnte config, Event triggers, Log UI, Retry logic |
| **Sprint 4** | Remove Trial + Free Tier Limits | 1 week | Migration, Tier enforcement, Pricing update, Migration script |
| **Sprint 5** | Multi-page CMS | 2 weeks | Pages table, API, Editor, Public routes, SEO |
| **Sprint 6** | Invoice Generation | 1.5 weeks | Invoice table, PDF generation, Email/WA delivery, Dashboard |
| **Sprint 7** | Stock/Inventory System | 1.5 weeks | Stock fields, Variants, Atomic decrement, Alerts, History |
| **Sprint 8** | Builder Enhancements | 2 weeks | Drag-drop reorder, Header/Footer editor, Template preview |
| **Sprint 9** | Real-time + i18n | 1.5 weeks | Supabase Realtime, Storefront i18n, Currency formatting |

**Total: ~14.5 weeks (3.5 months)**

---

## 8. Risk & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Porkbun API rate limits | Medium | High | Cache availability 5 min; fallback to simulation with warning |
| Fonnte delivery failures | Medium | Medium | Retry + dead letter queue; fallback to email |
| Vercel API rate limits on domain provisioning | Low | High | Queue domain provisions; batch process |
| Migration data loss (trial removal) | Low | Critical | Backup before migrate; test on staging; rollback plan |
| Stock race conditions | Medium | High | DB transaction with `FOR UPDATE`; advisory locks |
| Image storage costs | Low | Medium | Auto-delete orphaned images; compress WebP; CDN |

---

## 9. Success Metrics (North Star + Input)

| Metric | Target |
|--------|--------|
| **North Star**: Weekly Active Merchants (WAM) | 500 by Month 6 |
| Product adoption: % merchants with ≥5 products | 60% |
| Domain attach rate: % paid users with custom domain | 40% |
| Order notification delivery rate | 99.5% |
| Invoice generation success rate | 99.9% |
| Free → Paid conversion (Month 1) | 8% |
| Churn (paid) | < 5% monthly |

---

## 10. Open Questions

1. **Registrar final choice**: Porkbun confirmed? Or evaluate Niagahoster/IDCloudHost for .id native?
2. **WA Gateway**: Fonnte approved? Need Meta Business verification for customer templates?
3. **Email provider**: SendGrid vs Resend vs Supabase SMTP?
4. **PDF generation**: `@react-pdf/renderer` (client) vs Puppeteer (Edge Function) vs `pdfkit` (server)?
5. **Real-time**: Enable Realtime on all tables or selective? Cost implications.
6. **i18n scope**: Full storefront translation or just UI chrome (buttons, labels)?

---

## 11. Next Actions

1. **Approve PRD** → Lock scope for Sprint 1
2. **Decide registrar & WA gateway** → Procure API keys
3. **Set up staging Supabase project** → Run migration 015-018
4. **Assign dev ownership** per sprint
5. **Kickoff Sprint 1** (Products Management)

---

*End of PRD*