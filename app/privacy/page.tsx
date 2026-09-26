import Link from "next/link";

export const metadata = {
  title: "Kebijakan Privasi",
  description: "Kebijakan privasi dan pengelolaan data pengguna.",
};

const PASAL = [
  {
    title: "1. Data yang Kami Kumpulkan",
    body: "Kami mengumpulkan data akun (nama, email, nomor kontak), data usaha (nama toko, katalog, pesanan), serta data teknis (log akses dan preferensi) yang diperlukan untuk menjalankan layanan.",
  },
  {
    title: "2. Penggunaan Data",
    body: "Data digunakan untuk menyediakan dan meningkatkan layanan, memproses pembayaran dan langganan, mencegah penipuan, serta menghubungi Anda terkait akun atau pembaruan penting.",
  },
  {
    title: "3. Berbagi Data",
    body: "Kami tidak menjual data pribadi Anda. Data hanya dibagikan kepada penyedia layanan pendukung (misalnya penyedia hosting, pembayaran, dan analitik) sejauh diperlukan untuk operasional layanan.",
  },
  {
    title: "4. Keamanan & Penyimpanan",
    body: "Akses data dibatasi berbasis peran dan kebijakan keamanan basis data. Meskipun kami menerapkan langkah pengamanan yang wajar, tidak ada sistem yang sepenuhnya kebal terhadap risiko.",
  },
  {
    title: "5. Hak Anda",
    body: "Anda dapat meminta akses, perbaikan, atau penghapusan data pribadi melalui pengaturan akun atau menghubungi dukungan. Permintaan akan diproses sesuai ketentuan yang berlaku.",
  },
  {
    title: "6. Hubungi Kami",
    body: "Pertanyaan mengenai privasi dapat disampaikan melalui halaman bantuan atau email dukungan yang tercantum di aplikasi.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Legal</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">
        Kebijakan Privasi
      </h1>
      <p className="mt-2 text-sm text-gray-500">
        Terakhir diperbarui: September 2026. Halaman ini menjelaskan bagaimana kami mengelola
        data Anda.
      </p>
      <div className="mt-8 space-y-5">
        {PASAL.map((p) => (
          <section key={p.title} className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="text-base font-bold text-gray-900">{p.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-gray-600">{p.body}</p>
          </section>
        ))}
      </div>
      <div className="mt-8 flex gap-4 text-sm">
        <Link href="/terms" className="text-emerald-700 underline font-semibold">
          Syarat &amp; Ketentuan
        </Link>
        <Link href="/signup" className="text-gray-600 underline">
          Kembali ke pendaftaran
        </Link>
      </div>
    </main>
  );
}
