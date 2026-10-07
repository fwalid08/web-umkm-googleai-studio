/** Cek Ongkir types */

export type OngkirProvider = "rajaongkir" | "ongkir";

export interface CekOngkirConfig {
  provider: OngkirProvider;
  apiKey: string;
  cacheTtlMinutes: number;
  defaultOrigin: string;
  freeShippingThreshold: number;
}

export interface ShippingRate {
  courier: string;
  service: string;
  description: string;
  cost: number;
  etd: string; // Estimated time delivery
  note?: string;
}

export interface CekOngkirRequest {
  origin: string;      // City/district code
  destination: string; // City/district code
  weight: number;      // In grams
  courier?: string;    // Specific courier or "all"
}

export interface CekOngkirResponse {
  rates: ShippingRate[];
  cached: boolean;
  queriedAt: Date;
}

export interface CekOngkirUsage {
  id: string;
  websiteId: string;
  userId: string;
  origin: string;
  destination: string;
  weight: number;
  courier?: string;
  resultsCount: number;
  cached: boolean;
  createdAt: Date;
}

export interface CachedRate {
  id: string;
  origin: string;
  destination: string;
  weight: number;
  courier: string;
  rates: ShippingRate[];
  expiresAt: Date;
  createdAt: Date;
}

export const PROVIDER_CONFIG = {
  rajaongkir: {
    baseUrl: "https://api.rajaongkir.com/starter",
    endpoints: {
      province: "/province",
      city: "/city",
      cost: "/cost",
    },
  },
  ongkir: {
    baseUrl: "https://api.ongkir.info",
    endpoints: {
      province: "/province",
      city: "/city",
      cost: "/cost",
    },
  },
} as const;

export const DEFAULT_CONFIG: CekOngkirConfig = {
  provider: "rajaongkir",
  apiKey: "",
  cacheTtlMinutes: 60,
  defaultOrigin: "",
  freeShippingThreshold: 0,
};