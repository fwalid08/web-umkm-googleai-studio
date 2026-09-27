"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  ExternalLink,
  HelpCircle,
  QrCode,
  ShieldCheck,
  Sparkles,
  Store,
  Users,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n";
import { Tier } from "@/types";

interface PlanConfig {
  id: Tier;
  name: string;
  tagline: string;
  audience: string;
  priceMonthly: number;
  priceYearlyMonthly: number;
  highlight?: boolean;
  websites: number | "unlimited";
  products: string;
  templates: string;
  customDomain: boolean;
  analytics: boolean;
  teamSeats: number;
  features: string[];
}

const PLANS: PlanConfig[] = [
  {
    id: "free",
    name: "Gratis",
    tagline: "Gratis Selamanya",
    audience: "Untuk pedagang baru yang ingin mulai online tanpa risiko",
    priceMonthly: 0,
    priceYearlyMonthly: 0,
    websites: 1,
    products: "Maksimal 5 Produk",
    templates: "3 Template (Kuliner, Fashion, Retail)",
    customDomain: false,
    analytics: false,
    teamSeats: 1,
    features: [
      "1 Website Toko Online",
      "Katalog hingga 5 produk",
      "3 Template siap pakai",
      "Subdomain gratis (.umkm.id)",
      "Checkout langsung ke WhatsApp",
      "Dashboard ringkasan pesanan",
      "0% Biaya komisi transaksi",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    tagline: "Paling Populer",
    audience: "Untuk pemilik usaha yang ingin jualan mandiri & profesional",
    priceMonthly: 99000,
    priceYearlyMonthly: 79000,
    highlight: true,
    websites: 3,
    products: "Tanpa Batas (Unlimited)",
    templates: "Semua 5 Template Premium",
    customDomain: true,
    analytics: false,
    teamSeats: 1,
    features: [
      "Hingga 3 Website Toko Online",
      "Katalog produk tanpa batas",
      "Semua 5 template bisnis",
      "Gunakan custom domain (.com / .id)",
      "Export pesanan ke file CSV / Excel",
      "Tombol pesan WhatsApp mengambang",
      "Bantuan CS via WhatsApp",
      "0% Biaya komisi transaksi",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    tagline: "Bisnis Berkembang",
    audience: "Untuk usaha dengan banyak varian, tim staf, atau cabang",
    priceMonthly: 249000,
    priceYearlyMonthly: 199000,
    websites: 10,
    products: "Tanpa Batas (Unlimited)",
    templates: "Semua 5 Template Premium",
    customDomain: true,
    analytics: true,
    teamSeats: 3,
    features: [
      "Hingga 10 Website Toko Online",
      "Semua fitur paket Starter",
      "Analisis omset & produk terlaris",
      "3 Akses akun staf / karyawan",
      "Template chat follow-up otomatis",
      "Badge verifikasi toko resmi",
      "Prioritas bantuan CS WhatsApp",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Skala Besar",
    audience: "Untuk jaringan waralaba, distributor, atau multi-outlet",
    priceMonthly: 599000,
    priceYearlyMonthly: 479000,
    websites: "unlimited",
    products: "Tanpa Batas (Unlimited)",
    templates: "Semua 5 Template + Custom",
    customDomain: true,
    analytics: true,
    teamSeats: 999,
    features: [
      "Website toko tanpa batas (Unlimited)",
      "Semua fitur paket Growth",
      "Manajemen stok multi-cabang",
      "Akses tim & staf tanpa batas",
      "Integrasi otomatis Payment Gateway",
      "Akses API & Webhook pesanan",
      "Dedicated Account Manager",
    ],
  },
];

const FAQS = [
  {
    q: "Apakah ada potongan biaya atau komisi dari setiap produk yang terjual?",
    a: "Sama sekali tidak ada (0% komisi). Seluruh keuntungan penjualan 100% masuk ke kantong Anda tanpa potongan platform sedikitpun.",
  },
  {
    q: "Bagaimana cara pembeli membayar pesanan mereka?",
    a: "Pelanggan langsung checkout dan mengirimkan rincian pesanan ke WhatsApp Anda. Anda dapat menerima pembayaran langsung via transfer bank (BCA, Mandiri, BRI), QRIS, maupun bayar di tempat (COD).",
  },
  {
    q: "Apakah saya bisa memakai alamat website sendiri seperti www.tokosaya.com?",
    a: "Bisa! Mulai dari paket Starter ke atas, Anda bisa menghubungkan domain pribadi (.com, .id, .co.id, dll). Sistem kami menyediakan panduan DNS instan dan otomatis terverifikasi.",
  },
  {
    q: "Bisakah saya mengupgrade atau membatalkan paket sewaktu-waktu?",
    a: "Tentu saja. Anda dapat berpindah paket atau membatalkan langganan kapan saja tanpa ikatan kontrak dan tanpa penalti.",
  },
];

export function BillingPanel() {
  const { data: session } = useSession();
  const router = useRouter();
  const { t } = useLang();
  const user = session?.user as unknown as {
    tier?: Tier;
  } | undefined;

  const [activeTier, setActiveTier] = useState<Tier>("free");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  const [slot, setSlot] = useState<{ count: number; max: number } | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showMatrix, setShowMatrix] = useState(false);

  // Upgrade Modal State
  const [modalPlan, setModalPlan] = useState<PlanConfig | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeMsg, setUpgradeMsg] = useState<{ success: boolean; text: string } | null>(null);

  useEffect(() => {
    if (user?.tier) {
      setActiveTier(user.tier);
    }
  }, [user?.tier]);

  useEffect(() => {
    if (!session) return;
    (async () => {
      try {
        const [wRes, pRes] = await Promise.all([
          fetch("/api/websites"),
          fetch("/api/user/plan").catch(() => null),
        ]);
        const wJson = await wRes.json();
        if (wJson.success) {
          setSlot({ count: wJson.data.count, max: wJson.data.max });
        }
        if (pRes && pRes.ok) {
          const pJson = await pRes.json();
          if (pJson.success && pJson.data?.tier) {
            setActiveTier(pJson.data.tier);
          }
        }
      } catch {
        // ignore
      }
    })();
  }, [session]);

  const handleOpenUpgrade = (plan: PlanConfig) => {
    setModalPlan(plan);
    setUpgradeMsg(null);
  };

  const handleConfirmUpgrade = async () => {
    if (!modalPlan) return;
    setIsUpgrading(true);
    setUpgradeMsg(null);
    try {
      // Downgrade ke Gratis tetap via /api/user/plan (tanpa pembayaran).
      if (modalPlan.id === "free") {
        const res = await fetch("/api/user/plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tier: modalPlan.id,
            billing_cycle: billingCycle,
          }),
        });
        const json = await res.json();
        if (json.success) {
          setActiveTier(modalPlan.id);
          setUpgradeMsg({
            success: true,
            text: `Paket berhasil diubah ke ${modalPlan.name}.`,
          });
          // Refresh slot limit
          const wRes = await fetch("/api/websites");
          const wJson = await wRes.json();
          if (wJson.success) setSlot({ count: wJson.data.count, max: wJson.data.max });
          setTimeout(() => {
            setModalPlan(null);
            setUpgradeMsg(null);
          }, 1800);
        } else {
          setUpgradeMsg({
            success: false,
            text: json.error || "Gagal memperbarui paket",
          });
        }
        return;
      }

      // Paket berbayar via Midtrans checkout.
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: modalPlan.id,
          billing_cycle: billingCycle,
        }),
      });
      const json = await res.json();
      if (json.success) {
        const redirectUrl = json.data?.redirect_url as string | undefined;
        const isMock = json.data?.mock === true;
        if (isMock) {
          setActiveTier(modalPlan.id);
          setUpgradeMsg({
            success: true,
            text: `Selamat! Toko Anda kini aktif di Paket ${modalPlan.name}.`,
          });
          // Refresh slot limit (fallback dipertahankan bila fetch gagal)
          try {
            const wRes = await fetch("/api/websites");
            const wJson = await wRes.json();
            if (wJson.success) setSlot({ count: wJson.data.count, max: wJson.data.max });
          } catch {
            // ignore — halaman success fetch ulang via /api/billing/status
          }
          // N4: mock sukses → halaman ringkasan statis (tanpa Snap/payment baru).
          router.push(
            `/billing/success?tier=${encodeURIComponent(modalPlan.id)}&cycle=${encodeURIComponent(billingCycle)}`
          );
        } else if (redirectUrl) {
          setUpgradeMsg({
            success: true,
            text: "Membuka halaman pembayaran Midtrans...",
          });
          window.open(redirectUrl, "_blank", "noopener,noreferrer");
        } else {
          setUpgradeMsg({
            success: false,
            text: "Gagal mendapatkan link pembayaran",
          });
        }
      } else {
        setUpgradeMsg({
          success: false,
          text: json.error || "Gagal membuat pembayaran",
        });
      }
    } catch {
      setUpgradeMsg({
        success: false,
        text: "Terjadi gangguan koneksi",
      });
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200/80 pb-6 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight dark:text-white">
              {t("billing.title")}
            </h1>
            <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-700">
              Paket Aktif: {activeTier.toUpperCase()}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1 dark:text-slate-400">
            Pilih paket yang paling pas untuk skala usaha Anda. Ubah atau batalkan kapan saja.
          </p>
        </div>

        {/* Billing Cycle Switcher */}
        <div className="flex items-center self-start sm:self-auto bg-gray-100/90 p-1 rounded-xl border border-gray-200 dark:bg-slate-800 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setBillingCycle("monthly")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              billingCycle === "monthly"
                ? "bg-white text-gray-900 shadow-sm dark:bg-slate-700 dark:text-white"
                : "text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100"
            }`}
          >
            Bulanan
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("yearly")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              billingCycle === "yearly"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100"
            }`}
          >
            <span>Tahunan</span>
            <span
              className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                billingCycle === "yearly"
                  ? "bg-emerald-700 text-emerald-100"
                  : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200"
              }`}
            >
              Hemat 20%
            </span>
          </button>
        </div>
      </div>

      {/* Website Capacity Alert Card */}
      {slot && (
        <Card className="border-emerald-200/90 bg-emerald-50/40 dark:border-emerald-800/50 dark:bg-emerald-900/10">
          <CardContent className="pt-4 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-emerald-900 flex items-center gap-1.5 dark:text-emerald-200">
                <Store className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <span>Kapasitas Toko pada Paket Ini</span>
              </p>
              <p className="text-xs text-emerald-800 dark:text-emerald-300">
                Anda telah menggunakan <strong className="font-bold">{slot.count}</strong> dari{" "}
                <strong className="font-bold">{slot.max}</strong> kuota website yang tersedia di paket {activeTier}.
              </p>
              <div className="h-2 w-56 bg-emerald-200/80 rounded-full overflow-hidden mt-1.5 dark:bg-emerald-900/60">
                <div
                  className="h-full bg-emerald-600 transition-all"
                  style={{
                    width: `${Math.min(100, (slot.count / Math.max(slot.max, 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/websites"
                className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 underline underline-offset-4 dark:text-emerald-300 dark:hover:text-emerald-200"
              >
                Kelola Website & Toko Saya →
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 4 Pricing Cards Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
        {PLANS.map((plan) => {
          const isCurrent = activeTier.toLowerCase() === plan.id;
          const displayPrice =
            billingCycle === "yearly" ? plan.priceYearlyMonthly : plan.priceMonthly;

          return (
            <div
              key={plan.id}
              className={`rounded-2xl bg-white transition-all flex flex-col justify-between dark:bg-slate-900 ${
                plan.highlight
                  ? "border-2 border-emerald-600 shadow-lg relative ring-4 ring-emerald-50 dark:ring-emerald-900/30"
                  : "border border-gray-200/90 hover:border-gray-300 shadow-sm dark:border-slate-800 dark:hover:border-slate-700"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                    Paling Favorit
                  </span>
                </div>
              )}

              <div className="p-5 flex-1 flex flex-col">
                {/* Plan Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                  {isCurrent && (
                    <span className="text-xs font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full dark:bg-slate-800 dark:text-slate-300">
                      Paket Anda
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-500 mt-1 min-h-[32px] dark:text-slate-400">{plan.audience}</p>

                {/* Price */}
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-gray-900 tracking-tight font-mono tabular-nums dark:text-white">
                      {displayPrice === 0 ? "Rp 0" : `Rp ${displayPrice.toLocaleString("id-ID")}`}
                    </span>
                    <span className="text-xs text-gray-500 font-medium dark:text-slate-400">/bulan</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 dark:text-slate-500">
                    {displayPrice === 0
                      ? "Gratis selamanya"
                      : billingCycle === "yearly"
                      ? "Ditagih tahunan (hemat 20%)"
                      : "Ditagih setiap bulan"}
                  </p>
                </div>

                {/* Quick Limits summary */}
                <div className="my-4 py-2.5 px-3 bg-gray-50 rounded-xl space-y-1 text-xs text-gray-700 border border-gray-100 dark:bg-slate-800/60 dark:border-slate-800 dark:text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-slate-400">Kapasitas Toko:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {plan.websites === "unlimited" ? "Unlimited" : `${plan.websites} Website`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-slate-400">Domain Sendiri:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {plan.customDomain ? "Ya (.com/.id)" : "Subdomain"}
                    </span>
                  </div>
                </div>

                {/* Features List */}
                <ul className="space-y-2.5 text-xs text-gray-600 flex-1 dark:text-slate-300">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 dark:text-emerald-400" />
                      <span className="leading-snug">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div className="p-5 pt-0">
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 cursor-default flex items-center justify-center gap-1.5 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Paket Anda Sedang Aktif</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleOpenUpgrade(plan)}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-sm ${
                      plan.highlight
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200"
                        : "bg-gray-900 hover:bg-gray-800 text-white dark:bg-slate-200 dark:hover:bg-white dark:text-slate-900"
                    }`}
                  >
                    {plan.id === "free" ? "Kembali ke Gratis" : `Pilih Paket ${plan.name}`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature Comparison Matrix Accordion/Toggle */}
      <div className="border border-gray-200 rounded-2xl bg-white overflow-hidden shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <button
          type="button"
          onClick={() => setShowMatrix(!showMatrix)}
          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors dark:hover:bg-slate-800"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold dark:bg-emerald-900/40 dark:text-emerald-300">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{t("billing.compareTitle")}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Bandingkan spesifikasi detail per paket secara transparan
              </p>
            </div>
          </div>
          {showMatrix ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {showMatrix && (
          <div className="p-6 pt-2 border-t border-gray-100 overflow-x-auto dark:border-slate-800">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="py-3 font-semibold text-gray-700 dark:text-slate-300">Fitur & Layanan</th>
                  <th className="py-3 font-semibold text-center text-gray-700 dark:text-slate-300">Gratis</th>
                  <th className="py-3 font-semibold text-center text-emerald-700 dark:text-emerald-400">Starter</th>
                  <th className="py-3 font-semibold text-center text-gray-700 dark:text-slate-300">Growth</th>
                  <th className="py-3 font-semibold text-center text-gray-700 dark:text-slate-300">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {/* Section 1: Kapasitas */}
                <tr className="bg-gray-50/70 font-bold text-gray-700 dark:bg-slate-800/60 dark:text-slate-200">
                  <td colSpan={5} className="py-2.5 px-1">
                    1. Kapasitas & Toko
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 text-gray-600 dark:text-slate-300">Jumlah Website Toko</td>
                  <td className="py-2.5 text-center font-mono font-medium">1 Website</td>
                  <td className="py-2.5 text-center font-mono font-bold text-emerald-700 dark:text-emerald-400">3 Website</td>
                  <td className="py-2.5 text-center font-mono font-medium">10 Website</td>
                  <td className="py-2.5 text-center font-mono font-medium">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-gray-600 dark:text-slate-300">Batas Jumlah Produk Katalog</td>
                  <td className="py-2.5 text-center font-mono">5 Produk</td>
                  <td className="py-2.5 text-center font-mono font-bold text-emerald-700 dark:text-emerald-400">Unlimited</td>
                  <td className="py-2.5 text-center font-mono">Unlimited</td>
                  <td className="py-2.5 text-center font-mono">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-gray-600 dark:text-slate-300">Pilihan Template Siap Pakai</td>
                  <td className="py-2.5 text-center">3 Template</td>
                  <td className="py-2.5 text-center font-bold text-emerald-700 dark:text-emerald-400">Semua 5 Template</td>
                  <td className="py-2.5 text-center">Semua 5 Template</td>
                  <td className="py-2.5 text-center">Template Custom</td>
                </tr>

                {/* Section 2: Domain & Branding */}
                <tr className="bg-gray-50/70 font-bold text-gray-700 dark:bg-slate-800/60 dark:text-slate-200">
                  <td colSpan={5} className="py-2.5 px-1">
                    2. Domain & Tampilan
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 text-gray-600 dark:text-slate-300">Subdomain Gratis (.umkm.id)</td>
                  <td className="py-2.5 text-center text-emerald-600 dark:text-emerald-400">✓</td>
                  <td className="py-2.5 text-center text-emerald-600 dark:text-emerald-400">✓</td>
                  <td className="py-2.5 text-center text-emerald-600 dark:text-emerald-400">✓</td>
                  <td className="py-2.5 text-center text-emerald-600 dark:text-emerald-400">✓</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-gray-600 dark:text-slate-300">Dukungan Custom Domain (.com / .id)</td>
                  <td className="py-2.5 text-center text-gray-300 dark:text-slate-600">—</td>
                  <td className="py-2.5 text-center font-bold text-emerald-700 dark:text-emerald-400">✓ Termasuk</td>
                  <td className="py-2.5 text-center text-emerald-600 dark:text-emerald-400">✓ Termasuk</td>
                  <td className="py-2.5 text-center text-emerald-600 dark:text-emerald-400">✓ Termasuk</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-gray-600 dark:text-slate-300">Sertifikat SSL / HTTPS Otomatis</td>
                  <td className="py-2.5 text-center text-emerald-600 dark:text-emerald-400">✓</td>
                  <td className="py-2.5 text-center text-emerald-600 dark:text-emerald-400">✓</td>
                  <td className="py-2.5 text-center text-emerald-600 dark:text-emerald-400">✓</td>
                  <td className="py-2.5 text-center text-emerald-600 dark:text-emerald-400">✓</td>
                </tr>

                {/* Section 3: Pesanan & Penjualan */}
                <tr className="bg-gray-50/70 font-bold text-gray-700 dark:bg-slate-800/60 dark:text-slate-200">
                  <td colSpan={5} className="py-2.5 px-1">
                    3. Pesanan & WhatsApp
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 text-gray-600 dark:text-slate-300">Checkout Terhubung ke WhatsApp</td>
                  <td className="py-2.5 text-center text-emerald-600 dark:text-emerald-400">✓</td>
                  <td className="py-2.5 text-center text-emerald-600 dark:text-emerald-400">✓</td>
                  <td className="py-2.5 text-center text-emerald-600 dark:text-emerald-400">✓</td>
                  <td className="py-2.5 text-center text-emerald-600 dark:text-emerald-400">✓</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-gray-600 dark:text-slate-300">Biaya Komisi Transaksi</td>
                  <td className="py-2.5 text-center font-bold text-emerald-700 dark:text-emerald-400">0%</td>
                  <td className="py-2.5 text-center font-bold text-emerald-700 dark:text-emerald-400">0%</td>
                  <td className="py-2.5 text-center font-bold text-emerald-700 dark:text-emerald-400">0%</td>
                  <td className="py-2.5 text-center font-bold text-emerald-700 dark:text-emerald-400">0%</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-gray-600 dark:text-slate-300">Export Laporan Penjualan (CSV/Excel)</td>
                  <td className="py-2.5 text-center text-gray-300 dark:text-slate-600">—</td>
                  <td className="py-2.5 text-center font-bold text-emerald-700 dark:text-emerald-400">✓ Unlimited</td>
                  <td className="py-2.5 text-center text-emerald-600 dark:text-emerald-400">✓ Unlimited</td>
                  <td className="py-2.5 text-center text-emerald-600 dark:text-emerald-400">✓ Unlimited</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-gray-600 dark:text-slate-300">Dashboard Manajemen Status Pesanan</td>
                  <td className="py-2.5 text-center text-emerald-600 dark:text-emerald-400">✓</td>
                  <td className="py-2.5 text-center text-emerald-600 dark:text-emerald-400">✓</td>
                  <td className="py-2.5 text-center text-emerald-600 dark:text-emerald-400">✓</td>
                  <td className="py-2.5 text-center text-emerald-600 dark:text-emerald-400">✓</td>
                </tr>

                {/* Section 4: Fitur Lanjutan */}
                <tr className="bg-gray-50/70 font-bold text-gray-700 dark:bg-slate-800/60 dark:text-slate-200">
                  <td colSpan={5} className="py-2.5 px-1">
                    4. Fitur Lanjutan & Dukungan
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 text-gray-600 dark:text-slate-300">Analytics Omset & Produk Terlaris</td>
                  <td className="py-2.5 text-center text-gray-300 dark:text-slate-600">—</td>
                  <td className="py-2.5 text-center text-gray-300 dark:text-slate-600">—</td>
                  <td className="py-2.5 text-center font-bold text-emerald-700 dark:text-emerald-400">✓ Lengkap</td>
                  <td className="py-2.5 text-center text-emerald-600 dark:text-emerald-400">✓ Lengkap</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-gray-600 dark:text-slate-300">Akun Tim / Staf Pengelola</td>
                  <td className="py-2.5 text-center font-mono">1 Akun</td>
                  <td className="py-2.5 text-center font-mono">1 Akun</td>
                  <td className="py-2.5 text-center font-mono font-bold text-emerald-700 dark:text-emerald-400">3 Akun</td>
                  <td className="py-2.5 text-center font-mono">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-gray-600 dark:text-slate-300">Dukungan Customer Service</td>
                  <td className="py-2.5 text-center">Standar</td>
                  <td className="py-2.5 text-center font-bold text-emerald-700 dark:text-emerald-400">WhatsApp CS</td>
                  <td className="py-2.5 text-center text-emerald-700 dark:text-emerald-400">Prioritas &lt;30m</td>
                  <td className="py-2.5 text-center text-emerald-700 dark:text-emerald-400">Dedicated Manager</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Trust & Guarantee Banner */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/90 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 dark:from-emerald-900/20 dark:via-teal-900/10 dark:to-emerald-900/20 dark:border-emerald-800/50">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-gray-900 dark:text-white">
              {t("billing.guaranteeTitle")}
            </h4>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-xl dark:text-slate-300">
              {t("billing.guaranteeDesc")} Dukungan pembayaran lokal via QRIS, GoPay, OVO, ShopeePay,
              dan Virtual Account bank nasional.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <span className="text-xs font-semibold bg-white border border-emerald-200 px-3 py-1.5 rounded-lg text-emerald-900 shadow-2xs dark:bg-slate-800 dark:border-emerald-800 dark:text-emerald-200">
            0% Komisi Transaksi
          </span>
          <span className="text-xs font-semibold bg-white border border-emerald-200 px-3 py-1.5 rounded-lg text-emerald-900 shadow-2xs dark:bg-slate-800 dark:border-emerald-800 dark:text-emerald-200">
            Gratis Selamanya
          </span>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="space-y-4">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t("billing.faqTitle")}</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Segala hal yang perlu diketahui tentang berlangganan dan pembayaran toko digital Anda.
          </p>
        </div>

        <div className="divide-y divide-gray-200 border border-gray-200 rounded-2xl bg-white overflow-hidden shadow-2xs dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
          {FAQS.map((faq, idx) => (
            <div key={idx} className="transition-colors">
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors dark:hover:bg-slate-800"
              >
                <span className="text-xs sm:text-sm font-semibold text-gray-900 flex items-center gap-2 dark:text-white">
                  <HelpCircle className="w-4 h-4 text-emerald-600 shrink-0 dark:text-emerald-400" />
                  {faq.q}
                </span>
                {openFaq === idx ? (
                  <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                )}
              </button>
              {openFaq === idx && (
                <div className="px-6 pb-4 pt-1 text-xs sm:text-sm text-gray-600 leading-relaxed bg-gray-50/50 dark:bg-slate-800/50 dark:text-slate-300">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade / Confirmation Modal */}
      {modalPlan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 dark:bg-slate-900 dark:border dark:border-slate-700">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold dark:bg-emerald-900/40 dark:text-emerald-300">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Aktivasi Paket {modalPlan.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalPlan(null)}
                className="text-gray-400 hover:text-gray-600 text-sm font-semibold dark:hover:text-slate-200"
                aria-label="Tutup"
              >
                ✕
              </button>
            </div>

            {upgradeMsg && (
              <div
                role="alert"
                className={`p-3 rounded-xl text-xs font-semibold ${
                  upgradeMsg.success
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800"
                    : "bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800"
                }`}
              >
                {upgradeMsg.text}
              </div>
            )}

            <div className="bg-gray-50 p-4 rounded-xl space-y-2 text-xs text-gray-700 border border-gray-100 dark:bg-slate-800/60 dark:border-slate-800 dark:text-slate-300">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-slate-400">Paket Dipilih:</span>
                <span className="font-bold text-gray-900 dark:text-white">{modalPlan.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-slate-400">Siklus Pembayaran:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {billingCycle === "yearly" ? "Tahunan (Hemat 20%)" : "Bulanan"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-slate-400">Biaya:</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono text-sm">
                  {billingCycle === "yearly"
                    ? `Rp ${(modalPlan.priceYearlyMonthly * 12).toLocaleString("id-ID")} / tahun`
                    : `Rp ${modalPlan.priceMonthly.toLocaleString("id-ID")} / bulan`}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-gray-200/80 dark:border-slate-700">
                <span className="text-gray-500 dark:text-slate-400">Kapasitas Baru:</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {modalPlan.websites === "unlimited"
                    ? "Unlimited Website"
                    : `${modalPlan.websites} Website Toko`}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-700 dark:text-slate-300">Metode Pembayaran Tersedia:</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-slate-300">
                <div className="p-2 border rounded-lg bg-white flex items-center gap-1.5 font-medium dark:bg-slate-800 dark:border-slate-700">
                  <QrCode className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>QRIS Semua E-Wallet</span>
                </div>
                <div className="p-2 border rounded-lg bg-white flex items-center gap-1.5 font-medium dark:bg-slate-800 dark:border-slate-700">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Virtual Account BCA/BRI</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalPlan(null)}
                disabled={isUpgrading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmUpgrade}
                disabled={isUpgrading}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                {isUpgrading ? (
                  <span>Mengaktifkan...</span>
                ) : (
                  <span>Konfirmasi & Aktifkan Paket</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
