/**
 * Product Image Upload Utility
 * Sprint 1 — Products Management
 * Uses sharp for image processing (resize, WebP conversion)
 * Integrates with switchable storage provider
 */

import sharp from "sharp";
import { getStorageProvider } from "@/lib/storage";
import type { UploadOptions, UploadResult, StorageFile } from "@/lib/storage/types";
import type { ProductImage } from "@/types/products";

export interface ProcessedImage {
  buffer: Buffer;
  mimeType: string;
  width: number;
  height: number;
  size: number;
  format: string;
}

export interface ImageUploadConfig {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  format: "webp" | "jpeg" | "png" | "avif";
  maxFileSizeMb: number;
  allowedMimeTypes: string[];
}

export const DEFAULT_IMAGE_CONFIG: ImageUploadConfig = {
  maxWidth: 800,
  maxHeight: 800,
  quality: 80,
  format: "webp",
  maxFileSizeMb: 2,
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"],
};

/**
 * Process image with sharp: resize, convert to WebP, optimize
 */
export async function processProductImage(
  file: Buffer | Uint8Array | Blob,
  config: Partial<ImageUploadConfig> = {}
): Promise<ProcessedImage> {
  const cfg = { ...DEFAULT_IMAGE_CONFIG, ...config };
  const buffer = Buffer.isBuffer(file) ? file : file instanceof Uint8Array ? Buffer.from(file) : Buffer.from(await file.arrayBuffer());

  // Validate file size
  const sizeMb = buffer.length / (1024 * 1024);
  if (sizeMb > cfg.maxFileSizeMb) {
    throw new Error(`File size ${sizeMb.toFixed(2)}MB exceeds limit of ${cfg.maxFileSizeMb}MB`);
  }

  // Process with sharp
  const processed = await sharp(buffer)
    .rotate() // auto-rotate based on EXIF
    .resize(cfg.maxWidth, cfg.maxHeight, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .toFormat(cfg.format, { quality: cfg.quality })
    .toBuffer({ resolveWithObject: true });

  const metadata = await sharp(processed.data).metadata();

  return {
    buffer: processed.data,
    mimeType: `image/${cfg.format}`,
    width: metadata.width || 0,
    height: metadata.height || 0,
    size: processed.data.length,
    format: cfg.format,
  };
}

/**
 * Process multiple images
 */
export async function processProductImages(
  files: Array<Buffer | Uint8Array | Blob>,
  config?: Partial<ImageUploadConfig>
): Promise<ProcessedImage[]> {
  return Promise.all(files.map((f) => processProductImage(f, config)));
}

/**
 * Upload product images to storage
 */
export async function uploadProductImages(
  websiteId: string,
  productId: string,
  files: Array<{ buffer: Buffer | Uint8Array | Blob; altText?: string }>,
  config?: Partial<ImageUploadConfig>
): Promise<UploadResult[]> {
  const storage = getStorageProvider();
  const folder = `product-images/${websiteId}/${productId}`;

  // Process images first
  const processed = await processProductImages(
    files.map((f) => f.buffer),
    config
  );

  // Upload to storage
  const uploadOptions: UploadOptions = {
    folder,
    overwrite: false,
    signedUrl: true,
    signedUrlExpiresIn: 604800, // 7 days
  };

  const results = await storage.uploadMultiple(
    processed.map((p, i) => ({
      buffer: p.buffer,
      options: {
        ...uploadOptions,
        fileName: `${i}-${Date.now()}`,
        metadata: {
          originalName: files[i]?.altText || `product-${productId}-${i}`,
          mimeType: p.mimeType,
          altText: files[i]?.altText,
          width: p.width,
          height: p.height,
        },
      },
    }))
  );

  return results;
}

/**
 * Delete product images from storage
 */
export async function deleteProductImages(paths: string[]): Promise<boolean> {
  const storage = getStorageProvider();
  const results = await storage.deleteMultiple(paths);
  return results.every((r) => r.success);
}

/**
 * Get signed URLs for product images (for private buckets)
 */
export async function getProductImageSignedUrls(
  paths: string[],
  expiresIn = 604800 // 7 days
): Promise<string[]> {
  const storage = getStorageProvider();
  const urls = await Promise.all(
    paths.map((path) =>
      storage.getSignedUrl({ path, expiresIn }).then((r) => r.url || "")
    )
  );
  return urls;
}

/**
 * Generate product image record for database
 */
export function createProductImageRecord(
  uploadResult: UploadResult,
  sortOrder: number,
  isPrimary: boolean
): Omit<ProductImage, "id" | "created_at"> | null {
  if (!uploadResult.success || !uploadResult.file) return null;

  const file = uploadResult.file;
  return {
    product_id: "", // Will be set after product creation
    storage_path: file.path,
    public_url: file.url,
    alt_text: file.metadata?.altText as string || null,
    sort_order: sortOrder,
    is_primary: isPrimary,
    width: file.width,
    height: file.height,
    file_size: file.size,
    mime_type: file.mimeType,
  };
}

/**
 * Validate image file before processing
 */
export function validateImageFile(file: File | Blob, config: Partial<ImageUploadConfig> = {}): { valid: boolean; error?: string } {
  const cfg = { ...DEFAULT_IMAGE_CONFIG, ...config };

  // Check MIME type
  if (file instanceof File && !cfg.allowedMimeTypes.includes(file.type)) {
    return { valid: false, error: `File type ${file.type} not allowed. Allowed: ${cfg.allowedMimeTypes.join(", ")}` };
  }

  // Check file size
  const sizeMb = file.size / (1024 * 1024);
  if (sizeMb > cfg.maxFileSizeMb) {
    return { valid: false, error: `File size ${sizeMb.toFixed(2)}MB exceeds limit of ${cfg.maxFileSizeMb}MB` };
  }

  return { valid: true };
}

/**
 * Get image config for tier
 */
export function getImageConfigForTier(tier: string): Partial<ImageUploadConfig> {
  const baseConfig = { ...DEFAULT_IMAGE_CONFIG };

  switch (tier) {
    case "free":
      return { ...baseConfig, maxFileSizeMb: 2, maxWidth: 800, maxHeight: 800 };
    case "starter":
      return { ...baseConfig, maxFileSizeMb: 2, maxWidth: 1000, maxHeight: 1000 };
    case "growth":
      return { ...baseConfig, maxFileSizeMb: 5, maxWidth: 1200, maxHeight: 1200 };
    case "enterprise":
      return { ...baseConfig, maxFileSizeMb: 10, maxWidth: 1600, maxHeight: 1600 };
    default:
      return baseConfig;
  }
}