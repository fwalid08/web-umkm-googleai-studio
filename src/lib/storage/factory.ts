/**
 * Storage Factory — Supabase-only (Sprint 1 F1-3).
 * aws-s3.ts / cloudinary.ts stubs were removed: uninstalled SDKs with
 * `any`-typed lazy dynamic imports. Re-add a provider here only together
 * with its SDK dependency + typed client.
 */

import type { StorageProvider, StorageProviderConfig, StorageProviderType } from "./types";
import { SupabaseStorageProvider } from "./supabase";
import { STORAGE_PROVIDERS } from "./types";

let _storageProvider: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (_storageProvider) return _storageProvider;

  const providerType = (process.env.STORAGE_PROVIDER as StorageProviderType) || "supabase";

  switch (providerType) {
    case "supabase":
      _storageProvider = new SupabaseStorageProvider({
        provider: "supabase",
        bucket: process.env.SUPABASE_STORAGE_BUCKET || "product-images",
        publicUrl: process.env.SUPABASE_STORAGE_PUBLIC_URL,
        defaultFolder: process.env.SUPABASE_STORAGE_DEFAULT_FOLDER || "",
      });
      break;

    case "aws-s3":
    case "cloudinary":
      throw new Error(
        `Storage provider "${providerType}" tidak tersedia di Sprint 1 (Supabase-only). ` +
          `Hapus STORAGE_PROVIDER=${providerType} atau tambahkan SDK + typed client (lihat F1-3).`
      );

    case "custom":
      throw new Error("Custom storage provider not implemented yet");

    default:
      throw new Error(`Unknown storage provider: ${providerType}`);
  }

  return _storageProvider;
}

export function setStorageProvider(provider: StorageProvider): void {
  _storageProvider = provider;
}

export function createStorageProvider(config: StorageProviderConfig): StorageProvider {
  switch (config.provider) {
    case "supabase":
      return new SupabaseStorageProvider(config);
    case "aws-s3":
    case "cloudinary":
      throw new Error(
        `Storage provider "${config.provider}" tidak tersedia di Sprint 1 (Supabase-only). Tambahkan SDK + typed client dulu (lihat F1-3).`
      );
    default:
      throw new Error(`Provider ${config.provider} not implemented`);
  }
}

export function getSupportedStorageProviders(): StorageProviderType[] {
  return Object.keys(STORAGE_PROVIDERS) as StorageProviderType[];
}

export function isStorageProviderSupported(provider: string): provider is StorageProviderType {
  return provider in STORAGE_PROVIDERS;
}