import type { Feature } from "@/lib/modules/types";

/** Cek Ongkir Feature - Add-on W (POC) */
export const CEK_ONGOIR_FEATURE: Feature = {
  id: "cek_ongkir",
  name: "Cek Ongkir",
  category: "logistik",
  description: "Real-time tarif pengiriman via RajaOngkir/Ongkir API dengan cache",
  scope: "website",
  isPaid: true,
  siteTypes: ["online_shop"],
  requires: ["products_dasar", "orders_wa"],
  conflicts: [],
  isActive: true,
  pricing: { monthly: 25000, yearly: 250000, usageBased: true },
  configSchema: {
    provider: { type: "select", options: [{ label: "RajaOngkir", value: "rajaongkir" }, { label: "Ongkir", value: "ongkir" }], default: "rajaongkir" },
    apiKey: { type: "text", description: "API Key dari provider" },
    cacheTtlMinutes: { type: "number", default: 60, description: "Cache TTL dalam menit" },
    defaultOrigin: { type: "text", description: "Kota asal default (kode kota)" },
    freeShippingThreshold: { type: "number", default: 0, description: "Gratis ongkir di atas nominal ini" },
  },
};

export const CEK_ONGOIR_PREFIX = "ong_";