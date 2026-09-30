# Sprint 6: Road to Launch
**Duration:** 2 weeks (10 working days)  
**Goal:** Rampungkan MVP dan siap launch ke publik. Fokus ke critical gaps, bukan fitur baru.

---

## 1. Launch Readiness Audit Summary

| Area | Status | Gap for Launch |
|------|--------|----------------|
| Landing Page | ✅ Done | — |
| Auth Flow | ⚠️ Partial | No email verification, no profile settings |
| Onboarding | ⚠️ Partial | Not auto-triggered after signup |
| Website Builder | ⚠️ Partial | Single-page only (OK for MVP) |
| Products | ✅ Done | — |
| Orders | ✅ Done | — |
| Checkout/Payment | ⚠️ Partial | WhatsApp-based for orders (OK for MVP) |
| Subscription Billing | ⚠️ Partial | No invoices, no cancellation flow |
| Legal Pages | ⚠️ Partial | No refund policy, no entity info |
| Error Handling | ❌ Missing | No 404, 500, error boundaries |
| SEO | ⚠️ Partial | No sitemap, no robots.txt, no structured data |
| Analytics | ⚠️ Partial | Internal only, no external analytics |
| Email | ❌ Missing | No transactional email at all |
| Settings | ⚠️ Partial | No profile, no business settings |
| Dashboard | ✅ Done | — |

---

## 2. Sprint Scope

### In Scope (Must-Have for Launch)

| ID | Feature | Priority |
|----|---------|----------|
| L-1 | Error pages (404, 500, error boundary) | P0 |
| L-2 | SEO: sitemap, robots.txt, structured data, OG images | P0 |
| L-3 | Onboarding flow integration (auto-trigger after signup) | P0 |
| L-4 | User profile settings (name, email, password change) | P0 |
| L-5 | Transactional email (welcome, invoice, password reset) | P0 |
| L-6 | Invoice generation (PDF) for subscription + domain | P1 |
| L-7 | External analytics (Plausible / Vercel Analytics) | P1 |
| L-8 | Legal pages: refund policy, entity info | P1 |
| L-9 | Business settings (name, address, hours, logo) | P1 |
| L-10 | Subscription cancellation flow | P1 |
| L-11 | Loading states + empty states polish | P1 |
| L-12 | End-to-end testing + bug fixes | P0 |

### Out of Scope (Defer to Post-Launch)

| Feature | Defer To |
|---------|----------|
| WA Notifications (Sprint 3) | Post-launch V2 |
| Domain: native .id, Qwords, document upload | Post-launch V2 |
| Domain: DNS management UI, transfer-in | Post-launch V2 |
| Multi-page website builder | Post-launch V2 |
| Public API | Post-launch V2 |
| Product variants | Post-launch V2 |
| Shopping cart | Post-launch V2 |
| Team member management | Post-launch V2 |
| Blog/content marketing | Post-launch V2 |

---

## 3. User Stories

| ID | Story | Points | Priority |
|----|-------|--------|----------|
| US-6.1 | As a user, when I visit a non-existent page, I want to see a branded 404 page with navigation links so I don't feel lost | 2 | P0 |
| US-6.2 | As a user, when an error occurs, I want to see a friendly error page with a way to go back | 2 | P0 |
| US-6.3 | As a search engine, I want to find sitemap.xml and robots.txt so I can index the site properly | 1 | P0 |
| US-6.4 | As a new user, after signup, I want to be guided through onboarding (store name, business type, template) so I can start selling quickly | 3 | P0 |
| US-6.5 | As a user, I want to update my profile (name, email, password) from settings so my account info is current | 2 | P0 |
| US-6.6 | As a new user, I want to receive a welcome email after signup so I know my account is ready | 2 | P0 |
| US-6.7 | As a paying customer, I want to download my invoice as PDF so I can expense it | 3 | P1 |
| US-6.8 | As a product owner, I want to see page views and conversion metrics so I can measure launch success | 2 | P1 |
| US-6.9 | As a user, I want to cancel my subscription easily so I don't feel trapped | 2 | P1 |
| US-6.10 | As a merchant, I want to set my business info (name, address, hours) so customers know about my store | 2 | P1 |
| US-6.11 | As a user, I want to see loading states and empty states so the app feels polished | 2 | P1 |
| US-6.12 | As a product owner, I want all critical flows tested end-to-end so I can launch with confidence | 5 | P0 |

**Total: 31 points**

---

## 4. Task Breakdown

### Week 1: Critical Infrastructure (Day 1-5)

#### Day 1-2: Error Handling + SEO

| Task | File(s) | Estimate |
|------|---------|----------|
| Create custom 404 page | `app/not-found.tsx` | 2h |
| Create error boundary | `app/error.tsx` | 2h |
| Create global error handler | `app/global-error.tsx` | 1h |
| Add loading states for dashboard pages | `app/dashboard/**/loading.tsx` | 3h |
| Create sitemap.ts | `app/sitemap.ts` | 1h |
| Create robots.ts | `app/robots.ts` | 0.5h |
| Add structured data (JSON-LD) to landing | `app/page.tsx` | 1h |
| Add OG image for landing | `app/opengraph-image.tsx` | 1h |
| Add metadata to all public pages | `app/**/page.tsx` | 2h |
| **Day 1-2 Total** | | **15.5h** |

#### Day 3: Onboarding Integration

| Task | File(s) | Estimate |
|------|---------|----------|
| Redirect to onboarding after signup | `app/(auth)/signup/page.tsx` | 1h |
| Add "skip" option to onboarding | `app/onboarding/page.tsx` | 0.5h |
| Add "add first product" step to onboarding | `app/onboarding/page.tsx` | 2h |
| Add onboarding completion tracking | `app/api/user/onboarding/route.ts` | 1h |
| Show onboarding progress in dashboard | `app/dashboard/page.tsx` | 1h |
| **Day 3 Total** | | **5.5h** |

#### Day 4-5: User Profile + Email

| Task | File(s) | Estimate |
|------|---------|----------|
| Create profile settings page | `app/dashboard/settings/profile/page.tsx` | 2h |
| Create profile update API | `app/api/user/profile/route.ts` | 1.5h |
| Add password change API | `app/api/user/password/route.ts` | 1h |
| Setup Resend/SendGrid for transactional email | `src/lib/email/` | 2h |
| Create welcome email template | `src/lib/email/templates/welcome.tsx` | 1h |
| Create invoice email template | `src/lib/email/templates/invoice.tsx` | 1h |
| Create password reset email template | `src/lib/email/templates/reset-password.tsx` | 0.5h |
| Integrate welcome email in signup flow | `app/api/auth/register/route.ts` | 0.5h |
| **Day 4-5 Total** | | **9.5h** |

### Week 2: Polish + Testing (Day 6-10)

#### Day 6-7: Billing + Invoices

| Task | File(s) | Estimate |
|------|---------|----------|
| Create invoice generation API | `app/api/billing/invoices/route.ts` | 2h |
| Create PDF invoice template | `src/lib/invoice/template.tsx` | 3h |
| Add invoice download to billing page | `app/dashboard/billing/page.tsx` | 1h |
| Create billing history page | `app/dashboard/billing/history/page.tsx` | 2h |
| Add subscription cancellation API | `app/api/billing/cancel/route.ts` | 1h |
| Add cancellation flow UI | `app/dashboard/billing/page.tsx` | 1h |
| **Day 6-7 Total** | | **10h** |

#### Day 8: Business Settings + Legal

| Task | File(s) | Estimate |
|------|---------|----------|
| Create business settings page | `app/dashboard/settings/business/page.tsx` | 2h |
| Create business settings API | `app/api/user/business/route.ts` | 1.5h |
| Add business info to storefront | `src/components/website/renderer.tsx` | 1h |
| Create refund policy page | `app/refund/page.tsx` | 1h |
| Add legal entity info to terms/privacy | `app/terms/page.tsx`, `app/privacy/page.tsx` | 0.5h |
| **Day 8 Total** | | **6h** |

#### Day 9: Analytics + Loading States

| Task | File(s) | Estimate |
|------|---------|----------|
| Setup Plausible or Vercel Analytics | `app/layout.tsx` | 0.5h |
| Add event tracking (page views, signup, purchase) | `src/lib/analytics/tracker.ts` | 2h |
| Add loading states to all dashboard pages | `app/dashboard/**/loading.tsx` | 3h |
| Add empty states to all list pages | `app/dashboard/**/page.tsx` | 2h |
| **Day 9 Total** | | **7.5h** |

#### Day 10: E2E Testing + Bug Fixes

| Task | File(s) | Estimate |
|------|---------|----------|
| Test: signup → onboarding → create product → receive order | Manual | 2h |
| Test: subscription upgrade → payment → invoice download | Manual | 2h |
| Test: domain purchase → DNS verification → active | Manual | 2h |
| Test: password reset flow | Manual | 1h |
| Test: error pages (404, 500) | Manual | 0.5h |
| Fix bugs found during testing | Various | 2.5h |
| **Day 10 Total** | | **10h** |

---

## 5. Database Migrations

### 5.1 Migration `021_user_profiles.sql`

```sql
-- 021_user_profiles.sql
-- Extend user profile with business info
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_hours JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;
```

### 5.2 Migration `022_invoices.sql`

```sql
-- 022_invoices.sql
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id VARCHAR(100) NOT NULL,           -- payment_reference dari domain_orders/subscriptions
  invoice_number VARCHAR(50) NOT NULL UNIQUE, -- INV-2026-0001
  amount INTEGER NOT NULL,                   -- IDR
  tax_amount INTEGER NOT NULL DEFAULT 0,
  total_amount INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'pending', 'failed', 'refunded')),
  invoice_type VARCHAR(20) NOT NULL CHECK (invoice_type IN ('subscription', 'domain')),
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  pdf_url TEXT,                              -- signed URL ke Supabase Storage
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoices_user ON invoices(user_id);
CREATE INDEX idx_invoices_order ON invoices(order_id);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own invoices" ON invoices
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 6. API Contracts

### 6.1 Profile API

```typescript
// GET /api/user/profile
// Response: { success: true, data: { name, email, phone, business_name, business_address, business_hours, logo_url } }

// PATCH /api/user/profile
// Body: { name?, phone?, business_name?, business_address?, business_hours?, logo_url? }
// Response: { success: true, data: UserProfile }

// POST /api/user/password
// Body: { current_password, new_password }
// Response: { success: true }
```

### 6.2 Invoice API

```typescript
// GET /api/billing/invoices
// Response: { success: true, data: Invoice[] }

// GET /api/billing/invoices/[id]/download
// Response: PDF file (application/pdf)

// POST /api/billing/invoices/generate
// Body: { order_id, invoice_type, amount, period_start, period_end }
// Response: { success: true, data: { invoice_number, pdf_url } }
```

### 6.3 Cancellation API

```typescript
// POST /api/billing/cancel
// Body: { reason?: string }
// Response: { success: true, data: { status: "canceled", effective_date } }
```

---

## 7. UI Specifications

### 7.1 404 Page

```
[404 Page]
- Illustration: lost/compass icon
- Title: "Halaman tidak ditemukan"
- Description: "Halaman yang Anda cari tidak ada atau sudah dipindahkan."
- CTA: "Kembali ke Beranda" → /
- CTA: "Ke Dashboard" → /dashboard (if authenticated)
```

### 7.2 Onboarding Flow (Updated)

```
[After Signup → Redirect to /onboarding]

Step 1: Store Name
- Input: "Nama Toko Anda"
- Preview: namatoko.umkm.id
- [Lanjut]

Step 2: Business Type
- 5 cards: Kuliner, Fashion, Kerajinan, Ritel, Jasa
- [Lanjut]

Step 3: Template Selection
- 5 template previews
- [Lanjut]

Step 4: Add First Product (NEW)
- Input: Nama produk, Harga, Stok
- [Lanjut] atau [Lewati dulu]

Step 5: Selesai!
- Show: store URL, copy link
- CTA: "Mulai Jualan" → /dashboard
```

### 7.3 Profile Settings Page

```
[/dashboard/settings/profile]
Section: Informasi Akun
- Nama: [input]
- Email: [input, read-only]
- Telepon: [input]
- [Simpan Perubahan]

Section: Keamanan
- Password Lama: [input]
- Password Baru: [input]
- Konfirmasi Password: [input]
- [Ubah Password]
```

### 7.4 Business Settings Page

```
[/dashboard/settings/business]
Section: Informasi Bisnis
- Nama Bisnis: [input]
- Alamat: [textarea]
- Jam Operasional: [day selector + time range]
- Logo: [file upload]
- [Simpan]
```

### 7.5 Invoice Download

```
[Billing Page → Riwayat]
Table:
| Invoice | Tanggal | Jumlah | Status | Aksi |
|---------|---------|--------|--------|------|
| INV-2026-0001 | 27 Sep 2026 | Rp 199.000 | Lunas | [Download PDF] |
```

---

## 8. File Structure (New Files)

```
app/
├── not-found.tsx                    # 404 page
├── error.tsx                        # Error boundary
├── global-error.tsx                 # Global error handler
├── sitemap.ts                       # Sitemap
├── robots.ts                       # Robots.txt
├── opengraph-image.tsx              # OG image
├── refund/
│   └── page.tsx                     # Refund policy
├── dashboard/
│   ├── settings/
│   │   ├── profile/
│   │   │   └── page.tsx             # Profile settings
│   │   └── business/
│   │       └── page.tsx             # Business settings
│   └── billing/
│       └── history/
│           └── page.tsx             # Billing history
├── api/
│   ├── user/
│   │   ├── profile/
│   │   │   └── route.ts             # Profile CRUD
│   │   ├── password/
│   │   │   └── route.ts             # Password change
│   │   ├── business/
│   │   │   └── route.ts             # Business settings
│   │   └── onboarding/
│   │       └── route.ts             # Onboarding tracking
│   └── billing/
│       ├── invoices/
│       │   └── route.ts             # Invoice list
│       ├── invoices/
│       │   └── [id]/
│       │       └── download/
│       │           └── route.ts     # PDF download
│       └── cancel/
│           └── route.ts             # Subscription cancellation

src/
├── lib/
│   ├── email/
│   │   ├── index.ts                 # Email service (Resend/SendGrid)
│   │   └── templates/
│   │       ├── welcome.tsx          # Welcome email
│   │       ├── invoice.tsx          # Invoice email
│   │       └── reset-password.tsx   # Password reset email
│   ├── invoice/
│   │   ├── template.tsx            # PDF invoice template
│   │   └── generate.ts              # PDF generation logic
│   └── analytics/
│       └── tracker.ts               # Event tracking
```

---

## 9. Dependencies

| Dependency | Owner | Status | Blocking Tasks |
|------------|-------|--------|----------------|
| Resend/SendGrid account | DevOps | 🔴 Needed | Email tasks |
| PDF generation library (pdfkit/react-pdf) | Dev | 🟡 Install | Invoice tasks |
| Plausible/Vercel Analytics | DevOps | 🟡 Setup | Analytics tasks |
| Legal entity info (company name, address) | Product | 🔴 Needed | Legal pages |

---

## 10. Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Email service setup takes longer | Medium | High | Use Supabase built-in email as fallback |
| PDF generation library issues | Low | Medium | Use simple HTML-to-PDF or external service |
| Onboarding flow breaks existing users | Low | High | Feature flag: only show for new users |
| Scope creep | High | Medium | Strict "no new features" policy for this sprint |

---

## 11. Acceptance Criteria

### 11.1 Error Handling
- [ ] Visiting `/non-existent-page` shows branded 404 with navigation links
- [ ] API errors show friendly error pages, not raw JSON
- [ ] All dashboard pages have loading states
- [ ] All list pages have empty states with CTAs

### 11.2 SEO
- [ ] `/sitemap.xml` returns valid sitemap with all public pages
- [ ] `/robots.txt` allows all crawlers
- [ ] Landing page has structured data (JSON-LD)
- [ ] OG image generated for landing page
- [ ] All public pages have proper metadata

### 11.3 Onboarding
- [ ] New signup redirects to `/onboarding`
- [ ] Onboarding has 4 steps: store name, business type, template, first product
- [ ] "Skip" option available
- [ ] Completion tracked in DB
- [ ] Dashboard shows onboarding progress for incomplete users

### 11.4 Profile + Email
- [ ] User can update name, phone from settings
- [ ] User can change password from settings
- [ ] Welcome email sent after signup
- [ ] Password reset email works
- [ ] Invoice email sent after payment

### 11.5 Billing
- [ ] Invoice generated after subscription payment
- [ ] Invoice generated after domain purchase
- [ ] PDF download works
- [ ] Billing history page shows all invoices
- [ ] Subscription cancellation works

### 11.6 Business Settings
- [ ] User can set business name, address, hours
- [ ] Business info shows on storefront
- [ ] Logo upload works

### 11.7 Analytics
- [ ] Page views tracked
- [ ] Signup events tracked
- [ ] Purchase events tracked
- [ ] Dashboard shows analytics data

### 11.8 Legal
- [ ] Refund policy page exists
- [ ] Terms include legal entity info
- [ ] Privacy policy includes legal entity info

### 11.9 Testing
- [ ] Signup → onboarding → create product → receive order works
- [ ] Subscription upgrade → payment → invoice download works
- [ ] Domain purchase → DNS verification → active works
- [ ] Password reset flow works
- [ ] Error pages work

---

## 12. Rollout Plan

| Day | Milestone |
|-----|-----------|
| Day 2 | Error pages + SEO live |
| Day 3 | Onboarding integrated |
| Day 5 | Profile + Email live |
| Day 7 | Invoices + Cancellation live |
| Day 8 | Business settings + Legal live |
| Day 9 | Analytics + Polish live |
| Day 10 | Testing complete → **READY TO LAUNCH** |

---

## 13. Launch Checklist

- [ ] Error pages (404, 500) live
- [ ] Sitemap + robots.txt live
- [ ] Onboarding flow integrated
- [ ] Profile settings working
- [ ] Transactional email working
- [ ] Invoice generation working
- [ ] Business settings working
- [ ] Analytics tracking live
- [ ] Legal pages complete
- [ ] All critical flows tested
- [ ] Beta users invited
- [ ] **LAUNCH!**

---

## 14. Next Actions

1. **Install dependencies**: `npm install resend pdfkit @react-pdf/renderer`
2. **Setup Resend account** → get API key
3. **Create Supabase Storage bucket** → `invoices` (private)
4. **Get legal entity info** → company name, address, registration number
5. **Assign developer** → kickoff Day 1 (Error pages + SEO)

---

*End of Sprint 6 Plan — Road to Launch*
