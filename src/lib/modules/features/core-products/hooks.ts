/** Core Products hooks - business logic, validation, limit checks */

import type { ProductLimit, CreateProductRequest } from "./types";
import { PRODUCT_TIER_LIMITS } from "./types";

/** Get product limits for a tier */
export function getProductLimits(tier: "free" | "starter" | "growth" | "enterprise"): ProductLimit {
  return PRODUCT_TIER_LIMITS[tier];
}

/** Check if user can create more products */
export function canCreateProduct(
  tier: "free" | "starter" | "growth" | "enterprise",
  currentCount: number
): { allowed: boolean; limit: number; reason?: string } {
  const limit = PRODUCT_TIER_LIMITS[tier].maxProducts;
  if (currentCount >= limit) {
    return { allowed: false, limit, reason: `Product limit reached (${limit})` };
  }
  return { allowed: true, limit };
}

/** Check if user can add more images to product */
export function canAddImage(
  tier: "free" | "starter" | "growth" | "enterprise",
  currentImages: number
): { allowed: boolean; limit: number; reason?: string } {
  const limit = PRODUCT_TIER_LIMITS[tier].maxImagesPerProduct;
  if (currentImages >= limit) {
    return { allowed: false, limit, reason: `Max images per product reached (${limit})` };
  }
  return { allowed: true, limit };
}

/** Check if user can add more variants */
export function canAddVariant(
  tier: "free" | "starter" | "growth" | "enterprise",
  currentVariants: number
): { allowed: boolean; limit: number; reason?: string } {
  const limit = PRODUCT_TIER_LIMITS[tier].maxVariants;
  if (currentVariants >= limit) {
    return { allowed: false, limit, reason: `Max variants reached (${limit})` };
  }
  return { allowed: true, limit };
}

/** Validate product data */
export function validateProductData(data: CreateProductRequest): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.name?.trim()) errors.push("Product name is required");
  if (data.price === undefined || data.price < 0) errors.push("Valid price is required");
  if (data.compareAtPrice !== undefined && data.compareAtPrice < 0) errors.push("Compare at price must be positive");
  if (data.stock !== undefined && data.stock < 0) errors.push("Stock cannot be negative");
  if (data.images && data.images.length > 20) errors.push("Too many images (max 20)");

  return { valid: errors.length === 0, errors };
}

/** Calculate product discount percentage */
export function calculateDiscount(price: number, compareAtPrice?: number): number {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

/** Format price for display (Indonesian Rupiah) */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/** Generate SKU from product name */
export function generateSKU(name: string, variantName?: string): string {
  const base = name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
  const variant = variantName ? variantName.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4) : "";
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${base}${variant ? `-${variant}` : ""}-${random}`;
}

/** Check if product is in stock */
export function isInStock(product: { stock: number; trackStock: boolean }): boolean {
  if (!product.trackStock) return true;
  return product.stock > 0;
}

/** Get stock status label */
export function getStockStatus(product: { stock: number; trackStock: boolean }): "in_stock" | "low_stock" | "out_of_stock" {
  if (!product.trackStock) return "in_stock";
  if (product.stock === 0) return "out_of_stock";
  if (product.stock <= 10) return "low_stock";
  return "in_stock";
}