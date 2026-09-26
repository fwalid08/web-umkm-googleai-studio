import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTenantSite } from "@/lib/builder/public";
import { PublicWebsite } from "@/components/website/renderer";
import { rootHost, tenantDisplay } from "@/lib/urls";
import { LandingPricing } from "@/components/pricing/landing-pricing";
import { InteractiveStorePreview } from "@/components/website/interactive-preview";
import { LandingFAQ } from "@/components/website/landing-faq";
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
  TrendingUp,
  Percent,
  Layers,
  ChevronRight,
  ExternalLink,
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
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg sm:text-xl text-gray-900 tracking-tight">UMKM SaaS</span>
                <span className="hidden sm:inline-block text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Indonesia
                </span>
              </div>
              <span className="hidden sm:block text-[11px] text-gray-500 font-medium">
                Solusi Website Toko Digital Ramah UMKM
              </span>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-600">
            <a href="#fitur" className="hover:text-emerald-700 transition-colors">
              Fitur Toko
            </a>
            <a href="#template" className="hover:text-emerald-700 transition-colors">
              Pilihan Konsep
            </a>
            <a href="#pricing" className="hover:text-emerald-700 transition-colors">
              Paket Harga
            </a>
            <a href="#faq" className="hover:text-emerald-700 transition-colors">
              Tanya Jawab
            </a>
          </nav>

          {/* Action Links */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/signin"
              className="text-xs sm:text-sm font-bold text-gray-700 hover:text-emerald-700 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              Masuk
            </Link>
            <Link
              href="/signin"
              className="text-xs sm:text-sm font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 px-3.5 py-2.5 rounded-xl transition-all shadow-2xs flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Coba Demo</span>
            </Link>
            <Link
              href="/signup"
              className="hidden sm:inline-flex text-xs sm:text-sm font-bold bg-emerald-600 text-white px-5 py-2.5 rounded-xl hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all"
            >
              Daftar Gratis 14 Hari
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-28 border-b border-gray-100 bg-gradient-to-b from-emerald-50/50 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-14 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span>Solusi Toko Online Nomor #1 untuk UMKM</span>
                <span aria-hidden="true" className="text-emerald-400">·</span>
                <span>0% Komisi</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-gray-900 leading-[1.12]">
                Website Toko Online UMKM,{" "}
                <span className="text-emerald-600 underline decoration-emerald-300 decoration-wavy underline-offset-8">
                  Siap Jual dalam Menit
                </span>
              </h1>

              <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                Tinggalkan repotnya membalas chat tanya harga berulang kali dan potongan komisi marketplace yang mencekik.
                Buat website toko resmi Anda sendiri dengan katalog produk siap pakai, otomatis checkout langsung ke nomor WhatsApp penjual.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2.5 bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold text-sm sm:text-base hover:bg-emerald-700 shadow-lg shadow-emerald-600/25 hover:shadow-xl transition-all"
                >
                  <span>Mulai Toko Gratis 14 Hari</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/signin"
                  className="inline-flex items-center justify-center gap-2.5 bg-white border border-gray-300 px-7 py-4 rounded-2xl font-bold text-sm sm:text-base text-gray-800 hover:bg-gray-50 hover:border-gray-400 transition-all shadow-xs"
                >
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Coba di Akun Demo</span>
                </Link>
              </div>

              {/* Value checks */}
              <div className="pt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-medium text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>Tanpa Kartu Kredit</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>Subdomain Gratis</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>0% Potongan Komisi</span>
                </div>
              </div>
            </div>

            {/* Right Interactive Mockup */}
            <div className="lg:col-span-6" id="template">
              <InteractiveStorePreview />
            </div>
          </div>
        </div>
      </section>

      {/* 6 Key Problem-Solving Features */}
      <section id="fitur" className="py-20 sm:py-28 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-800 tracking-wide mb-3">
              <span>Keunggulan Utama</span>
              <span aria-hidden="true">·</span>
              <span>Didesain untuk Pedagang Indonesia</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-gray-900 leading-tight">
              Semua Fitur yang Anda Butuhkan untuk Berjualan Online
            </h2>
            <p className="text-base sm:text-lg text-gray-600 mt-4 leading-relaxed">
              Tak perlu sewa jasa programmer jutaan rupiah. Kelola katalog, stok, pesanan, dan tampilan tokomu dari satu genggaman.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Feature 1 */}
            <div className="p-7 rounded-3xl bg-gray-50/70 border border-gray-200/80 hover:border-emerald-300 hover:shadow-md transition-all space-y-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center font-bold shadow-2xs">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Checkout Otomatis ke WhatsApp</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Pelanggan memilih menu atau produk, total harga dan rincian pesanan langsung tersusun rapi di pesan WhatsApp tanpa salah catat.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-7 rounded-3xl bg-gray-50/70 border border-gray-200/80 hover:border-emerald-300 hover:shadow-md transition-all space-y-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center font-bold shadow-2xs">
                <Percent className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">0% Komisi & Biaya Tersembunyi</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Uang hasil penjualan 100% milik Anda. Tidak ada potongan 10-15% per transaksi seperti di marketplace besar.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-7 rounded-3xl bg-gray-50/70 border border-gray-200/80 hover:border-emerald-300 hover:shadow-md transition-all space-y-4">
              <div className="w-12 h-12 bg-purple-100 text-purple-700 rounded-2xl flex items-center justify-center font-bold shadow-2xs">
                <Palette className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Desain Toko Terpadu Siap Pakai</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Pilih konsep kuliner, fashion, sembako, kerajinan, atau jasa. Edit warna tema, ganti logo, banner hero, dan teks dengan mudah.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-7 rounded-3xl bg-gray-50/70 border border-gray-200/80 hover:border-emerald-300 hover:shadow-md transition-all space-y-4">
              <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center font-bold shadow-2xs">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Domain Sendiri & Subdomain Cepat</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Gunakan domain profesional (.com, .id) atau nikmati subdomain gratis selamanya (.umkm.id) lengkap dengan sertifikat SSL aman.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-7 rounded-3xl bg-gray-50/70 border border-gray-200/80 hover:border-emerald-300 hover:shadow-md transition-all space-y-4">
              <div className="w-12 h-12 bg-rose-100 text-rose-700 rounded-2xl flex items-center justify-center font-bold shadow-2xs">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Kelola Multi-Toko dalam 1 Akun</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Punya usaha kedai kopi sekaligus jualan hijab? Kelola semua website bisnis Anda dalam satu dashboard tanpa repot login ulang.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-7 rounded-3xl bg-gray-50/70 border border-gray-200/80 hover:border-emerald-300 hover:shadow-md transition-all space-y-4">
              <div className="w-12 h-12 bg-teal-100 text-teal-700 rounded-2xl flex items-center justify-center font-bold shadow-2xs">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Manajemen Pesanan & Rekap CSV</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Pantau pesanan baru, barang dikirim, hingga selesai. Hubungi pembeli via WhatsApp langsung dan unduh pembukuan dalam format Excel/CSV.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Merchant Stories */}
      <section className="py-20 sm:py-24 bg-gray-50/60 border-b border-gray-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-800 tracking-wide mb-2">
              <Star className="w-4 h-4 fill-emerald-600 text-emerald-600" />
              <span>Kisah Sukses Merchant</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900">
              Dipercaya oleh Ribuan Pelaku Usaha UMKM
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              Cerita nyata para pemilik usaha yang menaikkan omset dan merapikan pesanan toko mereka.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-3xl border border-gray-200/90 shadow-sm space-y-4">
              <div className="flex items-center gap-1 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-gray-700 leading-relaxed italic">
                “Dulu pelanggan sering nanya daftar menu dan harga bolak-balik di WhatsApp. Sejak pasang link website toko ini di bio Instagram, pembeli langsung klik dan kirim list pesanan rapi. Waktu saya jadi jauh lebih hemat!”
              </p>
              <div className="pt-2 border-t border-gray-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm">
                  BT
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Ibu Toni</p>
                  <p className="text-[11px] text-gray-500">Pemilik Warung Kopi & Kuliner, Bandung</p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white rounded-3xl border border-gray-200/90 shadow-sm space-y-4">
              <div className="flex items-center gap-1 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-gray-700 leading-relaxed italic">
                “Paling suka karena 0% potongan komisi! Jualan gamis dan pashmina untungnya bisa dinikmati utuh tanpa dipotong 12% marketplace. Pelanggan juga merasa toko kami jauh lebih terpercaya dengan domain sendiri.”
              </p>
              <div className="pt-2 border-t border-gray-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-800 font-bold flex items-center justify-center text-sm">
                  SZ
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Siti Zafira</p>
                  <p className="text-[11px] text-gray-500">Owner Zafira Hijab, Solo</p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white rounded-3xl border border-gray-200/90 shadow-sm space-y-4">
              <div className="flex items-center gap-1 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-gray-700 leading-relaxed italic">
                “Fitur multi-tokonya juara. Saya punya grosir sembako dan pangkas rambut pria. Cukup 1 dashboard, saya bisa monitor semua orderan masuk tanpa bingung ganti password atau akun.”
              </p>
              <div className="pt-2 border-t border-gray-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-sm">
                  HA
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Hendra Anto</p>
                  <p className="text-[11px] text-gray-500">Pemilik Usaha Ritel & Jasa, Surabaya</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans Section */}
      <LandingPricing />

      {/* FAQ Section */}
      <LandingFAQ />

      {/* Final High-Conversion CTA Banner */}
      <section className="py-20 sm:py-24 bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-900 text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          <span className="text-xs font-bold uppercase tracking-wider bg-white/10 px-3.5 py-1 rounded-full border border-white/20">
            Daftar Sekarang · Gratis 14 Hari
          </span>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Siap Luncurkan Website Toko Online Anda Hari Ini?
          </h2>

          <p className="text-base sm:text-lg text-emerald-100 max-w-2xl mx-auto leading-relaxed">
            Bergabunglah dengan ribuan pelaku usaha yang telah mendigitalkan tokonya. Buka toko dalam hitungan menit dan terima pesanan langsung di WhatsApp.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-emerald-900 px-8 py-4 rounded-2xl font-black text-base hover:bg-emerald-50 shadow-xl transition-all"
            >
              <span>Daftar Toko Gratis 14 Hari</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/signin"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-950/40 border border-emerald-400/40 text-white px-7 py-4 rounded-2xl font-bold text-base hover:bg-emerald-950/60 transition-all"
            >
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span>Coba Demo Instan</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200/80 bg-gray-50 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center shadow-xs">
                  <Store className="w-4 h-4 text-white" />
                </div>
                <span className="font-extrabold text-lg text-gray-900 tracking-tight">UMKM SaaS</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed max-w-sm">
                Platform website toko digital terlengkap & termudah untuk pelaku UMKM di seluruh Indonesia. Terhubung otomatis ke WhatsApp, 0% komisi penjualan.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <p className="font-bold text-gray-900 uppercase tracking-wider text-[11px]">Navigasi</p>
              <ul className="space-y-2 text-gray-600">
                <li><a href="#fitur" className="hover:text-gray-900">Fitur Utama</a></li>
                <li><a href="#template" className="hover:text-gray-900">Pilihan Konsep</a></li>
                <li><a href="#pricing" className="hover:text-gray-900">Paket Harga</a></li>
                <li><a href="#faq" className="hover:text-gray-900">Tanya Jawab</a></li>
              </ul>
            </div>

            <div className="space-y-3 text-xs">
              <p className="font-bold text-gray-900 uppercase tracking-wider text-[11px]">Akun & Bantuan</p>
              <ul className="space-y-2 text-gray-600">
                <li><Link href="/signin" className="hover:text-gray-900">Masuk Akun</Link></li>
                <li><Link href="/signup" className="hover:text-gray-900">Daftar Toko Baru</Link></li>
                <li><Link href="/signin" className="hover:text-gray-900">Akun Demo</Link></li>
                <li><Link href="/dashboard" className="hover:text-gray-900">Panel Toko</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
            <p>© 2026 UMKM SaaS Indonesia · Hak Cipta Dilindungi Undang-Undang</p>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="hover:text-gray-900">Kebijakan Privasi</Link>
              <Link href="/terms" className="hover:text-gray-900">Syarat & Ketentuan</Link>
              <Link href="/signin" className="text-emerald-700 font-semibold hover:underline">Akun Demo</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
