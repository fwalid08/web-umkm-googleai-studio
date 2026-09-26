/**
 * Registrar Provider Abstraction
 * Sprint 2 — Custom Domain Real Integration
 * Mendukung multiple registrar: Porkbun, Niagahoster, IDCloudHost, dll.
 */

export interface DomainAvailabilityResult {
  domain: string;
  available: boolean;
  priceYearly: number; // dalam IDR (sen)
  currency: string;
  premium: boolean;
  reason?: string;
}

export interface DomainRegisterResult {
  success: boolean;
  domain: string;
  registrarOrderId?: string;
  nameservers?: string[];
  expiresAt?: string; // ISO timestamp
  error?: string;
}

export interface DomainRenewResult {
  success: boolean;
  domain: string;
  expiresAt?: string;
  registrarOrderId?: string;
  error?: string;
}

export interface DomainTransferResult {
  success: boolean;
  domain: string;
  transferId?: string;
  error?: string;
}

export interface DomainInfo {
  domain: string;
  status: "active" | "pending" | "expired" | "transferring" | "redemption";
  expiresAt: string;
  nameservers: string[];
  autoRenew: boolean;
  registrarLock: boolean;
}

export interface DnsRecord {
  type: "A" | "CNAME" | "TXT" | "MX" | "NS";
  name: string;
  value: string;
  ttl?: number;
  priority?: number; // untuk MX
  id?: string; // ID dari registrar (Porkbun, dll)
}

export interface DnsManagementResult {
  success: boolean;
  records?: DnsRecord[];
  error?: string;
}

export interface RegistrarCapabilities {
  supportedTlds: string[];
  supportsDnsManagement: boolean;
  supportsAutoRenew: boolean;
  supportsTransfer: boolean;
  supportsWhoisPrivacy: boolean;
  priceIncludesIcannFee: boolean;
}

export interface RegistrarProvider {
  /** Unique identifier untuk provider ini */
  readonly id: string;
  /** Nama tampilan */
  readonly name: string;
  /** Capabilities yang didukung */
  readonly capabilities: RegistrarCapabilities;

  /**
   * Cek ketersediaan domain (real-time via API registrar)
   */
  checkAvailability(domain: string): Promise<DomainAvailabilityResult>;

  /**
   * Register domain baru
   * @param domain Domain lengkap (contoh: tokoku.com)
   * @param years Jumlah tahun registrasi (default 1)
   * @param nameservers Nameserver yang akan diset (opsional, default ke provider)
   * @param contactData Data kontak registrant (opsional, gunakan default registrar)
   */
  registerDomain(
    domain: string,
    years?: number,
    nameservers?: string[],
    contactData?: RegistrantContact
  ): Promise<DomainRegisterResult>;

  /**
   * Perpanjang domain
   */
  renewDomain(domain: string, years?: number): Promise<DomainRenewResult>;

  /**
   * Transfer domain ke registrar ini (butuh EPP code)
   */
  transferDomain(domain: string, eppCode: string): Promise<DomainTransferResult>;

  /**
   * Ambil info domain
   */
  getDomainInfo(domain: string): Promise<DomainInfo>;

  /**
   * Kelola DNS records
   */
  setDnsRecords(domain: string, records: DnsRecord[]): Promise<DnsManagementResult>;
  getDnsRecords(domain: string): Promise<DnsManagementResult>;

  /**
   * Set auto-renew
   */
  setAutoRenew(domain: string, enabled: boolean): Promise<{ success: boolean; error?: string }>;

  /**
   * Lock/unlock domain untuk transfer
   */
  setRegistrarLock(domain: string, locked: boolean): Promise<{ success: boolean; error?: string }>;
}

export interface RegistrantContact {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string; // ISO 3166-1 alpha-2
  organization?: string;
}

export interface RegistrarConfig {
  provider: string; // "porkbun" | "niagahoster" | "idcloudhost" | ...
  apiKey: string;
  apiSecret: string;
  apiUrl?: string; // override endpoint
  defaultNameservers?: string[];
  defaultContactData?: RegistrantContact;
}

export type RegistrarProviderType = "porkbun" | "niagahoster" | "idcloudhost" | "custom";

export const REGISTRAR_PROVIDERS: Record<RegistrarProviderType, { name: string; defaultApiUrl: string }> = {
  porkbun: { name: "Porkbun", defaultApiUrl: "https://api.porkbun.com/api/json/v3" },
  niagahoster: { name: "Niagahoster", defaultApiUrl: "https://api.niagahoster.co.id/v1" },
  idcloudhost: { name: "IDCloudHost", defaultApiUrl: "https://api.idcloudhost.com/v1" },
  custom: { name: "Custom", defaultApiUrl: "" },
};