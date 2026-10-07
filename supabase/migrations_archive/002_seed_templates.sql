-- 002_seed_templates.sql
-- Seed data for 5 UMKM templates

-- Insert 5 UMKM templates
INSERT INTO templates (id, name, description, color_palette, typography_config, sections_config, is_active) VALUES
-- 1. Food Template
(
  uuid_generate_v4(),
  'food',
  'Template untuk usaha makanan & minuman: warung, cafe, catering, bakery',
  '{"primary": "#EA580C", "secondary": "#FEF3C7", "accent": "#F97316", "background": "#FFF7ED", "text": "#1C1917", "text_light": "#78716C", "border": "#FED7AA"}',
  '{"heading_font": "Poppins", "body_font": "Inter", "base_size": 16, "scale_ratio": 1.25}',
  '[
    {"id": "hero", "type": "hero", "label": "Hero Section", "default_props": {"headline": "Makanan Lezat Buatan Rumah", "subheadline": "Resep turun-temurun dengan bahan segar pilihan", "cta_text": "Lihat Menu", "cta_link": "#menu", "background_image": ""}, "required": true, "order": 1},
    {"id": "about", "type": "about", "label": "Tentang Kami", "default_props": {"title": "Cerita Kami", "content": "Kami memulai usaha ini sejak 2020 dengan semangat berbagi makanan enak.", "image": ""}, "required": false, "order": 2},
    {"id": "menu", "type": "product_grid", "label": "Menu Makanan", "default_props": {"title": "Menu Favorit", "subtitle": "Pilihan terbaik dari dapur kami", "columns": 3, "show_price": true, "show_rating": true}, "required": true, "order": 3},
    {"id": "testimonials", "type": "testimonials", "label": "Testimoni Pelanggan", "default_props": {"title": "Apa Kata Pelanggan", "items": []}, "required": false, "order": 4},
    {"id": "contact", "type": "contact_info", "label": "Kontak & Pesan", "default_props": {"title": "Pesan Sekarang", "phone": "", "whatsapp": "", "address": "", "hours": "08:00 - 21:00", "delivery_info": "Gratis ongkir untuk radius 5km"}, "required": true, "order": 5},
    {"id": "whatsapp", "type": "whatsapp_button", "label": "WhatsApp Button", "default_props": {"phone": "", "message": "Halo, saya ingin memesan..."}, "required": true, "order": 6}
  ]',
  TRUE
),

-- 2. Fashion Template
(
  uuid_generate_v4(),
  'fashion',
  'Template untuk usaha fashion: baju, sepatu, tas, aksesoris, hijab',
  '{"primary": "#7C3AED", "secondary": "#F3E8FF", "accent": "#A855F7", "background": "#FAF5FF", "text": "#1C1917", "text_light": "#78716C", "border": "#E9D5FF"}',
  '{"heading_font": "Playfair Display", "body_font": "Inter", "base_size": 16, "scale_ratio": 1.2}',
  '[
    {"id": "hero", "type": "hero", "label": "Hero Section", "default_props": {"headline": "Style Mu, Cerita Mu", "subheadline": "Koleksi fashion terbaru dengan kualitas premium", "cta_text": "Belanja Sekarang", "cta_link": "#collection", "background_image": ""}, "required": true, "order": 1},
    {"id": "featured", "type": "product_grid", "label": "Produk Unggulan", "default_props": {"title": "Best Seller", "subtitle": "Produk paling diminati", "columns": 4, "show_price": true, "show_badge": true}, "required": true, "order": 2},
    {"id": "lookbook", "type": "image_gallery", "label": "Lookbook", "default_props": {"title": "Inspirasi Outfit", "images": []}, "required": false, "order": 3},
    {"id": "categories", "type": "product_grid", "label": "Kategori Produk", "default_props": {"title": "Koleksi Lengkap", "subtitle": "Temukan style favoritmu", "columns": 3, "show_category_filter": true}, "required": true, "order": 4},
    {"id": "size_guide", "type": "faq", "label": "Panduan Ukuran", "default_props": {"title": "Panduan Ukuran", "items": [{"question": "Bagaimana cara mengukur badan?", "answer": "Gunakan meteran pita..."}, {"question": "Apakah ukuran standar?", "answer": "Ya, kami menggunakan ukuran standar Indonesia..."}]}, "required": false, "order": 5},
    {"id": "contact", "type": "contact_info", "label": "Kontak & Order", "default_props": {"title": "Butuh Bantuan?", "phone": "", "whatsapp": "", "instagram": "", "email": "", "hours": "09:00 - 22:00", "return_policy": "Retur 7 hari jika tidak cocok"}, "required": true, "order": 6},
    {"id": "whatsapp", "type": "whatsapp_button", "label": "WhatsApp Button", "default_props": {"phone": "", "message": "Halo, saya mau tanya soal produk..."}, "required": true, "order": 7}
  ]',
  TRUE
),

-- 3. Handicraft Template
(
  uuid_generate_v4(),
  'handicraft',
  'Template untuk kerajinan tangan: anyaman, keramik, ukir kayu, batik, dll',
  '{"primary": "#92400E", "secondary": "#FEF3C7", "accent": "#D97706", "background": "#FFFDF5", "text": "#1C1917", "text_light": "#78716C", "border": "#FDE68A"}',
  '{"heading_font": "Merriweather", "body_font": "Inter", "base_size": 16, "scale_ratio": 1.15}',
  '[
    {"id": "hero", "type": "hero", "label": "Hero Section", "default_props": {"headline": "Kerajinan Tangan Asli Indonesia", "subheadline": "Setiap karya memiliki cerita & makna tersendiri", "cta_text": "Lihat Koleksi", "cta_link": "#products", "background_image": ""}, "required": true, "order": 1},
    {"id": "story", "type": "about", "label": "Cerita Kami", "default_props": {"title": "Warisan Budaya", "content": "Kami melestarikan kerajinan tradisional dengan sentuhan modern...", "image": ""}, "required": true, "order": 2},
    {"id": "process", "type": "image_gallery", "label": "Proses Pembuatan", "default_props": {"title": "Dari Hati ke Tangan", "images": [], "show_captions": true}, "required": false, "order": 3},
    {"id": "products", "type": "product_grid", "label": "Koleksi Produk", "default_props": {"title": "Karya Pilihan", "subtitle": "Setiap detail dikerjakan dengan penuh cinta", "columns": 3, "show_price": true, "show_material": true}, "required": true, "order": 4},
    {"id": "custom", "type": "contact_info", "label": "Pesanan Custom", "default_props": {"title": "Ingin Custom Design?", "phone": "", "whatsapp": "", "email": "", "custom_info": "Kami menerima pesanan custom sesuai keinginan Anda"}, "required": false, "order": 5},
    {"id": "contact", "type": "contact_info", "label": "Kontak", "default_props": {"title": "Hubungi Kami", "phone": "", "whatsapp": "", "address": "Desa Kerajinan, Kec. Seni, Kab. Budaya", "hours": "08:00 - 17:00 (Senin-Sabtu)"}, "required": true, "order": 6},
    {"id": "whatsapp", "type": "whatsapp_button", "label": "WhatsApp Button", "default_props": {"phone": "", "message": "Halo, saya tertarik dengan produk kerajinan..."}, "required": true, "order": 7}
  ]',
  TRUE
),

-- 4. Retail Template
(
  uuid_generate_v4(),
  'retail',
  'Template untuk toko retail: minimarket, toko kelontong, fashion retail, elektronik',
  '{"primary": "#0891B2", "secondary": "#CFFAFE", "accent": "#06B6D4", "background": "#F0FDFF", "text": "#1C1917", "text_light": "#78716C", "border": "#A5F3FC"}',
  '{"heading_font": "Inter", "body_font": "Inter", "base_size": 15, "scale_ratio": 1.2}',
  '[
    {"id": "hero", "type": "hero", "label": "Hero Section", "default_props": {"headline": "Toko Kelontong Terlengkap", "subheadline": "Semua kebutuhan sehari-hari ada di sini", "cta_text": "Belanja Sekarang", "cta_link": "#products", "background_image": ""}, "required": true, "order": 1},
    {"id": "promo", "type": "promo_banner", "label": "Banner Promo", "default_props": {"title": "Promo Minggu Ini", "items": [{"title": "Beras 5kg", "price": "75.000", "original_price": "85.000", "discount": "12%"}, {"title": "Minyak Goreng 2L", "price": "38.000", "original_price": "42.000", "discount": "10%"}]}, "required": false, "order": 2},
    {"id": "categories", "type": "product_grid", "label": "Kategori Produk", "default_props": {"title": "Kategori Produk", "subtitle": "Temukan kebutuhanmu", "columns": 4, "show_category_filter": true, "show_stock": true}, "required": true, "order": 2},
    {"id": "bestseller", "type": "product_grid", "label": "Best Seller", "default_props": {"title": "Produk Terlaris", "columns": 4, "show_price": true, "show_stock": true, "show_rating": true}, "required": true, "order": 3},
    {"id": "new_arrival", "type": "product_grid", "label": "Barang Baru", "default_props": {"title": "Stok Baru Datang", "columns": 4, "show_price": true, "show_badge": "new"}, "required": false, "order": 4},
    {"id": "services", "type": "faq", "label": "Layanan Toko", "default_props": {"title": "Layanan Kami", "items": [{"question": "Apakah ada delivery?", "answer": "Ya, gratis ongkir belanja min Rp 100.000"}, {"question": "Bisa COD?", "answer": "Bisa, area tertentu saja"}]}, "required": false, "order": 5},
    {"id": "contact", "type": "contact_info", "label": "Info Toko", "default_props": {"title": "Informasi Toko", "phone": "", "whatsapp": "", "address": "", "hours": "07:00 - 22:00 (Setiap Hari)", "delivery_info": "Gratis ongkir min. belanja Rp 100.000"}, "required": true, "order": 6},
    {"id": "whatsapp", "type": "whatsapp_button", "label": "WhatsApp Button", "default_props": {"phone": "", "message": "Halo, saya mau belanja..."}, "required": true, "order": 7}
  ]',
  TRUE
),

-- 5. Services Template
(
  uuid_generate_v4(),
  'services',
  'Template untuk jasa: bengkel, salon, laundry, katering, les privat, repair HP',
  '{"primary": "#15803D", "secondary": "#DCFCE7", "accent": "#22C55E", "background": "#F0FDF4", "text": "#1C1917", "text_light": "#78716C", "border": "#86EFAC"}',
  '{"heading_font": "Inter", "body_font": "Inter", "base_size": 16, "scale_ratio": 1.25}',
  '[
    {"id": "hero", "type": "hero", "label": "Hero Section", "default_props": {"headline": "Jasa Profesional & Terpercaya", "subheadline": "Solusi kebutuhan Anda dengan kualitas terbaik", "cta_text": "Lihat Layanan", "cta_link": "#services", "background_image": ""}, "required": true, "order": 1},
    {"id": "services", "type": "product_grid", "label": "Daftar Layanan", "default_props": {"title": "Layanan Kami", "subtitle": "Pilih layanan yang Anda butuhkan", "columns": 3, "show_price": true, "show_duration": true, "show_features": true}, "required": true, "order": 2},
    {"id": "process", "type": "faq", "label": "Cara Pemesanan", "default_props": {"title": "Cara Mudah Pesan", "items": [{"question": "Bagaimana cara memesan?", "answer": "Pilih layanan → Isi form → Konfirmasi via WhatsApp"}, {"question": "Berapa lama proses?", "answer": "Tergantung layanan, rata-rata 1-3 hari kerja"}]}, "required": false, "order": 3},
    {"id": "testimonials", "type": "testimonials", "label": "Testimoni Klien", "default_props": {"title": "Kepercayaan Klien", "items": []}, "required": false, "order": 4},
    {"id": "why_us", "type": "about", "label": "Mengapa Memilih Kami", "default_props": {"title": "Keunggulan Kami", "content": "Berpengalaman > 5 tahun • Garansi kualitas • Harga transparan • Pelayanan ramah", "features": ["Berpengalaman > 5 tahun", "Garansi kualitas", "Harga transparan", "Pelayanan ramah"]}, "required": false, "order": 5},
    {"id": "booking", "type": "contact_info", "label": "Booking & Konsultasi", "default_props": {"title": "Booking Sekarang", "phone": "", "whatsapp": "", "email": "", "hours": "08:00 - 20:00 (Senin-Sabtu)", "booking_info": "Konsultasi gratis sebelum booking"}, "required": true, "order": 5},
    {"id": "whatsapp", "type": "whatsapp_button", "label": "WhatsApp Button", "default_props": {"phone": "", "message": "Halo, saya ingin booking jasa..."}, "required": true, "order": 6}
  ]',
  TRUE
)
ON CONFLICT (name) DO NOTHING;