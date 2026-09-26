# Sprint 2: Custom Domain Real Registrar Integration
**Duration:** 2 weeks (10 working days)  
**Goal:** Replace simulated domain purchase with real registrar integration (DomainNameAPI), Midtrans payment, Vercel provisioning, and DNS verification.

---

## 1. User Stories

| ID | Story | Points |
|----|-------|--------|
| US-2.1 | As a merchant, I want to search domain availability in real-time with real prices so I know what I can buy | 5 |
| US-2.2 | As a merchant, I want to purchase a domain via Midtrans (VA/QRIS/CC) and have it registered automatically | 8 |
| US-2.3 | As a merchant, I want my domain auto-connected to Vercel with correct DNS so my store works immediately | 5 |
| US-2.4 | As a merchant, I want DNS verification to happen automatically via cron so I don't need manual steps | 3 |
| US-2.5 | As a merchant, I want to see my domain orders, status, and renewal dates in dashboard | 3 |
| US-2.6 | As a system, I want to handle registrar webhooks/polling for domain lifecycle events | 5 |
| US-2.7 | As a merchant, I want renewal reminders (30/14/7/1 days) via WA/email so I don't lose my domain | 3 |

**Total: 32 points**

---

## 2. Registrar Selection: DomainNameAPI (domainnameapi.com)

### Why DomainNameAPI?
- **ICANN-accredited** registrar (Atak Domain) with 40,000+ resellers in 200+ countries
- **800+ TLDs** including .com, .net, .org, .id (.co.id, .web.id, .biz.id, etc.)
- **REST API** + SOAP + PHP/.NET SDKs, comprehensive documentation
- **OT&E Test Platform** (sandbox) for safe development: `https://ote.domainresellerapi.com/swagger/index.html`
- **Wholesale pricing tiers**: Reseller ($11.31/.com), Premium ($10.91), Platinum ($10.81), VIP ($10.81)
- **Default nameservers**: `tr.apiname.com`, `eu.apiname.com`
- **Indonesian market support**: Local TLDs (.co.id, .web.id), support in Bahasa Indonesia
- **Free integrations**: WHMCS, WiseCP, HostBill, Blesta, ClientExec, FOSSBilling

### DomainNameAPI REST API Endpoints

**Base URLs:**
- Production: `https://api.domainresellerapi.com/v1`
- OT&E (Test): `https://ote.domainresellerapi.com/v1`

**Authentication:** Reseller ID + API Key (sent in request body)

```
POST /v1/domain/check        # Domain availability + price
POST /v1/domain/register     # Register domain
POST /v1/domain/renew        # Renew domain
POST /v1/domain/transfer     # Transfer in
POST /v1/domain/dns          # Create DNS record
PUT    /v1/domain/dns/{id}   # Update DNS record
DELETE /v1/domain/dns/{id}   # Delete DNS record
POST /v1/domain/nameservers  # Set custom nameservers
GET    /v1/domain/info       # Get domain details
GET    /v1/tld/pricing       # TLD price list
```

### Required DNS Records for Vercel
| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 76.76.21.21 | 3600 |
| CNAME | www | cname.vercel-dns.com | 3600 |
| TXT | _saas-verify | {verification_token} | 300 |

---

## 3. Database Migration (024_update_domain_orders.sql)

```sql
-- 024_update_domain_orders.sql
-- Update domain_orders table for real registrar flow

ALTER TABLE domain_orders ADD COLUMN IF NOT EXISTS registrar VARCHAR(50) DEFAULT 'domainnameapi';
ALTER TABLE domain_orders ADD COLUMN IF NOT EXISTS registrar_domain_id VARCHAR(100); -- DomainNameAPI domain ID
ALTER TABLE domain_orders ADD COLUMN IF NOT EXISTS nameservers JSONB DEFAULT '[]'; -- Applied nameservers
ALTER TABLE domain_orders ADD COLUMN IF NOT EXISTS dns_records JSONB DEFAULT '[]'; -- Applied DNS records
ALTER TABLE domain_orders ADD COLUMN IF NOT EXISTS verification_token VARCHAR(100); -- For DNS verification
ALTER TABLE domain_orders ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE domain_orders ADD COLUMN IF NOT EXISTS renewal_reminder_sent_at TIMESTAMPTZ;
ALTER TABLE domain_orders ADD COLUMN IF NOT EXISTS reseller_tier VARCHAR(20) DEFAULT 'reseller'; -- reseller/premium/platinum/vip

-- Update status enum
ALTER TABLE domain_orders DROP CONSTRAINT IF EXISTS domain_orders_status_check;
ALTER TABLE domain_orders ADD CONSTRAINT domain_orders_status_check 
CHECK (status IN (
    'pending_payment',    -- Midtrans checkout created
    'registering',        -- Payment success, registering at registrar
    'active',             -- Registered, DNS verified, connected
    'expired',            -- Past expiry, not renewed
    'deleted',            -- Released/deleted
    'transfer_in'         -- Transfer initiated
));

-- Index for cron queries
CREATE INDEX IF NOT EXISTS idx_domain_orders_expires_at ON domain_orders(expires_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_domain_orders_verification ON domain_orders(verification_token) WHERE verification_token IS NOT NULL;

-- RLS already exists from migration 011 (user_id = auth.uid())
```

---

## 4. API Contracts

### 4.1 Types (`src/types/domains.ts`)
```typescript
export interface DomainSearchResult {
  domain: string;
  tld: string;
  available: boolean;
  price_yearly: number;      // IDR (sen) - converted from USD wholesale + margin
  currency: 'IDR';
  buyable: boolean;
  requirement?: string;      // e.g., "KTP required for .co.id"
  premium: boolean;
  premium_price?: number;
  wholesale_price_usd?: number; // For reference
}

export interface DomainOrder {
  id: string;
  user_id: string;
  website_id: string;
  domain: string;
  tld: string;
  price_yearly: number;
  status: DomainStatus;
  registrar: string;
  registrar_domain_id: string | null;
  nameservers: string[];
  dns_records: DnsRecord[];
  verification_token: string | null;
  auto_renew: boolean;
  reseller_tier: string;
  expires_at: string | null;
  sandbox: boolean;
  created_at: string;
  updated_at: string;
}

export type DomainStatus = 
  | 'pending_payment' 
  | 'registering' 
  | 'active' 
  | 'expired' 
  | 'deleted' 
  | 'transfer_in';

export interface DnsRecord {
  type: 'A' | 'CNAME' | 'TXT' | 'MX';
  name: string;
  value: string;
  ttl: number;
}

export interface DomainCheckoutResponse {
  snap_token: string;
  redirect_url: string;
  order_id: string;
}
```

### 4.2 Endpoints

#### GET `/api/domains/search?q=tokoku`
```
Response: { success: true, data: { results: DomainSearchResult[], sandbox: boolean } }
- Real-time DomainNameAPI availability check
- Cache results 5 minutes (in-memory with TTL or Upstash Redis)
- Fallback to cached prices if API fails (log warning)
- Convert USD wholesale to IDR with 20% margin + payment gateway fee
```

#### POST `/api/domains/checkout`
```
Body: { domain: "tokoku.com", cycle: "yearly" }
Response: { success: true, data: DomainCheckoutResponse }
Flow:
1. Validate domain available (re-check DomainNameAPI)
2. Calculate price: USD wholesale → IDR (rate 15,500) + 20% margin + Midtrans fee
3. Create domain_orders record: status=pending_payment, sandbox=true/false
4. Create Midtrans Snap transaction
5. Return snap_token + redirect_url
```

#### POST `/api/domains/webhook` (Midtrans callback)
```
Headers: X-Midtrans-Signature
Body: Midtrans notification JSON
Flow:
1. Verify signature
2. If settlement:
   - Update order status=registering
   - Call DomainNameAPI domain/register
   - Set nameservers (Vercel: use DomainNameAPI defaults or custom)
   - Create DNS records (A, CNAME, TXT verification)
   - Update order: registrar_domain_id, nameservers, dns_records, verification_token
   - Trigger Vercel domain add (async)
   - Update order status=active
   - Update website: custom_domain, custom_domain_verified=true
3. If deny/expire/cancel:
   - Update order status=expired
   - No registrar action needed
```

#### GET `/api/domains/orders`
```
Response: { success: true, data: { orders: DomainOrder[] } }
```

#### POST `/api/domains/renew/:id`
```
Body: { cycle: "yearly" }
Flow: Similar to checkout but calls DomainNameAPI domain/renew
```

---

## 5. DomainNameAPI Client Library (`src/lib/domains/domainnameapi.ts`)

```typescript
// src/lib/domains/domainnameapi.ts
const PRODUCTION_BASE = 'https://api.domainresellerapi.com/v1';
const OTE_BASE = 'https://ote.domainresellerapi.com/v1';

export interface DomainNameAPIConfig {
  resellerId: string;
  apiKey: string;
  baseUrl: string;
  isTest: boolean;
}

export interface CheckDomainResponse {
  success: boolean;
  data?: {
    domain: string;
    available: boolean;
    price: number; // USD wholesale
    currency: 'USD';
    premium: boolean;
    premiumPrice?: number;
    tld: string;
  };
  error?: string;
}

export interface RegisterDomainResponse {
  success: boolean;
  data?: {
    domainId: string;
    domain: string;
    expiresAt: string;
    nameservers: string[];
  };
  error?: string;
}

export interface DnsRecord {
  id: string;
  type: 'A' | 'CNAME' | 'TXT' | 'MX';
  name: string;
  content: string;
  ttl: number;
}

export class DomainNameAPIClient {
  private config: DomainNameAPIConfig;

  constructor(config: DomainNameAPIConfig) {
    this.config = config;
  }

  private async request<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const payload = {
      resellerId: this.config.resellerId,
      apiKey: this.config.apiKey,
      ...body,
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return res.json();
  }

  // Check domain availability + price
  async checkDomain(domain: string): Promise<CheckDomainResponse> {
    return this.request<CheckDomainResponse>('/domain/check', { domain });
  }

  // Register domain
  async registerDomain(params: {
    domain: string;
    period: number; // years
    nameservers?: string[];
    contacts?: Record<string, unknown>; // Optional: registrant contacts
  }): Promise<RegisterDomainResponse> {
    return this.request<RegisterDomainResponse>('/domain/register', {
      domain: params.domain,
      period: params.period,
      nameservers: params.nameservers || ['tr.apiname.com', 'eu.apiname.com'],
      contacts: params.contacts,
    });
  }

  // Renew domain
  async renewDomain(domainId: string, period: number): Promise<RegisterDomainResponse> {
    return this.request<RegisterDomainResponse>('/domain/renew', {
      domainId,
      period,
    });
  }

  // Create DNS record
  async createDnsRecord(domainId: string, record: Omit<DnsRecord, 'id'>): Promise<{ success: boolean; data?: { id: string } }> {
    return this.request(`/domain/${domainId}/dns`, record);
  }

  // Update DNS record
  async updateDnsRecord(domainId: string, recordId: string, record: Partial<DnsRecord>): Promise<{ success: boolean }> {
    return this.request(`/domain/${domainId}/dns/${recordId}`, { ...record, _method: 'PUT' });
  }

  // Delete DNS record
  async deleteDnsRecord(domainId: string, recordId: string): Promise<{ success: boolean }> {
    return this.request(`/domain/${domainId}/dns/${recordId}`, { _method: 'DELETE' });
  }

  // Set nameservers
  async setNameservers(domainId: string, nameservers: string[]): Promise<{ success: boolean }> {
    return this.request(`/domain/${domainId}/nameservers`, { nameservers });
  }

  // Get domain info
  async getDomainInfo(domainId: string): Promise<{ success: boolean; data?: any }> {
    return this.request(`/domain/info`, { domainId });
  }

  // Get TLD pricing
  async getTldPricing(): Promise<{ success: boolean; data?: Record<string, number> }> {
    return this.request('/tld/pricing', {});
  }
}

// Factory function
export function createDomainNameAPIClient(isTest: boolean = true): DomainNameAPIClient {
  const resellerId = isTest 
    ? process.env.DOMAINNAMEAPI_OTE_RESELLER_ID 
    : process.env.DOMAINNAMEAPI_RESELLER_ID;
  const apiKey = isTest
    ? process.env.DOMAINNAMEAPI_OTE_API_KEY
    : process.env.DOMAINNAMEAPI_API_KEY;
  const baseUrl = isTest ? OTE_BASE : PRODUCTION_BASE;

  if (!resellerId || !apiKey) {
    throw new Error('DomainNameAPI credentials not configured');
  }

  return new DomainNameAPIClient({ resellerId, apiKey, baseUrl, isTest });
}
```

---

## 6. Vercel Integration (Unchanged)

```typescript
// src/lib/vercel/domains.ts
const VERCEL_API = 'https://api.vercel.com/v10';

async function addDomainToVercel(domain: string, teamId: string): Promise<void> {
  await fetch(`${VERCEL_API}/domains/${domain}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.VERCEL_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ teamId }),
  });
}

async function verifyDomainOnVercel(domain: string, teamId: string): Promise<boolean> {
  const res = await fetch(`${VERCEL_API}/domains/${domain}/verify`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.VERCEL_TOKEN}` },
  });
  return res.ok;
}
```

### Required Env Vars (Updated)
```
# DomainNameAPI
DOMAINNAMEAPI_RESELLER_ID=your_reseller_id
DOMAINNAMEAPI_API_KEY=your_api_key
DOMAINNAMEAPI_OTE_RESELLER_ID=ote_reseller_id
DOMAINNAMEAPI_OTE_API_KEY=ote_api_key
DOMAINNAMEAPI_SANDBOX=true|false

# Vercel
VERCEL_TOKEN=vercel_xxx
VERCEL_TEAM_ID=team_xxx

# Midtrans
MIDTRANS_SERVER_KEY=SB-Mid-server-xxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxx
MIDTRANS_WEBHOOK_URL=https://app.umkm.id/api/domains/webhook

# USD to IDR conversion rate (update periodically)
USD_TO_IDR_RATE=15500
DOMAIN_PRICE_MARGIN_PERCENT=20
```

---

## 7. Domain Registration Orchestrator (`src/lib/domains/register.ts`)

```typescript
// src/lib/domains/register.ts
import { createServiceSupabaseClient } from '@/lib/supabase/service';
import { createDomainNameAPIClient } from './domainnameapi';
import { addDomainToVercel } from '@/lib/vercel/domains';
import { dispatchNotification } from '@/lib/notify/dispatcher';

export async function processDomainRegistration(orderId: string): Promise<void> {
  const supabase = createServiceSupabaseClient();
  const isTest = process.env.DOMAINNAMEAPI_SANDBOX === 'true';
  const client = createDomainNameAPIClient(isTest);
  const usdToIdr = parseInt(process.env.USD_TO_IDR_RATE || '15500');
  const margin = parseInt(process.env.DOMAIN_PRICE_MARGIN_PERCENT || '20');

  // 1. Get order details
  const { data: order } = await supabase
    .from('domain_orders')
    .select('*, websites!inner(user_id, name, whatsapp)')
    .eq('id', orderId)
    .single();

  if (!order) throw new Error('Order not found');

  // 2. Register domain via DomainNameAPI
  const registerResult = await client.registerDomain({
    domain: order.domain,
    period: 1, // 1 year
    nameservers: ['tr.apiname.com', 'eu.apiname.com'], // DomainNameAPI defaults
  });

  if (!registerResult.success || !registerResult.data) {
    throw new Error(`Domain registration failed: ${registerResult.error}`);
  }

  const { domainId, nameservers } = registerResult.data;

  // 3. Create DNS records (A, CNAME, TXT for verification)
  const verificationToken = `saas-verify-${crypto.randomUUID().slice(0, 8)}`;
  const dnsRecords = [
    { type: 'A', name: '@', content: '76.76.21.21', ttl: 3600 },
    { type: 'CNAME', name: 'www', content: 'cname.vercel-dns.com', ttl: 3600 },
    { type: 'TXT', name: '_saas-verify', content: verificationToken, ttl: 300 },
  ];

  const createdDnsRecords = [];
  for (const record of dnsRecords) {
    const result = await client.createDnsRecord(domainId, record);
    if (result.success && result.data?.id) {
      createdDnsRecords.push({ ...record, id: result.data.id });
    }
  }

  // 4. Update order with registrar details
  await supabase
    .from('domain_orders')
    .update({
      status: 'active',
      registrar_domain_id: domainId,
      nameservers,
      dns_records: createdDnsRecords,
      verification_token: verificationToken,
      expires_at: registerResult.data.expiresAt,
    })
    .eq('id', orderId);

  // 5. Add domain to Vercel (async, don't block)
  addDomainToVercel(order.domain, process.env.VERCEL_TEAM_ID!).catch(err => {
    console.error('Vercel domain add failed:', err);
    // Will be retried by cron or manual
  });

  // 6. Update website with custom domain
  await supabase
    .from('websites')
    .update({
      custom_domain: order.domain,
      custom_domain_verified: false, // Will be verified by cron
      custom_domain_verification_token: verificationToken,
      updated_at: new Date().toISOString(),
    })
    .eq('id', order.website_id)
    .eq('user_id', order.websites.user_id);

  // 7. Send notification to merchant
  await dispatchNotification({
    event: {
      type: 'domain.registered',
      website_id: order.website_id,
      payload: {
        domain: order.domain,
        expires_at: registerResult.data.expiresAt,
        message: `Domain ${order.domain} berhasil didaftarkan! Verifikasi DNS sedang berjalan.`,
      },
    },
  });
}
```

---

## 8. Cron Jobs

### 8.1 DNS Verification Cron (Enhanced)
**Schedule:** Every 5 minutes (`*/5 * * * *`)
**Endpoint:** `POST /api/domains/verify`
**Logic:**
1. Fetch websites with `custom_domain_verified=false` AND `custom_domain_verification_token` not null
2. Check DNS TXT record `_saas-verify.{domain}` matches `verification_token` via Cloudflare DNS-over-HTTPS
3. If verified:
   - Update website: `custom_domain_verified=true`, `custom_domain_verified_at=now()`
   - Call Vercel verify API
   - Update domain_orders: `verification_token=null`

### 8.2 Renewal Reminder Cron
**Schedule:** Daily 09:00 WIB (`0 9 * * *`)
**Endpoint:** `POST /api/domains/renewal-reminders`
**Logic:**
1. Fetch active domains expiring in 30, 14, 7, 1 days
2. For each, check if reminder already sent for that interval
3. Send WA + Email reminder with renewal link
4. Update `renewal_reminder_sent_at`

### 8.3 Auto-Renewal Cron
**Schedule:** Daily 02:00 WIB (`0 2 * * *`)
**Endpoint:** `POST /api/domains/auto-renew`
**Logic:**
1. Fetch active domains with `auto_renew=true` expiring in 14 days
2. Check reseller account balance via DomainNameAPI
3. Create Midtrans payment (one-time)
4. On success → call DomainNameAPI domain/renew → extend `expires_at` by 1 year

---

## 9. UI Specification (Unchanged)

### 9.1 Domain Search Page (`/dashboard/domain/page.tsx`)
```
- Search input: real-time debounced (300ms) → calls /api/domains/search
- Results grid: Domain | TLD | Status (Tersedia/Tidak) | Harga/Tahun | [Beli]
- "Tidak tersedia" rows greyed out
- Premium domains highlighted with badge
- Loading skeleton during search
```

### 9.2 Domain Checkout Flow
```
1. Click "Beli" → POST /api/domains/checkout → redirect to Midtrans Snap
2. Midtrans success → redirect to /billing/success?tier=domain&domain=tokoku.com
3. Success page: "Domain sedang didaftarkan..." + polling /api/domains/orders
4. When status=active → "Domain aktif & tersambung!" + show DNS records
```

### 9.3 Domain Orders Page (`/dashboard/settings/domains`)
```
Table: Domain | Status | Harga/Tahun | Berlaku Hingga | Auto-renew | Aksi
Actions: Perpanjang, Matikan Auto-renew, Lihat DNS, Hapus (jika expired)
```

---

## 10. Task Breakdown (Updated)

| Task | File(s) | Estimate |
|------|---------|----------|
| 1. Create migration 024_domain_orders.sql | `supabase/migrations/024_update_domain_orders.sql` | 2h |
| 2. DomainNameAPI client library | `src/lib/domains/domainnameapi.ts` | 4h |
| 3. Vercel domains client | `src/lib/vercel/domains.ts` | 2h |
| 4. Domain search API (DomainNameAPI + cache) | `app/api/domains/search/route.ts` | 3h |
| 5. Domain checkout API (Midtrans integration) | `app/api/domains/checkout/route.ts` | 4h |
| 6. Midtrans webhook for domains | `app/api/domains/webhook/route.ts` | 4h |
| 7. Domain registration orchestrator (register + DNS + Vercel) | `src/lib/domains/register.ts` | 6h |
| 8. DNS verification cron enhancement | `app/api/domains/verify/route.ts` | 2h |
| 9. Renewal reminder cron | `app/api/domains/renewal-reminders/route.ts` | 3h |
| 10. Auto-renewal cron | `app/api/domains/auto-renew/route.ts` | 4h |
| 11. Domain search UI | `app/dashboard/domain/page.tsx` | 4h |
| 12. Domain orders UI | `app/dashboard/settings/domains/page.tsx` | 3h |
| 13. Checkout success page for domains | `app/billing/domain-success/page.tsx` | 2h |
| 14. Integration testing (OT&E → production) | Manual + script | 4h |
| 15. Error handling & retry logic | Various | 3h |

**Total: ~54 hours (~7 days + buffer)**

---

## 11. Acceptance Criteria

- [ ] Domain search returns real availability + price in < 2s (cached)
- [ ] Purchase flow: Midtrans payment → DomainNameAPI register → Vercel add → DNS verify → active in < 60s
- [ ] DNS verification cron works: TXT record checked, website updated, Vercel verified
- [ ] Renewal reminders sent at T-30, T-14, T-7, T-1 via WA + email
- [ ] Auto-renewal processes payment + extends domain via DomainNameAPI
- [ ] Dashboard shows correct status, DNS records, expiry
- [ ] Free tier users blocked from custom domain (403 + upgrade prompt)
- [ ] OT&E sandbox mode works with DomainNameAPI test environment
- [ ] All API endpoints have RLS + rate limiting
- [ ] Rollback: if registrar fails after payment → refund Midtrans, mark order failed
- [ ] .id TLDs (.co.id, .web.id) available and working
- [ ] Pricing shows IDR with proper USD→IDR conversion + margin

---

## 12. Error Handling & Edge Cases

| Scenario | Handling |
|----------|----------|
| DomainNameAPI API down | Cache last known availability; show warning "Harga/tersedia estimasi" |
| Midtrans payment success but DomainNameAPI register fails | Retry 3x (1m, 5m, 15m); if still fails → refund, notify support |
| Vercel domain add fails | Queue retry; domain still works via DNS, Vercel sync later |
| DNS verification never passes | After 7 days → email support; manual intervention |
| Domain transfer in | Separate flow: EPP code validation → DomainNameAPI transfer → same DNS setup |
| Premium domain pricing | Show premium price; confirm before checkout |
| Insufficient reseller balance | Check balance before register; show "Top up reseller account" alert |
| .id TLD requirements (KTP) | Validate requirements via API response; show in UI before checkout |

---

## 13. Testing Checklist

- [ ] Search `example.com` → available, price correct (USD wholesale + margin)
- [ ] Search `google.com` → unavailable
- [ ] Purchase `.com` via Midtrans sandbox → registered in DomainNameAPI OT&E
- [ ] DNS records created: A, CNAME, TXT
- [ ] Vercel domain added + verified
- [ ] Public site accessible via custom domain
- [ ] Renewal reminder email/WA sent
- [ ] Auto-renew extends expiry date via DomainNameAPI
- [ ] Expired domain → status=expired, website falls back to subdomain
- [ ] .co.id / .web.id registration works (with KTP requirement notice)

---

## 14. Rollback Plan

1. Feature flag: `NEXT_PUBLIC_REAL_DOMAINS=false` → falls back to simulation
2. Revert migration 024
3. Keep old `/api/domains/order` (simulated) as fallback
4. DNS verification cron continues to work for existing domains

---

## 15. DomainNameAPI Account Setup Checklist

- [ ] Register reseller account at `https://dm.apiname.com/Account/Register`
- [ ] Verify email, login to reseller panel
- [ ] Get **Production** Reseller ID + API Key from Integration section
- [ ] Get **OT&E** Reseller ID + API Key for testing
- [ ] Add credit/deposit for domain registrations
- [ ] Configure default nameservers: `tr.apiname.com`, `eu.apiname.com`
- [ ] Set retail pricing in panel (or calculate dynamically via API)
- [ ] Test OT&E: check domain → register → verify DNS → renew
- [ ] Switch to production credentials for launch