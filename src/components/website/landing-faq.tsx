"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const FAQS = [
  {
    q: "Apakah saya butuh keahlian coding atau desain untuk membuat website toko?",
    a: "Sama sekali tidak! Semua template sudah siap pakai. Anda cukup memasukkan nama toko, nomor WhatsApp, dan mengunggah foto serta harga produk. Website langsung aktif dan siap disebarkan ke pelanggan dalam waktu kurang dari 3 menit.",
  },
  {
    q: "Bagaimana cara kerja pesanan masuk ke WhatsApp?",
    a: "Saat pelanggan membuka website toko Anda dan memilih produk, rincian barang, jumlah, dan total harga otomatis terformat rapi dalam satu pesan WhatsApp. Pembeli hanya perlu menekan tombol 'Kirim Pesan', dan chat langsung masuk ke nomor WhatsApp penjual.",
  },
  {
    q: "Bisakah saya menggunakan domain sendiri seperti www.namatoko.com?",
    a: "Bisa! Anda dapat menghubungkan custom domain sendiri (.com, .id, .co.id, .store, dll.) pada paket Starter ke atas. Pengaturannya sangat mudah dengan panduan DNS terpadu di dashboard kami. Jika belum punya domain, Anda tetap mendapatkan subdomain gratis seperti namatoko.umkm.id selamanya.",
  },
  {
    q: "Apakah ada biaya komisi atau potongan dari penjualan saya?",
    a: "Tidak ada (0% komisi)! Berbeda dengan marketplace yang memotong 10% - 15% dari omset penjualan Anda, di UMKM SaaS 100% uang hasil jualan langsung masuk ke rekening pribadi atau e-wallet Anda.",
  },
  {
    q: "Bisakah saya mengelola lebih dari satu toko dalam satu akun?",
    a: "Tentu saja! Fitur Multi-Toko memungkinkan Anda memiliki toko kuliner, fashion, atau jasa sekaligus dalam satu akun dashboard tanpa harus keluar-masuk login. Anda dapat beralih antar website toko dengan 1 klik saja.",
  },
  {
    q: "Bagaimana jika masa uji coba gratis 14 hari saya habis?",
    a: "Anda dapat memilih untuk melanjutkan ke paket langganan murah mulai dari Rp 79.000/bulan untuk tetap menikmati fitur toko tanpa batas. Tidak ada kewajiban kartu kredit di awal dan tidak ada auto-charge tersembunyi.",
  },
];

export function LandingFAQ() {
  return (
    <section id="faq" className="py-20 sm:py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-800 tracking-wide mb-2">
            <HelpCircle className="w-4 h-4 text-emerald-600" />
            <span>Paling Sering Ditanyakan</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
            Pertanyaan Seputar UMKM SaaS
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            Semua yang perlu Anda ketahui sebelum meluncurkan toko digital Anda.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-3">
          {FAQS.map((faq, idx) => (
            <AccordionItem
              key={idx}
              value={`item-${idx}`}
              className="border border-gray-200/90 rounded-2xl px-5 sm:px-6 bg-white shadow-2xs hover:border-gray-300 transition-colors"
            >
              <AccordionTrigger className="text-left font-bold text-gray-900 text-sm sm:text-base py-5 hover:no-underline hover:text-emerald-700">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-xs sm:text-sm text-gray-600 leading-relaxed pb-5 border-t border-gray-100 pt-3">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
