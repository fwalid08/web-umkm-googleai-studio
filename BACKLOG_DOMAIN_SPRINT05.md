# Backlog: Domain Feature — Sprint 5
**Sprint:** 5 (Multi-page Website Builder + Domain Polish)  
**Duration:** 1 week (5 working days)  
**Goal:** Polish domain feature untuk production-ready: native .id registrar, compliance document upload, DNS management UI, transfer-in flow.

---

## 1. Current State (Sprint 2 — Already Done)

| Component | Status | Location |
|-----------|--------|----------|
| Domain search API | ✅ Done | `app/api/domains/search/route.ts` |
| Domain checkout + payment | ✅ Done | `app/api/domains/checkout/route.ts` |
| Payment webhook → registration | ✅ Done | `app/api/domains/webhook/route.ts` |
| Registration orchestrator | ✅ Done | `src/lib/domains/register.ts` |
| Porkbun registrar driver | ✅ Done | `src/lib/registrar/porkbun.ts` |
| DomainNameAPI driver | ✅ Done | `src/lib/registrar/domainnameapi.ts` |
| DNS verification (TXT) | ✅ Done | `app/api/domains/verify/route.ts` |
| Auto-renew cron | ✅ Done | `app/api/domains/auto-renew/route.ts` |
| Renewal reminders cron | ✅ Done | `app/api/domains/renewal-reminders/route.ts` |
| Tier gating (Free/Starter+) | ✅ Done | `src/lib/billing/limits.ts` → `checkCustomDomainLimit` |
| Domain orders table + RLS | ✅ Done | `supabase/migrations/008_domain_orders.sql` + `020_domain_orders_reconcile.sql` |
| Dashboard domain page | ✅ Done | `app/dashboard/domain/page.tsx` |
| Domain orders management page | ✅ Done | `app/dashboard/settings/domains/page.tsx` |

---

## 2. User Stories

| ID | Story | Points | Priority |
|----|-------|--------|----------|
| US-5.1 | As a merchant, I want to register `.id` / `.co.id` / `.web.id` domains via native Indonesian registrar (Qwords/IDNIC) so my domain is compliant with local regulations | 5 | **P0** |
| US-5.2 | As a merchant, I want to upload KTP/NPWP documents during .id registration so the registrar can verify my identity | 5 | **P0** |
| US-5.3 | As a merchant, I want to view and manage DNS records (A, CNAME, TXT, MX) for my domain from the dashboard so I don't need to login to registrar | 3 | **P1** |
| US-5.4 | As a merchant, I want to transfer my existing domain from another registrar to our platform so I can manage everything in one place | 3 | **P1** |
| US-5.5 | As a merchant, I want to search and register multiple domains at once so I can secure brand variations efficiently | 2 | **P2** |
| US-5.6 | As a system, I want to sync premium domain pricing daily from registrar so prices are always accurate | 2 | **P2** |
| US-5.7 | As a merchant, I want to toggle WHOIS privacy for my domain so I can control my personal information visibility | 2 | **P2** |

**Total: 22 points** (P0: 10, P1: 6, P2: 6)

---

## 3. Functional Requirements

### 3.1 Native .id Registrar (Qwords/IDNIC) — P0

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| DOM-1.1 | New registrar driver `QwordsProvider` implementing `RegistrarProvider` interface | Factory `createRegistrarProviderFromEnv("qwords")` returns instance without error |
| DOM-1.2 | Qwords API integration: `checkAvailability`, `registerDomain`, `renewDomain`, `getDomainInfo`, `setDnsRecords` | All methods return correct response format per `RegistrarProvider` types |
| DOM-1.3 | TLD catalog update: `.id`, `.co.id`, `.web.id`, `.or.id`, `.ac.id`, `.sch.id`, `.my.id`, `.biz.id` → `buyable: true` | Search API returns these TLDs with `available: true/false` and real pricing |
| DOM-1.4 | Registrar auto-routing: `.id` TLDs → Qwords, global TLDs → Porkbun | `getRegistrarProvider()` returns correct driver based on TLD being queried |
| DOM-1.5 | Qwords sandbox mode for testing | `QWORDS_SANDBOX=true` uses OTE endpoint, `false` uses production |

### 3.2 Document Upload for .id Compliance — P0

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| DOM-2.1 | Supabase Storage bucket `domain-documents` (private) | Bucket exists with RLS: owner can upload/read, others denied |
| DOM-2.2 | Document upload API `POST /api/domains/documents` | Accepts `file` (PDF/JPG/PNG, max 5MB), `type` (`ktp`|`npwp`|`siup`|`akta`), `domain_order_id` |
| DOM-2.3 | Document status tracking: `pending` → `verified` | Admin/registrar webhook can update status |
| DOM-2.4 | Checkout flow: if TLD requires documents and none uploaded → prompt upload before payment | UI shows document upload step in checkout flow for `.id` domains |
| DOM-2.5 | Document list API `GET /api/domains/documents?domain_order_id=` | Returns documents with status, upload date, file URL (signed, 1 hour TTL) |

### 3.3 DNS Management UI — P1

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| DOM-3.1 | DNS records list page `/dashboard/domain/dns/[domain]` | Shows A, CNAME, TXT, MX records from registrar |
| DOM-3.2 | Add DNS record API `POST /api/domains/[id]/dns` | Body: `{ type, name, value, ttl?, priority? }` → calls registrar `setDnsRecords` |
| DOM-3.3 | Delete DNS record API `DELETE /api/domains/[id]/dns/[recordId]` | Removes record from registrar |
| DOM-3.4 | Update DNS record API `PATCH /api/domains/[id]/dns/[recordId]` | Updates record in registrar |
| DOM-3.5 | DNS propagation status indicator | Shows "Propagating" → "Active" based on TTL + time since update |

### 3.4 Domain Transfer-In — P1

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| DOM-4.1 | Transfer initiation API `POST /api/domains/transfer` | Body: `{ domain, epp_code }` → creates order with status `transfer_in` |
| DOM-4.2 | Transfer status tracking | Polling endpoint returns transfer progress |
| DOM-4.3 | Transfer completion webhook | Registrar webhook updates order to `active` on success |
| DOM-4.4 | Transfer UI in dashboard | Form to input domain + EPP code, status display |

### 3.5 Bulk Operations — P2

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| DOM-5.1 | Bulk search API `POST /api/domains/bulk-search` | Body: `{ domains: string[] }` (max 50) → returns availability for each |
| DOM-5.2 | Bulk register API `POST /api/domains/bulk-register` | Body: `{ domains: string[], years: number }` → creates multiple orders + single payment |

### 3.6 Premium Pricing Sync — P2

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| DOM-6.1 | Daily cron job fetches pricing from all active registrars | Runs at 02:00 UTC, stores in `domain_pricing_cache` table |
| DOM-6.2 | Search API uses cached pricing when registrar API is slow/unavailable | Fallback to cache with `warning: "Harga estimasi"` flag |

### 3.7 WHOIS Privacy Toggle — P2

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| DOM-7.1 | Toggle API `PATCH /api/domains/[id]/whois-privacy` | Body: `{ enabled: boolean }` → calls registrar `setWhoisPrivacy` |
| DOM-7.2 | UI toggle in domain settings | Switch component in domain management page |

---

## 4. Database Migrations

### 4.1 Migration `021_domain_documents.sql`

```sql
-- 021_domain_documents.sql
CREATE TABLE IF NOT EXISTS domain_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_order_id UUID NOT NULL REFERENCES domain_orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_type VARCHAR(20) NOT NULL CHECK (document_type IN ('ktp', 'npwp', 'siup', 'akta')),
  file_path TEXT NOT NULL,              -- path di Supabase Storage
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_domain_documents_order ON domain_documents(domain_order_id);
CREATE INDEX idx_domain_documents_user ON domain_documents(user_id);
CREATE INDEX idx_domain_documents_status ON domain_documents(status) WHERE status = 'pending';

ALTER TABLE domain_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own documents" ON domain_documents
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger updated_at
CREATE TRIGGER update_domain_documents_updated_at
  BEFORE UPDATE ON domain_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 4.2 Migration `022_domain_pricing_cache.sql`

```sql
-- 022_domain_pricing_cache.sql
CREATE TABLE IF NOT EXISTS domain_pricing_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tld VARCHAR(20) NOT NULL,
  registrar VARCHAR(50) NOT NULL,
  registration_price INTEGER NOT NULL,   -- IDR
  renewal_price INTEGER NOT NULL,       -- IDR
  transfer_price INTEGER,               -- IDR, nullable
  premium_registration_price INTEGER,   -- IDR, nullable
  currency VARCHAR(3) NOT NULL DEFAULT 'IDR',
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  UNIQUE (tld, registrar)
);

CREATE INDEX idx_pricing_cache_tld ON domain_pricing_cache(tld);
CREATE INDEX idx_pricing_cache_expires ON domain_pricing_cache(expires_at);
```

### 4.3 Migration `023_domain_dns_records.sql`

```sql
-- 023_domain_dns_records.sql
CREATE TABLE IF NOT EXISTS domain_dns_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_order_id UUID NOT NULL REFERENCES domain_orders(id) ON DELETE CASCADE,
  record_type VARCHAR(10) NOT NULL CHECK (record_type IN ('A', 'CNAME', 'TXT', 'MX', 'NS')),
  name VARCHAR(255) NOT NULL,
  value TEXT NOT NULL,
  ttl INTEGER NOT NULL DEFAULT 3600,
  priority INTEGER,                     -- untuk MX
  registrar_record_id VARCHAR(100),     -- ID dari registrar
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dns_records_order ON domain_dns_records(domain_order_id);

ALTER TABLE domain_dns_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own dns records" ON domain_dns_records
  FOR SELECT TO authenticated
  USING (
    domain_order_id IN (
      SELECT id FROM domain_orders WHERE user_id = auth.uid()
    )
  );

CREATE TRIGGER update_domain_dns_records_updated_at
  BEFORE UPDATE ON domain_dns_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 5. API Contracts

### 5.1 Qwords Registrar Config

```typescript
// src/lib/registrar/types.ts — extend RegistrarProviderType
export type RegistrarProviderType = "porkbun" | "domainnameapi" | "qwords" | "mock";

// src/lib/registrar/qwords.ts
export interface QwordsConfig extends RegistrarConfig {
  resellerId: string;
  apiKey: string;
  isTest: boolean;  // OTE sandbox vs production
}

export class QwordsProvider implements RegistrarProvider {
  readonly id = "qwords";
  readonly name = "Qwords";
  readonly capabilities: RegistrarCapabilities = {
    supportedTlds: ["id", "co.id", "web.id", "or.id", "ac.id", "sch.id", "my.id", "biz.id"],
    supportsDnsManagement: true,
    supportsAutoRenew: true,
    supportsTransfer: true,
    supportsWhoisPrivacy: false,  // .id tidak support WHOIS privacy
    priceIncludesIcannFee: true,
  };
  // ... implement methods
}
```

### 5.2 Document Upload API

```typescript
// POST /api/domains/documents
// Content-Type: multipart/form-data
// Body: file, document_type, domain_order_id
// Response: { success: true, data: { id, status, file_name } }

// GET /api/domains/documents?domain_order_id=uuid
// Response: { success: true, data: Document[] }
```

### 5.3 DNS Management API

```typescript
// GET /api/domains/[id]/dns
// Response: { success: true, data: DnsRecord[] }

// POST /api/domains/[id]/dns
// Body: { type, name, value, ttl?, priority? }
// Response: { success: true, data: DnsRecord }

// PATCH /api/domains/[id]/dns/[recordId]
// Body: Partial<DnsRecord>
// Response: { success: true, data: DnsRecord }

// DELETE /api/domains/[id]/dns/[recordId]
// Response: { success: true }
```

### 5.4 Transfer-In API

```typescript
// POST /api/domains/transfer
// Body: { domain, epp_code }
// Response: { success: true, data: { order_id, status: "transfer_in" } }

// GET /api/domains/transfer/[orderId]/status
// Response: { success: true, data: { status, progress, message } }
```

---

## 6. UI Specifications

### 6.1 Document Upload Component (Checkout Flow)

```
[Checkout Flow untuk .id domain]
Step 1: Search domain → pilih .id domain
Step 2: Upload dokumen (KTP/NPWP) ← NEW
  - Drag & drop area atau file picker
  - Accepted: PDF, JPG, PNG (max 5MB)
  - Preview thumbnail
  - Status: "Mengunggah..." → "Terunggah ✓"
Step 3: Review & Payment
Step 4: Confirmation
```

### 6.2 DNS Management Page

```
[/dashboard/domain/dns/[domain]]
Header: DNS Records for tokoku.id
[Add Record Button]

Table:
| Type | Name | Value | TTL | Priority | Status | Actions |
|------|------|-------|-----|----------|--------|---------|
| A | @ | 76.76.21.21 | 3600 | — | Active | Edit Delete |
| CNAME | www | cname.vercel-dns.com. | 3600 | — | Active | Edit Delete |
| TXT | _saas-verify | saas-verify-abc123 | 300 | — | Propagating | Edit Delete |

[Add Record Modal]
- Type: [A ▼]
- Name: [@]
- Value: [____________]
- TTL: [3600]
- Priority: [10] (only for MX)
[Cancel] [Save]
```

### 6.3 Transfer-In Page

```
[/dashboard/domain/transfer]
Header: Transfer Domain ke Kami
Description: Pindahkan domain Anda dari registrar lain ke platform kami.

Form:
- Domain: [tokoku.com]
- EPP Code / Auth Code: [____________]
[Transfer Domain]

Status Section (jika ada transfer aktif):
| Domain | Status | Progress | Started |
|--------|--------|----------|---------|
| tokoku.com | Transferring | 60% | 27 Sep 2026 |
```

---

## 7. Task Breakdown

| Task | File(s) | Estimate | Depends On |
|------|---------|----------|------------|
| **P0: Native .id Registrar** | | | |
| 1. Create Qwords registrar driver | `src/lib/registrar/qwords.ts` | 1.5h | — |
| 2. Register Qwords in factory | `src/lib/registrar/factory.ts` | 0.5h | Task 1 |
| 3. Update TLD catalog (.id buyable) | `src/lib/domains/catalog.ts` | 0.5h | — |
| 4. Registrar auto-routing by TLD | `src/lib/registrar/factory.ts` | 1h | Task 1, 2 |
| 5. Qwords sandbox config | `.env.example` | 0.5h | Task 1 |
| **P0: Document Upload** | | | |
| 6. Migration 021 (domain_documents) | `supabase/migrations/021_domain_documents.sql` | 0.5h | — |
| 7. Storage bucket + RLS | Supabase Dashboard / SQL | 0.5h | Task 6 |
| 8. Document upload API | `app/api/domains/documents/route.ts` | 1.5h | Task 6, 7 |
| 9. Document list API | `app/api/domains/documents/route.ts` | 0.5h | Task 8 |
| 10. Checkout flow integration (upload step) | `app/api/domains/checkout/route.ts` + UI | 1.5h | Task 8, 9 |
| **P1: DNS Management UI** | | | |
| 11. Migration 023 (domain_dns_records) | `supabase/migrations/023_domain_dns_records.sql` | 0.5h | — |
| 12. DNS records list API | `app/api/domains/[id]/dns/route.ts` | 1h | Task 11 |
| 13. DNS record CRUD API | `app/api/domains/[id]/dns/route.ts` + `[recordId]/route.ts` | 1.5h | Task 12 |
| 14. DNS management UI page | `app/dashboard/domain/dns/[domain]/page.tsx` | 1.5h | Task 12, 13 |
| **P1: Transfer-In** | | | |
| 15. Transfer initiation API | `app/api/domains/transfer/route.ts` | 1h | — |
| 16. Transfer status API | `app/api/domains/transfer/[orderId]/status/route.ts` | 0.5h | Task 15 |
| 17. Transfer UI page | `app/dashboard/domain/transfer/page.tsx` | 1h | Task 15, 16 |
| **P2: Bulk Operations** | | | |
| 18. Bulk search API | `app/api/domains/bulk-search/route.ts` | 0.5h | — |
| 19. Bulk register API | `app/api/domains/bulk-register/route.ts` | 1h | Task 18 |
| **P2: Premium Pricing Sync** | | | |
| 20. Migration 022 (pricing cache) | `supabase/migrations/022_domain_pricing_cache.sql` | 0.5h | — |
| 21. Pricing sync cron | `supabase/functions/cron-domain-pricing-sync/` | 1.5h | Task 20 |
| 22. Search API fallback to cache | `app/api/domains/search/route.ts` | 0.5h | Task 21 |
| **P2: WHOIS Privacy** | | | |
| 23. WHOIS privacy toggle API | `app/api/domains/[id]/whois-privacy/route.ts` | 0.5h | — |
| 24. WHOIS privacy UI toggle | `app/dashboard/settings/domains/page.tsx` | 0.5h | Task 23 |
| **Testing** | | | |
| 25. Integration test: Qwords driver | `src/lib/registrar/qwords.test.ts` | 1h | Task 1 |
| 26. Integration test: Document upload | `tests/domains/documents.test.ts` | 1h | Task 8 |
| 27. Integration test: DNS CRUD | `tests/domains/dns.test.ts` | 1h | Task 13 |
| 28. E2E test: .id checkout flow | `tests/domains/e2e-id-checkout.test.ts` | 1.5h | Task 10 |

**Total: ~22 hours (~4.5 days)**

---

## 8. Dependencies

| Dependency | Owner | Status | Blocking Tasks |
|------------|-------|--------|----------------|
| Qwords API credentials (reseller ID + API key) | Product/BizDev | 🔴 Needed | Task 1-5 |
| Qwords API documentation | Product/BizDev | 🔴 Needed | Task 1 |
| IDNIC compliance requirements (.id) | Legal | 🔴 Needed | Task 6-10 |
| Supabase Storage bucket creation | DevOps | 🟡 Can do now | Task 7 |
| Midtrans/Xendit payment for .id | Product | 🟢 Ready | — |

---

## 9. Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Qwords API docs unclear / different from standard | Medium | High | Request sandbox access early; build adapter pattern for API differences |
| IDNIC compliance changes | Low | High | Build document abstraction — support multiple document types |
| Registrar API downtime during checkout | Medium | Medium | Pricing cache fallback; graceful error handling |
| DNS propagation delays confuse users | Medium | Low | Clear "Propagating" status indicator; educational tooltip |
| Transfer-in takes 5-7 days (ICANN rule) | High | Low | Set clear expectations in UI; status tracking |

---

## 10. Acceptance Criteria

### 10.1 Native .id Registrar
- [ ] Search `.id` domain → returns real availability + pricing from Qwords
- [ ] Register `.id` domain → order created, document upload prompted, domain registered after verification
- [ ] Renew `.id` domain → Qwords API called, expiry extended
- [ ] Sandbox mode works for testing without real registration

### 10.2 Document Upload
- [ ] User can upload KTP/NPWP during .id checkout
- [ ] Document stored in Supabase Storage (private bucket)
- [ ] Document status tracked: pending → verified/rejected
- [ ] User can view uploaded documents in order detail

### 10.3 DNS Management
- [ ] User can view all DNS records for their domain
- [ ] User can add A/CNAME/TXT/MX records
- [ ] User can edit existing records
- [ ] User can delete records
- [ ] Changes reflect in registrar within 60 seconds

### 10.4 Transfer-In
- [ ] User can initiate transfer with EPP code
- [ ] Transfer status tracked and displayed
- [ ] Domain becomes active after transfer completes

### 10.5 Bulk Operations
- [ ] User can search up to 50 domains at once
- [ ] User can register multiple domains in one checkout

### 10.6 Premium Pricing
- [ ] Daily cron syncs pricing from registrars
- [ ] Search falls back to cached pricing when registrar API unavailable

### 10.7 WHOIS Privacy
- [ ] User can toggle WHOIS privacy for supported TLDs
- [ ] Toggle reflects in registrar

---

## 11. Rollout Plan

| Phase | Scope | Timeline |
|-------|-------|----------|
| **Phase 1** | P0: Qwords driver + Document upload | Day 1-3 |
| **Phase 2** | P1: DNS Management + Transfer-in | Day 3-4 |
| **Phase 3** | P2: Bulk + Premium sync + WHOIS | Day 4-5 |
| **Phase 4** | Testing + Bug fixes | Day 5 |

---

## 12. Open Questions

1. **Qwords vs Niagahoster vs Rumahweb?** — Need to decide which Indonesian registrar to integrate first. Qwords has API docs publicly available; Niagahoster/Rumahweb may require partnership.
2. **Document verification flow** — Who verifies documents? Manual admin review or automated via registrar API?
3. **Transfer-in pricing** — Charge for transfer? Include 1 year renewal?
4. **Bulk discount** — Offer discount for 3+ domains registered together?
5. **WHOIS privacy for .id** — IDNIC doesn't support WHOIS privacy for .id domains. How to communicate this to users?

---

## 13. Next Actions

1. **Secure Qwords API credentials** → Contact Qwords for reseller account + sandbox access
2. **Confirm IDNIC compliance requirements** → Legal review for .id document requirements
3. **Create Supabase Storage bucket** → `domain-documents` (private)
4. **Assign developer** → Kickoff Phase 1 (Qwords driver)
5. **Set up Qwords sandbox** → Test registration flow end-to-end

---

*End of Backlog — Domain Feature Sprint 5*
