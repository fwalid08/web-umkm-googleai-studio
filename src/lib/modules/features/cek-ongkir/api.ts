/** Cek Ongkir API handlers */

import type { CekOngkirRequest, CekOngkirResponse, ShippingRate, CekOngkirConfig } from "./types";

const CEKONGKIR_API_PREFIX = "/api/modules/cek-ongkir";

export interface CalculateRatesRequest extends CekOngkirRequest {
  websiteId: string;
}

export interface GetConfigResponse extends CekOngkirConfig {}

/** Calculate shipping rates */
export async function calculateRates(data: CalculateRatesRequest): Promise<CekOngkirResponse> {
  const res = await fetch(`${CEKONGKIR_API_PREFIX}/rates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Unknown error" }));
    throw new Error(error.message || `Failed to calculate rates: ${res.statusText}`);
  }

  return res.json();
}

/** Get list of provinces */
export async function getProvinces(): Promise<Array<{ id: string; name: string }>> {
  const res = await fetch(`${CEKONGKIR_API_PREFIX}/provinces`);
  if (!res.ok) throw new Error(`Failed to get provinces: ${res.statusText}`);
  return res.json();
}

/** Get list of cities for a province */
export async function getCities(provinceId: string): Promise<Array<{ id: string; name: string; type: string }>> {
  const res = await fetch(`${CEKONGKIR_API_PREFIX}/cities?provinceId=${provinceId}`);
  if (!res.ok) throw new Error(`Failed to get cities: ${res.statusText}`);
  return res.json();
}

/** Get cek ongkir config for website */
export async function getConfig(websiteId: string): Promise<GetConfigResponse> {
  const res = await fetch(`${CEKONGKIR_API_PREFIX}/config?websiteId=${websiteId}`);
  if (!res.ok) throw new Error(`Failed to get config: ${res.statusText}`);
  return res.json();
}

/** Update cek ongkir config */
export async function updateConfig(websiteId: string, config: Partial<CekOngkirConfig>): Promise<GetConfigResponse> {
  const res = await fetch(`${CEKONGKIR_API_PREFIX}/config?websiteId=${websiteId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });

  if (!res.ok) throw new Error(`Failed to update config: ${res.statusText}`);
  return res.json();
}

/** Get usage statistics */
export async function getUsageStats(websiteId: string, period: "day" | "week" | "month" = "month"): Promise<{
  totalHits: number;
  cachedHits: number;
  uniqueRoutes: number;
  averageResponseTime: number;
}> {
  const res = await fetch(`${CEKONGKIR_API_PREFIX}/usage?websiteId=${websiteId}&period=${period}`);
  if (!res.ok) throw new Error(`Failed to get usage stats: ${res.statusText}`);
  return res.json();
}

/** Clear cache for website */
export async function clearCache(websiteId: string): Promise<void> {
  const res = await fetch(`${CEKONGKIR_API_PREFIX}/cache?websiteId=${websiteId}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Failed to clear cache: ${res.statusText}`);
}

/** Validate API key */
export async function validateApiKey(apiKey: string, provider: "rajaongkir" | "ongkir"): Promise<{ valid: boolean; error?: string }> {
  const res = await fetch(`${CEKONGKIR_API_PREFIX}/validate-key`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey, provider }),
  });

  if (!res.ok) return { valid: false, error: "Validation failed" };
  return res.json();
}