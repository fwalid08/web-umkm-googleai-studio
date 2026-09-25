# UMKM SaaS - Website Builder untuk UMKM Indonesia

Platform SaaS untuk membantu UMKM membangun website toko online profesional dengan template siap pakai.

## 🚀 Tech Stack

- **Framework**: Next.js 16.3.6 (App Router + `proxy.ts` untuk multi-tenant subdomain)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: PostgreSQL (Supabase, RLS enabled)
- **Auth**: NextAuth.js v5 (`5.0.0-beta.32`) — Credentials + Google, hybrid JWT manual (tanpa adapter)
- **Package Manager**: pnpm 10.x (Node 20)
- **Hosting**: Vercel
- **Payments**: Midtrans / Xendit (sandbox)

## 📦 Fitur Utama

- ✅ 5 Template UMKM (Makanan, Fashion, Kerajinan, Retail, Layanan)
- ✅ Template Fixed Builder — Tanpa Drag & Drop (Theme/Style/Content/Section, tambah/hapus section, ubah theme & konten)
- ✅ Order Management Dashboard
- ✅ Subdomain Otomatis (`tenant-xxx.saas-saya.com`)
- ✅ Custom Domain Support (`tokoku.com`)
- ✅ Free Trial 14 hari (tanpa kartu kredit)
- ✅ Tiered Pricing (Free → Starter Rp99K → Growth Rp299K → Enterprise)

## 🛠️ Setup Development

### Prerequisites
- Node.js 18+
- pnpm (package manager)
- Supabase account
- Vercel account (untuk deploy)

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Run development server
pnpm dev
```

### Environment Variables

Copy `.env.example` ke `.env.local` dan isi:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
# Service-role BYPASS RLS — hanya dipakai server-side (register, Google auto-create).
# Jangan expose ke client!

# NextAuth
NEXTAUTH_SECRET=your-secret-key # generate: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000

# Google OAuth (https://console.cloud.google.com/apis/credentials)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
# Kita pakai NextAuth Google provider langsung (bukan Supabase Auth Google).
# Callback: http://localhost:3000/api/auth/callback/google (prod: ganti domain)

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ROOT_DOMAIN=localhost:3000
# Prod contoh: NEXT_PUBLIC_ROOT_DOMAIN=saas-saya.com

# Payments (Sandbox)
MIDTRANS_SERVER_KEY=SB-Mid-server-xxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxx
MIDTRANS_IS_PRODUCTION=false
```

### Database Setup (Supabase)

1. Buat project di [supabase.com](https://supabase.com)
2. Enable Row Level Security (RLS) — sudah di-cover migrasi `001`
3. Jalankan migrasi **BERURUTAN** di Supabase Dashboard > SQL Editor:
   - `supabase/migrations/001_initial_schema.sql` — tabel users, templates, orders, subscriptions, user_templates + RLS + index + trigger
   - `supabase/migrations/002_seed_templates.sql` — seed 5 template (food, fashion, handicraft, retail, services)
   - `supabase/migrations/003_google_auth.sql` — kolom `auth_provider`, `google_id`, `avatar_url`
   - `supabase/migrations/004_fix_rls_insert_policies.sql` — **wajib**: policy INSERT users/subscriptions + DELETE orders + trigger `update_orders_updated_at`
4. Copy URL & anon key + service-role key ke `.env.local`
5. Verifikasi: `SELECT * FROM templates;` harus 5 baris. Cek `pg_policies` untuk `Users can insert own data`.

> ⚠️ Sprint 00.1 hotfix: anon key **tidak bisa INSERT** ke `public.users` tanpa `auth.uid()`.
> Register (`app/api/auth/register/route.ts`) & Google auto-create (`src/lib/auth/auth.ts`)
> pakai `createServiceSupabaseClient()` yang bypass RLS. Jangan panggil dari client!

### Development Commands

```bash
# Development
pnpm dev

# Build for production
pnpm build

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Database (Sprint 00: manual via Supabase SQL Editor — lihat # Database Setup)
pnpm db:check    # List file migrasi supabase/migrations/
pnpm db:push     # Print panduan jalankan 001..004 berurutan
pnpm db:reset    # Print panduan reset DEV ONLY (TRUNCATE, jangan di prod!)
pnpm db:new      # Print panduan bikin file migrasi 00X baru
```

## 📁 Project Structure

```
umkm-saas/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth pages (signin, signup)
│   │   ├── api/               # API routes (auth/register, auth/[...nextauth])
│   │   ├── dashboard/         # Dashboard pages (trial banner + stats)
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Landing page
│   ├── components/            # React components
│   │   └── ui/                # UI primitives (Card, Button, etc)
│   ├── lib/                   # Utilities & configs
│   │   ├── auth/auth.ts       # NextAuth config (Credentials + Google, JWT)
│   │   ├── supabase/          # Supabase clients (client, server, service-role)
│   │   └── utils.ts           # Helper functions
│   ├── proxy.ts               # Subdomain extraction → x-tenant-subdomain (Next 16 pengganti middleware.ts)
│   └── types/                 # TypeScript types (signUpSchema, dll)
├── supabase/
│   └── migrations/            # 001 schema, 002 seed, 003 google, 004 RLS fix
├── public/                    # Static assets
└── .github/workflows/         # CI/CD (lint + typecheck + build + deploy Vercel)
```

> 📝 Sprint 00.1 hotfix (25 Sep 2026):
> - Next 16 pakai `proxy.ts` bukan `middleware.ts`
> - NextAuth tanpa adapter (manual hybrid: Supabase Auth untuk Credentials, JWT untuk session)
> - RLS INSERT butuh service-role (`src/lib/supabase/service.ts`)
> - `no-explicit-any` = warn agar CI hijau — Sprint 01 ketatkan per-file

## 🌐 Subdomain & Custom Domain

### Default Subdomain
Setiap user mendapat: `tenant-{id}.saas-saya.com`

### Custom Domain
User bisa menambahkan domain sendiri:
1. Input domain di Settings > Domain
2. Tambahkan DNS records:
   - TXT: `_saas-verify.tokoku.com` = verification code
   - CNAME: `@` → `saas-saya.com`
3. Sistem verifikasi otomatis setiap 5 menit
4. SSL/HTTPS otomatis via Vercel

## 💰 Pricing Tiers

| Tier | Harga/Bulan | Fitur Utama |
|------|-------------|-------------|
| **Free** | Rp 0 | 3 template, 5 produk, trial 14 hari |
| **Starter** | Rp 99.000 | 5 template, produk unlimited, order dashboard |
| **Growth** | Rp 299.000 | Analytics, auto-followup, 2 payment gateway |
| **Enterprise** | Custom | Repeat order, API, multi-store, custom template |

## 🧪 Testing

```bash
# Run tests (Sprint 00-01: placeholder, Sprint 02: vitest)
pnpm test
```

## ✅ Demo Sprint 00 (sign-up → subdomain → DB)

1. `pnpm dev` → buka `http://localhost:3000/signup`
2. Daftar: nama + email + password + business_type → POST `/api/auth/register`
3. Cek response: `data.user.subdomain` = `tenant-xxxxxxxx`
4. Cek Supabase: `SELECT id, email, subdomain, tier, trial_ends_at FROM users;`
5. Login → `/dashboard` → banner trial 14 hari + card `tenant-xxx.saas-saya.com`
6. Google flow: `/signin` → Continue with Google → auto-create profile (lihat `auth.ts:signIn`)

## 🛠️ Sprint 01 — Builder & Website Live (26 Sep – 10 Okt 2026)

Tema "Pilih → Konfigurasi → Publish". Detail: `../sprints/sprint_1.md`.

**API baru:** `GET /api/templates` (+`locked` per tier), `GET /api/templates/:id` (uuid/nama),
`GET/PUT /api/user/website` (whitelist section, required dikunci, Free max 5 produk, 403 + link upgrade).

**Halaman baru:** `/dashboard/builder` (galeri), `/dashboard/builder/[id]` (editor + iframe preview live),
`/dashboard/settings` (subdomain + custom domain + DNS). `/` ganda: tenant → toko publik + SEO dinamis.

**Demo Sprint 01 (lokal, tanpa DNS):**
1. Daftar → catat subdomain → login
2. `/dashboard/builder` → Gunakan template food → editor terbuka
3. Matikan Testimoni, isi 2 produk di Menu, ganti warna utama → Simpan & Publish
4. Buka `http://<subdomain>.localhost:3000` (contoh: `http://tenant-a1b2c3d4.localhost:3000`) → toko live 🎉
5. Coba batasan: matikan Hero (400), 6 produk di Free (403), template locked (403 + Upgrade)

**Batasan diketahui:** tests otomatis → Sprint 02 (vitest belum dipasang); stats dashboard masih mock
→ diganti API real di Sprint 02 (Epic 2: Order Management).

## 🚀 Deploy ke Vercel

1. Push ke GitHub
2. Import project di Vercel
2. Tambahkan environment variables
3. Deploy otomatis

### Custom Domain di Vercel
1. Settings > Domains > Add
2. Verifikasi DNS
3. SSL otomatis

## 📄 License

MIT License - bebas digunakan untuk komersial.

---

**UMKM SaaS** - Memberdayakan UMKM Indonesia menjual online dengan mudah.