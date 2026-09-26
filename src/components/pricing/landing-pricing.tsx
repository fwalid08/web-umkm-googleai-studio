"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ShieldCheck, Sparkles } from "lucide-react";

export function LandingPricing() {
  const [cycle, setCycle] = useState<"monthly" | "yearly">("yearly");

  const plans = [
    {
      id: "free",
      name: "Gratis",
      subtitle: "Uji Coba Toko",
      audience: "Untuk pemula yang baru ingin mencoba jualan online",
      monthly: 0,
      yearlyMonthly: 0,
      highlight: false,
      ctaText: "Coba di Akun Demo",
      ctaHref: "/signin",
      badge: "Gratis Selamanya",
      features: [
        "1 Website Toko Online",
        "Katalog hingga 5 produk",
        "3 Template siap pakai",
        "Subdomain gratis (.umkm.id)",
        "Checkout langsung WhatsApp",
        "0% Biaya komisi transaksi",
      ],
    },
    {
      id: "starter",
      name: "Starter",
      subtitle: "Paling Populer",
      audience: "Untuk pemilik usaha yang butuh toko profesional & domain sendiri",
      monthly: 99000,
      yearlyMonthly: 79000,
      highlight: true,
      ctaText: "Mulai 14 Hari Gratis",
      ctaHref: "/signup",
      badge: "Rekomendasi Utama",
      features: [
        "Hingga 3 Website Toko Online",
        "Katalog produk tanpa batas",
        "Semua 5 template bisnis terpadu",
        "Gunakan domain sendiri (.com/.id)",
        "Export laporan pesanan CSV",
        "Tombol WhatsApp melayang & respon cepat",
        "Bantuan CS via WhatsApp",
        "0% Biaya komisi transaksi",
      ],
    },
    {
      id: "growth",
      name: "Growth",
      subtitle: "Bisnis Berkembang",
      audience: "Untuk usaha dengan banyak varian, cabang, atau tim staf",
      monthly: 249000,
      yearlyMonthly: 199000,
      highlight: false,
      ctaText: "Pilih Paket Growth",
      ctaHref: "/signup",
      badge: "Skala Tumbuh",
      features: [
        "Hingga 10 Website Toko Online",
        "Semua fitur paket Starter",
        "Analisis omset & produk laris",
        "3 Akun akses tim / staf kasir",
        "Template follow-up chat otomatis",
        "Badge verifikasi toko resmi",
        "Bantuan CS prioritas via WhatsApp",
      ],
    },
    {
      id: "enterprise",
      name: "Enterprise",
      subtitle: "Skala Besar",
      audience: "Untuk jaringan waralaba, distributor, atau multi-outlet",
      monthly: 599000,
      yearlyMonthly: 479000,
      highlight: false,
      ctaText: "Hubungi & Mulai",
      ctaHref: "/signup",
      badge: "Lengkap & Custom",
      features: [
        "Website toko tanpa batas",
        "Semua fitur paket Growth",
        "Manajemen stok multi-cabang",
        "Akses tim & staf tanpa batas",
        "Integrasi Payment Gateway QRIS",
        "Dedicated Account Manager",
      ],
    },
  ];

  return (
    <section id="pricing" className="py-20 sm:py-28 bg-gray-50/70 border-t border-b border-gray-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-800 tracking-wide mb-3">
            <span>Investasi Terjangkau</span>
            <span aria-hidden="true">·</span>
            <span>0% Komisi Penjualan</span>
            <span aria-hidden="true">·</span>
            <span>Bebas Batalkan Kapan Saja</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">
            Paket Harga Transparan, Dirancang untuk UMKM Indonesia
          </h2>
          <p className="text-base sm:text-lg text-gray-600 mt-4 leading-relaxed">
            Mulai gratis 14 hari tanpa kartu kredit. Semua keuntungan penjualan 100% milik Anda tanpa potongan sepeser pun.
          </p>

          {/* Toggle Button */}
          <div className="mt-8 inline-flex items-center bg-gray-200/70 p-1.5 rounded-2xl border border-gray-300/80 shadow-2xs">
            <button
              type="button"
              onClick={() => setCycle("monthly")}
              className={`px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                cycle === "monthly"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Bayar Bulanan
            </button>
            <button
              type="button"
              onClick={() => setCycle("yearly")}
              className={`flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                cycle === "yearly"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span>Bayar Tahunan</span>
              <span
                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                  cycle === "yearly"
                    ? "bg-emerald-800 text-emerald-100"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                Hemat 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-6 items-stretch">
          {plans.map((p) => {
            const price = cycle === "yearly" ? p.yearlyMonthly : p.monthly;
            return (
              <div
                key={p.id}
                className={`rounded-3xl bg-white flex flex-col justify-between transition-all duration-200 ${
                  p.highlight
                    ? "border-2 border-emerald-600 shadow-xl shadow-emerald-900/5 relative ring-4 ring-emerald-500/10 lg:-translate-y-2"
                    : "border border-gray-200/90 shadow-sm hover:border-gray-300 hover:shadow-md"
                }`}
              >
                {p.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-emerald-600 text-white text-[11px] font-bold tracking-wide uppercase px-3.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>{p.badge}</span>
                    </span>
                  </div>
                )}

                <div className="p-6 sm:p-7 flex-1 flex flex-col">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-gray-900">{p.name}</h3>
                      {!p.highlight && (
                        <span className="text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          {p.subtitle}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2 min-h-[36px] leading-relaxed">{p.audience}</p>
                  </div>

                  <div className="mt-5 pt-5 border-t border-gray-100">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight font-mono tabular-nums">
                        {price === 0 ? "Rp 0" : `Rp ${price.toLocaleString("id-ID")}`}
                      </span>
                      <span className="text-xs text-gray-500 font-semibold">/bln</span>
                    </div>
                    <p className="text-[11px] font-medium text-gray-500 mt-1">
                      {price === 0
                        ? "Uji coba gratis 14 hari penuh"
                        : cycle === "yearly"
                        ? "Ditagih per tahun (hemat 20%)"
                        : "Ditagih per bulan fleksibel"}
                    </p>
                  </div>

                  <div className="mt-6 pt-5 border-t border-gray-100 space-y-3 flex-1">
                    <p className="text-xs font-bold text-gray-900 uppercase tracking-wider text-[10.5px]">
                      Fitur yang didapatkan:
                    </p>
                    <ul className="space-y-2.5 text-xs text-gray-600">
                      {p.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="leading-snug text-gray-700">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="p-6 sm:p-7 pt-0">
                  <Link
                    href={p.ctaHref}
                    className={`w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-center block transition-all shadow-xs ${
                      p.highlight
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-900"
                    }`}
                  >
                    {p.ctaText}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust markers */}
        <div className="mt-14 pt-8 border-t border-gray-200/80 grid sm:grid-cols-3 gap-6 text-center text-xs text-gray-600">
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold text-gray-800">0% Potongan Komisi Penjualan</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold text-gray-800">Garansi 14 Hari Uang Kembali</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold text-gray-800">Dukungan QRIS & Transfer Bank Nasional</span>
          </div>
        </div>
      </div>
    </section>
  );
}
