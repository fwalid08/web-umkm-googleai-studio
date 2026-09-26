/**
 * Type definitions for UMKM SaaS
 */

// User & Auth Types
export interface User {
  id: string;
  email: string;
  name: string;
  business_type: BusinessType;
  tier: Tier;
  subdomain: string | null;
  custom_domain: string | null;
  custom_domain_verified: boolean;
  custom_domain_verified_at: string | null;
  trial_ends_at: string | null;
  current_template_id: string | null;
  created_at: string;
  updated_at: string;
}

export type BusinessType = "food" | "fashion" | "handicraft" | "retail" | "services";

export type Tier = "free" | "starter" | "growth" | "enterprise";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  tier: Tier;
  subdomain: string | null;
  business_type: BusinessType;
  trial_ends_at: string | null;
}

// Template Types
export interface Template {
  id: string;
  name: BusinessType;
  description: string;
  color_palette: ColorPalette;
  typography_config: TypographyConfig;
  sections_config: SectionConfig[];
  is_active: boolean;
  created_at: string;
}

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  text_light: string;
  border: string;
}

export interface TypographyConfig {
  heading_font: string;
  body_font: string;
  base_size: number;
  scale_ratio: number;
}

export interface SectionConfig {
  id: string;
  type: SectionType;
  label: string;
  default_props: Record<string, any>;
  required: boolean;
  order: number;
}

export type SectionType =
  | "hero"
  | "product_grid"
  | "image_gallery"
  | "contact_info"
  | "whatsapp_button"
  | "location_map"
  | "testimonials"
  | "about"
  | "faq"
  | "promo_banner";

// Order Types
export interface Order {
  id: string;
  user_id: string;
  product_name: string;
  product_price: number;
  quantity: number;
  total_amount: number;
  status: OrderStatus;
  order_date: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  delivery_address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type OrderStatus = "baru" | "konfirmasi" | "dikirim" | "selesai";

export type PaymentMethod = "cash" | "cod" | "transfer";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface OrderFilters {
  status?: OrderStatus;
  search?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Subscription Types
export interface Subscription {
  id: string;
  user_id: string;
  tier: Tier;
  price_id: string;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  canceled_at: string | null;
  payment_gateway: string | null;
  payment_reference: string | null;
  created_at: string;
}

export type SubscriptionStatus = "active" | "canceled" | "past_due" | "trialing";

// Domain Types
export interface DomainStatus {
  has_subdomain: boolean;
  subdomain: string | null;
  subdomain_url: string | null;
  custom_domain: string | null;
  custom_domain_verified: boolean;
  custom_domain_verified_at: string | null;
  status: "none" | "subdomain" | "custom_pending" | "custom_verified";
  full_url: string;
}

export interface CustomDomainPayload {
  domain: string; // e.g., "tokoku.com" or "www.tokoku.com"
}

export interface DomainVerificationResult {
  success: boolean;
  message: string;
  verification_code?: string;
  dns_instructions?: DnsInstruction[];
}

export interface DnsInstruction {
  type: "CNAME" | "A" | "TXT";
  name: string;
  value: string;
  description: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Dashboard Types
export interface DashboardStats {
  total_orders: number;
  today_orders: number;
  this_week_orders: number;
  this_month_orders: number;
  pending_orders: number;
  total_revenue: number;
  top_products: ProductStat[];
  daily_trend: DailyTrend[];
}

export interface ProductStat {
  product_name: string;
  order_count: number;
  total_revenue: number;
}

export interface DailyTrend {
  date: string;
  orders: number;
  revenue: number;
}

// Form Validation Schemas (using Zod)
import { z } from "zod";

export const signUpSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  business_type: z.enum(["food", "fashion", "handicraft", "retail", "services"]),
});

export const signInSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

const RESERVED_SUBDOMAINS = [
  "admin", "api", "www", "root", "app", "dashboard", "auth",
  "login", "signin", "signup", "support", "help",
];

export const subdomainSchema = z.object({
  subdomain: z
    .string()
    .min(3, "Subdomain minimal 3 karakter")
    .max(50, "Subdomain maksimal 50 karakter")
    .regex(/^[a-z0-9-]+$/, "Subdomain hanya boleh huruf kecil, angka, dan strip")
    .refine((s) => !RESERVED_SUBDOMAINS.includes(s.toLowerCase()), {
      message: "Subdomain ini dicadangkan sistem",
    }),
});

export const customDomainSchema = z.object({
  domain: z
    .string()
    .min(4, "Domain tidak valid")
    .regex(
      /^([a-z0-9-]+\.)+[a-z]{2,}$/i,
      "Format domain tidak valid (contoh: tokoku.com)"
    ),
});

export const productSchema = z.object({
  name: z.string().min(1, "Nama produk wajib diisi").max(100, "Nama maksimal 100 karakter"),
  price: z.number().finite().int().min(0, "Harga tidak boleh negatif").max(1_000_000_000, "Harga terlalu besar"),
  description: z.string().max(1000, "Deskripsi maksimal 1000 karakter").optional(),
  category: z.string().max(50).optional(),
  image_url: z.string().url().optional().or(z.literal("")),
  stock: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type SubdomainInput = z.infer<typeof subdomainSchema>;
export type CustomDomainInput = z.infer<typeof customDomainSchema>;
export type ProductInput = z.infer<typeof productSchema>;

// Website Builder Types (Sprint 01 — Template Fixed, tanpa drag & drop)
// Client kirim OVERRIDE per section; server merge dengan defaults template,
// validasi whitelist section_id + required tidak boleh dimatikan.
export const websiteSectionSchema = z.object({
  id: z.string().min(1, "Section id wajib diisi"),
  enabled: z.boolean().default(true),
  style: z.record(z.string(), z.unknown()).optional(),
  content: z.record(z.string(), z.unknown()).optional(),
});

export const websiteConfigSchema = z.object({
  template_id: z.string().uuid("Template tidak valid"),
  custom_config: z.object({
    theme: z.record(z.string(), z.unknown()).optional(),
    sections: z.array(websiteSectionSchema).min(1, "Minimal 1 section"),
    seo: z
      .object({
        title: z.string().max(60, "Judul SEO maksimal 60 karakter").optional(),
        description: z.string().max(160, "Deskripsi SEO maksimal 160 karakter").optional(),
      })
      .optional(),
  }),
});

export type WebsiteSectionInput = z.infer<typeof websiteSectionSchema>;
export type WebsiteConfigInput = z.infer<typeof websiteConfigSchema>;

// Batas tier (Sprint 01) — sinkron dengan sprints/sprint_1.md §4
export const FREE_TEMPLATE_NAMES = ["food", "fashion", "retail"] as const;
export const FREE_PRODUCT_MAX = 5;

// Order Schemas (Sprint 02 Sesi A — guest checkout + status workflow)
// total_amount SELALU dihitung server (calcTotal), client tidak mengirimnya.
export const createOrderSchema = z.object({
  subdomain: z.string().min(3, "Subdomain/domain wajib diisi").max(255),
  product_name: z.string().min(1, "Nama produk wajib diisi").max(255),
  product_price: z.number().int().min(0, "Harga tidak valid"),
  quantity: z.number().int().min(1, "Minimal 1").max(99, "Maksimal 99"),
  customer_name: z.string().min(1, "Nama wajib diisi").max(100),
  customer_phone: z.string().min(9, "Nomor HP minimal 9 digit").max(20),
  customer_email: z.string().email("Email tidak valid").optional().or(z.literal("")),
  payment_method: z.enum(["cash", "cod", "transfer"]),
  delivery_address: z.string().max(500).optional().or(z.literal("")),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["baru", "konfirmasi", "dikirim", "selesai"]),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

// Website & Plan Types (Sprint 03 — multi-website, isolasi per website_id)
export interface Website {
  id: string;
  user_id: string;
  name: string;
  business_type: BusinessType | null;
  subdomain: string | null;
  custom_domain: string | null;
  custom_domain_verified: boolean;
  custom_domain_verified_at: string | null;
  current_template_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  price_monthly: number;
  max_websites: number;
  is_active: boolean;
}

// Fallback jika plan_id null — sinkron dengan 012_pricing_unify.sql
// (kebenaran bisnis terbaru = billing-panel.tsx PLANS):
// free 1, starter 3, growth 10, enterprise 999 (unlimited → 999 di DB).
export const TIER_WEBSITE_FALLBACK: Record<string, number> = {
  free: 1,
  starter: 3,
  growth: 10,
  enterprise: 999,
};

export const createWebsiteSchema = z.object({
  name: z.string().min(2, "Nama website minimal 2 karakter").max(100),
  subdomain: z
    .string()
    .min(3, "Subdomain minimal 3 karakter")
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Subdomain hanya huruf kecil, angka, strip")
    .refine((s) => s === "" || !RESERVED_SUBDOMAINS.includes(s.toLowerCase()), {
      message: "Subdomain ini dicadangkan sistem",
    })
    .optional()
    .or(z.literal("")),
  business_type: z.enum(["food", "fashion", "handicraft", "retail", "services"]).optional(),
});

export const updateWebsiteSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  business_type: z.enum(["food", "fashion", "handicraft", "retail", "services"]).optional(),
});

export type CreateWebsiteInput = z.infer<typeof createWebsiteSchema>;
export type UpdateWebsiteInput = z.infer<typeof updateWebsiteSchema>;