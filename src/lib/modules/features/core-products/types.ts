/** Core Products types */

export interface ProductConfig {
  maxProducts: number;
  allowVariants: boolean;
  allowImages: boolean;
  maxImagesPerProduct: number;
}

export interface ProductLimit {
  tier: "free" | "starter" | "growth" | "enterprise";
  maxProducts: number;
  maxVariants: number;
  maxImagesPerProduct: number;
  maxImageSizeMB: number;
}

export const PRODUCT_TIER_LIMITS: Record<"free" | "starter" | "growth" | "enterprise", ProductLimit> = {
  free: { tier: "free", maxProducts: 5, maxVariants: 3, maxImagesPerProduct: 2, maxImageSizeMB: 2 },
  starter: { tier: "starter", maxProducts: 50, maxVariants: 5, maxImagesPerProduct: 10, maxImageSizeMB: 2 },
  growth: { tier: "growth", maxProducts: 500, maxVariants: 10, maxImagesPerProduct: 20, maxImageSizeMB: 5 },
  enterprise: { tier: "enterprise", maxProducts: 9999, maxVariants: 50, maxImagesPerProduct: 50, maxImageSizeMB: 10 },
};

export interface Product {
  id: string;
  websiteId: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  images: ProductImage[];
  variants: ProductVariant[];
  stock: number;
  trackStock: boolean;
  status: "draft" | "active" | "archived";
  categoryId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  alt?: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku?: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  attributes: Record<string, string>;
}