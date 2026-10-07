import type { Feature } from "@/lib/modules/types";

/** Core Products Feature - Free for all tiers */
export const PRODUCTS_DASAR_FEATURE: Feature = {
  id: "products_dasar",
  name: "Produk Dasar",
  category: "operasional",
  description: "Kelola katalog produk (nama, harga, gambar, varian, stok)",
  scope: "website",
  isPaid: false,
  siteTypes: ["online_shop"],
  requires: [],
  conflicts: [],
  isActive: true,
  pricing: { monthly: 0, yearly: 0 },
  configSchema: {
    maxProductsPerTier: { type: "json", description: "Quota per tier from pack" },
    allowVariants: { type: "boolean", default: true },
    allowImages: { type: "boolean", default: true },
  },
};

export const PRODUCTS_DASAR_PREFIX = "prod_";