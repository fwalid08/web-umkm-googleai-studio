/**
 * Storage Provider Abstraction
 * Sprint 1 — Products Management (Image Upload)
 * Mendukung multiple storage: Supabase Storage, AWS S3, Cloudinary
 */

export interface StorageFile {
  /** Path/key file di storage */
  path: string;
  /** Public URL atau signed URL */
  url: string;
  /** Nama file original */
  originalName: string;
  /** MIME type */
  mimeType: string;
  /** Ukuran file dalam bytes */
  size: number;
  /** Width untuk image (opsional) */
  width?: number;
  /** Height untuk image (opsional) */
  height?: number;
  /** Hash untuk deduplikasi (opsional) */
  hash?: string;
  /** Metadata tambahan */
  metadata?: Record<string, unknown>;
}

export interface UploadOptions {
  /** Folder/path prefix (contoh: "product-images/{websiteId}/{productId}") */
  folder?: string;
  /** Nama file custom (tanpa ekstensi) */
  fileName?: string;
  /** Overwrite jika file sudah ada */
  overwrite?: boolean;
  /** Generate signed URL (untuk private bucket) */
  signedUrl?: boolean;
  /** Expired time untuk signed URL (detik) */
  signedUrlExpiresIn?: number;
  /** Metadata custom */
  metadata?: Record<string, unknown>;
}

export interface UploadResult {
  success: boolean;
  file?: StorageFile;
  error?: string;
}

export interface DeleteOptions {
  /** Path file yang akan dihapus */
  path: string;
}

export interface DeleteResult {
  success: boolean;
  error?: string;
}

export interface ListOptions {
  /** Folder prefix */
  folder?: string;
  /** Limit hasil */
  limit?: number;
  /** Offset untuk pagination */
  offset?: number;
  /** Filter by MIME type prefix (contoh: "image/") */
  mimeTypePrefix?: string;
}

export interface ListResult {
  success: boolean;
  files?: StorageFile[];
  total?: number;
  error?: string;
}

export interface SignedUrlOptions {
  /** Path file */
  path: string;
  /** Expired time (detik) */
  expiresIn?: number;
  /** Download filename */
  downloadName?: string;
}

export interface StorageProviderCapabilities {
  supportsSignedUrls: boolean;
  supportsPublicUrls: boolean;
  supportsFolders: boolean;
  supportsMetadata: boolean;
  supportsImageTransform: boolean; // resize, crop, format conversion on-the-fly
  maxFileSizeMb: number;
  maxFilesPerRequest: number;
  supportedMimeTypes: string[];
}

export interface StorageProviderConfig {
  provider: string; // "supabase" | "aws-s3" | "cloudinary" | "custom"
  /** Bucket/container name (required for supabase, aws-s3) */
  bucket?: string;
  /** Base URL untuk public access (opsional) */
  publicUrl?: string;
  /** Region (untuk S3) */
  region?: string;
  /** Credentials */
  accessKey?: string;
  secretKey?: string;
  /** Cloudinary specific */
  cloudName?: string;
  apiKey?: string;
  apiSecret?: string;
  /** Default folder prefix */
  defaultFolder?: string;
}

export interface StorageProvider {
  /** Unique identifier */
  readonly id: string;
  /** Nama tampilan */
  readonly name: string;
  /** Capabilities */
  readonly capabilities: StorageProviderCapabilities;

  /**
   * Upload file
   */
  upload(file: Buffer | Uint8Array | Blob, options?: UploadOptions): Promise<UploadResult>;

  /**
   * Upload multiple files
   */
  uploadMultiple(files: Array<{ buffer: Buffer | Uint8Array | Blob; options?: UploadOptions }>): Promise<UploadResult[]>;

  /**
   * Hapus file
   */
  delete(options: DeleteOptions): Promise<DeleteResult>;

  /**
   * Hapus multiple files
   */
  deleteMultiple(paths: string[]): Promise<DeleteResult[]>;

  /**
   * List files
   */
  list(options?: ListOptions): Promise<ListResult>;

  /**
   * Generate signed URL untuk private file
   */
  getSignedUrl(options: SignedUrlOptions): Promise<{ success: boolean; url?: string; error?: string }>;

  /**
   * Get public URL (untuk public bucket)
   */
  getPublicUrl(path: string): string;

  /**
   * Check if file exists
   */
  exists(path: string): Promise<boolean>;

  /**
   * Get file info
   */
  getFileInfo(path: string): Promise<{ success: boolean; file?: StorageFile; error?: string }>;

  /**
   * Copy file
   */
  copy(sourcePath: string, destPath: string): Promise<{ success: boolean; error?: string }>;

  /**
   * Move/rename file
   */
  move(sourcePath: string, destPath: string): Promise<{ success: boolean; error?: string }>;
}

export type StorageProviderType = "supabase" | "aws-s3" | "cloudinary" | "custom";

export const STORAGE_PROVIDERS: Record<StorageProviderType, { name: string }> = {
  supabase: { name: "Supabase Storage" },
  "aws-s3": { name: "AWS S3" },
  cloudinary: { name: "Cloudinary" },
  custom: { name: "Custom" },
};

export const DEFAULT_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];

export const DEFAULT_MAX_FILE_SIZE_MB = 10;
export const DEFAULT_MAX_FILES_PER_REQUEST = 10;