/**
 * Mock in-memory store for Demo Accounts & Templates
 * Mendukung 2 Akun Demo:
 * 1. Demo 1: 1 Website (Tier Free) - Warung Kopi Bu Toni
 * 2. Demo 2: 2 Websites (Tier Starter) - Hijab Cantik Official & Aksesoris Cantik
 */

export interface DemoUser {
  id: string;
  email: string;
  name: string;
  password: string;
  tier: "free" | "starter" | "growth" | "enterprise";
  business_type: "food" | "fashion" | "handicraft" | "retail" | "services";
  trial_ends_at: string;
  active_website_id: string;
}

export interface DemoWebsite {
  id: string;
  user_id: string;
  name: string;
  business_type: "food" | "fashion" | "handicraft" | "retail" | "services";
  subdomain: string;
  custom_domain: string | null;
  custom_domain_verified: boolean;
  current_template_id: string;
  created_at: string;
  updated_at: string;
}

export interface DemoOrder {
  id: string;
  user_id: string;
  website_id: string;
  product_name: string;
  product_price: number;
  quantity: number;
  total_amount: number;
  status: "baru" | "konfirmasi" | "dikirim" | "selesai";
  order_date: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  payment_method: "cash" | "cod" | "transfer";
  payment_status: "pending" | "paid";
  delivery_address: string;
  notes: string;
}

export const STATIC_TEMPLATES = [
  {
    id: "tpl-food",
    name: "food",
    description: "Template untuk usaha makanan & minuman: warung, cafe, catering, bakery",
    color_palette: {
      primary: "#EA580C",
      secondary: "#FEF3C7",
      accent: "#F97316",
      background: "#FFF7ED",
      text: "#1C1917",
      text_light: "#78716C",
      border: "#FED7AA",
    },
    typography_config: {
      heading_font: "Poppins",
      body_font: "Inter",
      base_size: 16,
      scale_ratio: 1.25,
    },
    sections_config: [
      {
        id: "hero",
        type: "hero",
        label: "Hero Section",
        required: true,
        order: 1,
        default_props: {
          headline: "Kopi Nikmat, Rasa Hangat",
          subheadline: "Biji kopi lokal pilihan diseduh dengan resep istimewa sejak 2018",
          cta_text: "Lihat Menu Favorit",
          cta_link: "#menu",
          background_image: "",
        },
      },
      {
        id: "menu",
        type: "product_grid",
        label: "Menu Minuman & Makanan",
        required: true,
        order: 2,
        default_props: {
          title: "Menu Favorit",
          subtitle: "Paling laris dipesan setiap hari",
          columns: 3,
          show_price: true,
          items: [
            { name: "Kopi Susu Aren Spesial", price: 18000, description: "Espresso robusta dengan susu murni & gula aren asli" },
            { name: "Roti Bakar Coklat Keju", price: 15000, description: "Roti gandum bakar dengan keju cheddar melimpah" },
            { name: "Pisang Goreng Crispy", price: 12000, description: "Pisang kepok renyah ditaburi gula kayu manis" },
          ],
        },
      },
      {
        id: "about",
        type: "about",
        label: "Tentang Kami",
        required: false,
        order: 3,
        default_props: {
          title: "Tentang Warung Kopi Kami",
          content: "Kami menyajikan kopi terbaik dengan suasana santai dan harga yang sangat bersahabat untuk semua kalangan.",
          image: "",
        },
      },
      {
        id: "contact",
        type: "contact_info",
        label: "Kontak & Alamat",
        required: true,
        order: 4,
        default_props: {
          title: "Lokasi & Pemesanan",
          phone: "081234567890",
          whatsapp: "081234567890",
          address: "Jl. Melati No. 45, Bandung",
          hours: "08:00 - 21:00 WIB",
          delivery_info: "Melayani COD & kirim via GoSend/GrabExpress",
        },
      },
      {
        id: "whatsapp",
        type: "whatsapp_button",
        label: "WhatsApp Button",
        required: true,
        order: 5,
        default_props: {
          phone: "081234567890",
          message: "Halo Bu Toni, saya mau pesan kopi dan camilannya...",
        },
      },
    ],
    is_active: true,
  },
  {
    id: "tpl-fashion",
    name: "fashion",
    description: "Template untuk usaha fashion: baju, hijab, tas, gamis & aksesoris",
    color_palette: {
      primary: "#7C3AED",
      secondary: "#F3E8FF",
      accent: "#A855F7",
      background: "#FAF5FF",
      text: "#1C1917",
      text_light: "#78716C",
      border: "#E9D5FF",
    },
    typography_config: {
      heading_font: "Playfair Display",
      body_font: "Inter",
      base_size: 16,
      scale_ratio: 1.2,
    },
    sections_config: [
      {
        id: "hero",
        type: "hero",
        label: "Hero Section",
        required: true,
        order: 1,
        default_props: {
          headline: "Anggun & Nyaman Setiap Hari",
          subheadline: "Koleksi hijab dan busana muslimah kualitas premium dengan bahan adem",
          cta_text: "Belanja Koleksi Terbaru",
          cta_link: "#collection",
          background_image: "",
        },
      },
      {
        id: "featured",
        type: "product_grid",
        label: "Koleksi Unggulan",
        required: true,
        order: 2,
        default_props: {
          title: "Best Seller Hijab",
          subtitle: "Paling banyak dicari minggu ini",
          columns: 3,
          show_price: true,
          items: [
            { name: "Pashmina Ceruty Babydoll", price: 35000, description: "Jatuh, mudah dibentuk, tidak menerawang" },
            { name: "Gamis Rayon Premium", price: 125000, description: "Bahan adem semriwing, busui friendly" },
            { name: "Hijab Paris Jadul Original", price: 20000, description: "Tegak di dahi, nyaman seharian" },
          ],
        },
      },
      {
        id: "contact",
        type: "contact_info",
        label: "Kontak & Order",
        required: true,
        order: 3,
        default_props: {
          title: "Layanan Pelanggan",
          phone: "081223344556",
          whatsapp: "081223344556",
          address: "Butik Hijab Cantik, Mall ITC Kuningan Lt. 2",
          hours: "09:00 - 20:00 WIB",
          delivery_info: "Pengiriman seluruh Indonesia via JNE, J&T, SiCepat",
        },
      },
      {
        id: "whatsapp",
        type: "whatsapp_button",
        label: "WhatsApp Button",
        required: true,
        order: 4,
        default_props: {
          phone: "081223344556",
          message: "Halo Sis, saya tertarik order gamis dan pashmina...",
        },
      },
    ],
    is_active: true,
  },
  {
    id: "tpl-retail",
    name: "retail",
    description: "Template untuk toko retail: aksesoris, perhiasan, kosmetik, elektronik",
    color_palette: {
      primary: "#0891B2",
      secondary: "#CFFAFE",
      accent: "#06B6D4",
      background: "#F0FDFF",
      text: "#1C1917",
      text_light: "#78716C",
      border: "#A5F3FC",
    },
    typography_config: {
      heading_font: "Inter",
      body_font: "Inter",
      base_size: 15,
      scale_ratio: 1.2,
    },
    sections_config: [
      {
        id: "hero",
        type: "hero",
        label: "Hero Section",
        required: true,
        order: 1,
        default_props: {
          headline: "Aksesoris Cantik & Elegan",
          subheadline: "Lengkapi gayamu dengan bros, jepit rambut Korea, dan cincin titanium terbaik",
          cta_text: "Lihat Produk",
          cta_link: "#products",
        },
      },
      {
        id: "products",
        type: "product_grid",
        label: "Katalog Aksesoris",
        required: true,
        order: 2,
        default_props: {
          title: "Aksesoris Populer",
          subtitle: "Kualitas terjamin anti karat",
          columns: 3,
          show_price: true,
          items: [
            { name: "Bros Mutiara Air Tawar", price: 25000, description: "Kilau mutiara alami dengan pin kuat" },
            { name: "Jepit Rambut Korea Pastel (Isi 4)", price: 10000, description: "Jepit cakar kuat tidak merusak rambut" },
            { name: "Cincin Titanium Anti Karat", price: 35000, description: "Lapisan emas 18k tahan air dan keringat" },
          ],
        },
      },
      {
        id: "contact",
        type: "contact_info",
        label: "Kontak Toko",
        required: true,
        order: 3,
        default_props: {
          title: "Pemesanan & CS",
          phone: "081556677889",
          whatsapp: "081556677889",
          address: "Toko Aksesoris Cantik, Pasar Baru Blok B",
          hours: "09:00 - 18:00 WIB",
        },
      },
      {
        id: "whatsapp",
        type: "whatsapp_button",
        label: "WhatsApp Button",
        required: true,
        order: 4,
        default_props: {
          phone: "081556677889",
          message: "Halo Kak, mau tanya stok bros mutiara...",
        },
      },
    ],
    is_active: true,
  },
  {
    id: "tpl-handicraft",
    name: "handicraft",
    description: "Template untuk kerajinan tangan: anyaman, keramik, ukir kayu, batik",
    color_palette: {
      primary: "#92400E",
      secondary: "#FEF3C7",
      accent: "#D97706",
      background: "#FFFDF5",
      text: "#1C1917",
      text_light: "#78716C",
      border: "#FDE68A",
    },
    typography_config: {
      heading_font: "Merriweather",
      body_font: "Inter",
      base_size: 16,
      scale_ratio: 1.15,
    },
    sections_config: [
      {
        id: "hero",
        type: "hero",
        label: "Hero Section",
        required: true,
        order: 1,
        default_props: {
          headline: "Kerajinan Tangan Asli Nusantara",
          subheadline: "Sentuhan seni pengrajin lokal untuk mempercantik rumah Anda",
          cta_text: "Lihat Karya",
        },
      },
      {
        id: "products",
        type: "product_grid",
        label: "Koleksi Kerajinan",
        required: true,
        order: 2,
        default_props: {
          title: "Karya Unggulan",
          subtitle: "Dibuat dengan ketelitian tinggi",
          columns: 3,
          show_price: true,
          items: [
            { name: "Tas Anyaman Rotan Etnik", price: 85000, description: "Anyaman rapi dengan tali kulit sintetis" },
            { name: "Cangkir Keramik Handmade", price: 45000, description: "Tanah liat bakar kualitas tinggi, aman untuk kopi panas" },
          ],
        },
      },
    ],
    is_active: true,
  },
  {
    id: "tpl-services",
    name: "services",
    description: "Template untuk penyedia jasa: laundry, servis AC, salon, fotografi",
    color_palette: {
      primary: "#2563EB",
      secondary: "#DBEAFE",
      accent: "#3B82F6",
      background: "#EFF6FF",
      text: "#1C1917",
      text_light: "#78716C",
      border: "#BFDBFE",
    },
    typography_config: {
      heading_font: "Inter",
      body_font: "Inter",
      base_size: 15,
      scale_ratio: 1.2,
    },
    sections_config: [
      {
        id: "hero",
        type: "hero",
        label: "Hero Section",
        required: true,
        order: 1,
        default_props: {
          headline: "Layanan Cepat & Bergaransi",
          subheadline: "Solusi terpercaya untuk kebutuhan rumah tangga dan kantor Anda",
          cta_text: "Hubungi Sekarang",
        },
      },
    ],
    is_active: true,
  },
];

// --- SEED DEMO USERS ---
const demoUsers: DemoUser[] = [
  {
    id: "user-demo-1",
    email: "demo1@umkm.id",
    name: "Bu Toni (1 Website)",
    password: "Password123!",
    tier: "free",
    business_type: "food",
    trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    active_website_id: "site-demo-1",
  },
  {
    id: "user-demo-2",
    email: "demo2@umkm.id",
    name: "Siti Rahma (2 Website)",
    password: "Password123!",
    tier: "starter",
    business_type: "fashion",
    trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    active_website_id: "site-demo-2a",
  },
];

// --- SEED DEMO WEBSITES ---
const demoWebsites: DemoWebsite[] = [
  // Demo 1: Hanya 1 Website
  {
    id: "site-demo-1",
    user_id: "user-demo-1",
    name: "Warung Kopi Bu Toni",
    business_type: "food",
    subdomain: "tenant-kopibutoni",
    custom_domain: null,
    custom_domain_verified: false,
    current_template_id: "tpl-food",
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Demo 2: Punya 2 Websites
  {
    id: "site-demo-2a",
    user_id: "user-demo-2",
    name: "Hijab Cantik Official",
    business_type: "fashion",
    subdomain: "tenant-hijabcantik",
    custom_domain: "hijabcantik.com",
    custom_domain_verified: true,
    current_template_id: "tpl-fashion",
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "site-demo-2b",
    user_id: "user-demo-2",
    name: "Aksesoris Cantik & Bros",
    business_type: "retail",
    subdomain: "tenant-aksesoris",
    custom_domain: null,
    custom_domain_verified: false,
    current_template_id: "tpl-retail",
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// --- SEED DEMO ORDERS ---
const demoOrders: DemoOrder[] = [
  // Orders Toko 1 (Warung Kopi)
  {
    id: "ord-demo-101",
    user_id: "user-demo-1",
    website_id: "site-demo-1",
    product_name: "Kopi Susu Aren Spesial",
    product_price: 18000,
    quantity: 2,
    total_amount: 36000,
    status: "baru",
    order_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    customer_name: "Budi Santoso",
    customer_phone: "081234567891",
    customer_email: "budi@gmail.com",
    payment_method: "transfer",
    payment_status: "paid",
    delivery_address: "Jl. Dago Asri No. 12, Bandung",
    notes: "Tolong kopinya less sugar ya bu.",
  },
  {
    id: "ord-demo-102",
    user_id: "user-demo-1",
    website_id: "site-demo-1",
    product_name: "Roti Bakar Coklat Keju",
    product_price: 15000,
    quantity: 1,
    total_amount: 15000,
    status: "dikirim",
    order_date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    customer_name: "Dewi Lestari",
    customer_phone: "081987654321",
    customer_email: "dewi@gmail.com",
    payment_method: "cod",
    payment_status: "pending",
    delivery_address: "Kost Melati Kamar 4, Bandung",
    notes: "Kejunya dibanyakin ya kak.",
  },
  {
    id: "ord-demo-103",
    user_id: "user-demo-1",
    website_id: "site-demo-1",
    product_name: "Pisang Goreng Crispy",
    product_price: 12000,
    quantity: 3,
    total_amount: 36000,
    status: "selesai",
    order_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    customer_name: "Dimas Anggara",
    customer_phone: "085612345678",
    customer_email: "dimas@gmail.com",
    payment_method: "cash",
    payment_status: "paid",
    delivery_address: "Ambil langsung di warung",
    notes: "",
  },

  // Orders Toko 2A (Hijab Cantik Official)
  {
    id: "ord-demo-201",
    user_id: "user-demo-2",
    website_id: "site-demo-2a",
    product_name: "Pashmina Ceruty Babydoll",
    product_price: 35000,
    quantity: 2,
    total_amount: 70000,
    status: "baru",
    order_date: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    customer_name: "Anisa Putri",
    customer_phone: "081223344556",
    customer_email: "anisa@yahoo.com",
    payment_method: "transfer",
    payment_status: "paid",
    delivery_address: "Jl. Margonda Raya No. 10, Depok",
    notes: "Warna Mocca dan Sage Green ya.",
  },
  {
    id: "ord-demo-202",
    user_id: "user-demo-2",
    website_id: "site-demo-2a",
    product_name: "Gamis Rayon Premium",
    product_price: 125000,
    quantity: 1,
    total_amount: 125000,
    status: "konfirmasi",
    order_date: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    customer_name: "Nabila Zahra",
    customer_phone: "081334455667",
    customer_email: "nabila@gmail.com",
    payment_method: "cod",
    payment_status: "pending",
    delivery_address: "Komplek Pesona Asri Blok C3, Jakarta Timur",
    notes: "Ukuran XL.",
  },
  {
    id: "ord-demo-203",
    user_id: "user-demo-2",
    website_id: "site-demo-2a",
    product_name: "Hijab Paris Jadul Original",
    product_price: 20000,
    quantity: 3,
    total_amount: 60000,
    status: "selesai",
    order_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    customer_name: "Rina Marlina",
    customer_phone: "081445566778",
    customer_email: "rina@gmail.com",
    payment_method: "transfer",
    payment_status: "paid",
    delivery_address: "Jl. Tebet Barat No. 8, Jakarta Selatan",
    notes: "",
  },

  // Orders Toko 2B (Aksesoris Cantik & Bros)
  {
    id: "ord-demo-301",
    user_id: "user-demo-2",
    website_id: "site-demo-2b",
    product_name: "Bros Mutiara Air Tawar",
    product_price: 25000,
    quantity: 2,
    total_amount: 50000,
    status: "baru",
    order_date: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    customer_name: "Zahra Salsabila",
    customer_phone: "081556677889",
    customer_email: "zahra@gmail.com",
    payment_method: "cod",
    payment_status: "pending",
    delivery_address: "Jl. Kemang Timur No. 15, Jakarta Selatan",
    notes: "Box kado ya kak.",
  },
  {
    id: "ord-demo-302",
    user_id: "user-demo-2",
    website_id: "site-demo-2b",
    product_name: "Jepit Rambut Korea Pastel (Isi 4)",
    product_price: 10000,
    quantity: 4,
    total_amount: 40000,
    status: "selesai",
    order_date: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    customer_name: "Farida Hanim",
    customer_phone: "081667788990",
    customer_email: "farida@gmail.com",
    payment_method: "transfer",
    payment_status: "paid",
    delivery_address: "Perumahan Griya Indah No. 22, Bekasi",
    notes: "",
  },
];

// In-memory config storage for websites
const websiteConfigs = new Map<string, any>();

// Initialize configs with template defaults
for (const w of demoWebsites) {
  const tpl = STATIC_TEMPLATES.find((t) => t.id === w.current_template_id) || STATIC_TEMPLATES[0];
  websiteConfigs.set(w.id, {
    theme: {
      palette: tpl.color_palette,
      typography: tpl.typography_config,
    },
    sections: tpl.sections_config.map((s) => ({
      id: s.id,
      type: s.type,
      label: s.label,
      required: s.required,
      order: s.order,
      enabled: true,
      style: {},
      content: { ...s.default_props },
    })),
    seo: {
      title: `${w.name} — Toko Online Resmi`,
      description: `Beli produk pilihan terbaik di ${w.name}. Pesan mudah dan cepat.`,
    },
  });
}

// Helper methods
export function findDemoUser(email: string, pass: string): DemoUser | null {
  const u = demoUsers.find((x) => x.email.toLowerCase() === email.toLowerCase());
  if (u && u.password === pass) return u;
  return null;
}

export function isDemoUserId(userId: string): boolean {
  return demoUsers.some((u) => u.id === userId);
}

export function getDemoUser(userId: string): DemoUser | null {
  return demoUsers.find((u) => u.id === userId) || null;
}

export function getDemoWebsites(userId: string): DemoWebsite[] {
  return demoWebsites.filter((w) => w.user_id === userId);
}

export function getDemoActiveWebsite(userId: string): DemoWebsite | null {
  const u = getDemoUser(userId);
  if (!u) return null;
  const sites = getDemoWebsites(userId);
  return sites.find((s) => s.id === u.active_website_id) || sites[0] || null;
}

export function setDemoActiveWebsite(userId: string, websiteId: string): boolean {
  const u = getDemoUser(userId);
  if (!u) return false;
  const sites = getDemoWebsites(userId);
  if (sites.some((s) => s.id === websiteId)) {
    u.active_website_id = websiteId;
    return true;
  }
  return false;
}

export function getDemoOwnedWebsite(userId: string, websiteId: string): DemoWebsite | null {
  return demoWebsites.find((w) => w.user_id === userId && w.id === websiteId) || null;
}

export function getDemoWebsiteLimit(userId: string): { ok: boolean; count: number; max: number } {
  const u = getDemoUser(userId);
  const count = getDemoWebsites(userId).length;
  const max = u?.tier === "starter" ? 3 : u?.tier === "growth" ? 10 : u?.tier === "enterprise" ? 999 : 1;
  return { ok: count < max, count, max };
}

export function setDemoUserTier(userId: string, tier: "free" | "starter" | "growth" | "enterprise"): boolean {
  const u = getDemoUser(userId);
  if (!u) return false;
  u.tier = tier;
  return true;
}

export function createDemoWebsite(
  userId: string,
  data: { name: string; business_type?: string; subdomain?: string }
): DemoWebsite {
  const id = `site-demo-${Date.now().toString(36)}`;
  const sub = data.subdomain || `toko-${Math.random().toString(36).slice(2, 8)}`;
  const tplId =
    data.business_type === "food"
      ? "tpl-food"
      : data.business_type === "fashion"
      ? "tpl-fashion"
      : data.business_type === "handicraft"
      ? "tpl-handicraft"
      : data.business_type === "retail"
      ? "tpl-retail"
      : "tpl-food";

  const site: DemoWebsite = {
    id,
    user_id: userId,
    name: data.name,
    business_type: (data.business_type as any) || "retail",
    subdomain: sub,
    custom_domain: null,
    custom_domain_verified: false,
    current_template_id: tplId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  demoWebsites.push(site);
  setDemoActiveWebsite(userId, id);

  const tpl = STATIC_TEMPLATES.find((t) => t.id === tplId) || STATIC_TEMPLATES[0];
  websiteConfigs.set(id, {
    theme: { palette: tpl.color_palette, typography: tpl.typography_config },
    sections: tpl.sections_config.map((s) => ({
      id: s.id,
      type: s.type,
      label: s.label,
      required: s.required,
      order: s.order,
      enabled: true,
      style: {},
      content: { ...s.default_props },
    })),
    seo: { title: `${site.name} — Toko Online`, description: tpl.description },
  });

  return site;
}

export function updateDemoWebsite(
  userId: string,
  websiteId: string,
  patch: Partial<DemoWebsite>
): DemoWebsite | null {
  const site = getDemoOwnedWebsite(userId, websiteId);
  if (!site) return null;
  Object.assign(site, patch, { updated_at: new Date().toISOString() });
  return site;
}

export function getDemoWebsiteConfig(websiteId: string) {
  return websiteConfigs.get(websiteId) || null;
}

export function saveDemoWebsiteConfig(
  userId: string,
  websiteId: string,
  templateId: string,
  customConfig: any
) {
  const site = getDemoOwnedWebsite(userId, websiteId);
  if (!site) return false;
  site.current_template_id = templateId;
  site.updated_at = new Date().toISOString();
  websiteConfigs.set(websiteId, customConfig);
  return true;
}

export function getDemoOrders(
  websiteId: string,
  filters?: { status?: string; search?: string; page?: number; limit?: number }
) {
  let list = demoOrders.filter((o) => o.website_id === websiteId);
  if (filters?.status) {
    list = list.filter((o) => o.status === filters.status);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(
      (o) =>
        o.customer_name.toLowerCase().includes(q) ||
        o.product_name.toLowerCase().includes(q) ||
        o.customer_phone.includes(q)
    );
  }
  list.sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime());

  const total = list.length;
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const from = (page - 1) * limit;
  const orders = list.slice(from, from + limit);

  return {
    orders,
    total,
    page,
    limit,
    total_pages: Math.max(1, Math.ceil(total / limit)),
  };
}

export function updateDemoOrderStatus(orderId: string, nextStatus: string): boolean {
  const ord = demoOrders.find((o) => o.id === orderId);
  if (ord) {
    ord.status = nextStatus as any;
    return true;
  }
  return false;
}

export function getDemoDashboardStats(websiteId: string) {
  const site = demoWebsites.find((w) => w.id === websiteId);
  if (!site) {
    return {
      website_id: null,
      website_name: "",
      total_orders: 0,
      today_orders: 0,
      pending_orders: 0,
      month_revenue: 0,
      recent_orders: [],
    };
  }

  const list = demoOrders.filter((o) => o.website_id === websiteId);
  const pending = list.filter((o) => o.status === "baru").length;
  const totalRevenue = list.reduce((sum, o) => sum + (o.payment_status === "paid" ? o.total_amount : 0), 0);

  const recent = list
    .slice()
    .sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime())
    .slice(0, 5)
    .map((o) => ({
      id: o.id,
      customer_name: o.customer_name,
      product_name: o.product_name,
      total_amount: o.total_amount,
      status: o.status,
      order_date: o.order_date,
    }));

  return {
    website_id: site.id,
    website_name: site.name,
    total_orders: list.length,
    today_orders: list.length > 0 ? 1 : 0,
    pending_orders: pending,
    month_revenue: totalRevenue,
    recent_orders: recent,
  };
}

export function getDemoPublicSite(subdomain: string) {
  const site = demoWebsites.find((w) => w.subdomain === subdomain);
  if (!site) return null;

  const tpl = STATIC_TEMPLATES.find((t) => t.id === site.current_template_id) || STATIC_TEMPLATES[0];
  const cfg = websiteConfigs.get(site.id);

  const sections = cfg?.sections || tpl.sections_config.map((s) => ({
    id: s.id,
    type: s.type,
    label: s.label,
    required: s.required,
    order: s.order,
    enabled: true,
    style: {},
    content: { ...s.default_props },
  }));

  const palette = cfg?.theme?.palette || tpl.color_palette;
  const typography = cfg?.theme?.typography || tpl.typography_config;

  let whatsapp = "";
  for (const s of sections) {
    if (!s.enabled) continue;
    const c = s.content as Record<string, unknown>;
    if (c.whatsapp || c.phone) {
      whatsapp = String(c.whatsapp || c.phone);
      break;
    }
  }

  return {
    subdomain: site.subdomain,
    name: site.name,
    businessType: site.business_type,
    palette,
    typography,
    sections,
    seo: cfg?.seo || {
      title: `${site.name} — Toko Online`,
      description: tpl.description,
    },
    whatsapp,
  };
}

export function getDemoProducts(websiteId: string) {
  const cfg = websiteConfigs.get(websiteId);
  if (!cfg?.sections) return [];
  const prodSec = cfg.sections.find((s: any) => s.type === "product_grid" || s.id === "menu" || s.id === "products");
  if (!prodSec?.content?.items) return [];
  return prodSec.content.items.map((item: any, idx: number) => ({
    id: `prod-${idx}`,
    index: idx,
    name: item.name || "Produk",
    price: Number(item.price) || 0,
    description: item.description || "",
    category: item.category || "Umum",
    available: item.available !== false,
  }));
}

export function addDemoProduct(
  websiteId: string,
  product: { name: string; price: number; description?: string; category?: string }
) {
  const cfg = websiteConfigs.get(websiteId);
  if (!cfg?.sections) return false;
  let prodSec = cfg.sections.find((s: any) => s.type === "product_grid" || s.id === "menu" || s.id === "products");
  if (!prodSec) {
    prodSec = {
      id: "products",
      type: "product_grid",
      label: "Daftar Produk",
      required: true,
      order: 2,
      enabled: true,
      content: { items: [] },
    };
    cfg.sections.push(prodSec);
  }
  if (!prodSec.content) prodSec.content = {};
  if (!Array.isArray(prodSec.content.items)) prodSec.content.items = [];

  prodSec.content.items.push({
    name: product.name,
    price: Number(product.price),
    description: product.description || "",
    category: product.category || "Umum",
    available: true,
  });
  return true;
}

export function updateDemoProduct(
  websiteId: string,
  index: number,
  patch: { name?: string; price?: number; description?: string; category?: string; available?: boolean }
) {
  const cfg = websiteConfigs.get(websiteId);
  if (!cfg?.sections) return false;
  const prodSec = cfg.sections.find((s: any) => s.type === "product_grid" || s.id === "menu" || s.id === "products");
  if (!prodSec?.content?.items?.[index]) return false;
  Object.assign(prodSec.content.items[index], patch);
  return true;
}

export function deleteDemoProduct(websiteId: string, index: number) {
  const cfg = websiteConfigs.get(websiteId);
  if (!cfg?.sections) return false;
  const prodSec = cfg.sections.find((s: any) => s.type === "product_grid" || s.id === "menu" || s.id === "products");
  if (!prodSec?.content?.items?.[index]) return false;
  prodSec.content.items.splice(index, 1);
  return true;
}

