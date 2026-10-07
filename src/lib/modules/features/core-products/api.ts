/** Core Products API handlers */

import type { Product, ProductImage, ProductVariant } from "./types";

const PRODUCTS_API_PREFIX = "/api/modules/core-products";

export interface CreateProductRequest {
  name: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  images?: Partial<ProductImage>[];
  variants?: Partial<ProductVariant>[];
  stock?: number;
  trackStock?: boolean;
  categoryId?: string;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  id: string;
}

export interface ListProductsParams {
  websiteId: string;
  status?: "draft" | "active" | "archived";
  categoryId?: string;
  limit?: number;
  offset?: number;
  search?: string;
}

/** List products for a website */
export async function listProducts(params: ListProductsParams): Promise<{ products: Product[]; total: number }> {
  const searchParams = new URLSearchParams();
  searchParams.set("websiteId", params.websiteId);
  if (params.status) searchParams.set("status", params.status);
  if (params.categoryId) searchParams.set("categoryId", params.categoryId);
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.offset) searchParams.set("offset", String(params.offset));
  if (params.search) searchParams.set("search", params.search);

  const res = await fetch(`${PRODUCTS_API_PREFIX}?${searchParams.toString()}`, {
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) throw new Error(`Failed to list products: ${res.statusText}`);
  return res.json();
}

/** Get single product */
export async function getProduct(productId: string): Promise<Product> {
  const res = await fetch(`${PRODUCTS_API_PREFIX}/${productId}`);
  if (!res.ok) throw new Error(`Failed to get product: ${res.statusText}`);
  return res.json();
}

/** Create product */
export async function createProduct(data: CreateProductRequest): Promise<Product> {
  const res = await fetch(PRODUCTS_API_PREFIX, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error(`Failed to create product: ${res.statusText}`);
  return res.json();
}

/** Update product */
export async function updateProduct(data: UpdateProductRequest): Promise<Product> {
  const { id, ...rest } = data;
  const res = await fetch(`${PRODUCTS_API_PREFIX}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(rest),
  });

  if (!res.ok) throw new Error(`Failed to update product: ${res.statusText}`);
  return res.json();
}

/** Delete product */
export async function deleteProduct(productId: string): Promise<void> {
  const res = await fetch(`${PRODUCTS_API_PREFIX}/${productId}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Failed to delete product: ${res.statusText}`);
}

/** Upload product image */
export async function uploadProductImage(productId: string, file: File): Promise<ProductImage> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${PRODUCTS_API_PREFIX}/${productId}/images`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error(`Failed to upload image: ${res.statusText}`);
  return res.json();
}

/** Delete product image */
export async function deleteProductImage(productId: string, imageId: string): Promise<void> {
  const res = await fetch(`${PRODUCTS_API_PREFIX}/${productId}/images/${imageId}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Failed to delete image: ${res.statusText}`);
}

/** Reorder product images */
export async function reorderProductImages(productId: string, imageIds: string[]): Promise<void> {
  const res = await fetch(`${PRODUCTS_API_PREFIX}/${productId}/images/reorder`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageIds }),
  });

  if (!res.ok) throw new Error(`Failed to reorder images: ${res.statusText}`);
}