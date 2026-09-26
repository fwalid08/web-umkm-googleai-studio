# Master Sprint Timeline & Dependencies
**Total Duration:** ~14.5 weeks (3.5 months)  
**Team Size Assumption:** 2-3 developers (1 backend, 1 frontend, 1 fullstack)  
**Start Date:** Week 1, October 2026

---

## Sprint Overview

| Sprint | Theme | Duration | Weeks | Priority | Dependencies |
|--------|-------|----------|-------|----------|--------------|
| **Sprint 1** | Products Management | 2 weeks | 1-2 | P0 | None (can start immediately) |
| **Sprint 2** | Custom Domain Real Integration | 2 weeks | 3-4 | P0 | Sprint 4 (tier limits) |
| **Sprint 3** | WA Notifications | 1 week | 5 | P0 | Sprint 1 (orders exist) |
| **Sprint 4** | Remove Trial + Free Tier Limits | 1 week | 5 | P0 | None (can run parallel) |
| **Sprint 5** | Multi-page CMS | 2 weeks | 6-7 | P1 | Sprint 1 (products), Sprint 4 (tier limits) |
| **Sprint 6** | Invoice Generation | 1.5 weeks | 8 | P1 | Sprint 1 (orders), Sprint 3 (notifications) |
| **Sprint 7** | Stock/Inventory | 1.5 weeks | 9 | P1 | Sprint 1 (products) |
| **Sprint 8** | Builder Enhancements | 2 weeks | 10-11 | P1 | Sprint 1, Sprint 5 (pages) |
| **Sprint 9** | Realtime + i18n | 1.5 weeks | 12 | P2 | Sprint 1, Sprint 3, Sprint 5 |

---

## Dependency Graph

```
                    ┌─────────────────┐
                    │   Sprint 1      │
                    │  Products Mgmt  │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
       ┌────────────┐ ┌────────────┐ ┌────────────┐
       │ Sprint 3   │ │ Sprint 5   │ │ Sprint 7   │
       │ WA Notif   │ │ Multi-page │ │ Stock/Inv  │
       └─────┬──────┘ └─────┬──────┘ └─────┬──────┘
             │              │              │
             ▼              ▼              ▼
       ┌────────────┐ ┌────────────┐ ┌────────────┐
       │ Sprint 6   │ │ Sprint 8   │ │            │
       │ Invoices   │ │ Builder    │ │            │
       └─────┬──────┘ └─────┬──────┘ └────────────┘
             │              │
             ▼              ▼
       ┌────────────────────────────┐
       │        Sprint 9            │
       │    Realtime + i18n         │
       └────────────────────────────┘
              ▲
              │
       ┌──────┴──────┐
       │ Sprint 4    │
       │ Remove Trial│
       │ (Parallel)  │
       └─────────────┘
```

---

## Detailed Week-by-Week Plan

### Phase 1: Foundation (Weeks 1-2)
**Goal:** Core product management working

| Week | Sprint | Focus | Deliverables |
|------|--------|-------|--------------|
| 1 | Sprint 1 | DB Migration + API | Products table, CRUD API, RLS, Storage bucket |
| 2 | Sprint 1 | UI + Integration | Product manager page, Builder integration, Public storefront stock badges |

**Parallel:** Sprint 4 (Remove Trial) can start Week 1 by different dev

### Phase 2: Revenue Features (Weeks 3-5)
**Goal:** Real domain sales + notifications

| Week | Sprint | Focus | Deliverables |
|------|--------|-------|--------------|
| 3 | Sprint 2 | Porkbun + Midtrans | Domain search, checkout, webhook, registration |
| 4 | Sprint 2 | Vercel + DNS | Auto-provision, verification cron, renewal reminders |
| 5 | Sprint 3 | Fonnte + Dispatcher | WA gateway, order notifications, preferences UI, retry logic |

**Note:** Sprint 4 (Remove Trial) runs Week 5 parallel

### Phase 3: Content & Commerce (Weeks 6-9)
**Goal:** Complete CMS + invoicing + inventory

| Week | Sprint | Focus | Deliverables |
|------|--------|-------|--------------|
| 6 | Sprint 5 | Pages DB + API | Pages table, CRUD API, public routes, default pages |
| 7 | Sprint 5 | UI + Builder | Page manager, rich text editor, navigation section |
| 8 | Sprint 6 | PDF + Email | Invoice generator, SendGrid, dashboard, monthly summary |
| 9 | Sprint 7 | Stock + Variants | Stock fields, variants, atomic decrement, movements, alerts |

### Phase 4: Polish & Scale (Weeks 10-12)
**Goal:** Better builder + realtime + international

| Week | Sprint | Focus | Deliverables |
|------|--------|-------|--------------|
| 10 | Sprint 8 | Drag-drop + Header/Footer | @dnd-kit integration, header/footer editor, template preview |
| 11 | Sprint 8 | Undo/redo + Custom sections | History hook, custom HTML/embed sections, device visibility |
| 12 | Sprint 9 | Realtime + i18n | Supabase Realtime hooks, locale routing, translations, currency |

---

## Resource Allocation (2-3 Devs)

### Option A: 2 Developers
| Developer | Week 1-2 | Week 3-4 | Week 5 | Week 6-7 | Week 8 | Week 9 | Week 10-11 | Week 12 |
|-----------|----------|----------|--------|----------|--------|--------|------------|---------|
| Dev 1 (Backend) | Sprint 1 API | Sprint 2 API | Sprint 3 API | Sprint 5 API | Sprint 6 API | Sprint 7 API | Sprint 8 API | Sprint 9 API |
| Dev 2 (Frontend) | Sprint 1 UI | Sprint 2 UI | Sprint 3 UI | Sprint 5 UI | Sprint 6 UI | Sprint 7 UI | Sprint 8 UI | Sprint 9 UI |

**Risk:** Bottleneck on shared tasks (migrations, integration testing)

### Option B: 3 Developers (Recommended)
| Developer | Week 1-2 | Week 3-4 | Week 5 | Week 6-7 | Week 8 | Week 9 | Week 10-11 | Week 12 |
|-----------|----------|----------|--------|----------|--------|--------|------------|---------|
| Dev 1 (Backend) | Sprint 1 | Sprint 2 | Sprint 3 | Sprint 5 | Sprint 6 | Sprint 7 | Sprint 8 | Sprint 9 |
| Dev 2 (Frontend) | Sprint 1 | Sprint 2 | Sprint 3 | Sprint 5 | Sprint 6 | Sprint 7 | Sprint 8 | Sprint 9 |
| Dev 3 (Fullstack) | Sprint 4 | Sprint 2/3 | Sprint 4 | Sprint 5/6 | Sprint 6/7 | Sprint 7/8 | Sprint 8/9 | Sprint 9 |

**Dev 3** floats to unblock, writes tests, handles migrations, integration.

---

## Migration Schedule

| Migration | Sprint | Run Week | Notes |
|-----------|--------|----------|-------|
| 015_remove_trial_system.sql | Sprint 4 | Week 5 | Run first (affects tier logic) |
| 016_create_products.sql | Sprint 1 | Week 1 | Foundation |
| 017_product_images.sql | Sprint 1 | Week 1 | Storage bucket |
| 018_create_pages.sql | Sprint 5 | Week 6 | After products |
| 019_create_invoices.sql | Sprint 6 | Week 8 | After orders |
| 020_notification_logs.sql | Sprint 3 | Week 5 | Before dispatcher |
| 020b_notification_prefs.sql | Sprint 3 | Week 5 | |
| 021_product_variants.sql | Sprint 7 | Week 9 | After products |
| 022_stock_movements.sql | Sprint 7 | Week 9 | |
| 023_add_stock_to_products.sql | Sprint 7 | Week 9 | |
| 023b_stock_rpc.sql | Sprint 7 | Week 9 | |
| 024_update_domain_orders.sql | Sprint 2 | Week 3 | Before domain API |
| 025_product_translations.sql | Sprint 9 | Week 12 | Last |

---

## Environment Variables Checklist

### Required for Production
```bash
# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Auth (NextAuth)
NEXTAUTH_SECRET=
NEXTAUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Billing (Midtrans)
MIDTRANS_SERVER_KEY=
MIDTRANS_CLIENT_KEY=
MIDTRANS_IS_PRODUCTION=false
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=

# Domains (Porkbun)
PORKBUN_API_KEY=
PORKBUN_API_SECRET=
PORKBUN_SANDBOX=true

# Vercel (Domain Provisioning)
VERCEL_TOKEN=
VERCEL_TEAM_ID=

# WA Gateway (Fonnte)
NOTIF_PROVIDER=fonnte
NOTIF_API_KEY=
NOTIF_SENDER_ID=

# Email (SendGrid)
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=noreply@umkm.id

# App
NEXT_PUBLIC_APP_URL=https://umkm.id
CRON_SECRET=
ALLOW_DEMO_AUTH=false
```

---

## Testing Strategy

| Sprint | Unit Tests | Integration Tests | E2E Tests | Manual QA |
|--------|------------|-------------------|-----------|-----------|
| 1 | API routes, limit checks | Product CRUD + RLS | Add/edit/delete products | ✅ |
| 2 | Porkbun client, webhook | Domain purchase flow | Search → Buy → Verify | ✅ |
| 3 | Dispatcher, retry logic | Order → WA notification | Place order → receive WA | ✅ |
| 4 | Tier limit helpers | Registration → Free tier | Register → check limits | ✅ |
| 5 | Page CRUD, slug gen | Page create → public view | Create page → visit URL | ✅ |
| 6 | PDF generation, QRIS | Order complete → invoice | Complete order → get email | ✅ |
| 7 | Stock decrement RPC | Order → stock check | Order with low stock | ✅ |
| 8 | Drag-drop, history | Builder → preview | Reorder → save → view | ✅ |
| 9 | Realtime hooks, i18n | Live dashboard, EN store | Open 2 tabs → sync | ✅ |

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Porkbun API changes | Low | High | Abstract behind interface; mock for tests |
| Fonnte delivery failures | Medium | Medium | Retry + dead letter queue; email fallback |
| Supabase Realtime costs | Medium | Medium | Monitor usage; disable non-critical tables |
| Migration data loss | Low | Critical | Backup before each; test on staging; rollback scripts |
| Vercel API rate limits | Low | High | Queue domain provisions; exponential backoff |
| PDF generation memory | Low | Medium | Stream PDF; limit concurrent generations |
| i18n content gaps | Medium | Low | Fallback to Indonesian; show "Translation missing" badge |

---

## Go-Live Checklist

### Pre-Launch (Week 12-13)
- [ ] All migrations run on production
- [ ] Environment variables set in Vercel
- [ ] Porkbun production keys configured
- [ ] Fonnte production account verified
- [ ] SendGrid domain authenticated
- [ ] Midtrans production mode enabled
- [ ] Vercel team domain provisioning tested
- [ ] SSL certificates for custom domains working
- [ ] Load test: 100 concurrent users
- [ ] Security audit: RLS, CSP, rate limits
- [ ] Backup strategy documented
- [ ] Rollback procedures tested

### Launch Week
- [ ] Deploy to production
- [ ] Smoke test all critical paths
- [ ] Monitor error rates (Sentry)
- [ ] Monitor Realtime connections
- [ ] Monitor Midtrans webhook success rate
- [ ] Monitor Fonnte delivery rate
- [ ] Customer support ready for inquiries

### Post-Launch (Week 14+)
- [ ] Weekly metrics review (WAM, conversion, churn)
- [ ] User feedback collection
- [ ] Bug triage & hotfix process
- [ ] Plan next quarter features

---

## Success Metrics Tracking

| Metric | Baseline | Target (Month 3) | Target (Month 6) |
|--------|----------|------------------|------------------|
| Weekly Active Merchants | 0 | 200 | 500 |
| Free → Paid Conversion | N/A | 8% | 12% |
| Domain Attach Rate (Paid) | 0% | 30% | 40% |
| Order Notification Delivery | 0% | 99.5% | 99.9% |
| Invoice Generation Success | 0% | 99.9% | 99.9% |
| Avg Dashboard Load Time | N/A | < 2s | < 1.5s |
| Storefront LCP (ID) | N/A | < 2.5s | < 2s |
| Storefront LCP (EN) | N/A | < 3s | < 2.5s |

---

## Next Steps After Sprint 9

### Quarter 2 Priorities (Post-Launch)
1. **Customer App** - PWA for buyers to track orders
2. **Multi-location Inventory** - Warehouse management
3. **Subscription Products** - Recurring orders
4. **Affiliate/Reseller Program** - Commission tracking
5. **Advanced Analytics** - Cohort, LTV, churn prediction
6. **API for Integrations** - Webhooks, Zapier, Make
7. **Mobile App (React Native)** - Merchant dashboard
8. **AI Features** - Product description generator, chat support

---

*Document Version: 1.0*  
*Last Updated: September 2026*  
*Owner: Senior SaaS Product Architect*