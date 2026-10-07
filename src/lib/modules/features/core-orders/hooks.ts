/** Core Orders hooks - business logic, validation, status transitions */

import type { Order, OrderStatus, OrderConfig, CreateOrderRequest } from "./types";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, DEFAULT_ORDER_CONFIG } from "./types";

/** Valid status transitions */
const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  baru: ["konfirmasi", "dibatalkan"],
  konfirmasi: ["dikirim", "dibatalkan"],
  dikirim: ["selesai", "dibatalkan"],
  selesai: [],
  dibatalkan: [],
};

/** Check if status transition is valid */
export function canTransitionStatus(current: OrderStatus, next: OrderStatus): boolean {
  return STATUS_TRANSITIONS[current]?.includes(next) ?? false;
}

/** Get valid next statuses */
export function getValidNextStatuses(current: OrderStatus): OrderStatus[] {
  return STATUS_TRANSITIONS[current] || [];
}

/** Validate order data */
export function validateOrderData(data: CreateOrderRequest): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.customerName?.trim()) errors.push("Customer name is required");
  if (!data.customerPhone?.trim()) errors.push("Customer phone is required");
  if (!data.customerAddress?.trim()) errors.push("Customer address is required");
  if (!data.items?.length) errors.push("At least one item is required");
  if (data.total === undefined || data.total <= 0) errors.push("Valid total is required");
  if (data.paymentMethod && !["cod", "transfer", "cash", "qris"].includes(data.paymentMethod)) {
    errors.push("Invalid payment method");
  }

  // Validate items
  data.items?.forEach((item, i) => {
    if (!item.productId) errors.push(`Item ${i + 1}: productId is required`);
    if (item.quantity <= 0) errors.push(`Item ${i + 1}: quantity must be positive`);
    if (item.price < 0) errors.push(`Item ${i + 1}: price cannot be negative`);
  });

  return { valid: errors.length === 0, errors };
}

/** Calculate order totals from items */
export function calculateOrderTotals(items: CreateOrderRequest["items"], shippingCost: number = 0) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + shippingCost;
  return { subtotal, shippingCost, total };
}

/** Format order ID for display */
export function formatOrderId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

/** Generate WhatsApp order message */
export function generateWhatsAppMessage(order: Order, config: OrderConfig = DEFAULT_ORDER_CONFIG): string {
  const itemsText = order.items
    .map((item) => `${item.quantity}x ${item.productName}${item.variantName ? ` (${item.variantName})` : ""} - ${formatPrice(item.subtotal)}`)
    .join("\n");

  return config.orderTemplate
    .replace("{{items}}", itemsText)
    .replace("{{total}}", formatPrice(order.total))
    .replace("{{name}}", order.customerName)
    .replace("{{phone}}", order.customerPhone)
    .replace("{{address}}", order.customerAddress)
    .replace("{{orderId}}", formatOrderId(order.id));
}

/** Get WhatsApp URL for order */
export function getWhatsAppOrderUrl(phoneNumber: string, message: string): string {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${phoneNumber.replace(/\D/g, "")}?text=${encoded}`;
}

/** Get status label */
export function getStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_LABELS[status] || status;
}

/** Get status color */
export function getStatusColor(status: OrderStatus): string {
  return ORDER_STATUS_COLORS[status] || "gray";
}

/** Check if order can be cancelled */
export function canCancelOrder(order: Order): boolean {
  return ["baru", "konfirmasi", "dikirim"].includes(order.status);
}

/** Check if order is completed */
export function isOrderCompleted(order: Order): boolean {
  return order.status === "selesai";
}

/** Format price for display */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/** Get order summary for display */
export function getOrderSummary(order: Order): string {
  return `${order.items.length} item${order.items.length > 1 ? "s" : ""} · ${formatPrice(order.total)} · ${getStatusLabel(order.status)}`;
}