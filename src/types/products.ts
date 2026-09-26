/**
 * Extended Product Types for Sprint 1
 * Includes images, stock, variants, and API contracts
 */

export interface Product {
  id: string;
  website_id: string;
  name: string;
  description: string | null;
  price: number;           // IDR utuh (tanpa sen) — lihat docs/STOCK.md (F2-3)
  category: string;
  stock: number;           // -1 = unlimited
  low_stock_threshold: number;
  is_active: boolean;
  sort_order: number;
  images: ProductImage[];
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  storage_path: string;
  public_url: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
  width?: number;
  height?: number;
  file_size?: number;
  mime_type?: string;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;            // e.g., "Size M / Red"
  sku: string | null;
  price_adjustment: number; // bisa negatif/positif
  stock: number;           // -1 = unlimited
  low_stock_threshold: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  variant_id: string | null;
  type: "in" | "out" | "adjust";
  quantity: number;
  reference_id: string | null;
  reference_type: string | null;
  note: string | null;
  created_at: string;
}

// API Request/Response Types
export interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ProductCreateInput {
  name: string;
  price: number;
  description?: string;
  category?: string;
  stock?: number;
  low_stock_threshold?: number;
  is_active?: boolean;
  sort_order?: number;
  images?: File[]; // handled via multipart
}

export interface ProductUpdateInput {
  name?: string;
  price?: number;
  description?: string;
  category?: string;
  stock?: number;
  low_stock_threshold?: number;
  is_active?: boolean;
  sort_order?: number;
}

export interface ProductImageUploadInput {
  images: File[]; // max 5
  alt_texts?: string[];
}

export interface ProductReorderInput {
  productIds: string[]; // ordered array of product IDs
}

export interface StockCheckResult {
  available: boolean;
  currentStock: number;
  requestedQuantity: number;
  message?: string;
}

export interface StockDecrementResult {
  success: boolean;
  newStock: number;
  error?: string;
}

// Tier Limits
export interface ProductTierLimits {
  maxProducts: number;
  maxImagesPerProduct: number;
  maxVariantsPerProduct: number;
  maxFileSizeMb: number;
}

// Tier Limits — SINGLE SOURCE (F3-1): nilai sinkron dengan 013_product_limits.sql
// (free 5/3/0/2MB, starter 50/5/10/2MB, growth 200/10/50/5MB, enterprise 9999/20/200/10MB)
// dan tier_limits (015). Import dari sini via "@/types/products" atau
// re-export "@/lib/billing/limits". Jangan duplikasi literal di file lain.
export const PRODUCT_TIER_LIMITS: Record<string, ProductTierLimits> = {
  free: { maxProducts: 5, maxImagesPerProduct: 3, maxVariantsPerProduct: 0, maxFileSizeMb: 2 },
  starter: { maxProducts: 50, maxImagesPerProduct: 5, maxVariantsPerProduct: 10, maxFileSizeMb: 2 },
  growth: { maxProducts: 200, maxImagesPerProduct: 10, maxVariantsPerProduct: 50, maxFileSizeMb: 5 },
  enterprise: { maxProducts: 9999, maxImagesPerProduct: 20, maxVariantsPerProduct: 200, maxFileSizeMb: 10 },
};

// Zod Schemas
import { z } from "zod";

export const productCreateSchema = z.object({
  name: z.string().min(1, "Nama produk wajib diisi").max(200, "Nama maksimal 200 karakter"),
  price: z.number().int().min(0, "Harga tidak boleh negatif").max(1_000_000_000, "Harga terlalu besar"),
  description: z.string().max(5000, "Deskripsi maksimal 5000 karakter").optional(),
  category: z.string().max(100).optional(),
  stock: z.number().int().min(-1, "Stok minimal -1 (unlimited)").default(0),
  low_stock_threshold: z.number().int().min(0).default(5),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().default(0),
});

export const productUpdateSchema = productCreateSchema.partial();

export const productImageSchema = z.object({
  alt_text: z.string().max(200).optional(),
  sort_order: z.number().int().default(0),
  is_primary: z.boolean().default(false),
});

export const stockMovementSchema = z.object({
  product_id: z.string().uuid(),
  variant_id: z.string().uuid().nullable().optional(),
  type: z.enum(["in", "out", "adjust"]),
  quantity: z.number().int().min(1),
  reference_id: z.string().uuid().nullable().optional(),
  reference_type: z.string().max(50).nullable().optional(),
  note: z.string().max(500).nullable().optional(),
});

export type ProductCreateInputParsed = z.infer<typeof productCreateSchema>;
export type ProductUpdateInputParsed = z.infer<typeof productUpdateSchema>;
export type ProductImageInputParsed = z.infer<typeof productImageSchema>;
export type StockMovementInputParsed = z.infer<typeof stockMovementSchema>;