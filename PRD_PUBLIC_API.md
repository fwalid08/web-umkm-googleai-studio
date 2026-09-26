# PRD: Public API MVP — Read-Only Orders & Products

**Version:** 1.0  
**Date:** September 2026  
**Author:** Senior SaaS Product Architect  
**Stack:** Next.js 16 App Router + Supabase (Postgres, RLS) + Upstash Redis + Zod + @asteasolutions/zod-to-openapi  
**Target Release:** Sprint 10 (post-Enterprise pricing launch)  
**Estimasi:** 2–3 sprint (4–6 minggu) — 1 dev full-time

---

## 1. Executive Summary

### 1.1 Problem (JTBD)
> "As a **tech-savvy merchant / agency / ERP integrator**, I want to **pull orders & products programmatically** so I can sync with my accounting software, inventory system, or custom dashboard without manual CSV export."

### 1.2 Solution
Expose **read-only REST API** untuk `orders` & `products` dengan:
- API Key authentication (per user, scoped ke website aktif)
- Rate limiting (100 req/min/key, burst 20)
- OpenAPI 3.1 docs + Scalar UI di `/docs`
- Versioned path: `/api/v1/`

### 1.3 Scope: MVP (P0) vs Later

| In Scope (MVP) | Out of Scope (P1+) |
|----------------|-------------------|
| `GET /api/v1/orders` (list + filter + pagination) | `POST/PUT/DELETE` orders (write) |
| `GET /api/v1/orders/:id` (detail) | Webhooks outgoing (`order.created`, `product.updated`) |
| `GET /api/v1/products` (list + filter + pagination) | API Key rotation / expiration UI |
| `GET /api/v1/products/:id` (detail) | Scopes/permissions granular (read:orders vs read:products) |
| API Key CRUD di Settings (create, revoke, view last used) | Developer portal (log viewer, test console, webhook simulator) |
| Rate limiting per key (Upstash Redis) | API versioning strategy beyond v1 |
| OpenAPI spec + Scalar docs | Partner/agency multi-client keys |
| Tier gating: **Starter+ only** (Free = 403 upgrade) | Usage analytics / billing per API call |

---

## 2. Functional Requirements

### 2.1 API Key Management

| ID | Requirement | Priority |
|----|-------------|----------|
| PAPI-1.1 | Table `api_keys`: `id, user_id, name, key_hash (bcrypt), key_prefix (first 8 chars), scopes (text[]), last_used_at, expires_at, created_at` | P0 |
| PAPI-1.2 | Generate key format: `umkm_live_<32-char-random>` / `umkm_test_<32-char-random>` | P0 |
| PAPI-1.3 | Hash dengan bcrypt (cost 12) — **never store plaintext** | P0 |
| PAPI-1.4 | UI di `/dashboard/settings/api` — list keys (name, prefix, scopes, last used, status), create modal, revoke button | P0 |
| PAPI-1.5 | Saat create: tampilkan **full key sekali saja** (copy to clipboard), lalu hanya prefix | P0 |
| PAPI-1.6 | Default scopes: `["read:orders", "read:products"]` — hardcoded MVP, configurable P1 | P0 |
| PAPI-1.7 | RLS: user hanya bisa CRUD `api_keys` miliknya (`user_id = auth.uid()`) | P0 |

### 2.2 Authentication Middleware

| ID | Requirement | Priority |
|----|-------------|----------|
| PAPI-2.1 | Middleware `verifyApiKey` di `app/(api)/api/v1/` — extract `Authorization: Bearer <key>` | P0 |
| PAPI-2.2 | Lookup key by prefix (`key_prefix`) → verify bcrypt → attach `user_id`, `scopes`, `website_id` (active) ke request | P0 |
| PAPI-2.3 | Return 401 `{ error: "invalid_api_key", message: "API key tidak valid atau sudah dicabut" }` | P0 |
| PAPI-2.4 | Return 403 `{ error: "insufficient_scope", message: "Scope read:orders diperlukan", required_scope: "read:orders" }` | P0 |
| PAPI-2.5 | Return 403 `{ error: "tier_required", message: "Public API hanya untuk paket Starter ke atas", upgrade_url: "/dashboard/settings/billing" }` untuk Free tier | P0 |
| PAPI-2.6 | Update `last_used_at` async (fire-and-forget) | P0 |

### 2.3 Rate Limiting

| ID | Requirement | Priority |
|----|-------------|----------|
| PAPI-3.1 | Upstash Redis: sliding window log (sorted set) per `api_key_id` | P0 |
| PAPI-3.2 | Limit: **100 requests/minute**, burst **20 requests/10s** | P0 |
| PAPI-3.3 | Header response: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` | P0 |
| PAPI-3.4 | 429 response: `{ error: "rate_limited", message: "Terlalu banyak request", retry_after: 45 }` + `Retry-After` header | P0 |
| PAPI-3.5 | Bypass rate limit untuk health check `GET /api/v1/health` | P0 |

### 2.4 Orders API (Read-Only)

| Endpoint | Query Params | Response |
|----------|--------------|----------|
| `GET /api/v1/orders` | `page` (default 1), `limit` (default 20, max 100), `status` (enum), `date_from` (ISO), `date_to` (ISO), `search` (customer name/phone/email) | `{ data: Order[], pagination: { page, limit, total, total_pages } }` |
| `GET /api/v1/orders/:id` | — | `{ data: Order }` |

**Order Shape:**
```typescript
interface Order {
  id: string;                    // ORD-XXXXXX
  website_id: string;
  customer: {
    name: string;
    phone: string;
    email: string | null;
    address: string | null;
  };
  items: Array<{
    product_id: string;
    product_name: string;
    variant_name: string | null;
    quantity: number;
    price: number;               // per unit (IDR)
    subtotal: number;
  }>;
  subtotal: number;
  shipping_cost: number;
  total: number;
  status: 'pending' | 'diproses' | 'dikirim' | 'selesai' | 'dibatalkan';
  payment_status: 'unpaid' | 'paid' | 'failed' | 'refunded';
  payment_method: 'whatsapp' | 'midtrans' | 'manual';
  notes: string | null;
  created_at: string;            // ISO
  updated_at: string;
  completed_at: string | null;
}
```

**RLS Enforcement:** Query otomatis filter `website_id = active_website_id` (dari session user yang terikat ke API key).

### 2.5 Products API (Read-Only)

| Endpoint | Query Params | Response |
|----------|--------------|----------|
| `GET /api/v1/products` | `page`, `limit`, `category`, `is_active` (boolean), `search` (name/sku), `stock_status` (`in_stock`, `low_stock`, `out_of_stock`) | `{ data: Product[], pagination }` |
| `GET /api/v1/products/:id` | — | `{ data: Product }` |

**Product Shape:**
```typescript
interface Product {
  id: string;
  website_id: string;
  name: string;
  description: string | null;
  price: number;                 // IDR
  category: string | null;
  images: string[];              // signed URLs (7 days TTL)
  stock: number;                 // -1 = unlimited
  low_stock_threshold: number;   // default 5
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
```

### 2.6 Health Check & Version Info

| Endpoint | Response |
|----------|----------|
| `GET /api/v1/health` | `{ status: "ok", version: "1.0.0", timestamp: "2026-09-26T..." }` |
| `GET /api/v1` | `{ name: "UMKM SaaS Public API", version: "1.0.0", docs_url: "/docs", contact: "support@umkm.id" }` |

### 2.7 OpenAPI Documentation

| ID | Requirement | Priority |
|----|-------------|----------|
| PAPI-7.1 | Generate OpenAPI 3.1 spec dari Zod schemas (`@asteasolutions/zod-to-openapi`) | P0 |
| PAPI-7.2 | Serve spec di `GET /api/v1/openapi.json` | P0 |
| PAPI-7.3 | Scalar UI di `/docs` (static page, fetch spec dari `/api/v1/openapi.json`) | P0 |
| PAPI-7.4 | Spec include: auth (Bearer), rate limit headers, error schemas, examples | P0 |

---

## 3. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Performance** | p95 < 200ms (cached), p99 < 500ms; Redis rate limit < 5ms overhead |
| **Security** | bcrypt cost 12; key prefix indexing; no key in logs; CSP headers; CORS: `*` (public API) |
| **Reliability** | Redis down → fail-open (log warning, allow request) dengan circuit breaker 5xx > 50% |
| **Observability** | Structured log per request: `api_key_id`, `endpoint`, `status`, `latency_ms`, `rate_limit_remaining` |
| **Compliance** | PDPA: API key = personal data; export/delete via existing user data flow |

---

## 4. Database Schema

### 4.1 Migration: `025_public_api_keys.sql`

```sql
-- 025_public_api_keys.sql
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                    -- "Accounting Sync", "Mobile App"
  key_hash TEXT NOT NULL,                -- bcrypt(hash, 12)
  key_prefix TEXT NOT NULL,              -- "umkm_live_abc123" (first 20 chars)
  scopes TEXT[] NOT NULL DEFAULT '{read:orders,read:products}',
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,                -- nullable = no expiry
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index untuk lookup cepat by prefix
CREATE INDEX idx_api_keys_prefix ON public.api_keys (key_prefix);
CREATE INDEX idx_api_keys_user ON public.api_keys (user_id);

-- RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own API keys"
  ON public.api_keys
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Trigger updated_at
CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

### 4.2 RLS Note
Existing `orders` & `products` tables sudah punya RLS berbasis `website_id`. API key middleware akan resolve `website_id` dari `users.active_website_id` dan inject ke query via `.eq('website_id', websiteId)` — **tidak perlu policy baru**.

---

## 5. API Contracts (Zod Schemas)

### 5.1 Shared Schemas

```typescript
// lib/api/v1/schemas.ts
import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const PaginationQuery = z.object({
  page: z.coerce.number().int().positive().default(1).openapi({ example: 1 }),
  limit: z.coerce.number().int().positive().max(100).default(20).openapi({ example: 20 }),
});

export const OrderStatusEnum = z.enum(["pending", "diproses", "dikirim", "selesai", "dibatalkan"]);
export const PaymentStatusEnum = z.enum(["unpaid", "paid", "failed", "refunded"]);
export const PaymentMethodEnum = z.enum(["whatsapp", "midtrans", "manual"]);

export const OrderItemSchema = z.object({
  product_id: z.string().uuid(),
  product_name: z.string(),
  variant_name: z.string().nullable(),
  quantity: z.number().int().positive(),
  price: z.number().int().nonnegative(),
  subtotal: z.number().int().nonnegative(),
}).openapi("OrderItem");

export const CustomerSchema = z.object({
  name: z.string(),
  phone: z.string(),
  email: z.string().email().nullable(),
  address: z.string().nullable(),
}).openapi("Customer");

export const OrderSchema = z.object({
  id: z.string().openapi({ example: "ORD-A1B2C3" }),
  website_id: z.string().uuid(),
  customer: CustomerSchema,
  items: z.array(OrderItemSchema),
  subtotal: z.number().int().nonnegative(),
  shipping_cost: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  status: OrderStatusEnum,
  payment_status: PaymentStatusEnum,
  payment_method: PaymentMethodEnum,
  notes: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  completed_at: z.string().datetime().nullable(),
}).openapi("Order");

export const ProductSchema = z.object({
  id: z.string().uuid(),
  website_id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  price: z.number().int().nonnegative(),
  category: z.string().nullable(),
  images: z.array(z.string().url()),
  stock: z.number().int().default(-1),
  low_stock_threshold: z.number().int().default(5),
  is_active: z.boolean(),
  sort_order: z.number().int(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
}).openapi("Product");

export const PaginatedResponse = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    data: z.array(item),
    pagination: z.object({
      page: z.number().int().positive(),
      limit: z.number().int().positive(),
      total: z.number().int().nonnegative(),
      total_pages: z.number().int().nonnegative(),
    }),
  }).openapi(`Paginated${item._def.typeName || "Response"}`);

export const ErrorResponse = z.object({
  success: z.literal(false),
  error: z.string(),
  message: z.string(),
  required_scope: z.string().optional(),
  upgrade_url: z.string().optional(),
  retry_after: z.number().int().optional(),
}).openapi("ErrorResponse");

export const SuccessResponse = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    success: z.literal(true),
    data: item,
  }).openapi(`Success${item._def.typeName || "Response"}`);
```

### 5.2 Endpoint Definitions (OpenAPI Tags)

```typescript
// lib/api/v1/routes.ts
import { createApiRoute } from "@/lib/api/v1/factory";
import { OrderSchema, ProductSchema, PaginatedResponse, ErrorResponse } from "./schemas";

export const ordersListRoute = createApiRoute({
  method: "GET",
  path: "/orders",
  tags: ["Orders"],
  summary: "List orders for active website",
  query: PaginationQuery.extend({
    status: OrderStatusEnum.optional(),
    date_from: z.string().datetime().optional(),
    date_to: z.string().datetime().optional(),
    search: z.string().optional(),
  }),
  responses: {
    200: PaginatedResponse(OrderSchema),
    401: ErrorResponse,
    403: ErrorResponse,
    429: ErrorResponse,
  },
  security: [{ bearerAuth: ["read:orders"] }],
});

export const ordersDetailRoute = createApiRoute({
  method: "GET",
  path: "/orders/{id}",
  tags: ["Orders"],
  summary: "Get order detail",
  params: z.object({ id: z.string() }),
  responses: {
    200: SuccessResponse(OrderSchema),
    401: ErrorResponse,
    403: ErrorResponse,
    404: ErrorResponse,
    429: ErrorResponse,
  },
  security: [{ bearerAuth: ["read:orders"] }],
});

// ... products routes similar
```

---

## 6. Implementation Plan

### 6.1 File Structure (New)

```
src/
├── app/
│   ├── (api)/
│   │   └── api/
│   │       └── v1/
│   │           ├── health/route.ts
│   │           ├── orders/
│   │           │   ├── route.ts              # GET list
│   │           │   └── [id]/route.ts         # GET detail
│   │           ├── products/
│   │           │   ├── route.ts
│   │           │   └── [id]/route.ts
│   │           ├── openapi.json/route.ts     # GET spec
│   │           └── middleware.ts             # verifyApiKey + rateLimit
│   └── (dashboard)/
│       └── dashboard/
│           └── settings/
│               └── api/
│                   ├── page.tsx              # API Keys management UI
│                   └── components/
│                       ├── ApiKeyList.tsx
│                       ├── CreateApiKeyModal.tsx
│                       └── ApiKeyCreatedToast.tsx
├── lib/
│   ├── api/
│   │   └── v1/
│   │       ├── factory.ts                    # createApiRoute helper
│   │       ├── middleware.ts                 # verifyApiKey, rateLimit
│   │       ├── schemas.ts                    # Zod + OpenAPI schemas
│   │       ├── routes.ts                     # Route definitions
│   │       ├── openapi.ts                    # Generate spec
│   │       └── handlers/
│   │           ├── orders.ts
│   │           └── products.ts
│   ├── supabase/
│   │   └── api-keys.ts                       # CRUD api_keys table
│   └── rate-limit/
│       └── upstash.ts                        # Sliding window implementation
├── components/
│   └── ui/
│       └── scalar-api-docs.tsx               # Scalar UI wrapper
└── app/docs/page.tsx                         # /docs page (static)
```

### 6.2 Sprint Breakdown

| Sprint | Focus | Deliverables | Est. Days |
|--------|-------|--------------|-----------|
| **Sprint 10A** | Foundation | Migration 025, `api_keys` CRUD, `verifyApiKey` middleware, rate limit (Upstash), health check | 5–7 |
| **Sprint 10B** | Orders API | `GET /orders`, `GET /orders/:id`, Zod schemas, RLS integration, error handling | 4–5 |
| **Sprint 10C** | Products API | `GET /products`, `GET /products/:id`, signed image URLs, stock status filter | 3–4 |
| **Sprint 10D** | Docs & UI | OpenAPI generation, `/api/v1/openapi.json`, `/docs` (Scalar), Settings API Keys page | 4–5 |
| **Sprint 10E** | Hardening | Integration tests, load test (k6), error monitoring (Sentry), rollout to staging | 3–4 |

**Total: ~19–25 hari (4–5 sprints)** — bisa diparalelkan Sprint 10B+10C.

---

## 7. Acceptance Criteria

### 7.1 API Key Management
- [ ] User Starter+ bisa create API key di Settings → dapat full key sekali (copy toast)
- [ ] Key ter-hash bcrypt, hanya prefix tampil di list
- [ ] Revoke key → immediate 401 pada request berikutnya
- [ ] Free tier user coba create → 403 + upgrade_url

### 7.2 Authentication & Rate Limit
- [ ] `Authorization: Bearer umkm_live_abc...` → resolve user + website + scopes
- [ ] Key salah/revoked → 401 `{ error: "invalid_api_key" }`
- [ ] Scope mismatch → 403 `{ error: "insufficient_scope", required_scope: "read:orders" }`
- [ ] 101st request dalam 1 menit → 429 + `Retry-After` header
- [ ] Redis down → request tetap lewat (fail-open) + log warning

### 7.3 Orders API
- [ ] `GET /api/v1/orders?page=1&limit=10&status=selesai` → paginated response
- [ ] Filter `date_from`/`date_to` bekerja (ISO 8601)
- [ ] Search `search=john` → filter customer name/phone/email
- [ ] Response hanya orders dari `active_website_id` (bukan semua website user)
- [ ] `GET /api/v1/orders/ORD-A1B2C3` → detail dengan items lengkap

### 7.4 Products API
- [ ] `GET /api/v1/products?category=makanan&stock_status=in_stock` → filtered
- [ ] Images = signed URLs (Supabase Storage, TTL 7 hari)
- [ ] `stock: -1` → unlimited, `stock: 0` → out_of_stock

### 7.5 Documentation
- [ ] `GET /api/v1/openapi.json` → valid OpenAPI 3.1 spec
- [ ] `/docs` render Scalar UI dengan try-it-out (Bearer auth input)
- [ ] Spec include semua error codes, rate limit headers, examples

---

## 8. Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Upstash Redis latency/cost | Medium | Medium | Fail-open; cache limit config di env; monitor via Vercel Analytics |
| API key leak (merchant commit ke GitHub) | Medium | High | Prefix `umkm_live_` detectable by secret scanning; revoke UI prominent; rotate docs |
| RLS bypass via API key | Low | Critical | Middleware inject `website_id` server-side; never trust client input; integration test |
| Breaking changes v1 → v2 | Low | High | Version di path (`/api/v1/`); deprecation policy 6 bulan; changelog |
| Abuse (scraping, competitors) | Medium | Medium | Rate limit ketat; tier gating (Starter+); monitor unusual patterns |

---

## 9. Success Metrics

| Metric | Target (Month 3) |
|--------|------------------|
| API keys created (Starter+ users) | > 20% |
| Daily active keys | > 50 |
| API error rate (5xx) | < 0.1% |
| p95 latency | < 200ms |
| Rate limit 429 rate | < 5% of requests |
| Support tickets "API not working" | < 2/week |

---

## 10. Open Questions

1. **Upstash Redis plan**: Free (10k req/day) cukup? Atau butuh paid plan dari awal?
2. **Image signed URL TTL**: 7 hari OK? Atau 1 hari untuk keamanan?
3. **Webhook outgoing**: Mau dikombinasi di Sprint 10 atau pisah Sprint 11?
4. **Test environment**: Butuh sandbox API key (test mode) terpisah dari live?

---

## 11. Next Actions

1. **Approve PRD** → Lock scope Sprint 10
2. **Provision Upstash Redis** (dev + staging) → set `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
3. **Create migration 025** → run di staging Supabase
4. **Assign dev** → kickoff Sprint 10A (Foundation)
5. **Setup Sentry alert** untuk `invalid_api_key` spike & rate limit 429 spike

---

## 12. Appendix: Example Requests

### Create API Key (Dashboard UI → POST /api/user/api-keys)
```bash
curl -X POST https://umkm.id/api/user/api-keys \
  -H "Content-Type: application/json" \
  -H "Cookie: <nextauth_session>" \
  -d '{"name": "Accounting Sync", "scopes": ["read:orders", "read:products"]}'
# Response: { success: true, data: { key: "umkm_live_abc123...", prefix: "umkm_live_abc123", ... } }
```

### List Orders
```bash
curl "https://umkm.id/api/v1/orders?page=1&limit=20&status=selesai&date_from=2026-09-01" \
  -H "Authorization: Bearer umkm_live_abc123def456..."
# Response: { success: true, data: [...], pagination: {...} }
```

### Rate Limit Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1727356800
```

---

*End of PRD — Public API MVP*