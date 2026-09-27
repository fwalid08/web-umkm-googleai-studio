/**
 * Mock Registrar — simulasi deterministik untuk dev/test.
 * Memakai katalog + simulasi ketersediaan yang sama dengan storefront
 * (src/lib/domains/catalog.ts) sehingga hasil konsisten dengan UI.
 * TIDAK PERNAH dipakai di produksi (factory menolak mock saat NODE_ENV=production).
 */
import { normalizeSearch, simulateAvailability, TLD_CATALOG } from "@/lib/domains/catalog";
import type {
  DnsManagementResult,
  DnsRecord,
  DomainAvailabilityResult,
  DomainInfo,
  DomainRegisterResult,
  DomainRenewResult,
  DomainTransferResult,
  RegistrarCapabilities,
  RegistrarProvider,
} from "./types";

export class MockRegistrarProvider implements RegistrarProvider {
  readonly id = "mock";
  readonly name = "Mock (Simulasi)";
  readonly capabilities: RegistrarCapabilities = {
    supportedTlds: TLD_CATALOG.map((t) => t.tld),
    supportsDnsManagement: true,
    supportsAutoRenew: true,
    supportsTransfer: false,
    supportsWhoisPrivacy: false,
    priceIncludesIcannFee: true,
  };

  async checkAvailability(domain: string): Promise<DomainAvailabilityResult> {
    const tld = domain.split(".").slice(1).join(".");
    const info = TLD_CATALOG.find((t) => t.tld === tld);
    if (!info || normalizeSearch(domain, tld) !== domain) {
      return { domain, available: false, priceYearly: 0, currency: "IDR", premium: false, reason: "TLD tidak didukung" };
    }
    return {
      domain,
      available: info.buyable ? simulateAvailability(domain) : false,
      priceYearly: info.priceYearly,
      currency: "IDR",
      premium: false,
      reason: info.buyable ? undefined : (info.requirement ?? "TLD belum tersedia"),
    };
  }

  async registerDomain(domain: string, years = 1): Promise<DomainRegisterResult> {
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + years);
    return {
      success: true,
      domain,
      registrarOrderId: `mock-${Date.now()}`,
      nameservers: ["ns1.mock.invalid", "ns2.mock.invalid"],
      expiresAt: expires.toISOString(),
    };
  }

  async renewDomain(domain: string, years = 1): Promise<DomainRenewResult> {
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + years);
    return { success: true, domain, expiresAt: expires.toISOString(), registrarOrderId: `mock-renew-${Date.now()}` };
  }

  async transferDomain(domain: string): Promise<DomainTransferResult> {
    return { success: false, domain, error: "Transfer tidak didukung provider mock" };
  }

  async getDomainInfo(domain: string): Promise<DomainInfo> {
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    return {
      domain,
      status: "active",
      expiresAt: expires.toISOString(),
      nameservers: ["ns1.mock.invalid", "ns2.mock.invalid"],
      autoRenew: true,
      registrarLock: false,
    };
  }

  async setDnsRecords(domain: string, records: DnsRecord[]): Promise<DnsManagementResult> {
    void domain;
    return { success: true, records };
  }

  async getDnsRecords(domain: string): Promise<DnsManagementResult> {
    void domain;
    return { success: true, records: [] };
  }

  async setAutoRenew(domain: string, enabled: boolean): Promise<{ success: boolean; error?: string }> {
    void domain;
    void enabled;
    return { success: true };
  }

  async setRegistrarLock(domain: string, locked: boolean): Promise<{ success: boolean; error?: string }> {
    void domain;
    void locked;
    return { success: true };
  }
}
