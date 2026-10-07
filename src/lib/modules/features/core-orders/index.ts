import type { Feature } from "@/lib/modules/types";

/** Core Orders Feature - Free for all tiers (WhatsApp checkout) */
export const ORDERS_WA_FEATURE: Feature = {
  id: "orders_wa",
  name: "Order via WhatsApp",
  category: "operasional",
  description: "Terima pesanan via WhatsApp tanpa payment gateway",
  scope: "website",
  isPaid: false,
  siteTypes: ["online_shop"],
  requires: ["products_dasar"],
  conflicts: [],
  isActive: true,
  pricing: { monthly: 0, yearly: 0 },
  configSchema: {
    waNumber: { type: "text", description: "Nomor WhatsApp toko" },
    autoReply: { type: "boolean", default: true },
    orderTemplate: { type: "textarea", description: "Template pesan order" },
  },
};

export const ORDERS_WA_PREFIX = "ord_";