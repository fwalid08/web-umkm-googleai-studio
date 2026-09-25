"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ShieldCheck } from "lucide-react";

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
      features: [
        "Hingga 3 Website Toko Online",
        "Katalog produk tanpa batas",
        "Semua 5 template bisnis",
        "Gunakan domain sendiri (.com/.id)",
        "Export laporan pesanan CSV",
        "Tombol WhatsApp melayang",
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
      features: [
        "Hingga 10 Website Toko Online",
        "Semua fitur paket Starter",
        "Analisis omset & produk laris",
        "3 Akun akses tim / staf",
        "Template follow-up chat otomatis",
        "Badge verifikasi toko resmi",
        "Bantuan CS prioritas",
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
    <section id="pricing" className="py-16 sm:py-24 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-800 tracking-wide mb-2">
            <span>Investasi Terjangkau</span>
            <span aria-hidden="true">·</span>
            <span>0% Komisi Penjualan</span>
            <span aria-hidden="true">·</span>
            <span>Bebas Batalkan Kapan Saja</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 leading-tight">
            Paket Harga Transparan, Dirancang untuk UMKM Indonesia
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mt-3 leading-relaxed">
            Mulai gratis 14 hari tanpa kartu kredit. Semua keuntungan penjualan 100% milik Anda.
          </p>

          {/* Toggle Button */}
          <div className="mt-6 inline-flex items-center bg-gray-100 p-1.5 rounded-xl border border-gray-200">
            <button
              type="button"
              onClick={() => setCycle("monthly")}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
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
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                cycle === "yearly"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span>Bayar Tahunan</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                  cycle === "yearly"
                    ? "bg-emerald-700 text-emerald-100"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                Hemat 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {plans.map((p) => {
            const price = cycle === "yearly" ? p.yearlyMonthly : p.monthly;
            return (
              <div
                key={p.id}
                className={`rounded-2xl bg-white flex flex-col justify-between transition-all ${
                  p.highlight
                    ? "border-2 border-emerald-600 shadow-xl relative ring-4 ring-emerald-50"
                    : "border border-gray-200 shadow-sm hover:border-gray-300"
                }`}
              >
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                      Paling Populer
                    </span>
                  </div>
                )}

                <div className="p-6 flex-1 flex flex-col">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{p.name}</h3>
                    <p className="text-xs text-gray-500 mt-1 min-h-[32px]">{p.audience}</p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-gray-900 tracking-tight font-mono tabular-nums">
                        {price === 0 ? "Rp 0" : `Rp ${price.toLocaleString("id-ID")}`}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">/bulan</span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {price === 0
                        ? "Uji coba gratis 14 hari"
                        : cycle === "yearly"
                        ? "Ditagih tahunan (hemat 20%)"
                        : "Ditagih per bulan"}
                    </p>
                  </div>

                  <ul className="mt-6 space-y-2.5 text-xs text-gray-600 flex-1">
                    {p.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-snug">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-6 pt-0">
                  <Link
                    href={p.ctaHref}
                    className={`w-full py-3 px-4 rounded-xl text-xs font-bold text-center block transition-all shadow-sm ${
                      p.highlight
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-800"
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
        <div className="mt-12 pt-8 border-t border-gray-200/80 grid sm:grid-cols-3 gap-4 text-center text-xs text-gray-600">
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>0% Potongan Komisi Penjualan</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Garansi 14 Hari Uang Kembali</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Dukungan QRIS & Transfer Bank Nasional</span>
          </div>
        </div>
      </div>
    </section>
  );
}
