-- 017_seed_demo_users.sql
-- Sprint 1: Migrate demo users from mock store to database
-- DEV/STAGING ONLY: never run on production (demo seed data).
-- Run this after 016_create_products.sql. Requires: 002 templates, 006 websites, 015 (no trial_ends_at).

-- ============================================
-- DEMO USERS
-- ============================================
-- Demo 1: Free tier, 1 website
-- Demo 2: Starter tier, 2 websites

-- Insert demo users (if not exists)
INSERT INTO users (id, email, name, business_type, tier, subdomain, created_at, updated_at)
VALUES
  (
    '574fb366-f0c1-4901-bde3-1dc73cb5c3df',
    'demo1@umkm.id',
    'Bu Toni (1 Website)',
    'food',
    'free',
    'tenant-kopibutoni',
    NOW() - INTERVAL '5 days',
    NOW()
  ),
  (
    '3d548114-a262-4bbb-92d6-c1e91646e5cf',
    'demo2@umkm.id',
    'Siti Rahma (2 Website)',
    'fashion',
    'starter',
    'tenant-hijabcantik',
    NOW() - INTERVAL '10 days',
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  business_type = EXCLUDED.business_type,
  tier = EXCLUDED.tier,
  subdomain = EXCLUDED.subdomain,
  updated_at = NOW();

-- Insert subscriptions for demo users
INSERT INTO subscriptions (id, user_id, tier, price_id, status, current_period_start, current_period_end, payment_gateway, created_at)
VALUES
  (
    '7183f889-e55f-4885-a12d-8128a62d3b85',
    '574fb366-f0c1-4901-bde3-1dc73cb5c3df',
    'free',
    'price_free',
    'active',
    NOW(),
    NOW() + INTERVAL '100 years',
    'manual',
    NOW()
  ),
  (
    'a71302d1-c485-40a4-a3c5-ea1527437b4e',
    '3d548114-a262-4bbb-92d6-c1e91646e5cf',
    'starter',
    'price_starter_yearly',
    'active',
    NOW(),
    NOW() + INTERVAL '1 year',
    'midtrans',
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  tier = EXCLUDED.tier,
  status = EXCLUDED.status,
  current_period_end = EXCLUDED.current_period_end,
  updated_at = NOW();

-- ============================================
-- DEMO WEBSITES
-- ============================================
-- NOTE: users.current_template_id holds a UUID FK-less reference to templates(id);
-- 002 seeds random UUIDs, so demo rows leave it NULL and websites resolve templates by slug at runtime.
INSERT INTO websites (id, user_id, name, business_type, subdomain, custom_domain, custom_domain_verified, created_at, updated_at)
VALUES
  -- Demo 1: 1 website
  (
    'b0bcf81f-6f08-4be6-8978-ff687e9117fa',
    '574fb366-f0c1-4901-bde3-1dc73cb5c3df',
    'Warung Kopi Bu Toni',
    'food',
    'tenant-kopibutoni',
    NULL,
    FALSE,
    NOW() - INTERVAL '5 days',
    NOW()
  ),
  -- Demo 2: 2 websites
  (
    '09314ddf-75d8-450f-ac7a-ee7bd26358b4',
    '3d548114-a262-4bbb-92d6-c1e91646e5cf',
    'Hijab Cantik Official',
    'fashion',
    'tenant-hijabcantik',
    'hijabcantik.com',
    TRUE,
    NOW() - INTERVAL '10 days',
    NOW()
  ),
  (
    'd6d5a2b7-59d9-4f69-aa6a-9f7cd6bd7e70',
    '3d548114-a262-4bbb-92d6-c1e91646e5cf',
    'Aksesoris Cantik & Bros',
    'retail',
    'tenant-aksesoris',
    NULL,
    FALSE,
    NOW() - INTERVAL '3 days',
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  business_type = EXCLUDED.business_type,
  subdomain = EXCLUDED.subdomain,
  custom_domain = EXCLUDED.custom_domain,
  custom_domain_verified = EXCLUDED.custom_domain_verified,
  updated_at = NOW();

-- ============================================
-- DEMO PRODUCTS (from template defaults)
-- ============================================
-- Website 1: Warung Kopi Bu Toni (food)
INSERT INTO products (id, website_id, name, description, price, category, stock, low_stock_threshold, is_active, sort_order, created_at, updated_at)
VALUES
  (
    '95f2e952-54fa-4929-b548-cc6f2f85b706',
    'b0bcf81f-6f08-4be6-8978-ff687e9117fa',
    'Kopi Susu Aren Spesial',
    'Espresso robusta dengan susu murni & gula aren asli',
    18000, -- IDR (rupiah integer)
    'Minuman',
    50,
    5,
    TRUE,
    0,
    NOW(),
    NOW()
  ),
  (
    '6379028b-f0eb-4063-86f7-537c240ae9b1',
    'b0bcf81f-6f08-4be6-8978-ff687e9117fa',
    'Roti Bakar Coklat Keju',
    'Roti gandum bakar dengan keju cheddar melimpah',
    15000,
    'Makanan',
    30,
    5,
    TRUE,
    1,
    NOW(),
    NOW()
  ),
  (
    '50e4e18e-cf28-4579-bc05-661e29e9481c',
    'b0bcf81f-6f08-4be6-8978-ff687e9117fa',
    'Pisang Goreng Crispy',
    'Pisang kepok renyah ditaburi gula kayu manis',
    12000,
    'Makanan',
    100,
    10,
    TRUE,
    2,
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  category = EXCLUDED.category,
  stock = EXCLUDED.stock,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- Website 2a: Hijab Cantik Official (fashion)
INSERT INTO products (id, website_id, name, description, price, category, stock, low_stock_threshold, is_active, sort_order, created_at, updated_at)
VALUES
  (
    'd396868b-848a-4aed-8837-8c7803a8154e',
    '09314ddf-75d8-450f-ac7a-ee7bd26358b4',
    'Pashmina Ceruty Babydoll',
    'Jatuh, mudah dibentuk, tidak menerawang',
    35000,
    'Hijab',
    200,
    10,
    TRUE,
    0,
    NOW(),
    NOW()
  ),
  (
    '5126acd5-70b1-40e1-bf7b-1843f83a4cd4',
    '09314ddf-75d8-450f-ac7a-ee7bd26358b4',
    'Gamis Rayon Premium',
    'Bahan adem semriwing, busui friendly',
    125000,
    'Gamis',
    50,
    5,
    TRUE,
    1,
    NOW(),
    NOW()
  ),
  (
    '11111111-1111-4111-8111-111111111111',
    '09314ddf-75d8-450f-ac7a-ee7bd26358b4',
    'Hijab Paris Jadul Original',
    'Tegak di dahi, nyaman seharian',
    20000,
    'Hijab',
    300,
    20,
    TRUE,
    2,
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  category = EXCLUDED.category,
  stock = EXCLUDED.stock,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- Website 2b: Aksesoris Cantik & Bros (retail)
INSERT INTO products (id, website_id, name, description, price, category, stock, low_stock_threshold, is_active, sort_order, created_at, updated_at)
VALUES
  (
    '22222222-2222-4222-8222-222222222222',
    'd6d5a2b7-59d9-4f69-aa6a-9f7cd6bd7e70',
    'Bros Mutiara Air Tawar',
    'Kilau mutiara alami dengan pin kuat',
    25000,
    'Aksesoris',
    100,
    10,
    TRUE,
    0,
    NOW(),
    NOW()
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    'd6d5a2b7-59d9-4f69-aa6a-9f7cd6bd7e70',
    'Jepit Rambut Korea Pastel (Isi 4)',
    'Jepit cakar kuat tidak merusak rambut',
    10000,
    'Aksesoris',
    200,
    20,
    TRUE,
    1,
    NOW(),
    NOW()
  ),
  (
    '44444444-4444-4434-8434-444444444444',
    'd6d5a2b7-59d9-4f69-aa6a-9f7cd6bd7e70',
    'Cincin Titanium Anti Karat',
    'Lapisan emas 18k tahan air dan keringat',
    35000,
    'Aksesoris',
    80,
    10,
    TRUE,
    2,
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  category = EXCLUDED.category,
  stock = EXCLUDED.stock,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- ============================================
-- DEMO ORDERS
-- ============================================
INSERT INTO orders (id, user_id, website_id, product_name, product_price, quantity, total_amount, status, order_date, customer_name, customer_phone, customer_email, payment_method, payment_status, delivery_address, notes, created_at, updated_at)
VALUES
  -- Orders for site-demo-1
  (
    '55555555-5555-4555-8555-555555555555',
    '574fb366-f0c1-4901-bde3-1dc73cb5c3df',
    'b0bcf81f-6f08-4be6-8978-ff687e9117fa',
    'Kopi Susu Aren Spesial',
    18000,
    2,
    36000,
    'baru',
    NOW() - INTERVAL '2 hours',
    'Budi Santoso',
    '081234567891',
    'budi@gmail.com',
    'transfer',
    'paid',
    'Jl. Dago Asri No. 12, Bandung',
    'Tolong kopinya less sugar ya bu.',
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '2 hours'
  ),
  (
    '66666666-6666-4656-8666-666666666666',
    '574fb366-f0c1-4901-bde3-1dc73cb5c3df',
    'b0bcf81f-6f08-4be6-8978-ff687e9117fa',
    'Roti Bakar Coklat Keju',
    15000,
    1,
    15000,
    'dikirim',
    NOW() - INTERVAL '5 hours',
    'Dewi Lestari',
    '081987654321',
    'dewi@gmail.com',
    'cod',
    'pending',
    'Kost Melati Kamar 4, Bandung',
    'Kejunya dibanyakin ya kak.',
    NOW() - INTERVAL '5 hours',
    NOW() - INTERVAL '5 hours'
  ),
  (
    '77777777-7777-4777-8777-777777777777',
    '574fb366-f0c1-4901-bde3-1dc73cb5c3df',
    'b0bcf81f-6f08-4be6-8978-ff687e9117fa',
    'Pisang Goreng Crispy',
    12000,
    3,
    36000,
    'selesai',
    NOW() - INTERVAL '24 hours',
    'Dimas Anggara',
    '085612345678',
    'dimas@gmail.com',
    'cash',
    'paid',
    'Ambil langsung di warung',
    '',
    NOW() - INTERVAL '24 hours',
    NOW() - INTERVAL '24 hours'
  ),
  -- Orders for site-demo-2a
  (
    '88888888-8888-4888-8888-888888888888',
    '3d548114-a262-4bbb-92d6-c1e91646e5cf',
    '09314ddf-75d8-450f-ac7a-ee7bd26358b4',
    'Pashmina Ceruty Babydoll',
    35000,
    2,
    70000,
    'baru',
    NOW() - INTERVAL '1 hour',
    'Anisa Putri',
    '081223344556',
    'anisa@yahoo.com',
    'transfer',
    'paid',
    'Jl. Margonda Raya No. 10, Depok',
    'Warna Mocca dan Sage Green ya.',
    NOW() - INTERVAL '1 hour',
    NOW() - INTERVAL '1 hour'
  ),
  (
    '99999999-9999-4999-8999-999999999999',
    '3d548114-a262-4bbb-92d6-c1e91646e5cf',
    '09314ddf-75d8-450f-ac7a-ee7bd26358b4',
    'Gamis Rayon Premium',
    125000,
    1,
    125000,
    'konfirmasi',
    NOW() - INTERVAL '6 hours',
    'Nabila Zahra',
    '081334455667',
    'nabila@gmail.com',
    'cod',
    'pending',
    'Komplek Pesona Asri Blok C3, Jakarta Timur',
    'Ukuran XL.',
    NOW() - INTERVAL '6 hours',
    NOW() - INTERVAL '6 hours'
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '3d548114-a262-4bbb-92d6-c1e91646e5cf',
    '09314ddf-75d8-450f-ac7a-ee7bd26358b4',
    'Hijab Paris Jadul Original',
    20000,
    3,
    60000,
    'selesai',
    NOW() - INTERVAL '2 days',
    'Rina Marlina',
    '081445566778',
    'rina@gmail.com',
    'transfer',
    'paid',
    'Jl. Tebet Barat No. 8, Jakarta Selatan',
    '',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
  ),
  -- Orders for site-demo-2b
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    '3d548114-a262-4bbb-92d6-c1e91646e5cf',
    'd6d5a2b7-59d9-4f69-aa6a-9f7cd6bd7e70',
    'Bros Mutiara Air Tawar',
    25000,
    2,
    50000,
    'baru',
    NOW() - INTERVAL '3 hours',
    'Zahra Salsabila',
    '081556677889',
    'zahra@gmail.com',
    'cod',
    'pending',
    'Jl. Kemang Timur No. 15, Jakarta Selatan',
    'Box kado ya kak.',
    NOW() - INTERVAL '3 hours',
    NOW() - INTERVAL '3 hours'
  ),
  (
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    '3d548114-a262-4bbb-92d6-c1e91646e5cf',
    'd6d5a2b7-59d9-4f69-aa6a-9f7cd6bd7e70',
    'Jepit Rambut Korea Pastel (Isi 4)',
    10000,
    4,
    40000,
    'selesai',
    NOW() - INTERVAL '36 hours',
    'Farida Hanim',
    '081667788990',
    'farida@gmail.com',
    'transfer',
    'paid',
    'Perumahan Griya Indah No. 22, Bekasi',
    '',
    NOW() - INTERVAL '36 hours',
    NOW() - INTERVAL '36 hours'
  )
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  payment_status = EXCLUDED.payment_status,
  updated_at = NOW();

-- ============================================
-- DEMO WEBSITE CONFIGS (user_templates)
-- ============================================
-- These will be created when user first saves in builder
-- For now, we'll rely on template defaults

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify data:
-- SELECT * FROM users WHERE email IN ('demo1@umkm.id','demo2@umkm.id');
-- SELECT * FROM websites WHERE user_id IN ('574fb366-f0c1-4901-bde3-1dc73cb5c3df', '3d548114-a262-4bbb-92d6-c1e91646e5cf');
-- SELECT * FROM products WHERE website_id IN ('b0bcf81f-6f08-4be6-8978-ff687e9117fa', '09314ddf-75d8-450f-ac7a-ee7bd26358b4', 'd6d5a2b7-59d9-4f69-aa6a-9f7cd6bd7e70');
-- SELECT * FROM orders WHERE website_id IN ('b0bcf81f-6f08-4be6-8978-ff687e9117fa', '09314ddf-75d8-450f-ac7a-ee7bd26358b4', 'd6d5a2b7-59d9-4f69-aa6a-9f7cd6bd7e70');