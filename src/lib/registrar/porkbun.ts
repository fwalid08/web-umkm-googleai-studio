/**
 * Porkbun Registrar Implementation
 * Docs: https://api.porkbun.com/api/json/v3/documentation
 */

import type {
  RegistrarProvider,
  RegistrarConfig,
  DomainAvailabilityResult,
  DomainRegisterResult,
  DomainRenewResult,
  DomainTransferResult,
  DomainInfo,
  DnsRecord,
  DnsManagementResult,
  RegistrantContact,
  RegistrarCapabilities,
} from "./types";

const DEFAULT_NAMESERVERS = ["ns1.vercel-dns.com", "ns2.vercel-dns.com"];

interface PorkbunResponse<T> {
  status: "SUCCESS" | "ERROR";
  message?: string;
  [key: string]: unknown;
}

interface PorkbunDomainInfo {
  apiStatus: "SUCCESS" | "ERROR";
  message?: string;
  domain: string;
  status: string;
  expirationDate: string;
  nameservers: string[];
  autorenew: "YES" | "NO";
  registrarLock: "YES" | "NO";
  [key: string]: unknown;
}

interface PorkbunDnsRecord {
  id: string;
  type: string;
  name: string;
  content: string;
  ttl: string;
  priority?: string;
}

interface PorkbunDnsResponse extends PorkbunResponse<unknown> {
  records: PorkbunDnsRecord[];
}

interface PorkbunPriceResponse extends PorkbunResponse<unknown> {
  pricing: Record<string, { registration: number; renewal: number; transfer: number }>;
}

export class PorkbunProvider implements RegistrarProvider {
  readonly id = "porkbun";
  readonly name = "Porkbun";
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
      "or.id",
      "ac.id",
      "sch.id",
      "my.id",
      "biz.id",
    ],
    supportsDnsManagement: true,
    supportsAutoRenew: true,
    supportsTransfer: true,
    supportsWhoisPrivacy: true,
    priceIncludesIcannFee: true,
  };

  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly apiUrl: string;
  private readonly defaultNameservers: string[];
  private readonly defaultContactData?: RegistrantContact;

  constructor(config: RegistrarConfig) {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.apiUrl = config.apiUrl || "https://api.porkbun.com/api/json/v3";
    this.defaultNameservers = config.defaultNameservers || DEFAULT_NAMESERVERS;
    this.defaultContactData = config.defaultContactData;
  }

  private async request<T>(endpoint: string, body: Record<string, unknown> = {}): Promise<T> {
    const url = `${this.apiUrl}${endpoint}`;
    const payload = {
      apikey: this.apiKey,
      secretapikey: this.apiSecret,
      ...body,
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await res.json()) as PorkbunResponse<T>;

    if (data.status === "ERROR") {
      throw new Error(`Porkbun API Error: ${data.message || "Unknown error"}`);
    }

    return data as T;
  }

  private mapStatus(status: string): DomainInfo["status"] {
    const s = status.toLowerCase();
    if (s.includes("active") || s === "ok") return "active";
    if (s.includes("pending")) return "pending";
    if (s.includes("expired") || s.includes("redemption")) return "expired";
    if (s.includes("transfer")) return "transferring";
    return "active";
  }

  async checkAvailability(domain: string): Promise<DomainAvailabilityResult> {
    const tld = domain.split(".").slice(1).join(".");
    const pricing = await this.getPricing(tld);
    const price = pricing?.registration || 0;

    try {
      const result = await this.request<{ avail: string }>("/domain/check", { domain });
      const available = result.avail === "yes";

      return {
        domain,
        available,
        priceYearly: Math.round(price * 100), // convert to sen (IDR)
        currency: "IDR",
        premium: false,
      };
    } catch (err) {
      // Jika API error, anggap tidak tersedia tapi log error
      console.error(`Porkbun checkAvailability error for ${domain}:`, err);
      return {
        domain,
        available: false,
        priceYearly: Math.round(price * 100),
        currency: "IDR",
        premium: false,
        reason: "API error",
      };
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

    if (!contact) {
      throw new Error("Contact data required for domain registration");
    }

    const body: Record<string, unknown> = {
      domain,
      years,
      nameservers: ns,
      contact: {
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        address1: contact.address1,
        address2: contact.address2 || "",
        city: contact.city,
        state: contact.state,
        postalCode: contact.postalCode,
        country: contact.country,
        organization: contact.organization || "",
      },
      privacy: "YES", // WHOIS privacy default ON
    };

    try {
      const result = await this.request<{ orderId: string }>("/domain/create", body);
      return {
        success: true,
        domain,
        registrarOrderId: result.orderId,
        nameservers: ns,
      };
    } catch (err) {
      return {
        success: false,
        domain,
        error: err instanceof Error ? err.message : "Registration failed",
      };
    }
  }

  async renewDomain(domain: string, years = 1): Promise<DomainRenewResult> {
    try {
      const result = await this.request<{ orderId: string; expirationDate: string }>("/domain/renew", {
        domain,
        years,
      });
      return {
        success: true,
        domain,
        expiresAt: new Date(result.expirationDate).toISOString(),
        registrarOrderId: result.orderId,
      };
    } catch (err) {
      return {
        success: false,
        domain,
        error: err instanceof Error ? err.message : "Renewal failed",
      };
    }
  }

  async transferDomain(domain: string, eppCode: string): Promise<DomainTransferResult> {
    try {
      const result = await this.request<{ orderId: string }>("/domain/transfer", {
        domain,
        authCode: eppCode,
        privacy: "YES",
      });
      return {
        success: true,
        domain,
        transferId: result.orderId,
      };
    } catch (err) {
      return {
        success: false,
        domain,
        error: err instanceof Error ? err.message : "Transfer failed",
      };
    }
  }

  async getDomainInfo(domain: string): Promise<DomainInfo> {
    const result = await this.request<PorkbunDomainInfo>("/domain/getInfo", { domain });
    return {
      domain: result.domain,
      status: this.mapStatus(result.status),
      expiresAt: new Date(result.expirationDate).toISOString(),
      nameservers: result.nameservers,
      autoRenew: result.autoreneew === "YES",
      registrarLock: result.registrarLock === "YES",
    };
  }

  async setDnsRecords(domain: string, records: DnsRecord[]): Promise<DnsManagementResult> {
    try {
      // Porkbun: hapus semua record existing lalu tambah baru
      const existing = await this.getDnsRecords(domain);
      if (existing.records) {
        for (const rec of existing.records) {
          await this.request("/dns/delete", { domain, id: rec.id });
        }
      }

      for (const rec of records) {
        await this.request("/dns/create", {
          domain,
          type: rec.type,
          name: rec.name,
          content: rec.value,
          ttl: rec.ttl || 300,
          priority: rec.priority || 10,
        });
      }

      return { success: true, records };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "DNS update failed",
      };
    }
  }

  async getDnsRecords(domain: string): Promise<DnsManagementResult> {
    try {
      const result = await this.request<PorkbunDnsResponse>("/dns/retrieve", { domain });
      const records: DnsRecord[] = result.records.map((r) => ({
        type: r.type as DnsRecord["type"],
        name: r.name,
        value: r.content,
        ttl: Number(r.ttl),
        priority: r.priority ? Number(r.priority) : undefined,
      }));
      return { success: true, records };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "DNS fetch failed",
      };
    }
  }

  async setAutoRenew(domain: string, enabled: boolean): Promise<{ success: boolean; error?: string }> {
    try {
      await this.request("/domain/autorenew", { domain, autorenew: enabled ? "YES" : "NO" });
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Auto-renew update failed" };
    }
  }

  async setRegistrarLock(domain: string, locked: boolean): Promise<{ success: boolean; error?: string }> {
    try {
      await this.request("/domain/lock", { domain, lock: locked ? "YES" : "NO" });
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Lock update failed" };
    }
  }

  private async getPricing(tld: string): Promise<{ registration: number } | null> {
    try {
      const result = await this.request<PorkbunPriceResponse>("/pricing/get", { tld });
      return result.pricing?.[tld] || null;
    } catch {
      return null;
    }
  }
}

/**
 * Factory function untuk membuat PorkbunProvider dari env
 */
export function createPorkbunProvider(): PorkbunProvider {
  const apiKey = process.env.PORKBUN_API_KEY;
  const apiSecret = process.env.PORKBUN_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error("PORKBUN_API_KEY and PORKBUN_API_SECRET required");
  }

  return new PorkbunProvider({
    provider: "porkbun",
    apiKey,
    apiSecret,
    defaultNameservers: process.env.DEFAULT_NAMESERVERS?.split(",") || DEFAULT_NAMESERVERS,
  });
}