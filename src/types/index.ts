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
  current_template_id?: string | null;
  template_slug?: string | null;
  created_at: string;
  updated_at: string;
}

export type BusinessType = "food" | "fashion" | "handicraft" | "retail" | "services" | "marketplace" | "education" | "electronics" | "home";

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
  variant?: string;
  default_props: Record<string, any>;
  required: boolean;
  order: number;
}

export type SectionType =
  | "hero"
  | "features"
  | "product_grid"
  | "testimonials"
  | "faq"
  | "cta"
  | "contact"
  | "about"
  | "gallery"
  | "video"
  | "team"
  | "pricing"
  | "newsletter"
  | "divider"
  | "marquee"
  | "menu_board"
  | "steps"
  | "location";

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

export type SubscriptionStatus = "active" | "canceled" | "past_due" | "incomplete" | "incomplete_expired";

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
    sections: z.array(websiteSectionSchema).optional(),
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

// Builder V2 Schema (Section-based builder dengan design styles)
// Nav item mendukung submenu 1 level (children max 5, tanpa cucu).
const navChildSchema = z.object({
  id: z.string(),
  label: z.string(),
  url: z.string(),
  isExternal: z.boolean().default(false),
  enabled: z.boolean().default(true),
});

const navItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  url: z.string(),
  isExternal: z.boolean().default(false),
  enabled: z.boolean().default(true),
  children: z.array(navChildSchema).max(5).optional(),
});

// Grup navigasi footer (layout kolom): judul + link-nya. Tak ada children
// di dalam grup — footer tidak mendukung dropdown tingkat 2.
const navGroupSchema = z.object({
  id: z.string(),
  title: z.string().default(''),
  items: z.array(navChildSchema).default(() => []),
});

export const builderConfigSchema = z.object({
  // `design_style_id` dihapus (migrasi 046) dan tetap OPSIONAL di sini,
  // bukan `z.never()`: config lama di DB masih membawa key itu, dan zod
  // membuang key tak dikenal saat parse. Kalau dideklarasikan wajib,
  // `store.ts` yang mengirim `validation.data` akan kehilangan config user
  // setiap kali ia menyimpan ulang.
  design_style_id: z.string().optional(),
  palette_override: z.record(z.string(), z.string()).optional(),
  theme: z.object({
    typography: z.record(z.string(), z.string()).optional(),
  }).passthrough().optional(),
  sections: z.array(z.object({
    id: z.string().min(1),
    type: z.string().min(1),
    variant: z.string(),
    config: z.record(z.string(), z.unknown()).default(() => ({})),
    style: z.object({
      padding: z.object({
        top: z.number().default(0),
        right: z.number().default(0),
        bottom: z.number().default(0),
        left: z.number().default(0),
      }).default(() => ({ top: 0, right: 0, bottom: 0, left: 0 })),
      background: z.enum(['color', 'image', 'gradient', 'transparent']).default('transparent'),
      backgroundColor: z.string().optional(),
      backgroundImage: z.string().optional(),
      backgroundGradient: z.string().optional(),
      // PENTING: field gaya latar ikut dideklarasikan di sini. Zod `z.object()`
      // membuang key yang tidak dikenal, dan hasil parse-lah yang dikirim ke
      // API saat save — tanpa field ini blur/overlay/gradasi lenyap diam-diam.
      backgroundBlur: z.number().min(0).max(24).optional(),
      backgroundSize: z.enum(['cover', 'contain', 'auto']).optional(),
      backgroundOverlay: z.enum(['none', 'light', 'dark', 'primary']).optional(),
      backgroundOverlayOpacity: z.number().min(0).max(100).optional(),
    }).passthrough().default(() => ({
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      background: 'transparent' as const,
    })),
    responsive: z.object({
      hideOnMobile: z.boolean().optional(),
      hideOnTablet: z.boolean().optional(),
      hideOnDesktop: z.boolean().optional(),
    }).default(() => ({})),
    // anchorId = target link `#...` di menu (slug, bukan UUID internal).
    // WAJIB ada di sini: zod membuang key tak dikenal dan hasil parse-lah
    // yang dikirim ke API — tanpa field ini anchor hasil edit user lenyap.
    anchorId: z.string().optional(),
  }).passthrough()).default([]),
  header: z.object({
    logoUrl: z.string().default(''),
    faviconUrl: z.string().default(''),
    siteTitle: z.string().default(''),
    tagline: z.string().default(''),
    navItems: z.array(navItemSchema).default(() => []),
    ctaText: z.string().default(''),
    ctaLink: z.string().default(''),
    showCta: z.boolean().default(false),
    sticky: z.boolean().default(true),
    seo: z.object({
      title: z.string().max(60).default(''),
      description: z.string().max(160).default(''),
    }).default(() => ({ title: '', description: '' })),
  }).default(() => ({
    logoUrl: '',
    faviconUrl: '',
    siteTitle: '',
    tagline: '',
    navItems: [],
    ctaText: '',
    ctaLink: '',
    showCta: false,
    sticky: true,
    seo: { title: '', description: '' },
  })),
  footer: z.object({
    style: z.enum(['simple', 'columns', 'centered', 'minimal']).default('simple'),
    text: z.string().default(''),
    navItems: z.array(navItemSchema).default(() => []),
    // Grup navigasi untuk layout kolom. `items` bisa kosong — user boleh
    // membuat grup dulu lalu mengisinya nanti.
    navGroups: z.array(navGroupSchema).optional(),
    showSocial: z.boolean().default(false),
    showNav: z.boolean().default(true),
    socialLinks: z.record(z.string(), z.string()).default(() => ({})),
    address: z.string().default(''),
    phone: z.string().default(''),
    email: z.string().default(''),
    whatsapp: z.string().default(''),
    showWhatsApp: z.boolean().default(true),
  }).default(() => ({
    style: 'simple' as const,
    text: '',
    navItems: [],
    showSocial: false,
    showNav: true,
    socialLinks: {},
    address: '',
    phone: '',
    email: '',
    whatsapp: '',
    showWhatsApp: true,
  })),
  layout: z.object({
    rows: z.array(z.unknown()).default(() => []),
  }).default(() => ({ rows: [] })),
  core: z.record(z.string(), z.unknown()).default(() => ({})),
  seo: z.object({
    title: z.string().max(60).default(''),
    description: z.string().max(160).default(''),
  }).default(() => ({ title: '', description: '' })),
});

export type BuilderConfigInput = z.infer<typeof builderConfigSchema>;

// Batas tier (Sprint 01) — sinkron dengan sprints/sprint_1.md §4
export const FREE_TEMPLATE_NAMES = ["food", "fashion", "retail"] as const;
export const FREE_PRODUCT_MAX = 5;

// Order Schemas (Sprint 02 Sesi A — guest checkout + status workflow)
// total_amount SELALU dihitung server (calcTotal), client tidak mengirimnya.
// F2-1: product_id (UUID produk DB) diutamakan; product_name/price jadi fallback
// untuk item JSON legacy tanpa id (harga tetap divalidasi server).
export const createOrderSchema = z.object({
  subdomain: z.string().min(3, "Subdomain/domain wajib diisi").max(255),
  product_id: z.string().uuid("Product ID tidak valid").optional(),
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
  current_template_id?: string | null;
  /** Slug katalog statis (migrasi 039). */
  template_slug?: string | null;
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
// N6: single source = src/lib/billing/pricing.ts. Re-export agar import lama
// dari "@/types" tetap kompatibel tanpa refactor massal.
export { TIER_WEBSITE_FALLBACK } from "@/lib/billing/pricing";

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