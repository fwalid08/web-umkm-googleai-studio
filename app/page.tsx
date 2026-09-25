import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTenantSite } from "@/lib/builder/public";
import { PublicWebsite } from "@/components/website/renderer";
import { rootHost, tenantDisplay } from "@/lib/urls";
import { LandingPricing } from "@/components/pricing/landing-pricing";
import {
  Store,
  Sparkles,
  ShoppingBag,
  BarChart3,
  Clock,
  Shield,
  ArrowRight,
  Check,
  Star,
  Globe,
  Palette,
  MessageCircle,
} from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenantSite();
  if (tenant.site) {
    return { title: tenant.site.seo.title, description: tenant.site.seo.description };
  }
  return {
    title: "UMKM SaaS — Website Toko Online Cepat untuk UMKM Indonesia",
    description: "Template siap pakai untuk kuliner, fashion, kerajinan & jasa. Pesanan WhatsApp otomatis, katalog produk, dan domain toko.",
  };
}

export default async function Home() {
  const tenant = await getTenantSite();
  if (tenant.isTenant && !tenant.site) notFound();
  if (tenant.site) return <PublicWebsite site={tenant.site} />;
  return <LandingPage />;
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg text-gray-900 tracking-tight">UMKM SaaS</span>
              <span className="hidden sm:inline-block ml-2 text-xs text-gray-500 font-medium">
                · Solusi Toko Digital
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/signin"
              className="text-xs sm:text-sm font-semibold text-gray-700 hover:text-emerald-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Masuk
            </Link>
            <Link
              href="/signin"
              className="text-xs sm:text-sm font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300/80 px-3.5 py-2 rounded-xl transition-all shadow-sm"
            >
              🚀 Coba Demo
            </Link>
            <Link
              href="/signup"
              className="hidden sm:inline-flex text-xs sm:text-sm font-semibold bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 shadow-sm transition-all"
            >
              Daftar Gratis
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:py-20 lg:py-24 border-b border-gray-100 bg-gradient-to-b from-emerald-50/40 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 tracking-wide">
                <span>Solusi Praktis UMKM Indonesia</span>
                <span aria-hidden="true">·</span>
                <span>Gratis 14 Hari</span>
                <span aria-hidden="true">·</span>
                <span>Tanpa Kartu Kredit</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 leading-[1.12]">
                Website Toko Online UMKM,{" "}
                <span className="text-emerald-600 underline decoration-emerald-300 underline-offset-8">
                  Siap Jual dalam Menit
                </span>
              </h1>

              <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-2xl">
                Bikin toko online tidak perlu pusing koding. Template siap pakai untuk warung kopi, kuliner,
                fashion hijab, kerajinan, dan ritel. Pesanan langsung masuk ke WhatsApp dan dashboard otomatis.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/signin"
                  className="inline-flex items-center justify-center gap-2 bg-emerald-600 text-white px-7 py-3.5 rounded-xl font-bold text-sm sm:text-base hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all"
                >
                  <span>Coba Akun Demo Instan</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 bg-white border border-gray-300 px-7 py-3.5 rounded-xl font-semibold text-sm sm:text-base text-gray-800 hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
                >
                  <span>Daftar Toko Baru</span>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="pt-2 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-gray-600">
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Langsung terhubung ke WhatsApp</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Subdomain gratis otomatis</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Desain responsive HP & laptop</span>
                </div>
              </div>
            </div>

            {/* Interactive Preview Card */}
            <div className="lg:col-span-5">
              <div className="bg-white border border-gray-200/90 rounded-2xl shadow-xl overflow-hidden">
                {/* Browser bar */}
                <div className="bg-gray-900 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                    <span className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                  </div>
                  <div className="text-[11px] text-gray-300 font-mono tracking-tight bg-gray-800 px-3 py-1 rounded-md">
                    {tenantDisplay("tenant-kopibutoni")}
                  </div>
                  <div className="w-8" />
                </div>

                {/* Mock store body */}
                <div className="p-5 space-y-4 bg-orange-50/30">
                  <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white p-5 rounded-xl">
                    <p className="text-xs uppercase tracking-wider font-semibold opacity-80">Warung Kopi & Kuliner</p>
                    <h3 className="text-xl font-bold mt-1">Warung Kopi Bu Toni</h3>
                    <p className="text-xs opacity-90 mt-1">Biji kopi robusta lokal seduh istimewa sejak 2018</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                      <span>Menu Terlaris</span>
                      <span className="text-emerald-700">Buka Hari Ini</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white p-3 rounded-lg border border-gray-200 text-left">
                        <p className="text-xs font-bold text-gray-900 truncate">Kopi Susu Aren</p>
                        <p className="text-xs text-emerald-700 font-semibold mt-1">Rp 18.000</p>
                        <span className="inline-block mt-2 text-[10px] text-gray-500">Pesan WA →</span>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200 text-left">
                        <p className="text-xs font-bold text-gray-900 truncate">Roti Bakar Keju</p>
                        <p className="text-xs text-emerald-700 font-semibold mt-1">Rp 15.000</p>
                        <span className="inline-block mt-2 text-[10px] text-gray-500">Pesan WA →</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-200/80 flex items-center justify-between text-xs text-gray-600">
                    <span>Ongkir COD Tersedia</span>
                    <span className="text-emerald-700 font-medium">Buka 08:00 - 21:00</span>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 text-center border-t border-gray-100">
                  <Link
                    href="/signin"
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    👉 Klik di sini untuk mencoba mengedit toko ini di Demo
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Pillars Section */}
      <section className="py-16 bg-gray-50/60 border-b border-gray-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              Dibuat Khusus Mengatasi Keluhan Pedagang UMKM
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              Tidak perlu membalas chat harga berulang kali, tidak ada komisi per transaksi marketplace yang tinggi.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm space-y-3">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center font-bold">
                <Store className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Katalog & Menu Selalu Online</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Pelanggan bisa melihat daftar menu, foto, harga, dan ketersediaan stok 24 jam tanpa harus tanya satu per satu.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm space-y-3">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center font-bold">
                <MessageCircle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Checkout Terhubung ke WhatsApp</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Begitu pembeli memilih produk, rincian pesanan dan total harga langsung tersusun rapi di pesan WhatsApp penjual.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm space-y-3">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center font-bold">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Kelola Multi-Toko dengan Mudah</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Punya usaha kuliner sekaligus jualan hijab? Kelola semua website tokomu dalam satu akun tanpa ribet gonta-ganti login.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Pricing Plans Section */}
      <LandingPricing />

      {/* Footer */}
      <footer className="border-t border-gray-200/80 bg-gray-50 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© 2026 UMKM SaaS Indonesia · Platform Toko Digital Ramah UMKM</p>
          <div className="flex items-center gap-4">
            <Link href="/signin" className="hover:text-gray-900">Akun Demo</Link>
            <Link href="/websites" className="hover:text-gray-900">Website Saya</Link>
            <Link href="/dashboard" className="hover:text-gray-900">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
