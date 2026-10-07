/**
 * Domain Registration Orchestrator — Sprint 2.
 * Dipanggil webhook payment SETELAH pembayaran lunas (status order registering).
 *
 * Alur: register ke registrar -> buat DNS (A, CNAME, TXT verifikasi) ->
 * update domain_orders -> daftarkan ke Vercel (best-effort, cron retry) ->
 * set custom_domain di website (verified=false, cron /api/domains/verify yang
 * memverifikasi) -> notifikasi via port yang di-inject.
 *
 * Notifikasi: memakai `DomainNotifier` port (default: log server). Sprint 3
 * (dispatcher + notification_logs) mengganti implementasi tanpa mengubah
 * orchestrator ini — JANGAN import @/lib/notify/dispatcher langsung.
 */
import { randomUUID } from "crypto";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { getRegistrarProvider } from "@/lib/registrar/factory";
import type { RegistrarProvider } from "@/lib/registrar/types";
import { addDomainToVercel } from "@/lib/vercel/domains";
import type { DnsRecordEntry } from "@/types/domains";

export const VERCEL_DNS_A_VALUE = "76.76.21.21";
export const VERCEL_DNS_CNAME_VALUE = "cname.vercel-dns.com.";

export interface DomainNotifier {
  domainRegistered(input: { websiteId: string; domain: string; expiresAt?: string }): Promise<void>;
  domainFailed(input: { websiteId: string; domain: string; error: string }): Promise<void>;
}

/** Default: log terstruktur (diganti dispatcher Sprint 3). Tidak pernah throw. */
export const logDomainNotifier: DomainNotifier = {
  async domainRegistered({ websiteId, domain, expiresAt }) {
    console.log(`[domain-registered] website=${websiteId} domain=${domain} expires=${expiresAt ?? "-"}`);
  },
  async domainFailed({ websiteId, domain, error }) {
    console.error(`[domain-failed] website=${websiteId} domain=${domain} error=${error}`);
  },
};

export interface RegisterDeps {
  registrar?: RegistrarProvider;
  addToVercel?: (domain: string) => Promise<{ ok: boolean; error?: string }>;
  notifier?: DomainNotifier;
  verificationToken?: string; // injeksi test; default random
}

interface OrderRow {
  id: string;
  user_id: string;
  website_id: string;
  domain: string;
  status: string;
  registrar: string | null;
}

function buildDnsRecords(verificationToken: string): DnsRecordEntry[] {
  return [
    { type: "A", name: "@", value: VERCEL_DNS_A_VALUE, ttl: 3600 },
    { type: "CNAME", name: "www", value: VERCEL_DNS_CNAME_VALUE, ttl: 3600 },
    { type: "TXT", name: "_saas-verify", value: verificationToken, ttl: 300 },
  ];
}

/**
 * Proses registrasi satu domain_orders. Idempoten: bila order sudah active,
 * langsung return sukses (webhook retry aman). Throw bila gagal (caller:
 * catat retry 1m/5m/15m; setelah 3x -> status failed + notifikasi).
 */
export async function processDomainRegistration(orderId: string, deps: RegisterDeps = {}): Promise<void> {
  const supabase = createServiceSupabaseClient();
  const registrar = deps.registrar ?? getRegistrarProvider();
  const addToVercel = deps.addToVercel ?? ((domain: string) => addDomainToVercel(domain));
  const notifier = deps.notifier ?? logDomainNotifier;
  const verificationToken = deps.verificationToken ?? `saas-verify-${randomUUID().slice(0, 8)}`;

  const { data: order, error: orderError } = await supabase
    .from("dom_orders")
    .select("id, user_id, website_id, domain, status, registrar")
    .eq("id", orderId)
    .maybeSingle();
  if (orderError || !order) throw new Error("Domain order tidak ditemukan");
  const o = order as OrderRow;

  // Idempotency: webhook bisa retry — order active berarti sudah diproses.
  if (o.status === "active") return;
  if (o.status !== "registering") {
    throw new Error(`Order belum siap register (status=${o.status})`);
  }

  let registrarDomainId: string | undefined;
  let expiresAt: string | undefined;
  try {
    const registered = await registrar.registerDomain(o.domain, 1);
    if (!registered.success) throw new Error(registered.error || "Registrar menolak pendaftaran");
    registrarDomainId = registered.registrarOrderId;
    expiresAt = registered.expiresAt;

    const dnsRecords = buildDnsRecords(verificationToken);
    const dnsResult = await registrar.setDnsRecords(o.domain, dnsRecords.map((r) => ({ ...r })));
    if (!dnsResult.success) {
      console.warn(`[domain-register] DNS setup gagal, lanjut (cron/manual): ${dnsResult.error}`);
    }

    const nameservers = registered.nameservers ?? [];
    const { error: updateError } = await supabase
      .from("dom_orders")
      .update({
        status: "active",
        registrar_domain_id: registrarDomainId ?? null,
        nameservers,
        dns_records: dnsRecords,
        verification_token: verificationToken,
        expires_at: expiresAt ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", o.id);
    if (updateError) throw updateError;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Registrasi gagal";
    await notifier.domainFailed({ websiteId: o.website_id, domain: o.domain, error: message }).catch(() => {});
    throw err;
  }

  // Vercel: best-effort, jangan gagalkan order (verify cron akan retry).
  const vercel = await addToVercel(o.domain).catch((err: unknown) => ({
    ok: false as const,
    error: err instanceof Error ? err.message : "Vercel add failed",
  }));
  if (!vercel.ok) {
    console.warn(`[domain-register] Vercel add gagal (retry via cron): ${vercel.error}`);
  }

  // Tautkan ke website — verified=false sampai cron TXT cocok (webhook verify existing).
  await supabase
    .from("ws_websites")
    .update({
      custom_domain: o.domain,
      custom_domain_verified: false,
      custom_domain_verification_token: verificationToken,
      updated_at: new Date().toISOString(),
    })
    .eq("id", o.website_id)
    .eq("user_id", o.user_id);

  await notifier.domainRegistered({ websiteId: o.website_id, domain: o.domain, expiresAt }).catch(() => {});
}

/** Daftar record DNS standar (untuk halaman DNS di dashboard). */
export function standardVercelDnsRecords(verificationToken: string): DnsRecordEntry[] {
  return buildDnsRecords(verificationToken);
}
