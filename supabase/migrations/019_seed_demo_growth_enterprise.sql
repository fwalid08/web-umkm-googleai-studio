-- 019_seed_demo_growth_enterprise.sql
-- Sprint 1: Add demo users for growth & enterprise tiers
-- DEV/STAGING ONLY: never run on production (demo seed data).
-- Run this after 018_add_marketplace_business_type.sql.

-- ============================================
-- DEMO USERS - GROWTH & ENTERPRISE
-- ============================================
-- Growth tier: 10 websites, 200 products, 3 custom domains
-- Enterprise tier: 999 websites, 9999 products, 10 custom domains

INSERT INTO users (id, email, name, business_type, tier, subdomain, created_at, updated_at)
VALUES
  -- Growth tier demo
  (
    '024efdae-d5b6-433d-a22d-d9ed3b497cda',
    'demo3@umkm.id',
    'Budi Growth (10 Website)',
    'services',
    'growth',
    'tenant-growthdemo',
    NOW() - INTERVAL '30 days',
    NOW()
  ),
  -- Enterprise tier demo
  (
    '64fc60c8-af34-42c9-aad9-9009d68880f4',
    'demo4@umkm.id',
    'Citra Enterprise (Unlimited)',
    'marketplace',
    'enterprise',
    'tenant-enterprisedemo',
    NOW() - INTERVAL '60 days',
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  business_type = EXCLUDED.business_type,
  tier = EXCLUDED.tier,
  subdomain = EXCLUDED.subdomain,
  updated_at = NOW();

-- ============================================
-- SUBSCRIPTIONS FOR DEMO USERS
-- ============================================
INSERT INTO subscriptions (id, user_id, tier, price_id, status, current_period_start, current_period_end, payment_gateway, created_at)
VALUES
  -- Growth subscription
  (
    'f2dcdea8-4f4d-44e7-b076-b9a30c72b1f1',
    '024efdae-d5b6-433d-a22d-d9ed3b497cda',
    'growth',
    'price_growth_yearly',
    'active',
    NOW(),
    NOW() + INTERVAL '1 year',
    'midtrans',
    NOW()
  ),
  -- Enterprise subscription
  (
    '0c72f646-1ea1-41c2-bf6b-0cf7c2ddf5b6',
    '64fc60c8-af34-42c9-aad9-9009d68880f4',
    'enterprise',
    'price_enterprise_yearly',
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
-- DEMO WEBSITES - GROWTH (3 websites)
-- ============================================
INSERT INTO websites (id, user_id, name, business_type, subdomain, custom_domain, custom_domain_verified, created_at, updated_at)
VALUES
  -- Growth user websites
  (
    '13cba55e-c548-4448-b71c-2cc99c19c1c8',
    '024efdae-d5b6-433d-a22d-d9ed3b497cda',
    'Jasa Desain Grafis Budi',
    'services',
    'tenant-growthdemo',
    'budidesain.com',
    TRUE,
    NOW() - INTERVAL '30 days',
    NOW()
  ),
  (
    '3b9c61e6-f5f8-4fb0-ae70-db5a705f4835',
    '024efdae-d5b6-433d-a22d-d9ed3b497cda',
    'Konsultasi Digital Marketing',
    'services',
    'tenant-growthmarketing',
    NULL,
    FALSE,
    NOW() - INTERVAL '20 days',
    NOW()
  ),
  (
    '93f667c4-2403-49e8-9482-09fea225fcb3',
    '024efdae-d5b6-433d-a22d-d9ed3b497cda',
    'Training & Workshop Online',
    'education',
    'tenant-growthtraining',
    'growthedu.id',
    TRUE,
    NOW() - INTERVAL '10 days',
    NOW()
  ),
  -- Enterprise user websites (5 websites)
  (
    'db9b5b44-0be6-4dc6-a8dc-2f81d68b3f6d',
    '64fc60c8-af34-42c9-aad9-9009d68880f4',
    'Marketplace Citra Utama',
    'marketplace',
    'tenant-enterprisedemo',
    'citramarketplace.com',
    TRUE,
    NOW() - INTERVAL '60 days',
    NOW()
  ),
  (
    '23cff5a6-e8de-43b5-bc52-8d18cb7278fe',
    '64fc60c8-af34-42c9-aad9-9009d68880f4',
    'Citra Fashion Wholesale',
    'fashion',
    'tenant-citrafashion',
    'citrafashion.biz',
    TRUE,
    NOW() - INTERVAL '45 days',
    NOW()
  ),
  (
    '74611e7e-f498-47aa-87f5-aece93b4f864',
    '64fc60c8-af34-42c9-aad9-9009d68880f4',
    'Citra Electronics Hub',
    'electronics',
    'tenant-citraelectronics',
    'citratech.store',
    TRUE,
    NOW() - INTERVAL '30 days',
    NOW()
  ),
  (
    '9441e2d8-3f32-4d04-bc11-6d40680b17d1',
    '64fc60c8-af34-42c9-aad9-9009d68880f4',
    'Citra Home & Living',
    'home',
    'tenant-citrahomeliving',
    NULL,
    FALSE,
    NOW() - INTERVAL '15 days',
    NOW()
  ),
  (
    '8eea737c-61ea-4d6f-b093-86fbe02f3498',
    '64fc60c8-af34-42c9-aad9-9009d68880f4',
    'Citra Corporate Services',
    'services',
    'tenant-citracorporate',
    'citracorp.co.id',
    TRUE,
    NOW() - INTERVAL '5 days',
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
-- DEMO PRODUCTS - GROWTH WEBSITES
-- ============================================
-- Website 1: Jasa Desain Grafis Budi (services)
INSERT INTO products (id, website_id, name, description, price, category, stock, low_stock_threshold, is_active, sort_order, created_at, updated_at)
VALUES
  (
    'f2dcdea8-4f4d-44e7-b076-b9a30c72b1f1',
    '13cba55e-c548-4448-b71c-2cc99c19c1c8',
    'Desain Logo Profesional',
    'Logo branding lengkap dengan 3 revisi, file AI/PNG/SVG',
    500000,
    'Desain',
    999,
    0,
    TRUE,
    0,
    NOW(),
    NOW()
  ),
  (
    '0c72f646-1ea1-41c2-bf6b-0cf7c2ddf5b6',
    '13cba55e-c548-4448-b71c-2cc99c19c1c8',
    'Desain Kemasan Produk',
    'Desain packaging 3D mockup + file siap cetak',
    750000,
    'Desain',
    999,
    0,
    TRUE,
    1,
    NOW(),
    NOW()
  ),
  (
    '7a903856-af11-48c1-9912-9cd631b13ef5',
    '13cba55e-c548-4448-b71c-2cc99c19c1c8',
    'Desain Sosmed Bulanan',
    '12 post feed + 12 story + 4 reel cover per bulan',
    1500000,
    'Social Media',
    999,
    0,
    TRUE,
    2,
    NOW(),
    NOW()
  );

-- Website 2: Konsultasi Digital Marketing (services)
INSERT INTO products (id, website_id, name, description, price, category, stock, low_stock_threshold, is_active, sort_order, created_at, updated_at)
VALUES
  (
    'e0cff349-6481-493c-ae27-22d86e7b08b1',
    '3b9c61e6-f5f8-4fb0-ae70-db5a705f4835',
    'Audit SEO Website',
    'Analisis teknis, content, backlink + rekomendasi prioritas',
    1000000,
    'SEO',
    999,
    0,
    TRUE,
    0,
    NOW(),
    NOW()
  ),
  (
    '2dd60877-b09b-4e66-ad52-9410cc9f5c6d',
    '3b9c61e6-f5f8-4fb0-ae70-db5a705f4835',
    'Manajemen Iklan Meta/Google',
    'Setup kampanye, optimasi harian, laporan bulanan',
    2500000,
    'Ads Management',
    999,
    0,
    TRUE,
    1,
    NOW(),
    NOW()
  ),
  (
    '530ca372-5cf1-4a43-a6b8-659d174b17b0',
    '3b9c61e6-f5f8-4fb0-ae70-db5a705f4835',
    'Konsultasi Strategi Digital',
    'Sesi 2 jam: audit + roadmap 3 bulan + KPI',
    750000,
    'Konsultasi',
    999,
    0,
    TRUE,
    2,
    NOW(),
    NOW()
  );

-- Website 3: Training & Workshop Online (education)
INSERT INTO products (id, website_id, name, description, price, category, stock, low_stock_threshold, is_active, sort_order, created_at, updated_at)
VALUES
  (
    'abe08fff-730d-4424-aee6-f486c7a50cab',
    '93f667c4-2403-49e8-9482-09fea225fcb3',
    'Workshop Desain untuk Pemula',
    '4 sesi x 3 jam, praktik langsung, sertifikat',
    800000,
    'Workshop',
    30,
    5,
    TRUE,
    0,
    NOW(),
    NOW()
  ),
  (
    'bf045790-822c-4197-bd3f-bec256d7bb12',
    '93f667c4-2403-49e8-9482-09fea225fcb3',
    'Kelas Digital Marketing Dasar',
    '8 modul video + live Q&A mingguan + akses seumur hidup',
    1200000,
    'Course',
    50,
    5,
    TRUE,
    1,
    NOW(),
    NOW()
  ),
  (
    '9dc5c53d-b831-4a31-8bc8-f5a1da4f86a5',
    '93f667c4-2403-49e8-9482-09fea225fcb3',
    'Mentoring 1-on-1 Bulanan',
    '4 sesi privat 1 jam + review tugas + akses chat',
    2000000,
    'Mentoring',
    10,
    2,
    TRUE,
    2,
    NOW(),
    NOW()
  );

-- ============================================
-- DEMO PRODUCTS - ENTERPRISE WEBSITES
-- ============================================
-- Website 1: Marketplace Citra Utama (marketplace)
INSERT INTO products (id, website_id, name, description, price, category, stock, low_stock_threshold, is_active, sort_order, created_at, updated_at)
VALUES
  (
    '035c1d7f-c7d4-4326-8935-2c7a1c08c0ce',
    'db9b5b44-0be6-4dc6-a8dc-2f81d68b3f6d',
    'Paket Seller Starter',
    'Listing 50 produk + banner toko + promosi 7 hari',
    299000,
    'Paket Seller',
    999,
    0,
    TRUE,
    0,
    NOW(),
    NOW()
  ),
  (
    '09f960c2-d45f-476a-a5a0-64cfce2a0cab',
    'db9b5b44-0be6-4dc6-a8dc-2f81d68b3f6d',
    'Paket Seller Pro',
    'Listing 200 produk + featured placement + analytics dashboard',
    799000,
    'Paket Seller',
    999,
    0,
    TRUE,
    1,
    NOW(),
    NOW()
  ),
  (
    '762fd27c-52b6-4470-9447-873297d2f73d',
    'db9b5b44-0be6-4dc6-a8dc-2f81d68b3f6d',
    'Paket Seller Enterprise',
    'Unlimited listing + dedicated support + API access',
    2500000,
    'Paket Seller',
    999,
    0,
    TRUE,
    2,
    NOW(),
    NOW()
  );

-- Website 2: Citra Fashion Wholesale (fashion)
INSERT INTO products (id, website_id, name, description, price, category, stock, low_stock_threshold, is_active, sort_order, created_at, updated_at)
VALUES
  (
    'b5861d18-aa82-4d6e-b8a0-7a729aa26ff6',
    '23cff5a6-e8de-43b5-bc52-8d18cb7278fe',
    'Hijab Premium Grosir (Dus 50 pcs)',
    'Bahan ceruty/viscose premium, mix warna',
    1250000,
    'Hijab Grosir',
    200,
    10,
    TRUE,
    0,
    NOW(),
    NOW()
  ),
  (
    '552a4caa-cb19-4398-9d20-8d5d9c6e8ca5',
    '23cff5a6-e8de-43b5-bc52-8d18cb7278fe',
    'Gamis Syar''i Grosir (Dus 30 pcs)',
    'Rayon premium, bordir tangan, size S-XXL',
    3750000,
    'Gamis Grosir',
    150,
    10,
    TRUE,
    1,
    NOW(),
    NOW()
  ),
  (
    'e1eccab7-43e1-4c23-881f-1aa91c4cef34',
    '23cff5a6-e8de-43b5-bc52-8d18cb7278fe',
    'Aksesoris Hijab Set Grosir (Dus 100 set)',
    'Bros + pin + magnet premium packaging',
    800000,
    'Aksesoris Grosir',
    500,
    20,
    TRUE,
    2,
    NOW(),
    NOW()
  );

-- Website 3: Citra Electronics Hub (electronics)
INSERT INTO products (id, website_id, name, description, price, category, stock, low_stock_threshold, is_active, sort_order, created_at, updated_at)
VALUES
  (
    'f37ea3d3-397b-4b8b-a22e-8105d91dedf1',
    '74611e7e-f498-47aa-87f5-aece93b4f864',
    'Powerbank 20000mAh Fast Charging',
    'PD 30W, dual output, indikator LED, garansi 1 thn',
    250000,
    'Aksesoris HP',
    500,
    20,
    TRUE,
    0,
    NOW(),
    NOW()
  ),
  (
    '4fc6c89d-16b6-42fc-9662-7d9ccdcd15d3',
    '74611e7e-f498-47aa-87f5-aece93b4f864',
    'Wireless Earbuds ANC Hybrid',
    'Active Noise Cancelling 40dB, 30h battery, IPX4',
    450000,
    'Audio',
    300,
    15,
    TRUE,
    1,
    NOW(),
    NOW()
  ),
  (
    '992341a6-a36e-4e4d-b603-08194fe9361c',
    '74611e7e-f498-47aa-87f5-aece93b4f864',
    'Mechanical Keyboard Hot-swap 75%',
    'Gateron switch, RGB per-key, aluminum case',
    850000,
    'Keyboard',
    150,
    10,
    TRUE,
    2,
    NOW(),
    NOW()
  );

-- Website 4: Citra Home & Living (home)
INSERT INTO products (id, website_id, name, description, price, category, stock, low_stock_threshold, is_active, sort_order, created_at, updated_at)
VALUES
  (
    'e9df5b66-4580-45c0-a1ec-0e51fdcb42af',
    '9441e2d8-3f32-4d04-bc11-6d40680b17d1',
    'Set Perlengkapan Makan Minimalis 4 Orang',
    'Piring, mangkuk, gelas, sendok - keramik putih',
    350000,
    'Perlengkapan Makan',
    100,
    10,
    TRUE,
    0,
    NOW(),
    NOW()
  ),
  (
    '85518f16-d156-4c58-8bdd-f04e6201dea5',
    '9441e2d8-3f32-4d04-bc11-6d40680b17d1',
    'Organizer Lemari Modular (Set 6)',
    'Plastik ABS kuat, tumpuk bisa, transparan',
    180000,
    'Organizer',
    200,
    15,
    TRUE,
    1,
    NOW(),
    NOW()
  ),
  (
    '04bc1b50-51fb-46b4-8bd8-489407a0fd4f',
    '9441e2d8-3f32-4d04-bc11-6d40680b17d1',
    'Lampu Hias LED Smart WiFi',
    '16 juta warna, jadwal, sinkron musik, voice control',
    220000,
    'Pencahayaan',
    150,
    10,
    TRUE,
    2,
    NOW(),
    NOW()
  );

-- Website 5: Citra Corporate Services (services)
INSERT INTO products (id, website_id, name, description, price, category, stock, low_stock_threshold, is_active, sort_order, created_at, updated_at)
VALUES
  (
    '2c0f3c89-1f2a-4161-897f-96d2aeb58425',
    '8eea737c-61ea-4d6f-b093-86fbe02f3498',
    'Pembuatan PT/PMA Lengkap',
    'Akta notaris, SK Kemenkumham, NPWP, NIB, BPJS',
    7500000,
    'Legalisasi',
    999,
    0,
    TRUE,
    0,
    NOW(),
    NOW()
  ),
  (
    '596b7ae3-d175-40fd-85d0-f75196da7223',
    '8eea737c-61ea-4d6f-b093-86fbe02f3498',
    'Konsultan Pajak & Laporan Bulanan',
    'SPT Masa/PPT, e-Faktur, laporan keuangan quarterly',
    1500000,
    'Pajak & Akuntansi',
    999,
    0,
    TRUE,
    1,
    NOW(),
    NOW()
  ),
  (
    '2b540f4c-48fb-4fad-984c-82001bdc9075',
    '8eea737c-61ea-4d6f-b093-86fbe02f3498',
    'HR Outsourcing & Payroll',
    'Rekrutmen, kontrak, slip gaji, BPJS, THR - per karyawan/bln',
    150000,
    'HR Services',
    999,
    0,
    TRUE,
    2,
    NOW(),
    NOW()
  );

-- ============================================
-- DEMO ORDERS - GROWTH WEBSITES
-- ============================================
INSERT INTO orders (user_id, website_id, product_name, product_price, quantity, total_amount, status, order_date, customer_name, customer_phone, customer_email, payment_method, payment_status, delivery_address, notes, created_at, updated_at)
VALUES
  -- Orders for Growth website 1 (Desain Grafis)
  (
    '024efdae-d5b6-433d-a22d-d9ed3b497cda',
    '13cba55e-c548-4448-b71c-2cc99c19c1c8',
    'Desain Logo Profesional',
    500000,
    1,
    500000,
    'selesai',
    NOW() - INTERVAL '3 days',
    'Andi Wijaya',
    '081234567890',
    'andi@startup.id',
    'transfer',
    'paid',
    'Digital delivery',
    'Logo untuk startup fintech',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days'
  ),
  (
    '024efdae-d5b6-433d-a22d-d9ed3b497cda',
    '13cba55e-c548-4448-b71c-2cc99c19c1c8',
    'Desain Kemasan Produk',
    750000,
    1,
    750000,
    'dikirim',
    NOW() - INTERVAL '1 day',
    'Sari Dewi',
    '081298765432',
    'sari@umkmfood.id',
    'transfer',
    'paid',
    'Digital delivery',
    'Kemasan snack sehat',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
  ),
  -- Orders for Growth website 2 (Digital Marketing)
  (
    '024efdae-d5b6-433d-a22d-d9ed3b497cda',
    '3b9c61e6-f5f8-4fb0-ae70-db5a705f4835',
    'Audit SEO Website',
    1000000,
    1,
    1000000,
    'konfirmasi',
    NOW() - INTERVAL '5 hours',
    'PT Maju Jaya',
    '02155556666',
    'procurement@majujaya.co.id',
    'transfer',
    'pending',
    'Digital delivery',
    'Website corporate',
    NOW() - INTERVAL '5 hours',
    NOW() - INTERVAL '5 hours'
  ),
  -- Orders for Growth website 3 (Training)
  (
    '024efdae-d5b6-433d-a22d-d9ed3b497cda',
    '93f667c4-2403-49e8-9482-09fea225fcb3',
    'Workshop Desain untuk Pemula',
    800000,
    5,
    4000000,
    'selesai',
    NOW() - INTERVAL '7 days',
    'Komunitas Desain Bandung',
    '081333344444',
    'komdesbdg@gmail.com',
    'transfer',
    'paid',
    'Online (Zoom)',
    'Batch 5 peserta',
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '7 days'
  ),
  -- ============================================
  -- DEMO ORDERS - ENTERPRISE WEBSITES
  -- ============================================
  -- Orders for Enterprise website 1 (Marketplace)
  (
    '64fc60c8-af34-42c9-aad9-9009d68880f4',
    'db9b5b44-0be6-4dc6-a8dc-2f81d68b3f6d',
    'Paket Seller Pro',
    799000,
    1,
    799000,
    'selesai',
    NOW() - INTERVAL '2 days',
    'Toko Baju Online',
    '081211112222',
    'tokobaju@shop.id',
    'transfer',
    'paid',
    'Digital delivery',
    'Upgrade dari starter',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
  ),
  (
    '64fc60c8-af34-42c9-aad9-9009d68880f4',
    'db9b5b44-0be6-4dc6-a8dc-2f81d68b3f6d',
    'Paket Seller Starter',
    299000,
    3,
    897000,
    'baru',
    NOW() - INTERVAL '4 hours',
    'Koleksi Sepatu Murah',
    '081222223333',
    'sepatu@murah.id',
    'cod',
    'pending',
    'Digital delivery',
    '',
    NOW() - INTERVAL '4 hours',
    NOW() - INTERVAL '4 hours'
  ),
  -- Orders for Enterprise website 2 (Fashion Wholesale)
  (
    '64fc60c8-af34-42c9-aad9-9009d68880f4',
    '23cff5a6-e8de-43b5-bc52-8d18cb7278fe',
    'Hijab Premium Grosir (Dus 50 pcs)',
    1250000,
    2,
    2500000,
    'dikirim',
    NOW() - INTERVAL '1 day',
    'Agen Hijab Medan',
    '081266667777',
    'agenhijab@medan.id',
    'transfer',
    'paid',
    'Jl. Gatot Subroto No. 88, Medan',
    'Warna: mix pastel',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
  ),
  (
    '64fc60c8-af34-42c9-aad9-9009d68880f4',
    '23cff5a6-e8de-43b5-bc52-8d18cb7278fe',
    'Gamis Syar''i Grosir (Dus 30 pcs)',
    3750000,
    1,
    3750000,
    'selesai',
    NOW() - INTERVAL '10 days',
    'Butik Muslimah Surabaya',
    '081277778888',
    'butik@surabaya.id',
    'transfer',
    'paid',
    'Jl. Basuki Rahmat No. 45, Surabaya',
    'Size campur S-XL',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '10 days'
  ),
  -- Orders for Enterprise website 3 (Electronics)
  (
    '64fc60c8-af34-42c9-aad9-9009d68880f4',
    '74611e7e-f498-47aa-87f5-aece93b4f864',
    'Wireless Earbuds ANC Hybrid',
    450000,
    10,
    4500000,
    'selesai',
    NOW() - INTERVAL '5 days',
    'Distributor Elektronik Jakarta',
    '081288889999',
    'distro@jakarta.id',
    'transfer',
    'paid',
    'Jl. Hayam Wuruk No. 123, Jakarta Pusat',
    'Bulk order untuk reseller',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days'
  ),
  -- Orders for Enterprise website 4 (Home & Living)
  (
    '64fc60c8-af34-42c9-aad9-9009d68880f4',
    '9441e2d8-3f32-4d04-bc11-6d40680b17d1',
    'Set Perlengkapan Makan Minimalis 4 Orang',
    350000,
    20,
    7000000,
    'dikirim',
    NOW() - INTERVAL '3 days',
    'Hotel & Resort Bali',
    '081299990000',
    'procurement@baliresort.id',
    'transfer',
    'paid',
    'Jl. Raya Kuta No. 55, Badung, Bali',
    'Untuk renovasi kamar',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days'
  ),
  -- Orders for Enterprise website 5 (Corporate Services)
  (
    '64fc60c8-af34-42c9-aad9-9009d68880f4',
    '8eea737c-61ea-4d6f-b093-86fbe02f3498',
    'Pembuatan PT/PMA Lengkap',
    7500000,
    1,
    7500000,
    'konfirmasi',
    NOW() - INTERVAL '2 hours',
    'Startup Teknologi Baru',
    '081300001111',
    'founder@startupbaru.id',
    'transfer',
    'pending',
    'Digital delivery',
    'Urgensi: 1 minggu',
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '2 hours'
  )
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  payment_status = EXCLUDED.payment_status,
  updated_at = NOW();

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify data:
-- SELECT * FROM users WHERE email IN ('demo3@umkm.id','demo4@umkm.id');
-- SELECT * FROM websites WHERE user_id IN ('024efdae-d5b6-433d-a22d-d9ed3b497cda', '64fc60c8-af34-42c9-aad9-9009d68880f4');
-- SELECT * FROM products WHERE website_id IN (
--   '13cba55e-c548-4448-b71c-2cc99c19c1c8',
--   '3b9c61e6-f5f8-4fb0-ae70-db5a705f4835',
--   '93f667c4-2403-49e8-9482-09fea225fcb3',
--   'db9b5b44-0be6-4dc6-a8dc-2f81d68b3f6d',
--   '23cff5a6-e8de-43b5-bc52-8d18cb7278fe',
--   '74611e7e-f498-47aa-87f5-aece93b4f864',
--   '9441e2d8-3f32-4d04-bc11-6d40680b17d1',
--   '8eea737c-61ea-4d6f-b093-86fbe02f3498'
-- );
-- SELECT * FROM orders WHERE website_id IN (
--   '13cba55e-c548-4448-b71c-2cc99c19c1c8',
--   '3b9c61e6-f5f8-4fb0-ae70-db5a705f4835',
--   '93f667c4-2403-49e8-9482-09fea225fcb3',
--   'db9b5b44-0be6-4dc6-a8dc-2f81d68b3f6d',
--   '23cff5a6-e8de-43b5-bc52-8d18cb7278fe',
--   '74611e7e-f498-47aa-87f5-aece93b4f864',
--   '9441e2d8-3f32-4d04-bc11-6d40680b17d1',
--   '8eea737c-61ea-4d6f-b093-86fbe02f3498'
-- );