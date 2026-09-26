"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Coffee,
  Shirt,
  ShoppingBag,
  Sparkles,
  Scissors,
  ExternalLink,
  MessageCircle,
  Check,
  ShieldCheck,
  Clock,
} from "lucide-react";

interface StoreDemo {
  id: string;
  name: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  subdomain: string;
  tagline: string;
  bannerGradient: string;
  badgeText: string;
  hours: string;
  products: Array<{
    name: string;
    price: number;
    tag: string;
    desc: string;
  }>;
}

const DEMO_STORES: StoreDemo[] = [
  {
    id: "kuliner",
    name: "Warung Kopi Bu Toni",
    category: "Kuliner & Kopi",
    icon: Coffee,
    subdomain: "kopibutoni",
    tagline: "Biji robusta lokal seduh istimewa & camilan hangat sejak 2018",
    bannerGradient: "from-amber-600 via-orange-600 to-amber-700",
    badgeText: "Buka Sekarang",
    hours: "08:00 - 21:00 WIB",
    products: [
      { name: "Es Kopi Susu Gula Aren", price: 18000, tag: "Terlaris", desc: "Espresso robusta mantap + gula aren asli" },
      { name: "Roti Bakar Keju Cokelat", price: 15000, tag: "Favorit", desc: "Roti tebal porsi jumbo mentega gurih" },
      { name: "Pisang Goreng Crispy", price: 12000, tag: "Camilan", desc: "Taburan keju parut & susu kental manis" },
      { name: "Kopi Hitam Tubruk Robusta", price: 10000, tag: "Klasik", desc: "Seduh tubruk tradisional tanpa ampas kasar" },
    ],
  },
  {
    id: "fashion",
    name: "Zafira Hijab & Modest",
    category: "Fashion Muslim",
    icon: Shirt,
    subdomain: "zafirahijab",
    tagline: "Busana muslimah anggun, bahan premium adem & jahitan butik",
    bannerGradient: "from-rose-600 via-pink-600 to-purple-600",
    badgeText: "Koleksi Terbaru",
    hours: "Pengiriman Setiap Hari",
    products: [
      { name: "Pashmina Silk Premium", price: 45000, tag: "Best Seller", desc: "Bahan flowy tidak gerah, finishing jahit tepi" },
      { name: "Gamis Crinkle Airflow", price: 135000, tag: "New Season", desc: "Model busui-friendly, jatuh elegan & adem" },
      { name: "Khimar Syar'i 2 Layer", price: 78000, tag: "Populer", desc: "Pet antem nyaman tidak mudah bergeser" },
      { name: "Inner Ciput Anti-Pusing", price: 15000, tag: "Pelengkap", desc: "Rajut spandek lembut sirkulasi udara baik" },
    ],
  },
  {
    id: "ritel",
    name: "Toko Sembako Berkah",
    category: "Ritel & Sembako",
    icon: ShoppingBag,
    subdomain: "sembakoberkah",
    tagline: "Kebutuhan dapur lengkap, beras pandan wangi, minyak & telur fresh",
    bannerGradient: "from-emerald-600 via-teal-600 to-green-700",
    badgeText: "Siap Antar ke Rumah",
    hours: "06:30 - 20:00 WIB",
    products: [
      { name: "Beras Pandan Wangi 5kg", price: 72000, tag: "Pokok", desc: "Pulen wangi alami tanpa pemutih sintetis" },
      { name: "Minyak Goreng Refill 2L", price: 34000, tag: "Hemat", desc: "Penyaringan 2 kali warna jernih berkualitas" },
      { name: "Telur Ayam Negeri 1kg", price: 28000, tag: "Segar", desc: "Telur fresh dari peternak lokal pilihan" },
      { name: "Gula Pasir Kristal 1kg", price: 17500, tag: "Manis", desc: "Gula tebu putih bersih standar premium" },
    ],
  },
  {
    id: "kerajinan",
    name: "Rotan Indah Nusantara",
    category: "Kerajinan Tangan",
    icon: Sparkles,
    subdomain: "rotanindah",
    tagline: "Anyaman rotan alami karya pengrajin lokal untuk estetika rumah",
    bannerGradient: "from-amber-800 via-yellow-800 to-stone-700",
    badgeText: "Handmade Asli",
    hours: "Kirim Seluruh Indonesia",
    products: [
      { name: "Keranjang Anyam Serbaguna", price: 65000, tag: "Estetik", desc: "Handle kulit sapi sintetis ramah lingkungan" },
      { name: "Tudung Saji Rotan Vintage", price: 89000, tag: "Karya Seni", desc: "Diameter 40cm melindungi makanan higienis" },
      { name: "Tatakan Piring Placemat (Set 4)", price: 48000, tag: "Meja Makan", desc: "Anyaman halus anti-panas mudah dibersihkan" },
      { name: "Lampu Gantung Bambu Etnik", price: 125000, tag: "Dekorasi", desc: "Pencahayaan hangat untuk kafe atau ruang tamu" },
    ],
  },
  {
    id: "jasa",
    name: "Barbershop Mas Anto",
    category: "Jasa & Servis",
    icon: Scissors,
    subdomain: "barbermasanto",
    tagline: "Potong rambut pria rapi & styling pomade modern harga bersahabat",
    bannerGradient: "from-slate-800 via-zinc-800 to-gray-900",
    badgeText: "Booking WhatsApp",
    hours: "10:00 - 21:00 WIB",
    products: [
      { name: "Gentleman Haircut + Cuci", price: 40000, tag: "Paket Utama", desc: "Konsultasi gaya rambut, potong presisi & cuci rambut" },
      { name: "Cukur Jenggot & Hot Towel", price: 25000, tag: "Relax", desc: "Shaving rapi dengan handuk hangat aromaterapi" },
      { name: "Hair Coloring Basic Black", price: 60000, tag: "Pewarnaan", desc: "Tutup uban alami tahan lama tanpa merusak kulit" },
      { name: "Pomade Waterbased Lokal 100g", price: 50000, tag: "Produk Toko", desc: "Hold kuat wangi maskulin mudah dibilas air" },
    ],
  },
];

export function InteractiveStorePreview() {
  const [activeTab, setActiveTab] = useState<string>("kuliner");
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  const currentStore = DEMO_STORES.find((s) => s.id === activeTab) || DEMO_STORES[0];

  return (
    <div className="w-full">
      {/* Tab Selector Buttons */}
      <div className="flex items-center gap-1.5 p-1.5 bg-gray-100/90 rounded-2xl border border-gray-200/80 overflow-x-auto scrollbar-none mb-4">
        {DEMO_STORES.map((store) => {
          const Icon = store.icon;
          const isActive = store.id === activeTab;
          return (
            <button
              key={store.id}
              onClick={() => {
                setActiveTab(store.id);
                setSelectedProduct(null);
              }}
              type="button"
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-white text-gray-900 shadow-xs border border-gray-200/90"
                  : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-emerald-600" : "text-gray-400"}`} />
              <span>{store.category}</span>
            </button>
          );
        })}
      </div>

      {/* Browser Window Mockup */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden transition-all duration-300">
        {/* Browser Top Chrome */}
        <div className="bg-gray-900 px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-red-500 rounded-full" />
            <span className="w-3 h-3 bg-amber-500 rounded-full" />
            <span className="w-3 h-3 bg-emerald-500 rounded-full" />
          </div>

          <div className="flex items-center gap-2 bg-gray-800/90 text-gray-200 text-xs font-mono px-3.5 py-1.5 rounded-lg border border-gray-700/60 max-w-sm truncate flex-1 justify-center">
            <span className="text-emerald-400 text-[10px]">🔒 https://</span>
            <span className="text-gray-200 font-semibold">{currentStore.subdomain}</span>
            <span className="text-gray-400">.umkm.id</span>
          </div>

          <Link
            href="/signin"
            className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 shrink-0"
          >
            <span>Buka Toko</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        {/* Storefront Content */}
        <div className="p-4 sm:p-6 space-y-4 bg-gray-50/40">
          {/* Store Hero Banner */}
          <div
            className={`bg-gradient-to-r ${currentStore.bannerGradient} text-white p-5 sm:p-6 rounded-2xl shadow-md relative overflow-hidden`}
          >
            <div className="relative z-10 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-xs px-2.5 py-0.5 rounded-full">
                  {currentStore.category}
                </span>
                <span className="text-xs font-medium flex items-center gap-1.5 bg-emerald-950/40 px-2.5 py-0.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{currentStore.badgeText}</span>
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black tracking-tight">{currentStore.name}</h3>
              <p className="text-xs sm:text-sm text-white/90 max-w-lg leading-relaxed">{currentStore.tagline}</p>

              <div className="pt-2 flex items-center gap-4 text-xs text-white/80">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{currentStore.hours}</span>
                </span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>0% Komisi</span>
                </span>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-gray-900 uppercase tracking-wider text-[11px]">
                Katalog Produk & Layanan
              </span>
              <span className="text-emerald-700 font-medium">Klik produk untuk simulasi beli</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentStore.products.map((item, idx) => {
                const isItemActive = selectedProduct === item.name;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedProduct(isItemActive ? null : item.name)}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all bg-white ${
                      isItemActive
                        ? "border-emerald-600 ring-2 ring-emerald-500/20 shadow-sm"
                        : "border-gray-200 hover:border-gray-300 hover:shadow-xs"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-gray-900 line-clamp-1">{item.name}</span>
                          <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                            {item.tag}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">{item.desc}</p>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs font-mono font-extrabold text-emerald-700">
                        Rp {item.price.toLocaleString("id-ID")}
                      </span>

                      <button
                        type="button"
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                          isItemActive
                            ? "bg-emerald-600 text-white"
                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        }`}
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>{isItemActive ? "Siap Kirim WA" : "Pesan via WA"}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Simulated WhatsApp Order Bar Notification if clicked */}
          {selectedProduct && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs flex items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-2 text-emerald-900">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Simulasi: Pembeli memilih <strong>{selectedProduct}</strong>. Format chat WhatsApp terisi otomatis!
                </span>
              </div>
              <Link
                href="/signin"
                className="shrink-0 bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-emerald-700 transition-colors"
              >
                Coba di Demo
              </Link>
            </div>
          )}

          {/* Quick Footer inside preview */}
          <div className="pt-2 border-t border-gray-200/80 flex items-center justify-between text-xs text-gray-500">
            <span>Powered by UMKM SaaS</span>
            <span className="text-emerald-700 font-medium">Bebas komisi per transaksi</span>
          </div>
        </div>

        {/* Bottom CTA footer inside card */}
        <div className="bg-gray-50 p-3.5 text-center border-t border-gray-200/80">
          <Link
            href="/signin"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center gap-1.5"
          >
            <span>Gunakan konsep ini dan ubah logo, foto & harga toko Anda di Akun Demo</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
