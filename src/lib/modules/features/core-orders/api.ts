/** Core Orders API handlers */

import type { Order, OrderStatus, OrderConfig } from "./types";

const ORDERS_API_PREFIX = "/api/modules/core-orders";

export interface CreateOrderRequest {
  websiteId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress: string;
  items: Array<{
    productId: string;
    productName: string;
    variantId?: string;
    variantName?: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  shippingCost: number;
  total: number;
  paymentMethod: "cod" | "transfer" | "cash" | "qris";
  notes?: string;
}

export interface UpdateOrderRequest {
  id: string;
  status?: OrderStatus;
  paymentStatus?: "unpaid" | "paid" | "refunded";
  trackingNumber?: string;
  courier?: string;
  notes?: string;
}

export interface ListOrdersParams {
  websiteId: string;
  status?: OrderStatus;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
  search?: string;
}

/** List orders for a website */
export async function listOrders(params: ListOrdersParams): Promise<{ orders: Order[]; total: number }> {
  const searchParams = new URLSearchParams();
  searchParams.set("websiteId", params.websiteId);
  if (params.status) searchParams.set("status", params.status);
  if (params.dateFrom) searchParams.set("dateFrom", params.dateFrom);
  if (params.dateTo) searchParams.set("dateTo", params.dateTo);
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.offset) searchParams.set("offset", String(params.offset));
  if (params.search) searchParams.set("search", params.search);

  const res = await fetch(`${ORDERS_API_PREFIX}?${searchParams.toString()}`, {
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) throw new Error(`Failed to list orders: ${res.statusText}`);
  return res.json();
}

/** Get single order */
export async function getOrder(orderId: string): Promise<Order> {
  const res = await fetch(`${ORDERS_API_PREFIX}/${orderId}`);
  if (!res.ok) throw new Error(`Failed to get order: ${res.statusText}`);
  return res.json();
}

/** Create order (public - no auth required) */
export async function createOrder(data: CreateOrderRequest): Promise<Order> {
  const res = await fetch(ORDERS_API_PREFIX, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error(`Failed to create order: ${res.statusText}`);
  return res.json();
}

/** Update order (owner only) */
export async function updateOrder(data: UpdateOrderRequest): Promise<Order> {
  const { id, ...rest } = data;
  const res = await fetch(`${ORDERS_API_PREFIX}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(rest),
  });

  if (!res.ok) throw new Error(`Failed to update order: ${res.statusText}`);
  return res.json();
}

/** Get order config for website */
export async function getOrderConfig(websiteId: string): Promise<OrderConfig> {
  const res = await fetch(`${ORDERS_API_PREFIX}/config?websiteId=${websiteId}`);
  if (!res.ok) throw new Error(`Failed to get order config: ${res.statusText}`);
  return res.json();
}

/** Update order config */
export async function updateOrderConfig(websiteId: string, config: Partial<OrderConfig>): Promise<OrderConfig> {
  const res = await fetch(`${ORDERS_API_PREFIX}/config?websiteId=${websiteId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });

  if (!res.ok) throw new Error(`Failed to update order config: ${res.statusText}`);
  return res.json();
}

/** Export orders to CSV */
export async function exportOrders(websiteId: string, dateFrom?: string, dateTo?: string): Promise<Blob> {
  const params = new URLSearchParams({ websiteId });
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);

  const res = await fetch(`${ORDERS_API_PREFIX}/export?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to export orders: ${res.statusText}`);
  return res.blob();
}