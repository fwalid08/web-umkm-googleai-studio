/**
 * Domain Order Types — Sprint 2 Custom Domain Real Integration.
 * Provider-agnostic: dipakai untuk Porkbun, DomainNameAPI, maupun mock.
 * Harga dalam IDR utuh (bukan sen) — konsisten dengan docs/STOCK.md (F2-3).
 */
import { z } from "zod";

/** Status lifecycle domain_orders (gabungan legacy 008 + baru Sprint 2). */
export const domainStatusSchema = z.enum([
  "pending_payment", // Midtrans/Xendit checkout dibuat, menunggu bayar
  "registering", // Lunas, sedang register ke registrar (termasuk legacy pending_dokumen)
  "active", // Terdaftar + DNS terverifikasi + terhubung
  "failed", // Register gagal setelah retry (perlu kredit/manual)
  "expired", // Lewat expiry, belum renew
  "deleted", // Dilepas/dihapus
  "transfer_in", // Transfer masuk berjalan
]);

export type DomainStatus = z.infer<typeof domainStatusSchema>;

export interface DnsRecordEntry {
  id?: string; // ID record dari registrar (bila ada)
  type: "A" | "CNAME" | "TXT" | "MX";
  name: string;
  value: string;
  ttl: number;
}

export interface DomainSearchResult {
  domain: string;
  tld: string;
  available: boolean;
  price_yearly: number; // IDR utuh
  currency: "IDR";
  buyable: boolean;
  requirement?: string | null; // mis. "Butuh KTP untuk .co.id"
  premium: boolean;
  premium_price?: number; // IDR utuh (bila premium)
  wholesale_price_usd?: number; // referensi harga grosir USD
}

export interface DomainOrder {
  id: string;
  user_id: string;
  website_id: string;
  domain: string;
  tld: string;
  price_yearly: number;
  status: DomainStatus;
  registrar: string; // "porkbun" | "mock"
  registrar_domain_id: string | null;
  nameservers: string[];
  dns_records: DnsRecordEntry[];
  verification_token: string | null;
  auto_renew: boolean;
  reseller_tier: string | null;
  payment_reference: string | null; // order_id payment gateway (idempotency)
  expires_at: string | null;
  sandbox: boolean;
  created_at: string;
  updated_at: string;
}

/** Respons checkout domain — provider-agnostic (Snap token ATAU invoice URL). */
export interface DomainCheckoutResponse {
  provider: string; // "midtrans" | "xendit" | "mock"
  order_id: string; // payment_reference (prefix "domain-")
  redirect_url: string; // Snap redirect ATAU Xendit invoice URL
  token?: string; // Snap token (midtrans) / invoice id (xendit)
  gross_amount: number; // IDR utuh
  mock: boolean;
}

// --- Zod boundary schemas (pakai di route handlers) ---

export const domainCheckoutSchema = z.object({
  domain: z
    .string()
    .min(4, "Domain tidak valid")
    .max(255)
    .regex(/^([a-z0-9-]+\.)+[a-z]{2,}$/i, "Format domain tidak valid (contoh: tokoku.com)")
    .transform((s) => s.trim().toLowerCase()),
  cycle: z.enum(["yearly"]).default("yearly"), // domain hanya yearly (1 tahun)
});

export const domainRenewSchema = z.object({
  cycle: z.enum(["yearly"]).default("yearly"),
});

export type DomainCheckoutInput = z.infer<typeof domainCheckoutSchema>;
export type DomainRenewInput = z.infer<typeof domainRenewSchema>;
