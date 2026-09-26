# Sprint 3: WhatsApp Gateway + Notification Center
**Duration:** 1 week (5 working days)  
**Goal:** Configure Fonnte WA gateway, implement event-driven notifications, build notification log UI, add retry logic.

---

## 1. User Stories

| ID | Story | Points |
|----|-------|--------|
| US-3.1 | As a merchant, I want to receive instant WA notification for new orders so I can respond fast | 5 |
| US-3.2 | As a merchant, I want to configure my WA number in settings and test the connection | 3 |
| US-3.3 | As a merchant, I want to see notification history with delivery status so I know what was sent | 3 |
| US-3.4 | As a system, I want to retry failed notifications (exponential backoff) so transient failures don't lose alerts | 3 |
| US-3.5 | As a merchant, I want to choose which events trigger WA (new order, status change, payment, domain expiry) | 2 |
| US-3.6 | As a customer, I want to receive WA notification when my order status changes (optional, Meta template required) | 5 |

**Total: 21 points**

---

## 2. Provider: Fonnte (Indonesian WA Gateway)

### Why Fonnte?
- Local Indonesian provider, supports Indonesian numbers natively
- Simple REST API, affordable (~Rp 150k/bulan for 1000 messages)
- Supports text, image, document, location, contact messages
- Webhook for delivery status (optional)
- No Meta Business verification needed for basic sending (uses their registered numbers)

### Fonnte API Spec
```
Base URL: https://api.fonnte.com
Auth: Header "Authorization: {API_KEY}"

POST /send
Body: {
  target: "628123456789",           // Required: recipient with country code
  message: "Order baru #ORD-123...", // Required: text message
  countryCode: "62",                // Optional, default 62
  delay: 0,                         // Optional: delay in seconds
  schedule: "",                     // Optional: ISO datetime for scheduling
}
Response: { status: true, message: "Sent", data: { id: "msg_xxx" } }

POST /sendImage
Body: { target, url, caption, ... }

GET /device
Response: { status: true, data: { name: "My Device", number: "62812...", connected: true } }
```

---

## 3. Database Migration (020_create_notification_logs.sql)

```sql
-- 020_create_notification_logs.sql
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    website_id UUID REFERENCES websites(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,           -- 'order.created', 'order.status_changed', 'payment.paid', 'domain.expiring'
    event_payload JSONB NOT NULL,              -- Full event data for debugging/replay
    recipient_type VARCHAR(20) NOT NULL,       -- 'merchant' | 'customer'
    recipient_value VARCHAR(100) NOT NULL,     -- Phone number (62812...) or email
    provider VARCHAR(20) NOT NULL DEFAULT 'fonnte',
    provider_message_id VARCHAR(100),          -- Fonnte message ID
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending' | 'sent' | 'failed' | 'delivered' | 'read'
    error_message TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    next_retry_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_notification_logs_user ON notification_logs(user_id, created_at DESC);
CREATE INDEX idx_notification_logs_website ON notification_logs(website_id, created_at DESC);
CREATE INDEX idx_notification_logs_retry ON notification_logs(next_retry_at) WHERE status = 'failed' AND retry_count < max_retries;
CREATE INDEX idx_notification_logs_event ON notification_logs(event_type, created_at DESC);

-- RLS
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Notification logs: user can view own"
ON notification_logs FOR SELECT
USING (user_id = auth.uid());

-- No INSERT/UPDATE/DELETE policies for users (server-side only via service-role)

-- Trigger for updated_at (if needed)
-- CREATE TRIGGER notification_logs_updated_at ...
```

---

## 4. Notification Preferences (User Settings)

### 4.1 New Table: `user_notification_preferences`
```sql
-- 020b_create_notification_preferences.sql
CREATE TABLE IF NOT EXISTS user_notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    -- Merchant notifications (to owner)
    wa_new_order BOOLEAN NOT NULL DEFAULT true,
    wa_order_status_change BOOLEAN NOT NULL DEFAULT true,
    wa_payment_paid BOOLEAN NOT NULL DEFAULT true,
    wa_domain_expiring BOOLEAN NOT NULL DEFAULT true,
    wa_low_stock BOOLEAN NOT NULL DEFAULT true,
    -- Customer notifications (to buyer) - require Meta template approval
    wa_customer_order_confirmed BOOLEAN NOT NULL DEFAULT false,
    wa_customer_order_shipped BOOLEAN NOT NULL DEFAULT false,
    wa_customer_order_delivered BOOLEAN NOT NULL DEFAULT false,
    -- Email fallback
    email_new_order BOOLEAN NOT NULL DEFAULT true,
    email_order_status_change BOOLEAN NOT NULL DEFAULT false,
    email_payment_paid BOOLEAN NOT NULL DEFAULT true,
    email_domain_expiring BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Notification prefs: user manages own" ON user_notification_preferences FOR ALL USING (user_id = auth.uid());
```

---

## 5. API Contracts

### 5.1 Types (`src/types/notifications.ts`)
```typescript
export type NotificationEventType = 
  | 'order.created'
  | 'order.status_changed'
  | 'payment.paid'
  | 'domain.expiring'
  | 'stock.low';

export interface NotificationEvent {
  type: NotificationEventType;
  website_id: string;
  payload: Record<string, unknown>;
  recipient_override?: string; // Optional: override default recipient
}

export interface NotificationLog {
  id: string;
  user_id: string;
  website_id: string | null;
  event_type: string;
  event_payload: Record<string, unknown>;
  recipient_type: 'merchant' | 'customer';
  recipient_value: string;
  provider: string;
  provider_message_id: string | null;
  status: 'pending' | 'sent' | 'failed' | 'delivered' | 'read';
  error_message: string | null;
  retry_count: number;
  max_retries: number;
  next_retry_at: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  created_at: string;
}

export interface NotificationPreferences {
  user_id: string;
  wa_new_order: boolean;
  wa_order_status_change: boolean;
  wa_payment_paid: boolean;
  wa_domain_expiring: boolean;
  wa_low_stock: boolean;
  wa_customer_order_confirmed: boolean;
  wa_customer_order_shipped: boolean;
  wa_customer_order_delivered: boolean;
  email_new_order: boolean;
  email_order_status_change: boolean;
  email_payment_paid: boolean;
  email_domain_expiring: boolean;
}
```

### 5.2 Endpoints

#### GET `/api/user/notifications`
```
Query: page=1, limit=20, status?, event_type?, date_from?, date_to?
Response: { success: true, data: { logs: NotificationLog[], total, page, limit, total_pages } }
```

#### GET `/api/user/notifications/preferences`
```
Response: { success: true, data: NotificationPreferences }
```

#### PUT `/api/user/notifications/preferences`
```
Body: Partial<NotificationPreferences>
Response: { success: true, data: NotificationPreferences }
```

#### POST `/api/user/notifications/test`
```
Body: { provider: 'fonnte', phone: '628123456789' }
Response: { success: true, message: "Test WA terkirim" }
```

---

## 6. Core Library Updates

### 6.1 Enhanced `src/lib/notify/notify.ts`
```typescript
// Add Fonnte-specific implementation
export interface FonnteOptions extends NotifyOptions {
  senderId?: string; // Fonnte device ID (optional)
}

export async function notifyViaFonnte(
  target: string,
  message: string,
  opts: FonnteOptions = {}
): Promise<NotifyResult> {
  const apiKey = opts.apiKey ?? process.env.NOTIF_API_KEY;
  const senderId = opts.senderId ?? process.env.NOTIF_SENDER_ID;
  
  if (!apiKey) return { sent: false, reason: 'no-api-key' };
  
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 10000);
  
  try {
    const res = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey,
      },
      body: JSON.stringify({
        target,
        message,
        countryCode: '62',
        device: senderId, // Optional: specific device
      }),
      signal: controller.signal,
    });
    
    const data = await res.json();
    if (!res.ok || data.status !== true) {
      console.error('[notify] Fonnte error:', data);
      return { sent: false, reason: 'send-failed', providerResponse: data };
    }
    return { sent: true, reason: 'sent', providerMessageId: data.data?.id };
  } catch (err) {
    console.error('[notify] Fonnte exception:', err);
    return { sent: false, reason: 'send-failed', error: String(err) };
  } finally {
    clearTimeout(timer);
  }
}
```

### 6.2 Notification Dispatcher (`src/lib/notify/dispatcher.ts`)
```typescript
import { createServiceSupabaseClient } from '@/lib/supabase/service';
import { notifyViaFonnte, notifyNewOrder, formatNewOrderMessage } from './notify';
import { getUserNotificationPrefs } from '@/lib/notify/preferences';

export interface DispatchOptions {
  event: NotificationEvent;
  prefs?: NotificationPreferences;
}

export async function dispatchNotification(opts: DispatchOptions): Promise<void> {
  const { event, prefs } = opts;
  const supabase = createServiceSupabaseClient();
  
  // Get merchant phone from website settings
  const { data: website } = await supabase
    .from('websites')
    .select('whatsapp, user_id')
    .eq('id', event.website_id)
    .single();
  
  if (!website?.whatsapp) {
    console.log(`[dispatch] No WA number for website ${event.website_id}`);
    return;
  }
  
  // Check preferences
  const shouldNotify = checkPreference(event.type, prefs);
  if (!shouldNotify) return;
  
  // Create log entry (pending)
  const { data: log } = await supabase
    .from('notification_logs')
    .insert({
      user_id: website.user_id,
      website_id: event.website_id,
      event_type: event.type,
      event_payload: event.payload,
      recipient_type: 'merchant',
      recipient_value: website.whatsapp,
      provider: 'fonnte',
      status: 'pending',
      max_retries: 3,
    })
    .select()
    .single();
  
  if (!log) return;
  
  // Send notification (async, don't block)
  sendWithRetry(log.id, website.whatsapp, event).catch(console.error);
}

function checkPreference(eventType: string, prefs?: NotificationPreferences): boolean {
  if (!prefs) return true; // Default: notify
  const map: Record<string, keyof NotificationPreferences> = {
    'order.created': 'wa_new_order',
    'order.status_changed': 'wa_order_status_change',
    'payment.paid': 'wa_payment_paid',
    'domain.expiring': 'wa_domain_expiring',
    'stock.low': 'wa_low_stock',
  };
  return prefs[map[eventType] as keyof NotificationPreferences] ?? true;
}

async function sendWithRetry(logId: string, target: string, event: NotificationEvent): Promise<void> {
  const supabase = createServiceSupabaseClient();
  const maxRetries = 3;
  const delays = [60000, 300000, 900000]; // 1m, 5m, 15m
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // Update log: retry_count, next_retry_at
    await supabase
      .from('notification_logs')
      .update({ 
        retry_count: attempt,
        next_retry_at: attempt < maxRetries ? new Date(Date.now() + delays[attempt]).toISOString() : null,
        status: attempt === 0 ? 'pending' : 'failed',
      })
      .eq('id', logId);
    
    let result: NotifyResult;
    switch (event.type) {
      case 'order.created':
        result = await notifyViaFonnte(target, formatNewOrderMessage(event.payload as any));
        break;
      case 'order.status_changed':
        result = await notifyViaFonnte(target, formatStatusChangeMessage(event.payload));
        break;
      // ... other events
      default:
        result = { sent: false, reason: 'unknown-event' };
    }
    
    if (result.sent) {
      await supabase
        .from('notification_logs')
        .update({ status: 'sent', sent_at: new Date().toISOString(), provider_message_id: result.providerMessageId })
        .eq('id', logId);
      return;
    }
    
    // Wait before retry (except last attempt)
    if (attempt < maxRetries) {
      await new Promise(r => setTimeout(r, delays[attempt]));
    }
  }
  
  // All retries failed
  await supabase
    .from('notification_logs')
    .update({ status: 'failed', error_message: 'Max retries exceeded' })
    .eq('id', logId);
}

function formatStatusChangeMessage(payload: Record<string, unknown>): string {
  const orderId = payload.order_id as string;
  const status = payload.status as string;
  const customer = payload.customer_name as string;
  const statusLabel: Record<string, string> = {
    'baru': 'Baru',
    'konfirmasi': 'Dikonfirmasi',
    'dikirim': 'Dikirim',
    'selesai': 'Selesai',
  };
  return `Order #${orderId} (${customer}) status: ${statusLabel[status] || status}`;
}
```

---

## 7. Integration Points

### 7.1 Order Creation (`app/api/orders/route.ts`)
```typescript
// After successful order insert:
import { dispatchNotification } from '@/lib/notify/dispatcher';

await dispatchNotification({
  event: {
    type: 'order.created',
    website_id: tenant.websiteId,
    payload: {
      order_id: order.id,
      subdomain: tenant.subdomain,
      total: total,
      customer_name: input.customer_name,
    },
  },
});
```

### 7.2 Order Status Update (`app/api/orders/[id]/status/route.ts`)
```typescript
// After status update:
await dispatchNotification({
  event: {
    type: 'order.status_changed',
    website_id: websiteId,
    payload: {
      order_id: order.id,
      status: newStatus,
      customer_name: order.customer_name,
    },
  },
});
```

### 7.3 Payment Webhook (`app/api/billing/webhook/route.ts`)
```typescript
// On settlement:
await dispatchNotification({
  event: {
    type: 'payment.paid',
    website_id: user.active_website_id,
    payload: {
      amount: invoice.amount,
      period: `${invoice.period_start} - ${invoice.period_end}`,
    },
  },
});
```

### 7.4 Domain Expiry Cron (`app/api/domains/renewal-reminders/route.ts`)
```typescript
// For each expiring domain:
await dispatchNotification({
  event: {
    type: 'domain.expiring',
    website_id: order.website_id,
    payload: {
      domain: order.domain,
      days_left: daysUntilExpiry,
      renew_url: `/dashboard/settings/billing?renew_domain=${order.id}`,
    },
  },
});
```

---

## 8. UI Specification

### 8.1 Notification Settings Page (`/dashboard/settings/notifications/page.tsx`)
```
Sections:
1. Koneksi WhatsApp
   - Status: Terhubung / Belum terhubung
   - Nomor WA Gateway: [input, read-only from env]
   - Nomor Tujuan (Nomor Anda): [input, from website.whatsapp]
   - [Tombol] Test Kirim WA

2. Preferensi Notifikasi (Merchant)
   - [Toggle] Order Baru
   - [Toggle] Perubahan Status Order
   - [Toggle] Pembayaran Berhasil
   - [Toggle] Domain Hampir Expired
   - [Toggle] Stok Rendah

3. Notifikasi ke Pelanggan (Butuh Meta Template)
   - [Toggle] Order Dikonfirmasi
   - [Toggle] Order Dikirim
   - [Toggle] Order Selesai
   - Info: "Memerlukan verifikasi Meta Business"

4. Email Fallback
   - [Toggle] Order Baru
   - [Toggle] Pembayaran Berhasil
   - [Toggle] Domain Hampir Expired

5. Riwayat Notifikasi (Table)
   - Tanggal | Event | Penerima | Status | Retry | Detail
   - Status badges: Tertikir (hijau), Gagal (merah), Pending (kuning)
   - Click row → show payload JSON
```

### 8.2 Notification History Table
```
Columns: Waktu | Event | Tujuan | Status | Percobaan | Aksi
Actions: Kirim Ulang (jika gagal), Lihat Detail
Filters: Status, Event Type, Rentang Tanggal
Pagination: 20 per page
```

---

## 9. Task Breakdown

| Task | File(s) | Estimate |
|------|---------|----------|
| 1. Create migration 020_notification_logs.sql | `supabase/migrations/020_create_notification_logs.sql` | 1h |
| 2. Create migration 020b_notification_preferences.sql | `supabase/migrations/020b_create_notification_preferences.sql` | 1h |
| 3. Update notify.ts with Fonnte implementation | `src/lib/notify/notify.ts` | 2h |
| 4. Create dispatcher.ts | `src/lib/notify/dispatcher.ts` | 3h |
| 5. Create preferences API | `app/api/user/notifications/preferences/route.ts` | 2h |
| 6. Create notification logs API | `app/api/user/notifications/route.ts` | 2h |
| 7. Create test notification API | `app/api/user/notifications/test/route.ts` | 1h |
| 8. Integrate dispatcher in orders API | `app/api/orders/route.ts`, `app/api/orders/[id]/status/route.ts` | 2h |
| 9. Integrate dispatcher in billing webhook | `app/api/billing/webhook/route.ts` | 1h |
| 10. Integrate dispatcher in domain cron | `app/api/domains/renewal-reminders/route.ts` | 1h |
| 11. Notification settings UI | `app/dashboard/settings/notifications/page.tsx` | 4h |
| 12. Notification history UI | `app/dashboard/settings/notifications/history/page.tsx` | 3h |
| 13. Add Fonnte env vars to .env.example | `.env.example` | 0.5h |
| 14. Test with real Fonnte account | Manual | 2h |
| 15. Retry cron (process failed notifications) | `app/api/notifications/retry/route.ts` + vercel.json | 2h |

**Total: ~27.5 hours (~4 days)**

---

## 10. Acceptance Criteria

- [ ] Fonnte configured: `NOTIF_PROVIDER=fonnte`, `NOTIF_API_KEY`, `NOTIF_SENDER_ID` in env
- [ ] Test WA from settings page → received on merchant phone in < 5s
- [ ] New order → merchant receives WA with order details
- [ ] Order status change → merchant receives WA (if enabled in prefs)
- [ ] Payment success → merchant receives WA
- [ ] Domain expiring (T-30, T-14, T-7, T-1) → merchant receives WA
- [ ] Notification log shows all events with status, retry count
- [ ] Failed notifications retry at 1m, 5m, 15m intervals (max 3)
- [ ] Preferences saved per user, respected by dispatcher
- [ ] Free tier: notifications work (no tier restriction on notifications)
- [ ] RLS: users only see their own notification logs
- [ ] No TypeScript errors, ESLint clean

---

## 11. Customer Notifications (Future - Meta Business API)

> **Note:** Customer-facing WA notifications require Meta Business verification and approved templates. This is **out of scope for Sprint 3** but architecture supports it.

### Required for Customer Notifications:
1. Meta Business Manager account verified
2. WhatsApp Business API (via Fonnte or direct)
3. Template approval for:
   - `order_confirmed`: "Halo {{1}}, pesanan #{{2}} dikonfirmasi. Total: {{3}}"
   - `order_shipped`: "Pesanan #{{1}} dikirim via {{2}}. Resi: {{3}}"
   - `order_delivered`: "Pesanan #{{1}} telah sampai. Terima kasih!"
4. Customer phone collected at checkout (already in `orders.customer_phone`)
5. Opt-in consent (checkbox at checkout: "Terima notifikasi WA")

---

## 12. Rollback Plan

1. Feature flag: `NEXT_PUBLIC_ENABLE_WA_NOTIF=false` → dispatcher no-ops
2. Keep existing mock logger in `notify.ts` as fallback
3. Notification tables remain for history
4. Preferences UI hidden behind flag