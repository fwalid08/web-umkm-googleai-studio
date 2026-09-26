# Sprint 6: Invoice Generation + Email
**Duration:** 1.5 weeks (7-8 working days)  
**Goal:** Auto-generate professional invoices for completed orders, store as PDF, deliver via email + WA.

---

## 1. User Stories

| ID | Story | Points |
|----|-------|--------|
| US-6.1 | As a merchant, I want invoices auto-generated when order is completed so I don't have to create manually | 5 |
| US-6.2 | As a merchant, I want professional PDF invoices with my branding, tax details, and QRIS code | 5 |
| US-6.3 | As a customer, I want to receive invoice via email and WhatsApp after payment | 3 |
| US-6.4 | As a merchant, I want to view, download, resend, and void invoices from dashboard | 3 |
| US-6.5 | As a system, I want invoices compliant with Indonesian tax (PPN 11%, NPWP optional) | 3 |
| US-6.6 | As a merchant, I want monthly invoice summary report for accounting | 2 |

**Total: 21 points**

---

## 2. Database Migration (019_create_invoices.sql)

```sql
-- 019_create_invoices.sql
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) NOT NULL UNIQUE, -- INV-YYYYMMDD-XXXX
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'void', 'refunded')),
    subtotal BIGINT NOT NULL DEFAULT 0, -- IDR (sen)
    tax_rate NUMERIC(5,2) NOT NULL DEFAULT 11.00, -- PPN 11%
    tax_amount BIGINT NOT NULL DEFAULT 0,
    discount_amount BIGINT NOT NULL DEFAULT 0,
    total_amount BIGINT NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'IDR',
    pdf_url TEXT, -- Signed URL to Supabase Storage
    pdf_generated_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    sent_via VARCHAR(20)[] DEFAULT '{}', -- ['email', 'whatsapp']
    paid_at TIMESTAMPTZ,
    voided_at TIMESTAMPTZ,
    void_reason TEXT,
    due_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
    notes TEXT, -- Internal notes
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_invoices_order ON invoices(order_id);
CREATE INDEX idx_invoices_user ON invoices(user_id, created_at DESC);
CREATE INDEX idx_invoices_website ON invoices(website_id, created_at DESC);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_status ON invoices(status) WHERE status IN ('draft', 'sent');

-- RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Invoices: user can view own"
ON invoices FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Invoices: user can manage own (server)"
ON invoices FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER invoices_updated_at
BEFORE UPDATE ON invoices
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number() RETURNS TEXT AS $$
DECLARE
    v_date TEXT := to_char(now(), 'YYYYMMDD');
    v_seq INT;
    v_number TEXT;
BEGIN
    LOOP
        SELECT COALESCE(MAX(substring(invoice_number FROM 'INV-' || v_date || '-(\d+)$')::INT), 0) + 1
        INTO v_seq
        FROM invoices
        WHERE invoice_number LIKE 'INV-' || v_date || '-%';
        
        v_number := 'INV-' || v_date || '-' || lpad(v_seq::TEXT, 4, '0');
        
        IF NOT EXISTS (SELECT 1 FROM invoices WHERE invoice_number = v_number) THEN
            RETURN v_number;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql VOLATILE;
```

---

## 3. Invoice PDF Generation

### 3.1 Technology Choice: `@react-pdf/renderer` (Server-side via Edge Function)
- Runs in Next.js Edge Runtime (Vercel)
- No Puppeteer/Chrome needed
- React components → PDF
- Good performance, small bundle

### 3.2 PDF Template Component (`src/lib/invoice/pdf-template.tsx`)
```tsx
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { formatIDR } from '@/lib/utils/currency';

// Register font (Inter)
Font.register({ family: 'Inter', fonts: [{ src: '/fonts/Inter-Regular.ttf' }, { src: '/fonts/Inter-Bold.ttf', fontWeight: 'bold' }] });

interface InvoicePDFProps {
  invoice: InvoiceData;
  merchant: MerchantData;
  customer: CustomerData;
  items: InvoiceItem[];
  qrisDataUrl: string; // Base64 QRIS image
}

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Inter', fontSize: 10, lineHeight: 1.5 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, borderBottom: '1px solid #ccc', paddingBottom: 15 },
  logo: { width: 80, height: 80 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#15803D' },
  subtitle: { fontSize: 10, color: '#666' },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#333', marginBottom: 8, textTransform: 'uppercase' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { color: '#666' },
  value: { fontWeight: 'bold' },
  table: { width: '100%', marginTop: 10 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f3f4f6', padding: 8 },
  tableRow: { flexDirection: 'row', padding: 8, borderBottom: '1px solid #e5e7eb' },
  colNo: { width: 40, textAlign: 'center' },
  colItem: { width: '100%', flex: 1, paddingRight: 10 },
  colQty: { width: 60, textAlign: 'center' },
  colPrice: { width: 100, textAlign: 'right' },
  colTotal: { width: 100, textAlign: 'right' },
  totals: { marginTop: 20, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', width: 300, justifyContent: 'space-between', marginBottom: 4 },
  grandTotal: { fontSize: 14, fontWeight: 'bold', color: '#15803D' },
  qris: { marginTop: 30, alignItems: 'center' },
  qrisImage: { width: 150, height: 150 },
  footer: { marginTop: 40, paddingTop: 20, borderTop: '1px solid #ccc', fontSize: 8, color: '#999', textAlign: 'center' },
});

export function InvoicePDF({ invoice, merchant, customer, items, qrisDataUrl }: InvoicePDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            {merchant.logo_url && <Image src={merchant.logo_url} style={styles.logo} />}
            <Text style={styles.title}>{merchant.name}</Text>
            <Text style={styles.subtitle}>{merchant.address}</Text>
            <Text style={styles.subtitle}>NPWP: {merchant.npwp || 'Tidak terdaftar'}</Text>
          </View>
          <View style={{ textAlign: 'right' }}>
            <Text style={styles.title}>INVOICE</Text>
            <Text style={styles.subtitle}>No: {invoice.invoice_number}</Text>
            <Text style={styles.subtitle}>Tanggal: {new Date(invoice.created_at).toLocaleDateString('id-ID')}</Text>
            <Text style={styles.subtitle}>Jatuh Tempo: {new Date(invoice.due_at).toLocaleDateString('id-ID')}</Text>
          </View>
        </View>

        {/* Bill To / Ship To */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ditagihkan Kepada</Text>
            <Text style={styles.value}>{customer.name}</Text>
            <Text>{customer.email}</Text>
            <Text>{customer.phone}</Text>
            <Text>{customer.address}</Text>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dikirim Ke</Text>
            <Text style={styles.value}>{customer.shipping_name || customer.name}</Text>
            <Text>{customer.shipping_address || customer.address}</Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colNo, styles.label]}>No</Text>
            <Text style={[styles.colItem, styles.label]}>Produk / Jasa</Text>
            <Text style={[styles.colQty, styles.label]}>Qty</Text>
            <Text style={[styles.colPrice, styles.label]}>Harga</Text>
            <Text style={[styles.colTotal, styles.label]}>Total</Text>
          </View>
          {items.map((item, i) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={styles.colNo}>{i + 1}</Text>
              <Text style={styles.colItem}>{item.name}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>{formatIDR(item.unit_price)}</Text>
              <Text style={styles.colTotal}>{formatIDR(item.total_price)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.label}>Subtotal</Text>
            <Text style={styles.value}>{formatIDR(invoice.subtotal)}</Text>
          </View>
          {invoice.discount_amount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.label}>Diskon</Text>
              <Text style={styles.value}>- {formatIDR(invoice.discount_amount)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.label}>PPN ({invoice.tax_rate}%)</Text>
            <Text style={styles.value}>{formatIDR(invoice.tax_amount)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.grandTotal}>Total</Text>
            <Text style={styles.grandTotal}>{formatIDR(invoice.total_amount)}</Text>
          </View>
        </View>

        {/* QRIS */}
        <View style={styles.qris}>
          <Text style={styles.sectionTitle}>Pembayaran via QRIS</Text>
          <Image src={qrisDataUrl} style={styles.qrisImage} />
          <Text style={styles.subtitle}>Scan untuk bayar</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Invoice ini dibuat otomatis oleh sistem UMKM SaaS.</Text>
          <Text>Terima kasih telah berbelanja di {merchant.name}.</Text>
        </View>
      </Page>
    </Document>
  );
}
```

---

## 4. Invoice Generation Service (`src/lib/invoice/generator.ts`)

```typescript
import { renderToStream } from '@react-pdf/renderer/node';
import { createServiceSupabaseClient } from '@/lib/supabase/service';
import { InvoicePDF } from './pdf-template';
import { generateQRIS } from '@/lib/payment/qris';
import { formatIDR } from '@/lib/utils/currency';
import { PassThrough } from 'stream';

export interface InvoiceData {
  id: string;
  invoice_number: string;
  order_id: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  due_at: string;
  created_at: string;
}

export interface MerchantData {
  id: string;
  name: string;
  address: string;
  npwp: string | null;
  logo_url: string | null;
  whatsapp: string;
  email: string;
}

export interface CustomerData {
  name: string;
  email: string;
  phone: string;
  address: string;
  shipping_name?: string;
  shipping_address?: string;
}

export interface InvoiceItem {
  id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export async function generateInvoicePDF(
  invoice: InvoiceData,
  merchant: MerchantData,
  customer: CustomerData,
  items: InvoiceItem[]
): Promise<Buffer> {
  // Generate QRIS for payment (if not paid)
  const qrisDataUrl = await generateQRIS({
    merchantName: merchant.name,
    merchantId: merchant.id.slice(0, 15),
    amount: invoice.total_amount,
    reference: invoice.invoice_number,
  });

  // Render PDF to buffer
  const stream = new PassThrough();
  const chunks: Buffer[] = [];
  
  for await (const chunk of renderToStream(
    <InvoicePDF 
      invoice={invoice} 
      merchant={merchant} 
      customer={customer} 
      items={items} 
      qrisDataUrl={qrisDataUrl} 
    />
  )) {
    chunks.push(chunk);
  }
  
  return Buffer.concat(chunks);
}

export async function uploadInvoicePDF(
  userId: string,
  invoiceNumber: string,
  pdfBuffer: Buffer
): Promise<string> {
  const supabase = createServiceSupabaseClient();
  const path = `invoices/${userId}/${invoiceNumber}.pdf`;
  
  const { error } = await supabase.storage
    .from('invoices')
    .upload(path, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    });
  
  if (error) throw error;
  
  // Create signed URL (7 days)
  const { data } = await supabase.storage
    .from('invoices')
    .createSignedUrl(path, 60 * 60 * 24 * 7);
  
  if (!data?.signedUrl) throw new Error('Failed to create signed URL');
  
  return data.signedUrl;
}

export async function createInvoiceForOrder(orderId: string): Promise<string> {
  const supabase = createServiceSupabaseClient();
  
  // Fetch order with relations
  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      websites!inner (
        id, name, user_id, whatsapp,
        users!inner (id, name, email, npwp, logo_url)
      )
    `)
    .eq('id', orderId)
    .single();
  
  if (!order) throw new Error('Order not found');
  
  // Check if invoice already exists
  const { data: existing } = await supabase
    .from('invoices')
    .select('id')
    .eq('order_id', orderId)
    .single();
  
  if (existing) return existing.id;
  
  // Calculate amounts
  const subtotal = order.total_amount;
  const taxRate = 11; // PPN 11%
  const taxAmount = Math.round(subtotal * taxRate / 100);
  const totalAmount = subtotal + taxAmount;
  
  // Generate invoice number
  const invoiceNumber = await supabase.rpc('generate_invoice_number');
  
  // Create invoice record
  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert({
      order_id: orderId,
      user_id: order.websites.user_id,
      website_id: order.website_id,
      invoice_number: invoiceNumber,
      status: 'draft',
      subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      due_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single();
  
  if (error || !invoice) throw error;
  
  // Generate PDF
  const merchant: MerchantData = {
    id: order.websites.users.id,
    name: order.websites.name,
    address: order.websites.users.address || 'Alamat tidak tersedia',
    npwp: order.websites.users.npwp,
    logo_url: order.websites.users.logo_url,
    whatsapp: order.websites.whatsapp,
    email: order.websites.users.email,
  };
  
  const customer: CustomerData = {
    name: order.customer_name,
    email: order.customer_email || '',
    phone: order.customer_phone,
    address: order.delivery_address || 'Alamat tidak tersedia',
  };
  
  const items: InvoiceItem[] = [{
    id: '1',
    name: order.product_name,
    quantity: order.quantity,
    unit_price: order.product_price,
    total_price: order.total_amount,
  }];
  
  const pdfBuffer = await generateInvoicePDF(invoice, merchant, customer, items);
  const pdfUrl = await uploadInvoicePDF(order.websites.user_id, invoiceNumber, pdfBuffer);
  
  // Update invoice with PDF URL
  await supabase
    .from('invoices')
    .update({ pdf_url: pdfUrl, pdf_generated_at: new Date().toISOString(), status: 'sent' })
    .eq('id', invoice.id);
  
  // Send notifications (email + WA)
  await sendInvoiceNotifications(invoice, merchant, customer, pdfUrl);
  
  return invoice.id;
}

async function sendInvoiceNotifications(
  invoice: InvoiceData,
  merchant: MerchantData,
  customer: CustomerData,
  pdfUrl: string
): Promise<void> {
  const supabase = createServiceSupabaseClient();
  
  // 1. Email to customer (if email exists)
  if (customer.email) {
    await sendInvoiceEmail(customer.email, invoice, merchant, pdfUrl);
    await logNotification(invoice.id, 'email', customer.email, 'sent');
  }
  
  // 2. WhatsApp to customer (if phone exists + prefs allow)
  if (customer.phone) {
    await sendInvoiceWhatsApp(customer.phone, invoice, merchant, pdfUrl);
    await logNotification(invoice.id, 'whatsapp', customer.phone, 'sent');
  }
  
  // 3. Email to merchant (copy)
  await sendInvoiceEmail(merchant.email, invoice, merchant, pdfUrl, true);
  await logNotification(invoice.id, 'email', merchant.email, 'sent', true);
}

async function logNotification(
  invoiceId: string,
  channel: 'email' | 'whatsapp',
  recipient: string,
  status: 'sent' | 'failed',
  isMerchant: boolean = false
): Promise<void> {
  const supabase = createServiceSupabaseClient();
  await supabase.from('notification_logs').insert({
    user_id: isMerchant ? (await supabase.from('invoices').select('user_id').eq('id', invoiceId).single()).data?.user_id : null,
    event_type: 'invoice.generated',
    event_payload: { invoice_id: invoiceId, channel, recipient },
    recipient_type: isMerchant ? 'merchant' : 'customer',
    recipient_value: recipient,
    provider: channel === 'email' ? 'sendgrid' : 'fonnte',
    status,
  });
}
```

---

## 5. Email Service (`src/lib/email/sendgrid.ts`)

```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendInvoiceEmail(
  to: string,
  invoice: InvoiceData,
  merchant: MerchantData,
  pdfUrl: string,
  isMerchantCopy: boolean = false
): Promise<void> {
  const subject = isMerchantCopy 
    ? `[Copy] Invoice ${invoice.invoice_number} dari ${merchant.name}`
    : `Invoice ${invoice.invoice_number} dari ${merchant.name}`;
  
  const html = `
    <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #15803D; color: white; padding: 24px; text-align: center;">
        <h1 style="margin: 0;">${merchant.name}</h1>
        <p style="margin: 8px 0 0;">Invoice ${invoice.invoice_number}</p>
      </div>
      
      <div style="padding: 24px;">
        <p>Halo ${isMerchantCopy ? 'Admin' : invoice.customer_name},</p>
        
        <p>${isMerchantCopy ? 'Berikut adalah salinan invoice untuk order yang baru selesai.' : 'Terima kasih telah berbelanja. Berikut adalah invoice untuk pesanan Anda:'}</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>No. Invoice</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${invoice.invoice_number}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Tanggal</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${new Date(invoice.created_at).toLocaleDateString('id-ID')}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Total</strong></td><td style="padding: 8px; border: 1px solid #ddd;"><strong>${formatIDR(invoice.total_amount)}</strong></td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Status</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${invoice.status === 'paid' ? 'Lunas' : 'Menunggu Pembayaran'}</td></tr>
        </table>
        
        <div style="text-align: center; margin: 24px 0;">
          <a href="${pdfUrl}" style="background: #15803D; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">
            📄 Download Invoice (PDF)
          </a>
        </div>
        
        <p style="color: #666; font-size: 12px;">Link download berlaku 7 hari. Jika ada pertanyaan, hubungi kami via WhatsApp: ${merchant.whatsapp}</p>
      </div>
      
      <div style="background: #f9fafb; padding: 16px; text-align: center; color: #999; font-size: 11px;">
        Dikirim otomatis oleh UMKM SaaS • ${merchant.name}
      </div>
    </div>
  `;
  
  await sgMail.send({
    to,
    from: process.env.SENDGRID_FROM_EMAIL!,
    subject,
    html,
  });
}
```

---

## 6. API Contracts

### 6.1 Types (`src/types/invoices.ts`)
```typescript
export interface Invoice {
  id: string;
  order_id: string;
  user_id: string;
  website_id: string;
  invoice_number: string;
  status: 'draft' | 'sent' | 'paid' | 'void' | 'refunded';
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  pdf_url: string | null;
  pdf_generated_at: string | null;
  sent_at: string | null;
  sent_via: string[];
  paid_at: string | null;
  voided_at: string | null;
  void_reason: string | null;
  due_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceListResponse {
  invoices: Invoice[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
```

### 6.2 Endpoints

#### GET `/api/user/invoices`
```
Query: page=1, limit=20, status?, date_from?, date_to?, search?
Response: InvoiceListResponse
```

#### GET `/api/user/invoices/:id`
```
Response: { success: true, data: { invoice: Invoice } }
```

#### GET `/api/user/invoices/:id/download`
```
- Generates signed URL (if expired) or returns existing
- Redirects to PDF or streams PDF
Response: PDF file or 302 redirect
```

#### POST `/api/user/invoices/:id/resend`
```
Body: { via: 'email' | 'whatsapp' | 'both' }
Response: { success: true, message: "Invoice dikirim ulang" }
```

#### POST `/api/user/invoices/:id/void`
```
Body: { reason: string }
Response: { success: true, message: "Invoice dibatalkan" }
- Only allowed if status = 'draft' or 'sent' (not paid)
```

#### POST `/api/user/invoices/monthly-summary`
```
Body: { month: '2026-09' } // YYYY-MM
Response: { success: true, data: { pdf_url: string, period: string } }
- Generates summary PDF of all invoices in month
```

---

## 7. Integration Points

### 7.1 Order Completion Trigger (`app/api/orders/[id]/status/route.ts`)
```typescript
// When status changes to 'selesai':
if (newStatus === 'selesai' && order.payment_status === 'paid') {
  // Async, don't block response
  createInvoiceForOrder(order.id).catch(console.error);
}
```

### 7.2 Payment Webhook (`app/api/billing/webhook/route.ts`)
```typescript
// On subscription payment success:
if (event === 'payment.paid') {
  // Create invoice for subscription payment
  await createSubscriptionInvoice(userId, amount, period);
}
```

---

## 8. UI Specification

### 8.1 Invoice List (`/dashboard/invoices/page.tsx`)
```
Table: No. Invoice | Tanggal | Customer | Total | Status | Aksi
Status badges: Draft (abu), Terkirim (biru), Lunas (hijau), Dibatalkan (merah)
Actions: Lihat, Download PDF, Kirim Ulang, Batalkan (jika draft/terkirim)
Filters: Status, Rentang Tanggal, Search (nomor, customer)
Pagination: 20 per page
```

### 8.2 Invoice Detail Modal
```
- Header: Invoice number, status badge, date
- Merchant info (logo, name, address, NPWP)
- Customer info
- Items table
- Totals: Subtotal, Diskon, PPN 11%, Total
- QRIS code (if not paid)
- Actions: Download, Kirim Email, Kirim WA, Batalkan
- Notes field (internal)
```

### 8.3 Monthly Summary (`/dashboard/invoices/summary/page.tsx`)
```
- Month selector (dropdown)
- Generate button → creates PDF summary
- List of generated summaries with download links
- Summary includes: Total invoices, Total revenue, Tax collected, By status
```

---

## 9. Storage Bucket: `invoices`

```sql
-- Run in Supabase Dashboard
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('invoices', 'invoices', false, 5242880, ARRAY['application/pdf']);

-- Policies
CREATE POLICY "Invoices: user upload own" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Invoices: user read own" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## 10. Task Breakdown

| Task | File(s) | Estimate |
|------|---------|----------|
| 1. Create migration 019_create_invoices.sql | `supabase/migrations/019_create_invoices.sql` | 2h |
| 2. Run migration + create storage bucket | Supabase CLI + Dashboard | 1h |
| 3. Install @react-pdf/renderer + fonts | `package.json` | 0.5h |
| 4. Create PDF template component | `src/lib/invoice/pdf-template.tsx` | 4h |
| 5. Create invoice generator service | `src/lib/invoice/generator.ts` | 4h |
| 6. Create QRIS generator | `src/lib/payment/qris.ts` | 2h |
| 7. Create SendGrid email service | `src/lib/email/sendgrid.ts` | 2h |
| 8. Create invoice API routes | `app/api/user/invoices/route.ts`, `app/api/user/invoices/[id]/route.ts` | 4h |
| 9. Integrate invoice generation in order status | `app/api/orders/[id]/status/route.ts` | 1h |
| 10. Integrate invoice generation in billing webhook | `app/api/billing/webhook/route.ts` | 1h |
| 11. Invoice list UI | `app/dashboard/invoices/page.tsx` | 3h |
| 12. Invoice detail modal | `src/components/dashboard/invoice-detail.tsx` | 3h |
| 13. Monthly summary UI | `app/dashboard/invoices/summary/page.tsx` | 2h |
| 14. Add SendGrid env vars | `.env.example` | 0.5h |
| 15. Integration testing | Manual | 3h |
| 16. Update i18n | `src/lib/i18n/locales/*.json` | 1h |

**Total: ~34 hours (~4.5 days)**

---

## 11. Acceptance Criteria

- [ ] Order status → 'selesai' + payment 'paid' → invoice auto-generated in < 10s
- [ ] PDF generated with correct: merchant branding, customer details, items, PPN 11%, total, QRIS
- [ ] PDF stored in Supabase Storage, signed URL works for 7 days
- [ ] Customer receives email with download link
- [ ] Customer receives WA with download link (if phone + prefs)
- [ ] Merchant receives email copy
- [ ] Dashboard: invoice list with filters, download, resend, void
- [ ] Void only allowed for draft/sent (not paid)
- [ ] Monthly summary PDF generates correctly
- [ ] RLS: users only see own invoices
- [ ] Indonesian tax compliant: NPWP field, PPN 11%, invoice number format
- [ ] No TypeScript errors, ESLint clean

---

## 12. QRIS Generation (`src/lib/payment/qris.ts`)

```typescript
import QRCode from 'qrcode';

export interface QRISData {
  merchantName: string;
  merchantId: string;
  amount: number; // IDR
  reference: string;
}

export async function generateQRIS(data: QRISData): Promise<string> {
  // EMVCo QRIS format (simplified)
  // In production, use proper EMVCo library or bank API
  const payload = `00020101021126670016ID.CO.QRIS.WWW0118936009123456789012345204${data.amount.toString().padStart(12, '0')}5802ID59${data.merchantName.padEnd(25, ' ').slice(0, 25)}6008Jakarta61051234562070703A016304`;
  
  // Generate QR code as base64 data URL
  const dataUrl = await QRCode.toDataURL(payload, {
    width: 300,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
  });
  
  return dataUrl;
}
```

---

## 13. Rollback Plan

1. Drop `invoices` table + storage bucket
2. Remove invoice generation calls from order status + billing webhook
3. Remove invoice UI routes
4. Feature flag: `NEXT_PUBLIC_ENABLE_INVOICES=false`