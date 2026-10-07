/** Cek Ongkir hooks - business logic, caching, provider integration */

import type { CekOngkirRequest, CekOngkirResponse, ShippingRate, CekOngkirConfig, CachedRate } from "./types";
import { PROVIDER_CONFIG, DEFAULT_CONFIG } from "./types";
import { formatPrice } from "./pricing";

/** Generate cache key */
export function getCacheKey(request: CekOngkirRequest): string {
  return `${request.origin}:${request.destination}:${request.weight}:${request.courier || "all"}`;
}

/** Check if cached rate is valid */
export function isCacheValid(cached: CachedRate): boolean {
  return new Date() < new Date(cached.expiresAt);
}

/** Calculate cache expiry */
export function calculateCacheExpiry(ttlMinutes: number): Date {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + ttlMinutes);
  return expiry;
}

/** Transform RajaOngkir response to standard format */
export function transformRajaOngkirResponse(data: any): ShippingRate[] {
  if (!data?.rajaongkir?.results) return [];

  return data.rajaongkir.results.flatMap((courier: any) =>
    courier.costs.map((cost: any) => ({
      courier: courier.code,
      service: cost.service,
      description: cost.description,
      cost: cost.cost[0].value,
      etd: `${cost.cost[0].etd} hari`,
      note: cost.cost[0].note,
    }))
  );
}

/** Transform Ongkir.info response to standard format */
export function transformOngkirInfoResponse(data: any): ShippingRate[] {
  if (!data?.results) return [];

  return data.results.flatMap((courier: any) =>
    courier.costs.map((cost: any) => ({
      courier: courier.name,
      service: cost.service,
      description: cost.description,
      cost: cost.cost,
      etd: `${cost.etd} hari`,
    }))
  );
}

/** Filter rates by courier */
export function filterRatesByCourier(rates: ShippingRate[], courier?: string): ShippingRate[] {
  if (!courier || courier === "all") return rates;
  return rates.filter((r) => r.courier.toLowerCase() === courier.toLowerCase());
}

/** Sort rates by cost (cheapest first) */
export function sortRatesByCost(rates: ShippingRate[]): ShippingRate[] {
  return [...rates].sort((a, b) => a.cost - b.cost);
}

/** Get cheapest rate per courier */
export function getCheapestPerCourier(rates: ShippingRate[]): ShippingRate[] {
  const byCourier = new Map<string, ShippingRate>();
  for (const rate of rates) {
    const existing = byCourier.get(rate.courier);
    if (!existing || rate.cost < existing.cost) {
      byCourier.set(rate.courier, rate);
    }
  }
  return Array.from(byCourier.values());
}

/** Apply free shipping threshold */
export function applyFreeShipping(rates: ShippingRate[], threshold: number, subtotal: number): ShippingRate[] {
  if (threshold <= 0 || subtotal < threshold) return rates;
  return rates.map((r) => ({ ...r, cost: 0, note: "Gratis ongkir" }));
}

/** Format rate for display */
export function formatRate(rate: ShippingRate): string {
  return `${rate.courier.toUpperCase()} ${rate.service} - ${formatPrice(rate.cost)} (${rate.etd})`;
}

/** Validate config */
export function validateConfig(config: Partial<CekOngkirConfig>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (config.provider && !["rajaongkir", "ongkir"].includes(config.provider)) {
    errors.push("Provider must be 'rajaongkir' or 'ongkir'");
  }
  if (config.apiKey !== undefined && !config.apiKey.trim()) {
    errors.push("API key cannot be empty");
  }
  if (config.cacheTtlMinutes !== undefined && (config.cacheTtlMinutes < 5 || config.cacheTtlMinutes > 1440)) {
    errors.push("Cache TTL must be between 5 and 1440 minutes");
  }
  if (config.freeShippingThreshold !== undefined && config.freeShippingThreshold < 0) {
    errors.push("Free shipping threshold cannot be negative");
  }

  return { valid: errors.length === 0, errors };
}

/** Merge config with defaults */
export function mergeConfig(config: Partial<CekOngkirConfig>): CekOngkirConfig {
  return { ...DEFAULT_CONFIG, ...config };
}

/** Estimate delivery date */
export function estimateDeliveryDate(etd: string): Date {
  const days = parseInt(etd) || 1;
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

/** Check if origin/destination are valid (basic) */
export function validateRoute(origin: string, destination: string): { valid: boolean; error?: string } {
  if (!origin || !destination) return { valid: false, error: "Origin and destination required" };
  if (origin === destination) return { valid: false, error: "Origin and destination cannot be the same" };
  return { valid: true };
}