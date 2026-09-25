import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTenantSite } from "@/lib/builder/public";
import { PublicWebsite } from "@/components/website/renderer";
import { rootHost, tenantDisplay } from "@/lib/urls";
import { Store, Sparkles, ShoppingBag, BarChart3, Clock, Shield, ArrowRight, CheckCircle2, Star } from "lucide-react";

// Sprint 01 US-04: root "/" ganda — request tenant (subdomain/custom domain)
// render website toko, request root render landing. SEO ikut tenant.
export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenantSite();
  if (tenant.site) {
    return { title: tenant.site.seo.title, description: tenant.site.seo.description };
  }
  return { title: "UMKM SaaS — Website Toko Online dalam Menit", description: "5 template siap pakai untuk UMKM Indonesia. Gratis 14 hari." };
}

export default async function Home() {
  const tenant = await getTenantSite();
  if (tenant.isTenant && !tenant.site) notFound();
  if (tenant.site) return <PublicWebsite site={tenant.site} />;
  return <LandingPage />;
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">UMKM SaaS</span>
            <span className="hidden sm:inline text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full ml-2">Beta</span>
          </div>
          <nav className="flex items-center gap-3">
            <Link href="/signin" className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2">Masuk</Link>
            <Link href="/signup" className="text-sm bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700">Mulai Gratis</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm mb-4">
              <Sparkles className="w-4 h-4" /> Gratis 14 hari, tanpa kartu kredit
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
              Website toko online UMKM <span className="text-green-600">dalam menit</span>
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              5 template siap pakai untuk makanan, fashion, kerajinan, retail & jasa. Order 24/7, dashboard pesanan, subdomain otomatis.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href="/signup" className="inline-flex items-center justify-center gap-2 bg-green-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-green-700">
                Mulai Gratis <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="#templates" className="inline-flex items-center justify-center gap-2 border border-gray-300 px-8 py-3 rounded-xl font-medium hover:bg-gray-50">
                Lihat Template
              </Link>
            </div>
            <div className="mt-6 flex items-center gap-6 text-sm text-gray-500">
              <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-green-600" /> 5 produk max di Free</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-green-600" /> Upgrade Rp99rb</span>
            </div>
          </div>
          <div className="bg-gray-50 rounded-2xl p-6 border">
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="h-10 bg-gray-900 flex items-center gap-1.5 px-3">
                <span className="w-3 h-3 bg-red-400 rounded-full" /><span className="w-3 h-3 bg-yellow-400 rounded-full" /><span className="w-3 h-3 bg-green-400 rounded-full" />
                <span className="ml-3 text-xs text-gray-400">{tenantDisplay("tenant-warung-ibu")}</span>
              </div>
              <div className="p-6 space-y-4">
                <div className="h-32 bg-gradient-to-br from-orange-100 to-amber-50 rounded-xl flex items-center justify-center">
                  <span className="text-3xl">🍽️</span>
                </div>
                <div>
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-100 rounded w-3/4 mt-2" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[1,2,3].map(i=> <div key={i} className="h-20 bg-gray-100 rounded-lg" />)}
                </div>
                <div className="flex gap-2">
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">COD Tersedia</span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Buka 08:00-21:00</span>
                </div>
              </div>
            </div>
            <p className="text-center text-xs text-gray-500 mt-3">Pratinjau template Makanan • Responsive mobile & desktop</p>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="border-y bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500">
          <span>Dipercaya UMKM</span><span className="flex items-center gap-1"><Star className="w-4 h-4 fill-amber-400 text-amber-400" /> 4.8/5</span><span>50+ website dibuat (beta)</span>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-center">Selesaikan 7 masalah UMKM langsung</h2>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {icon: Store, title: "5 Template Profesional", desc: "Makanan, Fashion, Kerajinan, Retail, Layanan — tinggal isi konten"},
            {icon: ShoppingBag, title: "Order Dashboard", desc: "Kurangi 8 langkah manual (DM→WA→catat) jadi 2 langkah"},
            {icon: Clock, title: "Order 24/7 + Auto-response", desc: "Tidak kehilangan pelanggan saat Anda tidur/masak"},
            {icon: BarChart3, title: "Info Otomatis", desc: "Harga, lokasi, jam, COD tampil otomatis kurangi FAQ berulang"},
            {icon: Shield, title: "Subdomain Otomatis", desc: `${tenantDisplay("tenant-xxx")} + opsi custom domain tokoku.com`},
            {icon: Sparkles, title: "Gratis 14 Hari", desc: "Coba penuh, 3 produk di Free, upgrade Rp99rb saat butuh"},
          ].map(f=> (
            <div key={f.title} className="border rounded-xl p-6 bg-white">
              <f.icon className="w-8 h-8 text-green-600" />
              <h3 className="mt-3 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-bold text-center">Harga jujur untuk UMKM</h2>
          <div className="mt-10 grid md:grid-cols-4 gap-6">
            {[
              {name:"Free", price:"Rp0", feats:["3 template","5 produk","Subdomain","Trial 14 hari"]},
              {name:"Starter", price:"Rp99rb", popular:true, feats:["5 template","Produk unlimited","Order dashboard","Auto-info badge"]},
              {name:"Growth", price:"Rp299rb", feats:["Analytics","Auto follow-up","Customer list","2 payment gateway"]},
              {name:"Enterprise", price:"Custom", feats:["Repeat order","API & integrasi","Custom template","Multi-store"]},
            ].map(t=> (
              <div key={t.name} className={`rounded-2xl p-6 ${t.popular ? "bg-white text-gray-900" : "bg-white/5 border border-white/10"}`}>
                {t.popular && <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">Paling Populer</span>}
                <h3 className="mt-3 font-bold text-lg">{t.name}</h3>
                <p className="text-2xl font-bold mt-1">{t.price}<span className="text-sm font-normal opacity-60">/bulan</span></p>
                <ul className="mt-4 space-y-2 text-sm">
                  {t.feats.map(f=> <li key={f} className="flex gap-2"><CheckCircle2 className={`w-4 h-4 ${t.popular ? "text-green-600" : "text-green-400"}`} />{f}</li>)}
                </ul>
                <Link href="/signup" className={`mt-6 block text-center py-2 rounded-lg text-sm font-medium ${t.popular ? "bg-green-600 text-white" : "bg-white text-gray-900"}`}>Mulai</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t py-8 text-center text-sm text-gray-500">
        UMKM SaaS • {rootHost()} • Dibuat untuk UMKM Indonesia • Next.js + Tailwind + Supabase
      </footer>
    </div>
  );
}