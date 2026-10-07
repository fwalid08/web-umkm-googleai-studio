/** Core Orders types */

export type OrderStatus = "baru" | "konfirmasi" | "dikirim" | "selesai" | "dibatalkan";
export type PaymentMethod = "cod" | "transfer" | "cash" | "qris";

export interface Order {
  id: string;
  websiteId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: "unpaid" | "paid" | "refunded";
  paymentReference?: string;
  notes?: string;
  trackingNumber?: string;
  courier?: string;
  createdAt: Date;
  updatedAt: Date;
  confirmedAt?: Date;
  shippedAt?: Date;
  completedAt?: Date;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface OrderItemInput {
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  price: number;
}

export interface CreateOrderRequest {
  websiteId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress: string;
  items: OrderItemInput[];
  subtotal: number;
  shippingCost: number;
  total: number;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface OrderConfig {
  waNumber: string;
  autoReply: boolean;
  orderTemplate: string;
  requireAddress: boolean;
  requireEmail: boolean;
}

export const DEFAULT_ORDER_CONFIG: OrderConfig = {
  waNumber: "",
  autoReply: true,
  orderTemplate: "Halo, saya ingin memesan:\n{{items}}\nTotal: {{total}}\nNama: {{name}}\nAlamat: {{address}}",
  requireAddress: true,
  requireEmail: false,
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  baru: "Baru",
  konfirmasi: "Dikonfirmasi",
  dikirim: "Dikirim",
  selesai: "Selesai",
  dibatalkan: "Dibatalkan",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  baru: "blue",
  konfirmasi: "yellow",
  dikirim: "orange",
  selesai: "green",
  dibatalkan: "red",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cod: "COD (Bayar di Tempat)",
  transfer: "Transfer Bank",
  cash: "Tunai",
  qris: "QRIS",
};