# Sprint 4: Remove Trial System + Free Tier Limits
**Duration:** 1 week (5 working days)  
**Goal:** Remove 14-day trial system, implement permanent Free tier with hard limits, update pricing, migrate existing users.

---

## 1. User Stories

| ID | Story | Points |
|----|-------|--------|
| US-4.1 | As a product owner, I want to remove the 14-day trial so users don't game the system | 3 |
| US-4.2 | As a new user, I want to start on Free tier immediately with clear limits so I know what I get | 2 |
| US-4.3 | As a Free tier user, I want to see my usage vs limits and upgrade prompts when I hit them | 3 |
| US-4.4 | As a paid user, I want my tier limits enforced (websites, products, orders, custom domain) | 3 |
| US-4.5 | As a system, I want tier limits checked at API + DB level so they can't be bypassed | 5 |
| US-4.6 | As an existing trial user, I want to be migrated to Free tier automatically on deploy | 2 |

**Total: 18 points**

---

## 2. Tier Definitions (Final)

| Feature | Free | Starter (Rp 79k/th yearly / Rp 99k/th monthly) | Growth (Rp 199k/th yearly / Rp 249k/th monthly) | Enterprise (Rp 479k/th yearly / Rp 599k/th monthly) |
|---------|------|-----------------------------------------------|------------------------------------------------|---------------------------------------------------|
| **Websites** | 1 | 3 | 10 | 999 |
| **Products** | 5 | 50 | 200 | 9999 |
| **Orders/Month** | 50 | Unlimited | Unlimited | Unlimited |
| **Custom Domain** | ❌ | ✅ (1 included) | ✅ (3 included) | ✅ (10 included) |
| **Analytics** | Basic | Full | Full + Export | Full + Export + API |
| **Customer List** | ❌ | ✅ | ✅ | ✅ |
| **CSV Export** | ❌ | ✅ | ✅ | ✅ |
| **Priority Support** | ❌ | ❌ | ✅ | ✅ (Dedicated) |
| **SLA** | ❌ | ❌ | ❌ | 99.9% |
| **Stock Tracking** | ❌ | ✅ | ✅ | ✅ |
| **Multi-page** | ❌ | ✅ (5 pages) | ✅ (Unlimited) | ✅ (Unlimited) |

---

## 3. Database Migration (015_remove_trial_system.sql)

```sql
-- 015_remove_trial_system.sql
-- Run in transaction

BEGIN;

-- 1. Drop trial_ends_at from users
ALTER TABLE users DROP COLUMN IF EXISTS trial_ends_at;

-- 2. Update subscriptions status constraint (remove 'trialing')
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_status_check 
CHECK (status IN ('active', 'past_due', 'canceled', 'incomplete', 'incomplete_expired'));

-- 3. Migrate existing 'trialing' subscriptions to 'active' with tier='free'
UPDATE subscriptions 
SET status = 'active', 
    tier = 'free',
    updated_at = now()
WHERE status = 'trialing';

-- 4. Ensure all users have a subscription record (insert missing)
INSERT INTO subscriptions (user_id, tier, status, current_period_start, current_period_end, payment_gateway)
SELECT u.id, 'free', 'active', now(), now() + interval '1 year', 'none'
FROM users u
LEFT JOIN subscriptions s ON s.user_id = u.id
WHERE s.id IS NULL;

-- 5. Add tier_limits reference table (for easy querying)
CREATE TABLE IF NOT EXISTS tier_limits (
    tier VARCHAR(20) PRIMARY KEY,
    max_websites INTEGER NOT NULL,
    max_products INTEGER NOT NULL,
    max_orders_monthly INTEGER NOT NULL, -- -1 = unlimited
    allow_custom_domain BOOLEAN NOT NULL DEFAULT false,
    included_domains INTEGER NOT NULL DEFAULT 0,
    allow_analytics_export BOOLEAN NOT NULL DEFAULT false,
    allow_customer_list BOOLEAN NOT NULL DEFAULT false,
    allow_stock_tracking BOOLEAN NOT NULL DEFAULT false,
    max_pages INTEGER NOT NULL DEFAULT 0, -- 0 = unlimited
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO tier_limits (tier, max_websites, max_products, max_orders_monthly, allow_custom_domain, included_domains, allow_analytics_export, allow_customer_list, allow_stock_tracking, max_pages) VALUES
('free', 1, 5, 50, false, 0, false, false, false, 0),
('starter', 3, 50, -1, true, 1, true, true, true, 5),
('growth', 10, 200, -1, true, 3, true, true, true, 0),
('enterprise', 999, 9999, -1, true, 10, true, true, true, 0)
ON CONFLICT (tier) DO UPDATE SET
    max_websites = EXCLUDED.max_websites,
    max_products = EXCLUDED.max_products,
    max_orders_monthly = EXCLUDED.max_orders_monthly,
    allow_custom_domain = EXCLUDED.allow_custom_domain,
    included_domains = EXCLUDED.included_domains,
    allow_analytics_export = EXCLUDED.allow_analytics_export,
    allow_customer_list = EXCLUDED.allow_customer_list,
    allow_stock_tracking = EXCLUDED.allow_stock_tracking,
    max_pages = EXCLUDED.max_pages,
    updated_at = now();

-- 6. Add check constraints on websites table for tier limits (enforced via triggers)
-- We'll use application-level checks + triggers for hard enforcement

COMMIT;
```

---

## 4. Tier Limits Helper Library (`src/lib/billing/limits.ts`)

```typescript
import { createServiceSupabaseClient } from '@/lib/supabase/service';

export interface TierLimits {
  maxWebsites: number;
  maxProducts: number;
  maxOrdersMonthly: number; // -1 = unlimited
  allowCustomDomain: boolean;
  includedDomains: number;
  allowAnalyticsExport: boolean;
  allowCustomerList: boolean;
  allowStockTracking: boolean;
  maxPages: number; // 0 = unlimited
}

export const TIER_LIMITS_DEFAULTS: Record<string, TierLimits> = {
  free: { maxWebsites: 1, maxProducts: 5, maxOrdersMonthly: 50, allowCustomDomain: false, includedDomains: 0, allowAnalyticsExport: false, allowCustomerList: false, allowStockTracking: false, maxPages: 0 },
  starter: { maxWebsites: 3, maxProducts: 50, maxOrdersMonthly: -1, allowCustomDomain: true, includedDomains: 1, allowAnalyticsExport: true, allowCustomerList: true, allowStockTracking: true, maxPages: 5 },
  growth: { maxWebsites: 10, maxProducts: 200, maxOrdersMonthly: -1, allowCustomDomain: true, includedDomains: 3, allowAnalyticsExport: true, allowCustomerList: true, allowStockTracking: true, maxPages: 0 },
  enterprise: { maxWebsites: 999, maxProducts: 9999, maxOrdersMonthly: -1, allowCustomDomain: true, includedDomains: 10, allowAnalyticsExport: true, allowCustomerList: true, allowStockTracking: true, maxPages: 0 },
};

export async function getTierLimits(tier: string): Promise<TierLimits> {
  // Try DB first (for dynamic updates), fallback to defaults
  try {
    const supabase = createServiceSupabaseClient();
    const { data } = await supabase
      .from('tier_limits')
      .select('*')
      .eq('tier', tier)
      .single();
    if (data) return data as TierLimits;
  } catch {}
  return TIER_LIMITS_DEFAULTS[tier] ?? TIER_LIMITS_DEFAULTS.free;
}

export interface LimitCheckResult {
  ok: boolean;
  current: number;
  max: number;
  message?: string;
  upgradeUrl?: string;
}

export async function checkWebsiteLimit(userId: string, tier: string): Promise<LimitCheckResult> {
  const limits = await getTierLimits(tier);
  if (limits.maxWebsites === -1) return { ok: true, current: 0, max: -1 };
  
  const supabase = createServiceSupabaseClient();
  const { count } = await supabase
    .from('websites')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  
  const current = count ?? 0;
  return {
    ok: current < limits.maxWebsites,
    current,
    max: limits.maxWebsites,
    message: `Batas website tercapai (${current}/${limits.maxWebsites}). Upgrade untuk menambah lebih banyak.`,
    upgradeUrl: '/dashboard/settings/billing',
  };
}

export async function checkProductLimit(websiteId: string, tier: string): Promise<LimitCheckResult> {
  const limits = await getTierLimits(tier);
  if (limits.maxProducts === -1) return { ok: true, current: 0, max: -1 };
  
  const supabase = createServiceSupabaseClient();
  const { count } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('website_id', websiteId)
    .eq('is_active', true);
  
  const current = count ?? 0;
  return {
    ok: current < limits.maxProducts,
    current,
    max: limits.maxProducts,
    message: `Batas produk tercapai (${current}/${limits.maxProducts}). Upgrade untuk menambah lebih banyak.`,
    upgradeUrl: '/dashboard/settings/billing',
  };
}

export async function checkOrdersMonthlyLimit(websiteId: string, tier: string): Promise<LimitCheckResult> {
  const limits = await getTierLimits(tier);
  if (limits.maxOrdersMonthly === -1) return { ok: true, current: 0, max: -1 };
  
  const supabase = createServiceSupabaseClient();
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  
  const { count } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('website_id', websiteId)
    .gte('order_date', startOfMonth.toISOString());
  
  const current = count ?? 0;
  return {
    ok: current < limits.maxOrdersMonthly,
    current,
    max: limits.maxOrdersMonthly,
    message: `Batas order bulanan tercapai (${current}/${limits.maxOrdersMonthly}). Upgrade untuk order unlimited.`,
    upgradeUrl: '/dashboard/settings/billing',
  };
}

export async function checkCustomDomainLimit(userId: string, tier: string): Promise<LimitCheckResult> {
  const limits = await getTierLimits(tier);
  if (!limits.allowCustomDomain) {
    return { ok: false, current: 0, max: 0, message: 'Custom domain tidak tersedia di tier Free. Upgrade ke Starter.', upgradeUrl: '/dashboard/settings/billing' };
  }
  
  const supabase = createServiceSupabaseClient();
  const { count } = await supabase
    .from('websites')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .not('custom_domain', 'is', null)
    .eq('custom_domain_verified', true);
  
  const current = count ?? 0;
  return {
    ok: current < limits.includedDomains,
    current,
    max: limits.includedDomains,
    message: `Batas custom domain tercapai (${current}/${limits.includedDomains}).`,
    upgradeUrl: '/dashboard/settings/billing',
  };
}

export async function checkPagesLimit(websiteId: string, tier: string): Promise<LimitCheckResult> {
  const limits = await getTierLimits(tier);
  if (limits.maxPages === 0) return { ok: true, current: 0, max: 0 }; // unlimited
  
  const supabase = createServiceSupabaseClient();
  const { count } = await supabase
    .from('pages')
    .select('id', { count: 'exact', head: true })
    .eq('website_id', websiteId)
    .eq('is_published', true);
  
  const current = count ?? 0;
  return {
    ok: current < limits.maxPages,
    current,
    max: limits.maxPages,
    message: `Batas halaman tercapai (${current}/${limits.maxPages}). Upgrade untuk halaman unlimited.`,
    upgradeUrl: '/dashboard/settings/billing',
  };
}
```

---

## 5. API Integration Points

### 5.1 Website Creation (`app/api/websites/route.ts` - POST)
```typescript
import { checkWebsiteLimit } from '@/lib/billing/limits';

// After auth, before insert:
const limitCheck = await checkWebsiteLimit(userId, user.tier);
if (!limitCheck.ok) {
  return NextResponse.json(
    { success: false, error: limitCheck.message, upgrade_url: limitCheck.upgradeUrl },
    { status: 403 }
  );
}
```

### 5.2 Product Creation (`app/api/user/products/route.ts` - POST)
```typescript
import { checkProductLimit } from '@/lib/billing/limits';

// Get active website first
const site = await getActiveWebsite(userId);
const limitCheck = await checkProductLimit(site.id, user.tier);
if (!limitCheck.ok) {
  return NextResponse.json(
    { success: false, error: limitCheck.message, upgrade_url: limitCheck.upgradeUrl },
    { status: 403 }
  );
}
```

### 5.3 Order Creation (`app/api/orders/route.ts` - POST)
```typescript
import { checkOrdersMonthlyLimit } from '@/lib/billing/limits';

// After tenant resolved, before insert:
const limitCheck = await checkOrdersMonthlyLimit(tenant.websiteId, tenant.userTier);
if (!limitCheck.ok) {
  return NextResponse.json(
    { success: false, error: limitCheck.message, upgrade_url: limitCheck.upgradeUrl },
    { status: 403 }
  );
}
```

### 5.4 Custom Domain Purchase (`app/api/domains/checkout/route.ts`)
```typescript
import { checkCustomDomainLimit } from '@/lib/billing/limits';

const limitCheck = await checkCustomDomainLimit(userId, user.tier);
if (!limitCheck.ok) {
  return NextResponse.json(
    { success: false, error: limitCheck.message, upgrade_url: limitCheck.upgradeUrl },
    { status: 403 }
  );
}
```

### 5.5 Page Creation (`app/api/user/pages/route.ts` - POST) - Sprint 5
```typescript
import { checkPagesLimit } from '@/lib/billing/limits';

const limitCheck = await checkPagesLimit(site.id, user.tier);
if (!limitCheck.ok) {
  return NextResponse.json(
    { success: false, error: limitCheck.message, upgrade_url: limitCheck.upgradeUrl },
    { status: 403 }
  );
}
```

---

## 6. UI Updates

### 6.1 Billing Panel (`src/components/dashboard/billing-panel.tsx`)
- Remove "Trial 14 hari" messaging
- Show Free tier as permanent with limits clearly listed
- Upgrade cards show what unlocks at each tier
- Current usage indicators: "Website: 1/1", "Produk: 3/5", "Order/bulan: 12/50"

### 6.2 Dashboard Header / Website Switcher
- Show tier badge: `Free`, `Starter`, `Growth`, `Enterprise`
- Click tier badge → navigate to billing

### 6.3 Limit Banners (Contextual)
- Products page: "Free tier: 3/5 produk" + Upgrade button
- Domain page: "Custom domain tersedia di Starter+" + Upgrade button
- Analytics export: "Export CSV tersedia di Starter+" + Upgrade button
- Pages: "Halaman tambahan tersedia di Starter+" + Upgrade button

### 6.4 Registration Flow
- Remove "Trial 14 hari" from signup page
- Show Free tier features + limits immediately
- Success message: "Akun dibuat! Anda berada di paket Gratis permanen."

---

## 7. Pricing Sync (Migration 012 already exists - Update)

```sql
-- Update plans table with new pricing (yearly prices shown, monthly = yearly/12*1.25)
UPDATE plans SET 
  price_monthly = 0, price_yearly = 0,
  features = '{"websites":1,"products":5,"orders_monthly":50,"custom_domain":false,"analytics_export":false,"customer_list":false,"stock_tracking":false,"pages":0}'::jsonb
WHERE tier = 'free';

UPDATE plans SET 
  price_monthly = 99000, price_yearly = 79000,
  features = '{"websites":3,"products":50,"orders_monthly":-1,"custom_domain":true,"analytics_export":true,"customer_list":true,"stock_tracking":true,"pages":5}'::jsonb
WHERE tier = 'starter';

UPDATE plans SET 
  price_monthly = 249000, price_yearly = 199000,
  features = '{"websites":10,"products":200,"orders_monthly":-1,"custom_domain":true,"analytics_export":true,"customer_list":true,"stock_tracking":true,"pages":0}'::jsonb
WHERE tier = 'growth';

UPDATE plans SET 
  price_monthly = 599000, price_yearly = 479000,
  features = '{"websites":999,"products":9999,"orders_monthly":-1,"custom_domain":true,"analytics_export":true,"customer_list":true,"stock_tracking":true,"pages":0}'::jsonb
WHERE tier = 'enterprise';
```

---

## 8. Migration Script for Existing Users

```sql
-- Run after migration 015
-- Migrate any remaining trial users to Free

UPDATE users u
SET updated_at = now()
WHERE EXISTS (
  SELECT 1 FROM subscriptions s 
  WHERE s.user_id = u.id AND s.status = 'active' AND s.tier = 'free'
);

-- Log migration
INSERT INTO audit_logs (user_id, action, metadata, created_at)
SELECT u.id, 'trial_removed_migrated_to_free', jsonb_build_object('migrated_at', now()), now()
FROM users u
JOIN subscriptions s ON s.user_id = u.id
WHERE s.tier = 'free' AND s.status = 'active';
```

---

## 9. Task Breakdown

| Task | File(s) | Estimate |
|------|---------|----------|
| 1. Create migration 015_remove_trial_system.sql | `supabase/migrations/015_remove_trial_system.sql` | 2h |
| 2. Run migration on staging + verify | Supabase CLI | 1h |
| 3. Create tier_limits table + seed | Part of migration 015 | 1h |
| 4. Create limits.ts helper library | `src/lib/billing/limits.ts` | 3h |
| 5. Update website creation API | `app/api/websites/route.ts` | 1h |
| 6. Update product creation API | `app/api/user/products/route.ts` | 1h |
| 7. Update order creation API | `app/api/orders/route.ts` | 1h |
| 8. Update domain checkout API | `app/api/domains/checkout/route.ts` | 1h |
| 9. Update billing panel UI | `src/components/dashboard/billing-panel.tsx` | 3h |
| 10. Update pricing in plans table | SQL update (part of migration) | 0.5h |
| 11. Update signup page (remove trial messaging) | `app/(auth)/signup/page.tsx` | 1h |
| 12. Add limit banners to products, domains, analytics, pages | Various dashboard pages | 3h |
| 13. Update dashboard header tier badge | `src/components/dashboard/header.tsx` | 1h |
| 14. Migration script for existing trial users | SQL script | 1h |
| 15. Integration testing (Free/Starter/Growth limits) | Manual + script | 3h |
| 16. Update i18n strings | `src/lib/i18n/locales/*.json` | 1h |

**Total: ~24.5 hours (~3.5 days)**

---

## 10. Acceptance Criteria

- [ ] Migration 015 applied: `trial_ends_at` column removed, `trialing` status removed
- [ ] New user registers → immediately on Free tier (no trial)
- [ ] Free user: max 1 website, 5 products, 50 orders/month, no custom domain
- [ ] Starter user: 3 websites, 50 products, unlimited orders, 1 custom domain included
- [ ] Growth user: 10 websites, 200 products, 3 custom domains included
- [ ] Enterprise user: 999 websites, 9999 products, 10 custom domains included
- [ ] API returns 403 with `upgrade_url` when limit exceeded
- [ ] UI shows current usage vs limits with upgrade prompts
- [ ] Billing panel shows Free as permanent tier with clear limits
- [ ] Existing trial users migrated to Free (active)
- [ ] Pricing in plans table matches new structure
- [ ] No TypeScript errors, ESLint clean

---

## 11. Rollback Plan

1. Revert migration 015: `ALTER TABLE users ADD COLUMN trial_ends_at TIMESTAMPTZ; ALTER TABLE subscriptions ADD CONSTRAINT ... CHECK (status IN ('active', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'trialing'));`
2. Restore `trialing` status for affected subscriptions
3. Feature flag: `NEXT_PUBLIC_TRIAL_ENABLED=true` → re-enable trial logic in code
4. Billing panel shows trial messaging again

---

## 12. Communication Plan

- **In-app banner** (1 week before): "Perubahan paket: Trial 14 hari akan dihapus. Free tier jadi permanen dengan batas fitur."
- **Email to existing users**: "Paket Anda berubah: trial berakhir, Anda pindah ke Free permanen. Lihat batas baru di sini."
- **Documentation update**: Pricing page, FAQ