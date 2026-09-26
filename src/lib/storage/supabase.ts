/**
 * Supabase Storage Implementation
 * Menggunakan @supabase/storage-js atau supabase-js client
 */

import type {
  StorageProvider,
  StorageProviderConfig,
  StorageFile,
  UploadOptions,
  UploadResult,
  DeleteOptions,
  DeleteResult,
  ListOptions,
  ListResult,
  SignedUrlOptions,
  StorageProviderCapabilities,
} from "./types";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

export class SupabaseStorageProvider implements StorageProvider {
  readonly id = "supabase";
  readonly name = "Supabase Storage";
  readonly capabilities: StorageProviderCapabilities = {
    supportsSignedUrls: true,
    supportsPublicUrls: true,
    supportsFolders: true,
    supportsMetadata: true,
    supportsImageTransform: true, // Supabase Image Transformation
    maxFileSizeMb: 50,
    maxFilesPerRequest: 20,
    supportedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/avif",
      "application/pdf",
      "video/mp4",
      "video/webm",
    ],
  };

  private readonly bucket: string;
  private readonly publicUrl?: string;
  private readonly defaultFolder: string;

  constructor(config: StorageProviderConfig) {
    this.bucket = config.bucket || "product-images";
    this.publicUrl = config.publicUrl;
    this.defaultFolder = config.defaultFolder || "";
  }

  private getClient() {
    return createServiceSupabaseClient();
  }

  private buildPath(folder: string | undefined, fileName: string): string {
    const parts = [this.defaultFolder, folder, fileName].filter(Boolean);
    return parts.join("/").replace(/\/+/g, "/");
  }

  private async fileToBuffer(file: Buffer | Uint8Array | Blob): Promise<Buffer> {
    if (Buffer.isBuffer(file)) return file;
    if (file instanceof Uint8Array) return Buffer.from(file);
    if (file instanceof Blob) {
      const arrayBuffer = await file.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }
    throw new Error("Unsupported file type");
  }

  private generateFileName(originalName: string, customName?: string): string {
    const ext = originalName.split(".").pop()?.toLowerCase() || "bin";
    const base = customName || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    return `${base}.${ext}`;
  }

  async upload(file: Buffer | Uint8Array | Blob, options?: UploadOptions): Promise<UploadResult> {
    try {
      const buffer = await this.fileToBuffer(file);
      const originalName = options?.metadata?.originalName as string || "upload";
      const fileName = this.generateFileName(originalName, options?.fileName);
      const path = this.buildPath(options?.folder, fileName);

      const mimeType = (options?.metadata?.mimeType as string) || this.detectMimeType(originalName);

      const { data, error } = await this.getClient().storage
        .from(this.bucket)
        .upload(path, buffer, {
          contentType: mimeType,
          upsert: options?.overwrite ?? false,
          metadata: options?.metadata,
        });

      if (error) {
        return { success: false, error: error.message };
      }

      const signedUrlResult = options?.signedUrl
        ? await this.getSignedUrl({ path: data.path, expiresIn: options.signedUrlExpiresIn })
        : { success: true, url: this.getPublicUrl(data.path) };

      const url = signedUrlResult.url || "";

      return {
        success: true,
        file: {
          path: data.path,
          url,
          originalName,
          mimeType,
          size: buffer.length,
          metadata: options?.metadata,
        },
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Upload failed" };
    }
  }

  async uploadMultiple(
    files: Array<{ buffer: Buffer | Uint8Array | Blob; options?: UploadOptions }>
  ): Promise<UploadResult[]> {
    const results = await Promise.all(
      files.map(({ buffer, options }) => this.upload(buffer, options))
    );
    return results;
  }

  async delete(options: DeleteOptions): Promise<DeleteResult> {
    try {
      const { error } = await this.getClient().storage.from(this.bucket).remove([options.path]);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Delete failed" };
    }
  }

  async deleteMultiple(paths: string[]): Promise<DeleteResult[]> {
    try {
      const { error } = await this.getClient().storage.from(this.bucket).remove(paths);
      if (error) return paths.map(() => ({ success: false, error: error.message }));
      return paths.map(() => ({ success: true }));
    } catch (err) {
      return paths.map(() => ({ success: false, error: err instanceof Error ? err.message : "Delete failed" }));
    }
  }

  async list(options?: ListOptions): Promise<ListResult> {
    try {
      const folder = options?.folder ? `${this.defaultFolder}/${options.folder}`.replace(/\/+/g, "/") : this.defaultFolder;
      const { data, error } = await this.getClient().storage
        .from(this.bucket)
        .list(folder, {
          limit: options?.limit || 100,
          offset: options?.offset || 0,
          sortBy: { column: "created_at", order: "desc" },
        });

      if (error) return { success: false, error: error.message };

      const files: StorageFile[] = (data || []).map((item) => {
        const fullPath = folder ? `${folder}/${item.name}` : item.name;
        return {
          path: fullPath,
          url: this.getPublicUrl(fullPath),
          originalName: item.name,
          mimeType: item.metadata?.mimetype || this.detectMimeType(item.name),
          size: item.metadata?.size || 0,
          metadata: item.metadata as Record<string, unknown> | undefined,
        };
      });

      // Filter by mime type prefix if specified
      let filtered = files;
      if (options?.mimeTypePrefix) {
        filtered = files.filter((f) => f.mimeType.startsWith(options.mimeTypePrefix!));
      }

      return { success: true, files: filtered, total: filtered.length };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "List failed" };
    }
  }

  async getSignedUrl(options: SignedUrlOptions): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const { data, error } = await this.getClient().storage
        .from(this.bucket)
        .createSignedUrl(options.path, options.expiresIn || 3600, {
          download: options.downloadName ? options.downloadName : undefined,
        });

      if (error) return { success: false, error: error.message };
      return { success: true, url: data.signedUrl };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Signed URL failed" };
    }
  }

  getPublicUrl(path: string): string {
    if (this.publicUrl) {
      return `${this.publicUrl.replace(/\/$/, "")}/${path}`;
    }
    const { data } = this.getClient().storage.from(this.bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  async exists(path: string): Promise<boolean> {
    try {
      const { data, error } = await this.getClient().storage.from(this.bucket).list(path.split("/").slice(0, -1).join("/"), {
        search: path.split("/").pop(),
      });
      return !error && (data?.length ?? 0) > 0;
    } catch {
      return false;
    }
  }

  async getFileInfo(path: string): Promise<{ success: boolean; file?: StorageFile; error?: string }> {
    try {
      const folder = path.split("/").slice(0, -1).join("/");
      const fileName = path.split("/").pop() || "";
      const { data, error } = await this.getClient().storage.from(this.bucket).list(folder, {
        search: fileName,
      });

      if (error || !data?.length) {
        return { success: false, error: "File not found" };
      }

      const item = data[0];
      return {
        success: true,
        file: {
          path,
          url: this.getPublicUrl(path),
          originalName: item.name,
          mimeType: item.metadata?.mimetype || this.detectMimeType(item.name),
          size: item.metadata?.size || 0,
          metadata: item.metadata as Record<string, unknown> | undefined,
        },
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Get file info failed" };
    }
  }

  async copy(sourcePath: string, destPath: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.getClient().storage.from(this.bucket).copy(sourcePath, destPath);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Copy failed" };
    }
  }

  async move(sourcePath: string, destPath: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.getClient().storage.from(this.bucket).move(sourcePath, destPath);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Move failed" };
    }
  }

  private detectMimeType(fileName: string): string {
    const ext = fileName.split(".").pop()?.toLowerCase();
    const mimeMap: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      gif: "image/gif",
      avif: "image/avif",
      pdf: "application/pdf",
      mp4: "video/mp4",
      webm: "video/webm",
    };
    return mimeMap[ext || ""] || "application/octet-stream";
  }
}

/**
 * Factory function untuk membuat SupabaseStorageProvider dari env
 */
export function createSupabaseStorageProvider(): SupabaseStorageProvider {
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "product-images";
  const publicUrl = process.env.SUPABASE_STORAGE_PUBLIC_URL;

  return new SupabaseStorageProvider({
    provider: "supabase",
    bucket,
    publicUrl,
    defaultFolder: process.env.SUPABASE_STORAGE_DEFAULT_FOLDER || "",
  });
}