/**
 * Mock in-memory store for Demo Accounts & Templates
 * Mendukung 4 Akun Demo:
 * 1. Demo 1: 1 Website (Tier Free) - Warung Kopi Bu Toni
 * 2. Demo 2: 2 Websites (Tier Starter) - Hijab Cantik Official & Aksesoris Cantik
 * 3. Demo 3: 3 Websites (Tier Growth) - Jasa Desain, Digital Marketing, Training
 * 4. Demo 4: 5 Websites (Tier Enterprise) - Marketplace, Fashion Wholesale, Electronics, Home & Living, Corporate Services
 */
import { buildCustomers, buildDailyTrend, buildTopProducts } from "@/lib/analytics/aggregate";

export interface DemoUser {
  id: string;
  email: string;
  name: string;
  password: string;
  tier: "free" | "starter" | "growth" | "enterprise";
  business_type: "food" | "fashion" | "handicraft" | "retail" | "services" | "marketplace" | "education" | "electronics" | "home";
  trial_ends_at: string;
  active_website_id: string;
}

export interface DemoWebsite {
  id: string;
  user_id: string;
  name: string;
  business_type: "food" | "fashion" | "handicraft" | "retail" | "services" | "marketplace" | "education" | "electronics" | "home";
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
    id: "574fb366-f0c1-4901-bde3-1dc73cb5c3df",
    email: "demo1@umkm.id",
    name: "Bu Toni (1 Website)",
    password: "Password123!",
    tier: "free",
    business_type: "food",
    trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    active_website_id: "site-demo-1",
  },
  {
    id: "3d548114-a262-4bbb-92d6-c1e91646e5cf",
    email: "demo2@umkm.id",
    name: "Siti Rahma (2 Website)",
    password: "Password123!",
    tier: "starter",
    business_type: "fashion",
    trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    active_website_id: "site-demo-2a",
  },
  {
    id: "024efdae-d5b6-433d-a22d-d9ed3b497cda",
    email: "demo3@umkm.id",
    name: "Budi Growth (3 Website)",
    password: "Password123!",
    tier: "growth",
    business_type: "services",
    trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    active_website_id: "site-demo-3a",
  },
  {
    id: "64fc60c8-af34-42c9-aad9-9009d68880f4",
    email: "demo4@umkm.id",
    name: "Citra Enterprise (5 Website)",
    password: "Password123!",
    tier: "enterprise",
    business_type: "marketplace",
    trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    active_website_id: "site-demo-4a",
  },
];

// --- SEED DEMO WEBSITES ---
const demoWebsites: DemoWebsite[] = [
  // Demo 1: Hanya 1 Website
  {
    id: "site-demo-1",
    user_id: "574fb366-f0c1-4901-bde3-1dc73cb5c3df",
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
    user_id: "3d548114-a262-4bbb-92d6-c1e91646e5cf",
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
    user_id: "3d548114-a262-4bbb-92d6-c1e91646e5cf",
    name: "Aksesoris Cantik & Bros",
    business_type: "retail",
    subdomain: "tenant-aksesoris",
    custom_domain: null,
    custom_domain_verified: false,
    current_template_id: "tpl-retail",
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Demo 3 (Growth): 3 Websites
  {
    id: "site-demo-3a",
    user_id: "024efdae-d5b6-433d-a22d-d9ed3b497cda",
    name: "Jasa Desain Grafis Budi",
    business_type: "services",
    subdomain: "tenant-growthdemo",
    custom_domain: "budidesain.com",
    custom_domain_verified: true,
    current_template_id: "tpl-services",
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "site-demo-3b",
    user_id: "024efdae-d5b6-433d-a22d-d9ed3b497cda",
    name: "Konsultasi Digital Marketing",
    business_type: "services",
    subdomain: "tenant-growthmarketing",
    custom_domain: null,
    custom_domain_verified: false,
    current_template_id: "tpl-services",
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "site-demo-3c",
    user_id: "024efdae-d5b6-433d-a22d-d9ed3b497cda",
    name: "Training & Workshop Online",
    business_type: "services",
    subdomain: "tenant-growthtraining",
    custom_domain: "growthedu.id",
    custom_domain_verified: true,
    current_template_id: "tpl-education",
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Demo 4 (Enterprise): 5 Websites
  {
    id: "site-demo-4a",
    user_id: "64fc60c8-af34-42c9-aad9-9009d68880f4",
    name: "Marketplace Citra Utama",
    business_type: "marketplace",
    subdomain: "tenant-enterprisedemo",
    custom_domain: "citramarketplace.com",
    custom_domain_verified: true,
    current_template_id: "tpl-marketplace",
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "site-demo-4b",
    user_id: "64fc60c8-af34-42c9-aad9-9009d68880f4",
    name: "Citra Fashion Wholesale",
    business_type: "fashion",
    subdomain: "tenant-citrafashion",
    custom_domain: "citrafashion.biz",
    custom_domain_verified: true,
    current_template_id: "tpl-fashion",
    created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "site-demo-4c",
    user_id: "64fc60c8-af34-42c9-aad9-9009d68880f4",
    name: "Citra Electronics Hub",
    business_type: "retail",
    subdomain: "tenant-citraelectronics",
    custom_domain: "citratech.store",
    custom_domain_verified: true,
    current_template_id: "tpl-retail",
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "site-demo-4d",
    user_id: "64fc60c8-af34-42c9-aad9-9009d68880f4",
    name: "Citra Home & Living",
    business_type: "handicraft",
    subdomain: "tenant-citrahomeliving",
    custom_domain: null,
    custom_domain_verified: false,
    current_template_id: "tpl-handicraft",
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "site-demo-4e",
    user_id: "64fc60c8-af34-42c9-aad9-9009d68880f4",
    name: "Citra Corporate Services",
    business_type: "services",
    subdomain: "tenant-citracorporate",
    custom_domain: "citracorp.co.id",
    custom_domain_verified: true,
    current_template_id: "tpl-services",
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// --- SEED DEMO ORDERS ---
const demoOrders: DemoOrder[] = [
  // Orders Toko 1 (Warung Kopi)
  {
    id: "ord-demo-101",
    user_id: "574fb366-f0c1-4901-bde3-1dc73cb5c3df",
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
    user_id: "574fb366-f0c1-4901-bde3-1dc73cb5c3df",
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
    user_id: "574fb366-f0c1-4901-bde3-1dc73cb5c3df",
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
    user_id: "3d548114-a262-4bbb-92d6-c1e91646e5cf",
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
    user_id: "3d548114-a262-4bbb-92d6-c1e91646e5cf",
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
    user_id: "3d548114-a262-4bbb-92d6-c1e91646e5cf",
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
    user_id: "3d548114-a262-4bbb-92d6-c1e91646e5cf",
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
    user_id: "3d548114-a262-4bbb-92d6-c1e91646e5cf",
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

  // Orders Demo 3 (Growth) - site-demo-3a (Jasa Desain Grafis)
  {
    id: "ord-demo-301",
    user_id: "024efdae-d5b6-433d-a22d-d9ed3b497cda",
    website_id: "site-demo-3a",
    product_name: "Desain Logo Profesional",
    product_price: 500000,
    quantity: 1,
    total_amount: 500000,
    status: "selesai",
    order_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    customer_name: "Andi Wijaya",
    customer_phone: "081234567890",
    customer_email: "andi@startup.id",
    payment_method: "transfer",
    payment_status: "paid",
    delivery_address: "Digital delivery",
    notes: "Logo untuk startup fintech",
  },
  {
    id: "ord-demo-302",
    user_id: "024efdae-d5b6-433d-a22d-d9ed3b497cda",
    website_id: "site-demo-3a",
    product_name: "Desain Kemasan Produk",
    product_price: 750000,
    quantity: 1,
    total_amount: 750000,
    status: "dikirim",
    order_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    customer_name: "Sari Dewi",
    customer_phone: "081298765432",
    customer_email: "sari@umkmfood.id",
    payment_method: "transfer",
    payment_status: "paid",
    delivery_address: "Digital delivery",
    notes: "Kemasan snack sehat",
  },
  // Orders Demo 3 (Growth) - site-demo-3b (Digital Marketing)
  {
    id: "ord-demo-303",
    user_id: "024efdae-d5b6-433d-a22d-d9ed3b497cda",
    website_id: "site-demo-3b",
    product_name: "Audit SEO Website",
    product_price: 1000000,
    quantity: 1,
    total_amount: 1000000,
    status: "konfirmasi",
    order_date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    customer_name: "PT Maju Jaya",
    customer_phone: "02155556666",
    customer_email: "procurement@majujaya.co.id",
    payment_method: "transfer",
    payment_status: "pending",
    delivery_address: "Digital delivery",
    notes: "Website corporate",
  },
  // Orders Demo 3 (Growth) - site-demo-3c (Training)
  {
    id: "ord-demo-304",
    user_id: "024efdae-d5b6-433d-a22d-d9ed3b497cda",
    website_id: "site-demo-3c",
    product_name: "Workshop Desain untuk Pemula",
    product_price: 800000,
    quantity: 5,
    total_amount: 4000000,
    status: "selesai",
    order_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    customer_name: "Komunitas Desain Bandung",
    customer_phone: "081333344444",
    customer_email: "komdesbdg@gmail.com",
    payment_method: "transfer",
    payment_status: "paid",
    delivery_address: "Online (Zoom)",
    notes: "Batch 5 peserta",
  },

  // Orders Demo 4 (Enterprise) - site-demo-4a (Marketplace)
  {
    id: "ord-demo-401",
    user_id: "64fc60c8-af34-42c9-aad9-9009d68880f4",
    website_id: "site-demo-4a",
    product_name: "Paket Seller Pro",
    product_price: 799000,
    quantity: 1,
    total_amount: 799000,
    status: "selesai",
    order_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    customer_name: "Toko Baju Online",
    customer_phone: "081211112222",
    customer_email: "tokobaju@shop.id",
    payment_method: "transfer",
    payment_status: "paid",
    delivery_address: "Digital delivery",
    notes: "Upgrade dari starter",
  },
  {
    id: "ord-demo-402",
    user_id: "64fc60c8-af34-42c9-aad9-9009d68880f4",
    website_id: "site-demo-4a",
    product_name: "Paket Seller Starter",
    product_price: 299000,
    quantity: 3,
    total_amount: 897000,
    status: "baru",
    order_date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    customer_name: "Koleksi Sepatu Murah",
    customer_phone: "081222223333",
    customer_email: "sepatu@murah.id",
    payment_method: "cod",
    payment_status: "pending",
    delivery_address: "Digital delivery",
    notes: "",
  },
  // Orders Demo 4 (Enterprise) - site-demo-4b (Fashion Wholesale)
  {
    id: "ord-demo-403",
    user_id: "64fc60c8-af34-42c9-aad9-9009d68880f4",
    website_id: "site-demo-4b",
    product_name: "Hijab Premium Grosir (Dus 50 pcs)",
    product_price: 1250000,
    quantity: 2,
    total_amount: 2500000,
    status: "dikirim",
    order_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    customer_name: "Agen Hijab Medan",
    customer_phone: "081266667777",
    customer_email: "agenhijab@medan.id",
    payment_method: "transfer",
    payment_status: "paid",
    delivery_address: "Jl. Gatot Subroto No. 88, Medan",
    notes: "Warna: mix pastel",
  },
  {
    id: "ord-demo-404",
    user_id: "64fc60c8-af34-42c9-aad9-9009d68880f4",
    website_id: "site-demo-4b",
    product_name: "Gamis Syar'i Grosir (Dus 30 pcs)",
    product_price: 3750000,
    quantity: 1,
    total_amount: 3750000,
    status: "selesai",
    order_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    customer_name: "Butik Muslimah Surabaya",
    customer_phone: "081277778888",
    customer_email: "butik@surabaya.id",
    payment_method: "transfer",
    payment_status: "paid",
    delivery_address: "Jl. Basuki Rahmat No. 45, Surabaya",
    notes: "Size campur S-XL",
  },
  // Orders Demo 4 (Enterprise) - site-demo-4c (Electronics)
  {
    id: "ord-demo-405",
    user_id: "64fc60c8-af34-42c9-aad9-9009d68880f4",
    website_id: "site-demo-4c",
    product_name: "Wireless Earbuds ANC Hybrid",
    product_price: 450000,
    quantity: 10,
    total_amount: 4500000,
    status: "selesai",
    order_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    customer_name: "Distributor Elektronik Jakarta",
    customer_phone: "081288889999",
    customer_email: "distro@jakarta.id",
    payment_method: "transfer",
    payment_status: "paid",
    delivery_address: "Jl. Hayam Wuruk No. 123, Jakarta Pusat",
    notes: "Bulk order untuk reseller",
  },
  // Orders Demo 4 (Enterprise) - site-demo-4d (Home & Living)
  {
    id: "ord-demo-406",
    user_id: "64fc60c8-af34-42c9-aad9-9009d68880f4",
    website_id: "site-demo-4d",
    product_name: "Set Perlengkapan Makan Minimalis 4 Orang",
    product_price: 350000,
    quantity: 20,
    total_amount: 7000000,
    status: "dikirim",
    order_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    customer_name: "Hotel & Resort Bali",
    customer_phone: "081299990000",
    customer_email: "procurement@baliresort.id",
    payment_method: "transfer",
    payment_status: "paid",
    delivery_address: "Jl. Raya Kuta No. 55, Badung, Bali",
    notes: "Untuk renovasi kamar",
  },
  // Orders Demo 4 (Enterprise) - site-demo-4e (Corporate Services)
  {
    id: "ord-demo-407",
    user_id: "64fc60c8-af34-42c9-aad9-9009d68880f4",
    website_id: "site-demo-4e",
    product_name: "Pembuatan PT/PMA Lengkap",
    product_price: 7500000,
    quantity: 1,
    total_amount: 7500000,
    status: "konfirmasi",
    order_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    customer_name: "Startup Teknologi Baru",
    customer_phone: "081300001111",
    customer_email: "founder@startupbaru.id",
    payment_method: "transfer",
    payment_status: "pending",
    delivery_address: "Digital delivery",
    notes: "Urgensi: 1 minggu",
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

export function updateDemoOrderStatus(
  userId: string,
  websiteId: string,
  orderId: string,
  nextStatus: string
): boolean {
  const site = getDemoOwnedWebsite(userId, websiteId);
  if (!site) return false;
  const ord = demoOrders.find((o) => o.id === orderId && o.website_id === websiteId);
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
      top_products: [],
      daily_trend: [],
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
    top_products: buildTopProducts(list, 5),
    daily_trend: buildDailyTrend(list, 14),
  };
}

/** N10: agregat customer demo per website + search + pagination. */
export function getDemoCustomers(
  websiteId: string,
  filters?: { search?: string; page?: number; limit?: number }
) {
  const list = demoOrders.filter((o) => o.website_id === websiteId);
  let customers = buildCustomers(list);
  const q = (filters?.search ?? "").trim().toLowerCase();
  if (q) {
    customers = customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.email.toLowerCase().includes(q)
    );
  }
  const total = customers.length;
  const page = Math.max(1, filters?.page || 1);
  const limit = Math.min(100, Math.max(1, filters?.limit || 20));
  const from = (page - 1) * limit;
  return {
    customers: customers.slice(from, from + limit),
    total,
    page,
    limit,
    total_pages: Math.max(1, Math.ceil(total / limit)),
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

