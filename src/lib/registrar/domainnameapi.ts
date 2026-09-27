/**
 * DomainNameAPI Registrar Implementation (Atak Domain reseller API).
 * Docs: https://ote.domainresellerapi.com/swagger/index.html (OT&E sandbox)
 *
 * Auth: resellerId + apiKey dikirim di body setiap request.
 * Base URL:
 *   Prod: https://api.domainresellerapi.com/v1
 *   OT&E: https://ote.domainresellerapi.com/v1
 *
 * CATATAN: bentuk respons pasti (field success/data/error) mengikuti pola umum
 * API ini; parsing dibuat defensif (terima beberapa varian field) agar tidak
 * pecah bila panel reseller mengubah casing/nama field.
 */
import type {
  DnsManagementResult,
  DnsRecord,
  DomainAvailabilityResult,
  DomainInfo,
  DomainRegisterResult,
  DomainRenewResult,
  DomainTransferResult,
  RegistrantContact,
  RegistrarCapabilities,
  RegistrarConfig,
  RegistrarProvider,
} from "./types";
import { wholesaleUsdToIdr } from "@/lib/domains/pricing";

const PRODUCTION_BASE = "https://api.domainresellerapi.com/v1";
const OTE_BASE = "https://ote.domainresellerapi.com/v1";
const DEFAULT_NAMESERVERS = ["tr.apiname.com", "eu.apiname.com"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyJson = any;

function pick<T>(...candidates: T[]): T | undefined {
  for (const c of candidates) {
    if (c !== undefined && c !== null && c !== "") return c;
  }
  return undefined;
}

/** Ambil boolean sukses dari berbagai varian respons API. */
function isSuccess(json: AnyJson): boolean {
  if (json == null || typeof json !== "object") return false;
  const v = pick(json.success, json.Success, json.status === "success", json.Status === "success", json.result === "success");
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return v.toLowerCase() === "success" || v.toLowerCase() === "true";
  // Beberapa endpoint hanya mengembalikan data tanpa flag -> anggap sukses bila ada data & tanpa error
  if (json.data !== undefined && json.error === undefined && json.Error === undefined) return true;
  return false;
}

function errorMessage(json: AnyJson, fallback: string): string {
  const m = pick(json?.error, json?.Error, json?.message, json?.Message);
  return typeof m === "string" && m.length > 0 ? m : fallback;
}

export interface DomainNameAPIExtraConfig {
  resellerId?: string;
  apiKey?: string;
  baseUrl?: string;
  isTest?: boolean;
  fetchFn?: typeof fetch;
}

export class DomainNameAPIProvider implements RegistrarProvider {
  readonly id = "domainnameapi";
  readonly name = "DomainNameAPI";
  readonly capabilities: RegistrarCapabilities = {
    supportedTlds: [
      "com",
      "net",
      "org",
      "info",
      "biz",
      "co",
      "io",
      "dev",
      "app",
      "id",
      "co.id",
      "web.id",
      "biz.id",
      "or.id",
      "ac.id",
      "my.id",
    ],
    supportsDnsManagement: true,
    supportsAutoRenew: true,
    supportsTransfer: true,
    supportsWhoisPrivacy: true,
    priceIncludesIcannFee: false,
  };

  private readonly resellerId: string;
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly defaultNameservers: string[];
  private readonly defaultContactData?: RegistrantContact;
  private readonly fetchFn: typeof fetch;

  constructor(config: RegistrarConfig & DomainNameAPIExtraConfig) {
    // Mapping eksplisit (jangan tebak dari field generik):
    // - resellerId: config.resellerId
    // - apiKey: config.apiKey, fallback ke apiSecret bila resellerId eksplisit
    //   (factory mengisi keduanya dari env yang benar).
    const resellerId = config.resellerId ?? config.apiKey;
    const apiKey = config.resellerId ? (config.apiSecret ?? config.apiKey) : (config.apiKey ?? config.apiSecret);
    if (!resellerId || !apiKey) {
      throw new Error("DomainNameAPI resellerId and apiKey required");
    }
    this.resellerId = resellerId;
    this.apiKey = apiKey;
    this.baseUrl = config.baseUrl || (config.isTest === false ? PRODUCTION_BASE : OTE_BASE);
    this.defaultNameservers = config.defaultNameservers || DEFAULT_NAMESERVERS;
    this.defaultContactData = config.defaultContactData;
    this.fetchFn = config.fetchFn ?? fetch;
  }

  private async request<T>(endpoint: string, body: Record<string, unknown>, method = "POST"): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const res = await this.fetchFn(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: method === "GET" ? undefined : JSON.stringify({
        resellerId: this.resellerId,
        apiKey: this.apiKey,
        ...body,
      }),
    });
    return (await res.json()) as T;
  }

  async checkAvailability(domain: string): Promise<DomainAvailabilityResult> {
    try {
      const json = await this.request<AnyJson>("/domain/check", { domain });
      const data = json?.data ?? json;
      const availableRaw = pick(data?.available, data?.Available, json?.available);
      const available = availableRaw === true || String(availableRaw ?? "").toLowerCase() === "yes" || String(availableRaw ?? "").toLowerCase() === "true";
      const priceUsd = Number(pick(data?.price, data?.Price, data?.registrationPrice, json?.price));
      const premiumRaw = pick(data?.premium, data?.isPremium, false);
      const premium = premiumRaw === true || String(premiumRaw).toLowerCase() === "true";
      return {
        domain,
        available: isSuccess(json) ? available : false,
        priceYearly: Number.isFinite(priceUsd) && priceUsd > 0 ? wholesaleUsdToIdr(priceUsd) : 0,
        currency: "IDR",
        premium,
        reason: isSuccess(json) ? undefined : errorMessage(json, "API error"),
      };
    } catch (err) {
      console.error(`DomainNameAPI checkAvailability error for ${domain}:`, err);
      return { domain, available: false, priceYearly: 0, currency: "IDR", premium: false, reason: "API error" };
    }
  }

  async registerDomain(
    domain: string,
    years = 1,
    nameservers?: string[],
    contactData?: RegistrantContact
  ): Promise<DomainRegisterResult> {
    const ns = nameservers || this.defaultNameservers;
    const contact = contactData || this.defaultContactData;
    try {
      const json = await this.request<AnyJson>("/domain/register", {
        domain,
        period: years,
        nameservers: ns,
        ...(contact ? { contacts: contact } : {}),
      });
      if (!isSuccess(json)) {
        return { success: false, domain, error: errorMessage(json, "Registration failed") };
      }
      const data = json?.data ?? {};
      const domainId = String(pick(data?.domainId, data?.id, data?.domain_id, "") ?? "");
      const expiresAt = pick<string>(data?.expiresAt, data?.expirationDate, data?.expires_at);
      return {
        success: true,
        domain,
        registrarOrderId: domainId || undefined,
        nameservers: ns,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      };
    } catch (err) {
      return { success: false, domain, error: err instanceof Error ? err.message : "Registration failed" };
    }
  }

  async renewDomain(domain: string, years = 1): Promise<DomainRenewResult> {
    try {
      const json = await this.request<AnyJson>("/domain/renew", { domain, period: years });
      if (!isSuccess(json)) {
        return { success: false, domain, error: errorMessage(json, "Renewal failed") };
      }
      const data = json?.data ?? {};
      const expiresAt = pick<string>(data?.expiresAt, data?.expirationDate, data?.expires_at);
      const orderId = pick<string>(data?.domainId, data?.orderId, data?.id);
      return {
        success: true,
        domain,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        registrarOrderId: orderId,
      };
    } catch (err) {
      return { success: false, domain, error: err instanceof Error ? err.message : "Renewal failed" };
    }
  }

  async transferDomain(domain: string, eppCode: string): Promise<DomainTransferResult> {
    try {
      const json = await this.request<AnyJson>("/domain/transfer", { domain, authCode: eppCode, eppCode });
      if (!isSuccess(json)) {
        return { success: false, domain, error: errorMessage(json, "Transfer failed") };
      }
      const data = json?.data ?? {};
      const transferId = pick<string>(data?.transferId, data?.orderId, data?.id);
      return { success: true, domain, transferId };
    } catch (err) {
      return { success: false, domain, error: err instanceof Error ? err.message : "Transfer failed" };
    }
  }

  async getDomainInfo(domain: string): Promise<DomainInfo> {
    const json = await this.request<AnyJson>("/domain/info", { domain }, "POST");
    if (!isSuccess(json)) throw new Error(errorMessage(json, "Domain info failed"));
    const data = json?.data ?? {};
    const statusRaw = String(pick(data?.status, data?.Status, "active") ?? "active").toLowerCase();
    const status: DomainInfo["status"] =
      statusRaw.includes("pending") ? "pending"
      : statusRaw.includes("expir") || statusRaw.includes("redemption") ? "expired"
      : statusRaw.includes("transfer") ? "transferring"
      : "active";
    const expiresAt = String(pick(data?.expiresAt, data?.expirationDate, data?.expires_at, new Date().toISOString()));
    const nameservers = (pick<string[]>(data?.nameservers, data?.nameServers, []) ?? []) as string[];
    return {
      domain,
      status,
      expiresAt: new Date(expiresAt).toISOString(),
      nameservers,
      autoRenew: Boolean(pick(data?.autoRenew, data?.auto_renew, false)),
      registrarLock: Boolean(pick(data?.registrarLock, data?.locked, false)),
    };
  }

  async setDnsRecords(domain: string, records: DnsRecord[]): Promise<DnsManagementResult> {
    try {
      const json = await this.request<AnyJson>("/domain/dns", {
        domain,
        records: records.map((r) => ({
          type: r.type,
          name: r.name,
          content: r.value,
          ttl: r.ttl ?? 300,
        })),
      });
      if (!isSuccess(json)) {
        return { success: false, error: errorMessage(json, "DNS update failed") };
      }
      return { success: true, records };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "DNS update failed" };
    }
  }

  async getDnsRecords(domain: string): Promise<DnsManagementResult> {
    try {
      const json = await this.request<AnyJson>("/domain/dns", { domain }, "POST");
      const data = json?.data ?? json;
      const list = (pick<AnyJson[]>(data?.records, data, []) ?? []) as AnyJson[];
      const records: DnsRecord[] = (Array.isArray(list) ? list : []).map((r) => ({
        id: r?.id != null ? String(r.id) : undefined,
        type: (String(r?.type ?? "A").toUpperCase() as DnsRecord["type"]),
        name: String(r?.name ?? r?.host ?? ""),
        value: String(r?.content ?? r?.value ?? ""),
        ttl: Number(r?.ttl ?? 300),
      }));
      return { success: true, records };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "DNS fetch failed" };
    }
  }

  async setAutoRenew(domain: string, enabled: boolean): Promise<{ success: boolean; error?: string }> {
    try {
      const json = await this.request<AnyJson>("/domain/autorenew", { domain, autoRenew: enabled });
      if (!isSuccess(json)) return { success: false, error: errorMessage(json, "Auto-renew update failed") };
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Auto-renew update failed" };
    }
  }

  async setRegistrarLock(domain: string, locked: boolean): Promise<{ success: boolean; error?: string }> {
    try {
      const json = await this.request<AnyJson>("/domain/lock", { domain, lock: locked });
      if (!isSuccess(json)) return { success: false, error: errorMessage(json, "Lock update failed") };
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Lock update failed" };
    }
  }
}

/** Factory dari env. Sandbox default ON (aman): set DOMAINNAMEAPI_SANDBOX=false untuk produksi. */
export function createDomainNameAPIProvider(overrides: DomainNameAPIExtraConfig = {}): DomainNameAPIProvider {
  const isTest = overrides.isTest ?? process.env.DOMAINNAMEAPI_SANDBOX !== "false";
  const resellerId = overrides.resellerId
    ?? (isTest ? process.env.DOMAINNAMEAPI_OTE_RESELLER_ID : process.env.DOMAINNAMEAPI_RESELLER_ID)
    ?? process.env.DOMAINNAMEAPI_RESELLER_ID;
  const apiKey = overrides.apiKey
    ?? (isTest ? process.env.DOMAINNAMEAPI_OTE_API_KEY : process.env.DOMAINNAMEAPI_API_KEY)
    ?? process.env.DOMAINNAMEAPI_API_KEY;
  if (!resellerId || !apiKey) {
    throw new Error("DomainNameAPI credentials not configured (DOMAINNAMEAPI_*_RESELLER_ID / *_API_KEY)");
  }
  return new DomainNameAPIProvider({
    provider: "domainnameapi",
    apiKey,
    apiSecret: apiKey,
    resellerId,
    baseUrl: overrides.baseUrl,
    isTest,
    fetchFn: overrides.fetchFn,
    defaultNameservers: process.env.DEFAULT_NAMESERVERS?.split(",").map((s) => s.trim()).filter(Boolean),
  });
}
