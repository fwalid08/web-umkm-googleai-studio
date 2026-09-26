import Link from "next/link";

export const metadata = {
  title: "Syarat & Ketentuan",
  description: "Syarat dan ketentuan penggunaan layanan.",
};

const PASAL = [
  {
    title: "1. Layanan",
    body: "Kami menyediakan platform pembuatan website dan toko online untuk UMKM, termasuk subdomain gratis, koneksi domain sendiri, dan fitur kelola katalog, pesanan, serta pembayaran.",
  },
  {
    title: "2. Akun Pengguna",
    body: "Anda wajib memberikan data yang benar saat mendaftar, menjaga kerahasiaan kata sandi, dan bertanggung jawab atas seluruh aktivitas yang terjadi melalui akun Anda.",
  },
  {
    title: "3. Paket & Pembayaran",
    body: "Layanan tersedia dalam paket Gratis, Starter, dan Growth. Masa trial 14 hari berlaku untuk akun baru. Biaya berlangganan bersifat prabayar dan tidak dapat dikembalikan kecuali diwajibkan peraturan perundang-undangan.",
  },
  {
    title: "4. Konten & Penggunaan Wajar",
    body: "Dilarang mengunggah konten yang melanggar hukum, menyesatkan, melanggar hak cipta, atau mengandung malware. Kami dapat menangguhkan akun yang menyalahgunakan layanan atau membebani sistem secara tidak wajar.",
  },
  {
    title: "5. Ketersediaan Layanan",
    body: "Kami berupaya menjaga layanan selalu tersedia, namun tidak menjamin bebas gangguan sepenuhnya karena pemeliharaan, kegagalan pihak ketiga, atau keadaan kahar.",
  },
  {
    title: "6. Hubungi Kami",
    body: "Pertanyaan mengenai syarat ini dapat disampaikan melalui halaman bantuan atau email dukungan yang tercantum di aplikasi.",
  },
];

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Legal</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">
        Syarat &amp; Ketentuan
      </h1>
      <p className="mt-2 text-sm text-gray-500">
        Terakhir diperbarui: September 2026. Dengan mendaftar atau menggunakan layanan, Anda
        menyetujui ketentuan di bawah ini.
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
        <Link href="/privacy" className="text-emerald-700 underline font-semibold">
          Kebijakan Privasi
        </Link>
        <Link href="/signup" className="text-gray-600 underline">
          Kembali ke pendaftaran
        </Link>
      </div>
    </main>
  );
}
